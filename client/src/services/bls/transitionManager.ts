/**
 * Revolutionary Transition Manager for 3D BLS
 * Handles smooth transitions between patterns, settings, and modes with therapeutic timing
 */

import type { BLSConfiguration, BLSPattern, BLSTransitionConfig } from '@/../../shared/types';
import { AudioEngine } from './audioEngine';
import { HapticsEngine } from './hapticsEngine';
import { Renderer3D } from './renderer3D';

export interface TransitionState {
  isTransitioning: boolean;
  startTime: number;
  duration: number;
  fromConfig: BLSConfiguration;
  toConfig: BLSConfiguration;
  progress: number; // 0-1
  easing: string;
}

export interface MorphingState {
  isActive: boolean;
  startPattern: BLSPattern;
  targetPattern: BLSPattern;
  morphProgress: number; // 0-1
  blendFactor: number; // 0-1 for pattern blending
}

export interface TransitionCallbacks {
  onTransitionStart?: (from: BLSConfiguration, to: BLSConfiguration) => void;
  onTransitionProgress?: (progress: number) => void;
  onTransitionComplete?: (finalConfig: BLSConfiguration) => void;
  onMorphingUpdate?: (morphState: MorphingState) => void;
}

export class TransitionManager {
  private transitionState: TransitionState | null = null;
  private morphingState: MorphingState | null = null;
  private animationFrameId: number | null = null;
  private callbacks: TransitionCallbacks = {};
  
  // Audio crossfade support
  private audioEngine: AudioEngine | null = null;
  private fadeOutGain: GainNode | null = null;
  private fadeInGain: GainNode | null = null;
  
  // Transition queue for chained transitions
  private transitionQueue: Array<{
    config: BLSConfiguration;
    transitionConfig: BLSTransitionConfig;
  }> = [];
  
  constructor() {
    console.log('Transition Manager initialized');
  }

  /**
   * Start transition between configurations
   */
  startTransition(
    fromConfig: BLSConfiguration,
    toConfig: BLSConfiguration,
    transitionConfig: BLSTransitionConfig
  ): Promise<BLSConfiguration> {
    
    return new Promise((resolve) => {
      // If already transitioning, queue this transition
      if (this.transitionState) {
        this.transitionQueue.push({ config: toConfig, transitionConfig });
        return;
      }
      
      // Initialize transition state
      this.transitionState = {
        isTransitioning: true,
        startTime: performance.now(),
        duration: transitionConfig.duration,
        fromConfig: { ...fromConfig },
        toConfig: { ...toConfig },
        progress: 0,
        easing: transitionConfig.easing
      };
      
      // Initialize morphing if patterns are different
      if (fromConfig.pattern !== toConfig.pattern && transitionConfig.morphing) {
        this.morphingState = {
          isActive: true,
          startPattern: fromConfig.pattern,
          targetPattern: toConfig.pattern,
          morphProgress: 0,
          blendFactor: 0
        };
      }
      
      // Start audio crossfade if enabled
      if (transitionConfig.crossfade) {
        this.startAudioCrossfade(fromConfig, toConfig);
      }
      
      // Notify start
      this.callbacks.onTransitionStart?.(fromConfig, toConfig);
      
      // Start animation loop
      this.animateTransition(resolve);
    });
  }

  /**
   * Start smooth pattern morphing
   */
  startPatternMorphing(
    fromPattern: BLSPattern,
    toPattern: BLSPattern,
    duration: number = 2000
  ): Promise<void> {
    
    return new Promise((resolve) => {
      this.morphingState = {
        isActive: true,
        startPattern: fromPattern,
        targetPattern: toPattern,
        morphProgress: 0,
        blendFactor: 0
      };
      
      const startTime = performance.now();
      
      const animateMorph = () => {
        if (!this.morphingState) return;
        
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        this.morphingState.morphProgress = progress;
        this.morphingState.blendFactor = this.applyEasing(progress, 'ease-in-out');
        
        this.callbacks.onMorphingUpdate?.(this.morphingState);
        
        if (progress < 1) {
          requestAnimationFrame(animateMorph);
        } else {
          this.morphingState = null;
          resolve();
        }
      };
      
      animateMorph();
    });
  }

  /**
   * Get interpolated configuration during transition
   */
  getCurrentConfig(): BLSConfiguration | null {
    if (!this.transitionState) return null;
    
    const { fromConfig, toConfig, progress } = this.transitionState;
    return this.interpolateConfigurations(fromConfig, toConfig, progress);
  }

  /**
   * Get current morphing state
   */
  getMorphingState(): MorphingState | null {
    return this.morphingState;
  }

  /**
   * Check if currently transitioning
   */
  isTransitioning(): boolean {
    return this.transitionState?.isTransitioning || false;
  }

  /**
   * Cancel current transition
   */
  cancelTransition(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.transitionState = null;
    this.morphingState = null;
    this.transitionQueue = [];
  }

  /**
   * Set transition callbacks
   */
  setCallbacks(callbacks: TransitionCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Set audio engine reference for crossfading
   */
  setAudioEngine(audioEngine: AudioEngine): void {
    this.audioEngine = audioEngine;
  }

  // === Private Methods ===

  private animateTransition(resolve: (config: BLSConfiguration) => void): void {
    if (!this.transitionState) return;
    
    const elapsed = performance.now() - this.transitionState.startTime;
    const rawProgress = Math.min(elapsed / this.transitionState.duration, 1);
    
    // Apply easing function
    this.transitionState.progress = this.applyEasing(rawProgress, this.transitionState.easing);
    
    // Update morphing progress if active
    if (this.morphingState) {
      this.morphingState.morphProgress = this.transitionState.progress;
      this.morphingState.blendFactor = this.transitionState.progress;
      this.callbacks.onMorphingUpdate?.(this.morphingState);
    }
    
    // Notify progress
    this.callbacks.onTransitionProgress?.(this.transitionState.progress);
    
    // Check completion
    if (rawProgress >= 1) {
      const finalConfig = this.transitionState.toConfig;
      this.transitionState = null;
      this.morphingState = null;
      
      this.callbacks.onTransitionComplete?.(finalConfig);
      resolve(finalConfig);
      
      // Process next transition in queue
      this.processTransitionQueue();
    } else {
      this.animationFrameId = requestAnimationFrame(() => this.animateTransition(resolve));
    }
  }

  private applyEasing(progress: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return progress;
      
      case 'ease-in':
        return progress * progress;
      
      case 'ease-out':
        return 1 - Math.pow(1 - progress, 2);
      
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      case 'therapeutic':
        // Therapeutic easing: gentle start, steady middle, gentle end
        return this.therapeuticEasing(progress);
      
      default:
        return progress;
    }
  }

  private therapeuticEasing(t: number): number {
    // Smooth therapeutic curve - avoids jarring changes
    const smoothed = t * t * (3 - 2 * t); // Smoothstep
    const gentled = 0.5 * (1 - Math.cos(t * Math.PI)); // Cosine interpolation
    return 0.7 * smoothed + 0.3 * gentled; // Blend for optimal feel
  }

  private interpolateConfigurations(
    from: BLSConfiguration,
    to: BLSConfiguration,
    progress: number
  ): BLSConfiguration {
    
    const interpolated: BLSConfiguration = JSON.parse(JSON.stringify(from));
    
    // Interpolate numeric values
    interpolated.speed = this.lerp(from.speed, to.speed, progress);
    interpolated.size = this.lerp(from.size, to.size, progress);
    
    // Interpolate colors (hex to RGB to hex)
    interpolated.color = this.interpolateColor(from.color, to.color, progress);
    if (from.secondaryColor && to.secondaryColor) {
      interpolated.secondaryColor = this.interpolateColor(from.secondaryColor, to.secondaryColor, progress);
    }
    
    // Handle pattern transition
    if (progress < 0.5) {
      interpolated.pattern = from.pattern;
    } else {
      interpolated.pattern = to.pattern;
    }
    
    // Interpolate audio settings
    interpolated.audio = this.interpolateAudioConfig(from.audio, to.audio, progress);
    
    // Interpolate haptics settings
    interpolated.haptics = this.interpolateHapticsConfig(from.haptics, to.haptics, progress);
    
    // Interpolate 3D settings
    interpolated.rendering3D = this.interpolate3DConfig(from.rendering3D, to.rendering3D, progress);
    
    return interpolated;
  }

  private interpolateAudioConfig(from: any, to: any, progress: number): any {
    return {
      ...from,
      volume: this.lerp(from.volume, to.volume, progress),
      binauralFrequency: this.lerp(from.binauralFrequency, to.binauralFrequency, progress),
      panIntensity: this.lerp(from.panIntensity, to.panIntensity, progress),
      // Boolean and enum values switch at midpoint
      audioType: progress < 0.5 ? from.audioType : to.audioType,
      binauralType: progress < 0.5 ? from.binauralType : to.binauralType,
      enabled: progress < 0.5 ? from.enabled : to.enabled,
      spatialAudio: progress < 0.5 ? from.spatialAudio : to.spatialAudio,
      reverbEnabled: progress < 0.5 ? from.reverbEnabled : to.reverbEnabled,
      filterEnabled: progress < 0.5 ? from.filterEnabled : to.filterEnabled
    };
  }

  private interpolateHapticsConfig(from: any, to: any, progress: number): any {
    return {
      ...from,
      intensity: this.lerp(from.intensity, to.intensity, progress),
      duration: this.lerp(from.duration, to.duration, progress),
      interval: this.lerp(from.interval, to.interval, progress),
      // Boolean and enum values switch at midpoint
      enabled: progress < 0.5 ? from.enabled : to.enabled,
      pattern: progress < 0.5 ? from.pattern : to.pattern,
      syncWithMovement: progress < 0.5 ? from.syncWithMovement : to.syncWithMovement,
      syncWithAudio: progress < 0.5 ? from.syncWithAudio : to.syncWithAudio
    };
  }

  private interpolate3DConfig(from: any, to: any, progress: number): any {
    return {
      ...from,
      fieldOfView: this.lerp(from.fieldOfView, to.fieldOfView, progress),
      cameraDistance: this.lerp(from.cameraDistance, to.cameraDistance, progress),
      // Boolean and enum values switch at midpoint  
      enabled: progress < 0.5 ? from.enabled : to.enabled,
      antialias: progress < 0.5 ? from.antialias : to.antialias,
      shadows: progress < 0.5 ? from.shadows : to.shadows,
      lighting: progress < 0.5 ? from.lighting : to.lighting,
      cameraType: progress < 0.5 ? from.cameraType : to.cameraType,
      bloomEffect: progress < 0.5 ? from.bloomEffect : to.bloomEffect,
      blurBackground: progress < 0.5 ? from.blurBackground : to.blurBackground,
      particleEffects: progress < 0.5 ? from.particleEffects : to.particleEffects
    };
  }

  private lerp(from: number, to: number, progress: number): number {
    return from + (to - from) * progress;
  }

  private interpolateColor(fromHex: string, toHex: string, progress: number): string {
    // Convert hex to RGB
    const fromRgb = this.hexToRgb(fromHex);
    const toRgb = this.hexToRgb(toHex);
    
    if (!fromRgb || !toRgb) return fromHex;
    
    // Interpolate RGB values
    const r = Math.round(this.lerp(fromRgb.r, toRgb.r, progress));
    const g = Math.round(this.lerp(fromRgb.g, toRgb.g, progress));
    const b = Math.round(this.lerp(fromRgb.b, toRgb.b, progress));
    
    // Convert back to hex
    return this.rgbToHex(r, g, b);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  }

  private startAudioCrossfade(fromConfig: BLSConfiguration, toConfig: BLSConfiguration): void {
    // Implementation would require access to AudioEngine's internal audio nodes
    // This is a placeholder for the audio crossfade functionality
    console.log('Starting audio crossfade transition');
  }

  private processTransitionQueue(): void {
    if (this.transitionQueue.length === 0) return;
    
    const next = this.transitionQueue.shift();
    if (!next) return;
    
    // Get current config as the "from" config for the next transition
    const currentConfig = this.getCurrentConfig();
    if (currentConfig) {
      this.startTransition(currentConfig, next.config, next.transitionConfig);
    }
  }

  /**
   * Create smooth transition between two patterns with custom timing
   */
  createPatternTransition(
    fromPattern: BLSPattern,
    toPattern: BLSPattern,
    duration: number = 2000,
    easing: string = 'therapeutic'
  ): BLSTransitionConfig {
    
    return {
      enabled: true,
      duration,
      easing,
      morphing: this.shouldUsePatternMorphing(fromPattern, toPattern),
      crossfade: this.shouldUseCrossfade(fromPattern, toPattern)
    };
  }

  private shouldUsePatternMorphing(from: BLSPattern, to: BLSPattern): boolean {
    // Use morphing for similar patterns or when transitioning between 3D patterns
    const from3D = from.includes('3d');
    const to3D = to.includes('3d');
    
    return from3D && to3D; // Morph between 3D patterns
  }

  private shouldUseCrossfade(from: BLSPattern, to: BLSPattern): boolean {
    // Use crossfade when patterns have very different auditory characteristics
    const dramaticChanges = [
      ['horizontal', 'spiral3d'],
      ['circle', 'cube3d'],
      ['vertical', 'lissajous3d']
    ];
    
    return dramaticChanges.some(([p1, p2]) => 
      (from === p1 && to === p2) || (from === p2 && to === p1)
    );
  }

  /**
   * Generate therapeutic transition timing based on EMDR principles
   */
  getTherapeuticTransitionTiming(context: 'gentle' | 'standard' | 'crisis'): number {
    switch (context) {
      case 'gentle':
        return 4000; // 4 seconds for sensitive clients
      case 'standard':
        return 2000; // 2 seconds for standard transitions
      case 'crisis':
        return 500;  // 0.5 seconds for crisis interventions
      default:
        return 2000;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.cancelTransition();
    this.callbacks = {};
    this.audioEngine = null;
  }
}