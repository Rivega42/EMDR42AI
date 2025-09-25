/**
 * AssemblyAI STT Provider for SpeechToTextService
 * Real-time and batch speech recognition via AssemblyAI API
 * Supports streaming transcription with high accuracy
 */

import type {
  STTProviderConfig,
  STTTranscriptionResult,
  STTLanguage,
  STTError
} from '@/../../shared/types';

import { STTProviderInterface } from '../speechToTextService';
import { generateDeterministicId } from '@/lib/deterministicUtils';

export class AssemblyAISTTProvider implements STTProviderInterface {
  private isInitialized: boolean = false;
  private isTranscribing: boolean = false;
  private config: STTProviderConfig | null = null;
  
  // WebSocket for real-time streaming
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  
  // Status tracking
  private latency: number = 0;
  private errorCount: number = 0;
  private successCount: number = 0;
  private lastRequestTime: number = 0;
  
  // Audio processing
  private audioBuffer: Float32Array[] = [];
  private isStreaming: boolean = false;
  
  // Event callbacks
  private onTranscriptionCallback: ((result: STTTranscriptionResult) => void) | null = null;
  private onInterimCallback: ((text: string, confidence: number) => void) | null = null;

  constructor() {
    console.log('🎤 AssemblyAI STT Provider created');
  }

  async initialize(config: STTProviderConfig): Promise<void> {
    try {
      this.config = config;
      this.sessionId = generateDeterministicId('assemblyai_session', Date.now().toString(), 'session');
      
      // Test connection to backend
      const response = await fetch('/api/stt/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'assemblyai' })
      });

      if (!response.ok) {
        throw new Error(`Backend connection test failed: ${response.status}`);
      }

      this.isInitialized = true;
      console.log('✅ AssemblyAI STT Provider initialized');

    } catch (error) {
      console.error('❌ Failed to initialize AssemblyAI STT Provider:', error);
      throw error;
    }
  }

  async startTranscription(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Provider not initialized');
    }

    try {
      // Initialize streaming session
      await this.initializeStreamingSession();
      
      this.isTranscribing = true;
      console.log('🔊 AssemblyAI STT transcription started');

    } catch (error) {
      console.error('❌ Failed to start AssemblyAI transcription:', error);
      throw error;
    }
  }

  private async initializeStreamingSession(): Promise<void> {
    try {
      // Start streaming session on backend
      const response = await fetch('/api/stt/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'assemblyai',
          sessionId: this.sessionId,
          action: 'start',
          config: this.config?.settings.assemblyai
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to start AssemblyAI stream: ${response.status}`);
      }

      // Set up WebSocket connection for real-time results
      await this.setupWebSocket();

    } catch (error) {
      console.error('❌ Failed to initialize AssemblyAI streaming session:', error);
      throw error;
    }
  }

  private async setupWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        
        // Handle Replit environment
        const wsUrl = `${protocol}//${host}${port}/stt-stream?sessionId=${this.sessionId}&provider=assemblyai`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('🔗 AssemblyAI WebSocket connected');
          this.isStreaming = true;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleStreamingResult(data);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ AssemblyAI WebSocket error:', error);
          this.errorCount++;
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 AssemblyAI WebSocket disconnected');
          this.isStreaming = false;
          this.ws = null;
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleStreamingResult(data: any): void {
    const timestamp = Date.now();

    if (data.type === 'interim') {
      // Handle interim results
      if (this.onInterimCallback) {
        this.onInterimCallback(data.text || '', data.confidence || 0.5);
      }
      return;
    }

    if (data.type === 'final') {
      // Handle final transcription result
      const result: STTTranscriptionResult = {
        id: generateDeterministicId('assemblyai_result', timestamp.toString(), 'transcription'),
        timestamp,
        text: data.text || '',
        language: this.mapLanguageCode(data.language || 'en'),
        confidence: data.confidence || 0.8,
        isFinal: true,

        // Word-level timing from AssemblyAI
        words: data.words ? data.words.map((word: any) => ({
          word: word.text,
          startTime: word.start / 1000, // Convert ms to seconds
          endTime: word.end / 1000,
          confidence: word.confidence || 0.8
        })) : undefined,

        provider: 'assemblyai',
        providerData: data,

        audioQuality: {
          snr: data.audio_quality?.snr || 12,
          clarity: data.audio_quality?.clarity || 0.8,
          duration: data.audio_duration || 0
        },

        processing: {
          latency: timestamp - (data.timestamp || timestamp),
          processingTime: data.processing_time || 0,
          queueTime: 0
        }
      };

      this.successCount++;
      this.lastRequestTime = timestamp;

      if (this.onTranscriptionCallback) {
        this.onTranscriptionCallback(result);
      }

      console.log(`✅ AssemblyAI transcription: "${result.text}" (${result.language})`);
    }
  }

  async processAudioChunk(audioData: Float32Array | Blob): Promise<STTTranscriptionResult | null> {
    if (!this.isTranscribing || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return null;
    }

    try {
      let audioBuffer: ArrayBuffer;

      if (audioData instanceof Float32Array) {
        // Convert Float32Array to binary for WebSocket
        audioBuffer = this.float32ArrayToArrayBuffer(audioData);
      } else {
        // Convert Blob to ArrayBuffer
        audioBuffer = await audioData.arrayBuffer();
      }

      // Send audio data via WebSocket
      this.ws.send(audioBuffer);

      return null; // Real-time results come via WebSocket callbacks

    } catch (error) {
      console.error('❌ AssemblyAI processing error:', error);
      this.errorCount++;
      throw error;
    }
  }

  private float32ArrayToArrayBuffer(audioData: Float32Array): ArrayBuffer {
    // Convert Float32Array to 16-bit PCM for AssemblyAI
    const int16Array = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      const sample = Math.max(-1, Math.min(1, audioData[i]));
      int16Array[i] = sample * 0x7FFF;
    }
    return int16Array.buffer;
  }

  private mapLanguageCode(assemblyLang: string): STTLanguage {
    const languageMap: Record<string, STTLanguage> = {
      'en': 'en',
      'en-US': 'en',
      'en-UK': 'en',
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
    
    return languageMap[assemblyLang] || 'en';
  }

  // Set callbacks for real-time results
  setCallbacks(
    onTranscription: (result: STTTranscriptionResult) => void,
    onInterim?: (text: string, confidence: number) => void
  ): void {
    this.onTranscriptionCallback = onTranscription;
    this.onInterimCallback = onInterim || null;
  }

  async stopTranscription(): Promise<void> {
    this.isTranscribing = false;

    try {
      // Close WebSocket connection
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }

      // Stop streaming session on backend
      if (this.sessionId) {
        await fetch('/api/stt/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'assemblyai',
            sessionId: this.sessionId,
            action: 'stop'
          })
        });
      }

      console.log('🛑 AssemblyAI STT transcription stopped');

    } catch (error) {
      console.error('❌ Error stopping AssemblyAI transcription:', error);
    }
  }

  async destroy(): Promise<void> {
    await this.stopTranscription();
    this.isInitialized = false;
    this.audioBuffer = [];
    this.onTranscriptionCallback = null;
    this.onInterimCallback = null;
    console.log('🗑️ AssemblyAI STT Provider destroyed');
  }

  getStatus(): { isAvailable: boolean; latency: number; errorRate: number } {
    const totalRequests = this.successCount + this.errorCount;
    const errorRate = totalRequests > 0 ? this.errorCount / totalRequests : 0;

    return {
      isAvailable: this.isInitialized && this.isStreaming,
      latency: this.latency,
      errorRate
    };
  }
}