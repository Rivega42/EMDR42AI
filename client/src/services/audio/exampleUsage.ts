/**
 * Example usage of AudioStreamMultiplexer with UnifiedEmotionService
 * Demonstrates conflict-free audio access for multiple consumers
 */

import { UnifiedEmotionService } from '../emotion/emotionService';
import { defaultUnifiedEmotionConfig, aiTherapistEmotionConfig } from '../emotion/defaultEmotionConfig';
import { getAudioStreamMultiplexer } from './audioStreamMultiplexer';
import type { AudioConsumer } from '@/../../shared/types';

/**
 * Example: Setting up emotion analysis with AudioStreamMultiplexer
 */
export async function setupEmotionAnalysisWithMultiplexer() {
  try {
    // Create emotion service with multiplexer enabled
    const emotionService = new UnifiedEmotionService(defaultUnifiedEmotionConfig);
    
    // Initialize the service (this will set up the AudioStreamMultiplexer)
    await emotionService.initialize();
    
    // Set up emotion callbacks
    emotionService.onEmotion((emotion) => {
      console.log('🎭 Emotion detected:', {
        timestamp: emotion.timestamp,
        arousal: emotion.arousal.toFixed(2),
        valence: emotion.valence.toFixed(2),
        dominantSource: emotion.fusion.dominantSource,
        confidence: emotion.fusion.confidence.toFixed(2)
      });
    });
    
    // Start emotion recognition
    await emotionService.startRecognition();
    
    console.log('✅ Emotion analysis started with AudioStreamMultiplexer');
    
    return emotionService;
    
  } catch (error) {
    console.error('❌ Failed to setup emotion analysis:', error);
    throw error;
  }
}

/**
 * Example: Adding an AI therapist voice chat consumer
 */
export async function addAITherapistConsumer() {
  try {
    // Get the shared multiplexer instance
    const multiplexer = getAudioStreamMultiplexer();
    
    // Create AI therapist voice chat consumer
    const aiConsumer: AudioConsumer = {
      id: 'ai-therapist-stt',
      name: 'AI Therapist Voice Chat',
      type: 'voice-chat',
      priority: 9, // High priority for real-time conversation
      active: true,
      config: {
        sampleRate: 16000,
        channels: 1,
        bufferSize: 2048, // Smaller buffer for lower latency
        enableEchoCancellation: true,
        enableNoiseSuppression: true,
        enableAutoGainControl: true
      },
      onAudioData: (audioData: Float32Array, sampleRate: number) => {
        // Send to speech-to-text service
        console.log(`🎤 AI Therapist received audio: ${audioData.length} samples at ${sampleRate}Hz`);
        // In a real implementation, this would send to STT service
        processAudioForSTT(audioData, sampleRate);
      },
      onAudioChunk: (audioChunk: Blob) => {
        // Alternative chunk-based processing
        console.log(`📦 AI Therapist received audio chunk: ${audioChunk.size} bytes`);
      },
      onStatusChange: (status) => {
        console.log('🔄 AI Therapist consumer status:', status);
      },
      onError: (error) => {
        console.error('❌ AI Therapist consumer error:', error);
      }
    };
    
    // Add consumer to multiplexer
    const success = await multiplexer.addConsumer(aiConsumer);
    
    if (success) {
      console.log('✅ AI Therapist consumer added to multiplexer');
      return aiConsumer.id;
    } else {
      throw new Error('Failed to add AI Therapist consumer');
    }
    
  } catch (error) {
    console.error('❌ Failed to add AI Therapist consumer:', error);
    throw error;
  }
}

/**
 * Example: Adding a recording consumer
 */
export async function addRecordingConsumer() {
  try {
    const multiplexer = getAudioStreamMultiplexer();
    
    // Create recording consumer
    const recordingConsumer: AudioConsumer = {
      id: 'session-recorder',
      name: 'Session Recorder',
      type: 'recording',
      priority: 4, // Lower priority
      active: true,
      config: {
        sampleRate: 44100, // Higher quality for recording
        channels: 2, // Stereo for recording
        bufferSize: 8192, // Larger buffer for stability
        enableEchoCancellation: false, // Preserve original audio
        enableNoiseSuppression: false,
        enableAutoGainControl: false
      },
      onAudioChunk: (audioChunk: Blob) => {
        // Save audio chunks for session recording
        console.log(`💾 Recording audio chunk: ${audioChunk.size} bytes`);
        saveAudioChunk(audioChunk);
      },
      onStatusChange: (status) => {
        console.log('📹 Recording consumer status:', status);
      },
      onError: (error) => {
        console.error('❌ Recording consumer error:', error);
      }
    };
    
    const success = await multiplexer.addConsumer(recordingConsumer);
    
    if (success) {
      console.log('✅ Recording consumer added to multiplexer');
      return recordingConsumer.id;
    } else {
      throw new Error('Failed to add recording consumer');
    }
    
  } catch (error) {
    console.error('❌ Failed to add recording consumer:', error);
    throw error;
  }
}

/**
 * Example: Managing multiple consumers
 */
export async function demonstrateMultipleConsumers() {
  try {
    console.log('🚀 Starting multi-consumer audio demo...');
    
    // 1. Set up emotion analysis
    const emotionService = await setupEmotionAnalysisWithMultiplexer();
    
    // 2. Add AI therapist consumer
    const aiConsumerId = await addAITherapistConsumer();
    
    // 3. Add recording consumer
    const recordingConsumerId = await addRecordingConsumer();
    
    // 4. Get multiplexer status
    const multiplexer = getAudioStreamMultiplexer();
    const status = multiplexer.getStatus();
    
    console.log('📊 AudioStreamMultiplexer Status:', {
      isStreaming: status.isStreaming,
      activeConsumers: status.activeConsumers,
      masterStream: status.masterStream,
      performance: status.performance,
      health: status.health
    });
    
    // 5. Demonstrate consumer management
    setTimeout(async () => {
      console.log('🔄 Pausing recording after 10 seconds...');
      await multiplexer.updateConsumer(recordingConsumerId, { active: false });
    }, 10000);
    
    setTimeout(async () => {
      console.log('▶️ Resuming recording after 15 seconds...');
      await multiplexer.updateConsumer(recordingConsumerId, { active: true });
    }, 15000);
    
    return {
      emotionService,
      aiConsumerId,
      recordingConsumerId,
      multiplexer
    };
    
  } catch (error) {
    console.error('❌ Multi-consumer demo failed:', error);
    throw error;
  }
}

/**
 * Example: Graceful cleanup
 */
export async function cleanupAudioServices(services: any) {
  try {
    console.log('🧹 Cleaning up audio services...');
    
    // Stop emotion recognition
    if (services.emotionService) {
      await services.emotionService.stopRecognition();
    }
    
    // Remove consumers
    if (services.multiplexer) {
      if (services.aiConsumerId) {
        await services.multiplexer.removeConsumer(services.aiConsumerId);
      }
      if (services.recordingConsumerId) {
        await services.multiplexer.removeConsumer(services.recordingConsumerId);
      }
      
      // Dispose multiplexer
      await services.multiplexer.dispose();
    }
    
    console.log('✅ Audio services cleaned up successfully');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// === Helper Functions ===

/**
 * Mock STT processing function
 */
function processAudioForSTT(audioData: Float32Array, sampleRate: number): void {
  // In a real implementation, this would:
  // 1. Send audio to STT service (OpenAI Whisper, Google STT, etc.)
  // 2. Get transcribed text
  // 3. Send to AI therapist service
  
  // For demo purposes, just log
  const rms = Math.sqrt(audioData.reduce((sum, sample) => sum + sample * sample, 0) / audioData.length);
  if (rms > 0.01) { // Voice activity detected
    console.log(`🗣️ Speech detected for STT processing (RMS: ${rms.toFixed(4)})`);
  }
}

/**
 * Mock audio chunk saving function
 */
function saveAudioChunk(audioChunk: Blob): void {
  // In a real implementation, this would:
  // 1. Accumulate audio chunks
  // 2. Save to file or cloud storage
  // 3. Manage storage limits
  
  // For demo purposes, just log
  console.log(`💾 Saving audio chunk to session recording`);
}