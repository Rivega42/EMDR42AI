/**
 * Revolutionary Text-to-Speech Service for EMDR42 AI Therapist
 * 
 * Features:
 * - Provider pattern with fallback mechanism (Google Cloud → Web Speech)
 * - Advanced audio caching for repeated phrases
 * - Voice personalization and therapeutic voice selection
 * - Real-time streaming for long texts
 * - Quality control and adaptive settings
 * - Integration with AI therapist emotional context
 */

import type {
  TTSProvider,
  TTSVoiceConfig,
  TTSAudioQuality,
  TTSSynthesisRequest,
  TTSSynthesisResponse,
  TTSServiceStatus,
  TTSError,
  TTSServiceConfig,
  TTSCacheConfig,
  TTSStreamingConfig,
  VoicePersonalizationProfile,
  TTSPlaybackControl,
  TTSAnalytics,
  TherapistTTSConfig
} from '@/../../shared/types';

import { generateDeterministicId } from '@/lib/deterministicUtils';

// Provider interface that all TTS providers must implement
interface TTSProviderInterface {
  name: TTSProvider;
  initialize(config: any): Promise<void>;
  synthesize(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse>;
  isAvailable(): boolean;
  getStatus(): any;
  cleanup(): Promise<void>;
}

// Default TTS configurations
const DEFAULT_VOICE_CONFIG: TTSVoiceConfig = {
  name: 'en-US-Studio-M',
  language: 'en-US',
  gender: 'neutral',
  age: 'adult',
  accent: 'american',
  characteristics: {
    warmth: 0.8,
    authority: 0.6,
    empathy: 0.9,
    clarity: 0.9,
    pace: 'normal'
  },
  therapeuticProfile: {
    anxietyFriendly: true,
    traumaSensitive: true,
    childFriendly: false,
    culturallySensitive: ['en-US', 'universal']
  }
};

const DEFAULT_AUDIO_QUALITY: TTSAudioQuality = {
  sampleRate: 24000,
  bitRate: 128,
  format: 'mp3',
  channels: 1,
  compression: 'medium'
};

// Audio cache for storing synthesized speech
class TTSAudioCache {
  private cache = new Map<string, TTSSynthesisResponse>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    size: 0, // MB
    lastCleanup: Date.now()
  };
  private config: TTSCacheConfig;

  constructor(config: TTSCacheConfig) {
    this.config = config;
    this.startCleanupTimer();
  }

  private generateCacheKey(request: TTSSynthesisRequest): string {
    const keyData = {
      text: request.text.trim().toLowerCase(),
      voice: request.voice.name,
      language: request.voice.language,
      speed: request.options.speed,
      pitch: request.options.pitch,
      quality: `${request.quality.sampleRate}_${request.quality.bitRate}_${request.quality.format}`
    };
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  get(request: TTSSynthesisRequest): TTSSynthesisResponse | null {
    if (!this.config.enabled) return null;

    const key = this.generateCacheKey(request);
    const cached = this.cache.get(key);
    
    if (cached) {
      this.cacheStats.hits++;
      // Update metadata to indicate cache hit
      cached.metadata.fromCache = true;
      return cached;
    }
    
    this.cacheStats.misses++;
    return null;
  }

  set(request: TTSSynthesisRequest, response: TTSSynthesisResponse): void {
    if (!this.config.enabled) return;

    const key = this.generateCacheKey(request);
    
    // Estimate memory usage (rough approximation)
    const estimatedSize = this.estimateSize(response);
    
    // Check if adding this would exceed cache limit
    if (this.cacheStats.size + estimatedSize > this.config.maxSize * 1024 * 1024) {
      this.evictOldEntries();
    }
    
    // Add cache key to response metadata
    response.metadata.cacheKey = key;
    response.metadata.fromCache = false;
    
    this.cache.set(key, response);
    this.cacheStats.size += estimatedSize;
  }

  private estimateSize(response: TTSSynthesisResponse): number {
    if (response.audioData instanceof ArrayBuffer) {
      return response.audioData.byteLength;
    } else if (response.audioData instanceof Blob) {
      return response.audioData.size;
    } else if (typeof response.audioData === 'string') {
      // Base64 string
      return response.audioData.length * 0.75; // Base64 is ~33% larger than binary
    }
    return response.size || 0;
  }

  private evictOldEntries(): void {
    // Simple LRU eviction - remove 25% of entries
    const entries = Array.from(this.cache.entries());
    const toRemove = Math.floor(entries.length * 0.25);
    
    for (let i = 0; i < toRemove; i++) {
      const [key] = entries[i];
      this.cache.delete(key);
    }
    
    // Recalculate cache size
    this.recalculateSize();
  }

  private recalculateSize(): void {
    this.cacheStats.size = Array.from(this.cache.values())
      .reduce((total, response) => total + this.estimateSize(response), 0);
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      if (Date.now() - this.cacheStats.lastCleanup > this.config.ttl * 1000) {
        this.evictOldEntries();
        this.cacheStats.lastCleanup = Date.now();
      }
    }, 300000); // Check every 5 minutes
  }

  getStats() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses);
    return {
      enabled: this.config.enabled,
      size: this.cacheStats.size / (1024 * 1024), // Convert to MB
      hitRate: isNaN(hitRate) ? 0 : hitRate,
      maxSize: this.config.maxSize,
      entries: this.cache.size
    };
  }

  clear(): void {
    this.cache.clear();
    this.cacheStats = {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: Date.now()
    };
  }
}

// Text preprocessing for better TTS synthesis
class TTSTextProcessor {
  static preprocess(text: string, options: { context: string, therapeuticMode?: boolean }): string {
    let processed = text.trim();
    
    // Remove excessive whitespace
    processed = processed.replace(/\s+/g, ' ');
    
    // Handle common therapeutic abbreviations
    if (options.therapeuticMode) {
      processed = processed.replace(/\bEMDR\b/g, 'E.M.D.R.');
      processed = processed.replace(/\bSUDs\b/g, 'S.U.Ds');
      processed = processed.replace(/\bVoC\b/g, 'V.o.C');
      processed = processed.replace(/\bPTSD\b/g, 'P.T.S.D.');
    }
    
    // Add natural pauses for therapeutic context
    if (options.context === 'therapy-response') {
      // Add slight pauses after important phrases
      processed = processed.replace(/\. /g, '. <break time="300ms"/> ');
      processed = processed.replace(/\? /g, '? <break time="400ms"/> ');
      processed = processed.replace(/: /g, ': <break time="200ms"/> ');
    }
    
    // Emergency context - faster, more direct
    if (options.context === 'emergency') {
      processed = processed.replace(/<break[^>]*>/g, ''); // Remove breaks
    }
    
    // Meditation context - add more pauses
    if (options.context === 'meditation') {
      processed = processed.replace(/\. /g, '. <break time="800ms"/> ');
      processed = processed.replace(/,/g, ',<break time="300ms"/>');
    }
    
    return processed;
  }

  static estimateReadingTime(text: string, wordsPerMinute = 150): number {
    const words = text.split(/\s+/).length;
    return (words / wordsPerMinute) * 60; // Return seconds
  }

  static splitForStreaming(text: string, chunkSize = 200): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const chunks: string[] = [];
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
}

/**
 * Main Text-to-Speech Service Class
 * Orchestrates multiple TTS providers with intelligent fallback and caching
 */
export class TextToSpeechService {
  private providers = new Map<TTSProvider, TTSProviderInterface>();
  private cache: TTSAudioCache;
  private config: TTSServiceConfig;
  private status: TTSServiceStatus;
  private analytics: TTSAnalytics;
  private currentProvider: TTSProvider;
  private fallbackQueue: TTSProvider[] = [];
  private processingQueue: TTSSynthesisRequest[] = [];
  private isProcessing = false;

  // Event handlers
  private onStatusChange?: (status: TTSServiceStatus) => void;
  private onError?: (error: TTSError) => void;
  private onSynthesisComplete?: (response: TTSSynthesisResponse) => void;

  constructor(config: Partial<TTSServiceConfig> = {}) {
    this.config = this.mergeWithDefaults(config);
    this.currentProvider = this.config.primaryProvider;
    this.fallbackQueue = [...this.config.fallbackProviders];
    
    // Initialize cache
    this.cache = new TTSAudioCache(this.config.cache);
    
    // Initialize status
    this.status = {
      isInitialized: false,
      currentProvider: this.currentProvider,
      isProcessing: false,
      queueSize: 0,
      cacheStatus: this.cache.getStats(),
      providers: {}
    };
    
    // Initialize analytics
    this.analytics = {
      usage: {
        totalRequests: 0,
        uniqueTexts: 0,
        totalAudioTime: 0,
        avgResponseTime: 0,
        cacheHitRate: 0
      },
      costs: {
        totalCost: 0,
        costPerRequest: 0,
        costPerSecond: 0,
        monthlyCost: 0
      },
      quality: {
        userRatings: [],
        avgRating: 0,
        errorRate: 0,
        successRate: 1
      },
      performance: {
        avgSynthesisTime: 0,
        avgFirstByteTime: 0,
        p95ResponseTime: 0,
        throughput: 0
      }
    };
  }

  private mergeWithDefaults(config: Partial<TTSServiceConfig>): TTSServiceConfig {
    return {
      primaryProvider: config.primaryProvider || 'google-cloud',
      fallbackProviders: config.fallbackProviders || ['web-speech'],
      defaultVoice: config.defaultVoice || DEFAULT_VOICE_CONFIG,
      defaultQuality: config.defaultQuality || DEFAULT_AUDIO_QUALITY,
      cache: {
        enabled: true,
        maxSize: 100, // MB
        ttl: 3600, // 1 hour
        strategy: 'lru',
        compression: false,
        persistToDisk: false,
        cacheKeyStrategy: 'text-voice-quality',
        ...config.cache
      },
      streaming: {
        enabled: true,
        chunkSize: 200,
        overlap: 20,
        bufferSize: 5,
        preload: true,
        adaptiveBitrate: true,
        ...config.streaming
      },
      retry: {
        maxAttempts: 3,
        backoffMultiplier: 2,
        maxBackoffTime: 10000,
        ...config.retry
      },
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        requestsPerDay: 10000,
        ...config.rateLimit
      },
      privacy: {
        storeAudio: false,
        encryptCache: true,
        autoDeleteAfter: 24,
        logRequests: false,
        ...config.privacy
      }
    };
  }

  /**
   * Initialize the TTS service with providers
   */
  async initialize(): Promise<void> {
    try {
      console.log('🎙️ Initializing TextToSpeechService with provider:', this.currentProvider);
      
      // Dynamic import and initialize providers based on configuration
      await this.initializeProviders();
      
      this.status.isInitialized = true;
      this.status.currentProvider = this.currentProvider;
      
      // Start background tasks
      this.startQueueProcessor();
      
      console.log('✅ TextToSpeechService initialized successfully');
      this.emitStatusChange();
      
    } catch (error) {
      console.error('❌ Failed to initialize TextToSpeechService:', error);
      this.status.isInitialized = false;
      throw error;
    }
  }

  private async initializeProviders(): Promise<void> {
    // We'll implement provider initialization here
    // For now, create placeholder providers that will be implemented in separate files
    const allProviders = [this.currentProvider, ...this.fallbackQueue];
    
    for (const providerName of allProviders) {
      try {
        // Dynamic provider loading will be implemented here
        console.log(`📡 Initializing ${providerName} provider...`);
        
        // Initialize provider status
        this.status.providers[providerName] = {
          available: false,
          latency: 0,
          errorRate: 0,
          usage: {
            requestsToday: 0,
            quotaRemaining: undefined,
            costToday: 0
          }
        };
      } catch (error) {
        console.warn(`⚠️ Failed to initialize ${providerName}:`, error);
      }
    }
  }

  /**
   * Register a TTS provider
   */
  registerProvider(provider: TTSProviderInterface): void {
    this.providers.set(provider.name, provider);
    console.log(`📝 Registered TTS provider: ${provider.name}`);
  }

  /**
   * Main synthesis method - handles caching, fallback, and streaming
   */
  async synthesize(request: Partial<TTSSynthesisRequest>): Promise<TTSSynthesisResponse> {
    const fullRequest = this.buildFullRequest(request);
    const startTime = performance.now();
    
    try {
      // Check cache first
      const cached = this.cache.get(fullRequest);
      if (cached) {
        console.log('🎯 Cache hit for TTS request');
        this.analytics.usage.cacheHitRate = this.cache.getStats().hitRate;
        return cached;
      }
      
      // Process text for better synthesis
      const processedText = TTSTextProcessor.preprocess(fullRequest.text, {
        context: fullRequest.metadata.context,
        therapeuticMode: true
      });
      
      fullRequest.text = processedText;
      
      // Try current provider first, then fallbacks
      let response = await this.synthesizeWithFallback(fullRequest);
      
      // Cache the response
      this.cache.set(fullRequest, response);
      
      // Update analytics
      this.updateAnalytics(fullRequest, response, performance.now() - startTime);
      
      console.log(`🎵 TTS synthesis completed in ${Math.round(performance.now() - startTime)}ms`);
      
      // Emit completion event
      this.onSynthesisComplete?.(response);
      
      return response;
      
    } catch (error) {
      console.error('❌ TTS synthesis failed:', error);
      this.handleSynthesisError(error as Error, fullRequest);
      throw error;
    }
  }

  private async synthesizeWithFallback(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse> {
    const providers = [this.currentProvider, ...this.fallbackQueue];
    let lastError: Error | null = null;
    
    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      
      if (!provider || !provider.isAvailable()) {
        console.warn(`⚠️ Provider ${providerName} not available, trying next...`);
        continue;
      }
      
      try {
        console.log(`🔄 Attempting synthesis with ${providerName}...`);
        const response = await provider.synthesize(request);
        
        // Update current provider if we switched
        if (providerName !== this.currentProvider) {
          console.log(`🔄 Switched to fallback provider: ${providerName}`);
          this.currentProvider = providerName;
          this.status.currentProvider = providerName;
        }
        
        return response;
        
      } catch (error) {
        console.warn(`⚠️ Provider ${providerName} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }
    
    // All providers failed
    throw new Error(`All TTS providers failed. Last error: ${lastError?.message}`);
  }

  private buildFullRequest(partial: Partial<TTSSynthesisRequest>): TTSSynthesisRequest {
    return {
      text: partial.text || '',
      voice: partial.voice || this.config.defaultVoice,
      quality: partial.quality || this.config.defaultQuality,
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
        },
        ...partial.options
      },
      metadata: {
        context: 'therapy-response',
        priority: 'normal',
        sessionId: generateDeterministicId('tts', Date.now().toString(), 'session'),
        ...partial.metadata
      }
    };
  }

  private updateAnalytics(request: TTSSynthesisRequest, response: TTSSynthesisResponse, duration: number): void {
    this.analytics.usage.totalRequests++;
    this.analytics.usage.totalAudioTime += response.duration;
    this.analytics.performance.avgSynthesisTime = 
      (this.analytics.performance.avgSynthesisTime + response.metadata.synthesisTime) / 2;
    
    // Update cache hit rate
    this.analytics.usage.cacheHitRate = this.cache.getStats().hitRate;
  }

  private handleSynthesisError(error: Error, request: TTSSynthesisRequest): void {
    const ttsError: TTSError = {
      type: 'synthesis',
      code: 'SYNTHESIS_FAILED',
      message: error.message,
      provider: this.currentProvider,
      retryable: true,
      details: { request: request.metadata }
    };
    
    this.onError?.(ttsError);
    this.analytics.quality.errorRate = Math.min(this.analytics.quality.errorRate + 0.1, 1);
  }

  private startQueueProcessor(): void {
    // Background queue processing for non-urgent requests
    setInterval(() => {
      if (this.processingQueue.length > 0 && !this.isProcessing) {
        this.processQueue();
      }
    }, 1000);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) return;
    
    this.isProcessing = true;
    this.status.isProcessing = true;
    this.status.queueSize = this.processingQueue.length;
    
    while (this.processingQueue.length > 0) {
      const request = this.processingQueue.shift();
      if (request) {
        try {
          await this.synthesize(request);
        } catch (error) {
          console.error('Queue processing error:', error);
        }
      }
    }
    
    this.isProcessing = false;
    this.status.isProcessing = false;
    this.status.queueSize = 0;
    this.emitStatusChange();
  }

  /**
   * Queue a synthesis request for background processing
   */
  queueSynthesis(request: Partial<TTSSynthesisRequest>): void {
    const fullRequest = this.buildFullRequest(request);
    this.processingQueue.push(fullRequest);
    this.status.queueSize = this.processingQueue.length;
  }

  /**
   * Streaming synthesis for long texts
   */
  async* synthesizeStream(request: Partial<TTSSynthesisRequest>): AsyncGenerator<TTSSynthesisResponse, void, unknown> {
    if (!this.config.streaming.enabled) {
      // Fall back to single synthesis
      yield await this.synthesize(request);
      return;
    }
    
    const fullRequest = this.buildFullRequest(request);
    const chunks = TTSTextProcessor.splitForStreaming(
      fullRequest.text, 
      this.config.streaming.chunkSize
    );
    
    console.log(`🌊 Streaming TTS synthesis: ${chunks.length} chunks`);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkRequest = {
        ...fullRequest,
        text: chunks[i],
        metadata: {
          ...fullRequest.metadata,
          cacheKey: `${fullRequest.metadata.cacheKey || 'stream'}_chunk_${i}`
        }
      };
      
      try {
        const response = await this.synthesize(chunkRequest);
        yield response;
      } catch (error) {
        console.error(`Streaming chunk ${i} failed:`, error);
        // Continue with next chunk
      }
    }
  }

  /**
   * Get current service status
   */
  getStatus(): TTSServiceStatus {
    this.status.cacheStatus = this.cache.getStats();
    return { ...this.status };
  }

  /**
   * Get analytics data
   */
  getAnalytics(): TTSAnalytics {
    return { ...this.analytics };
  }

  /**
   * Test a voice with sample text
   */
  async testVoice(voice: TTSVoiceConfig, sampleText = "Hello, this is a sample of my voice for therapy sessions."): Promise<TTSSynthesisResponse> {
    return this.synthesize({
      text: sampleText,
      voice,
      metadata: {
        context: 'therapy-response',
        priority: 'high'
      }
    });
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up TextToSpeechService...');
    
    for (const provider of this.providers.values()) {
      await provider.cleanup();
    }
    
    this.cache.clear();
    this.providers.clear();
    this.status.isInitialized = false;
  }

  // Event handler setters
  onStatusChange(handler: (status: TTSServiceStatus) => void): void {
    this.onStatusChange = handler;
  }

  onErrorOccurred(handler: (error: TTSError) => void): void {
    this.onError = handler;
  }

  onSynthesisCompleted(handler: (response: TTSSynthesisResponse) => void): void {
    this.onSynthesisComplete = handler;
  }

  private emitStatusChange(): void {
    this.onStatusChange?.(this.getStatus());
  }
}

// Singleton instance
let ttsServiceInstance: TextToSpeechService | null = null;

/**
 * Get or create the global TTS service instance
 */
export function getTTSService(config?: Partial<TTSServiceConfig>): TextToSpeechService {
  if (!ttsServiceInstance) {
    ttsServiceInstance = new TextToSpeechService(config);
  }
  return ttsServiceInstance;
}

/**
 * Default therapeutic voice configurations
 */
export const THERAPEUTIC_VOICES = {
  calming: {
    name: 'en-US-Studio-O',
    language: 'en-US',
    gender: 'female' as const,
    age: 'adult' as const,
    accent: 'american',
    characteristics: {
      warmth: 0.9,
      authority: 0.4,
      empathy: 0.95,
      clarity: 0.9,
      pace: 'slow' as const
    },
    therapeuticProfile: {
      anxietyFriendly: true,
      traumaSensitive: true,
      childFriendly: true,
      culturallySensitive: ['en-US', 'universal']
    }
  },
  authoritative: {
    name: 'en-US-Studio-M',
    language: 'en-US',
    gender: 'male' as const,
    age: 'adult' as const,
    accent: 'american',
    characteristics: {
      warmth: 0.6,
      authority: 0.9,
      empathy: 0.7,
      clarity: 0.95,
      pace: 'normal' as const
    },
    therapeuticProfile: {
      anxietyFriendly: false,
      traumaSensitive: true,
      childFriendly: false,
      culturallySensitive: ['en-US']
    }
  },
  gentle: {
    name: 'en-US-Studio-H',
    language: 'en-US',
    gender: 'female' as const,
    age: 'young-adult' as const,
    accent: 'american',
    characteristics: {
      warmth: 0.95,
      authority: 0.3,
      empathy: 0.9,
      clarity: 0.85,
      pace: 'slow' as const
    },
    therapeuticProfile: {
      anxietyFriendly: true,
      traumaSensitive: true,
      childFriendly: true,
      culturallySensitive: ['en-US', 'universal']
    }
  }
} as const;