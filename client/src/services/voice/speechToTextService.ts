/**
 * SpeechToTextService for EMDR42
 * Real-time speech recognition with multi-provider fallback support
 * Integrates with AudioStreamMultiplexer for conflict-free audio access
 * Supports OpenAI Whisper, AssemblyAI, Web Speech API providers
 */

import type {
  STTProvider,
  STTLanguage,
  STTProcessingMode,
  STTTranscriptionResult,
  STTServiceConfig,
  STTServiceStatus,
  STTProviderConfig,
  STTEvents,
  STTError,
  STTAudioConsumerConfig,
  STTAnalytics,
  VADResult,
  AudioConsumer,
  AudioConsumerStatus
} from '@/../../shared/types';

import { generateDeterministicId } from '@/lib/deterministicUtils';
import { AudioStreamMultiplexer } from '@/services/audio/audioStreamMultiplexer';

// === STT Provider Base Interface ===
export interface STTProviderInterface {
  initialize(config: STTProviderConfig): Promise<void>;
  startTranscription(): Promise<void>;
  processAudioChunk(audioData: Float32Array | Blob): Promise<STTTranscriptionResult | null>;
  stopTranscription(): Promise<void>;
  destroy(): Promise<void>;
  getStatus(): { isAvailable: boolean; latency: number; errorRate: number };
}

// === Default Configuration ===
export const defaultSTTConfig: STTServiceConfig = {
  providers: {
    primary: 'openai-whisper',
    fallback: ['assemblyai', 'web-speech-api'],
    enableFailover: true,
    failoverThreshold: 0.3 // 30% error rate threshold
  },
  processing: {
    mode: 'hybrid',
    realTimeEnabled: true,
    batchSizeMs: 3000, // 3 second batches
    bufferSizeMs: 500, // 500ms buffer
    minSilenceDuration: 1000 // 1 second silence triggers batch processing
  },
  language: {
    primary: 'auto',
    autoDetect: true,
    supportedLanguages: ['en', 'ru', 'auto'],
    enableTranslation: false
  },
  quality: {
    enableVAD: true,
    vadThreshold: 0.02,
    enableNoiseSuppression: true,
    enablePunctuation: true,
    enableCapitalization: true,
    enableProfanityFilter: false
  },
  performance: {
    maxConcurrentRequests: 3,
    requestTimeout: 10000, // 10 seconds
    retryCount: 2,
    retryDelay: 1000, // 1 second
    cachingEnabled: true,
    cacheExpiryMs: 300000 // 5 minutes
  }
};

// === Voice Activity Detection ===
class VoiceActivityDetector {
  private threshold: number;
  private energyHistory: number[] = [];
  private historySize: number = 30; // 30 frames of history

  constructor(threshold: number = 0.02) {
    this.threshold = threshold;
  }

  analyzeFrame(audioData: Float32Array): VADResult {
    const timestamp = Date.now();
    
    // Calculate RMS energy
    let energy = 0;
    for (let i = 0; i < audioData.length; i++) {
      energy += audioData[i] * audioData[i];
    }
    energy = Math.sqrt(energy / audioData.length);
    
    // Add to history
    this.energyHistory.push(energy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }
    
    // Calculate average energy
    const avgEnergy = this.energyHistory.reduce((sum, e) => sum + e, 0) / this.energyHistory.length;
    
    // Voice detection
    const isVoiceActive = energy > this.threshold && energy > avgEnergy * 1.5;
    const confidence = Math.min(energy / this.threshold, 1.0);
    
    // Calculate spectral features (simplified)
    const zeroCrossingRate = this.calculateZeroCrossingRate(audioData);
    const spectralCentroid = this.calculateSpectralCentroid(audioData);
    const spectralRolloff = this.calculateSpectralRolloff(audioData);
    
    return {
      timestamp,
      isVoiceActive,
      confidence,
      energy,
      spectralFeatures: {
        zeroCrossingRate,
        spectralCentroid,
        spectralRolloff
      }
    };
  }

  private calculateZeroCrossingRate(audioData: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / audioData.length;
  }

  private calculateSpectralCentroid(audioData: Float32Array): number {
    // Simplified spectral centroid calculation
    return 0.5; // Placeholder - would need FFT for real calculation
  }

  private calculateSpectralRolloff(audioData: Float32Array): number {
    // Simplified spectral rolloff calculation
    return 0.8; // Placeholder - would need FFT for real calculation
  }

  updateThreshold(threshold: number): void {
    this.threshold = threshold;
  }
}

// === Main SpeechToTextService Class ===
export class SpeechToTextService {
  private config: STTServiceConfig;
  private isInitialized: boolean = false;
  private isListening: boolean = false;
  private isProcessing: boolean = false;
  
  // Audio Infrastructure
  private audioMultiplexer: AudioStreamMultiplexer | null = null;
  private audioConsumer: AudioConsumer | null = null;
  private audioBuffer: Float32Array[] = [];
  private bufferTimestamp: number = 0;
  
  // Provider Management
  private providers: Map<STTProvider, STTProviderInterface> = new Map();
  private currentProvider: STTProvider;
  private providerStats: Map<STTProvider, { errorCount: number; successCount: number; lastUsed: number }> = new Map();
  
  // Voice Activity Detection
  private vad: VoiceActivityDetector;
  private lastVoiceActivity: number = 0;
  private silenceTimer: number | null = null;
  
  // Status and Analytics
  private status: STTServiceStatus;
  private analytics: STTAnalytics;
  private events: Partial<STTEvents> = {};
  
  // Processing State
  private processingQueue: { audio: Float32Array; timestamp: number }[] = [];
  private transcriptionHistory: STTTranscriptionResult[] = [];
  private interimResults: Map<string, string> = new Map();

  constructor(config?: Partial<STTServiceConfig>) {
    this.config = { ...defaultSTTConfig, ...config };
    this.currentProvider = this.config.providers.primary;
    this.vad = new VoiceActivityDetector(this.config.quality.vadThreshold);
    
    // Initialize status
    this.status = {
      isInitialized: false,
      isListening: false,
      isProcessing: false,
      currentProvider: this.currentProvider,
      connection: {
        isConnected: false,
        latency: 0,
        lastSuccessfulRequest: 0
      },
      processing: {
        queueSize: 0,
        averageLatency: 0,
        successRate: 1.0,
        totalProcessed: 0
      },
      providers: {} as any,
      audio: {
        isReceiving: false,
        sampleRate: 16000,
        channels: 1,
        quality: 1.0,
        vadState: false
      }
    };
    
    // Initialize analytics
    this.analytics = {
      sessionId: generateDeterministicId('stt_session', Date.now().toString(), 'session'),
      totalTranscriptions: 0,
      totalAudioDuration: 0,
      averageLatency: 0,
      accuracyScore: 0.9,
      languageDistribution: {},
      providerUsage: {},
      errorRate: 0,
      voiceActivityRatio: 0,
      performance: {
        averageProcessingTime: 0,
        maxProcessingTime: 0,
        minProcessingTime: Number.MAX_VALUE,
        timeouts: 0,
        retries: 0,
        failovers: 0
      },
      quality: {
        averageConfidence: 0,
        averageSnr: 0,
        averageAudioQuality: 0
      }
    };

    console.log('🎤 SpeechToTextService created with config:', this.config);
  }

  // === Core Service Methods ===

  /**
   * Initialize the STT service with all providers
   */
  async initialize(audioMultiplexer?: AudioStreamMultiplexer): Promise<void> {
    if (this.isInitialized) {
      console.warn('SpeechToTextService already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing SpeechToTextService...');
      
      // Set up audio multiplexer
      if (audioMultiplexer) {
        this.audioMultiplexer = audioMultiplexer;
      } else {
        // Create new multiplexer if not provided
        this.audioMultiplexer = new AudioStreamMultiplexer();
        await this.audioMultiplexer.initializeStream();
      }

      // Initialize all providers
      await this.initializeProviders();
      
      // Create audio consumer configuration
      await this.setupAudioConsumer();
      
      this.isInitialized = true;
      this.status.isInitialized = true;
      
      console.log('✅ SpeechToTextService initialized successfully');
      this.emitStatusChange();
      
    } catch (error) {
      console.error('❌ Failed to initialize SpeechToTextService:', error);
      this.emitError({
        code: 'INIT_FAILED',
        message: `Initialization failed: ${error}`,
        provider: this.currentProvider,
        timestamp: Date.now(),
        retryable: true,
        details: error
      });
      throw error;
    }
  }

  /**
   * Start listening for speech and transcribing
   */
  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isListening) {
      console.warn('SpeechToTextService already listening');
      return;
    }

    try {
      console.log('🎧 Starting speech recognition...');

      // Start audio multiplexer streaming
      if (this.audioMultiplexer && !this.audioMultiplexer.getStatus().isStreaming) {
        await this.audioMultiplexer.startStreaming();
      }

      // Start current provider
      const provider = this.providers.get(this.currentProvider);
      if (provider) {
        await provider.startTranscription();
      }

      this.isListening = true;
      this.status.isListening = true;
      this.status.audio.isReceiving = true;
      
      console.log(`🔊 Speech recognition started with provider: ${this.currentProvider}`);
      this.emitStatusChange();

    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      this.emitError({
        code: 'START_FAILED',
        message: `Failed to start listening: ${error}`,
        provider: this.currentProvider,
        timestamp: Date.now(),
        retryable: true,
        details: error
      });
      throw error;
    }
  }

  /**
   * Stop listening and clean up
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    try {
      console.log('🛑 Stopping speech recognition...');

      // Stop current provider
      const provider = this.providers.get(this.currentProvider);
      if (provider) {
        await provider.stopTranscription();
      }

      // Clear timers
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      // Process any remaining audio in buffer
      if (this.audioBuffer.length > 0) {
        await this.processBatch();
      }

      this.isListening = false;
      this.status.isListening = false;
      this.status.audio.isReceiving = false;
      
      console.log('✅ Speech recognition stopped');
      this.emitStatusChange();

    } catch (error) {
      console.error('❌ Failed to stop listening:', error);
      this.emitError({
        code: 'STOP_FAILED',
        message: `Failed to stop listening: ${error}`,
        provider: this.currentProvider,
        timestamp: Date.now(),
        retryable: false,
        details: error
      });
    }
  }

  /**
   * Process audio data from AudioStreamMultiplexer
   */
  private async processAudioData(audioData: Float32Array, sampleRate: number): Promise<void> {
    if (!this.isListening) return;

    try {
      // Voice Activity Detection
      const vadResult = this.vad.analyzeFrame(audioData);
      this.status.audio.vadState = vadResult.isVoiceActive;
      
      // Emit VAD events
      if (this.events.onVoiceActivity) {
        this.events.onVoiceActivity(vadResult.isVoiceActive, vadResult.confidence);
      }

      if (vadResult.isVoiceActive) {
        this.lastVoiceActivity = Date.now();
        
        // Add to buffer for batch processing
        this.audioBuffer.push(audioData);
        
        if (this.audioBuffer.length === 1) {
          this.bufferTimestamp = Date.now();
        }

        // Clear silence timer
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        // Real-time processing for streaming mode
        if (this.config.processing.realTimeEnabled && this.config.processing.mode !== 'batch') {
          await this.processRealTime(audioData);
        }

        // Check batch size limit
        const bufferDuration = (this.audioBuffer.length * audioData.length) / sampleRate * 1000;
        if (bufferDuration >= this.config.processing.batchSizeMs) {
          await this.processBatch();
        }

      } else {
        // Handle silence
        if (this.audioBuffer.length > 0 && !this.silenceTimer) {
          this.silenceTimer = window.setTimeout(async () => {
            await this.processBatch();
            this.silenceTimer = null;
          }, this.config.processing.minSilenceDuration);
        }
      }

    } catch (error) {
      console.error('❌ Error processing audio data:', error);
      this.emitError({
        code: 'AUDIO_PROCESSING_ERROR',
        message: `Audio processing failed: ${error}`,
        provider: this.currentProvider,
        timestamp: Date.now(),
        retryable: true,
        details: error
      });
    }
  }

  /**
   * Process audio in real-time streaming mode
   */
  private async processRealTime(audioData: Float32Array): Promise<void> {
    try {
      const provider = this.providers.get(this.currentProvider);
      if (!provider) return;

      const result = await provider.processAudioChunk(audioData);
      if (result && !result.isFinal) {
        // Handle interim results
        this.interimResults.set(result.id, result.text);
        if (this.events.onInterimResult) {
          this.events.onInterimResult(result.text, result.confidence);
        }
      }
    } catch (error) {
      console.error('❌ Real-time processing error:', error);
      await this.handleProviderError(error);
    }
  }

  /**
   * Process accumulated audio buffer as batch
   */
  private async processBatch(): Promise<void> {
    if (this.audioBuffer.length === 0) return;

    try {
      console.log(`📦 Processing batch of ${this.audioBuffer.length} audio chunks`);
      
      // Concatenate audio buffer
      const totalLength = this.audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedAudio = new Float32Array(totalLength);
      let offset = 0;
      
      for (const chunk of this.audioBuffer) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to blob for provider processing
      const audioBlob = this.audioDataToBlob(combinedAudio, this.status.audio.sampleRate);
      
      const provider = this.providers.get(this.currentProvider);
      if (provider) {
        const result = await provider.processAudioChunk(audioBlob);
        if (result) {
          await this.handleTranscriptionResult(result);
        }
      }

      // Clear buffer
      this.audioBuffer = [];
      this.bufferTimestamp = 0;

    } catch (error) {
      console.error('❌ Batch processing error:', error);
      await this.handleProviderError(error);
    }
  }

  /**
   * Handle transcription results
   */
  private async handleTranscriptionResult(result: STTTranscriptionResult): Promise<void> {
    try {
      // Update analytics
      this.analytics.totalTranscriptions++;
      this.analytics.averageLatency = (this.analytics.averageLatency + result.processing.latency) / 2;
      this.analytics.quality.averageConfidence = (this.analytics.quality.averageConfidence + result.confidence) / 2;

      // Update language distribution
      if (!this.analytics.languageDistribution[result.language]) {
        this.analytics.languageDistribution[result.language] = 0;
      }
      this.analytics.languageDistribution[result.language]++;

      // Update provider usage
      if (!this.analytics.providerUsage[result.provider]) {
        this.analytics.providerUsage[result.provider] = 0;
      }
      this.analytics.providerUsage[result.provider]++;

      // Store in history
      this.transcriptionHistory.push(result);
      
      // Emit transcription event
      if (this.events.onTranscription) {
        this.events.onTranscription(result);
      }

      console.log(`📝 Transcription: "${result.text}" (${result.language}, confidence: ${result.confidence})`);

    } catch (error) {
      console.error('❌ Error handling transcription result:', error);
    }
  }

  /**
   * Handle provider errors and fallback
   */
  private async handleProviderError(error: any): Promise<void> {
    try {
      // Update error stats
      const stats = this.providerStats.get(this.currentProvider);
      if (stats) {
        stats.errorCount++;
      }

      // Check if failover is needed
      if (this.config.providers.enableFailover) {
        const errorRate = this.calculateProviderErrorRate(this.currentProvider);
        
        if (errorRate > this.config.providers.failoverThreshold) {
          await this.failoverToNextProvider();
        }
      }

      this.emitError({
        code: 'PROVIDER_ERROR',
        message: `Provider error: ${error}`,
        provider: this.currentProvider,
        timestamp: Date.now(),
        retryable: true,
        details: error
      });

    } catch (failoverError) {
      console.error('❌ Failover error:', failoverError);
    }
  }

  /**
   * Failover to the next available provider
   */
  private async failoverToNextProvider(): Promise<void> {
    console.log(`🔄 Failing over from ${this.currentProvider}...`);
    
    for (const fallbackProvider of this.config.providers.fallback) {
      const provider = this.providers.get(fallbackProvider);
      if (provider && provider.getStatus().isAvailable) {
        
        // Stop current provider
        const currentProvider = this.providers.get(this.currentProvider);
        if (currentProvider) {
          await currentProvider.stopTranscription();
        }

        // Switch to fallback provider
        this.currentProvider = fallbackProvider;
        this.status.currentProvider = fallbackProvider;
        
        // Start new provider
        await provider.startTranscription();
        
        this.analytics.performance.failovers++;
        
        if (this.events.onProviderChange) {
          this.events.onProviderChange(fallbackProvider, 'Error rate threshold exceeded');
        }

        console.log(`✅ Failed over to ${fallbackProvider}`);
        return;
      }
    }

    throw new Error('No fallback providers available');
  }

  /**
   * Calculate error rate for a provider
   */
  private calculateProviderErrorRate(provider: STTProvider): number {
    const stats = this.providerStats.get(provider);
    if (!stats || (stats.errorCount + stats.successCount) === 0) {
      return 0;
    }
    return stats.errorCount / (stats.errorCount + stats.successCount);
  }

  /**
   * Convert Float32Array to audio Blob
   */
  private audioDataToBlob(audioData: Float32Array, sampleRate: number): Blob {
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

  // === Provider Management ===

  /**
   * Initialize all configured providers
   */
  private async initializeProviders(): Promise<void> {
    const allProviders: STTProvider[] = [
      this.config.providers.primary,
      ...this.config.providers.fallback
    ];

    for (const providerType of allProviders) {
      try {
        let provider: STTProviderInterface;

        switch (providerType) {
          case 'openai-whisper':
            const { OpenAIWhisperProvider } = await import('./providers/openaiWhisperProvider');
            provider = new OpenAIWhisperProvider();
            break;
          case 'assemblyai':
            const { AssemblyAISTTProvider } = await import('./providers/assemblyaiSTTProvider');
            provider = new AssemblyAISTTProvider();
            break;
          case 'web-speech-api':
            const { WebSpeechSTTProvider } = await import('./providers/webSpeechSTTProvider');
            provider = new WebSpeechSTTProvider();
            break;
          default:
            console.warn(`Unknown STT provider: ${providerType}`);
            continue;
        }

        await provider.initialize({
          provider: providerType,
          settings: {}
        });

        this.providers.set(providerType, provider);
        this.providerStats.set(providerType, {
          errorCount: 0,
          successCount: 0,
          lastUsed: 0
        });

        console.log(`✅ Initialized STT provider: ${providerType}`);

      } catch (error) {
        console.error(`❌ Failed to initialize provider ${providerType}:`, error);
      }
    }

    if (this.providers.size === 0) {
      throw new Error('No STT providers could be initialized');
    }
  }

  /**
   * Setup audio consumer for AudioStreamMultiplexer
   */
  private async setupAudioConsumer(): Promise<void> {
    if (!this.audioMultiplexer) {
      throw new Error('AudioStreamMultiplexer not available');
    }

    this.audioConsumer = {
      id: 'stt-consumer',
      name: 'Speech-to-Text Consumer',
      type: 'other',
      priority: 9, // Higher than emotion analysis (7)
      active: true,
      config: {
        sampleRate: 16000,
        channels: 1,
        bufferSize: 4096,
        enableEchoCancellation: this.config.quality.enableNoiseSuppression,
        enableNoiseSuppression: this.config.quality.enableNoiseSuppression,
        enableAutoGainControl: true
      },
      onAudioData: (audioData: Float32Array, sampleRate: number) => {
        this.processAudioData(audioData, sampleRate);
      },
      onStatusChange: (status: AudioConsumerStatus) => {
        this.status.audio.isReceiving = status.isReceivingAudio;
        this.status.audio.quality = status.quality;
        this.emitStatusChange();
      },
      onError: (error: string) => {
        this.emitError({
          code: 'AUDIO_CONSUMER_ERROR',
          message: error,
          provider: this.currentProvider,
          timestamp: Date.now(),
          retryable: true
        });
      }
    };

    await this.audioMultiplexer.addConsumer(this.audioConsumer);
    console.log('✅ STT audio consumer added to AudioStreamMultiplexer');
  }

  // === Event Management ===

  /**
   * Set event callbacks
   */
  setEvents(events: Partial<STTEvents>): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Emit status change event
   */
  private emitStatusChange(): void {
    if (this.events.onStatusChange) {
      this.events.onStatusChange(this.status);
    }
  }

  /**
   * Emit error event
   */
  private emitError(error: STTError): void {
    if (this.events.onError) {
      this.events.onError(error);
    }
  }

  // === Public API ===

  /**
   * Get current service status
   */
  getStatus(): STTServiceStatus {
    return { ...this.status };
  }

  /**
   * Get service analytics
   */
  getAnalytics(): STTAnalytics {
    return { ...this.analytics };
  }

  /**
   * Get transcription history
   */
  getTranscriptionHistory(): STTTranscriptionResult[] {
    return [...this.transcriptionHistory];
  }

  /**
   * Clear transcription history
   */
  clearHistory(): void {
    this.transcriptionHistory = [];
    this.analytics.totalTranscriptions = 0;
  }

  /**
   * Switch to a different provider
   */
  async switchProvider(provider: STTProvider): Promise<void> {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider ${provider} not available`);
    }

    if (this.isListening) {
      await this.stopListening();
    }

    this.currentProvider = provider;
    this.status.currentProvider = provider;

    if (this.isListening) {
      await this.startListening();
    }

    console.log(`🔄 Switched to provider: ${provider}`);
    this.emitStatusChange();
  }

  /**
   * Update service configuration
   */
  updateConfig(config: Partial<STTServiceConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update VAD threshold
    if (config.quality?.vadThreshold) {
      this.vad.updateThreshold(config.quality.vadThreshold);
    }

    console.log('⚙️ STT configuration updated');
  }

  /**
   * Destroy service and clean up resources
   */
  async destroy(): Promise<void> {
    try {
      if (this.isListening) {
        await this.stopListening();
      }

      // Destroy all providers
      for (const [_, provider] of this.providers) {
        await provider.destroy();
      }

      // Remove audio consumer
      if (this.audioConsumer && this.audioMultiplexer) {
        await this.audioMultiplexer.removeConsumer(this.audioConsumer.id);
      }

      this.providers.clear();
      this.providerStats.clear();
      this.transcriptionHistory = [];
      this.audioBuffer = [];
      this.isInitialized = false;

      console.log('🗑️ SpeechToTextService destroyed');

    } catch (error) {
      console.error('❌ Error destroying SpeechToTextService:', error);
    }
  }
}

// === Export ===
export default SpeechToTextService;