/**
 * Face Recognition Service
 * Handles real-time facial emotion recognition using face-api.js
 */

import * as faceapi from 'face-api.js';
import type { EmotionData } from '@/../../shared/types';

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

// Complete 98 affects mapping from Circumplex model
const affects98 = {
  "Adventurous": { arousal: 0.4, valence: 0.6 },
  "Afraid": { arousal: 0.7, valence: -0.6 },
  "Alarmed": { arousal: 0.8, valence: -0.5 },
  "Ambitious": { arousal: 0.5, valence: 0.4 },
  "Amorous": { arousal: 0.3, valence: 0.7 },
  "Amused": { arousal: 0.3, valence: 0.6 },
  "Angry": { arousal: 0.7, valence: -0.7 },
  "Annoyed": { arousal: 0.4, valence: -0.4 },
  "Anxious": { arousal: 0.6, valence: -0.3 },
  "Apathetic": { arousal: -0.6, valence: -0.2 },
  "Aroused": { arousal: 0.8, valence: 0.3 },
  "Ashamed": { arousal: -0.2, valence: -0.6 },
  "Astonished": { arousal: 0.7, valence: 0.2 },
  "At Ease": { arousal: -0.3, valence: 0.4 },
  "Attentive": { arousal: 0.2, valence: 0.3 },
  "Bellicose": { arousal: 0.6, valence: -0.5 },
  "Bitter": { arousal: 0.1, valence: -0.7 },
  "Bored": { arousal: -0.5, valence: -0.3 },
  "Calm": { arousal: -0.4, valence: 0.3 },
  "Compassionate": { arousal: 0.1, valence: 0.6 },
  "Conceited": { arousal: 0.2, valence: 0.1 },
  "Confident": { arousal: 0.3, valence: 0.5 },
  "Conscientious": { arousal: 0.2, valence: 0.4 },
  "Contemplative": { arousal: -0.1, valence: 0.2 },
  "Contemptuous": { arousal: 0.2, valence: -0.6 },
  "Content": { arousal: -0.2, valence: 0.6 },
  "Convinced": { arousal: 0.1, valence: 0.4 },
  "Courageous": { arousal: 0.5, valence: 0.5 },
  "Defiant": { arousal: 0.5, valence: -0.3 },
  "Dejected": { arousal: -0.4, valence: -0.5 },
  "Delighted": { arousal: 0.5, valence: 0.8 },
  "Depressed": { arousal: -0.6, valence: -0.7 },
  "Desperate": { arousal: 0.5, valence: -0.8 },
  "Despondent": { arousal: -0.5, valence: -0.6 },
  "Determined": { arousal: 0.4, valence: 0.3 },
  "Disappointed": { arousal: -0.2, valence: -0.5 },
  "Discontented": { arousal: -0.1, valence: -0.4 },
  "Disgusted": { arousal: 0.3, valence: -0.7 },
  "Dissatisfied": { arousal: 0.0, valence: -0.4 },
  "Distressed": { arousal: 0.6, valence: -0.6 },
  "Distrustful": { arousal: 0.2, valence: -0.3 },
  "Doubtful": { arousal: 0.1, valence: -0.2 },
  "Droopy": { arousal: -0.7, valence: -0.3 },
  "Embarrassed": { arousal: 0.3, valence: -0.4 },
  "Enraged": { arousal: 0.9, valence: -0.8 },
  "Enthusiastic": { arousal: 0.7, valence: 0.7 },
  "Envious": { arousal: 0.3, valence: -0.5 },
  "Excited": { arousal: 0.8, valence: 0.6 },
  "Expectant": { arousal: 0.3, valence: 0.2 },
  "Feel Guilt": { arousal: -0.1, valence: -0.5 },
  "Feel Well": { arousal: 0.1, valence: 0.7 },
  "Feeling Superior": { arousal: 0.3, valence: 0.2 },
  "Friendly": { arousal: 0.2, valence: 0.7 },
  "Frustrated": { arousal: 0.5, valence: -0.6 },
  "Glad": { arousal: 0.4, valence: 0.7 },
  "Gloomy": { arousal: -0.3, valence: -0.6 },
  "Happy": { arousal: 0.4, valence: 0.8 },
  "Hateful": { arousal: 0.6, valence: -0.8 },
  "Hesitant": { arousal: 0.0, valence: -0.1 },
  "Hopeful": { arousal: 0.2, valence: 0.5 },
  "Hostile": { arousal: 0.7, valence: -0.7 },
  "Impatient": { arousal: 0.5, valence: -0.2 },
  "Impressed": { arousal: 0.4, valence: 0.5 },
  "Indignant": { arousal: 0.4, valence: -0.5 },
  "Insulted": { arousal: 0.5, valence: -0.6 },
  "Interested": { arousal: 0.3, valence: 0.4 },
  "Jealous": { arousal: 0.4, valence: -0.6 },
  "Joyous": { arousal: 0.6, valence: 0.9 },
  "Languid": { arousal: -0.6, valence: 0.1 },
  "Lonely": { arousal: -0.3, valence: -0.5 },
  "Lovestruck": { arousal: 0.4, valence: 0.8 },
  "Lusting": { arousal: 0.7, valence: 0.5 },
  "Melancholic": { arousal: -0.4, valence: -0.4 },
  "Miserable": { arousal: -0.2, valence: -0.8 },
  "Passive": { arousal: -0.5, valence: 0.0 },
  "Peaceful": { arousal: -0.5, valence: 0.5 },
  "Pensive": { arousal: -0.2, valence: 0.1 },
  "Placid": { arousal: -0.6, valence: 0.3 },
  "Pleased": { arousal: 0.2, valence: 0.6 },
  "Polite": { arousal: 0.0, valence: 0.4 },
  "Quiet": { arousal: -0.4, valence: 0.1 },
  "Relaxed": { arousal: -0.5, valence: 0.6 },
  "Reverent": { arousal: -0.1, valence: 0.3 },
  "Sad": { arousal: -0.3, valence: -0.6 },
  "Satisfied": { arousal: -0.1, valence: 0.7 },
  "Scared": { arousal: 0.8, valence: -0.7 },
  "Serene": { arousal: -0.4, valence: 0.6 },
  "Sleepy": { arousal: -0.8, valence: 0.0 },
  "Solemn": { arousal: -0.2, valence: 0.0 },
  "Still": { arousal: -0.7, valence: 0.2 },
  "Surprised": { arousal: 0.8, valence: 0.1 },
  "Suspicious": { arousal: 0.3, valence: -0.3 },
  "Tense": { arousal: 0.7, valence: -0.4 },
  "Terrified": { arousal: 0.9, valence: -0.9 },
  "Tired": { arousal: -0.7, valence: -0.2 },
  "Tranquil": { arousal: -0.6, valence: 0.4 },
  "Troubled": { arousal: 0.4, valence: -0.4 },
  "Vigorous": { arousal: 0.8, valence: 0.4 }
};

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
  private readonly PROCESS_EVERY_N_FRAMES = 3; // Process every 3rd frame for performance
  
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
   * Calculate arousal from basic emotions
   */
  private calculateArousal(emotions: FaceEmotions): number {
    // High arousal emotions: angry, fearful, surprised, excited (happy)
    // Low arousal emotions: sad, neutral, disgusted
    const highArousal = emotions.angry * 0.8 + 
                       emotions.fearful * 0.9 + 
                       emotions.surprised * 0.8 + 
                       emotions.happy * 0.6;
    
    const lowArousal = emotions.sad * -0.3 + 
                      emotions.neutral * -0.1 + 
                      emotions.disgusted * 0.3;
    
    // Normalize to 0-1 range
    const arousal = (highArousal + lowArousal + 0.5) / 2;
    return Math.max(0, Math.min(1, arousal));
  }

  /**
   * Calculate valence from basic emotions
   */
  private calculateValence(emotions: FaceEmotions): number {
    // Positive valence: happy, surprised (slightly)
    // Negative valence: sad, angry, fearful, disgusted
    const positive = emotions.happy * 0.9 + 
                    emotions.surprised * 0.1 +
                    emotions.neutral * 0.1;
    
    const negative = emotions.sad * -0.7 + 
                    emotions.angry * -0.8 + 
                    emotions.fearful * -0.6 + 
                    emotions.disgusted * -0.7;
    
    // Normalize to 0-1 range
    const valence = (positive + negative + 1) / 2;
    return Math.max(0, Math.min(1, valence));
  }

  /**
   * Calculate 98 affects based on arousal and valence
   */
  private calculateAffects(arousal: number, valence: number): Record<string, number> {
    const affects: Record<string, number> = {};
    
    // Convert arousal and valence to -1 to 1 range for comparison
    const scaledArousal = arousal * 2 - 1;
    const scaledValence = valence * 2 - 1;
    
    // Calculate distance-based probability for each affect
    for (const [name, coords] of Object.entries(affects98)) {
      // Euclidean distance in arousal-valence space
      const distance = Math.sqrt(
        Math.pow(scaledArousal - coords.arousal, 2) + 
        Math.pow(scaledValence - coords.valence, 2)
      );
      
      // Convert distance to probability (0-1)
      // Max distance is ~2.83 (corner to corner), so normalize
      const maxDistance = 2.83;
      const normalizedDistance = distance / maxDistance;
      
      // Use gaussian-like function for smoother probability distribution
      affects[name] = Math.exp(-2 * normalizedDistance * normalizedDistance);
    }
    
    // Normalize affects so they sum to approximately 1
    const sum = Object.values(affects).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (const name in affects) {
        affects[name] = affects[name] / sum;
      }
    }
    
    return affects;
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
      basicEmotions: avgBasicEmotions
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
    // Calculate arousal and valence from basic emotions
    const arousal = this.calculateArousal(faceEmotions);
    const valence = this.calculateValence(faceEmotions);
    
    // Calculate 98 affects based on arousal-valence model
    const affects = this.calculateAffects(arousal, valence);
    
    // Return complete emotion data
    return {
      timestamp: Date.now(),
      arousal,
      valence,
      affects,
      basicEmotions: faceEmotions as any
    };
  }
}

// Singleton instance
export const faceRecognition = new FaceRecognitionService();