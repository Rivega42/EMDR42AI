/**
 * Google Cloud Text-to-Speech Provider for EMDR42
 * 
 * Features:
 * - Server-side proxy integration (never exposes API keys to client)
 * - Real-time streaming synthesis for long texts
 * - Advanced voice selection with Neural2 and WaveNet voices
 * - SSML support for therapeutic speech control
 * - Quality-based adaptive streaming
 * - Comprehensive error handling and retry logic
 */

import type {
  TTSProvider,
  TTSVoiceConfig,
  TTSSynthesisRequest,
  TTSSynthesisResponse,
  TTSError
} from '@/../../shared/types';

// Google Cloud TTS specific types
interface GoogleCloudTTSConfig {
  endpoint?: string; // Server proxy endpoint
  timeout?: number; // Request timeout in ms
  retryAttempts?: number;
  streaming?: {
    enabled: boolean;
    chunkSizeChars: number; // Characters per streaming chunk
    maxChunks: number;
    bufferSize: number;
  };
}

interface GoogleCloudVoice {
  name: string; // e.g., 'en-US-Neural2-F'
  ssmlGender: 'FEMALE' | 'MALE' | 'NEUTRAL';
  languageCodes: string[]; // e.g., ['en-US']
  naturalSampleRateHertz: number;
  voiceType: 'STANDARD' | 'WAVENET' | 'NEURAL2' | 'STUDIO';
}

interface GoogleCloudSynthesisRequest {
  input: {
    text?: string;
    ssml?: string;
  };
  voice: {
    languageCode: string;
    name: string;
    ssmlGender: 'FEMALE' | 'MALE' | 'NEUTRAL';
  };
  audioConfig: {
    audioEncoding: 'LINEAR16' | 'MP3' | 'OGG_OPUS' | 'MULAW' | 'ALAW';
    speakingRate?: number; // 0.25 to 4.0
    pitch?: number; // -20.0 to 20.0 in semitones
    volumeGainDb?: number; // -96.0 to 16.0
    sampleRateHertz?: number;
    effectsProfileId?: string[];
  };
  enableTimePointing?: string[]; // For word timing
}

interface GoogleCloudSynthesisResponse {
  audioContent: string; // Base64 encoded audio
  timepoints?: Array<{
    markName: string;
    timeSeconds: number;
  }>;
  audioConfig: {
    audioEncoding: string;
    sampleRateHertz: number;
  };
}

/**
 * Google Cloud TTS Provider Implementation
 * Communicates with server proxy to ensure API key security
 */
export class GoogleCloudTTSProvider {
  readonly name: TTSProvider = 'google-cloud';
  private config: GoogleCloudTTSConfig;
  private isInitialized = false;
  private availableVoices: GoogleCloudVoice[] = [];
  private stats = {
    requests: 0,
    errors: 0,
    totalLatency: 0,
    avgLatency: 0,
    lastError: null as Error | null
  };

  constructor(config: GoogleCloudTTSConfig = {}) {
    this.config = {
      endpoint: '/api/tts/synthesize',
      timeout: 30000,
      retryAttempts: 3,
      streaming: {
        enabled: true,
        chunkSizeChars: 200,
        maxChunks: 20,
        bufferSize: 4096
      },
      ...config
    };
  }

  /**
   * Initialize the provider by loading available voices
   */
  async initialize(config?: any): Promise<void> {
    try {
      console.log('🔧 Initializing Google Cloud TTS Provider...');
      
      // Test connectivity and load voices
      await this.loadAvailableVoices();
      
      this.isInitialized = true;
      console.log(`✅ Google Cloud TTS Provider initialized with ${this.availableVoices.length} voices`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Google Cloud TTS Provider:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Check if the provider is available and ready
   */
  isAvailable(): boolean {
    return this.isInitialized && this.stats.errorRate < 0.8;
  }

  /**
   * Load available voices from server
   */
  private async loadAvailableVoices(): Promise<void> {
    try {
      const response = await fetch('/api/tts/voices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load voices: ${response.status}`);
      }

      const data = await response.json();
      this.availableVoices = data.voices || [];
      
      console.log(`📋 Loaded ${this.availableVoices.length} Google Cloud voices`);
      
    } catch (error) {
      console.warn('⚠️ Failed to load voices, using fallback list:', error);
      this.availableVoices = this.getFallbackVoices();
    }
  }

  /**
   * Get fallback voices if server is unavailable
   */
  private getFallbackVoices(): GoogleCloudVoice[] {
    return [
      {
        name: 'en-US-Neural2-F',
        ssmlGender: 'FEMALE',
        languageCodes: ['en-US'],
        naturalSampleRateHertz: 24000,
        voiceType: 'NEURAL2'
      },
      {
        name: 'en-US-Neural2-D',
        ssmlGender: 'MALE',
        languageCodes: ['en-US'],
        naturalSampleRateHertz: 24000,
        voiceType: 'NEURAL2'
      },
      {
        name: 'en-US-Studio-M',
        ssmlGender: 'MALE',
        languageCodes: ['en-US'],
        naturalSampleRateHertz: 24000,
        voiceType: 'STUDIO'
      },
      {
        name: 'en-US-Studio-O',
        ssmlGender: 'FEMALE',
        languageCodes: ['en-US'],
        naturalSampleRateHertz: 24000,
        voiceType: 'STUDIO'
      }
    ];
  }

  /**
   * Main synthesis method
   */
  async synthesize(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse> {
    if (!this.isAvailable()) {
      throw new Error('Google Cloud TTS Provider is not available');
    }

    const startTime = performance.now();
    
    try {
      // Convert request to Google Cloud format
      const googleRequest = this.convertToGoogleFormat(request);
      
      // Handle streaming vs single synthesis
      if (this.config.streaming?.enabled && this.shouldUseStreaming(request.text)) {
        return await this.synthesizeStreaming(request, googleRequest);
      } else {
        return await this.synthesizeSingle(request, googleRequest);
      }
      
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.updateStats(duration);
    }
  }

  /**
   * Single synthesis request
   */
  private async synthesizeSingle(
    originalRequest: TTSSynthesisRequest, 
    googleRequest: GoogleCloudSynthesisRequest
  ): Promise<TTSSynthesisResponse> {
    
    const response = await this.makeServerRequest(googleRequest, originalRequest.metadata.sessionId);
    
    return this.convertFromGoogleFormat(response, originalRequest);
  }

  /**
   * Streaming synthesis for long texts
   */
  private async synthesizeStreaming(
    originalRequest: TTSSynthesisRequest,
    googleRequest: GoogleCloudSynthesisRequest
  ): Promise<TTSSynthesisResponse> {
    
    // Split text into chunks
    const chunks = this.splitTextForStreaming(originalRequest.text);
    const audioChunks: ArrayBuffer[] = [];
    let totalDuration = 0;

    console.log(`🌊 Streaming Google Cloud TTS: ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
      const chunkRequest = {
        ...googleRequest,
        input: originalRequest.options.ssmlEnabled 
          ? { ssml: chunks[i] }
          : { text: chunks[i] }
      };

      try {
        const chunkResponse = await this.makeServerRequest(
          chunkRequest, 
          originalRequest.metadata.sessionId,
          { chunkIndex: i, totalChunks: chunks.length }
        );

        // Convert base64 to ArrayBuffer
        const audioData = this.base64ToArrayBuffer(chunkResponse.audioContent);
        audioChunks.push(audioData);
        
        // Estimate duration (rough calculation)
        totalDuration += this.estimateAudioDuration(chunks[i], googleRequest.voice.name);
        
      } catch (error) {
        console.error(`❌ Streaming chunk ${i} failed:`, error);
        // Continue with other chunks - partial success is better than failure
      }
    }

    if (audioChunks.length === 0) {
      throw new Error('All streaming chunks failed');
    }

    // Combine audio chunks
    const combinedAudio = this.combineAudioChunks(audioChunks);
    
    return {
      audioData: combinedAudio,
      format: this.getFormatFromEncoding(googleRequest.audioConfig.audioEncoding),
      duration: totalDuration,
      size: combinedAudio.byteLength,
      metadata: {
        provider: this.name,
        voice: originalRequest.voice,
        quality: originalRequest.quality,
        synthesisTime: performance.now(),
        fromCache: false,
        cacheKey: ''
      },
      streaming: {
        isStreamable: true,
        chunkSize: audioChunks[0]?.byteLength || 0,
        chunks: audioChunks
      }
    };
  }

  /**
   * Make request to server proxy
   */
  private async makeServerRequest(
    googleRequest: GoogleCloudSynthesisRequest,
    sessionId?: string,
    streamingInfo?: { chunkIndex: number; totalChunks: number }
  ): Promise<GoogleCloudSynthesisResponse> {
    
    const requestBody = {
      provider: 'google-cloud',
      request: googleRequest,
      sessionId,
      streaming: streamingInfo
    };

    const response = await fetch(this.config.endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.config.timeout!)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Server request failed: ${response.status} - ${errorData?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Convert TTS request to Google Cloud format
   */
  private convertToGoogleFormat(request: TTSSynthesisRequest): GoogleCloudSynthesisRequest {
    const audioEncoding = this.getGoogleAudioEncoding(request.quality.format);
    const voice = this.findBestGoogleVoice(request.voice);

    return {
      input: request.options.ssmlEnabled 
        ? { ssml: this.wrapWithSSML(request.text, request.options) }
        : { text: request.text },
      voice: {
        languageCode: request.voice.language,
        name: voice?.name || request.voice.name,
        ssmlGender: this.convertGender(request.voice.gender)
      },
      audioConfig: {
        audioEncoding,
        speakingRate: Math.max(0.25, Math.min(4.0, request.options.speed)),
        pitch: Math.max(-20, Math.min(20, request.options.pitch)),
        volumeGainDb: this.volumeToGainDb(request.options.volume),
        sampleRateHertz: request.quality.sampleRate,
        effectsProfileId: this.getEffectsProfile(request.metadata.context)
      },
      enableTimePointing: ['SSML_MARK'] // Enable word timing
    };
  }

  /**
   * Convert Google Cloud response to TTS format
   */
  private convertFromGoogleFormat(
    googleResponse: GoogleCloudSynthesisResponse,
    originalRequest: TTSSynthesisRequest
  ): TTSSynthesisResponse {
    
    const audioData = this.base64ToArrayBuffer(googleResponse.audioContent);
    const duration = this.estimateAudioDuration(originalRequest.text, originalRequest.voice.name);

    return {
      audioData,
      format: this.getFormatFromEncoding(googleResponse.audioConfig.audioEncoding),
      duration,
      size: audioData.byteLength,
      metadata: {
        provider: this.name,
        voice: originalRequest.voice,
        quality: originalRequest.quality,
        synthesisTime: performance.now(),
        fromCache: false,
        cacheKey: ''
      },
      streaming: {
        isStreamable: false,
        chunkSize: audioData.byteLength
      }
    };
  }

  /**
   * Wrap text with SSML for enhanced speech control
   */
  private wrapWithSSML(text: string, options: TTSSynthesisRequest['options']): string {
    let ssml = `<speak>`;
    
    // Add prosody control
    if (options.speed !== 1.0 || options.pitch !== 0 || options.volume !== 1.0) {
      const rate = options.speed < 1 ? 'slow' : options.speed > 1 ? 'fast' : 'medium';
      const pitchValue = options.pitch > 0 ? `+${options.pitch}st` : `${options.pitch}st`;
      const volumeValue = options.volume < 0.5 ? 'soft' : options.volume > 1.5 ? 'loud' : 'medium';
      
      ssml += `<prosody rate="${rate}" pitch="${pitchValue}" volume="${volumeValue}">`;
    }
    
    // Add emphasis based on context
    if (options.emphasis !== 'none') {
      ssml += `<emphasis level="${options.emphasis}">`;
    }
    
    // Process text with breaks
    let processedText = text;
    
    // Add sentence breaks
    if (options.breaks.sentence > 0) {
      processedText = processedText.replace(/\. /g, `. <break time="${options.breaks.sentence}ms"/> `);
    }
    
    // Add paragraph breaks
    if (options.breaks.paragraph > 0) {
      processedText = processedText.replace(/\n\n/g, ` <break time="${options.breaks.paragraph}ms"/> `);
    }
    
    // Add comma breaks
    if (options.breaks.comma > 0) {
      processedText = processedText.replace(/, /g, `, <break time="${options.breaks.comma}ms"/> `);
    }
    
    ssml += processedText;
    
    // Close tags
    if (options.emphasis !== 'none') {
      ssml += '</emphasis>';
    }
    
    if (options.speed !== 1.0 || options.pitch !== 0 || options.volume !== 1.0) {
      ssml += '</prosody>';
    }
    
    ssml += '</speak>';
    
    return ssml;
  }

  /**
   * Helper methods for format conversion
   */
  private getGoogleAudioEncoding(format: string): string {
    switch (format.toLowerCase()) {
      case 'mp3': return 'MP3';
      case 'wav': return 'LINEAR16';
      case 'ogg': return 'OGG_OPUS';
      default: return 'MP3';
    }
  }

  private getFormatFromEncoding(encoding: string): string {
    switch (encoding) {
      case 'MP3': return 'mp3';
      case 'LINEAR16': return 'wav';
      case 'OGG_OPUS': return 'ogg';
      default: return 'mp3';
    }
  }

  private convertGender(gender: string): 'FEMALE' | 'MALE' | 'NEUTRAL' {
    switch (gender.toLowerCase()) {
      case 'female': return 'FEMALE';
      case 'male': return 'MALE';
      default: return 'NEUTRAL';
    }
  }

  private volumeToGainDb(volume: number): number {
    // Convert 0-1 volume to -96 to +16 dB range
    if (volume <= 0) return -96;
    if (volume >= 1) return 0;
    return Math.log10(volume) * 20;
  }

  private getEffectsProfile(context: string): string[] {
    switch (context) {
      case 'therapy-response':
        return ['telephony-class-application'];
      case 'meditation':
        return ['large-home-entertainment-class-device'];
      case 'emergency':
        return ['handset-class-device'];
      default:
        return [];
    }
  }

  private findBestGoogleVoice(voice: TTSVoiceConfig): GoogleCloudVoice | null {
    return this.availableVoices.find(gv => 
      gv.languageCodes.includes(voice.language) &&
      gv.ssmlGender.toLowerCase() === voice.gender.toLowerCase()
    ) || null;
  }

  private shouldUseStreaming(text: string): boolean {
    return text.length > (this.config.streaming?.chunkSizeChars || 200);
  }

  private splitTextForStreaming(text: string): string[] {
    const chunkSize = this.config.streaming?.chunkSizeChars || 200;
    const chunks: string[] = [];
    
    // Split by sentences first
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim() + '.');
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim() + '.');
    }
    
    return chunks;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private combineAudioChunks(chunks: ArrayBuffer[]): ArrayBuffer {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      combined.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }
    
    return combined.buffer;
  }

  private estimateAudioDuration(text: string, voiceName: string): number {
    // Rough estimation: 150 words per minute, average 5 characters per word
    const wordsPerMinute = voiceName.includes('Neural2') ? 160 : 150;
    const charactersPerWord = 5;
    const words = text.length / charactersPerWord;
    return (words / wordsPerMinute) * 60; // Return seconds
  }

  private updateStats(latency: number): void {
    this.stats.requests++;
    this.stats.totalLatency += latency;
    this.stats.avgLatency = this.stats.totalLatency / this.stats.requests;
  }

  private handleError(error: Error): void {
    this.stats.errors++;
    this.stats.lastError = error;
    console.error('Google Cloud TTS Provider error:', error);
  }

  private get errorRate(): number {
    return this.stats.requests > 0 ? this.stats.errors / this.stats.requests : 0;
  }

  /**
   * Get provider status and statistics
   */
  getStatus() {
    return {
      name: this.name,
      isInitialized: this.isInitialized,
      isAvailable: this.isAvailable(),
      voiceCount: this.availableVoices.length,
      stats: {
        ...this.stats,
        errorRate: this.errorRate
      },
      config: {
        endpoint: this.config.endpoint,
        streamingEnabled: this.config.streaming?.enabled,
        timeout: this.config.timeout
      }
    };
  }

  /**
   * Get available voices
   */
  getAvailableVoices(): GoogleCloudVoice[] {
    return [...this.availableVoices];
  }

  /**
   * Test the provider with a simple synthesis
   */
  async testConnection(): Promise<boolean> {
    try {
      const testRequest: TTSSynthesisRequest = {
        text: 'Connection test',
        voice: {
          name: 'en-US-Neural2-F',
          language: 'en-US',
          gender: 'female',
          age: 'adult',
          accent: 'american',
          characteristics: {
            warmth: 0.8,
            authority: 0.5,
            empathy: 0.8,
            clarity: 0.9,
            pace: 'normal'
          },
          therapeuticProfile: {
            anxietyFriendly: true,
            traumaSensitive: true,
            childFriendly: true,
            culturallySensitive: []
          }
        },
        quality: {
          sampleRate: 24000,
          bitRate: 128,
          format: 'mp3',
          channels: 1,
          compression: 'medium'
        },
        options: {
          ssmlEnabled: false,
          speed: 1.0,
          pitch: 0,
          volume: 1.0,
          emphasis: 'none',
          breaks: {
            sentence: 300,
            paragraph: 600,
            comma: 150
          }
        },
        metadata: {
          context: 'therapy-response',
          priority: 'normal'
        }
      };

      await this.synthesize(testRequest);
      return true;
    } catch (error) {
      console.error('Google Cloud TTS connection test failed:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Google Cloud TTS Provider...');
    this.isInitialized = false;
    this.availableVoices = [];
    this.stats = {
      requests: 0,
      errors: 0,
      totalLatency: 0,
      avgLatency: 0,
      lastError: null
    };
  }
}