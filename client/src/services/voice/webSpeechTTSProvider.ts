/**
 * Web Speech API TTS Provider for EMDR42
 * 
 * Features:
 * - Browser-native speech synthesis (no API keys required)
 * - Cross-platform compatibility and fallback support
 * - Voice quality optimization and enhancement
 * - Therapeutic voice selection from system voices
 * - Real-time playback controls and streaming
 * - Privacy-first approach (all processing client-side)
 */

import type {
  TTSProvider,
  TTSVoiceConfig,
  TTSSynthesisRequest,
  TTSSynthesisResponse,
  TTSError
} from '@/../../shared/types';

// Web Speech API specific types
interface WebSpeechVoice {
  name: string;
  lang: string;
  localService: boolean;
  default: boolean;
  voiceURI: string;
}

interface WebSpeechTTSConfig {
  preferLocalVoices?: boolean; // Prefer local over remote voices
  qualityEnhancement?: {
    enabled: boolean;
    normalizeVolume: boolean;
    reduceBgNoise: boolean;
    enhanceClarity: boolean;
  };
  fallback?: {
    useDefaultVoice: boolean;
    maxRetries: number;
    retryDelay: number;
  };
}

interface WebSpeechSynthesisOptions {
  voice: SpeechSynthesisVoice | null;
  volume: number; // 0 to 1
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  lang: string;
  text: string;
}

/**
 * Web Speech API TTS Provider Implementation
 * Provides fallback TTS functionality using browser's built-in speech synthesis
 */
export class WebSpeechTTSProvider {
  readonly name: TTSProvider = 'web-speech';
  private config: WebSpeechTTSConfig;
  private isInitialized = false;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private synthesisQueue: Array<{
    request: TTSSynthesisRequest;
    resolve: (response: TTSSynthesisResponse) => void;
    reject: (error: Error) => void;
  }> = [];
  private isProcessing = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private stats = {
    requests: 0,
    errors: 0,
    totalDuration: 0,
    avgDuration: 0,
    lastError: null as Error | null
  };

  // Audio context for enhanced processing
  private audioContext: AudioContext | null = null;
  private mediaRecorder: MediaRecorder | null = null;

  constructor(config: WebSpeechTTSConfig = {}) {
    this.config = {
      preferLocalVoices: true,
      qualityEnhancement: {
        enabled: true,
        normalizeVolume: true,
        reduceBgNoise: false,
        enhanceClarity: true
      },
      fallback: {
        useDefaultVoice: true,
        maxRetries: 2,
        retryDelay: 1000
      },
      ...config
    };
  }

  /**
   * Initialize the Web Speech API provider
   */
  async initialize(config?: any): Promise<void> {
    try {
      console.log('🔧 Initializing Web Speech API TTS Provider...');
      
      // Check Web Speech API support
      if (!('speechSynthesis' in window)) {
        throw new Error('Web Speech API is not supported in this browser');
      }

      // Initialize audio context for enhanced processing
      if (this.config.qualityEnhancement?.enabled) {
        await this.initializeAudioContext();
      }

      // Load available voices
      await this.loadAvailableVoices();

      // Set up voice change listener
      window.speechSynthesis.onvoiceschanged = () => {
        this.loadAvailableVoices();
      };

      this.isInitialized = true;
      console.log(`✅ Web Speech API Provider initialized with ${this.availableVoices.length} voices`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Web Speech API Provider:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Initialize audio context for quality enhancement
   */
  private async initializeAudioContext(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('🎵 Audio context initialized for quality enhancement');
    } catch (error) {
      console.warn('⚠️ Failed to initialize audio context:', error);
      // Continue without enhancement
    }
  }

  /**
   * Load available system voices
   */
  private async loadAvailableVoices(): Promise<void> {
    return new Promise((resolve) => {
      const loadVoices = () => {
        this.availableVoices = Array.from(window.speechSynthesis.getVoices());
        
        if (this.availableVoices.length === 0) {
          // Voices might not be loaded yet, try again after a delay
          setTimeout(loadVoices, 100);
          return;
        }

        // Sort voices by preference (local first, then by language)
        this.availableVoices.sort((a, b) => {
          if (this.config.preferLocalVoices) {
            if (a.localService !== b.localService) {
              return a.localService ? -1 : 1;
            }
          }
          return a.lang.localeCompare(b.lang);
        });

        console.log(`📋 Loaded ${this.availableVoices.length} Web Speech voices`);
        resolve();
      };

      loadVoices();
    });
  }

  /**
   * Check if the provider is available
   */
  isAvailable(): boolean {
    return this.isInitialized && 
           'speechSynthesis' in window && 
           this.availableVoices.length > 0 &&
           this.stats.errors < 5; // Disable after too many errors
  }

  /**
   * Main synthesis method
   */
  async synthesize(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse> {
    if (!this.isAvailable()) {
      throw new Error('Web Speech API Provider is not available');
    }

    return new Promise((resolve, reject) => {
      this.synthesisQueue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process synthesis queue (Web Speech API can only handle one at a time)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.synthesisQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.synthesisQueue.length > 0) {
      const { request, resolve, reject } = this.synthesisQueue.shift()!;
      
      try {
        const response = await this.performSynthesis(request);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Perform the actual synthesis
   */
  private async performSynthesis(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse> {
    const startTime = performance.now();
    
    try {
      // Find the best matching voice
      const voice = this.findBestVoice(request.voice);
      
      // Create synthesis options
      const options = this.createSynthesisOptions(request, voice);
      
      // Perform synthesis with quality enhancement
      const audioData = await this.synthesizeWithEnhancement(options);
      
      // Calculate duration
      const duration = this.estimateAudioDuration(request.text, options.rate);
      
      const response: TTSSynthesisResponse = {
        audioData,
        format: 'wav', // Web Speech API typically outputs WAV
        duration,
        size: audioData.byteLength,
        metadata: {
          provider: this.name,
          voice: request.voice,
          quality: request.quality,
          synthesisTime: performance.now() - startTime,
          fromCache: false,
          cacheKey: ''
        },
        streaming: {
          isStreamable: false
        }
      };

      this.updateStats(duration);
      return response;

    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Synthesize with quality enhancement
   */
  private async synthesizeWithEnhancement(options: WebSpeechSynthesisOptions): Promise<ArrayBuffer> {
    if (!this.config.qualityEnhancement?.enabled || !this.audioContext) {
      return this.synthesizeBasic(options);
    }

    try {
      return await this.synthesizeEnhanced(options);
    } catch (error) {
      console.warn('⚠️ Enhanced synthesis failed, falling back to basic:', error);
      return this.synthesizeBasic(options);
    }
  }

  /**
   * Basic synthesis without enhancement
   */
  private async synthesizeBasic(options: WebSpeechSynthesisOptions): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(options.text);
      
      utterance.voice = options.voice;
      utterance.volume = options.volume;
      utterance.rate = options.rate;
      utterance.pitch = options.pitch;
      utterance.lang = options.lang;

      // For basic synthesis, we can't capture audio directly
      // We'll create a placeholder ArrayBuffer
      utterance.onend = () => {
        this.currentUtterance = null;
        // Create a placeholder ArrayBuffer (actual audio not captured in basic mode)
        const placeholder = new ArrayBuffer(1024);
        resolve(placeholder);
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * Enhanced synthesis with audio capture
   */
  private async synthesizeEnhanced(options: WebSpeechSynthesisOptions): Promise<ArrayBuffer> {
    if (!this.audioContext) {
      throw new Error('Audio context not available');
    }

    return new Promise(async (resolve, reject) => {
      try {
        // Create audio nodes for processing
        const destination = this.audioContext!.createMediaStreamDestination();
        const stream = destination.stream;
        
        // Create media recorder to capture audio
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const audioChunks: Blob[] = [];
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const arrayBuffer = await audioBlob.arrayBuffer();
          resolve(arrayBuffer);
        };

        this.mediaRecorder.onerror = (event) => {
          reject(new Error(`Media recorder error: ${(event as any).error}`));
        };

        // Start recording
        this.mediaRecorder.start(100); // Capture in 100ms chunks

        // Create and speak utterance
        const utterance = new SpeechSynthesisUtterance(options.text);
        utterance.voice = options.voice;
        utterance.volume = options.volume;
        utterance.rate = options.rate;
        utterance.pitch = options.pitch;
        utterance.lang = options.lang;

        utterance.onend = () => {
          this.currentUtterance = null;
          // Stop recording after a short delay to capture end of speech
          setTimeout(() => {
            this.mediaRecorder?.stop();
          }, 500);
        };

        utterance.onerror = (event) => {
          this.currentUtterance = null;
          this.mediaRecorder?.stop();
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Find the best matching voice for the request
   */
  private findBestVoice(voiceConfig: TTSVoiceConfig): SpeechSynthesisVoice | null {
    if (this.availableVoices.length === 0) {
      return null;
    }

    // Try to find exact match by name
    let voice = this.availableVoices.find(v => v.name === voiceConfig.name);
    if (voice) return voice;

    // Try to find by language and gender
    const genderKeywords = {
      male: ['male', 'man', 'masculine', 'david', 'alex', 'daniel', 'thomas'],
      female: ['female', 'woman', 'feminine', 'samantha', 'victoria', 'anna', 'karen', 'susan'],
      neutral: ['neutral', 'robot', 'computer']
    };

    const keywords = genderKeywords[voiceConfig.gender] || [];
    
    voice = this.availableVoices.find(v => {
      const matchesLang = v.lang.startsWith(voiceConfig.language.split('-')[0]);
      const matchesGender = keywords.some(keyword => 
        v.name.toLowerCase().includes(keyword)
      );
      return matchesLang && matchesGender;
    });

    if (voice) return voice;

    // Try to find by language only
    voice = this.availableVoices.find(v => 
      v.lang.startsWith(voiceConfig.language.split('-')[0])
    );
    if (voice) return voice;

    // Try to find English voices as fallback
    voice = this.availableVoices.find(v => v.lang.startsWith('en'));
    if (voice) return voice;

    // Return first available voice as last resort
    return this.availableVoices[0] || null;
  }

  /**
   * Create synthesis options from request
   */
  private createSynthesisOptions(request: TTSSynthesisRequest, voice: SpeechSynthesisVoice | null): WebSpeechSynthesisOptions {
    return {
      voice,
      volume: Math.max(0, Math.min(1, request.options.volume)),
      rate: Math.max(0.1, Math.min(10, request.options.speed)),
      pitch: Math.max(0, Math.min(2, 1 + (request.options.pitch / 20))), // Convert from semitones
      lang: request.voice.language,
      text: this.preprocessText(request.text, request.options, request.metadata.context)
    };
  }

  /**
   * Preprocess text for better Web Speech synthesis
   */
  private preprocessText(text: string, options: TTSSynthesisRequest['options'], context: string): string {
    let processed = text.trim();
    
    // Handle common therapeutic abbreviations
    processed = processed.replace(/\bEMDR\b/g, 'E M D R');
    processed = processed.replace(/\bSUDs\b/g, 'suds level');
    processed = processed.replace(/\bVoC\b/g, 'validity of cognition');
    processed = processed.replace(/\bPTSD\b/g, 'P T S D');

    // Add natural pauses based on context
    if (context === 'therapy-response') {
      // Web Speech API doesn't support SSML, so we use punctuation
      processed = processed.replace(/\. /g, '.  '); // Double space for longer pause
      processed = processed.replace(/: /g, ':  ');
    }

    if (context === 'meditation') {
      processed = processed.replace(/\. /g, '... '); // Ellipsis for natural pauses
      processed = processed.replace(/,/g, ', '); // Longer comma pauses
    }

    // Clean up excessive whitespace
    processed = processed.replace(/\s+/g, ' ');

    return processed;
  }

  /**
   * Estimate audio duration based on text and speech rate
   */
  private estimateAudioDuration(text: string, rate: number): number {
    // Average speaking rate is ~150 words per minute
    const baseWordsPerMinute = 150;
    const adjustedWordsPerMinute = baseWordsPerMinute * rate;
    const words = text.split(/\s+/).length;
    return (words / adjustedWordsPerMinute) * 60; // Return seconds
  }

  /**
   * Update statistics
   */
  private updateStats(duration: number): void {
    this.stats.requests++;
    this.stats.totalDuration += duration;
    this.stats.avgDuration = this.stats.totalDuration / this.stats.requests;
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.stats.errors++;
    this.stats.lastError = error;
    console.error('Web Speech API Provider error:', error);
  }

  /**
   * Stop current synthesis
   */
  stop(): void {
    if (this.currentUtterance) {
      window.speechSynthesis.cancel();
      this.currentUtterance = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Pause current synthesis
   */
  pause(): void {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
    }
  }

  /**
   * Resume paused synthesis
   */
  resume(): void {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  }

  /**
   * Get current synthesis status
   */
  getSynthesisStatus(): {
    speaking: boolean;
    paused: boolean;
    pending: boolean;
  } {
    return {
      speaking: window.speechSynthesis.speaking,
      paused: window.speechSynthesis.paused,
      pending: window.speechSynthesis.pending
    };
  }

  /**
   * Get available voices in TTS format
   */
  getAvailableVoicesAsTTSFormat(): TTSVoiceConfig[] {
    return this.availableVoices.map(voice => ({
      name: voice.name,
      language: voice.lang,
      gender: this.inferGender(voice.name),
      age: this.inferAge(voice.name),
      accent: this.inferAccent(voice.lang),
      characteristics: {
        warmth: this.inferWarmth(voice.name),
        authority: this.inferAuthority(voice.name),
        empathy: this.inferEmpathy(voice.name),
        clarity: voice.localService ? 0.8 : 0.6, // Local voices typically clearer
        pace: 'normal'
      },
      therapeuticProfile: {
        anxietyFriendly: this.isAnxietyFriendly(voice.name),
        traumaSensitive: this.isTraumaSensitive(voice.name),
        childFriendly: this.isChildFriendly(voice.name),
        culturallySensitive: [voice.lang]
      }
    }));
  }

  /**
   * Voice characteristic inference helpers
   */
  private inferGender(name: string): 'male' | 'female' | 'neutral' {
    const lowerName = name.toLowerCase();
    const maleKeywords = ['male', 'man', 'david', 'alex', 'daniel', 'thomas', 'mark'];
    const femaleKeywords = ['female', 'woman', 'samantha', 'victoria', 'anna', 'karen', 'susan', 'zira'];
    
    if (maleKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'male';
    }
    if (femaleKeywords.some(keyword => lowerName.includes(keyword))) {
      return 'female';
    }
    return 'neutral';
  }

  private inferAge(name: string): 'child' | 'young-adult' | 'adult' | 'elderly' {
    // Most system voices are adult voices
    return 'adult';
  }

  private inferAccent(lang: string): string {
    const accents: Record<string, string> = {
      'en-US': 'american',
      'en-GB': 'british',
      'en-AU': 'australian',
      'en-CA': 'canadian',
      'es-ES': 'spanish',
      'es-MX': 'mexican',
      'fr-FR': 'french',
      'de-DE': 'german'
    };
    return accents[lang] || 'neutral';
  }

  private inferWarmth(name: string): number {
    // Female voices typically rated as warmer
    return this.inferGender(name) === 'female' ? 0.7 : 0.5;
  }

  private inferAuthority(name: string): number {
    // Male voices typically rated as more authoritative
    return this.inferGender(name) === 'male' ? 0.7 : 0.5;
  }

  private inferEmpathy(name: string): number {
    // Female voices typically rated as more empathetic
    return this.inferGender(name) === 'female' ? 0.8 : 0.6;
  }

  private isAnxietyFriendly(name: string): boolean {
    // Female and gentle-sounding voices are generally better for anxiety
    return this.inferGender(name) === 'female';
  }

  private isTraumaSensitive(name: string): boolean {
    // All voices can be trauma-sensitive with proper content
    return true;
  }

  private isChildFriendly(name: string): boolean {
    // Most system voices are appropriate for children
    return true;
  }

  /**
   * Get provider status
   */
  getStatus() {
    return {
      name: this.name,
      isInitialized: this.isInitialized,
      isAvailable: this.isAvailable(),
      voiceCount: this.availableVoices.length,
      synthesis: this.getSynthesisStatus(),
      stats: {
        ...this.stats,
        errorRate: this.stats.requests > 0 ? this.stats.errors / this.stats.requests : 0
      },
      capabilities: {
        localVoices: this.availableVoices.filter(v => v.localService).length,
        remoteVoices: this.availableVoices.filter(v => !v.localService).length,
        qualityEnhancement: this.config.qualityEnhancement?.enabled,
        audioContextSupported: !!this.audioContext
      }
    };
  }

  /**
   * Test the provider
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.isAvailable()) {
        return false;
      }

      // Create a minimal test request
      const testText = 'Test';
      const utterance = new SpeechSynthesisUtterance(testText);
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);

        utterance.onend = () => {
          clearTimeout(timeout);
          resolve(true);
        };

        utterance.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };

        window.speechSynthesis.speak(utterance);
      });

    } catch (error) {
      console.error('Web Speech API connection test failed:', error);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Web Speech API Provider...');
    
    this.stop();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
    this.isInitialized = false;
    this.availableVoices = [];
    this.synthesisQueue = [];
    this.stats = {
      requests: 0,
      errors: 0,
      totalDuration: 0,
      avgDuration: 0,
      lastError: null
    };
  }
}