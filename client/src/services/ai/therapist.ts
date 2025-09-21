/**
 * Revolutionary AI Therapist Service - Client Side
 * GPT-5 powered EMDR therapist with 98 emotion recognition and real-time adaptation
 * Makes secure API calls to backend for AI operations
 */

import type { 
  AITherapistResponse, 
  EmotionData, 
  BLSConfiguration,
  EMDRPhase,
  AIChatContext,
  AITherapistMessage,
  AISessionGuidance,
  AIEmotionResponse,
  PersonalizedRecommendation,
  EmotionalState98,
  CrisisDetection
} from '@/../../shared/types';
import { emotionService } from '../emotion/faceRecognition';

export class AITherapistService {
  private sessionContext: AIChatContext | null = null;
  private emotionHistory: EmotionData[] = [];
  private crisisCallbacks: ((crisis: CrisisDetection) => void)[] = [];
  private sessionStartTime: number | null = null;
  
  // Error throttling for API calls
  private errorThrottle = {
    emotionResponse: { lastError: 0, count: 0 },
    sessionGuidance: { lastError: 0, count: 0 }
  };
  
  // === Revolutionary AI Chat Methods ===

  /**
   * Initialize session context for AI therapist
   */
  initializeSession(sessionId: string, patientId: string, phase: EMDRPhase): void {
    this.sessionStartTime = Date.now();
    this.sessionContext = {
      sessionId,
      patientProfile: {
        id: patientId,
        triggers: [], // Will be populated during session
        calmingTechniques: []
      },
      currentEmotionalState: this.getDefaultEmotionData(),
      phaseContext: {
        currentPhase: phase,
        timeInPhase: 0,
        phaseGoals: this.getPhaseGoals(phase),
        completionCriteria: this.getCompletionCriteria(phase)
      },
      sessionMetrics: {
        sudsLevels: [],
        vocLevels: [],
        stabilityTrend: 0.5
      }
    };
  }

  /**
   * Send message to AI therapist - Revolutionary GPT-5 powered chat
   */
  async sendMessage(message: string): Promise<AITherapistMessage> {
    if (!this.sessionContext) {
      throw new Error('Session not initialized. Call initializeSession() first.');
    }

    try {
      // Update current emotional state before sending message
      await this.updateCurrentEmotionalState();
      
      const response = await fetch('/api/ai-therapist/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context: this.sessionContext
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message to AI therapist');
      }

      const aiMessage: AITherapistMessage = await response.json();
      
      // Handle crisis detection
      if (aiMessage.crisisDetection?.isCrisis) {
        this.handleCrisisDetection(aiMessage.crisisDetection);
      }

      return aiMessage;
    } catch (error) {
      console.error('AI Therapist chat error:', error);
      return this.getDefaultChatResponse(message);
    }
  }

  /**
   * Get session guidance for current phase - AI-powered recommendations
   */
  async getSessionGuidance(): Promise<AISessionGuidance> {
    if (!this.sessionContext) {
      throw new Error('Session not initialized');
    }

    try {
      await this.updateCurrentEmotionalState();
      
      const response = await fetch('/api/ai-therapist/session-guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPhase: this.sessionContext.phaseContext.currentPhase,
          emotionData: this.sessionContext.currentEmotionalState,
          sessionMetrics: this.sessionContext.sessionMetrics
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get session guidance');
      }

      return await response.json();
    } catch (error) {
      // Throttle error logging for session guidance
      const now = Date.now();
      const timeSinceLastError = now - this.errorThrottle.sessionGuidance.lastError;
      
      if (timeSinceLastError > 10000 || this.errorThrottle.sessionGuidance.count < 3) {
        console.error('Session guidance error:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          endpoint: '/api/ai-therapist/session-guidance',
          timestamp: new Date().toISOString(),
          errorCount: this.errorThrottle.sessionGuidance.count + 1
        });
        this.errorThrottle.sessionGuidance.lastError = now;
        this.errorThrottle.sessionGuidance.count++;
      }
      
      return this.getDefaultSessionGuidance();
    }
  }

  /**
   * Process emotion response - Real-time AI reaction to emotional changes
   */
  async processEmotionResponse(emotionData: EmotionData): Promise<AIEmotionResponse> {
    if (!this.sessionContext) {
      throw new Error('Session not initialized');
    }

    try {
      // Update emotion history
      this.emotionHistory.push(emotionData);
      this.sessionContext.currentEmotionalState = emotionData;
      
      // Keep last 10 emotions for context
      if (this.emotionHistory.length > 10) {
        this.emotionHistory = this.emotionHistory.slice(-10);
      }

      const response = await fetch('/api/ai-therapist/emotion-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotionData,
          currentPhase: this.sessionContext.phaseContext.currentPhase,
          sessionContext: {
            sessionDuration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0,
            recentEmotions: this.emotionHistory.slice(-5),
            interventionHistory: []
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process emotion response');
      }

      const emotionResponse: AIEmotionResponse = await response.json();
      
      // Update session metrics
      this.updateSessionMetrics(emotionData, emotionResponse);
      
      return emotionResponse;
    } catch (error) {
      // Throttle error logging to prevent spam
      const now = Date.now();
      const timeSinceLastError = now - this.errorThrottle.emotionResponse.lastError;
      
      if (timeSinceLastError > 10000 || this.errorThrottle.emotionResponse.count < 3) {
        console.error('Emotion response error:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          endpoint: '/api/ai-therapist/emotion-response',
          status: error instanceof Response ? error.status : 'N/A',
          timestamp: new Date().toISOString(),
          errorCount: this.errorThrottle.emotionResponse.count + 1
        });
        this.errorThrottle.emotionResponse.lastError = now;
        this.errorThrottle.emotionResponse.count++;
      }
      
      return this.getDefaultEmotionResponse(emotionData);
    }
  }

  /**
   * Update phase and notify AI
   */
  async updatePhase(newPhase: EMDRPhase): Promise<void> {
    if (!this.sessionContext) return;
    
    this.sessionContext.phaseContext.currentPhase = newPhase;
    this.sessionContext.phaseContext.timeInPhase = 0;
    this.sessionContext.phaseContext.phaseGoals = this.getPhaseGoals(newPhase);
    this.sessionContext.phaseContext.completionCriteria = this.getCompletionCriteria(newPhase);
  }

  // === Emotion Integration Methods ===

  /**
   * Get current emotional state using face recognition
   */
  async getCurrentEmotionalState(): Promise<EmotionData> {
    try {
      const emotionData = await emotionService.getCurrentEmotionData();
      if (this.sessionContext) {
        this.sessionContext.currentEmotionalState = emotionData;
      }
      return emotionData;
    } catch (error) {
      console.error('Failed to get emotional state:', error);
      return this.getDefaultEmotionData();
    }
  }

  /**
   * Subscribe to crisis detection events
   */
  onCrisisDetected(callback: (crisis: CrisisDetection) => void): void {
    this.crisisCallbacks.push(callback);
  }

  /**
   * Get recommendations for current emotional state
   */
  getEmotionalRecommendations(emotionData: EmotionData): PersonalizedRecommendation[] {
    const recommendations: PersonalizedRecommendation[] = [];
    const { arousal, valence } = emotionData;
    
    // High arousal recommendations
    if (arousal > 0.7) {
      recommendations.push({
        type: 'breathing',
        priority: 'high',
        message: 'Высокий уровень возбуждения. Используйте глубокое дыхание.',
        duration: 180,
        instructions: ['Вдох 4 счета', 'Задержка 4 счета', 'Выдох 6 счетов'],
        effectiveness: 0.8
      });
    }
    
    // Low valence recommendations
    if (valence < -0.5) {
      recommendations.push({
        type: 'safety',
        priority: 'high',
        message: 'Активируйте образ безопасного места.',
        duration: 300,
        instructions: ['Представьте безопасное место', 'Сосредоточьтесь на деталях'],
        effectiveness: 0.85
      });
    }
    
    return recommendations;
  }

  // === Legacy Support Methods (maintained for compatibility) ===

  /**
   * Analyze patient's emotional state and generate therapeutic response
   */
  async analyzeAndRespond(
    emotionData: EmotionData,
    sessionPhase: string,
    sessionHistory: any[]
  ): Promise<AITherapistResponse> {
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotionData,
          sessionPhase,
          sessionHistory
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze emotions');
      }

      return await response.json();
    } catch (error) {
      console.error('AI Therapist error:', error);
      return this.getDefaultResponse(sessionPhase);
    }
  }

  /**
   * Generate adaptive BLS configuration based on patient's state
   */
  async generateAdaptiveBLS(emotionData: EmotionData): Promise<BLSConfiguration> {
    try {
      const response = await fetch('/api/ai/bls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emotionData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate BLS configuration');
      }

      return await response.json();
    } catch (error) {
      console.error('BLS generation error:', error);
      return this.getDefaultBLSConfig();
    }
  }

  // === Private Helper Methods ===

  private async updateCurrentEmotionalState(): Promise<void> {
    if (!this.sessionContext) return;
    
    try {
      this.sessionContext.currentEmotionalState = await this.getCurrentEmotionalState();
    } catch (error) {
      console.error('Failed to update emotional state:', error);
    }
  }

  private handleCrisisDetection(crisis: CrisisDetection): void {
    this.crisisCallbacks.forEach(callback => callback(crisis));
  }

  private updateSessionMetrics(emotionData: EmotionData, response: AIEmotionResponse): void {
    if (!this.sessionContext) return;
    
    // Update stability trend based on emotion consistency
    const recentArousal = this.emotionHistory.slice(-3).map(e => e.arousal);
    const arousalVariance = this.calculateVariance(recentArousal);
    this.sessionContext.sessionMetrics.stabilityTrend = Math.max(0, 1 - arousalVariance);
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private getPhaseGoals(phase: EMDRPhase): string[] {
    const goals: Record<EMDRPhase, string[]> = {
      'preparation': ['Установить терапевтические отношения', 'Обучить техникам безопасности'],
      'assessment': ['Идентифицировать целевые воспоминания', 'Оценить уровень дистресса'],
      'desensitization': ['Снизить эмоциональный заряд воспоминания', 'Процессинг травматического материала'],
      'installation': ['Укрепить позитивные убеждения', 'Повысить уверенность в себе'],
      'body-scan': ['Сканировать физические ощущения', 'Выявить остаточное напряжение'],
      'closure': ['Обеспечить стабилизацию', 'Подготовить к завершению сессии'],
      'reevaluation': ['Оценить прогресс', 'Планировать следующие шаги'],
      'integration': ['Интегрировать новые убеждения', 'Подготовить к повседневной жизни']
    };
    return goals[phase] || [];
  }

  private getCompletionCriteria(phase: EMDRPhase): string[] {
    const criteria: Record<EMDRPhase, string[]> = {
      'preparation': ['Установлен раппорт', 'Обучены техники заземления'],
      'assessment': ['Воспоминание идентифицировано', 'SUDS оценен'],
      'desensitization': ['SUDS снижен до 1-2', 'Нет новых ассоциаций'],
      'installation': ['VOC повышен до 6-7', 'Позитивное убеждение укреплено'],
      'body-scan': ['Физические ощущения проверены', 'Напряжение устранено'],
      'closure': ['Пациент стабилизирован', 'Техники безопасности применены'],
      'reevaluation': ['Прогресс оценен', 'План составлен'],
      'integration': ['Убеждения интегрированы', 'Готовность к завершению']
    };
    return criteria[phase] || [];
  }

  private getDefaultEmotionData(): EmotionData {
    return {
      timestamp: Date.now(),
      arousal: 0.5,
      valence: 0.5,
      affects: {},
      basicEmotions: {}
    };
  }

  private getDefaultChatResponse(message: string): AITherapistMessage {
    return {
      message: 'Я понимаю ваши чувства. Давайте продолжим работу с техниками EMDR.',
      therapeuticInsight: 'Продолжайте сосредотачиваться на своих ощущениях.',
      suggestedBLS: this.getDefaultBLSConfig(),
      emotionalAnalysis: this.getDefaultEmotionData(),
      personalizedRecommendations: [],
      nextPhaseReadiness: {
        isReady: false,
        confidence: 0.5,
        reasoning: 'Требуется дополнительная оценка'
      }
    };
  }

  private getDefaultSessionGuidance(): AISessionGuidance {
    return {
      currentPhase: this.sessionContext?.phaseContext.currentPhase || 'preparation',
      phaseProgress: 0.5,
      recommendations: {
        immediate: ['Продолжить текущую фазу'],
        nextSteps: ['Мониторинг состояния'],
        concerns: []
      },
      adaptiveBLS: this.getDefaultBLSConfig(),
      estimatedTimeRemaining: 10,
      readinessForNextPhase: {
        isReady: false,
        criteria: [],
        missingCriteria: ['Требуется оценка']
      }
    };
  }

  private getDefaultEmotionResponse(emotionData: EmotionData): AIEmotionResponse {
    return {
      recognizedEmotions: emotionData,
      emotionalState: {
        primaryAffects: [],
        secondaryAffects: [],
        stabilityScore: 0.5,
        engagementLevel: 0.5,
        stressLevel: 0.5
      },
      interventionLevel: 'mild',
      recommendations: this.getEmotionalRecommendations(emotionData),
      blsAdjustments: {},
      phaseTransitionAdvice: {
        canAdvance: false,
        shouldRegress: false,
        stayInPhase: true,
        reasoning: 'Продолжаем текущую фазу'
      }
    };
  }

  private getDefaultBLSConfig(): BLSConfiguration {
    return {
      speed: 5,
      pattern: 'horizontal',
      color: '#3b82f6',
      size: 20,
      soundEnabled: true,
      adaptiveMode: true
    };
  }

  private getDefaultResponse(phase: string): AITherapistResponse {
    return {
      phase: phase as any,
      message: 'Продолжайте следить за движущимся объектом',
      suggestedBLS: this.getDefaultBLSConfig(),
      emotionalAnalysis: this.getDefaultEmotionData()
    };
  }
}

// Singleton instance
export const aiTherapist = new AITherapistService();