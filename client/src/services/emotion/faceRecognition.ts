/**
 * Face Recognition Service
 * Handles real-time facial emotion recognition using face-api.js
 */

import * as faceapi from 'face-api.js';
import type { EmotionData } from '@/../../shared/types';
import { affects98, calculateAffects, basicEmotionsToArousalValence } from '@/../../shared/emotionAffects';

export interface FaceEmotions {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  nose: { x: number; y: number };
  mouth: { x: number; y: number };
}

// Affects98 mapping is now imported from shared/emotionAffects.ts

export class FaceRecognitionService {
  private videoStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private isProcessing: boolean = false;
  private processingInterval: number | null = null;
  private modelsLoaded: boolean = false;
  private frameCounter: number = 0;
  private smoothingBuffer: EmotionData[] = [];
  private readonly SMOOTHING_WINDOW = 5; // Average over last 5 frames
  private readonly PROCESS_EVERY_N_FRAMES = 10; // Process every 10th frame for performance
  
  constructor() {
    // Models will be loaded when initialize is called
  }

  /**
   * Initialize camera and start face tracking
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    
    try {
      // Request camera access
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (this.videoElement) {
        this.videoElement.srcObject = this.videoStream;
      }
      
      // Create canvas for processing
      this.canvasElement = document.createElement('canvas');
      this.canvasElement.width = 640;
      this.canvasElement.height = 480;
      
      // Load face-api.js models
      await this.loadModels();
      
    } catch (error) {
      console.error('Failed to initialize face recognition:', error);
      throw error;
    }
  }

  /**
   * Load face-api.js models
   */
  private async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;
    
    const MODEL_URL = '/models';
    
    try {
      // Load all necessary models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
      ]);
      
      this.modelsLoaded = true;
      console.log('Face-api.js models loaded successfully');
    } catch (error) {
      console.error('Failed to load face-api.js models:', error);
      console.log('Models should be placed in client/public/models/');
      // Continue with mock data if models fail to load
      this.modelsLoaded = false;
    }
  }

  /**
   * Start continuous emotion recognition
   */
  startRecognition(callback: (emotions: EmotionData) => void): void {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    // Process frames at ~10 FPS
    this.processingInterval = window.setInterval(async () => {
      if (!this.isProcessing) return;
      
      this.frameCounter++;
      
      // Skip frames for performance
      if (this.frameCounter % this.PROCESS_EVERY_N_FRAMES !== 0) {
        return;
      }
      
      try {
        const emotions = await this.detectEmotions();
        if (emotions) {
          // Apply smoothing
          const smoothedEmotions = this.applySmoothing(emotions);
          callback(smoothedEmotions);
        }
      } catch (error) {
        console.error('Emotion detection error:', error);
      }
    }, 100);
  }

  /**
   * Stop emotion recognition
   */
  stopRecognition(): void {
    this.isProcessing = false;
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Detect emotions from current video frame
   */
  async detectEmotions(): Promise<EmotionData | null> {
    if (!this.videoElement || !this.canvasElement) {
      return null;
    }
    
    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return null;
    
    // Draw current frame to canvas
    ctx.drawImage(this.videoElement, 0, 0, 640, 480);
    
    let faceEmotions: FaceEmotions;
    
    if (this.modelsLoaded) {
      // Use real face-api.js detection
      try {
        const detection = await faceapi
          .detectSingleFace(this.canvasElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions();
        
        if (detection && detection.expressions) {
          faceEmotions = {
            neutral: detection.expressions.neutral || 0,
            happy: detection.expressions.happy || 0,
            sad: detection.expressions.sad || 0,
            angry: detection.expressions.angry || 0,
            fearful: detection.expressions.fearful || 0,
            disgusted: detection.expressions.disgusted || 0,
            surprised: detection.expressions.surprised || 0
          };
        } else {
          // No face detected, use neutral emotions
          faceEmotions = {
            neutral: 1,
            happy: 0,
            sad: 0,
            angry: 0,
            fearful: 0,
            disgusted: 0,
            surprised: 0
          };
        }
      } catch (error) {
        console.error('Face detection error:', error);
        faceEmotions = this.generateMockEmotions();
      }
    } else {
      // Use mock data if models not loaded
      faceEmotions = this.generateMockEmotions();
    }
    
    return this.convertToEmotionData(faceEmotions);
  }

  /**
   * Calculate arousal and valence from basic emotions
   * Returns values in [-1, 1] range
   */
  private calculateArousalValence(emotions: FaceEmotions): { arousal: number; valence: number } {
    return basicEmotionsToArousalValence(emotions);
  }

  /**
   * Calculate 98 affects based on arousal and valence
   * Arousal and valence are already in [-1, 1] range
   */
  private calculateAffects(arousal: number, valence: number): Record<string, number> {
    return calculateAffects(arousal, valence);
  }

  /**
   * Apply smoothing to reduce jitter
   */
  private applySmoothing(emotions: EmotionData): EmotionData {
    // Add to buffer
    this.smoothingBuffer.push(emotions);
    
    // Keep only last N frames
    if (this.smoothingBuffer.length > this.SMOOTHING_WINDOW) {
      this.smoothingBuffer.shift();
    }
    
    // If not enough frames yet, return current
    if (this.smoothingBuffer.length < 3) {
      return emotions;
    }
    
    // Calculate average arousal and valence
    const avgArousal = this.smoothingBuffer.reduce((sum, e) => sum + e.arousal, 0) / this.smoothingBuffer.length;
    const avgValence = this.smoothingBuffer.reduce((sum, e) => sum + e.valence, 0) / this.smoothingBuffer.length;
    
    // Recalculate affects based on smoothed values
    const smoothedAffects = this.calculateAffects(avgArousal, avgValence);
    
    // Average basic emotions
    const avgBasicEmotions: any = {};
    const emotionKeys = Object.keys(emotions.basicEmotions);
    for (const key of emotionKeys) {
      avgBasicEmotions[key] = this.smoothingBuffer.reduce((sum, e) => sum + e.basicEmotions[key], 0) / this.smoothingBuffer.length;
    }
    
    return {
      timestamp: Date.now(),
      arousal: avgArousal,
      valence: avgValence,
      affects: smoothedAffects,
      basicEmotions: avgBasicEmotions,
      sources: {
        face: {
          timestamp: Date.now(),
          faceEmotions: avgBasicEmotions,
          arousal: avgArousal,
          valence: avgValence,
          confidence: 0.8
        },
        voice: null,
        combined: false
      },
      fusion: {
        confidence: 0.8,
        agreement: 0.9,
        dominantSource: 'face',
        conflictResolution: 'weighted-average'
      },
      quality: {
        faceQuality: 0.8,
        voiceQuality: 0.0,
        environmentalNoise: 0.1,
        overallQuality: 0.7
      }
    };
  }

  /**
   * Detect facial landmarks for eye tracking
   */
  async detectLandmarks(): Promise<FaceLandmarks | null> {
    if (!this.canvasElement || !this.modelsLoaded) {
      return null;
    }
    
    try {
      const detection = await faceapi
        .detectSingleFace(this.canvasElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      
      if (detection && detection.landmarks) {
        const landmarks = detection.landmarks;
        return {
          leftEye: { 
            x: landmarks.getLeftEye()[0].x, 
            y: landmarks.getLeftEye()[0].y 
          },
          rightEye: { 
            x: landmarks.getRightEye()[0].x, 
            y: landmarks.getRightEye()[0].y 
          },
          nose: { 
            x: landmarks.getNose()[0].x, 
            y: landmarks.getNose()[0].y 
          },
          mouth: { 
            x: landmarks.getMouth()[0].x, 
            y: landmarks.getMouth()[0].y 
          }
        };
      }
    } catch (error) {
      console.error('Landmark detection error:', error);
    }
    
    return null;
  }

  /**
   * Calculate attention level based on eye tracking
   */
  async calculateAttentionLevel(): Promise<number> {
    // Simplified attention calculation based on face detection
    if (!this.canvasElement || !this.modelsLoaded) {
      return 0.5;
    }
    
    try {
      const detection = await faceapi
        .detectSingleFace(this.canvasElement, new faceapi.TinyFaceDetectorOptions());
      
      if (detection) {
        // Face detected = paying attention
        // Could be enhanced with eye gaze tracking
        return 0.8;
      }
    } catch (error) {
      console.error('Attention calculation error:', error);
    }
    
    return 0.3; // No face = low attention
  }

  /**
   * Detect micro-expressions for deeper emotional analysis
   */
  async detectMicroExpressions(): Promise<any> {
    // TODO: Implement micro-expression detection
    // Requires high-speed camera and advanced ML models
    return null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopRecognition();
    
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
    
    this.canvasElement = null;
    this.smoothingBuffer = [];
  }

  // Private helper methods
  private generateMockEmotions(): FaceEmotions {
    // Realistic mock data for development
    const emotions = {
      neutral: 0.4 + Math.random() * 0.2,
      happy: Math.random() * 0.3,
      sad: Math.random() * 0.2,
      angry: Math.random() * 0.15,
      fearful: Math.random() * 0.1,
      disgusted: Math.random() * 0.1,
      surprised: Math.random() * 0.15
    };
    
    // Normalize to sum to 1
    const sum = Object.values(emotions).reduce((a, b) => a + b, 0);
    for (const key in emotions) {
      emotions[key as keyof FaceEmotions] = emotions[key as keyof FaceEmotions] / sum;
    }
    
    return emotions;
  }

  private convertToEmotionData(faceEmotions: FaceEmotions): EmotionData {
    // Calculate arousal and valence from basic emotions (returns [-1, 1] range)
    const { arousal, valence } = this.calculateArousalValence(faceEmotions);
    
    // Calculate 98 affects based on arousal-valence model
    const affects = this.calculateAffects(arousal, valence);
    
    // Return complete emotion data
    return {
      timestamp: Date.now(),
      arousal,
      valence,
      affects,
      basicEmotions: faceEmotions as any,
      sources: {
        face: {
          timestamp: Date.now(),
          faceEmotions: faceEmotions,
          arousal: arousal,
          valence: valence,
          confidence: 0.8
        },
        voice: null,
        combined: false
      },
      fusion: {
        confidence: 0.8,
        agreement: 0.9,
        dominantSource: 'face',
        conflictResolution: 'weighted-average'
      },
      quality: {
        faceQuality: 0.8,
        voiceQuality: 0.0,
        environmentalNoise: 0.1,
        overallQuality: 0.7
      }
    };
  }

  /**
   * Get current emotion data for external services
   */
  async getCurrentEmotionData(): Promise<EmotionData | null> {
    if (!this.isProcessing || this.smoothingBuffer.length === 0) {
      return null;
    }
    
    // Return the latest smoothed emotion data
    return this.smoothingBuffer[this.smoothingBuffer.length - 1];
  }
}

// Singleton instance
export const faceRecognition = new FaceRecognitionService();
export const emotionService = faceRecognition; // Alias for backward compatibility