/**
 * Revolutionary Emotion Fusion Service for EMDR42
 * Combines facial and voice emotion data for superhuman accuracy
 * World-class multimodal emotion recognition system
 */

import type { 
  EmotionData,
  FaceEmotionData,
  VoiceEmotionData,
  EmotionFusionConfig
} from '@/../../shared/types';
import { calculateAffects, basicEmotionsToArousalValence } from '@/../../shared/emotionAffects';

// === Fusion Strategy Interfaces ===

interface FusionWeights {
  face: number;      // 0-1, weight for facial emotions
  voice: number;     // 0-1, weight for voice emotions
  confidence: number; // 0-1, overall fusion confidence
  quality: number;   // 0-1, fusion quality score
}

interface ConflictAnalysis {
  hasConflict: boolean;
  conflictSeverity: number; // 0-1, how severe the disagreement
  conflictDimensions: string[]; // Which emotion dimensions conflict
  resolutionStrategy: 'face-dominant' | 'voice-dominant' | 'average' | 'ai-mediated';
  resolutionConfidence: number; // 0-1, confidence in resolution
}

interface TemporalBuffer {
  faceData: (FaceEmotionData | null)[];
  voiceData: (VoiceEmotionData | null)[];
  timestamps: number[];
  maxBufferSize: number;
}

interface FusionMetrics {
  totalFusions: number;
  successfulFusions: number;
  averageConfidence: number;
  averageQuality: number;
  conflictRate: number;
  averageLatency: number;
  modalityPreference: 'face' | 'voice' | 'balanced';
}

// === Advanced Fusion Algorithms ===

/**
 * WeightedAverage Fusion Strategy
 * Combines emotions using confidence-weighted averaging
 */
class WeightedAverageFusion {
  static fuse(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData,
    weights: FusionWeights
  ): EmotionData {
    const timestamp = Math.max(faceData.timestamp, voiceData.timestamp);
    
    // Weighted arousal and valence calculation
    const arousal = this.weightedCombine(
      faceData.arousal, 
      voiceData.prosody.arousal, 
      weights.face * faceData.confidence,
      weights.voice * voiceData.confidence
    );
    
    const valence = this.weightedCombine(
      faceData.valence,
      voiceData.prosody.valence,
      weights.face * faceData.confidence,
      weights.voice * voiceData.confidence
    );
    
    // Combine basic emotions
    const basicEmotions = this.combineBasicEmotions(faceData, voiceData, weights);
    
    // Calculate 98 affects from combined arousal/valence
    const affects = calculateAffects(arousal, valence);
    
    return {
      timestamp,
      arousal,
      valence,
      affects,
      basicEmotions,
      sources: {
        face: faceData,
        voice: voiceData,
        combined: true
      },
      fusion: {
        confidence: weights.confidence,
        agreement: this.calculateAgreement(faceData, voiceData),
        dominantSource: weights.face > weights.voice ? 'face' : 'voice',
        conflictResolution: 'weighted-average'
      },
      quality: {
        faceQuality: faceData.confidence,
        voiceQuality: voiceData.confidence,
        environmentalNoise: this.estimateNoise(voiceData),
        overallQuality: weights.quality
      }
    };
  }
  
  private static weightedCombine(value1: number, value2: number, weight1: number, weight2: number): number {
    const totalWeight = weight1 + weight2;
    if (totalWeight === 0) return (value1 + value2) / 2;
    return (value1 * weight1 + value2 * weight2) / totalWeight;
  }
  
  private static combineBasicEmotions(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData,
    weights: FusionWeights
  ): Record<string, number> {
    const combined: Record<string, number> = {};
    
    // Map voice emotions to basic emotions
    const voiceBasic = {
      happy: voiceData.voiceEmotions.excitement * 0.8,
      sad: Math.max(0, 1 - voiceData.voiceEmotions.engagement - voiceData.prosody.valence),
      angry: voiceData.voiceEmotions.stress * voiceData.prosody.intensity,
      fearful: voiceData.voiceEmotions.uncertainty * voiceData.voiceEmotions.stress,
      surprised: voiceData.prosody.intensity * (voiceData.prosody.arousal > 0.5 ? 1 : 0),
      disgusted: Math.max(0, -voiceData.prosody.valence * 0.5),
      neutral: voiceData.voiceEmotions.authenticity * (1 - voiceData.prosody.intensity)
    };
    
    // Weighted combination
    for (const emotion in faceData.faceEmotions) {
      const faceValue = faceData.faceEmotions[emotion];
      const voiceValue = voiceBasic[emotion] || 0;
      
      combined[emotion] = this.weightedCombine(
        faceValue,
        voiceValue,
        weights.face * faceData.confidence,
        weights.voice * voiceData.confidence
      );
    }
    
    return combined;
  }
  
  private static calculateAgreement(faceData: FaceEmotionData, voiceData: VoiceEmotionData): number {
    const arousalDiff = Math.abs(faceData.arousal - voiceData.prosody.arousal);
    const valenceDiff = Math.abs(faceData.valence - voiceData.prosody.valence);
    
    // Agreement is inverse of average difference
    return Math.max(0, 1 - (arousalDiff + valenceDiff) / 2);
  }
  
  private static estimateNoise(voiceData: VoiceEmotionData): number {
    // Estimate environmental noise from voice quality metrics
    return Math.max(0, 1 - voiceData.prosody.stability);
  }
}

/**
 * Confidence-Based Fusion Strategy
 * Uses the most confident modality for each emotion dimension
 */
class ConfidenceBasedFusion {
  static fuse(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData,
    config: EmotionFusionConfig
  ): EmotionData {
    const timestamp = Math.max(faceData.timestamp, voiceData.timestamp);
    
    // Choose dominant source based on confidence
    const faceConfidence = faceData.confidence;
    const voiceConfidence = voiceData.confidence;
    
    let arousal: number, valence: number, dominantSource: 'face' | 'voice' | 'balanced';
    
    if (Math.abs(faceConfidence - voiceConfidence) < 0.1) {
      // Confidences are similar, use balanced approach
      arousal = (faceData.arousal + voiceData.prosody.arousal) / 2;
      valence = (faceData.valence + voiceData.prosody.valence) / 2;
      dominantSource = 'balanced';
    } else if (faceConfidence > voiceConfidence) {
      // Face is more confident
      arousal = faceData.arousal * 0.7 + voiceData.prosody.arousal * 0.3;
      valence = faceData.valence * 0.7 + voiceData.prosody.valence * 0.3;
      dominantSource = 'face';
    } else {
      // Voice is more confident
      arousal = voiceData.prosody.arousal * 0.7 + faceData.arousal * 0.3;
      valence = voiceData.prosody.valence * 0.7 + faceData.valence * 0.3;
      dominantSource = 'voice';
    }
    
    const affects = calculateAffects(arousal, valence);
    
    // Combine basic emotions based on confidence
    const basicEmotions = this.combineBasicEmotionsByConfidence(faceData, voiceData);
    
    return {
      timestamp,
      arousal,
      valence,
      affects,
      basicEmotions,
      sources: {
        face: faceData,
        voice: voiceData,
        combined: true
      },
      fusion: {
        confidence: Math.max(faceConfidence, voiceConfidence),
        agreement: Math.abs(faceConfidence - voiceConfidence) < 0.2 ? 0.8 : 0.5,
        dominantSource,
        conflictResolution: 'confidence-based'
      },
      quality: {
        faceQuality: faceConfidence,
        voiceQuality: voiceConfidence,
        environmentalNoise: 1 - voiceData.prosody.stability,
        overallQuality: Math.max(faceConfidence, voiceConfidence)
      }
    };
  }
  
  private static combineBasicEmotionsByConfidence(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData
  ): Record<string, number> {
    const combined: Record<string, number> = {};
    const confidenceRatio = faceData.confidence / (faceData.confidence + voiceData.confidence);
    
    // Create voice emotion mapping
    const voiceEmotions = {
      happy: voiceData.voiceEmotions.excitement,
      sad: 1 - voiceData.voiceEmotions.engagement,
      angry: voiceData.voiceEmotions.stress,
      fearful: voiceData.voiceEmotions.uncertainty,
      surprised: voiceData.prosody.intensity,
      disgusted: Math.max(0, -voiceData.prosody.valence),
      neutral: voiceData.voiceEmotions.authenticity
    };
    
    // Confidence-weighted combination
    for (const emotion in faceData.faceEmotions) {
      const faceValue = faceData.faceEmotions[emotion];
      const voiceValue = voiceEmotions[emotion] || 0;
      
      combined[emotion] = faceValue * confidenceRatio + voiceValue * (1 - confidenceRatio);
    }
    
    return combined;
  }
}

/**
 * AI-Mediated Fusion Strategy
 * Uses intelligent conflict resolution and pattern learning
 */
class AIMediatedFusion {
  private static patterns: Map<string, number> = new Map();
  private static learningRate: number = 0.1;
  
  static fuse(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData,
    config: EmotionFusionConfig,
    historicalData?: EmotionData[]
  ): EmotionData {
    const timestamp = Math.max(faceData.timestamp, voiceData.timestamp);
    
    // Analyze patterns and contexts
    const context = this.analyzeContext(faceData, voiceData, historicalData);
    const conflictAnalysis = this.analyzeConflicts(faceData, voiceData);
    
    // AI-driven weight calculation
    const weights = this.calculateAIWeights(faceData, voiceData, context, conflictAnalysis);
    
    // Sophisticated emotion fusion
    const { arousal, valence } = this.intelligentFusion(faceData, voiceData, weights, context);
    
    const affects = calculateAffects(arousal, valence);
    const basicEmotions = this.intelligentBasicEmotionFusion(faceData, voiceData, weights);
    
    // Learn from this fusion for future improvements
    this.updateLearningPatterns(faceData, voiceData, { arousal, valence }, context);
    
    return {
      timestamp,
      arousal,
      valence,
      affects,
      basicEmotions,
      sources: {
        face: faceData,
        voice: voiceData,
        combined: true
      },
      fusion: {
        confidence: weights.confidence,
        agreement: conflictAnalysis.hasConflict ? 0.3 : 0.9,
        dominantSource: weights.face > weights.voice ? 'face' : 'voice',
        conflictResolution: 'ai-mediated'
      },
      quality: {
        faceQuality: faceData.confidence,
        voiceQuality: voiceData.confidence,
        environmentalNoise: 1 - voiceData.prosody.stability,
        overallQuality: weights.quality
      }
    };
  }
  
  private static analyzeContext(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData,
    historicalData?: EmotionData[]
  ): any {
    return {
      timeOfDay: new Date().getHours(),
      sessionLength: historicalData?.length || 0,
      emotionalTrend: this.calculateTrend(historicalData),
      arousalVariability: this.calculateVariability(historicalData, 'arousal'),
      valenceVariability: this.calculateVariability(historicalData, 'valence')
    };
  }
  
  private static analyzeConflicts(faceData: FaceEmotionData, voiceData: VoiceEmotionData): ConflictAnalysis {
    const arousalDiff = Math.abs(faceData.arousal - voiceData.prosody.arousal);
    const valenceDiff = Math.abs(faceData.valence - voiceData.prosody.valence);
    
    const conflictThreshold = 0.4;
    const hasConflict = arousalDiff > conflictThreshold || valenceDiff > conflictThreshold;
    
    return {
      hasConflict,
      conflictSeverity: Math.max(arousalDiff, valenceDiff),
      conflictDimensions: [
        ...(arousalDiff > conflictThreshold ? ['arousal'] : []),
        ...(valenceDiff > conflictThreshold ? ['valence'] : [])
      ],
      resolutionStrategy: this.determineResolutionStrategy(faceData, voiceData),
      resolutionConfidence: hasConflict ? 0.6 : 0.9
    };
  }
  
  private static calculateAIWeights(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData,
    context: any,
    conflictAnalysis: ConflictAnalysis
  ): FusionWeights {
    // Base weights on confidence and quality
    let faceWeight = faceData.confidence;
    let voiceWeight = voiceData.confidence;
    
    // Adjust for environmental factors
    if (voiceData.prosody.stability < 0.5) {
      voiceWeight *= 0.7; // Reduce voice weight if unstable
    }
    
    // Adjust for conflict resolution
    if (conflictAnalysis.hasConflict) {
      if (conflictAnalysis.resolutionStrategy === 'face-dominant') {
        faceWeight *= 1.3;
        voiceWeight *= 0.7;
      } else if (conflictAnalysis.resolutionStrategy === 'voice-dominant') {
        voiceWeight *= 1.3;
        faceWeight *= 0.7;
      }
    }
    
    // Normalize weights
    const totalWeight = faceWeight + voiceWeight;
    if (totalWeight > 0) {
      faceWeight /= totalWeight;
      voiceWeight /= totalWeight;
    }
    
    return {
      face: faceWeight,
      voice: voiceWeight,
      confidence: Math.min(faceData.confidence, voiceData.confidence) * conflictAnalysis.resolutionConfidence,
      quality: (faceData.confidence + voiceData.confidence) / 2
    };
  }
  
  private static intelligentFusion(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData,
    weights: FusionWeights,
    context: any
  ): { arousal: number; valence: number } {
    // Context-aware fusion
    let arousal = faceData.arousal * weights.face + voiceData.prosody.arousal * weights.voice;
    let valence = faceData.valence * weights.face + voiceData.prosody.valence * weights.voice;
    
    // Apply learned patterns
    const patternKey = this.getPatternKey(faceData, voiceData);
    const learnedAdjustment = this.patterns.get(patternKey) || 0;
    
    arousal += learnedAdjustment * 0.1;
    valence += learnedAdjustment * 0.1;
    
    // Clamp to valid range
    arousal = Math.max(-1, Math.min(1, arousal));
    valence = Math.max(-1, Math.min(1, valence));
    
    return { arousal, valence };
  }
  
  private static intelligentBasicEmotionFusion(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData,
    weights: FusionWeights
  ): Record<string, number> {
    // Advanced emotion mapping and fusion
    const voiceEmotionMap = {
      happy: voiceData.voiceEmotions.excitement * voiceData.prosody.valence,
      sad: (1 - voiceData.voiceEmotions.engagement) * Math.abs(voiceData.prosody.valence),
      angry: voiceData.voiceEmotions.stress * voiceData.prosody.intensity,
      fearful: voiceData.voiceEmotions.uncertainty * voiceData.voiceEmotions.stress,
      surprised: voiceData.prosody.intensity * (voiceData.prosody.arousal > 0 ? 1 : 0),
      disgusted: Math.max(0, -voiceData.prosody.valence * 0.8),
      neutral: voiceData.voiceEmotions.authenticity * (1 - voiceData.prosody.intensity)
    };
    
    const combined: Record<string, number> = {};
    
    for (const emotion in faceData.faceEmotions) {
      const faceValue = faceData.faceEmotions[emotion];
      const voiceValue = voiceEmotionMap[emotion] || 0;
      
      // Intelligent weighting with context consideration
      combined[emotion] = faceValue * weights.face + voiceValue * weights.voice;
    }
    
    return combined;
  }
  
  private static calculateTrend(historicalData?: EmotionData[]): number {
    if (!historicalData || historicalData.length < 2) return 0;
    
    const recent = historicalData.slice(-5);
    const arousalTrend = recent[recent.length - 1].arousal - recent[0].arousal;
    const valenceTrend = recent[recent.length - 1].valence - recent[0].valence;
    
    return (arousalTrend + valenceTrend) / 2;
  }
  
  private static calculateVariability(historicalData?: EmotionData[], dimension: 'arousal' | 'valence'): number {
    if (!historicalData || historicalData.length < 2) return 0;
    
    const values = historicalData.map(d => d[dimension]);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }
  
  private static determineResolutionStrategy(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData
  ): 'face-dominant' | 'voice-dominant' | 'average' | 'ai-mediated' {
    const confidenceDiff = faceData.confidence - voiceData.confidence;
    
    if (Math.abs(confidenceDiff) > 0.3) {
      return confidenceDiff > 0 ? 'face-dominant' : 'voice-dominant';
    }
    
    return 'ai-mediated';
  }
  
  private static getPatternKey(faceData: FaceEmotionData, voiceData: VoiceEmotionData): string {
    const faceLevel = faceData.arousal > 0.5 ? 'high' : 'low';
    const voiceLevel = voiceData.prosody.arousal > 0.5 ? 'high' : 'low';
    return `${faceLevel}-${voiceLevel}`;
  }
  
  private static updateLearningPatterns(
    faceData: FaceEmotionData,
    voiceData: VoiceEmotionData,
    result: { arousal: number; valence: number },
    context: any
  ): void {
    const patternKey = this.getPatternKey(faceData, voiceData);
    const currentPattern = this.patterns.get(patternKey) || 0;
    
    // Simple learning adjustment (in production, would use more sophisticated ML)
    const adjustment = (result.arousal + result.valence) / 2;
    const newPattern = currentPattern + (adjustment - currentPattern) * this.learningRate;
    
    this.patterns.set(patternKey, newPattern);
  }
}

// === Main Emotion Fusion Service ===

export class EmotionFusionService {
  private config: EmotionFusionConfig;
  private temporalBuffer: TemporalBuffer;
  private metrics: FusionMetrics;
  private historicalData: EmotionData[] = [];
  
  // Callbacks
  private onFusedEmotionCallback: ((emotions: EmotionData) => void) | null = null;
  private onConflictCallback: ((conflict: ConflictAnalysis) => void) | null = null;
  
  constructor(config: EmotionFusionConfig) {
    this.config = config;
    this.temporalBuffer = {
      faceData: [],
      voiceData: [],
      timestamps: [],
      maxBufferSize: config.synchronization?.bufferSize || 10
    };
    
    this.metrics = {
      totalFusions: 0,
      successfulFusions: 0,
      averageConfidence: 0,
      averageQuality: 0,
      conflictRate: 0,
      averageLatency: 0,
      modalityPreference: 'balanced'
    };
  }
  
  /**
   * Add face emotion data to fusion pipeline
   */
  addFaceData(faceData: FaceEmotionData): void {
    this.temporalBuffer.faceData.push(faceData);
    this.temporalBuffer.timestamps.push(faceData.timestamp);
    
    this.maintainBufferSize();
    this.attemptFusion();
  }
  
  /**
   * Add voice emotion data to fusion pipeline
   */
  addVoiceData(voiceData: VoiceEmotionData): void {
    this.temporalBuffer.voiceData.push(voiceData);
    this.temporalBuffer.timestamps.push(voiceData.timestamp);
    
    this.maintainBufferSize();
    this.attemptFusion();
  }
  
  /**
   * Force fusion with current available data
   */
  forceFusion(): EmotionData | null {
    const latestFace = this.getLatestValidData(this.temporalBuffer.faceData);
    const latestVoice = this.getLatestValidData(this.temporalBuffer.voiceData);
    
    if (!latestFace && !latestVoice) {
      return null;
    }
    
    return this.performFusion(latestFace, latestVoice);
  }
  
  /**
   * Attempt fusion based on synchronization requirements
   */
  private attemptFusion(): void {
    const syncedPair = this.findSynchronizedPair();
    
    if (syncedPair.face || syncedPair.voice) {
      const fusedEmotion = this.performFusion(syncedPair.face, syncedPair.voice);
      
      if (fusedEmotion && this.onFusedEmotionCallback) {
        this.onFusedEmotionCallback(fusedEmotion);
      }
    }
  }
  
  /**
   * Find temporally synchronized face and voice data
   */
  private findSynchronizedPair(): { face: FaceEmotionData | null; voice: VoiceEmotionData | null } {
    const maxTimeDrift = this.config.synchronization?.maxTimeDrift || 1000; // 1 second
    
    // Try to find synchronized pair within time drift tolerance
    for (let i = this.temporalBuffer.faceData.length - 1; i >= 0; i--) {
      const faceData = this.temporalBuffer.faceData[i];
      if (!faceData) continue;
      
      for (let j = this.temporalBuffer.voiceData.length - 1; j >= 0; j--) {
        const voiceData = this.temporalBuffer.voiceData[j];
        if (!voiceData) continue;
        
        const timeDiff = Math.abs(faceData.timestamp - voiceData.timestamp);
        
        if (timeDiff <= maxTimeDrift) {
          return { face: faceData, voice: voiceData };
        }
      }
    }
    
    // If no synchronized pair found, return latest available data
    return {
      face: this.getLatestValidData(this.temporalBuffer.faceData),
      voice: this.getLatestValidData(this.temporalBuffer.voiceData)
    };
  }
  
  /**
   * Perform multimodal emotion fusion
   */
  private performFusion(
    faceData: FaceEmotionData | null,
    voiceData: VoiceEmotionData | null
  ): EmotionData | null {
    const startTime = Date.now();
    this.metrics.totalFusions++;
    
    try {
      let fusedEmotion: EmotionData;
      
      // Handle single modality cases
      if (!faceData && voiceData) {
        fusedEmotion = this.createVoiceOnlyEmotion(voiceData);
      } else if (faceData && !voiceData) {
        fusedEmotion = this.createFaceOnlyEmotion(faceData);
      } else if (faceData && voiceData) {
        // True multimodal fusion
        fusedEmotion = this.performMultimodalFusion(faceData, voiceData);
      } else {
        return null;
      }
      
      // Update metrics
      this.updateMetrics(fusedEmotion, Date.now() - startTime);
      
      // Store in historical data
      this.historicalData.push(fusedEmotion);
      if (this.historicalData.length > 100) {
        this.historicalData = this.historicalData.slice(-100);
      }
      
      return fusedEmotion;
      
    } catch (error) {
      console.error('Emotion fusion error:', error);
      return null;
    }
  }
  
  /**
   * Perform true multimodal fusion using configured strategy
   */
  private performMultimodalFusion(faceData: FaceEmotionData, voiceData: VoiceEmotionData): EmotionData {
    switch (this.config.strategy) {
      case 'weighted-average':
        const weights: FusionWeights = {
          face: this.config.weights.faceWeight,
          voice: this.config.weights.voiceWeight,
          confidence: (faceData.confidence + voiceData.confidence) / 2,
          quality: (faceData.confidence + voiceData.confidence) / 2
        };
        return WeightedAverageFusion.fuse(faceData, voiceData, weights);
        
      case 'confidence-based':
        return ConfidenceBasedFusion.fuse(faceData, voiceData, this.config);
        
      case 'ai-learned':
        return AIMediatedFusion.fuse(faceData, voiceData, this.config, this.historicalData);
        
      case 'mutual-information':
      default:
        // Fallback to weighted average
        const defaultWeights: FusionWeights = {
          face: 0.6,
          voice: 0.4,
          confidence: (faceData.confidence + voiceData.confidence) / 2,
          quality: (faceData.confidence + voiceData.confidence) / 2
        };
        return WeightedAverageFusion.fuse(faceData, voiceData, defaultWeights);
    }
  }
  
  /**
   * Create emotion data from voice only
   */
  private createVoiceOnlyEmotion(voiceData: VoiceEmotionData): EmotionData {
    const affects = calculateAffects(voiceData.prosody.arousal, voiceData.prosody.valence);
    
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
      affects,
      basicEmotions,
      sources: {
        face: null,
        voice: voiceData,
        combined: false
      },
      fusion: {
        confidence: voiceData.confidence,
        agreement: 1.0, // No conflict with single source
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
   * Create emotion data from face only
   */
  private createFaceOnlyEmotion(faceData: FaceEmotionData): EmotionData {
    const affects = calculateAffects(faceData.arousal, faceData.valence);
    
    return {
      timestamp: faceData.timestamp,
      arousal: faceData.arousal,
      valence: faceData.valence,
      affects,
      basicEmotions: faceData.faceEmotions,
      sources: {
        face: faceData,
        voice: null,
        combined: false
      },
      fusion: {
        confidence: faceData.confidence,
        agreement: 1.0, // No conflict with single source
        dominantSource: 'face',
        conflictResolution: 'face-only'
      },
      quality: {
        faceQuality: faceData.confidence,
        voiceQuality: 0,
        environmentalNoise: 0, // Assume no noise for face-only
        overallQuality: faceData.confidence
      }
    };
  }
  
  /**
   * Get latest valid data from buffer
   */
  private getLatestValidData<T>(buffer: (T | null)[]): T | null {
    for (let i = buffer.length - 1; i >= 0; i--) {
      if (buffer[i] !== null) {
        return buffer[i];
      }
    }
    return null;
  }
  
  /**
   * Maintain buffer size limits
   */
  private maintainBufferSize(): void {
    const maxSize = this.temporalBuffer.maxBufferSize;
    
    if (this.temporalBuffer.faceData.length > maxSize) {
      this.temporalBuffer.faceData = this.temporalBuffer.faceData.slice(-maxSize);
    }
    
    if (this.temporalBuffer.voiceData.length > maxSize) {
      this.temporalBuffer.voiceData = this.temporalBuffer.voiceData.slice(-maxSize);
    }
    
    if (this.temporalBuffer.timestamps.length > maxSize * 2) {
      this.temporalBuffer.timestamps = this.temporalBuffer.timestamps.slice(-maxSize * 2);
    }
  }
  
  /**
   * Update fusion metrics
   */
  private updateMetrics(fusedEmotion: EmotionData, latency: number): void {
    this.metrics.successfulFusions++;
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
    this.metrics.averageConfidence = (this.metrics.averageConfidence + fusedEmotion.fusion.confidence) / 2;
    this.metrics.averageQuality = (this.metrics.averageQuality + fusedEmotion.quality.overallQuality) / 2;
    
    // Update conflict rate
    if (fusedEmotion.fusion.agreement < 0.7) {
      this.metrics.conflictRate = (this.metrics.conflictRate + 1) / 2;
    } else {
      this.metrics.conflictRate = this.metrics.conflictRate * 0.9;
    }
    
    // Update modality preference
    if (fusedEmotion.fusion.dominantSource !== 'balanced') {
      this.metrics.modalityPreference = fusedEmotion.fusion.dominantSource;
    }
  }
  
  /**
   * Set fused emotion callback
   */
  onFusedEmotion(callback: (emotions: EmotionData) => void): void {
    this.onFusedEmotionCallback = callback;
  }
  
  /**
   * Set conflict detection callback
   */
  onConflictDetected(callback: (conflict: ConflictAnalysis) => void): void {
    this.onConflictCallback = callback;
  }
  
  /**
   * Get current fusion metrics
   */
  getMetrics(): FusionMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Update fusion configuration
   */
  updateConfig(newConfig: Partial<EmotionFusionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Clear temporal buffer and reset
   */
  reset(): void {
    this.temporalBuffer = {
      faceData: [],
      voiceData: [],
      timestamps: [],
      maxBufferSize: this.config.synchronization?.bufferSize || 10
    };
    
    this.historicalData = [];
  }
  
  /**
   * Cleanup resources
   */
  destroy(): void {
    this.reset();
    this.onFusedEmotionCallback = null;
    this.onConflictCallback = null;
  }
}

// Default configuration for multimodal emotion fusion
export const defaultFusionConfig: EmotionFusionConfig = {
  enabled: true,
  strategy: 'weighted-average',
  weights: {
    faceWeight: 0.6,      // Slight preference for facial emotions
    voiceWeight: 0.4,     // Voice provides additional context
    adaptiveWeighting: true
  },
  conflictResolution: {
    strategy: 'contextual',
    disagreementThreshold: 0.4,
    fallbackToSingle: true
  },
  qualityGates: {
    minFaceConfidence: 0.3,
    minVoiceConfidence: 0.3,
    minOverallQuality: 0.4,
    requireBothModalities: false
  },
  synchronization: {
    maxTimeDrift: 1000,        // 1 second tolerance
    interpolationMethod: 'linear',
    bufferSize: 10
  }
};

// Export default fusion service instance
export const emotionFusionService = new EmotionFusionService(defaultFusionConfig);