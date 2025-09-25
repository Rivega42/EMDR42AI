/**
 * SpeechToTextService Integration Example
 * Demonstrates how to use STT service with AudioStreamMultiplexer
 * without conflicts with emotion analysis
 */

import { AudioStreamMultiplexer } from '@/services/audio/audioStreamMultiplexer';
import { SpeechToTextService } from './speechToTextService';
import type {
  STTTranscriptionResult,
  STTServiceStatus,
  STTEvents
} from '@/../../shared/types';

// Example implementation showing how to integrate STT with EMDR42
export class STTAudioIntegration {
  private audioMultiplexer: AudioStreamMultiplexer;
  private sttService: SpeechToTextService;
  private isInitialized: boolean = false;

  // Event callbacks
  private onTranscriptionCallback: ((result: STTTranscriptionResult) => void) | null = null;
  private onInterimResultCallback: ((text: string, confidence: number) => void) | null = null;

  constructor() {
    // Initialize AudioStreamMultiplexer
    this.audioMultiplexer = new AudioStreamMultiplexer();
    
    // Initialize STT service with configuration
    this.sttService = new SpeechToTextService({
      providers: {
        primary: 'openai-whisper',
        fallback: ['assemblyai', 'web-speech-api'],
        enableFailover: true,
        failoverThreshold: 0.3
      },
      processing: {
        mode: 'hybrid',
        realTimeEnabled: true,
        batchSizeMs: 3000,
        bufferSizeMs: 500,
        minSilenceDuration: 1000
      },
      language: {
        primary: 'auto',
        autoDetect: true,
        supportedLanguages: ['en', 'ru'],
        enableTranslation: false
      },
      quality: {
        enableVAD: true,
        vadThreshold: 0.02,
        enableNoiseSuppression: true,
        enablePunctuation: true,
        enableCapitalization: true,
        enableProfanityFilter: false
      }
    });

    console.log('🎤 STT Audio Integration created');
  }

  /**
   * Initialize the complete STT + Audio system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('STT Integration already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing STT Audio Integration...');

      // 1. Initialize AudioStreamMultiplexer first
      await this.audioMultiplexer.initializeStream();
      
      // 2. Initialize STT service with the multiplexer
      await this.sttService.initialize(this.audioMultiplexer);

      // 3. Set up STT event handlers
      this.setupSTTEventHandlers();

      this.isInitialized = true;
      console.log('✅ STT Audio Integration initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize STT Integration:', error);
      throw error;
    }
  }

  /**
   * Setup STT service event handlers
   */
  private setupSTTEventHandlers(): void {
    const sttEvents: STTEvents = {
      onTranscription: (result: STTTranscriptionResult) => {
        console.log(`📝 Final transcription: "${result.text}" (${result.language}, confidence: ${result.confidence})`);
        
        // Process the final transcription result
        this.handleFinalTranscription(result);
        
        // Call external callback if set
        if (this.onTranscriptionCallback) {
          this.onTranscriptionCallback(result);
        }
      },

      onInterimResult: (text: string, confidence: number) => {
        console.log(`📄 Interim result: "${text}" (confidence: ${confidence})`);
        
        // Call external callback if set
        if (this.onInterimResultCallback) {
          this.onInterimResultCallback(text, confidence);
        }
      },

      onStatusChange: (status: STTServiceStatus) => {
        console.log('📊 STT Status changed:', {
          isListening: status.isListening,
          isProcessing: status.isProcessing,
          currentProvider: status.currentProvider,
          audioReceiving: status.audio.isReceiving,
          vadState: status.audio.vadState
        });
      },

      onError: (error) => {
        console.error('❌ STT Error:', error);
        
        // Handle STT errors gracefully
        this.handleSTTError(error);
      },

      onProviderChange: (newProvider, reason) => {
        console.log(`🔄 STT Provider changed to: ${newProvider} (reason: ${reason})`);
      },

      onVoiceActivity: (isActive, confidence) => {
        if (isActive) {
          console.log(`🗣️ Voice activity detected (confidence: ${confidence})`);
        }
      }
    };

    this.sttService.setEvents(sttEvents);
  }

  /**
   * Start listening for speech
   */
  async startListening(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Start audio streaming (this will activate both emotion analysis and STT)
      await this.audioMultiplexer.startStreaming();
      
      // Start STT transcription
      await this.sttService.startListening();

      console.log('🎧 Started listening for speech...');

    } catch (error) {
      console.error('❌ Failed to start listening:', error);
      throw error;
    }
  }

  /**
   * Stop listening for speech
   */
  async stopListening(): Promise<void> {
    try {
      // Stop STT transcription
      await this.sttService.stopListening();
      
      console.log('🛑 Stopped listening for speech');

    } catch (error) {
      console.error('❌ Failed to stop listening:', error);
    }
  }

  /**
   * Handle final transcription results
   */
  private handleFinalTranscription(result: STTTranscriptionResult): void {
    // Example processing of transcription result
    const transcription = {
      id: result.id,
      text: result.text,
      language: result.language,
      confidence: result.confidence,
      timestamp: result.timestamp,
      words: result.words,
      segments: result.segments,
      duration: result.audioQuality.duration,
      provider: result.provider
    };

    // Here you could:
    // 1. Send to AI therapist for analysis
    // 2. Store in session memory
    // 3. Update UI with transcription
    // 4. Trigger therapeutic responses

    console.log('💾 Processing transcription:', transcription);
  }

  /**
   * Handle STT errors gracefully
   */
  private handleSTTError(error: any): void {
    // Log error details
    console.error('STT Error Details:', {
      code: error.code,
      message: error.message,
      provider: error.provider,
      retryable: error.retryable,
      timestamp: new Date(error.timestamp).toISOString()
    });

    // Auto-retry on retryable errors
    if (error.retryable && this.isInitialized) {
      console.log('🔄 Auto-retrying STT operation...');
      setTimeout(async () => {
        try {
          if (this.sttService.getStatus().isListening) {
            await this.sttService.stopListening();
            await this.sttService.startListening();
          }
        } catch (retryError) {
          console.error('❌ Retry failed:', retryError);
        }
      }, 2000);
    }
  }

  /**
   * Set callbacks for external integration
   */
  setCallbacks(
    onTranscription?: (result: STTTranscriptionResult) => void,
    onInterimResult?: (text: string, confidence: number) => void
  ): void {
    this.onTranscriptionCallback = onTranscription || null;
    this.onInterimResultCallback = onInterimResult || null;
  }

  /**
   * Get current STT service status
   */
  getSTTStatus(): STTServiceStatus {
    return this.sttService.getStatus();
  }

  /**
   * Get AudioStreamMultiplexer status
   */
  getAudioStatus() {
    return this.audioMultiplexer.getStatus();
  }

  /**
   * Switch STT provider
   */
  async switchSTTProvider(provider: 'openai-whisper' | 'assemblyai' | 'web-speech-api'): Promise<void> {
    try {
      await this.sttService.switchProvider(provider);
      console.log(`🔄 Switched STT provider to: ${provider}`);
    } catch (error) {
      console.error(`❌ Failed to switch STT provider to ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get transcription history
   */
  getTranscriptionHistory(): STTTranscriptionResult[] {
    return this.sttService.getTranscriptionHistory();
  }

  /**
   * Clear transcription history
   */
  clearTranscriptionHistory(): void {
    this.sttService.clearHistory();
  }

  /**
   * Update STT configuration
   */
  updateSTTConfig(config: any): void {
    this.sttService.updateConfig(config);
  }

  /**
   * Destroy and clean up resources
   */
  async destroy(): Promise<void> {
    try {
      if (this.sttService) {
        await this.sttService.destroy();
      }

      // Note: We don't destroy AudioStreamMultiplexer here
      // as it might be used by other consumers (emotion analysis)
      
      this.isInitialized = false;
      console.log('🗑️ STT Audio Integration destroyed');

    } catch (error) {
      console.error('❌ Error destroying STT Integration:', error);
    }
  }
}

// Example usage for EMDR42
export async function createEMDRSTTIntegration(): Promise<STTAudioIntegration> {
  const integration = new STTAudioIntegration();

  // Set up callbacks for EMDR-specific processing
  integration.setCallbacks(
    // Final transcription callback
    (result: STTTranscriptionResult) => {
      console.log('🧠 EMDR Transcription received:', result.text);
      
      // Here you would:
      // 1. Send to AI therapist for analysis
      // 2. Update session memory
      // 3. Trigger therapeutic interventions
      // 4. Update patient dashboard
    },
    
    // Interim result callback
    (text: string, confidence: number) => {
      console.log('📝 EMDR Interim:', text);
      
      // Here you could:
      // 1. Update real-time UI
      // 2. Provide immediate feedback
      // 3. Detect trigger words
    }
  );

  await integration.initialize();
  return integration;
}

// Example component integration
export class EMDRSessionWithSTT {
  private sttIntegration: STTAudioIntegration;
  private sessionId: string;
  private isSessionActive: boolean = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.sttIntegration = new STTAudioIntegration();
  }

  async startEMDRSession(): Promise<void> {
    try {
      console.log(`🏥 Starting EMDR session with STT: ${this.sessionId}`);

      // Initialize STT integration
      await this.sttIntegration.initialize();

      // Set up EMDR-specific callbacks
      this.sttIntegration.setCallbacks(
        this.handlePatientSpeech.bind(this),
        this.handleInterimSpeech.bind(this)
      );

      // Start listening
      await this.sttIntegration.startListening();

      this.isSessionActive = true;
      console.log('✅ EMDR session with STT started successfully');

    } catch (error) {
      console.error('❌ Failed to start EMDR session with STT:', error);
      throw error;
    }
  }

  private handlePatientSpeech(result: STTTranscriptionResult): void {
    console.log(`👤 Patient said: "${result.text}" (${result.language})`);

    // EMDR-specific processing:
    // 1. Analyze emotional content
    // 2. Detect trauma triggers
    // 3. Measure session progress
    // 4. Generate AI therapist responses
    // 5. Update bilateral stimulation parameters

    // Example: Send to AI therapist
    this.sendToAITherapist(result);
  }

  private handleInterimSpeech(text: string, confidence: number): void {
    // Real-time processing for immediate feedback
    if (confidence > 0.7) {
      console.log(`👂 Real-time: "${text}"`);
      
      // Check for immediate intervention needs
      this.checkForImmediateIntervention(text);
    }
  }

  private async sendToAITherapist(transcription: STTTranscriptionResult): Promise<void> {
    try {
      // Example API call to AI therapist
      const response = await fetch('/api/ai-therapist/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcription.text,
          context: {
            sessionId: this.sessionId,
            transcriptionId: transcription.id,
            language: transcription.language,
            confidence: transcription.confidence,
            timestamp: transcription.timestamp
          }
        })
      });

      if (response.ok) {
        const aiResponse = await response.json();
        console.log('🤖 AI Therapist response:', aiResponse);
      }

    } catch (error) {
      console.error('❌ Error sending to AI therapist:', error);
    }
  }

  private checkForImmediateIntervention(text: string): void {
    // Check for distress keywords that need immediate intervention
    const distressKeywords = ['stop', 'help', 'scared', 'panic', 'hurt'];
    const lowerText = text.toLowerCase();

    if (distressKeywords.some(keyword => lowerText.includes(keyword))) {
      console.log('🚨 Immediate intervention needed detected');
      
      // Trigger immediate therapeutic response
      this.triggerImmediateIntervention();
    }
  }

  private triggerImmediateIntervention(): void {
    console.log('🛡️ Triggering immediate therapeutic intervention');
    
    // Example interventions:
    // 1. Pause bilateral stimulation
    // 2. Play calming audio
    // 3. Show grounding techniques
    // 4. Alert therapist
  }

  async stopEMDRSession(): Promise<void> {
    try {
      if (this.isSessionActive) {
        await this.sttIntegration.stopListening();
        this.isSessionActive = false;
        console.log('🏥 EMDR session with STT stopped');
      }
    } catch (error) {
      console.error('❌ Error stopping EMDR session:', error);
    }
  }

  async destroySession(): Promise<void> {
    await this.stopEMDRSession();
    await this.sttIntegration.destroy();
    console.log('🗑️ EMDR session destroyed');
  }
}

export default STTAudioIntegration;