/**
 * Haptics Engine for 3D BLS System
 * Synchronized vibration patterns with movement and audio
 */

import type { BLSHapticsConfig } from '@/../../shared/types';

export interface HapticEvent {
  intensity: number; // 0-1
  duration: number; // milliseconds
  timestamp: number;
}

export class HapticsEngine {
  private isEnabled: boolean = false;
  private config: BLSHapticsConfig | null = null;
  private currentPattern: number[] = [];
  private patternIndex: number = 0;
  private intervalId: number | null = null;
  private lastVibration: number = 0;
  private vibrationQueue: HapticEvent[] = [];

  /**
   * Initialize haptics engine
   */
  initialize(): boolean {
    // Check if vibration API is available
    if (!('vibrate' in navigator) && 
        !('mozVibrate' in navigator) && 
        !('webkitVibrate' in navigator)) {
      console.warn('Vibration API not supported on this device');
      return false;
    }

    this.isEnabled = true;
    console.log('Haptics Engine initialized successfully');
    return true;
  }

  /**
   * Start haptic feedback with configuration
   */
  start(config: BLSHapticsConfig): void {
    if (!this.isEnabled || !config.enabled) return;

    this.config = config;
    this.setupPattern();
    this.startPatternPlayback();
  }

  /**
   * Stop haptic feedback
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.vibrationQueue = [];
    this.stopVibration();
  }

  /**
   * Trigger vibration synchronized with movement
   */
  triggerMovementSync(position: { x: number; y: number; z?: number }): void {
    if (!this.config?.syncWithMovement || !this.isEnabled) return;

    const now = performance.now();
    
    // Throttle vibrations to prevent overwhelming
    if (now - this.lastVibration < 50) return;

    // Calculate intensity based on movement speed
    const intensity = this.calculateMovementIntensity(position);
    const duration = this.config.duration * intensity;

    this.queueVibration({ intensity, duration, timestamp: now });
    this.lastVibration = now;
  }

  /**
   * Trigger vibration synchronized with audio beats
   */
  triggerAudioSync(beatIntensity: number = 1): void {
    if (!this.config?.syncWithAudio || !this.isEnabled) return;

    const intensity = this.config.intensity * beatIntensity;
    const duration = this.config.duration;

    this.queueVibration({ 
      intensity, 
      duration, 
      timestamp: performance.now() 
    });
  }

  /**
   * Trigger direction change vibration (for bilateral stimulation)
   */
  triggerDirectionChange(): void {
    if (!this.isEnabled || !this.config) return;

    // More intense vibration for direction changes
    const intensity = Math.min(this.config.intensity * 1.5, 1);
    const duration = this.config.duration * 1.2;

    this.queueVibration({ 
      intensity, 
      duration, 
      timestamp: performance.now() 
    });
  }

  /**
   * Trigger therapeutic pattern vibration
   */
  triggerTherapeuticPattern(pattern: 'calming' | 'alerting' | 'grounding'): void {
    if (!this.isEnabled) return;

    switch (pattern) {
      case 'calming':
        this.playPattern([200, 100, 200, 300, 200], 0.3);
        break;
      case 'alerting':
        this.playPattern([100, 50, 100, 50, 100], 0.7);
        break;
      case 'grounding':
        this.playPattern([500, 200, 500, 200, 500], 0.5);
        break;
    }
  }

  // === Private Methods ===

  private setupPattern(): void {
    if (!this.config) return;

    switch (this.config.pattern) {
      case 'pulse':
        this.currentPattern = [this.config.duration, this.config.interval];
        break;
      case 'wave':
        this.currentPattern = this.generateWavePattern();
        break;
      case 'heartbeat':
        this.currentPattern = this.generateHeartbeatPattern();
        break;
      case 'breathing':
        this.currentPattern = this.generateBreathingPattern();
        break;
      case 'custom':
        this.currentPattern = this.config.customPattern || [this.config.duration, this.config.interval];
        break;
      default:
        this.currentPattern = [this.config.duration, this.config.interval];
    }
  }

  private generateWavePattern(): number[] {
    // Gentle wave-like vibration pattern
    return [100, 50, 150, 75, 200, 100, 150, 75, 100, 200];
  }

  private generateHeartbeatPattern(): number[] {
    // Mimics heart rhythm
    return [80, 120, 80, 600]; // lub-dub, pause
  }

  private generateBreathingPattern(): number[] {
    // Breathing rhythm: inhale (long), hold, exhale (long), hold
    return [1000, 500, 1000, 500];
  }

  private startPatternPlayback(): void {
    if (!this.config || this.currentPattern.length === 0) return;

    this.patternIndex = 0;
    this.playNextInPattern();
  }

  private playNextInPattern(): void {
    if (!this.config || this.currentPattern.length === 0) return;

    const duration = this.currentPattern[this.patternIndex];
    const isVibration = this.patternIndex % 2 === 0; // Even indices are vibrations

    if (isVibration) {
      const scaledDuration = duration * this.config.intensity;
      this.performVibration(scaledDuration);
    }

    this.patternIndex = (this.patternIndex + 1) % this.currentPattern.length;

    // Schedule next event
    this.intervalId = window.setTimeout(() => {
      this.playNextInPattern();
    }, duration);
  }

  private calculateMovementIntensity(position: { x: number; y: number; z?: number }): number {
    // Calculate movement velocity/acceleration for dynamic intensity
    // For now, use position-based intensity (edges = higher intensity)
    const edgeDistance = Math.min(
      Math.abs(position.x - 0.5), 
      Math.abs(position.y - 0.5)
    ) * 2; // Normalize to 0-1

    return Math.max(0.2, 1 - edgeDistance); // Higher intensity at edges
  }

  private queueVibration(event: HapticEvent): void {
    this.vibrationQueue.push(event);
    this.processVibrationQueue();
  }

  private processVibrationQueue(): void {
    if (this.vibrationQueue.length === 0) return;

    const event = this.vibrationQueue.shift();
    if (!event) return;

    const scaledDuration = event.duration * event.intensity;
    this.performVibration(scaledDuration);

    // Process next item after current vibration
    if (this.vibrationQueue.length > 0) {
      setTimeout(() => {
        this.processVibrationQueue();
      }, scaledDuration + 10); // Small gap between vibrations
    }
  }

  private playPattern(pattern: number[], intensity: number): void {
    const scaledPattern = pattern.map(duration => duration * intensity);
    this.performVibration(scaledPattern);
  }

  private performVibration(duration: number | number[]): void {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(duration);
      } else if ('mozVibrate' in navigator) {
        (navigator as any).mozVibrate(duration);
      } else if ('webkitVibrate' in navigator) {
        (navigator as any).webkitVibrate(duration);
      }
    } catch (error) {
      console.warn('Vibration failed:', error);
    }
  }

  private stopVibration(): void {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      } else if ('mozVibrate' in navigator) {
        (navigator as any).mozVibrate(0);
      } else if ('webkitVibrate' in navigator) {
        (navigator as any).webkitVibrate(0);
      }
    } catch (error) {
      console.warn('Stop vibration failed:', error);
    }
  }

  /**
   * Update configuration during runtime
   */
  updateConfig(newConfig: Partial<BLSHapticsConfig>): void {
    if (!this.config) return;

    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.pattern || newConfig.customPattern) {
      this.setupPattern();
      if (this.intervalId) {
        this.stop();
        this.start(this.config);
      }
    }
  }

  /**
   * Check if haptics are supported and enabled
   */
  isAvailable(): boolean {
    return this.isEnabled && !!this.config?.enabled;
  }

  /**
   * Get current configuration
   */
  getConfig(): BLSHapticsConfig | null {
    return this.config;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.isEnabled = false;
    this.config = null;
  }
}