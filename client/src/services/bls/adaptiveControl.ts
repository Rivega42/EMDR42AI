/**
 * Adaptive BLS Control Service
 * Manages bilateral stimulation adaptively based on patient's emotional state
 */

import type { BLSConfiguration, EmotionData } from '@/../../shared/types';

export interface BLSMetrics {
  totalSets: number;
  completedCycles: number;
  averageSpeed: number;
  patternChanges: number;
  attentionLevel: number;
  effectiveness: number;
}

export interface AdaptiveParameters {
  minSpeed: number;
  maxSpeed: number;
  speedChangeRate: number;
  patternSwitchThreshold: number;
  colorAdaptation: boolean;
  soundAdaptation: boolean;
}

export class AdaptiveBLSController {
  private currentConfig: BLSConfiguration;
  private emotionHistory: EmotionData[] = [];
  private metrics: BLSMetrics;
  private adaptiveParams: AdaptiveParameters;
  private isAdaptive: boolean = false;
  private adaptationInterval: number | null = null;
  
  constructor() {
    // Initialize with default configuration
    this.currentConfig = this.getDefaultConfig();
    
    // Initialize metrics
    this.metrics = {
      totalSets: 0,
      completedCycles: 0,
      averageSpeed: 5,
      patternChanges: 0,
      attentionLevel: 1,
      effectiveness: 0.5
    };
    
    // Set adaptive parameters
    this.adaptiveParams = {
      minSpeed: 1,
      maxSpeed: 10,
      speedChangeRate: 0.5,
      patternSwitchThreshold: 0.3,
      colorAdaptation: true,
      soundAdaptation: true
    };
  }

  /**
   * Start adaptive BLS control
   */
  startAdaptiveControl(
    updateCallback: (config: BLSConfiguration) => void,
    emotionProvider: () => EmotionData | null
  ): void {
    if (this.isAdaptive) return;
    
    this.isAdaptive = true;
    
    // Adapt configuration every 2 seconds
    this.adaptationInterval = window.setInterval(() => {
      const emotionData = emotionProvider();
      if (emotionData) {
        this.addEmotionData(emotionData);
        const newConfig = this.adaptConfiguration(emotionData);
        
        if (this.hasConfigChanged(newConfig)) {
          this.currentConfig = newConfig;
          updateCallback(newConfig);
        }
      }
    }, 2000);
  }

  /**
   * Stop adaptive control
   */
  stopAdaptiveControl(): void {
    this.isAdaptive = false;
    
    if (this.adaptationInterval) {
      clearInterval(this.adaptationInterval);
      this.adaptationInterval = null;
    }
  }

  /**
   * Adapt BLS configuration based on emotional state
   */
  adaptConfiguration(emotionData: EmotionData): BLSConfiguration {
    const config = { ...this.currentConfig };
    
    // Adapt speed based on arousal
    config.speed = this.calculateAdaptiveSpeed(emotionData.arousal);
    
    // Adapt pattern based on emotional state
    config.pattern = this.selectAdaptivePattern(emotionData);
    
    // Adapt color if enabled
    if (this.adaptiveParams.colorAdaptation) {
      config.color = this.selectAdaptiveColor(emotionData);
    }
    
    // Adapt sound based on stress level
    if (this.adaptiveParams.soundAdaptation) {
      config.soundEnabled = this.shouldEnableSound(emotionData);
    }
    
    // Adjust size based on attention
    config.size = this.calculateAdaptiveSize(emotionData);
    
    return config;
  }

  /**
   * Calculate optimal speed based on arousal level
   */
  calculateAdaptiveSpeed(arousal: number): number {
    // High arousal -> slower speed for calming
    // Low arousal -> moderate speed for engagement
    
    const targetSpeed = arousal > 0.7 
      ? this.adaptiveParams.minSpeed + 2
      : arousal < 0.3
      ? this.adaptiveParams.maxSpeed - 3
      : 5;
    
    // Smooth speed transitions
    const currentSpeed = this.currentConfig.speed;
    const speedDiff = targetSpeed - currentSpeed;
    const adjustedSpeed = currentSpeed + (speedDiff * this.adaptiveParams.speedChangeRate);
    
    return Math.max(
      this.adaptiveParams.minSpeed,
      Math.min(this.adaptiveParams.maxSpeed, adjustedSpeed)
    );
  }

  /**
   * Select pattern based on emotional patterns
   */
  selectAdaptivePattern(emotionData: EmotionData): BLSConfiguration['pattern'] {
    const { arousal, valence } = emotionData;
    const currentPattern = this.currentConfig.pattern;
    
    // Analyze emotion trajectory
    const trajectory = this.analyzeEmotionTrajectory();
    
    // High arousal + negative valence -> horizontal (most calming)
    if (arousal > 0.7 && valence < 0.4) {
      return 'horizontal';
    }
    
    // Stable emotions -> can try more complex patterns
    if (trajectory.stability > 0.7) {
      if (currentPattern === 'horizontal') {
        this.metrics.patternChanges++;
        return 'diagonal';
      }
      if (currentPattern === 'diagonal') {
        this.metrics.patternChanges++;
        return 'circle';
      }
    }
    
    // Low engagement -> vertical to increase attention
    if (this.metrics.attentionLevel < 0.5) {
      return 'vertical';
    }
    
    // 3D wave for advanced processing
    if (trajectory.improvement > 0.6 && this.metrics.completedCycles > 10) {
      return '3d-wave';
    }
    
    return currentPattern;
  }

  /**
   * Select color based on emotional valence
   */
  selectAdaptiveColor(emotionData: EmotionData): string {
    const { valence, arousal } = emotionData;
    
    // Color psychology mapping
    if (valence < 0.3 && arousal > 0.6) {
      // Distressed -> Calming green
      return '#10b981';
    } else if (valence < 0.4) {
      // Negative -> Soothing blue
      return '#3b82f6';
    } else if (valence > 0.6) {
      // Positive -> Energizing purple
      return '#8b5cf6';
    } else if (arousal > 0.7) {
      // High arousal -> Calming teal
      return '#14b8a6';
    } else {
      // Neutral -> Standard blue
      return '#6366f1';
    }
  }

  /**
   * Determine if sound should be enabled
   */
  shouldEnableSound(emotionData: EmotionData): boolean {
    // Enable sound for better focus when arousal is moderate
    // Disable for very high stress to avoid overstimulation
    
    const { arousal } = emotionData;
    return arousal > 0.3 && arousal < 0.8;
  }

  /**
   * Calculate adaptive size based on attention and arousal
   */
  calculateAdaptiveSize(emotionData: EmotionData): number {
    const baseSize = 20;
    const { arousal } = emotionData;
    const attention = this.metrics.attentionLevel;
    
    // Larger size for low attention or high arousal
    const sizeModifier = (1 - attention) * 10 + (arousal * 5);
    
    return Math.max(15, Math.min(35, baseSize + sizeModifier));
  }

  /**
   * Analyze emotion trajectory over time
   */
  analyzeEmotionTrajectory(): {
    stability: number;
    improvement: number;
    trend: 'improving' | 'worsening' | 'stable';
  } {
    if (this.emotionHistory.length < 3) {
      return { stability: 0.5, improvement: 0.5, trend: 'stable' };
    }
    
    // Get recent emotions
    const recent = this.emotionHistory.slice(-10);
    
    // Calculate stability (low variance)
    const arousalValues = recent.map(e => e.arousal);
    const valenceValues = recent.map(e => e.valence);
    
    const arousalVariance = this.calculateVariance(arousalValues);
    const valenceVariance = this.calculateVariance(valenceValues);
    const stability = 1 - (arousalVariance + valenceVariance) / 2;
    
    // Calculate improvement (valence trending up, arousal trending down)
    const firstHalf = recent.slice(0, 5);
    const secondHalf = recent.slice(5);
    
    const firstAvgValence = this.average(firstHalf.map(e => e.valence));
    const secondAvgValence = this.average(secondHalf.map(e => e.valence));
    const firstAvgArousal = this.average(firstHalf.map(e => e.arousal));
    const secondAvgArousal = this.average(secondHalf.map(e => e.arousal));
    
    const valenceImprovement = secondAvgValence - firstAvgValence;
    const arousalImprovement = firstAvgArousal - secondAvgArousal;
    const improvement = (valenceImprovement + arousalImprovement) / 2 + 0.5;
    
    // Determine trend
    let trend: 'improving' | 'worsening' | 'stable' = 'stable';
    if (improvement > 0.6) trend = 'improving';
    else if (improvement < 0.4) trend = 'worsening';
    
    return {
      stability: Math.max(0, Math.min(1, stability)),
      improvement: Math.max(0, Math.min(1, improvement)),
      trend
    };
  }

  /**
   * Update metrics based on BLS progress
   */
  updateMetrics(event: {
    type: 'cycle_complete' | 'set_complete' | 'pattern_change' | 'attention_update';
    value?: number;
  }): void {
    switch (event.type) {
      case 'cycle_complete':
        this.metrics.completedCycles++;
        break;
      case 'set_complete':
        this.metrics.totalSets++;
        break;
      case 'pattern_change':
        this.metrics.patternChanges++;
        break;
      case 'attention_update':
        if (event.value !== undefined) {
          this.metrics.attentionLevel = event.value;
        }
        break;
    }
    
    // Update effectiveness based on metrics
    this.updateEffectiveness();
  }

  /**
   * Get current metrics
   */
  getMetrics(): BLSMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset controller state
   */
  reset(): void {
    this.emotionHistory = [];
    this.metrics = {
      totalSets: 0,
      completedCycles: 0,
      averageSpeed: 5,
      patternChanges: 0,
      attentionLevel: 1,
      effectiveness: 0.5
    };
    this.currentConfig = this.getDefaultConfig();
  }

  // Private helper methods
  private addEmotionData(emotion: EmotionData): void {
    this.emotionHistory.push(emotion);
    
    // Keep only last 30 entries
    if (this.emotionHistory.length > 30) {
      this.emotionHistory.shift();
    }
  }

  private hasConfigChanged(newConfig: BLSConfiguration): boolean {
    return JSON.stringify(newConfig) !== JSON.stringify(this.currentConfig);
  }

  private updateEffectiveness(): void {
    const trajectory = this.analyzeEmotionTrajectory();
    const attentionFactor = this.metrics.attentionLevel;
    const completionFactor = Math.min(1, this.metrics.completedCycles / 20);
    
    this.metrics.effectiveness = 
      (trajectory.improvement * 0.4) +
      (trajectory.stability * 0.2) +
      (attentionFactor * 0.2) +
      (completionFactor * 0.2);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = this.average(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return this.average(squaredDiffs);
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private getDefaultConfig(): BLSConfiguration {
    return {
      speed: 5,
      pattern: 'horizontal',
      color: '#3b82f6',
      size: 20,
      soundEnabled: true,
      adaptiveMode: false
    };
  }
}

// Singleton instance
export const adaptiveBLS = new AdaptiveBLSController();