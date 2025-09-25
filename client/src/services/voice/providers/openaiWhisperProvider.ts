/**
 * OpenAI Whisper Provider for SpeechToTextService
 * Server-side processing via OpenAI Whisper API
 * Supports batch processing with high accuracy
 */

import type {
  STTProviderConfig,
  STTTranscriptionResult,
  STTLanguage,
  STTError
} from '@/../../shared/types';

import { STTProviderInterface } from '../speechToTextService';
import { generateDeterministicId } from '@/lib/deterministicUtils';

export class OpenAIWhisperProvider implements STTProviderInterface {
  private isInitialized: boolean = false;
  private isTranscribing: boolean = false;
  private config: STTProviderConfig | null = null;
  
  // Status tracking
  private latency: number = 0;
  private errorCount: number = 0;
  private successCount: number = 0;
  private lastRequestTime: number = 0;
  
  // Audio processing
  private audioQueue: Blob[] = [];
  private isProcessingQueue: boolean = false;

  constructor() {
    console.log('🎤 OpenAI Whisper Provider created');
  }

  async initialize(config: STTProviderConfig): Promise<void> {
    try {
      this.config = config;
      
      // Test connection to backend
      const response = await fetch('/api/stt/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'openai-whisper' })
      });

      if (!response.ok) {
        throw new Error(`Backend connection test failed: ${response.status}`);
      }

      this.isInitialized = true;
      console.log('✅ OpenAI Whisper Provider initialized');

    } catch (error) {
      console.error('❌ Failed to initialize OpenAI Whisper Provider:', error);
      throw error;
    }
  }

  async startTranscription(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Provider not initialized');
    }

    this.isTranscribing = true;
    console.log('🔊 OpenAI Whisper transcription started');
  }

  async processAudioChunk(audioData: Float32Array | Blob): Promise<STTTranscriptionResult | null> {
    if (!this.isTranscribing || !this.config) {
      return null;
    }

    try {
      const startTime = Date.now();
      let audioBlob: Blob;

      // Convert Float32Array to Blob if needed
      if (audioData instanceof Float32Array) {
        audioBlob = this.float32ArrayToBlob(audioData);
      } else {
        audioBlob = audioData;
      }

      // Add to queue for batch processing
      this.audioQueue.push(audioBlob);

      // Process queue if not already processing
      if (!this.isProcessingQueue) {
        await this.processQueue();
      }

      return null; // Batch processing returns results via queue

    } catch (error) {
      console.error('❌ OpenAI Whisper processing error:', error);
      this.errorCount++;
      throw error;
    }
  }

  private async processQueue(): Promise<STTTranscriptionResult | null> {
    if (this.isProcessingQueue || this.audioQueue.length === 0) {
      return null;
    }

    this.isProcessingQueue = true;

    try {
      // Combine all audio chunks in queue
      const audioBlob = await this.combineAudioChunks(this.audioQueue);
      this.audioQueue = []; // Clear queue

      const result = await this.transcribeAudio(audioBlob);
      this.isProcessingQueue = false;
      return result;

    } catch (error) {
      this.isProcessingQueue = false;
      throw error;
    }
  }

  private async combineAudioChunks(chunks: Blob[]): Promise<Blob> {
    if (chunks.length === 1) {
      return chunks[0];
    }

    // Combine multiple audio blobs
    const combinedBuffer = await Promise.all(chunks.map(chunk => chunk.arrayBuffer()));
    const totalLength = combinedBuffer.reduce((sum, buffer) => sum + buffer.byteLength, 0);
    
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const buffer of combinedBuffer) {
      combined.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    }

    return new Blob([combined], { type: 'audio/wav' });
  }

  private async transcribeAudio(audioBlob: Blob): Promise<STTTranscriptionResult> {
    const startTime = Date.now();

    try {
      // Prepare form data for OpenAI API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.wav');
      
      // Add Whisper-specific parameters
      const whisperSettings = this.config?.settings.whisper;
      if (whisperSettings) {
        formData.append('model', whisperSettings.model || 'whisper-1');
        formData.append('response_format', whisperSettings.responseFormat || 'verbose_json');
        
        if (whisperSettings.language && whisperSettings.language !== 'auto') {
          formData.append('language', whisperSettings.language);
        }
        
        if (whisperSettings.prompt) {
          formData.append('prompt', whisperSettings.prompt);
        }
        
        if (whisperSettings.temperature !== undefined) {
          formData.append('temperature', whisperSettings.temperature.toString());
        }
      }

      // Send to backend endpoint
      const response = await fetch('/api/stt/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const endTime = Date.now();
      const latency = endTime - startTime;
      this.latency = latency;
      this.lastRequestTime = endTime;
      this.successCount++;

      // Parse OpenAI Whisper response
      const transcriptionResult: STTTranscriptionResult = {
        id: generateDeterministicId('whisper_result', Date.now().toString(), 'transcription'),
        timestamp: endTime,
        text: data.text || '',
        language: this.mapLanguageCode(data.language || 'en'),
        confidence: this.calculateConfidence(data),
        isFinal: true,
        
        // Word-level timing if available
        words: data.words ? data.words.map((word: any) => ({
          word: word.word,
          startTime: word.start || 0,
          endTime: word.end || 0,
          confidence: word.confidence || 0.9
        })) : undefined,

        // Segment-level data
        segments: data.segments ? data.segments.map((segment: any) => ({
          text: segment.text,
          startTime: segment.start || 0,
          endTime: segment.end || 0,
          confidence: segment.confidence || 0.9,
          type: 'sentence' as const,
          punctuation: true
        })) : undefined,

        provider: 'openai-whisper',
        providerData: data,

        audioQuality: {
          snr: this.estimateSignalToNoise(audioBlob),
          clarity: this.estimateAudioClarity(data),
          duration: data.duration || 0
        },

        processing: {
          latency,
          processingTime: latency,
          queueTime: 0
        }
      };

      console.log(`✅ OpenAI Whisper transcription: "${transcriptionResult.text}" (${transcriptionResult.language})`);
      return transcriptionResult;

    } catch (error) {
      this.errorCount++;
      console.error('❌ OpenAI Whisper transcription error:', error);
      throw error;
    }
  }

  private float32ArrayToBlob(audioData: Float32Array, sampleRate: number = 16000): Blob {
    // Convert Float32Array to WAV format
    const buffer = new ArrayBuffer(44 + audioData.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + audioData.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, audioData.length * 2, true);
    
    // Convert float samples to 16-bit PCM
    const pcm = new Int16Array(buffer, 44);
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      pcm[i] = sample * 0x7FFF;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  private mapLanguageCode(whisperLang: string): STTLanguage {
    const languageMap: Record<string, STTLanguage> = {
      'en': 'en',
      'ru': 'ru',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'zh': 'zh',
      'ja': 'ja',
      'ko': 'ko'
    };
    
    return languageMap[whisperLang] || 'en';
  }

  private calculateConfidence(data: any): number {
    // OpenAI Whisper doesn't provide direct confidence scores
    // Estimate based on response characteristics
    if (data.confidence !== undefined) {
      return data.confidence;
    }
    
    // Estimate based on response completeness
    let confidence = 0.8; // Base confidence for Whisper
    
    if (data.segments && data.segments.length > 0) {
      confidence += 0.1;
    }
    
    if (data.words && data.words.length > 0) {
      confidence += 0.1;
    }
    
    return Math.min(confidence, 1.0);
  }

  private estimateSignalToNoise(audioBlob: Blob): number {
    // Placeholder - would need actual audio analysis
    return 15; // dB
  }

  private estimateAudioClarity(data: any): number {
    // Estimate clarity based on transcription quality
    if (!data.text || data.text.trim().length === 0) {
      return 0.1;
    }
    
    // Basic heuristics
    const hasWords = data.words && data.words.length > 0;
    const hasSegments = data.segments && data.segments.length > 0;
    
    let clarity = 0.7; // Base clarity
    if (hasWords) clarity += 0.15;
    if (hasSegments) clarity += 0.15;
    
    return Math.min(clarity, 1.0);
  }

  async stopTranscription(): Promise<void> {
    this.isTranscribing = false;
    
    // Process any remaining audio in queue
    if (this.audioQueue.length > 0) {
      await this.processQueue();
    }
    
    console.log('🛑 OpenAI Whisper transcription stopped');
  }

  async destroy(): Promise<void> {
    await this.stopTranscription();
    this.isInitialized = false;
    this.audioQueue = [];
    console.log('🗑️ OpenAI Whisper Provider destroyed');
  }

  getStatus(): { isAvailable: boolean; latency: number; errorRate: number } {
    const totalRequests = this.successCount + this.errorCount;
    const errorRate = totalRequests > 0 ? this.errorCount / totalRequests : 0;

    return {
      isAvailable: this.isInitialized,
      latency: this.latency,
      errorRate
    };
  }
}