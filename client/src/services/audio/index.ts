/**
 * AudioStreamMultiplexer Service - Main Export
 * Provides clean exports for the audio multiplexing system
 */

export { 
  AudioStreamMultiplexer, 
  getAudioStreamMultiplexer, 
  resetAudioStreamMultiplexer,
  defaultMultiplexerConfig 
} from './audioStreamMultiplexer';

export { 
  setupEmotionAnalysisWithMultiplexer,
  addAITherapistConsumer,
  addRecordingConsumer,
  demonstrateMultipleConsumers,
  cleanupAudioServices
} from './exampleUsage';

// Re-export types for convenience
export type {
  AudioConsumer,
  AudioConsumerStatus,
  AudioStreamMultiplexerConfig,
  AudioStreamMultiplexerStatus,
  AudioStreamMultiplexerMetrics
} from '@/../../shared/types';