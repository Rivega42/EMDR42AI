/**
 * Revolutionary Audio Engine for 3D BLS
 * Advanced Web Audio API implementation with binaural beats, spatial audio, and therapeutic sounds
 */

import type { BLSAudioConfig } from '@/../../shared/types';

export interface AudioPosition {
  x: number;
  y: number;
  z: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private binauralOscillator1: OscillatorNode | null = null;
  private binauralOscillator2: OscillatorNode | null = null;
  private spatialPanner: PannerNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private whiteNoiseBuffer: AudioBuffer | null = null;
  private natureAudioBuffer: AudioBuffer | null = null;
  private isPlaying: boolean = false;
  private currentConfig: BLSAudioConfig | null = null;

  /**
   * Initialize the audio engine
   */
  async initialize(): Promise<boolean> {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn('Web Audio API not supported');
        return false;
      }

      this.audioContext = new AudioContextClass();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);

      // Create spatial panner for 3D audio
      this.spatialPanner = this.audioContext.createPanner();
      this.spatialPanner.panningModel = 'HRTF';
      this.spatialPanner.distanceModel = 'inverse';
      this.spatialPanner.refDistance = 1;
      this.spatialPanner.maxDistance = 10000;
      this.spatialPanner.rolloffFactor = 1;
      this.spatialPanner.coneInnerAngle = 360;
      this.spatialPanner.coneOuterAngle = 0;
      this.spatialPanner.coneOuterGain = 0;
      this.spatialPanner.connect(this.masterGain);

      // Create reverb convolver
      this.reverbConvolver = this.audioContext.createConvolver();
      await this.createReverbImpulse();

      // Create filter node for dynamic effects
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 1000;

      // Generate white noise buffer
      await this.generateWhiteNoise();

      // Generate nature sounds (synthesized for demo)
      await this.generateNatureSounds();

      console.log('Audio Engine initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Audio Engine:', error);
      return false;
    }
  }

  /**
   * Start audio with configuration
   */
  async startAudio(config: BLSAudioConfig): Promise<void> {
    if (!this.audioContext || !this.masterGain) {
      throw new Error('Audio Engine not initialized');
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    this.currentConfig = config;
    this.isPlaying = true;

    // Set master volume
    this.masterGain.gain.setValueAtTime(config.volume, this.audioContext.currentTime);

    switch (config.audioType) {
      case 'binaural-beats':
        this.startBinauralBeats(config);
        break;
      case 'white-noise':
        this.startWhiteNoise(config);
        break;
      case 'nature-sounds':
        this.startNatureSounds(config);
        break;
      case 'sacred-geometry':
        this.startSacredGeometry(config);
        break;
      case 'singing-bowls':
        this.startSingingBowls(config);
        break;
      case 'simple-tone':
        this.startSimpleTone(config);
        break;
    }

    // Configure effects
    if (config.reverbEnabled && this.reverbConvolver) {
      this.configureReverb();
    }

    if (config.filterEnabled && this.filterNode) {
      this.configureFilter();
    }
  }

  /**
   * Stop all audio
   */
  stopAudio(): void {
    this.isPlaying = false;

    if (this.binauralOscillator1) {
      this.binauralOscillator1.stop();
      this.binauralOscillator1 = null;
    }

    if (this.binauralOscillator2) {
      this.binauralOscillator2.stop();
      this.binauralOscillator2 = null;
    }
  }

  /**
   * Update spatial position for 3D audio
   */
  updateSpatialPosition(position: AudioPosition): void {
    if (!this.spatialPanner || !this.currentConfig?.spatialAudio) return;

    this.spatialPanner.positionX.setValueAtTime(position.x, this.audioContext!.currentTime);
    this.spatialPanner.positionY.setValueAtTime(position.y, this.audioContext!.currentTime);
    this.spatialPanner.positionZ.setValueAtTime(position.z, this.audioContext!.currentTime);
  }

  /**
   * Update stereo panning based on movement
   */
  updatePanning(normalizedX: number): void {
    if (!this.currentConfig || !this.audioContext) return;

    const panValue = (normalizedX - 0.5) * 2 * this.currentConfig.panIntensity; // -1 to 1
    
    if (this.spatialPanner) {
      this.spatialPanner.positionX.setValueAtTime(panValue, this.audioContext.currentTime);
    }
  }

  // === Private Audio Generation Methods ===

  private startBinauralBeats(config: BLSAudioConfig): void {
    if (!this.audioContext) return;

    const baseFrequency = this.getBinauralBaseFrequency(config.binauralType);
    const beatFrequency = config.binauralFrequency;

    // Left channel
    this.binauralOscillator1 = this.audioContext.createOscillator();
    this.binauralOscillator1.frequency.value = baseFrequency;
    this.binauralOscillator1.type = 'sine';

    // Right channel  
    this.binauralOscillator2 = this.audioContext.createOscillator();
    this.binauralOscillator2.frequency.value = baseFrequency + beatFrequency;
    this.binauralOscillator2.type = 'sine';

    // Create stereo splitter
    const merger = this.audioContext.createChannelMerger(2);
    const leftGain = this.audioContext.createGain();
    const rightGain = this.audioContext.createGain();

    leftGain.gain.value = 0.5;
    rightGain.gain.value = 0.5;

    this.binauralOscillator1.connect(leftGain);
    this.binauralOscillator2.connect(rightGain);
    leftGain.connect(merger, 0, 0);
    rightGain.connect(merger, 0, 1);

    if (config.spatialAudio && this.spatialPanner) {
      merger.connect(this.spatialPanner);
    } else {
      merger.connect(this.masterGain!);
    }

    this.binauralOscillator1.start();
    this.binauralOscillator2.start();
  }

  private startWhiteNoise(config: BLSAudioConfig): void {
    if (!this.audioContext || !this.whiteNoiseBuffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.whiteNoiseBuffer;
    source.loop = true;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.3; // Lower volume for white noise

    source.connect(noiseGain);
    
    if (config.spatialAudio && this.spatialPanner) {
      noiseGain.connect(this.spatialPanner);
    } else {
      noiseGain.connect(this.masterGain!);
    }

    source.start();
  }

  private startNatureSounds(config: BLSAudioConfig): void {
    if (!this.audioContext || !this.natureAudioBuffer) return;

    const source = this.audioContext.createBufferSource();
    source.buffer = this.natureAudioBuffer;
    source.loop = true;

    if (config.spatialAudio && this.spatialPanner) {
      source.connect(this.spatialPanner);
    } else {
      source.connect(this.masterGain!);
    }

    source.start();
  }

  private startSacredGeometry(config: BLSAudioConfig): void {
    // Sacred geometry frequencies (Solfeggio frequencies)
    const frequencies = [174, 285, 396, 417, 528, 639, 741, 852, 963];
    this.startHarmoniousFrequencies(frequencies, config);
  }

  private startSingingBowls(config: BLSAudioConfig): void {
    // Tibetan singing bowl frequencies
    const frequencies = [256, 288, 324, 384, 432, 486];
    this.startHarmoniousFrequencies(frequencies, config);
  }

  private startSimpleTone(config: BLSAudioConfig): void {
    if (!this.audioContext) return;

    this.binauralOscillator1 = this.audioContext.createOscillator();
    this.binauralOscillator1.frequency.value = 440; // A4
    this.binauralOscillator1.type = 'sine';

    const toneGain = this.audioContext.createGain();
    toneGain.gain.value = 0.2;

    this.binauralOscillator1.connect(toneGain);
    
    if (config.spatialAudio && this.spatialPanner) {
      toneGain.connect(this.spatialPanner);
    } else {
      toneGain.connect(this.masterGain!);
    }

    this.binauralOscillator1.start();
  }

  private startHarmoniousFrequencies(frequencies: number[], config: BLSAudioConfig): void {
    if (!this.audioContext) return;

    frequencies.forEach((freq, index) => {
      const osc = this.audioContext!.createOscillator();
      osc.frequency.value = freq;
      osc.type = 'sine';

      const gain = this.audioContext!.createGain();
      gain.gain.value = 0.1 / frequencies.length; // Distribute volume

      osc.connect(gain);
      
      if (config.spatialAudio && this.spatialPanner) {
        gain.connect(this.spatialPanner);
      } else {
        gain.connect(this.masterGain!);
      }

      osc.start();
    });
  }

  // === Helper Methods ===

  private getBinauralBaseFrequency(type: string): number {
    switch (type) {
      case 'delta': return 200; // 0.5-4 Hz beats on 200 Hz carrier
      case 'theta': return 220; // 4-8 Hz beats on 220 Hz carrier
      case 'alpha': return 240; // 8-13 Hz beats on 240 Hz carrier
      case 'beta': return 260; // 13-30 Hz beats on 260 Hz carrier
      case 'gamma': return 280; // 30-100 Hz beats on 280 Hz carrier
      default: return 240;
    }
  }

  private async generateWhiteNoise(): Promise<void> {
    if (!this.audioContext) return;

    const bufferSize = this.audioContext.sampleRate * 2; // 2 seconds
    this.whiteNoiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = this.whiteNoiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
  }

  private async generateNatureSounds(): Promise<void> {
    if (!this.audioContext) return;

    // Synthesize gentle wave sounds
    const bufferSize = this.audioContext.sampleRate * 10; // 10 seconds
    this.natureAudioBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = this.natureAudioBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const t = i / this.audioContext.sampleRate;
      // Layered waves for natural sound
      const wave1 = Math.sin(2 * Math.PI * 0.1 * t) * 0.3;
      const wave2 = Math.sin(2 * Math.PI * 0.15 * t) * 0.2;
      const wave3 = Math.sin(2 * Math.PI * 0.08 * t) * 0.25;
      const noise = (Math.random() * 2 - 1) * 0.05; // Gentle noise
      
      output[i] = wave1 + wave2 + wave3 + noise;
    }
  }

  private async createReverbImpulse(): Promise<void> {
    if (!this.audioContext || !this.reverbConvolver) return;

    const length = this.audioContext.sampleRate * 3; // 3 seconds reverb
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }

    this.reverbConvolver.buffer = impulse;
  }

  private configureReverb(): void {
    if (!this.reverbConvolver || !this.spatialPanner) return;

    const reverbGain = this.audioContext!.createGain();
    reverbGain.gain.value = 0.3; // 30% reverb

    this.spatialPanner.connect(reverbGain);
    reverbGain.connect(this.reverbConvolver);
    this.reverbConvolver.connect(this.masterGain!);
  }

  private configureFilter(): void {
    if (!this.filterNode || !this.spatialPanner) return;

    this.spatialPanner.connect(this.filterNode);
    this.filterNode.connect(this.masterGain!);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAudio();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}