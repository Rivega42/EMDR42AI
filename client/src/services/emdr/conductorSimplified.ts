/**
 * Simplified EMDR Session Conductor
 * Revolutionary AI-Powered EMDR Therapy System
 * 
 * This simplified version focuses on core functionality while avoiding TypeScript conflicts
 * with complex service integrations. It provides the full EMDR session management
 * with adaptive logic, emotion-based adjustments, and complete 8-phase protocol.
 */

import type {
  EmotionData,
  BLSConfiguration,
  EMDRPhase,
  AITherapistMessage,
  User
} from '@/../../shared/types';

import { AITherapistService } from '../ai/therapist';
import { UnifiedEmotionService } from '../emotion/emotionService';
import { generateDeterministicId } from '@/lib/deterministicUtils';
import { affects98, calculateAffects, getDominantAffect } from '@/../../shared/emotionAffects';

// === Core Types for Simplified Implementation ===

export interface SimplifiedEMDRSession {
  sessionId: string;
  userId: string;
  currentPhase: EMDRPhase;
  startTime: number;
  
  // Target Memory
  targetMemory: {
    description: string;
    initialSUD: number;
    currentSUD: number;
    targetSUD: number;
    negativeBeliefs: string[];
    positiveBeliefs: string[];
    currentVOC: number;
    targetVOC: number;
  };
  
  // Progress tracking
  progress: {
    overallProgress: number;
    phaseProgress: Record<EMDRPhase, number>; // 0-1 completion
    sudHistory: Array<{ timestamp: number; sud: number; phase: EMDRPhase }>;
    vocHistory: Array<{ timestamp: number; voc: number; phase: EMDRPhase }>;
  };
  
  // Emotion and BLS data
  emotionHistory: Array<{ timestamp: number; emotion: EmotionData; phase: EMDRPhase }>;
  blsConfigurations: Array<{ timestamp: number; config: BLSConfiguration; phase: EMDRPhase }>;
  
  // AI interactions
  aiInteractions: Array<{ timestamp: number; message: string; response: string; phase: EMDRPhase }>;
}

export interface ConductorConfig {
  enableEmotionAdaptation: boolean;
  enableVoiceMode: boolean;
  enableAutoPhaseTransition: boolean;
  maxSessionDuration: number; // minutes
  sudTarget: number; // target SUD level
  vocTarget: number; // target VOC level
  adaptiveThresholds: {
    highAnxiety: number;
    dissociation: number;
    overwhelm: number;
    stability: number;
  };
}

export interface ConductorEvents {
  onPhaseChange?: (from: EMDRPhase, to: EMDRPhase) => void;
  onSUDChange?: (oldSUD: number, newSUD: number) => void;
  onVOCChange?: (oldVOC: number, newVOC: number) => void;
  onEmotionChange?: (emotion: EmotionData) => void;
  onBLSConfigChange?: (config: BLSConfiguration) => void;
  onSessionComplete?: (session: SimplifiedEMDRSession) => void;
}

// === Default Phase Configurations ===
const PHASE_CONFIGS = {
  preparation: {
    minDuration: 5, // minutes
    maxDuration: 15,
    description: "Подготовка к сессии EMDR",
    aiPrompt: "Давайте подготовимся к EMDR сессии. Как вы себя чувствуете?",
    blsConfig: { speed: 3, pattern: 'horizontal' as const, adaptiveMode: true }
  },
  assessment: {
    minDuration: 10,
    maxDuration: 20,
    description: "Оценка и выбор цели",
    aiPrompt: "Выберите воспоминание для работы. Какое событие вы хотели бы проработать?",
    blsConfig: { speed: 2, pattern: 'horizontal' as const, adaptiveMode: false }
  },
  desensitization: {
    minDuration: 15,
    maxDuration: 45,
    description: "Десенсибилизация - основная обработка",
    aiPrompt: "Теперь следите за движением и позвольте всему приходить естественно.",
    blsConfig: { speed: 5, pattern: 'horizontal' as const, adaptiveMode: true }
  },
  installation: {
    minDuration: 5,
    maxDuration: 15,
    description: "Инсталляция позитивного убеждения",
    aiPrompt: "Укрепляем позитивное убеждение о себе.",
    blsConfig: { speed: 4, pattern: 'horizontal' as const, adaptiveMode: true }
  },
  'body-scan': {
    minDuration: 2,
    maxDuration: 8,
    description: "Сканирование тела",
    aiPrompt: "Просканируйте тело на предмет остаточных ощущений.",
    blsConfig: { speed: 2, pattern: 'circle' as const, adaptiveMode: false }
  },
  closure: {
    minDuration: 3,
    maxDuration: 10,
    description: "Завершение сессии",
    aiPrompt: "Завершаем сессию. Как вы себя чувствуете?",
    blsConfig: { speed: 2, pattern: 'circle' as const, adaptiveMode: false }
  },
  reevaluation: {
    minDuration: 5,
    maxDuration: 15,
    description: "Переоценка результатов",
    aiPrompt: "Как изменилось воспоминание с прошлой сессии?",
    blsConfig: { speed: 3, pattern: 'horizontal' as const, adaptiveMode: false }
  },
  integration: {
    minDuration: 5,
    maxDuration: 20,
    description: "Интеграция изменений",
    aiPrompt: "Интегрируем изменения в будущую жизнь.",
    blsConfig: { speed: 3, pattern: 'infinity3d' as const, adaptiveMode: true }
  }
};

// === Default Adaptive Rules ===
const ADAPTIVE_RULES = [
  {
    id: 'high_anxiety_slowdown',
    condition: (emotion: EmotionData) => {
      const dominantAffect = getDominantAffect(emotion.arousal, emotion.valence);
      return dominantAffect === 'Anxious' && emotion.arousal > 0.7;
    },
    action: {
      blsAdjustment: { speed: 2, pattern: 'circle' as const },
      aiMessage: "Замедляем процесс. Представьте ваше безопасное место.",
      intervention: 'safe-place'
    }
  },
  {
    id: 'dissociation_grounding',
    condition: (emotion: EmotionData) => {
      return emotion.arousal < -0.4 && emotion.valence < -0.2;
    },
    action: {
      blsAdjustment: { speed: 1, pattern: 'horizontal' as const },
      aiMessage: "Давайте вернемся в настоящий момент. Назовите 5 вещей, которые видите.",
      intervention: 'grounding'
    }
  },
  {
    id: 'overwhelm_pause',
    condition: (emotion: EmotionData) => {
      return emotion.arousal > 0.8;
    },
    action: {
      blsAdjustment: { speed: 1, pattern: 'horizontal' as const },
      aiMessage: "Остановимся на минуту. Дышите глубоко.",
      intervention: 'breathing'
    }
  }
];

// === Main Simplified EMDR Session Conductor ===
export class SimplifiedEMDRConductor {
  private session: SimplifiedEMDRSession | null = null;
  private config: ConductorConfig;
  private events: ConductorEvents;
  private isActive: boolean = false;
  
  // Services
  private aiTherapist: AITherapistService;
  private emotionService: UnifiedEmotionService | null = null;
  
  // BLS Reference
  private blsRef: any = null;
  
  // Monitoring
  private phaseStartTime: number = 0;
  private emotionMonitoringInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<ConductorConfig> = {}, events: ConductorEvents = {}) {
    this.config = {
      enableEmotionAdaptation: true,
      enableVoiceMode: false, // Simplified version
      enableAutoPhaseTransition: true,
      maxSessionDuration: 90,
      sudTarget: 2,
      vocTarget: 6,
      adaptiveThresholds: {
        highAnxiety: 0.7,
        dissociation: 0.6,
        overwhelm: 0.8,
        stability: 0.3
      },
      ...config
    };
    
    this.events = events;
    this.aiTherapist = new AITherapistService();
    
    console.log('🎭 Simplified EMDR Conductor initialized');
  }

  // === Public API ===
  
  /**
   * Initialize emotion service if video element is available
   */
  async initialize(videoElement?: HTMLVideoElement): Promise<void> {
    if (videoElement && this.config.enableEmotionAdaptation) {
      try {
        const emotionConfig = {
          face: {
            enabled: true,
            smoothingWindow: 3,
            processEveryNFrames: 2,
            minConfidence: 0.7
          },
          voice: {
            enabled: false, // Simplified
            provider: 'mock' as const,
            continuous: false,
            enableEmotionDetection: false,
            language: 'auto' as const,
            bufferDuration: 1000,
            audioConstraints: {},
            processing: { enableVAD: false },
            privacy: { enableAnonymization: false }
          },
          fusion: {
            enabled: true,
            strategy: 'face-priority' as const,
            faceWeight: 0.8,
            voiceWeight: 0.2,
            conflictResolution: 'face-dominant' as const,
            temporalSmoothing: true,
            smoothingWindow: 3,
            confidenceThreshold: 0.6
          },
          multimodal: {
            enabled: true,
            preferredMode: 'face-only' as const,
            fallbackStrategy: 'face' as const,
            qualityThreshold: 0.5
          },
          performance: {
            targetLatency: 200,
            maxMemoryUsage: 100,
            enableOptimizations: true
          },
          audio: {
            useMultiplexer: false,
            consumerPriority: 7,
            consumerName: 'EMDRSimplified'
          }
        };

        this.emotionService = new UnifiedEmotionService(emotionConfig);
        await this.emotionService.initialize(videoElement);
        
        this.emotionService.onEmotion((emotion: EmotionData) => {
          this.handleEmotionUpdate(emotion);
        });
        
        console.log('✅ Emotion service initialized');
      } catch (error) {
        console.warn('⚠️ Emotion service initialization failed, continuing without it:', error);
      }
    }
  }

  /**
   * Start new EMDR session
   */
  async startSession(user: User, targetMemoryDescription: string = ''): Promise<SimplifiedEMDRSession> {
    if (this.isActive) {
      throw new Error('Session already active');
    }

    console.log('🎬 Starting EMDR session...');

    this.session = {
      sessionId: generateDeterministicId('session', user.id, Date.now()),
      userId: user.id,
      currentPhase: 'preparation',
      startTime: Date.now(),
      targetMemory: {
        description: targetMemoryDescription,
        initialSUD: 10,
        currentSUD: 10,
        targetSUD: this.config.sudTarget,
        negativeBeliefs: [],
        positiveBeliefs: [],
        currentVOC: 1,
        targetVOC: this.config.vocTarget
      },
      progress: {
        overallProgress: 0,
        phaseProgress: Object.fromEntries(
          Object.keys(PHASE_CONFIGS).map(phase => [phase, 0])
        ) as Record<EMDRPhase, number>,
        sudHistory: [],
        vocHistory: []
      },
      emotionHistory: [],
      blsConfigurations: [],
      aiInteractions: []
    };

    this.isActive = true;
    this.phaseStartTime = Date.now();

    // Initialize AI therapist
    this.aiTherapist.initializeSession(this.session.sessionId, user.id, 'preparation');

    // Start emotion monitoring
    this.startEmotionMonitoring();

    // Transition to preparation phase
    await this.transitionToPhase('preparation');

    console.log('✅ EMDR session started');
    return this.session;
  }

  /**
   * Update SUD rating (core of desensitization algorithm)
   */
  async updateSUD(newSUD: number): Promise<void> {
    if (!this.session) return;

    const oldSUD = this.session.targetMemory.currentSUD;
    this.session.targetMemory.currentSUD = newSUD;

    // Record SUD history
    this.session.progress.sudHistory.push({
      timestamp: Date.now(),
      sud: newSUD,
      phase: this.session.currentPhase
    });

    console.log(`📊 SUD updated: ${oldSUD} → ${newSUD}`);
    this.events.onSUDChange?.(oldSUD, newSUD);

    // Core desensitization algorithm: while(SUD > target)
    if (this.session.currentPhase === 'desensitization') {
      await this.executeDesensitizationAlgorithm();
    }

    this.updateProgress();
  }

  /**
   * Update VOC rating
   */
  async updateVOC(newVOC: number): Promise<void> {
    if (!this.session) return;

    const oldVOC = this.session.targetMemory.currentVOC;
    this.session.targetMemory.currentVOC = newVOC;

    // Record VOC history
    this.session.progress.vocHistory.push({
      timestamp: Date.now(),
      voc: newVOC,
      phase: this.session.currentPhase
    });

    console.log(`📈 VOC updated: ${oldVOC} → ${newVOC}`);
    this.events.onVOCChange?.(oldVOC, newVOC);

    this.updateProgress();
  }

  /**
   * Transition to specific EMDR phase
   */
  async transitionToPhase(phase: EMDRPhase): Promise<void> {
    if (!this.session) return;

    const oldPhase = this.session.currentPhase;
    console.log(`🔄 Transitioning: ${oldPhase} → ${phase}`);

    // Update session
    this.session.currentPhase = phase;
    this.phaseStartTime = Date.now();

    // Mark old phase as complete
    if (oldPhase !== phase) {
      this.session.progress.phaseProgress[oldPhase] = 1.0;
    }

    // Get phase configuration
    const phaseConfig = PHASE_CONFIGS[phase];

    // Update BLS configuration
    if (this.blsRef && phaseConfig.blsConfig) {
      const blsConfig: BLSConfiguration = {
        speed: phaseConfig.blsConfig.speed,
        pattern: phaseConfig.blsConfig.pattern,
        color: '#3b82f6',
        size: 20,
        adaptiveMode: phaseConfig.blsConfig.adaptiveMode,
        emotionMapping: true,
        therapeuticMode: 'standard',
        sessionPhase: phase
      };

      this.blsRef.updateConfig(blsConfig);
      this.recordBLSConfig(blsConfig);
      this.events.onBLSConfigChange?.(blsConfig);
    }

    // Get AI guidance
    try {
      const aiMessage = await this.aiTherapist.sendMessage(phaseConfig.aiPrompt);
      this.recordAIInteraction(phaseConfig.aiPrompt, aiMessage.message || 'Response received');
    } catch (error) {
      console.error('AI guidance error:', error);
    }

    this.events.onPhaseChange?.(oldPhase, phase);
    this.updateProgress();
  }

  /**
   * Set BLS component reference
   */
  setBLSReference(blsRef: any): void {
    this.blsRef = blsRef;
    console.log('🔗 BLS reference connected');
  }

  /**
   * Start BLS stimulation
   */
  startBLS(): void {
    if (this.blsRef) {
      console.log('▶️ Starting BLS stimulation');
      this.blsRef.start();
    }
  }

  /**
   * Stop BLS stimulation
   */
  stopBLS(): void {
    if (this.blsRef) {
      console.log('⏹️ Stopping BLS stimulation');
      this.blsRef.pause();
    }
  }

  /**
   * Update BLS configuration
   */
  updateBLS(config: Partial<BLSConfiguration>): void {
    if (this.blsRef) {
      console.log('🔧 Updating BLS configuration:', config);
      const currentConfig = this.getCurrentBLSConfig();
      const updatedConfig = { ...currentConfig, ...config };
      this.blsRef.updateConfig(updatedConfig);
      this.recordBLSConfig(updatedConfig);
      this.events.onBLSConfigChange?.(updatedConfig);
    }
  }

  /**
   * End the session
   */
  async endSession(): Promise<SimplifiedEMDRSession> {
    if (!this.session || !this.isActive) {
      throw new Error('No active session to end');
    }

    console.log('🏁 Ending EMDR session...');

    this.stopEmotionMonitoring();

    if (this.emotionService) {
      // Stop emotion service if it has a stop method
      try {
        await (this.emotionService as any).stop?.();
      } catch (error) {
        console.warn('Error stopping emotion service:', error);
      }
    }

    this.isActive = false;
    const completedSession = this.session;
    this.session = null;

    // Save session data
    await this.saveSessionData(completedSession);

    this.events.onSessionComplete?.(completedSession);
    console.log('✅ Session completed');

    return completedSession;
  }

  /**
   * Get current session status
   */
  getSession(): SimplifiedEMDRSession | null {
    return this.session;
  }

  /**
   * Get current session progress
   */
  getProgress(): number {
    return this.session?.progress.overallProgress || 0;
  }

  // === Private Implementation ===

  /**
   * Core desensitization algorithm: while(SUD > target)
   */
  private async executeDesensitizationAlgorithm(): Promise<void> {
    if (!this.session) return;

    const { currentSUD, targetSUD } = this.session.targetMemory;
    console.log(`🔄 Starting desensitization algorithm: SUD=${currentSUD}, Target=${targetSUD}`);

    // Start the core while(SUD > target) processing loop
    let processingRounds = 0;
    const maxRounds = 20; // Safety limit to prevent infinite loops

    while (this.session.targetMemory.currentSUD > targetSUD && processingRounds < maxRounds && this.isActive) {
      processingRounds++;
      console.log(`🔁 Processing round ${processingRounds}: SUD=${this.session.targetMemory.currentSUD}`);

      // 1. Start BLS stimulation if not active
      if (this.blsRef && !this.blsRef.isActive) {
        this.startBLS();
      }

      // 2. Get AI therapeutic guidance
      try {
        const contextMessage = this.buildDesensitizationContext(processingRounds);
        const aiResponse = await this.aiTherapist.sendMessage(contextMessage);
        this.recordAIInteraction(contextMessage, aiResponse.message || 'Continue processing');
        
        // Voice mode integration
        if (this.config.enableVoiceMode) {
          await this.handleVoiceInteraction(aiResponse.message || 'Continue processing');
        }
      } catch (error) {
        console.error('AI guidance error during desensitization:', error);
      }

      // 3. Wait for processing period (bilateral stimulation time)
      const processingDuration = this.calculateProcessingDuration();
      console.log(`⏱️ Processing for ${processingDuration}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, processingDuration));

      // 4. Check for emotion changes and apply adaptive rules
      if (this.session.emotionHistory.length > 0) {
        const latestEmotion = this.session.emotionHistory[this.session.emotionHistory.length - 1];
        this.applyAdaptiveLogic(latestEmotion.emotion);
      }

      // 5. Request SUD update (in real implementation, this would come from therapist/patient)
      // For demo, we simulate gradual SUD reduction with some randomness
      await this.simulateSUDReduction();

      // 6. Check completion criteria
      if (this.session.targetMemory.currentSUD <= targetSUD) {
        console.log('✅ SUD target reached! Desensitization complete.');
        this.stopBLS();
        break;
      }

      // 7. Brief pause between rounds
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (processingRounds >= maxRounds) {
      console.log('⚠️ Maximum processing rounds reached, transitioning to installation');
    }

    // Transition to next phase if auto-transition enabled
    if (this.config.enableAutoPhaseTransition) {
      await this.transitionToPhase('installation');
    }
  }

  /**
   * Build contextual message for AI during desensitization
   */
  private buildDesensitizationContext(round: number): string {
    if (!this.session) return 'Continue processing';

    const { currentSUD, description } = this.session.targetMemory;
    const emotion = this.session.emotionHistory.length > 0 
      ? this.session.emotionHistory[this.session.emotionHistory.length - 1].emotion
      : null;

    let context = `Раунд ${round} обработки. `;
    context += `Память: "${description}". `;
    context += `Текущий SUD: ${currentSUD}. `;
    
    if (emotion) {
      const dominantAffect = getDominantAffect(emotion.arousal, emotion.valence);
      context += `Эмоциональное состояние: ${dominantAffect} (возбуждение: ${emotion.arousal.toFixed(2)}, валентность: ${emotion.valence.toFixed(2)}). `;
    }
    
    context += 'Что приходит сейчас? Позвольте всему приходить естественно.';
    return context;
  }

  /**
   * Calculate processing duration based on current state
   */
  private calculateProcessingDuration(): number {
    if (!this.session) return 10000; // 10 seconds default

    const emotion = this.session.emotionHistory.length > 0 
      ? this.session.emotionHistory[this.session.emotionHistory.length - 1].emotion
      : null;

    let baseDuration = 8000; // 8 seconds
    
    if (emotion) {
      // Adjust based on arousal level
      if (emotion.arousal > 0.7) {
        baseDuration = 6000; // Shorter for high arousal
      } else if (emotion.arousal < -0.3) {
        baseDuration = 12000; // Longer for dissociation
      }
    }

    return baseDuration + Math.random() * 2000; // Add some variation
  }

  /**
   * Simulate SUD reduction for demo purposes
   * In real implementation, this would be therapist/patient input
   */
  private async simulateSUDReduction(): Promise<void> {
    if (!this.session) return;

    const currentSUD = this.session.targetMemory.currentSUD;
    const targetSUD = this.session.targetMemory.targetSUD;
    
    // Calculate reduction amount (0.5-1.5 points per round)
    let reduction = 0.5 + Math.random() * 1.0;
    
    // Adjust reduction based on emotion state
    const emotion = this.session.emotionHistory.length > 0 
      ? this.session.emotionHistory[this.session.emotionHistory.length - 1].emotion
      : null;
    
    if (emotion) {
      const dominantAffect = getDominantAffect(emotion.arousal, emotion.valence);
      if (dominantAffect === 'Relaxed' || dominantAffect === 'Calm') {
        reduction *= 1.5; // Faster reduction when relaxed
      } else if (dominantAffect === 'Anxious' || dominantAffect === 'Distressed') {
        reduction *= 0.7; // Slower reduction when anxious
      }
    }

    const newSUD = Math.max(targetSUD, currentSUD - reduction);
    await this.updateSUD(Math.round(newSUD));
  }

  /**
   * Handle voice interaction if voice mode is enabled
   */
  private async handleVoiceInteraction(message: string): Promise<void> {
    // This will be implemented when VoiceAITherapistService is integrated
    console.log('🎤 Voice interaction (placeholder):', message);
  }

  /**
   * Check automatic phase transition criteria
   */
  private checkAutoPhaseTransition(): Promise<void> {
    if (!this.session || !this.config.enableAutoPhaseTransition) {
      return Promise.resolve();
    }

    const phase = this.session.currentPhase;
    const timeInPhase = (Date.now() - this.phaseStartTime) / 60000; // minutes
    const phaseConfig = PHASE_CONFIGS[phase];
    let shouldTransition = false;
    let nextPhase: EMDRPhase | null = null;

    switch (phase) {
      case 'preparation':
        // Transition after minimum time and basic readiness
        if (timeInPhase >= phaseConfig.minDuration) {
          shouldTransition = true;
          nextPhase = 'assessment';
        }
        break;

      case 'assessment':
        // Transition when target memory is selected and initial SUD/VOC recorded
        if (timeInPhase >= phaseConfig.minDuration && 
            this.session.targetMemory.description.length > 0) {
          shouldTransition = true;
          nextPhase = 'desensitization';
        }
        break;

      case 'desensitization':
        // Transition when SUD reaches target or max time reached
        if (this.session.targetMemory.currentSUD <= this.session.targetMemory.targetSUD ||
            timeInPhase >= phaseConfig.maxDuration) {
          shouldTransition = true;
          nextPhase = 'installation';
        }
        break;

      case 'installation':
        // Transition when VOC reaches target or sufficient time passed
        if (this.session.targetMemory.currentVOC >= this.session.targetMemory.targetVOC ||
            timeInPhase >= phaseConfig.maxDuration) {
          shouldTransition = true;
          nextPhase = 'body-scan';
        }
        break;

      case 'body-scan':
        // Transition after minimum time (body scan is typically quick)
        if (timeInPhase >= phaseConfig.minDuration) {
          shouldTransition = true;
          nextPhase = 'closure';
        }
        break;

      case 'closure':
        // Transition after minimum closure time
        if (timeInPhase >= phaseConfig.minDuration) {
          shouldTransition = true;
          nextPhase = 'integration';
        }
        break;

      case 'reevaluation':
        // Transition after reevaluation complete
        if (timeInPhase >= phaseConfig.minDuration) {
          shouldTransition = true;
          nextPhase = 'integration';
        }
        break;

      case 'integration':
        // Final phase - complete session after minimum time
        if (timeInPhase >= phaseConfig.minDuration) {
          console.log('✅ Session integration complete - ready to end session');
          // Don't auto-transition, let therapist decide when to end
        }
        break;
    }

    if (shouldTransition && nextPhase) {
      console.log(`🔄 Auto-transition criteria met: ${phase} → ${nextPhase}`);
      return this.transitionToPhase(nextPhase);
    }

    return Promise.resolve();
  }

  /**
   * Enhanced phase transition with automatic progression checks
   */
  async transitionToPhaseEnhanced(phase: EMDRPhase): Promise<void> {
    await this.transitionToPhase(phase);
    
    // Start monitoring for auto-transition after settling in new phase
    if (this.config.enableAutoPhaseTransition) {
      setTimeout(() => {
        this.startAutoTransitionMonitoring();
      }, 5000); // Wait 5 seconds before starting auto-transition monitoring
    }
  }

  /**
   * Start monitoring for automatic phase transitions
   */
  private startAutoTransitionMonitoring(): void {
    if (!this.config.enableAutoPhaseTransition) return;

    const monitoringInterval = setInterval(async () => {
      if (!this.isActive || !this.session) {
        clearInterval(monitoringInterval);
        return;
      }

      await this.checkAutoPhaseTransition();
    }, 10000); // Check every 10 seconds

    console.log('🔍 Auto-transition monitoring started');
  }

  /**
   * Handle emotion updates with adaptive logic
   */
  private handleEmotionUpdate(emotion: EmotionData): void {
    if (!this.session) return;

    // Record emotion
    this.session.emotionHistory.push({
      timestamp: Date.now(),
      emotion,
      phase: this.session.currentPhase
    });

    this.events.onEmotionChange?.(emotion);

    // Apply adaptive rules
    this.applyAdaptiveLogic(emotion);
  }

  /**
   * Apply adaptive logic based on current emotion
   */
  private applyAdaptiveLogic(emotion: EmotionData): void {
    if (!this.config.enableEmotionAdaptation) return;

    for (const rule of ADAPTIVE_RULES) {
      if (rule.condition(emotion)) {
        console.log(`🎯 Applying adaptive rule: ${rule.id}`);

        // Apply BLS adjustment
        if (this.blsRef && rule.action.blsAdjustment) {
          const adjustedConfig: BLSConfiguration = {
            ...this.getCurrentBLSConfig(),
            ...rule.action.blsAdjustment
          };

          this.blsRef.updateConfig(adjustedConfig);
          this.recordBLSConfig(adjustedConfig);
          this.events.onBLSConfigChange?.(adjustedConfig);
        }

        // Send AI message
        if (rule.action.aiMessage) {
          this.recordAIInteraction('Adaptive intervention', rule.action.aiMessage);
        }

        // Only apply first matching rule
        break;
      }
    }
  }

  private getCurrentBLSConfig(): BLSConfiguration {
    const phase = this.session?.currentPhase || 'preparation';
    const phaseConfig = PHASE_CONFIGS[phase];

    return {
      speed: phaseConfig.blsConfig.speed,
      pattern: phaseConfig.blsConfig.pattern,
      color: '#3b82f6',
      size: 20,
      adaptiveMode: phaseConfig.blsConfig.adaptiveMode,
      emotionMapping: true,
      therapeuticMode: 'standard',
      sessionPhase: phase
    };
  }

  private recordBLSConfig(config: BLSConfiguration): void {
    if (!this.session) return;

    this.session.blsConfigurations.push({
      timestamp: Date.now(),
      config,
      phase: this.session.currentPhase
    });
  }

  private recordAIInteraction(message: string, response: string): void {
    if (!this.session) return;

    this.session.aiInteractions.push({
      timestamp: Date.now(),
      message,
      response,
      phase: this.session.currentPhase
    });
  }

  private updateProgress(): void {
    if (!this.session) return;

    // Calculate overall progress based on completed phases
    const totalPhases = Object.keys(PHASE_CONFIGS).length;
    const completedPhases = Object.values(this.session.progress.phaseProgress).filter(p => p >= 1.0).length;
    const currentPhaseProgress = this.calculateCurrentPhaseProgress();

    this.session.progress.overallProgress = (completedPhases + currentPhaseProgress) / totalPhases;
  }

  private calculateCurrentPhaseProgress(): number {
    if (!this.session) return 0;

    const phase = this.session.currentPhase;
    const phaseConfig = PHASE_CONFIGS[phase];
    const timeInPhase = (Date.now() - this.phaseStartTime) / 60000; // minutes

    // Base progress on time spent in phase
    let progress = Math.min(timeInPhase / phaseConfig.maxDuration, 1.0);

    // Adjust based on phase-specific criteria
    if (phase === 'desensitization') {
      const sudProgress = Math.max(0, 
        (this.session.targetMemory.initialSUD - this.session.targetMemory.currentSUD) / 
        (this.session.targetMemory.initialSUD - this.session.targetMemory.targetSUD)
      );
      progress = Math.max(progress, sudProgress);
    } else if (phase === 'installation') {
      const vocProgress = Math.max(0,
        (this.session.targetMemory.currentVOC - 1) / 
        (this.session.targetMemory.targetVOC - 1)
      );
      progress = Math.max(progress, vocProgress);
    }

    this.session.progress.phaseProgress[phase] = Math.min(progress, 1.0);
    return progress;
  }

  private startEmotionMonitoring(): void {
    if (!this.config.enableEmotionAdaptation) return;

    this.emotionMonitoringInterval = setInterval(() => {
      // Emotion monitoring is handled by service callbacks
      // This is for additional periodic checks if needed
    }, 2000); // Every 2 seconds

    console.log('🔍 Emotion monitoring started');
  }

  private stopEmotionMonitoring(): void {
    if (this.emotionMonitoringInterval) {
      clearInterval(this.emotionMonitoringInterval);
      this.emotionMonitoringInterval = null;
      console.log('🔍 Emotion monitoring stopped');
    }
  }

  private async saveSessionData(session: SimplifiedEMDRSession): Promise<void> {
    try {
      // Save to localStorage for now
      const sessionData = {
        ...session,
        savedAt: Date.now(),
        version: '1.0'
      };

      localStorage.setItem(`emdr_session_${session.sessionId}`, JSON.stringify(sessionData));
      console.log('💾 Session data saved');
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  /**
   * Load previous session data
   */
  static async loadSession(sessionId: string): Promise<SimplifiedEMDRSession | null> {
    try {
      const data = localStorage.getItem(`emdr_session_${sessionId}`);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
    return null;
  }

  /**
   * Get user session history
   */
  static async getUserSessions(userId: string): Promise<SimplifiedEMDRSession[]> {
    const sessions: SimplifiedEMDRSession[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('emdr_session_')) {
          const data = localStorage.getItem(key);
          if (data) {
            const session = JSON.parse(data);
            if (session.userId === userId) {
              sessions.push(session);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user sessions:', error);
    }

    return sessions.sort((a, b) => b.startTime - a.startTime);
  }
}

export default SimplifiedEMDRConductor;