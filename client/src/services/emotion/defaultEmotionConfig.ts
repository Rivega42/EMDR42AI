/**
 * Default configuration for UnifiedEmotionService with AudioStreamMultiplexer support
 * Provides sensible defaults for emotion recognition with conflict-free audio access
 */

import type { UnifiedEmotionConfig } from './emotionService';
import { defaultFusionConfig } from './emotionFusion';

export const defaultUnifiedEmotionConfig: UnifiedEmotionConfig = {
  face: {
    enabled: true,
    smoothingWindow: 5,
    processEveryNFrames: 2,
    minConfidence: 0.7
  },
  voice: {
    enabled: true,
    provider: {
      provider: 'assemblyai',
      apiKey: '',
      endpoint: undefined,
      settings: {
        assemblyai: {
          sentiment: true,
          emotionDetection: true,
          realtime: true,
          language: 'en'
        }
      }
    },
    audioConstraints: {
      sampleRate: 16000,
      channels: 1,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    processing: {
      realtime: true,
      chunkDuration: 250,
      overlap: 50,
      minConfidence: 0.6,
      smoothingWindow: 3
    },
    fallback: {
      enableFallback: true,
      fallbackProvider: 'mock',
      mockEmotions: true,
      fallbackTimeout: 5000
    }
  },
  fusion: defaultFusionConfig,
  multimodal: {
    enabled: true,
    preferredMode: 'auto',
    fallbackStrategy: 'face',
    qualityThreshold: 0.6
  },
  performance: {
    targetLatency: 100,
    maxMemoryUsage: 256,
    enableOptimizations: true
  },
  // === NEW: AudioStreamMultiplexer Configuration ===
  audio: {
    useMultiplexer: true, // Enable multiplexed audio by default
    multiplexerConfig: {
      masterAudio: {
        sampleRate: 16000,
        channels: 1,
        bufferSize: 4096,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      consumers: {
        maxConsumers: 5,
        priorityScheduling: true,
        adaptiveQuality: true
      },
      performance: {
        enableWebWorker: false,
        enableVAD: true,
        vadThreshold: 0.01,
        maxLatency: 100,
        dropFramesOnOverload: true
      },
      fallback: {
        enableFallback: true,
        fallbackSampleRate: 8000,
        maxRetries: 3,
        retryDelay: 1000
      }
    },
    consumerPriority: 8, // High priority for emotion analysis
    consumerName: 'Emotion Analysis Service'
  }
};

/**
 * Create a config variant with multiplexer disabled for backward compatibility
 */
export const legacyUnifiedEmotionConfig: UnifiedEmotionConfig = {
  ...defaultUnifiedEmotionConfig,
  audio: {
    ...defaultUnifiedEmotionConfig.audio,
    useMultiplexer: false // Disable multiplexer for legacy mode
  }
};

/**
 * Create a config variant optimized for AI therapist voice chat
 */
export const aiTherapistEmotionConfig: UnifiedEmotionConfig = {
  ...defaultUnifiedEmotionConfig,
  audio: {
    ...defaultUnifiedEmotionConfig.audio,
    consumerPriority: 6, // Lower priority to allow STT higher priority
    consumerName: 'AI Therapist Emotion Analysis'
  },
  multimodal: {
    ...defaultUnifiedEmotionConfig.multimodal,
    preferredMode: 'multimodal', // Force multimodal for comprehensive analysis
  },
  performance: {
    ...defaultUnifiedEmotionConfig.performance,
    targetLatency: 150, // Slightly higher latency acceptable for therapist context
  }
};