/**
 * Voice Recognition Service
 * Handles voice emotion analysis and speech-to-text processing
 */

import type { EmotionData } from '@/../../shared/types';

export interface VoiceFeatures {
  pitch: number;
  volume: number;
  speed: number;
  pauseFrequency: number;
  voiceTremor: number;
  tonality: string;
}

export interface VoiceEmotions {
  calm: number;
  excited: number;
  stressed: number;
  sad: number;
  angry: number;
  happy: number;
  fearful: number;
}

export class VoiceRecognitionService {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private isRecording: boolean = false;
  private speechRecognition: any = null;
  private processingInterval: number | null = null;
  
  constructor() {
    // Initialize Web Speech API if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || 
                               (window as any).webkitSpeechRecognition;
      this.speechRecognition = new SpeechRecognition();
      this.configureSpeechRecognition();
    }
  }

  /**
   * Initialize audio processing
   */
  async initialize(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Create audio context and analyser
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);
      
    } catch (error) {
      console.error('Failed to initialize voice recognition:', error);
      throw error;
    }
  }

  /**
   * Start voice emotion analysis
   */
  startAnalysis(callback: (emotions: EmotionData) => void): void {
    if (this.isRecording) return;
    
    this.isRecording = true;
    
    // Start speech recognition if available
    if (this.speechRecognition) {
      this.speechRecognition.start();
    }
    
    // Process audio at ~5 FPS
    this.processingInterval = window.setInterval(async () => {
      if (!this.isRecording) return;
      
      try {
        const emotions = await this.analyzeVoiceEmotions();
        if (emotions) {
          callback(emotions);
        }
      } catch (error) {
        console.error('Voice analysis error:', error);
      }
    }, 200);
  }

  /**
   * Stop voice analysis
   */
  stopAnalysis(): void {
    this.isRecording = false;
    
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  /**
   * Analyze voice emotions from audio stream
   */
  async analyzeVoiceEmotions(): Promise<EmotionData | null> {
    if (!this.analyser) return null;
    
    // Extract voice features
    const features = this.extractVoiceFeatures();
    
    // Analyze emotions from features
    const voiceEmotions = this.analyzeEmotionsFromFeatures(features);
    
    // Convert to standard emotion data format
    return this.convertToEmotionData(voiceEmotions, features);
  }

  /**
   * Extract acoustic features from voice
   */
  extractVoiceFeatures(): VoiceFeatures {
    if (!this.analyser) {
      return this.getDefaultFeatures();
    }
    
    // Get frequency data
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    // Calculate pitch (fundamental frequency)
    const pitch = this.calculatePitch(dataArray);
    
    // Calculate volume (RMS)
    const volume = this.calculateVolume(dataArray);
    
    // TODO: Implement more sophisticated feature extraction
    // - Mel-frequency cepstral coefficients (MFCCs)
    // - Formant frequencies
    // - Spectral centroid
    // - Zero-crossing rate
    
    return {
      pitch,
      volume,
      speed: this.calculateSpeechRate(),
      pauseFrequency: this.calculatePauseFrequency(),
      voiceTremor: this.calculateTremor(dataArray),
      tonality: this.analyzeTonality(pitch, volume)
    };
  }

  /**
   * Detect stress patterns in voice
   */
  detectStressPatterns(features: VoiceFeatures): number {
    // High pitch + high volume + fast speech = stress
    const stressIndicators = [
      features.pitch > 200 ? 0.3 : 0,
      features.volume > 0.7 ? 0.3 : 0,
      features.speed > 150 ? 0.2 : 0,
      features.voiceTremor > 0.5 ? 0.2 : 0
    ];
    
    return Math.min(1, stressIndicators.reduce((a, b) => a + b, 0));
  }

  /**
   * Analyze speech content for emotional keywords
   */
  analyzeSpeechContent(transcript: string): Record<string, number> {
    // TODO: Implement NLP analysis for emotional content
    // Could use sentiment analysis libraries
    
    const emotionalKeywords = {
      positive: ['хорошо', 'отлично', 'счастлив', 'рад', 'прекрасно'],
      negative: ['плохо', 'ужасно', 'грустно', 'страшно', 'больно'],
      anxious: ['волнуюсь', 'тревожно', 'беспокоит', 'страх', 'паника']
    };
    
    const scores = {
      positive: 0,
      negative: 0,
      anxious: 0
    };
    
    // Simple keyword matching (replace with NLP)
    const words = transcript.toLowerCase().split(' ');
    for (const word of words) {
      if (emotionalKeywords.positive.includes(word)) scores.positive++;
      if (emotionalKeywords.negative.includes(word)) scores.negative++;
      if (emotionalKeywords.anxious.includes(word)) scores.anxious++;
    }
    
    return scores;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stopAnalysis();
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  // Private helper methods
  private configureSpeechRecognition(): void {
    if (!this.speechRecognition) return;
    
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = true;
    this.speechRecognition.lang = 'ru-RU';
    
    this.speechRecognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      // Process transcript for emotional content
      this.analyzeSpeechContent(transcript);
    };
    
    this.speechRecognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };
  }

  private calculatePitch(frequencyData: Uint8Array): number {
    // Simplified pitch detection - find dominant frequency
    let maxValue = 0;
    let maxIndex = 0;
    
    for (let i = 0; i < frequencyData.length; i++) {
      if (frequencyData[i] > maxValue) {
        maxValue = frequencyData[i];
        maxIndex = i;
      }
    }
    
    // Convert index to frequency
    if (this.audioContext) {
      const nyquist = this.audioContext.sampleRate / 2;
      return (maxIndex / frequencyData.length) * nyquist;
    }
    
    return 150; // Default pitch
  }

  private calculateVolume(frequencyData: Uint8Array): number {
    // Calculate RMS (Root Mean Square) for volume
    let sum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      sum += frequencyData[i] * frequencyData[i];
    }
    const rms = Math.sqrt(sum / frequencyData.length);
    return Math.min(1, rms / 128); // Normalize to 0-1
  }

  private calculateSpeechRate(): number {
    // TODO: Implement actual speech rate calculation
    // Would need to track syllables/words over time
    return 120; // Words per minute
  }

  private calculatePauseFrequency(): number {
    // TODO: Implement pause detection
    // Track silence periods in audio stream
    return 0.2; // Pauses per second
  }

  private calculateTremor(frequencyData: Uint8Array): number {
    // Detect voice tremor/shakiness
    // TODO: Implement tremor analysis
    return 0.1; // 0-1 scale
  }

  private analyzeTonality(pitch: number, volume: number): string {
    if (pitch > 250 && volume > 0.7) return 'excited';
    if (pitch < 100 && volume < 0.3) return 'depressed';
    if (pitch > 200 && volume < 0.5) return 'anxious';
    return 'neutral';
  }

  private analyzeEmotionsFromFeatures(features: VoiceFeatures): VoiceEmotions {
    // Map voice features to emotions
    // This is simplified - real implementation would use ML models
    
    const stress = this.detectStressPatterns(features);
    
    return {
      calm: features.pitch < 150 && features.volume < 0.5 ? 0.8 : 0.2,
      excited: features.pitch > 200 && features.volume > 0.7 ? 0.8 : 0.2,
      stressed: stress,
      sad: features.pitch < 100 && features.speed < 100 ? 0.7 : 0.2,
      angry: features.volume > 0.8 && features.pitch > 180 ? 0.7 : 0.1,
      happy: features.pitch > 160 && features.tonality === 'excited' ? 0.6 : 0.2,
      fearful: features.voiceTremor > 0.5 ? 0.7 : 0.1
    };
  }

  private convertToEmotionData(voiceEmotions: VoiceEmotions, features: VoiceFeatures): EmotionData {
    // Calculate arousal and valence
    const arousal = (voiceEmotions.excited + voiceEmotions.stressed + 
                    voiceEmotions.angry + voiceEmotions.fearful) / 4;
    
    const valence = (voiceEmotions.happy + voiceEmotions.calm - 
                    voiceEmotions.sad - voiceEmotions.angry - 
                    voiceEmotions.fearful) / 5 + 0.5;
    
    return {
      timestamp: Date.now(),
      arousal: Math.max(0, Math.min(1, arousal)),
      valence: Math.max(0, Math.min(1, valence)),
      affects: this.generateVoiceAffects(voiceEmotions, features),
      basicEmotions: voiceEmotions as any
    };
  }

  private generateVoiceAffects(emotions: VoiceEmotions, features: VoiceFeatures): Record<string, number> {
    const affects: Record<string, number> = {};
    
    // Map voice emotions to affects
    affects['tension'] = emotions.stressed;
    affects['relaxation'] = emotions.calm;
    affects['agitation'] = emotions.excited * 0.8;
    affects['melancholy'] = emotions.sad;
    affects['frustration'] = emotions.angry * 0.9;
    affects['anxiety'] = emotions.fearful;
    affects['confidence'] = features.volume > 0.6 && features.pitch < 180 ? 0.7 : 0.3;
    
    return affects;
  }

  private getDefaultFeatures(): VoiceFeatures {
    return {
      pitch: 150,
      volume: 0.5,
      speed: 120,
      pauseFrequency: 0.2,
      voiceTremor: 0.1,
      tonality: 'neutral'
    };
  }
}

// Singleton instance
export const voiceRecognition = new VoiceRecognitionService();