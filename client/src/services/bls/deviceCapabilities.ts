/**
 * Device Capabilities Detection for 3D BLS System
 * Detects device capabilities for optimal 3D experience and fallback
 */

import type { DeviceCapabilities } from '@/../../shared/types';

export class DeviceCapabilityDetector {
  private static instance: DeviceCapabilityDetector;
  private capabilities: DeviceCapabilities | null = null;

  static getInstance(): DeviceCapabilityDetector {
    if (!DeviceCapabilityDetector.instance) {
      DeviceCapabilityDetector.instance = new DeviceCapabilityDetector();
    }
    return DeviceCapabilityDetector.instance;
  }

  /**
   * Detect all device capabilities for optimal BLS experience
   */
  async detect(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const capabilities: DeviceCapabilities = {
      webgl: this.detectWebGL(),
      webgl2: this.detectWebGL2(),
      vibration: this.detectVibration(),
      webaudio: this.detectWebAudio(),
      fullscreen: this.detectFullscreen(),
      performance: await this.detectPerformance(),
      maxTextureSize: this.detectMaxTextureSize(),
      audioContext: this.detectAudioContext()
    };

    this.capabilities = capabilities;
    return capabilities;
  }

  /**
   * Check if device supports 3D rendering
   */
  supportsAdvanced3D(): boolean {
    if (!this.capabilities) return false;
    return this.capabilities.webgl && 
           this.capabilities.performance !== 'low' &&
           this.capabilities.maxTextureSize >= 1024;
  }

  /**
   * Check if device supports haptic feedback
   */
  supportsHaptics(): boolean {
    return this.capabilities?.vibration || false;
  }

  /**
   * Check if device supports advanced audio
   */
  supportsAdvancedAudio(): boolean {
    return this.capabilities?.webaudio && this.capabilities?.audioContext || false;
  }

  /**
   * Get recommended settings based on device capabilities
   */
  getRecommendedSettings() {
    if (!this.capabilities) return null;

    return {
      // 3D Rendering Settings
      enable3D: this.supportsAdvanced3D(),
      antialias: this.capabilities.performance === 'high',
      shadows: this.capabilities.performance === 'high',
      particleEffects: this.capabilities.performance !== 'low',
      
      // Audio Settings
      enableAdvancedAudio: this.supportsAdvancedAudio(),
      spatialAudio: this.supportsAdvancedAudio(),
      
      // Haptics Settings
      enableHaptics: this.supportsHaptics(),
      
      // Performance Settings
      targetFPS: this.capabilities.performance === 'low' ? 30 : 60,
      quality: this.capabilities.performance
    };
  }

  // === Private Detection Methods ===

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  private detectWebGL2(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2');
      return !!gl;
    } catch (e) {
      return false;
    }
  }

  private detectVibration(): boolean {
    return 'vibrate' in navigator || 'mozVibrate' in navigator || 'webkitVibrate' in navigator;
  }

  private detectWebAudio(): boolean {
    return !!(window.AudioContext || (window as any).webkitAudioContext);
  }

  private detectFullscreen(): boolean {
    return !!(document.fullscreenEnabled || 
              (document as any).webkitFullscreenEnabled || 
              (document as any).mozFullScreenEnabled ||
              (document as any).msFullscreenEnabled);
  }

  private detectAudioContext(): boolean {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return false;
      
      const testContext = new AudioContextClass();
      testContext.close();
      return true;
    } catch (e) {
      return false;
    }
  }

  private detectMaxTextureSize(): number {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return 512;
      
      return gl.getParameter(gl.MAX_TEXTURE_SIZE) || 512;
    } catch (e) {
      return 512;
    }
  }

  private async detectPerformance(): Promise<'low' | 'medium' | 'high'> {
    // Hardware-based detection
    const hardwareScore = this.calculateHardwareScore();
    
    // Runtime performance test
    const performanceScore = await this.runPerformanceTest();
    
    const totalScore = (hardwareScore + performanceScore) / 2;
    
    if (totalScore >= 0.7) return 'high';
    if (totalScore >= 0.4) return 'medium';
    return 'low';
  }

  private calculateHardwareScore(): number {
    let score = 0;
    
    // Memory
    const memory = (navigator as any).deviceMemory;
    if (memory) {
      score += Math.min(memory / 8, 1) * 0.3; // Normalized to 8GB
    } else {
      score += 0.5; // Default assumption
    }
    
    // CPU cores
    const cores = navigator.hardwareConcurrency || 4;
    score += Math.min(cores / 8, 1) * 0.3; // Normalized to 8 cores
    
    // WebGL capabilities
    if (this.detectWebGL2()) {
      score += 0.2;
    } else if (this.detectWebGL()) {
      score += 0.1;
    }
    
    // User agent hints (mobile vs desktop)
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    score += isMobile ? 0.1 : 0.2;
    
    return Math.min(score, 1);
  }

  private async runPerformanceTest(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let frameCount = 0;
      const testDuration = 100; // 100ms test
      
      const testFrame = () => {
        frameCount++;
        const elapsed = performance.now() - startTime;
        
        if (elapsed < testDuration) {
          requestAnimationFrame(testFrame);
        } else {
          const fps = (frameCount / elapsed) * 1000;
          // Normalize to 0-1 score (60fps = 1.0)
          const score = Math.min(fps / 60, 1);
          resolve(score);
        }
      };
      
      requestAnimationFrame(testFrame);
    });
  }
}

// Singleton instance
export const deviceCapabilities = DeviceCapabilityDetector.getInstance();