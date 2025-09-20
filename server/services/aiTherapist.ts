/**
 * Server-side AI Therapist Service
 * Handles all AI operations securely on the backend
 */

import type { 
  AITherapistResponse, 
  EmotionData, 
  BLSConfiguration,
  EMDRPhase 
} from '../../shared/types';

export class BackendAITherapistService {
  private apiKey: string | undefined;
  
  constructor() {
    // Secure API key storage - only on server
    this.apiKey = process.env.AI_API_KEY;
  }

  /**
   * Analyze patient's emotional state and generate therapeutic response
   */
  async analyzeAndRespond(
    emotionData: EmotionData,
    sessionPhase: string,
    sessionHistory: any[]
  ): Promise<AITherapistResponse> {
    try {
      // TODO: Implement actual AI API call here
      // For now, using adaptive logic based on emotional data
      
      if (!this.apiKey) {
        console.warn('AI API key not configured, using fallback logic');
      }
      
      // Placeholder for actual AI call
      // const response = await this.callExternalAI({
      //   emotionData,
      //   sessionPhase,
      //   sessionHistory
      // });
      
      // Generate adaptive response based on emotional state
      const message = this.generateTherapeuticMessage(emotionData, sessionPhase);
      const suggestedBLS = await this.generateAdaptiveBLS(emotionData);
      
      return {
        phase: sessionPhase as EMDRPhase,
        message,
        suggestedBLS,
        emotionalAnalysis: emotionData
      };
    } catch (error) {
      console.error('AI Therapist service error:', error);
      return this.getDefaultResponse(sessionPhase);
    }
  }

  /**
   * Generate adaptive BLS configuration based on patient's state
   */
  async generateAdaptiveBLS(emotionData: EmotionData): Promise<BLSConfiguration> {
    const arousalLevel = emotionData.arousal;
    const valenceLevel = emotionData.valence;
    
    // Adaptive algorithm
    const speed = this.calculateOptimalSpeed(arousalLevel);
    const pattern = this.selectPattern(valenceLevel, arousalLevel);
    
    return {
      speed,
      pattern,
      color: this.selectColor(emotionData),
      size: this.calculateOptimalSize(arousalLevel),
      soundEnabled: arousalLevel > 0.7,
      adaptiveMode: true
    };
  }

  /**
   * Get therapeutic insights from session data
   */
  async getTherapeuticInsights(sessionData: any): Promise<string[]> {
    // TODO: Implement AI-based insight generation
    const insights: string[] = [];
    
    if (sessionData.emotionHistory && sessionData.emotionHistory.length > 0) {
      const avgArousal = sessionData.emotionHistory.reduce((acc: number, e: EmotionData) => 
        acc + e.arousal, 0) / sessionData.emotionHistory.length;
      
      if (avgArousal > 0.7) {
        insights.push('Высокий уровень эмоционального возбуждения в течение сессии');
      }
      if (avgArousal < 0.3) {
        insights.push('Низкий уровень эмоциональной вовлеченности');
      }
    }
    
    if (sessionData.sudsLevel !== undefined) {
      if (sessionData.sudsLevel > 7) {
        insights.push('Рекомендуется продолжить десенсибилизацию');
      } else if (sessionData.sudsLevel < 3) {
        insights.push('Хороший прогресс в снижении дистресса');
      }
    }
    
    return insights;
  }

  /**
   * Predict optimal next phase based on current progress
   */
  async predictNextPhase(
    currentPhase: string,
    emotionHistory: EmotionData[],
    sudsLevel: number
  ): Promise<{ phase: string; confidence: number }> {
    // Phase progression logic
    const avgArousal = emotionHistory.length > 0 
      ? emotionHistory.reduce((acc, e) => acc + e.arousal, 0) / emotionHistory.length 
      : 0.5;
    
    let nextPhase = currentPhase;
    let confidence = 0.5;
    
    switch (currentPhase) {
      case 'preparation':
        if (avgArousal < 0.6 && sudsLevel < 8) {
          nextPhase = 'desensitization';
          confidence = 0.8;
        }
        break;
      case 'desensitization':
        if (sudsLevel <= 2) {
          nextPhase = 'installation';
          confidence = 0.9;
        }
        break;
      case 'installation':
        if (avgArousal < 0.5) {
          nextPhase = 'body-scan';
          confidence = 0.85;
        }
        break;
      case 'body-scan':
        nextPhase = 'closure';
        confidence = 0.95;
        break;
    }
    
    return { phase: nextPhase, confidence };
  }

  // Private helper methods
  private generateTherapeuticMessage(emotionData: EmotionData, phase: string): string {
    const { arousal, valence } = emotionData;
    
    // Generate contextual messages based on emotional state and phase
    if (phase === 'preparation') {
      if (arousal > 0.7) {
        return 'Давайте начнем с нескольких глубоких вдохов. Следите за движущимся объектом и позвольте себе расслабиться.';
      }
      return 'Отлично, вы готовы начать. Сосредоточьтесь на целевом воспоминании, следя за движущимся объектом.';
    }
    
    if (phase === 'desensitization') {
      if (arousal > 0.8) {
        return 'Вы делаете хорошую работу. Продолжайте следить за объектом, позволяя эмоциям проходить через вас.';
      } else if (valence < 0.3) {
        return 'Обратите внимание на ваши чувства. Что вы замечаете сейчас? Продолжайте следить за движением.';
      }
      return 'Продолжайте процессинг. Следите за движущимся объектом и наблюдайте за изменениями.';
    }
    
    if (phase === 'installation') {
      if (valence > 0.6) {
        return 'Хорошо. Сосредоточьтесь на позитивном убеждении, продолжая следить за объектом.';
      }
      return 'Думайте о вашем позитивном убеждении. Насколько истинным оно кажется сейчас?';
    }
    
    if (phase === 'body-scan') {
      return 'Просканируйте ваше тело от головы до ног. Замечаете ли вы какое-либо напряжение или дискомфорт?';
    }
    
    return 'Продолжайте следить за движущимся объектом и наблюдайте за своими ощущениями.';
  }

  private getDefaultResponse(phase: string): AITherapistResponse {
    return {
      phase: phase as EMDRPhase,
      message: 'Продолжайте следить за движущимся объектом',
      suggestedBLS: {
        speed: 5,
        pattern: 'horizontal',
        color: '#3b82f6',
        size: 20,
        soundEnabled: true,
        adaptiveMode: false
      },
      emotionalAnalysis: {
        timestamp: Date.now(),
        arousal: 0.5,
        valence: 0.5,
        affects: {},
        basicEmotions: {}
      }
    };
  }

  private calculateOptimalSpeed(arousal: number): number {
    // Higher arousal -> slower speed for calming effect
    return Math.max(1, Math.min(10, 10 - Math.floor(arousal * 10)));
  }

  private selectPattern(valence: number, arousal: number): BLSConfiguration['pattern'] {
    if (arousal > 0.7) {
      return 'horizontal'; // Most calming
    } else if (valence < 0.3) {
      return 'diagonal'; // For negative emotions
    } else if (arousal < 0.3) {
      return '3d-wave'; // For engagement
    }
    return 'horizontal';
  }

  private selectColor(emotionData: EmotionData): string {
    const { valence } = emotionData;
    
    if (valence < 0.3) {
      return '#10b981'; // Green for calming
    } else if (valence > 0.7) {
      return '#3b82f6'; // Blue for positive
    }
    return '#8b5cf6'; // Purple for neutral
  }

  private calculateOptimalSize(arousal: number): number {
    // Higher arousal -> larger size for better focus
    return Math.max(15, Math.min(30, 15 + Math.floor(arousal * 15)));
  }
}

// Singleton instance
export const backendAITherapist = new BackendAITherapistService();