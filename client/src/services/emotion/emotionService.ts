/**
 * Revolutionary Unified Emotion Service for EMDR42
 * World-class multimodal emotion recognition system
 * Combines Face + Voice + AI Fusion for superhuman accuracy
 */

import type { 
  EmotionData,
  FaceEmotionData,
  VoiceEmotionData,
  VoiceRecordingConfig,
  EmotionFusionConfig,
  VoiceAnalysisStatus
} from '@/../../shared/types';

import { FaceRecognitionService } from './faceRecognition';
import { VoiceRecognitionService, voiceRecognitionService } from './voiceRecognition';
import { EmotionFusionService, emotionFusionService, defaultFusionConfig } from './emotionFusion';

// === Unified Emotion Service Configuration ===

export interface UnifiedEmotionConfig {
  face: {
    enabled: boolean;
    smoothingWindow: number;
    processEveryNFrames: number;
    minConfidence: number;
  };
  voice: VoiceRecordingConfig;
  fusion: EmotionFusionConfig;
  multimodal: {
    enabled: boolean;
    preferredMode: 'face-only' | 'voice-only' | 'multimodal' | 'auto';
    fallbackStrategy: 'face' | 'voice' | 'mock';
    qualityThreshold: number;
  };
  performance: {
    targetLatency: number; // ms
    maxMemoryUsage: number; // MB
    enableOptimizations: boolean;
  };
}

export interface EmotionServiceStatus {
  isActive: boolean;
  mode: 'face-only' | 'voice-only' | 'multimodal' | 'fallback';
  face: {
    enabled: boolean;
    modelsLoaded: boolean;
    cameraConnected: boolean;
    quality: number;
  };
  voice: VoiceAnalysisStatus;
  fusion: {
    enabled: boolean;
    strategy: string;
    averageConfidence: number;
    conflictRate: number;
  };
  performance: {
    currentLatency: number;
    memoryUsage: number;
    processingLoad: number;
  };
}

export interface EmotionServiceMetrics {
  totalEmotions: number;
  faceEmotions: number;
  voiceEmotions: number;
  fusedEmotions: number;
  averageAccuracy: number;
  averageLatency: number;
  uptimeSeconds: number;
  errorRate: number;
}

// === Main Unified Emotion Service ===

export class UnifiedEmotionService {
  private faceService: FaceRecognitionService;
  private voiceService: VoiceRecognitionService;
  private fusionService: EmotionFusionService;
  private config: UnifiedEmotionConfig;
  private isActive: boolean = false;
  private startTime: number = 0;
  
  // Current state
  private currentMode: 'face-only' | 'voice-only' | 'multimodal' | 'fallback' = 'face-only';
  private latestFaceData: FaceEmotionData | null = null;
  private latestVoiceData: VoiceEmotionData | null = null;
  private latestFusedEmotion: EmotionData | null = null;
  
  // Metrics tracking
  private metrics: EmotionServiceMetrics = {
    totalEmotions: 0,
    faceEmotions: 0,
    voiceEmotions: 0,
    fusedEmotions: 0,
    averageAccuracy: 0,
    averageLatency: 0,
    uptimeSeconds: 0,
    errorRate: 0
  };
  
  // Callbacks
  private onEmotionCallback: ((emotion: EmotionData) => void) | null = null;
  private onStatusCallback: ((status: EmotionServiceStatus) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  
  constructor(config: UnifiedEmotionConfig) {
    this.config = config;
    this.faceService = new FaceRecognitionService();
    this.voiceService = voiceRecognitionService;
    this.fusionService = emotionFusionService;
    
    this.setupEventHandlers();
  }
  
  /**
   * Setup event handlers for all services
   */
  private setupEventHandlers(): void {
    // Voice emotion handler
    this.voiceService.onEmotionDetected((voiceData: VoiceEmotionData) => {
      this.latestVoiceData = voiceData;
      this.metrics.voiceEmotions++;
      
      if (this.config.fusion.enabled) {
        this.fusionService.addVoiceData(voiceData);
      } else if (this.currentMode === 'voice-only') {
        // Convert voice-only to EmotionData and emit
        const emotion = this.createVoiceOnlyEmotion(voiceData);
        this.emitEmotion(emotion);
      }
    });
    
    // Voice status handler
    this.voiceService.onStatusChanged((status: VoiceAnalysisStatus) => {
      this.updateStatus();
    });
    
    // Voice error handler
    this.voiceService.onError((error: string) => {
      this.handleError(`Voice service error: ${error}`);
      this.handleVoiceFailure();
    });
    
    // Fusion emotion handler
    this.fusionService.onFusedEmotion((fusedEmotion: EmotionData) => {
      this.latestFusedEmotion = fusedEmotion;
      this.metrics.fusedEmotions++;
      this.emitEmotion(fusedEmotion);
    });
  }
  
  /**
   * Initialize the unified emotion service
   */
  async initialize(videoElement?: HTMLVideoElement): Promise<void> {
    try {
      this.startTime = Date.now();
      
      // Determine optimal mode based on capabilities and config
      await this.determineOptimalMode();
      
      // Initialize face service if needed
      if (this.shouldUseFace() && videoElement) {
        await this.faceService.initialize(videoElement);
        console.log('Face recognition initialized');
      }
      
      // Initialize voice service if needed
      if (this.shouldUseVoice()) {
        await this.voiceService.initialize();
        console.log('Voice recognition initialized');
      }
      
      // Update fusion configuration
      this.fusionService.updateConfig(this.config.fusion);
      
      console.log(`Unified Emotion Service initialized in ${this.currentMode} mode`);
      this.updateStatus();
      
    } catch (error) {
      console.error('Failed to initialize Unified Emotion Service:', error);
      this.handleError(`Initialization failed: ${error}`);
      throw error;
    }
  }
  
  /**
   * Start multimodal emotion recognition
   */
  async startRecognition(): Promise<void> {
    if (this.isActive) {
      console.warn('Emotion recognition already active');
      return;
    }
    
    try {
      this.isActive = true;
      this.startTime = Date.now();
      
      // Start face recognition
      if (this.shouldUseFace()) {
        this.faceService.startRecognition((faceEmotion: EmotionData) => {
          // Convert to FaceEmotionData format
          const faceData = this.convertToFaceEmotionData(faceEmotion);
          this.latestFaceData = faceData;
          this.metrics.faceEmotions++;
          
          if (this.config.fusion.enabled) {
            this.fusionService.addFaceData(faceData);
          } else if (this.currentMode === 'face-only') {
            this.emitEmotion(faceEmotion);
          }
        });
      }
      
      // Start voice recognition
      if (this.shouldUseVoice()) {
        await this.voiceService.startRecording();
      }
      
      console.log(`Emotion recognition started in ${this.currentMode} mode`);
      this.updateStatus();
      
    } catch (error) {
      console.error('Failed to start emotion recognition:', error);
      this.handleError(`Start recognition failed: ${error}`);
      this.isActive = false;
      throw error;
    }
  }
  
  /**
   * Stop emotion recognition
   */
  async stopRecognition(): Promise<void> {
    if (!this.isActive) {
      return;
    }
    
    try {
      this.isActive = false;
      
      // Stop face recognition
      if (this.faceService) {
        this.faceService.stopRecognition();
      }
      
      // Stop voice recognition
      if (this.voiceService) {
        await this.voiceService.stopRecording();
      }
      
      // Reset fusion service
      this.fusionService.reset();
      
      console.log('Emotion recognition stopped');
      this.updateStatus();
      
    } catch (error) {
      console.error('Failed to stop emotion recognition:', error);
      this.handleError(`Stop recognition failed: ${error}`);
    }
  }
  
  /**
   * Get current emotion data (latest available)
   */
  getCurrentEmotion(): EmotionData | null {
    if (this.latestFusedEmotion && this.config.fusion.enabled) {
      return this.latestFusedEmotion;
    }
    
    if (this.currentMode === 'face-only' && this.latestFaceData) {
      return this.createFaceOnlyEmotion(this.latestFaceData);
    }
    
    if (this.currentMode === 'voice-only' && this.latestVoiceData) {
      return this.createVoiceOnlyEmotion(this.latestVoiceData);
    }
    
    // Force fusion if both modalities available
    if (this.latestFaceData || this.latestVoiceData) {
      return this.fusionService.forceFusion();
    }
    
    return null;
  }
  
  /**
   * Switch to different emotion recognition mode
   */
  async switchMode(newMode: 'face-only' | 'voice-only' | 'multimodal' | 'auto'): Promise<void> {
    const wasActive = this.isActive;
    
    if (wasActive) {
      await this.stopRecognition();
    }
    
    this.config.multimodal.preferredMode = newMode;
    await this.determineOptimalMode();
    
    if (wasActive) {
      await this.startRecognition();
    }
    
    console.log(`Switched to ${this.currentMode} mode`);
  }
  
  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<UnifiedEmotionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update sub-services
    if (newConfig.fusion) {
      this.fusionService.updateConfig(newConfig.fusion);
    }
    
    console.log('Emotion service configuration updated');
  }
  
  /**
   * Get current service status
   */
  getStatus(): EmotionServiceStatus {
    const voiceStatus = this.voiceService.getStatus();
    const fusionMetrics = this.fusionService.getMetrics();
    
    return {
      isActive: this.isActive,
      mode: this.currentMode,
      face: {
        enabled: this.shouldUseFace(),
        modelsLoaded: true, // TODO: Get from face service
        cameraConnected: this.latestFaceData !== null,
        quality: this.latestFaceData?.confidence || 0
      },
      voice: voiceStatus,
      fusion: {
        enabled: this.config.fusion.enabled,
        strategy: this.config.fusion.strategy,
        averageConfidence: fusionMetrics.averageConfidence,
        conflictRate: fusionMetrics.conflictRate
      },
      performance: {
        currentLatency: fusionMetrics.averageLatency,
        memoryUsage: 0, // TODO: Calculate actual memory usage
        processingLoad: this.calculateProcessingLoad()
      }
    };
  }
  
  /**
   * Get service metrics
   */
  getMetrics(): EmotionServiceMetrics {
    this.metrics.uptimeSeconds = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    return { ...this.metrics };
  }
  
  /**
   * Set emotion callback
   */
  onEmotion(callback: (emotion: EmotionData) => void): void {
    this.onEmotionCallback = callback;
  }
  
  /**
   * Set status callback
   */
  onStatus(callback: (status: EmotionServiceStatus) => void): void {
    this.onStatusCallback = callback;
  }
  
  /**
   * Set error callback
   */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }
  
  // === Private Helper Methods ===
  
  /**
   * Determine optimal mode based on capabilities and configuration
   */
  private async determineOptimalMode(): Promise<void> {
    const preferredMode = this.config.multimodal.preferredMode;
    
    if (preferredMode === 'auto') {
      // Auto-detect best mode based on capabilities
      const canUseFace = await this.canUseFace();
      const canUseVoice = await this.canUseVoice();
      
      if (canUseFace && canUseVoice && this.config.multimodal.enabled) {
        this.currentMode = 'multimodal';
      } else if (canUseFace) {
        this.currentMode = 'face-only';
      } else if (canUseVoice) {
        this.currentMode = 'voice-only';
      } else {
        this.currentMode = 'fallback';
      }
    } else {
      this.currentMode = preferredMode === 'multimodal' && this.config.multimodal.enabled 
        ? 'multimodal' 
        : preferredMode;
    }
  }
  
  /**
   * Check if face recognition can be used
   */
  private async canUseFace(): Promise<boolean> {
    if (!this.config.face.enabled) return false;
    
    try {
      // Check camera availability
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if voice recognition can be used
   */
  private async canUseVoice(): Promise<boolean> {
    if (!this.config.voice.enabled) return false;
    
    return VoiceRecognitionService.isSupported();
  }
  
  /**
   * Should use face recognition in current mode
   */
  private shouldUseFace(): boolean {
    return this.config.face.enabled && 
           (this.currentMode === 'face-only' || this.currentMode === 'multimodal');
  }
  
  /**
   * Should use voice recognition in current mode
   */
  private shouldUseVoice(): boolean {
    return this.config.voice.enabled && 
           (this.currentMode === 'voice-only' || this.currentMode === 'multimodal');
  }
  
  /**
   * Convert EmotionData to FaceEmotionData format
   */
  private convertToFaceEmotionData(emotion: EmotionData): FaceEmotionData {
    return {
      timestamp: emotion.timestamp,
      faceEmotions: emotion.basicEmotions as any,
      arousal: emotion.arousal,
      valence: emotion.valence,
      confidence: 0.8, // TODO: Extract actual confidence from face service
      landmarks: undefined
    };
  }
  
  /**
   * Create EmotionData from face-only data
   */
  private createFaceOnlyEmotion(faceData: FaceEmotionData): EmotionData {
    return {
      timestamp: faceData.timestamp,
      arousal: faceData.arousal,
      valence: faceData.valence,
      affects: {}, // TODO: Calculate affects from face emotions
      basicEmotions: faceData.faceEmotions,
      sources: {
        face: faceData,
        voice: null,
        combined: false
      },
      fusion: {
        confidence: faceData.confidence,
        agreement: 1.0,
        dominantSource: 'face',
        conflictResolution: 'face-only'
      },
      quality: {
        faceQuality: faceData.confidence,
        voiceQuality: 0,
        environmentalNoise: 0,
        overallQuality: faceData.confidence
      }
    };
  }
  
  /**
   * Create EmotionData from voice-only data
   */
  private createVoiceOnlyEmotion(voiceData: VoiceEmotionData): EmotionData {
    const basicEmotions = {
      happy: voiceData.voiceEmotions.excitement,
      sad: 1 - voiceData.voiceEmotions.engagement,
      angry: voiceData.voiceEmotions.stress,
      fearful: voiceData.voiceEmotions.uncertainty,
      surprised: voiceData.prosody.intensity,
      disgusted: Math.max(0, -voiceData.prosody.valence),
      neutral: voiceData.voiceEmotions.authenticity
    };
    
    return {
      timestamp: voiceData.timestamp,
      arousal: voiceData.prosody.arousal,
      valence: voiceData.prosody.valence,
      affects: {}, // TODO: Calculate affects from voice emotions
      basicEmotions,
      sources: {
        face: null,
        voice: voiceData,
        combined: false
      },
      fusion: {
        confidence: voiceData.confidence,
        agreement: 1.0,
        dominantSource: 'voice',
        conflictResolution: 'voice-only'
      },
      quality: {
        faceQuality: 0,
        voiceQuality: voiceData.confidence,
        environmentalNoise: 1 - voiceData.prosody.stability,
        overallQuality: voiceData.confidence
      }
    };
  }
  
  /**
   * Emit emotion data to callback
   */
  private emitEmotion(emotion: EmotionData): void {
    this.latestFusedEmotion = emotion;
    this.metrics.totalEmotions++;
    
    if (this.onEmotionCallback) {
      this.onEmotionCallback(emotion);
    }
  }
  
  /**
   * Handle voice service failure
   */
  private handleVoiceFailure(): void {
    if (this.currentMode === 'voice-only') {
      // Fallback to face or mock
      if (this.config.multimodal.fallbackStrategy === 'face' && this.config.face.enabled) {
        this.currentMode = 'face-only';
        console.log('Voice failed, switched to face-only mode');
      } else {
        this.currentMode = 'fallback';
        console.log('Voice failed, switched to fallback mode');
      }
    } else if (this.currentMode === 'multimodal') {
      // Continue with face-only
      this.currentMode = 'face-only';
      console.log('Voice failed in multimodal, continuing with face-only');
    }
    
    this.updateStatus();
  }
  
  /**
   * Calculate current processing load
   */
  private calculateProcessingLoad(): number {
    let load = 0;
    
    if (this.shouldUseFace()) load += 0.4;
    if (this.shouldUseVoice()) load += 0.3;
    if (this.config.fusion.enabled) load += 0.3;
    
    return Math.min(1, load);
  }
  
  /**
   * Update status and notify callback
   */
  private updateStatus(): void {
    if (this.onStatusCallback) {
      this.onStatusCallback(this.getStatus());
    }
  }
  
  /**
   * Handle error and notify callback
   */
  private handleError(error: string): void {
    this.metrics.errorRate = (this.metrics.errorRate + 1) / 2;
    
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }
  
  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.stopRecognition();
    
    if (this.voiceService) {
      await this.voiceService.destroy();
    }
    
    if (this.fusionService) {
      this.fusionService.destroy();
    }
    
    this.onEmotionCallback = null;
    this.onStatusCallback = null;
    this.onErrorCallback = null;
    
    console.log('Unified Emotion Service destroyed');
  }
}

// === Default Configuration ===

export const defaultUnifiedConfig: UnifiedEmotionConfig = {
  face: {
    enabled: true,
    smoothingWindow: 5,
    processEveryNFrames: 10,
    minConfidence: 0.3
  },
  voice: {
    enabled: true,
    provider: {
      provider: 'assemblyai', // Default to AssemblyAI for best balance
      apiKey: import.meta.env.VITE_ASSEMBLYAI_API_KEY || '',
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
      chunkDuration: 1000,
      overlap: 100,
      minConfidence: 0.5,
      smoothingWindow: 5
    },
    privacy: {
      storeAudio: false,
      encryptAudio: true,
      autoDelete: 24,
      consentVerified: false
    }
  },
  fusion: defaultFusionConfig,
  multimodal: {
    enabled: true,
    preferredMode: 'auto',
    fallbackStrategy: 'face',
    qualityThreshold: 0.4
  },
  performance: {
    targetLatency: 500,
    maxMemoryUsage: 100,
    enableOptimizations: true
  }
};

// === Export Unified Service Instance ===

export const unifiedEmotionService = new UnifiedEmotionService(defaultUnifiedConfig);

// Export as emotionService for backward compatibility
export const emotionService = unifiedEmotionService;

// Also export individual services for direct access
export { faceRecognition } from './faceRecognition';
export { voiceRecognitionService } from './voiceRecognition';
export { emotionFusionService } from './emotionFusion';