/**
 * VoiceAITherapistService - Revolutionary Voice Conversation Engine for EMDR42
 * 
 * Complete integration of STT + AI + TTS for therapeutic voice conversations
 * Features:
 * - Real-time voice conversation with interruption support
 * - AudioStreamMultiplexer integration for conflict-free audio access
 * - Emotion-aware voice responses with UnifiedEmotionService
 * - Voice Activity Detection for natural conversation flow
 * - Crisis detection and emergency protocols
 * - Therapeutic voice selection and personalization
 * - Session management with EMDR phase awareness
 * - Error recovery and fallback to text mode
 */

import type {
  EmotionData,
  STTTranscriptionResult,
  STTServiceStatus,
  TTSSynthesisRequest,
  TTSSynthesisResponse,
  TTSVoiceConfig,
  TTSServiceStatus,
  AITherapistMessage,
  AISessionGuidance,
  AIChatContext,
  EMDRPhase,
  CrisisDetection,
  VoicePersonalizationProfile,
  TherapistTTSConfig,
  AudioConsumer,
  AudioStreamMultiplexerStatus,
  VADResult,
  EmotionalState98,
  PersonalizedRecommendation
} from '@/../../shared/types';

import { SpeechToTextService } from '../voice/speechToTextService';
import { TextToSpeechService } from '../voice/textToSpeechService';
import { AITherapistService } from './therapist';
import { UnifiedEmotionService } from '../emotion/emotionService';
import { AudioStreamMultiplexer, getAudioStreamMultiplexer } from '../audio/audioStreamMultiplexer';
import { generateDeterministicId } from '@/lib/deterministicUtils';

// === Voice Conversation Types ===

export type VoiceConversationState = 
  | 'idle'            // Not active
  | 'listening'       // Listening for patient speech
  | 'processing-stt'  // Converting speech to text
  | 'ai-processing'   // AI thinking/generating response
  | 'synthesizing'    // Converting AI response to speech
  | 'speaking'        // Playing AI response
  | 'interrupted'     // Conversation interrupted
  | 'error'           // Error state
  | 'crisis-mode';    // Crisis detected - special handling

export type VoiceListeningMode = 
  | 'push-to-talk'    // Press and hold to speak
  | 'continuous'      // Always listening with VAD
  | 'voice-activated' // Voice activation with keyword
  | 'adaptive';       // Adapts based on context

export interface VoiceConversationConfig {
  // Audio Configuration
  audio: {
    useMultiplexer: boolean;
    consumerPriority: number; // 8 - higher than emotion analysis
    sampleRate: number;
    enableEchoCancellation: boolean;
    enableNoiseSuppression: boolean;
  };
  
  // STT Configuration
  stt: {
    provider: 'openai-whisper' | 'assemblyai' | 'web-speech-api';
    language: 'auto' | 'en' | 'ru';
    enableRealtime: boolean;
    confidenceThreshold: number;
    enablePunctuation: boolean;
    enableCapitalization: boolean;
  };
  
  // TTS Configuration
  tts: {
    provider: 'google-cloud' | 'web-speech';
    defaultVoice: TTSVoiceConfig;
    enableEmotionalAdaptation: boolean;
    enablePersonalization: boolean;
    enableCaching: boolean;
    speed: number;
    volume: number;
  };
  
  // Voice Activity Detection
  vad: {
    enabled: boolean;
    threshold: number;
    silenceDuration: number; // ms of silence before stopping
    minSpeechDuration: number; // min speech duration to process
    adaptiveThreshold: boolean;
  };
  
  // Conversation Control
  conversation: {
    mode: VoiceListeningMode;
    enableInterruption: boolean;
    maxTurnDuration: number; // max seconds per turn
    responseTimeout: number; // max time to wait for response
    enableCrisisKeywords: boolean;
    emergencyKeywords: string[];
  };
  
  // AI Integration
  ai: {
    enableVoiceContext: boolean; // Include voice emotions in AI context
    enablePhaseAwareness: boolean; // Adapt behavior based on EMDR phase
    enableTherapeuticMemory: boolean; // Use session history
    enableCrisisDetection: boolean;
    crisisThreshold: number; // 0-1, crisis detection sensitivity
  };
  
  // Error Handling
  errorHandling: {
    maxRetries: number;
    fallbackToText: boolean;
    continueOnError: boolean;
    enableDegradedMode: boolean; // Continue with limited functionality
  };
}

export interface VoiceConversationStatus {
  state: VoiceConversationState;
  mode: VoiceListeningMode;
  isActive: boolean;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  
  // Component Status
  components: {
    audioMultiplexer: AudioStreamMultiplexerStatus;
    stt: STTServiceStatus;
    tts: TTSServiceStatus;
    emotionService: boolean; // is active
    aiService: boolean; // is active
  };
  
  // Current Session
  session: {
    sessionId: string | null;
    patientId: string | null;
    currentPhase: EMDRPhase | null;
    turnCount: number;
    duration: number; // seconds
  };
  
  // Audio Metrics
  audio: {
    inputLevel: number; // 0-1, current input audio level
    isVoiceActive: boolean; // VAD state
    vadConfidence: number; // 0-1, VAD confidence
    quality: number; // 0-1, overall audio quality
  };
  
  // Performance
  performance: {
    avgSTTLatency: number; // ms
    avgTTSLatency: number; // ms
    avgAILatency: number; // ms
    totalLatency: number; // ms, end-to-end
    errorRate: number; // 0-1
  };
  
  // Last Activity
  lastActivity: {
    lastTranscription: string | null;
    lastAIResponse: string | null;
    lastError: string | null;
    timestamp: number;
  };
}

export interface VoiceConversationTurn {
  id: string;
  timestamp: number;
  type: 'patient' | 'therapist';
  
  // Audio Data
  audio?: {
    duration: number;
    quality: number;
    vadConfidence: number;
  };
  
  // Transcription (for patient turns)
  transcription?: {
    text: string;
    confidence: number;
    language: string;
    processingTime: number;
  };
  
  // AI Response (for therapist turns)
  aiResponse?: {
    message: AITherapistMessage;
    processingTime: number;
    reasoning: string;
  };
  
  // TTS Synthesis (for therapist turns)
  synthesis?: {
    voice: TTSVoiceConfig;
    synthesisTime: number;
    audioSize: number;
    fromCache: boolean;
  };
  
  // Emotion Context
  emotionContext?: {
    patientEmotion: EmotionData;
    emotionalState: EmotionalState98;
    voiceEmotion: any; // Voice-specific emotion data
  };
  
  // Session Context
  sessionContext: {
    phase: EMDRPhase;
    phaseTime: number;
    turnInPhase: number;
  };
  
  // Crisis Detection
  crisisDetection?: CrisisDetection;
}

export interface VoiceConversationEvents {
  onStateChange: (state: VoiceConversationState, prevState: VoiceConversationState) => void;
  onTranscription: (result: STTTranscriptionResult) => void;
  onAIResponse: (message: AITherapistMessage) => void;
  onSpeechStart: () => void;
  onSpeechEnd: () => void;
  onError: (error: string, component: string) => void;
  onCrisisDetected: (crisis: CrisisDetection) => void;
  onInterruption: (reason: string) => void;
  onVoiceActivity: (isActive: boolean, confidence: number) => void;
  onTurnComplete: (turn: VoiceConversationTurn) => void;
}

// === Default Configuration ===

export const defaultVoiceConversationConfig: VoiceConversationConfig = {
  audio: {
    useMultiplexer: true,
    consumerPriority: 8, // Higher than emotion analysis (7)
    sampleRate: 16000,
    enableEchoCancellation: true,
    enableNoiseSuppression: true
  },
  stt: {
    provider: 'openai-whisper',
    language: 'auto',
    enableRealtime: true,
    confidenceThreshold: 0.7,
    enablePunctuation: true,
    enableCapitalization: true
  },
  tts: {
    provider: 'google-cloud',
    defaultVoice: {
      name: 'en-US-Studio-O',
      language: 'en-US',
      gender: 'female',
      age: 'adult',
      accent: 'american',
      characteristics: {
        warmth: 0.9,
        authority: 0.4,
        empathy: 0.95,
        clarity: 0.9,
        pace: 'normal',
        calmness: 0.9
      },
      therapeuticProfile: {
        anxietyFriendly: true,
        traumaSensitive: true,
        childFriendly: true,
        culturallySensitive: ['en-US', 'universal']
      }
    },
    enableEmotionalAdaptation: true,
    enablePersonalization: true,
    enableCaching: true,
    speed: 1.0,
    volume: 0.8
  },
  vad: {
    enabled: true,
    threshold: 0.02,
    silenceDuration: 2000, // 2 seconds
    minSpeechDuration: 500, // 0.5 seconds
    adaptiveThreshold: true
  },
  conversation: {
    mode: 'continuous',
    enableInterruption: true,
    maxTurnDuration: 60, // 60 seconds max per turn
    responseTimeout: 10000, // 10 seconds max response time
    enableCrisisKeywords: true,
    emergencyKeywords: ['help', 'emergency', 'crisis', 'suicide', 'harm', 'danger']
  },
  ai: {
    enableVoiceContext: true,
    enablePhaseAwareness: true,
    enableTherapeuticMemory: true,
    enableCrisisDetection: true,
    crisisThreshold: 0.7
  },
  errorHandling: {
    maxRetries: 3,
    fallbackToText: true,
    continueOnError: true,
    enableDegradedMode: true
  }
};

// === Main VoiceAITherapistService Class ===

export class VoiceAITherapistService {
  private config: VoiceConversationConfig;
  private status: VoiceConversationStatus;
  private events: Partial<VoiceConversationEvents> = {};
  
  // Core Services
  private sttService: SpeechToTextService;
  private ttsService: TextToSpeechService;
  private aiService: AITherapistService;
  private emotionService: UnifiedEmotionService | null = null;
  private audioMultiplexer: AudioStreamMultiplexer | null = null;
  
  // === Emotion Integration ===
  private currentEmotion: EmotionData | null = null;
  private emotionHistory: EmotionData[] = [];
  private emotionCallbacks: Set<(emotion: EmotionData) => void> = new Set();
  private crisisThresholdExceeded: boolean = false;
  private lastEmotionUpdate: number = 0;
  
  // State Management
  private isInitialized: boolean = false;
  private currentSessionId: string | null = null;
  private currentPatientId: string | null = null;
  private conversationTurns: VoiceConversationTurn[] = [];
  private audioConsumerId: string | null = null;
  
  // Audio Processing
  private isRecording: boolean = false;
  private audioBuffer: Float32Array[] = [];
  private vadResults: VADResult[] = [];
  private lastVoiceActivity: number = 0;
  private speechStartTime: number = 0;
  
  // Timing and Performance
  private sessionStartTime: number = 0;
  private turnStartTime: number = 0;
  private performanceMetrics = {
    sttLatencies: [] as number[],
    ttsLatencies: [] as number[],
    aiLatencies: [] as number[],
    errorCount: 0,
    totalTurns: 0
  };
  
  // Error Handling
  private retryCount: number = 0;
  private lastError: string | null = null;
  private degradedMode: boolean = false;
  
  // TTS Playback Control
  private currentAudio: HTMLAudioElement | null = null;
  private isPlayingResponse: boolean = false;
  
  constructor(config?: Partial<VoiceConversationConfig>) {
    this.config = {
      ...defaultVoiceConversationConfig,
      ...config
    };
    
    // Initialize core services
    this.sttService = new SpeechToTextService();
    this.ttsService = new TextToSpeechService();
    this.aiService = new AITherapistService();
    
    // Initialize status
    this.status = this.createInitialStatus();
    
    this.setupEventHandlers();
    
    console.log('🎙️ VoiceAITherapistService created with config:', this.config);
  }
  
  // === Initialization ===
  
  /**
   * Initialize the voice conversation service
   */
  async initialize(emotionService?: UnifiedEmotionService): Promise<void> {
    if (this.isInitialized) {
      console.warn('VoiceAITherapistService already initialized');
      return;
    }
    
    try {
      console.log('🚀 Initializing VoiceAITherapistService...');
      
      // Store emotion service reference and setup integration
      this.emotionService = emotionService || null;
      if (this.emotionService) {
        await this.setupEmotionIntegration();
      }
      
      // Initialize AudioStreamMultiplexer
      if (this.config.audio.useMultiplexer) {
        await this.initializeAudioMultiplexer();
      }
      
      // Initialize STT Service
      await this.sttService.initialize({
        providers: {
          primary: this.config.stt.provider,
          fallback: ['web-speech-api'],
          enableFailover: true,
          failoverThreshold: 0.3
        },
        processing: {
          mode: this.config.stt.enableRealtime ? 'streaming' : 'batch',
          realTimeEnabled: this.config.stt.enableRealtime,
          batchSizeMs: 3000,
          bufferSizeMs: 500,
          minSilenceDuration: this.config.vad.silenceDuration
        },
        language: {
          primary: this.config.stt.language,
          autoDetect: this.config.stt.language === 'auto',
          supportedLanguages: ['en', 'ru', 'auto'],
          enableTranslation: false
        },
        quality: {
          enableVAD: this.config.vad.enabled,
          vadThreshold: this.config.vad.threshold,
          enableNoiseSuppression: this.config.audio.enableNoiseSuppression,
          enablePunctuation: this.config.stt.enablePunctuation,
          enableCapitalization: this.config.stt.enableCapitalization,
          enableProfanityFilter: false
        }
      });
      
      // Initialize TTS Service
      await this.ttsService.initialize({
        primaryProvider: this.config.tts.provider,
        fallbackProviders: ['web-speech'],
        defaultVoice: this.config.tts.defaultVoice,
        defaultQuality: {
          sampleRate: 24000,
          bitRate: 128,
          format: 'mp3',
          channels: 1,
          compression: 'medium'
        },
        cache: {
          enabled: this.config.tts.enableCaching,
          maxSize: 100, // 100MB cache
          ttl: 3600 // 1 hour
        }
      });
      
      this.isInitialized = true;
      this.updateStatus();
      
      console.log('✅ VoiceAITherapistService initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize VoiceAITherapistService:', error);
      this.handleError(`Initialization failed: ${error}`, 'initialization');
      throw error;
    }
  }
  
  /**
   * Initialize AudioStreamMultiplexer for conflict-free audio access
   */
  private async initializeAudioMultiplexer(): Promise<void> {
    try {
      // Get global multiplexer instance
      this.audioMultiplexer = getAudioStreamMultiplexer({
        masterAudio: {
          sampleRate: this.config.audio.sampleRate,
          channels: 1,
          bufferSize: 4096,
          echoCancellation: this.config.audio.enableEchoCancellation,
          noiseSuppression: this.config.audio.enableNoiseSuppression,
          autoGainControl: true
        }
      });
      
      // Initialize if not already done
      if (!this.audioMultiplexer.getStatus().isInitialized) {
        await this.audioMultiplexer.initializeStream();
      }
      
      // Create audio consumer for voice conversation
      const consumerId = `voice-conversation-${generateDeterministicId()}`;
      const consumer: AudioConsumer = {
        id: consumerId,
        name: 'Voice AI Therapist',
        type: 'voice-chat',
        priority: this.config.audio.consumerPriority,
        active: false, // Will be activated when conversation starts
        config: {
          sampleRate: this.config.audio.sampleRate,
          channels: 1,
          bufferSize: 4096,
          enableEchoCancellation: this.config.audio.enableEchoCancellation,
          enableNoiseSuppression: this.config.audio.enableNoiseSuppression,
          enableAutoGainControl: true
        },
        onAudioData: (audioData: Float32Array, sampleRate: number) => {
          this.handleAudioData(audioData, sampleRate);
        },
        onAudioChunk: (audioChunk: Blob) => {
          this.handleAudioChunk(audioChunk);
        },
        onStatusChange: (status) => {
          console.log('Voice conversation consumer status:', status);
          this.updateStatus();
        },
        onError: (error) => {
          console.error('Voice conversation consumer error:', error);
          this.handleError(`Audio consumer error: ${error}`, 'audio');
        }
      };
      
      // Add consumer to multiplexer
      const success = await this.audioMultiplexer.addConsumer(consumer);
      if (success) {
        this.audioConsumerId = consumerId;
        console.log(`✅ Added voice conversation consumer: ${consumerId}`);
      } else {
        throw new Error('Failed to add consumer to AudioStreamMultiplexer');
      }
      
    } catch (error) {
      console.error('Failed to initialize AudioStreamMultiplexer:', error);
      // Continue without multiplexer (fallback mode)
      this.config.audio.useMultiplexer = false;
      console.log('Continuing without AudioStreamMultiplexer (fallback mode)');
    }
  }
  
  // === Emotion Integration Methods ===
  
  /**
   * Setup emotion service integration
   */
  private async setupEmotionIntegration(): Promise<void> {
    if (!this.emotionService) return;
    
    try {
      console.log('🎭 Setting up emotion integration...');
      
      // Start voice session mode on emotion service
      await this.emotionService.startVoiceSession((emotion: EmotionData) => {
        this.handleRealTimeEmotion(emotion);
      });
      
      // Add additional callback for voice session emotions
      const emotionCallback = this.emotionService.addVoiceSessionCallback((emotion: EmotionData) => {
        this.updateEmotionState(emotion);
      });
      
      console.log('✅ Emotion integration setup complete');
      
    } catch (error) {
      console.error('Failed to setup emotion integration:', error);
      // Continue without emotion integration
    }
  }
  
  /**
   * Handle real-time emotion updates during voice conversation
   */
  private handleRealTimeEmotion(emotion: EmotionData): void {
    this.currentEmotion = emotion;
    this.lastEmotionUpdate = Date.now();
    
    // Add to emotion history (keep last 10 emotions)
    this.emotionHistory.push(emotion);
    if (this.emotionHistory.length > 10) {
      this.emotionHistory.shift();
    }
    
    // === PRIORITY: Enhanced Crisis Monitoring and Interruption System ===
    // Monitor for crisis conditions with real-time interruption capability
    this.monitorEmotionCrisisThresholds(emotion);
    
    // Legacy crisis detection (kept for compatibility)
    if (this.config.ai.enableCrisisDetection) {
      this.checkEmotionCrisis(emotion);
    }
    
    // Notify callbacks
    this.emotionCallbacks.forEach(callback => {
      try {
        callback(emotion);
      } catch (error) {
        console.error('Error in emotion callback:', error);
      }
    });
    
    // Emit emotion event
    this.emitEvent('onEmotionUpdate', emotion);
  }
  
  /**
   * Update internal emotion state
   */
  private updateEmotionState(emotion: EmotionData): void {
    this.currentEmotion = emotion;
    
    // Update status with emotion information
    this.updateStatus();
  }
  
  /**
   * Check for crisis-level emotions and trigger intervention
   */
  private checkEmotionCrisis(emotion: EmotionData): void {
    // Calculate crisis score based on multiple factors
    let crisisScore = 0;
    
    // High negative arousal + low valence = crisis
    if (emotion.arousal > 0.7 && emotion.valence < -0.7) {
      crisisScore += 0.4;
    }
    
    // Very low valence (extreme sadness/despair)
    if (emotion.valence < -0.8) {
      crisisScore += 0.3;
    }
    
    // Check specific emotion patterns
    if (emotion.basicEmotions.fearful > 0.8 || emotion.basicEmotions.angry > 0.8) {
      crisisScore += 0.3;
    }
    
    // Low fusion confidence might indicate emotional distress
    if (emotion.fusion.confidence < 0.5) {
      crisisScore += 0.1;
    }
    
    // Check if crisis threshold exceeded
    if (crisisScore >= this.config.ai.crisisThreshold && !this.crisisThresholdExceeded) {
      this.crisisThresholdExceeded = true;
      this.handleEmotionCrisis(emotion, crisisScore);
    } else if (crisisScore < this.config.ai.crisisThreshold * 0.7) {
      // Reset crisis state if emotions improve significantly
      this.crisisThresholdExceeded = false;
    }
  }
  
  /**
   * Handle crisis-level emotions detected during voice conversation
   */
  private async handleEmotionCrisis(emotion: EmotionData, crisisScore: number): Promise<void> {
    console.warn(`🚨 Crisis-level emotion detected! Score: ${crisisScore}, Arousal: ${emotion.arousal}, Valence: ${emotion.valence}`);
    
    try {
      // Interrupt current conversation if speaking
      if (this.status.isSpeaking) {
        await this.interruptConversation('crisis-detected');
      }
      
      // Switch to crisis mode
      this.status.state = 'crisis-mode';
      this.updateStatus();
      
      // Generate crisis intervention response
      const crisisContext: AIChatContext = {
        sessionId: this.currentSessionId || '',
        patientId: this.currentPatientId || '',
        currentPhase: this.status.session.currentPhase || 'preparation',
        emotionContext: emotion,
        recentMessages: this.conversationTurns.slice(-3).map(turn => ({
          role: turn.type === 'patient' ? 'user' : 'assistant',
          content: turn.transcription?.text || turn.aiResponse?.message.content || ''
        })),
        crisisDetected: true,
        crisisLevel: crisisScore
      };
      
      // Get crisis intervention response from AI
      const crisisResponse = await this.aiService.generateCrisisIntervention(crisisContext);
      
      // Use calm, supportive voice for crisis intervention
      const crisisVoice = this.getEmotionAdaptedVoice(emotion, true);
      
      // Synthesize and speak crisis response immediately
      await this.speakResponse(crisisResponse.content, crisisVoice);
      
      // Emit crisis event
      this.emitEvent('onCrisisDetected', emotion, crisisScore);
      
    } catch (error) {
      console.error('Error handling emotion crisis:', error);
      // Fallback to basic crisis message
      await this.speakResponse(
        "I notice you might be experiencing some intense emotions right now. You're safe here with me. Let's take a moment to breathe together.",
        this.config.tts.defaultVoice
      );
    }
  }
  
  /**
   * Get emotion-adapted voice configuration
   */
  private getEmotionAdaptedVoice(emotion: EmotionData, isCrisis: boolean = false): TTSVoiceConfig {
    if (!this.config.tts.enableEmotionalAdaptation) {
      return this.config.tts.defaultVoice;
    }
    
    const baseVoice = { ...this.config.tts.defaultVoice };
    
    if (isCrisis) {
      // Crisis mode: calm, slow, reassuring
      return {
        ...baseVoice,
        characteristics: {
          ...baseVoice.characteristics,
          warmth: Math.max(0.9, baseVoice.characteristics?.warmth || 0.8),
          calmness: Math.max(0.95, baseVoice.characteristics?.calmness || 0.8),
          pace: 'slow',
          empathy: Math.max(0.98, baseVoice.characteristics?.empathy || 0.8)
        }
      };
    }
    
    // Adapt voice based on emotion
    const adaptedVoice = { ...baseVoice };
    
    // High arousal = slower pace to calm patient
    if (emotion.arousal > 0.6) {
      adaptedVoice.characteristics = {
        ...adaptedVoice.characteristics,
        pace: 'slow',
        calmness: Math.min(1.0, (adaptedVoice.characteristics?.calmness || 0.8) + 0.1)
      };
    }
    
    // Low valence = more warmth and empathy
    if (emotion.valence < -0.3) {
      adaptedVoice.characteristics = {
        ...adaptedVoice.characteristics,
        warmth: Math.min(1.0, (adaptedVoice.characteristics?.warmth || 0.8) + 0.15),
        empathy: Math.min(1.0, (adaptedVoice.characteristics?.empathy || 0.8) + 0.1)
      };
    }
    
    // Positive emotions = slightly more energetic
    if (emotion.valence > 0.5 && emotion.arousal > 0.3) {
      adaptedVoice.characteristics = {
        ...adaptedVoice.characteristics,
        pace: 'normal'
      };
    }
    
    return adaptedVoice;
  }
  
  /**
   * Add emotion callback for external listeners
   */
  addEmotionCallback(callback: (emotion: EmotionData) => void): () => void {
    this.emotionCallbacks.add(callback);
    return () => this.emotionCallbacks.delete(callback);
  }
  
  /**
   * Get current emotion data
   */
  getCurrentEmotion(): EmotionData | null {
    return this.currentEmotion;
  }
  
  /**
   * Get emotion history for analysis
   */
  getEmotionHistory(): EmotionData[] {
    return [...this.emotionHistory];
  }
  
  // === Voice Conversation Control ===
  
  /**
   * Start voice conversation session
   */
  async startConversation(sessionId: string, patientId: string, phase: EMDRPhase): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Service not initialized. Call initialize() first.');
    }
    
    try {
      console.log(`🎙️ Starting voice conversation - Session: ${sessionId}, Patient: ${patientId}, Phase: ${phase}`);
      
      // Store session info
      this.currentSessionId = sessionId;
      this.currentPatientId = patientId;
      this.sessionStartTime = Date.now();
      this.conversationTurns = [];
      this.retryCount = 0;
      this.performanceMetrics = {
        sttLatencies: [],
        ttsLatencies: [],
        aiLatencies: [],
        errorCount: 0,
        totalTurns: 0
      };
      
      // Initialize AI therapist session
      this.aiService.initializeSession(sessionId, patientId, phase);
      
      // === Start emotion service voice session ===
      if (this.emotionService && !this.emotionService.isVoiceSessionActive()) {
        await this.emotionService.startVoiceSession((emotion: EmotionData) => {
          this.handleRealTimeEmotion(emotion);
        });
        console.log('✅ Emotion service voice session started');
      }
      
      // Activate audio consumer if using multiplexer
      if (this.audioMultiplexer && this.audioConsumerId) {
        await this.audioMultiplexer.updateConsumer(this.audioConsumerId, { active: true });
        await this.audioMultiplexer.startStreaming();
      }
      
      // Start listening based on mode
      await this.startListening();
      
      // Update status
      this.status.state = 'listening';
      this.status.isActive = true;
      this.status.session.sessionId = sessionId;
      this.status.session.patientId = patientId;
      this.status.session.currentPhase = phase;
      this.updateStatus();
      
      this.emitEvent('onStateChange', 'listening', 'idle');
      
      // Send initial greeting
      await this.sendInitialGreeting(phase);
      
      console.log('✅ Voice conversation started successfully');
      
    } catch (error) {
      console.error('Failed to start voice conversation:', error);
      this.handleError(`Failed to start conversation: ${error}`, 'conversation');
      throw error;
    }
  }
  
  /**
   * Stop voice conversation
   */
  async stopConversation(): Promise<void> {
    try {
      console.log('🛑 Stopping voice conversation...');
      
      // Stop any ongoing speech
      this.stopSpeaking();
      
      // Stop listening
      await this.stopListening();
      
      // === Stop emotion service voice session ===
      if (this.emotionService && this.emotionService.isVoiceSessionActive()) {
        await this.emotionService.stopVoiceSession();
        console.log('Emotion service voice session stopped');
      }
      
      // Deactivate audio consumer
      if (this.audioMultiplexer && this.audioConsumerId) {
        await this.audioMultiplexer.updateConsumer(this.audioConsumerId, { active: false });
      }
      
      // Update status
      this.status.state = 'idle';
      this.status.isActive = false;
      this.status.isListening = false;
      this.status.isProcessing = false;
      this.status.isSpeaking = false;
      this.updateStatus();
      
      this.emitEvent('onStateChange', 'idle', this.status.state);
      
      // Clear session data
      this.currentSessionId = null;
      this.currentPatientId = null;
      this.conversationTurns = [];
      
      console.log('✅ Voice conversation stopped');
      
    } catch (error) {
      console.error('Error stopping voice conversation:', error);
      this.handleError(`Error stopping conversation: ${error}`, 'conversation');
    }
  }
  
  /**
   * Interrupt current conversation (e.g., patient speaks while AI is talking)
   */
  async interruptConversation(reason: string = 'patient-speech'): Promise<void> {
    console.log(`⚡ Interrupting conversation: ${reason}`);
    
    // Stop any TTS playback
    this.stopSpeaking();
    
    // Update state
    this.status.state = 'interrupted';
    this.updateStatus();
    
    this.emitEvent('onInterruption', reason);
    this.emitEvent('onStateChange', 'interrupted', this.status.state);
    
    // Resume listening after brief pause
    setTimeout(async () => {
      if (this.status.isActive) {
        this.status.state = 'listening';
        this.updateStatus();
        this.emitEvent('onStateChange', 'listening', 'interrupted');
      }
    }, 500);
  }
  
  // === Audio Processing ===
  
  /**
   * Start listening for patient speech
   */
  private async startListening(): Promise<void> {
    if (this.isRecording) return;
    
    try {
      this.isRecording = true;
      this.status.isListening = true;
      
      // Clear audio buffer
      this.audioBuffer = [];
      this.vadResults = [];
      
      // Start STT service if not using multiplexer
      if (!this.config.audio.useMultiplexer) {
        await this.sttService.startListening();
      }
      
      console.log('👂 Started listening for patient speech');
      
    } catch (error) {
      console.error('Failed to start listening:', error);
      this.handleError(`Failed to start listening: ${error}`, 'stt');
    }
  }
  
  /**
   * Stop listening
   */
  private async stopListening(): Promise<void> {
    if (!this.isRecording) return;
    
    try {
      this.isRecording = false;
      this.status.isListening = false;
      
      // Stop STT service if not using multiplexer
      if (!this.config.audio.useMultiplexer) {
        await this.sttService.stopListening();
      }
      
      console.log('🔇 Stopped listening');
      
    } catch (error) {
      console.error('Failed to stop listening:', error);
    }
  }
  
  /**
   * Handle incoming audio data from AudioStreamMultiplexer
   */
  private handleAudioData(audioData: Float32Array, sampleRate: number): void {
    if (!this.isRecording || this.status.state !== 'listening') return;
    
    try {
      // Store in buffer
      this.audioBuffer.push(audioData);
      
      // Update audio level in status
      const rms = this.calculateRMS(audioData);
      this.status.audio.inputLevel = Math.min(1, rms * 10);
      
      // Perform Voice Activity Detection
      if (this.config.vad.enabled) {
        const vadResult = this.performVAD(audioData, sampleRate);
        this.vadResults.push(vadResult);
        this.status.audio.isVoiceActive = vadResult.isVoiceActive;
        this.status.audio.vadConfidence = vadResult.confidence;
        
        this.emitEvent('onVoiceActivity', vadResult.isVoiceActive, vadResult.confidence);
        
        // Handle voice activity changes
        this.handleVoiceActivity(vadResult);
      }
      
      // Send audio to STT service if using multiplexer
      if (this.config.audio.useMultiplexer) {
        // Convert to Blob for STT processing
        const audioBlob = this.audioDataToBlob(audioData, sampleRate);
        this.sttService.processAudioChunk(audioBlob);
      }
      
    } catch (error) {
      console.error('Error handling audio data:', error);
    }
  }
  
  /**
   * Handle audio chunks from AudioStreamMultiplexer
   */
  private handleAudioChunk(audioChunk: Blob): void {
    if (!this.isRecording || this.status.state !== 'listening') return;
    
    try {
      // Send to STT service
      this.sttService.processAudioChunk(audioChunk);
    } catch (error) {
      console.error('Error handling audio chunk:', error);
    }
  }
  
  /**
   * Perform Voice Activity Detection on audio data
   */
  private performVAD(audioData: Float32Array, sampleRate: number): VADResult {
    const timestamp = Date.now();
    
    // Calculate energy
    const energy = this.calculateRMS(audioData);
    
    // Simple VAD based on energy threshold
    const threshold = this.config.vad.adaptiveThreshold 
      ? this.calculateAdaptiveThreshold() 
      : this.config.vad.threshold;
    
    const isVoiceActive = energy > threshold;
    const confidence = Math.min(1, energy / threshold);
    
    // Calculate basic spectral features
    const spectralFeatures = {
      zeroCrossingRate: this.calculateZeroCrossingRate(audioData),
      spectralCentroid: 0.5, // Simplified
      spectralRolloff: 0.8   // Simplified
    };
    
    return {
      timestamp,
      isVoiceActive,
      confidence,
      energy,
      spectralFeatures
    };
  }
  
  /**
   * Handle voice activity changes
   */
  private handleVoiceActivity(vadResult: VADResult): void {
    const now = Date.now();
    
    if (vadResult.isVoiceActive) {
      // Voice detected
      if (this.lastVoiceActivity === 0) {
        // Speech started
        this.speechStartTime = now;
        this.emitEvent('onSpeechStart');
        console.log('🗣️ Speech started');
      }
      this.lastVoiceActivity = now;
      
    } else {
      // No voice detected
      if (this.lastVoiceActivity > 0) {
        const silenceDuration = now - this.lastVoiceActivity;
        
        // Check if silence duration exceeds threshold
        if (silenceDuration > this.config.vad.silenceDuration) {
          // Speech ended
          const speechDuration = this.lastVoiceActivity - this.speechStartTime;
          
          if (speechDuration > this.config.vad.minSpeechDuration) {
            // Valid speech detected, process it
            this.handleSpeechEnd();
          }
          
          this.lastVoiceActivity = 0;
          this.speechStartTime = 0;
        }
      }
    }
  }
  
  /**
   * Handle end of speech detection
   */
  private async handleSpeechEnd(): Promise<void> {
    console.log('🔚 Speech ended, processing...');
    
    this.emitEvent('onSpeechEnd');
    
    // Trigger STT processing if using multiplexer
    if (this.config.audio.useMultiplexer && this.audioBuffer.length > 0) {
      // Convert buffered audio to format for STT
      const combinedAudio = this.combineAudioBuffers(this.audioBuffer);
      const audioBlob = this.audioDataToBlob(combinedAudio, this.config.audio.sampleRate);
      
      // Clear buffer
      this.audioBuffer = [];
      
      // Process with STT
      await this.processSTT(audioBlob);
    }
  }
  
  // === Speech-to-Text Processing ===
  
  /**
   * Process audio with STT and handle result
   */
  private async processSTT(audioBlob: Blob): Promise<void> {
    if (this.status.state !== 'listening') return;
    
    try {
      this.status.state = 'processing-stt';
      this.status.isProcessing = true;
      this.updateStatus();
      
      this.emitEvent('onStateChange', 'processing-stt', 'listening');
      
      const startTime = Date.now();
      
      // Process with STT service
      const result = await this.sttService.transcribeAudio(audioBlob);
      
      const sttLatency = Date.now() - startTime;
      this.performanceMetrics.sttLatencies.push(sttLatency);
      
      if (result && result.text.trim() && result.confidence >= this.config.stt.confidenceThreshold) {
        console.log(`📝 Transcription: "${result.text}" (confidence: ${result.confidence})`);
        
        this.emitEvent('onTranscription', result);
        
        // Check for crisis keywords
        if (this.config.conversation.enableCrisisKeywords) {
          const crisisDetected = this.detectCrisisKeywords(result.text);
          if (crisisDetected) {
            await this.handleCrisisDetection(crisisDetected);
            return;
          }
        }
        
        // Process with AI
        await this.processAI(result.text, result);
        
      } else {
        console.log('❌ STT result below confidence threshold or empty');
        // Resume listening
        this.status.state = 'listening';
        this.status.isProcessing = false;
        this.updateStatus();
      }
      
    } catch (error) {
      console.error('STT processing error:', error);
      this.handleError(`STT processing failed: ${error}`, 'stt');
      
      // Resume listening on error
      this.status.state = 'listening';
      this.status.isProcessing = false;
      this.updateStatus();
    }
  }
  
  // === AI Processing ===
  
  /**
   * Process transcribed text with AI therapist
   */
  private async processAI(text: string, sttResult: STTTranscriptionResult): Promise<void> {
    try {
      this.status.state = 'ai-processing';
      this.updateStatus();
      
      this.emitEvent('onStateChange', 'ai-processing', 'processing-stt');
      
      const startTime = Date.now();
      
      // Get current emotion data from emotion service
      let currentEmotion: EmotionData | null = null;
      if (this.emotionService && this.config.ai.enableVoiceContext) {
        currentEmotion = this.emotionService.getCurrentEmotion();
      }
      
      // Create enhanced context with voice information
      const enhancedText = this.config.ai.enableVoiceContext && currentEmotion
        ? this.enhanceTextWithVoiceContext(text, sttResult, currentEmotion)
        : text;
      
      // Send to AI therapist
      const aiResponse = await this.aiService.sendMessage(enhancedText);
      
      const aiLatency = Date.now() - startTime;
      this.performanceMetrics.aiLatencies.push(aiLatency);
      
      console.log(`🤖 AI Response: "${aiResponse.content}"`);
      
      this.emitEvent('onAIResponse', aiResponse);
      
      // Check for crisis detection in AI response
      if (aiResponse.crisisDetection?.isCrisis) {
        await this.handleCrisisDetection(aiResponse.crisisDetection);
        return;
      }
      
      // Create conversation turn record
      const turn = this.createConversationTurn('patient', {
        transcription: {
          text,
          confidence: sttResult.confidence,
          language: sttResult.language,
          processingTime: this.performanceMetrics.sttLatencies[this.performanceMetrics.sttLatencies.length - 1]
        },
        emotionContext: currentEmotion ? {
          patientEmotion: currentEmotion,
          emotionalState: this.extractEmotionalState(currentEmotion),
          voiceEmotion: sttResult.providerData?.emotions || null
        } : undefined
      });
      
      this.conversationTurns.push(turn);
      
      // Process TTS for AI response
      await this.processTTS(aiResponse, turn);
      
    } catch (error) {
      console.error('AI processing error:', error);
      this.handleError(`AI processing failed: ${error}`, 'ai');
      
      // Fallback response
      await this.provideFallbackResponse();
    }
  }
  
  /**
   * Enhance text with voice context for better AI understanding
   */
  private enhanceTextWithVoiceContext(
    text: string, 
    sttResult: STTTranscriptionResult, 
    emotion: EmotionData
  ): string {
    const voiceContext = [
      `Patient said: "${text}"`,
      `Voice confidence: ${sttResult.confidence.toFixed(2)}`,
      `Emotional state: arousal=${emotion.arousal.toFixed(2)}, valence=${emotion.valence.toFixed(2)}`,
      `Voice quality: ${sttResult.audioQuality.clarity.toFixed(2)}`
    ];
    
    if (emotion.sources.voice) {
      const voice = emotion.sources.voice;
      voiceContext.push(
        `Voice prosody: pace=${voice.prosody.pace.toFixed(2)}, stability=${voice.prosody.stability.toFixed(2)}`,
        `Voice emotions: stress=${voice.voiceEmotions.stress.toFixed(2)}, engagement=${voice.voiceEmotions.engagement.toFixed(2)}`
      );
    }
    
    return voiceContext.join('\n') + '\n\nPlease respond considering the voice context above.';
  }
  
  // === Text-to-Speech Processing ===
  
  /**
   * Process AI response with TTS
   */
  private async processTTS(aiResponse: AITherapistMessage, patientTurn?: VoiceConversationTurn): Promise<void> {
    try {
      this.status.state = 'synthesizing';
      this.updateStatus();
      
      this.emitEvent('onStateChange', 'synthesizing', 'ai-processing');
      
      const startTime = Date.now();
      
      // Select appropriate voice based on context
      const voice = await this.selectTherapeuticVoice(aiResponse);
      
      // Create TTS request
      const ttsRequest: TTSSynthesisRequest = {
        text: aiResponse.content,
        voice,
        quality: {
          sampleRate: 24000,
          bitRate: 128,
          format: 'mp3',
          channels: 1,
          compression: 'medium'
        },
        options: {
          ssmlEnabled: false,
          speed: this.config.tts.speed,
          pitch: 0,
          volume: this.config.tts.volume,
          emphasis: 'moderate',
          breaks: {
            sentence: 500,
            paragraph: 1000,
            comma: 200
          }
        },
        metadata: {
          sessionId: this.currentSessionId,
          patientId: this.currentPatientId,
          context: 'therapy-response',
          priority: 'normal'
        }
      };
      
      // Synthesize speech
      const ttsResponse = await this.ttsService.synthesize(ttsRequest);
      
      const ttsLatency = Date.now() - startTime;
      this.performanceMetrics.ttsLatencies.push(ttsLatency);
      
      console.log(`🔊 TTS synthesized: ${ttsResponse.duration}s audio, ${ttsResponse.size} bytes`);
      
      // Create therapist conversation turn
      const therapistTurn = this.createConversationTurn('therapist', {
        aiResponse: {
          message: aiResponse,
          processingTime: this.performanceMetrics.aiLatencies[this.performanceMetrics.aiLatencies.length - 1],
          reasoning: aiResponse.metadata?.reasoning || ''
        },
        synthesis: {
          voice,
          synthesisTime: ttsLatency,
          audioSize: ttsResponse.size,
          fromCache: ttsResponse.metadata.fromCache
        }
      });
      
      this.conversationTurns.push(therapistTurn);
      this.emitEvent('onTurnComplete', therapistTurn);
      
      // Play the synthesized audio
      await this.playTTSResponse(ttsResponse);
      
    } catch (error) {
      console.error('TTS processing error:', error);
      this.handleError(`TTS processing failed: ${error}`, 'tts');
      
      // Fallback to text display or simple speech
      await this.provideFallbackResponse();
    }
  }
  
  /**
   * Select appropriate therapeutic voice based on context
   */
  private async selectTherapeuticVoice(aiResponse: AITherapistMessage): Promise<TTSVoiceConfig> {
    // Get current emotion context
    let currentEmotion: EmotionData | null = null;
    if (this.emotionService) {
      currentEmotion = this.emotionService.getCurrentEmotion();
    }
    
    // Default to configured voice
    let selectedVoice = this.config.tts.defaultVoice;
    
    // Adapt voice based on emotional context
    if (this.config.tts.enableEmotionalAdaptation && currentEmotion) {
      selectedVoice = this.adaptVoiceForEmotion(selectedVoice, currentEmotion);
    }
    
    // Adapt voice based on crisis level
    if (aiResponse.metadata?.criticalityLevel === 'crisis') {
      selectedVoice = {
        ...selectedVoice,
        characteristics: {
          ...selectedVoice.characteristics,
          warmth: 0.95,
          empathy: 1.0,
          authority: 0.8,
          clarity: 1.0,
          pace: 'slow'
        }
      };
    }
    
    return selectedVoice;
  }
  
  /**
   * Adapt voice characteristics based on patient emotion
   * Comprehensive emotion-driven voice adaptation system
   */
  private adaptVoiceForEmotion(voice: TTSVoiceConfig, emotion: EmotionData): TTSVoiceConfig {
    const adapted = { ...voice };
    
    // === Crisis-level emotions (immediate intervention needed) ===
    if (emotion.arousal > 0.8 && emotion.valence < -0.7) {
      adapted.characteristics = {
        ...adapted.characteristics,
        warmth: 0.98,
        empathy: 1.0,
        calmness: 0.95,
        pace: 'slow',
        clarity: 1.0,
        authority: 0.7
      };
      adapted.speed = 0.7; // Significantly slower for crisis
      adapted.pitch = 'low'; // Lower, calming pitch
      return adapted;
    }
    
    // === High anxiety/panic (arousal > 0.7, negative valence) ===
    if (emotion.arousal > 0.7 && emotion.valence < -0.3) {
      adapted.characteristics = {
        ...adapted.characteristics,
        warmth: Math.min(1, adapted.characteristics.warmth + 0.25),
        empathy: Math.min(1, adapted.characteristics.empathy + 0.2),
        pace: 'slow',
        calmness: Math.min(1, adapted.characteristics.calmness + 0.4),
        clarity: Math.min(1, adapted.characteristics.clarity + 0.15)
      };
      adapted.speed = 0.8; // Slower speech for anxiety
      adapted.pitch = 'low'; // Calming lower pitch
    }
    
    // === Depression/sadness (low arousal, very negative valence) ===
    else if (emotion.arousal < 0.4 && emotion.valence < -0.5) {
      adapted.characteristics = {
        ...adapted.characteristics,
        warmth: Math.min(1, adapted.characteristics.warmth + 0.3),
        empathy: Math.min(1, adapted.characteristics.empathy + 0.25),
        pace: 'slow',
        calmness: Math.min(1, adapted.characteristics.calmness + 0.2),
        authority: Math.max(0.2, adapted.characteristics.authority - 0.1) // Less authoritative
      };
      adapted.speed = 0.85; // Slightly slower for depression
      adapted.pitch = 'medium'; // Gentle, supportive pitch
    }
    
    // === Fear/terror (high arousal, negative valence, specific emotion) ===
    else if (emotion.basicEmotions.fearful > 0.7) {
      adapted.characteristics = {
        ...adapted.characteristics,
        warmth: Math.min(1, adapted.characteristics.warmth + 0.3),
        empathy: Math.min(1, adapted.characteristics.empathy + 0.2),
        pace: 'slow',
        calmness: Math.min(1, adapted.characteristics.calmness + 0.35),
        authority: Math.min(1, adapted.characteristics.authority + 0.1) // Slightly more authoritative for reassurance
      };
      adapted.speed = 0.75; // Much slower for fear
      adapted.pitch = 'low'; // Grounding, stable pitch
    }
    
    // === Anger (high arousal, negative valence, anger emotion) ===
    else if (emotion.basicEmotions.angry > 0.6) {
      adapted.characteristics = {
        ...adapted.characteristics,
        warmth: Math.min(1, adapted.characteristics.warmth + 0.15),
        empathy: Math.min(1, adapted.characteristics.empathy + 0.15),
        pace: 'slow',
        calmness: Math.min(1, adapted.characteristics.calmness + 0.4),
        authority: Math.max(0.3, adapted.characteristics.authority - 0.2) // Less confrontational
      };
      adapted.speed = 0.8; // Slower to de-escalate
      adapted.pitch = 'low'; // Non-threatening lower pitch
    }
    
    // === Low engagement/fatigue (very low arousal) ===
    else if (emotion.arousal < 0.3) {
      adapted.characteristics = {
        ...adapted.characteristics,
        warmth: Math.min(1, adapted.characteristics.warmth + 0.15),
        clarity: Math.min(1, adapted.characteristics.clarity + 0.2),
        pace: 'normal'
      };
      adapted.speed = 0.95; // Slightly more engaging
      adapted.pitch = 'medium'; // Clear, present pitch
    }
    
    // === Positive emotions (high valence) ===
    else if (emotion.valence > 0.5) {
      if (emotion.arousal > 0.5) {
        // High energy positive (excitement/joy)
        adapted.characteristics = {
          ...adapted.characteristics,
          warmth: Math.min(1, adapted.characteristics.warmth + 0.1),
          pace: 'normal'
        };
        adapted.speed = 1.0; // Normal speed for positive
        adapted.pitch = 'medium'; // Engaging pitch
      } else {
        // Calm positive (contentment)
        adapted.characteristics = {
          ...adapted.characteristics,
          warmth: Math.min(1, adapted.characteristics.warmth + 0.2),
          calmness: Math.min(1, adapted.characteristics.calmness + 0.1),
          pace: 'normal'
        };
        adapted.speed = 0.9; // Slightly slower for calm positive
        adapted.pitch = 'medium'; // Warm, supportive pitch
      }
    }
    
    // === Voice quality adaptation based on fusion confidence ===
    if (emotion.fusion.confidence < 0.6) {
      // Lower confidence in emotion detection - use safer, more neutral voice
      adapted.characteristics = {
        ...adapted.characteristics,
        warmth: Math.min(1, adapted.characteristics.warmth + 0.1),
        calmness: Math.min(1, adapted.characteristics.calmness + 0.1),
        pace: 'normal'
      };
      adapted.speed = 0.9;
    }
    
    // === Multimodal adaptation (consider voice vs face dominance) ===
    if (emotion.sources.combined && emotion.fusion.dominantSource === 'voice') {
      // Voice emotions are more reliable - apply stronger adaptations
      const strengthMultiplier = 1.2;
      if (adapted.speed < 1.0) {
        adapted.speed = Math.max(0.6, adapted.speed / strengthMultiplier);
      }
    }
    
    return adapted;
  }
  
  /**
   * Play TTS response audio
   */
  private async playTTSResponse(ttsResponse: TTSSynthesisResponse): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.status.state = 'speaking';
        this.status.isSpeaking = true;
        this.isPlayingResponse = true;
        this.updateStatus();
        
        this.emitEvent('onStateChange', 'speaking', 'synthesizing');
        
        // Create audio element
        this.currentAudio = new Audio();
        
        // Convert audio data to playable format
        let audioUrl: string;
        if (ttsResponse.audioData instanceof ArrayBuffer) {
          const blob = new Blob([ttsResponse.audioData], { type: `audio/${ttsResponse.format}` });
          audioUrl = URL.createObjectURL(blob);
        } else if (ttsResponse.audioData instanceof Blob) {
          audioUrl = URL.createObjectURL(ttsResponse.audioData);
        } else {
          // Base64 string
          audioUrl = `data:audio/${ttsResponse.format};base64,${ttsResponse.audioData}`;
        }
        
        this.currentAudio.src = audioUrl;
        this.currentAudio.volume = this.config.tts.volume;
        
        // Handle playback events
        this.currentAudio.onended = () => {
          this.handleSpeechPlaybackEnd(audioUrl);
          resolve();
        };
        
        this.currentAudio.onerror = (error) => {
          console.error('Audio playback error:', error);
          this.handleSpeechPlaybackEnd(audioUrl);
          reject(new Error('Audio playback failed'));
        };
        
        // Start playback
        this.currentAudio.play().catch(error => {
          console.error('Failed to start audio playback:', error);
          this.handleSpeechPlaybackEnd(audioUrl);
          reject(error);
        });
        
        console.log('🔊 Playing TTS response...');
        
      } catch (error) {
        console.error('Error setting up TTS playback:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Handle end of speech playback
   */
  private handleSpeechPlaybackEnd(audioUrl?: string): void {
    this.isPlayingResponse = false;
    this.status.isSpeaking = false;
    
    // Clean up audio URL
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    
    this.currentAudio = null;
    
    // Return to listening state
    this.status.state = 'listening';
    this.updateStatus();
    
    this.emitEvent('onStateChange', 'listening', 'speaking');
    
    console.log('✅ Finished playing TTS response, resuming listening');
  }
  
  /**
   * Stop current speech playback
   */
  private stopSpeaking(): void {
    if (this.currentAudio && this.isPlayingResponse) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.handleSpeechPlaybackEnd();
      console.log('⏹️ Stopped TTS playback');
    }
  }
  
  // === Enhanced Crisis Detection and Emotion-Based Interruption System ===
  
  /**
   * Real-time emotion monitoring for crisis detection during voice conversations
   * This method continuously monitors emotion levels and triggers interruptions when crisis conditions are met
   */
  private monitorEmotionCrisisThresholds(emotion: EmotionData): void {
    if (!this.isConversationActive || !emotion) return;
    
    const crisisScore = this.calculateEmotionCrisisScore(emotion);
    const needsImmediateIntervention = this.assessCrisisInterventionNeed(emotion, crisisScore);
    
    // Real-time crisis detection with progressive intervention levels
    if (needsImmediateIntervention) {
      this.triggerEmotionBasedInterruption(emotion, crisisScore);
    }
  }
  
  /**
   * Calculate comprehensive crisis score from multimodal emotion data
   */
  private calculateEmotionCrisisScore(emotion: EmotionData): number {
    let score = 0;
    
    // === Primary Crisis Indicators ===
    
    // Extreme negative arousal + valence combination (panic/terror)
    if (emotion.arousal > 0.85 && emotion.valence < -0.8) {
      score += 0.6; // Severe crisis indicator
    }
    
    // High anxiety with despair (arousal + specific negative emotions)
    if (emotion.arousal > 0.75 && emotion.valence < -0.6) {
      score += 0.4;
    }
    
    // === Specific Emotion-Based Crisis Indicators ===
    
    // Fear/terror states
    if (emotion.basicEmotions.fearful > 0.8) {
      score += 0.35;
    }
    
    // Intense anger (risk of self-harm or aggression)
    if (emotion.basicEmotions.angry > 0.85) {
      score += 0.3;
    }
    
    // Disgust combined with high arousal (self-directed negative emotions)
    if (emotion.basicEmotions.disgusted > 0.7 && emotion.arousal > 0.6) {
      score += 0.25;
    }
    
    // === Voice-Specific Crisis Indicators ===
    
    // If voice emotion analysis is dominant and shows crisis
    if (emotion.fusion.dominantSource === 'voice' && emotion.sources.voice) {
      const voiceIntensity = emotion.sources.voice.confidence * emotion.sources.voice.arousal;
      if (voiceIntensity > 0.8 && emotion.sources.voice.valence < -0.7) {
        score += 0.25; // Voice trembling, shaking, crying patterns
      }
    }
    
    // === Rapid Emotional Deterioration ===
    
    // Check for rapid emotional decline (stored in emotion history)
    const recentEmotions = this.getRecentEmotionHistory(5); // Last 5 updates
    if (recentEmotions.length >= 3) {
      const valenceTrend = this.calculateEmotionalTrend(recentEmotions, 'valence');
      const arousalSpike = this.detectArousalSpike(recentEmotions);
      
      if (valenceTrend < -0.3 && arousalSpike > 0.4) {
        score += 0.2; // Rapid deterioration
      }
    }
    
    // === Confidence and Duration Modifiers ===
    
    // Reduce score if confidence is low
    score *= emotion.fusion.confidence;
    
    // Increase score for sustained high-crisis emotions
    const sustainedCrisisTime = this.getSustainedCrisisTime(emotion);
    if (sustainedCrisisTime > 10000) { // 10+ seconds of sustained crisis
      score *= 1.3;
    }
    
    return Math.min(1.0, score);
  }
  
  /**
   * Assess if immediate crisis intervention is needed based on multiple factors
   */
  private assessCrisisInterventionNeed(emotion: EmotionData, crisisScore: number): boolean {
    // Immediate intervention thresholds
    const SEVERE_CRISIS_THRESHOLD = 0.8;
    const MODERATE_CRISIS_THRESHOLD = 0.6;
    const MILD_CRISIS_THRESHOLD = 0.4;
    
    // Progressive intervention based on crisis level
    if (crisisScore >= SEVERE_CRISIS_THRESHOLD) {
      return true; // Immediate interruption required
    }
    
    if (crisisScore >= MODERATE_CRISIS_THRESHOLD) {
      // Check for additional risk factors
      const hasMultipleNegativeEmotions = (
        emotion.basicEmotions.fearful > 0.6 ||
        emotion.basicEmotions.angry > 0.6 ||
        emotion.basicEmotions.disgusted > 0.6
      );
      
      if (hasMultipleNegativeEmotions && emotion.arousal > 0.7) {
        return true;
      }
    }
    
    if (crisisScore >= MILD_CRISIS_THRESHOLD) {
      // Check for sustained mild crisis
      const sustainedTime = this.getSustainedCrisisTime(emotion);
      if (sustainedTime > 30000) { // 30+ seconds of sustained mild crisis
        return true;
      }
    }
    
    // Voice-specific intervention triggers
    if (emotion.sources.voice && emotion.fusion.dominantSource === 'voice') {
      // Voice breaking, crying patterns, extreme vocal stress
      if (emotion.sources.voice.arousal > 0.8 && emotion.sources.voice.valence < -0.7) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Trigger emotion-based interruption with appropriate intervention level
   */
  private async triggerEmotionBasedInterruption(emotion: EmotionData, crisisScore: number): Promise<void> {
    console.warn('🚨 Crisis detected during voice conversation - interrupting for intervention');
    
    try {
      // Immediately stop current conversation flow
      if (this.status.state === 'speaking') {
        await this.stopSpeaking();
      }
      
      if (this.status.state === 'listening') {
        await this.stopListening();
      }
      
      // Determine intervention level
      const interventionLevel = crisisScore > 0.8 ? 'severe' : crisisScore > 0.6 ? 'moderate' : 'mild';
      
      // Generate crisis-appropriate intervention message
      const interventionMessage = await this.generateCrisisInterventionMessage(emotion, interventionLevel);
      
      // Apply crisis-adapted voice characteristics
      const crisisVoice = this.getEmotionAdaptedVoice(emotion, true);
      
      // Immediate verbal intervention
      await this.speakResponse(interventionMessage, crisisVoice);
      
      // Emit crisis event to UI and parent systems
      this.emitEvent('onCrisisDetected', emotion, crisisScore);
      
      // Log crisis intervention
      console.log(`Crisis intervention: ${interventionLevel} level, score: ${crisisScore.toFixed(2)}`);
      
      // Pause conversation for manual intervention if severe
      if (interventionLevel === 'severe') {
        this.status.state = 'crisis-paused';
        this.updateStatus();
        
        await this.speakResponse(
          "Сейчас я передаю вас человеку-терапевту для поддержки. Вы в безопасности.",
          crisisVoice
        );
      } else {
        // Return to controlled conversation flow with increased monitoring
        this.increaseCrisisMonitoring();
      }
      
    } catch (error) {
      console.error('Error during crisis intervention:', error);
      // Fallback: stop conversation entirely
      await this.stopConversation();
    }
  }
  
  /**
   * Generate appropriate crisis intervention message based on emotion and level
   */
  private async generateCrisisInterventionMessage(emotion: EmotionData, level: 'severe' | 'moderate' | 'mild'): Promise<string> {
    // Crisis intervention messages adapted to specific emotional states
    
    if (level === 'severe') {
      if (emotion.basicEmotions.fearful > 0.8) {
        return "Я замечаю, что вы сейчас испытываете сильный страх. Остановимся. Вы в безопасности. Давайте вместе глубоко подышим. Вдох... и выдох...";
      }
      if (emotion.basicEmotions.angry > 0.8) {
        return "Я чувствую вашу сильную злость. Давайте сделаем паузу. Вы в безопасности. Сейчас важно просто побыть здесь, в настоящем моменте.";
      }
      return "Я замечаю очень интенсивные эмоции. Давайте остановимся. Вы в безопасности со мной. Дышите медленно и глубоко.";
    }
    
    if (level === 'moderate') {
      if (emotion.arousal > 0.7 && emotion.valence < -0.5) {
        return "Я замечаю, что эмоции стали очень интенсивными. Давайте сделаем небольшую паузу и вернемся к нашим техникам безопасности.";
      }
      return "Я чувствую, что сейчас происходит что-то важное эмоционально. Хотите сделать паузу и поговорить о том, что вы ощущаете?";
    }
    
    // Mild level
    if (emotion.valence < -0.4) {
      return "Я замечаю изменения в ваших эмоциях. Как вы себя чувствуете прямо сейчас? Нужно ли нам замедлиться?";
    }
    
    return "Я чувствую, что что-то изменилось. Давайте проверим, как вы себя чувствуете в этот момент.";
  }
  
  /**
   * Helper methods for emotion trend analysis
   */
  private getRecentEmotionHistory(count: number): EmotionData[] {
    // This would access stored emotion history
    // For now, return empty array - in production, this would access a rolling buffer
    return [];
  }
  
  private calculateEmotionalTrend(emotions: EmotionData[], dimension: 'valence' | 'arousal'): number {
    if (emotions.length < 2) return 0;
    
    const values = emotions.map(e => e[dimension]);
    const first = values[0];
    const last = values[values.length - 1];
    
    return last - first; // Positive = improving, negative = declining
  }
  
  private detectArousalSpike(emotions: EmotionData[]): number {
    if (emotions.length < 2) return 0;
    
    const arousalValues = emotions.map(e => e.arousal);
    const maxChange = Math.max(...arousalValues) - Math.min(...arousalValues);
    
    return maxChange;
  }
  
  private getSustainedCrisisTime(emotion: EmotionData): number {
    // This would track how long the current crisis state has been sustained
    // For now, return 0 - in production, this would track timing
    return 0;
  }
  
  private increaseCrisisMonitoring(): void {
    // Increase monitoring frequency and sensitivity after a crisis event
    console.log('Increased crisis monitoring activated');
    // Implementation would adjust monitoring parameters
  }
  
  /**
   * Detect crisis keywords in transcribed text
   */
  private detectCrisisKeywords(text: string): CrisisDetection | null {
    const lowerText = text.toLowerCase();
    const detectedKeywords: string[] = [];
    
    for (const keyword of this.config.conversation.emergencyKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        detectedKeywords.push(keyword);
      }
    }
    
    if (detectedKeywords.length > 0) {
      return {
        isCrisis: true,
        riskLevel: detectedKeywords.length > 2 ? 'severe' : 'high',
        triggers: detectedKeywords,
        interventions: {
          immediate: [
            'Acknowledge patient distress',
            'Assess immediate safety',
            'Provide grounding techniques'
          ],
          escalation: [
            'Contact emergency services if needed',
            'Involve clinical supervisor',
            'Document crisis intervention'
          ],
          contacts: [
            'Emergency services: 911',
            'Crisis hotline: 988',
            'Clinical supervisor'
          ]
        },
        monitoring: {
          increaseFrequency: true,
          alertTherapist: true,
          requireSupervision: true
        }
      };
    }
    
    return null;
  }
  
  /**
   * Handle crisis detection
   */
  private async handleCrisisDetection(crisis: CrisisDetection): Promise<void> {
    console.log('🚨 CRISIS DETECTED:', crisis);
    
    this.status.state = 'crisis-mode';
    this.updateStatus();
    
    this.emitEvent('onCrisisDetected', crisis);
    this.emitEvent('onStateChange', 'crisis-mode', this.status.state);
    
    try {
      // Select appropriate crisis response voice
      const crisisVoice: TTSVoiceConfig = {
        ...this.config.tts.defaultVoice,
        characteristics: {
          ...this.config.tts.defaultVoice.characteristics,
          warmth: 1.0,
          empathy: 1.0,
          authority: 0.9,
          clarity: 1.0,
          pace: 'slow',
          calmness: 1.0
        }
      };
      
      // Generate crisis response message
      const crisisMessage = this.generateCrisisResponseMessage(crisis);
      
      // Synthesize and play crisis response
      const ttsRequest: TTSSynthesisRequest = {
        text: crisisMessage,
        voice: crisisVoice,
        quality: {
          sampleRate: 24000,
          bitRate: 128,
          format: 'mp3',
          channels: 1,
          compression: 'low'
        },
        options: {
          ssmlEnabled: false,
          speed: 0.8, // Slower for crisis
          pitch: -2, // Slightly lower pitch
          volume: this.config.tts.volume,
          emphasis: 'strong',
          breaks: {
            sentence: 800,
            paragraph: 1500,
            comma: 300
          }
        },
        metadata: {
          sessionId: this.currentSessionId,
          patientId: this.currentPatientId,
          context: 'emergency',
          priority: 'urgent'
        }
      };
      
      const ttsResponse = await this.ttsService.synthesize(ttsRequest);
      await this.playTTSResponse(ttsResponse);
      
      // Continue with heightened monitoring
      this.status.state = 'listening';
      this.updateStatus();
      
    } catch (error) {
      console.error('Error handling crisis:', error);
      this.handleError(`Crisis handling failed: ${error}`, 'crisis');
    }
  }
  
  /**
   * Generate appropriate crisis response message
   */
  private generateCrisisResponseMessage(crisis: CrisisDetection): string {
    const messages = {
      high: [
        "I hear that you're going through something very difficult right now. Your safety is my top priority.",
        "It takes courage to share these feelings. I'm here to support you through this.",
        "Let's take this one moment at a time. Can you tell me if you feel safe right now?"
      ],
      severe: [
        "I'm very concerned about what you've shared. Your life has value and there are people who want to help.",
        "This sounds like an emergency situation. I need to make sure you're safe right now.",
        "Please know that you don't have to go through this alone. Let's connect you with immediate support."
      ]
    };
    
    const level = crisis.riskLevel === 'severe' ? 'severe' : 'high';
    const messageOptions = messages[level];
    return messageOptions[Math.floor(Math.random() * messageOptions.length)];
  }
  
  // === Initial Greeting ===
  
  /**
   * Send initial greeting based on EMDR phase
   */
  private async sendInitialGreeting(phase: EMDRPhase): Promise<void> {
    const greetings = {
      preparation: "Hello, I'm here to guide you through today's EMDR session. We'll start with some preparation and grounding techniques. How are you feeling right now?",
      assessment: "Welcome back. Today we'll be identifying and assessing the memory we'll work with. Take your time and remember you're in control.",
      desensitization: "We're ready to begin processing the target memory. Remember, you're safe here and we can pause anytime you need to.",
      installation: "Great progress so far. Now we'll focus on strengthening positive beliefs about yourself. You're doing really well.",
      'body-scan': "Let's check in with your body and see how you're feeling physically after our processing work.",
      closure: "We're coming to the end of today's session. Let's make sure you feel stable and grounded before we finish.",
      reevaluation: "Today we'll review how you've been doing since our last session and see what's changed.",
      integration: "This is our final integration phase. Let's reflect on all the progress you've made."
    };
    
    const greeting = greetings[phase] || "Welcome to today's EMDR session. I'm here to support you.";
    
    // Create AI message for greeting
    const greetingMessage: AITherapistMessage = {
      id: generateDeterministicId(),
      type: 'therapist',
      content: greeting,
      timestamp: Date.now(),
      phase,
      confidence: 1.0,
      metadata: {
        criticalityLevel: 'low'
      }
    };
    
    // Process with TTS
    await this.processTTS(greetingMessage);
  }
  
  // === Fallback and Error Handling ===
  
  /**
   * Provide fallback response when systems fail
   */
  private async provideFallbackResponse(): Promise<void> {
    if (!this.config.errorHandling.fallbackToText) {
      return;
    }
    
    const fallbackMessage = "I'm having some technical difficulties with the voice system. Let's continue our session - please let me know how you're feeling.";
    
    try {
      // Use simple TTS or text display
      const fallbackRequest: TTSSynthesisRequest = {
        text: fallbackMessage,
        voice: this.config.tts.defaultVoice,
        quality: {
          sampleRate: 16000,
          bitRate: 64,
          format: 'mp3',
          channels: 1,
          compression: 'high'
        },
        options: {
          ssmlEnabled: false,
          speed: 1.0,
          pitch: 0,
          volume: this.config.tts.volume,
          emphasis: 'none',
          breaks: {
            sentence: 300,
            paragraph: 500,
            comma: 150
          }
        },
        metadata: {
          context: 'fallback',
          priority: 'normal'
        }
      };
      
      const response = await this.ttsService.synthesize(fallbackRequest);
      await this.playTTSResponse(response);
      
    } catch (error) {
      console.error('Fallback response also failed:', error);
      // Resort to console/text display
      console.log('FALLBACK MESSAGE:', fallbackMessage);
    }
    
    // Resume listening
    this.status.state = 'listening';
    this.status.isProcessing = false;
    this.updateStatus();
  }
  
  /**
   * Handle various types of errors
   */
  private handleError(error: string, component: string): void {
    this.lastError = error;
    this.performanceMetrics.errorCount++;
    
    console.error(`VoiceAITherapist Error [${component}]:`, error);
    
    this.emitEvent('onError', error, component);
    
    // Handle different error scenarios
    if (component === 'audio' || component === 'stt') {
      // Audio/STT errors - try to continue with degraded functionality
      if (this.config.errorHandling.enableDegradedMode) {
        this.degradedMode = true;
        console.log('Entering degraded mode');
      }
    }
    
    if (component === 'crisis') {
      // Crisis handling errors are critical
      this.status.state = 'error';
      this.updateStatus();
    }
    
    // Implement retry logic
    if (this.retryCount < this.config.errorHandling.maxRetries) {
      this.retryCount++;
      console.log(`Retrying... (${this.retryCount}/${this.config.errorHandling.maxRetries})`);
      
      setTimeout(() => {
        if (this.config.errorHandling.continueOnError) {
          this.status.state = 'listening';
          this.status.isProcessing = false;
          this.updateStatus();
        }
      }, 1000 * this.retryCount); // Exponential backoff
    }
  }
  
  // === Utility Methods ===
  
  /**
   * Calculate RMS (Root Mean Square) energy of audio data
   */
  private calculateRMS(audioData: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    return Math.sqrt(sum / audioData.length);
  }
  
  /**
   * Calculate zero crossing rate for audio data
   */
  private calculateZeroCrossingRate(audioData: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < audioData.length; i++) {
      if ((audioData[i] >= 0) !== (audioData[i - 1] >= 0)) {
        crossings++;
      }
    }
    return crossings / audioData.length;
  }
  
  /**
   * Calculate adaptive VAD threshold based on recent audio levels
   */
  private calculateAdaptiveThreshold(): number {
    // Simple adaptive threshold based on recent VAD results
    if (this.vadResults.length < 10) {
      return this.config.vad.threshold;
    }
    
    const recentResults = this.vadResults.slice(-20);
    const avgEnergy = recentResults.reduce((sum, r) => sum + r.energy, 0) / recentResults.length;
    
    return Math.max(this.config.vad.threshold, avgEnergy * 1.5);
  }
  
  /**
   * Combine multiple audio buffers into one
   */
  private combineAudioBuffers(buffers: Float32Array[]): Float32Array {
    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.length, 0);
    const combined = new Float32Array(totalLength);
    
    let offset = 0;
    for (const buffer of buffers) {
      combined.set(buffer, offset);
      offset += buffer.length;
    }
    
    return combined;
  }
  
  /**
   * Convert Float32Array audio data to Blob
   */
  private audioDataToBlob(audioData: Float32Array, sampleRate: number): Blob {
    // Convert Float32Array to Int16Array (16-bit PCM)
    const int16Array = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      int16Array[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
    }
    
    // Create WAV blob
    const buffer = new ArrayBuffer(44 + int16Array.length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + int16Array.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, int16Array.length * 2, true);
    
    // Audio data
    const audioView = new Int16Array(buffer, 44);
    audioView.set(int16Array);
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
  
  /**
   * Create conversation turn record
   */
  private createConversationTurn(
    type: 'patient' | 'therapist', 
    data: Partial<VoiceConversationTurn>
  ): VoiceConversationTurn {
    return {
      id: generateDeterministicId(),
      timestamp: Date.now(),
      type,
      sessionContext: {
        phase: this.status.session.currentPhase || 'preparation',
        phaseTime: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
        turnInPhase: this.conversationTurns.filter(t => 
          t.sessionContext.phase === this.status.session.currentPhase
        ).length + 1
      },
      ...data
    };
  }
  
  /**
   * Extract emotional state from emotion data
   */
  private extractEmotionalState(emotion: EmotionData): EmotionalState98 {
    // Convert affects to primary/secondary affects format
    const affects = Object.entries(emotion.affects)
      .map(([name, intensity]) => ({ name, intensity, arousal: emotion.arousal, valence: emotion.valence }))
      .sort((a, b) => b.intensity - a.intensity);
    
    const primaryAffects = affects.slice(0, 3);
    const secondaryAffects = affects.slice(3, 10).map(({ name, intensity }) => ({ name, intensity }));
    
    return {
      primaryAffects,
      secondaryAffects,
      stabilityScore: emotion.quality.overallQuality,
      engagementLevel: emotion.sources.voice?.voiceEmotions.engagement || 0.5,
      stressLevel: emotion.sources.voice?.voiceEmotions.stress || 0.5
    };
  }
  
  /**
   * Create initial status object
   */
  private createInitialStatus(): VoiceConversationStatus {
    return {
      state: 'idle',
      mode: this.config.conversation.mode,
      isActive: false,
      isListening: false,
      isProcessing: false,
      isSpeaking: false,
      
      components: {
        audioMultiplexer: {
          isInitialized: false,
          isStreaming: false,
          masterStream: {
            sampleRate: 16000,
            channels: 1,
            quality: 0,
            latency: 0
          },
          consumers: [],
          activeConsumers: 0,
          performance: {
            cpuUsage: 0,
            memoryUsage: 0,
            audioDrops: 0,
            totalProcessed: 0,
            averageLatency: 0
          },
          health: {
            isHealthy: true,
            issues: [],
            lastCheck: Date.now()
          }
        },
        stt: {
          isInitialized: false,
          isListening: false,
          isProcessing: false,
          currentProvider: 'openai-whisper',
          connection: {
            isConnected: false,
            latency: 0,
            lastSuccessfulRequest: 0
          },
          processing: {
            queueSize: 0,
            averageLatency: 0,
            successRate: 1.0,
            totalProcessed: 0
          },
          providers: {},
          audio: {
            isReceiving: false,
            sampleRate: 16000,
            channels: 1,
            quality: 0,
            vadState: false
          }
        },
        tts: {
          isInitialized: false,
          currentProvider: 'google-cloud',
          isProcessing: false,
          queueSize: 0,
          cacheStatus: {
            enabled: false,
            size: 0,
            hitRate: 0,
            maxSize: 100
          },
          providers: {}
        },
        emotionService: false,
        aiService: false
      },
      
      session: {
        sessionId: null,
        patientId: null,
        currentPhase: null,
        turnCount: 0,
        duration: 0
      },
      
      audio: {
        inputLevel: 0,
        isVoiceActive: false,
        vadConfidence: 0,
        quality: 0
      },
      
      performance: {
        avgSTTLatency: 0,
        avgTTSLatency: 0,
        avgAILatency: 0,
        totalLatency: 0,
        errorRate: 0
      },
      
      lastActivity: {
        lastTranscription: null,
        lastAIResponse: null,
        lastError: null,
        timestamp: Date.now()
      }
    };
  }
  
  /**
   * Update status with current metrics
   */
  private updateStatus(): void {
    // Update session duration
    if (this.sessionStartTime) {
      this.status.session.duration = (Date.now() - this.sessionStartTime) / 1000;
    }
    
    // Update turn count
    this.status.session.turnCount = this.conversationTurns.length;
    
    // Update performance metrics
    const { sttLatencies, ttsLatencies, aiLatencies, errorCount, totalTurns } = this.performanceMetrics;
    
    this.status.performance.avgSTTLatency = sttLatencies.length > 0 
      ? sttLatencies.reduce((sum, l) => sum + l, 0) / sttLatencies.length 
      : 0;
    
    this.status.performance.avgTTSLatency = ttsLatencies.length > 0 
      ? ttsLatencies.reduce((sum, l) => sum + l, 0) / ttsLatencies.length 
      : 0;
    
    this.status.performance.avgAILatency = aiLatencies.length > 0 
      ? aiLatencies.reduce((sum, l) => sum + l, 0) / aiLatencies.length 
      : 0;
    
    this.status.performance.totalLatency = 
      this.status.performance.avgSTTLatency + 
      this.status.performance.avgTTSLatency + 
      this.status.performance.avgAILatency;
    
    this.status.performance.errorRate = totalTurns > 0 ? errorCount / totalTurns : 0;
    
    // Update component status
    this.status.components.stt = this.sttService.getStatus();
    this.status.components.tts = this.ttsService.getStatus();
    this.status.components.emotionService = this.emotionService?.getStatus().isActive || false;
    this.status.components.aiService = this.aiService ? true : false;
    
    if (this.audioMultiplexer) {
      this.status.components.audioMultiplexer = this.audioMultiplexer.getStatus();
    }
    
    // Update last activity
    this.status.lastActivity.timestamp = Date.now();
    if (this.lastError) {
      this.status.lastActivity.lastError = this.lastError;
    }
  }
  
  // === Event Handling ===
  
  /**
   * Setup event handlers for core services
   */
  private setupEventHandlers(): void {
    // STT events
    this.sttService.addEventListener('onTranscription', (result: STTTranscriptionResult) => {
      console.log('STT Transcription received:', result);
      this.status.lastActivity.lastTranscription = result.text;
    });
    
    this.sttService.addEventListener('onError', (error: any) => {
      this.handleError(`STT Error: ${error.message}`, 'stt');
    });
    
    this.sttService.addEventListener('onVoiceActivity', (isActive: boolean, confidence: number) => {
      this.status.audio.isVoiceActive = isActive;
      this.status.audio.vadConfidence = confidence;
    });
    
    // TTS events
    this.ttsService.addEventListener('onError', (error: any) => {
      this.handleError(`TTS Error: ${error.message}`, 'tts');
    });
    
    // AI events  
    // (AI events are handled in processAI method)
  }
  
  /**
   * Emit event to registered listeners
   */
  private emitEvent<K extends keyof VoiceConversationEvents>(
    eventName: K, 
    ...args: Parameters<VoiceConversationEvents[K]>
  ): void {
    const handler = this.events[eventName];
    if (handler) {
      try {
        (handler as any)(...args);
      } catch (error) {
        console.error(`Error in event handler ${eventName}:`, error);
      }
    }
  }
  
  // === Public API ===
  
  /**
   * Get current conversation status
   */
  getStatus(): VoiceConversationStatus {
    this.updateStatus();
    return { ...this.status };
  }
  
  /**
   * Get conversation history
   */
  getConversationHistory(): VoiceConversationTurn[] {
    return [...this.conversationTurns];
  }
  
  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<VoiceConversationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Voice conversation config updated:', newConfig);
  }
  
  /**
   * Register event listeners
   */
  addEventListener<K extends keyof VoiceConversationEvents>(
    eventName: K, 
    handler: VoiceConversationEvents[K]
  ): void {
    this.events[eventName] = handler;
  }
  
  /**
   * Remove event listener
   */
  removeEventListener<K extends keyof VoiceConversationEvents>(eventName: K): void {
    delete this.events[eventName];
  }
  
  /**
   * Force interrupt conversation (for UI controls)
   */
  async forceInterrupt(): Promise<void> {
    await this.interruptConversation('user-request');
  }
  
  /**
   * Switch listening mode
   */
  async switchListeningMode(mode: VoiceListeningMode): Promise<void> {
    const prevMode = this.config.conversation.mode;
    this.config.conversation.mode = mode;
    this.status.mode = mode;
    
    console.log(`Switched listening mode: ${prevMode} → ${mode}`);
    
    // Restart listening with new mode if currently active
    if (this.status.isListening) {
      await this.stopListening();
      await this.startListening();
    }
  }
  
  /**
   * Get supported voices for selection
   */
  getSupportedVoices(): TTSVoiceConfig[] {
    return this.ttsService.getSupportedVoices();
  }
  
  /**
   * Test voice with sample text
   */
  async testVoice(voice: TTSVoiceConfig, sampleText?: string): Promise<void> {
    const text = sampleText || "Hello, this is a voice test for your EMDR therapy session.";
    
    const request: TTSSynthesisRequest = {
      text,
      voice,
      quality: this.config.tts.defaultVoice,
      options: {
        ssmlEnabled: false,
        speed: this.config.tts.speed,
        pitch: 0,
        volume: this.config.tts.volume,
        emphasis: 'none',
        breaks: {
          sentence: 300,
          paragraph: 500,
          comma: 150
        }
      },
      metadata: {
        context: 'preview',
        priority: 'low'
      }
    };
    
    const response = await this.ttsService.synthesize(request);
    await this.playTTSResponse(response);
  }
  
  /**
   * Cleanup and destroy service
   */
  async destroy(): Promise<void> {
    try {
      console.log('🗑️ Destroying VoiceAITherapistService...');
      
      // Stop any active conversation
      if (this.status.isActive) {
        await this.stopConversation();
      }
      
      // Remove audio consumer from multiplexer
      if (this.audioMultiplexer && this.audioConsumerId) {
        await this.audioMultiplexer.removeConsumer(this.audioConsumerId);
      }
      
      // Cleanup services
      if (this.sttService) {
        await this.sttService.destroy();
      }
      
      if (this.ttsService) {
        await this.ttsService.destroy();
      }
      
      // Clear all references
      this.events = {};
      this.conversationTurns = [];
      this.audioBuffer = [];
      this.vadResults = [];
      
      this.isInitialized = false;
      
      console.log('✅ VoiceAITherapistService destroyed');
      
    } catch (error) {
      console.error('Error destroying VoiceAITherapistService:', error);
    }
  }
}

// === Export Default Configuration ===


// === Singleton Instance (Optional) ===

let voiceAITherapistInstance: VoiceAITherapistService | null = null;

/**
 * Get or create singleton VoiceAITherapistService instance
 */
export function getVoiceAITherapistService(config?: Partial<VoiceConversationConfig>): VoiceAITherapistService {
  if (!voiceAITherapistInstance) {
    voiceAITherapistInstance = new VoiceAITherapistService(config);
  }
  return voiceAITherapistInstance;
}

/**
 * Destroy singleton instance
 */
export async function destroyVoiceAITherapistService(): Promise<void> {
  if (voiceAITherapistInstance) {
    await voiceAITherapistInstance.destroy();
    voiceAITherapistInstance = null;
  }
}