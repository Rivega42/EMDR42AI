/**
 * AI Therapist Service - Client Side
 * Makes secure API calls to backend for AI operations
 */

import type { AITherapistResponse, EmotionData, BLSConfiguration } from '@/../../shared/types';

export class AITherapistService {
  /**
   * Analyze patient's emotional state and generate therapeutic response
   * Securely processed on the backend
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
   * Securely processed on the backend
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
      // Return default configuration as fallback
      return {
        speed: 5,
        pattern: 'horizontal',
        color: '#3b82f6',
        size: 20,
        soundEnabled: true,
        adaptiveMode: false
      };
    }
  }

  /**
   * Get therapeutic insights from session data
   * Securely processed on the backend
   */
  async getTherapeuticInsights(sessionData: any): Promise<string[]> {
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get insights');
      }

      const data = await response.json();
      return data.insights || [];
    } catch (error) {
      console.error('Insights generation error:', error);
      return [];
    }
  }

  /**
   * Predict optimal next phase based on current progress
   * Securely processed on the backend
   */
  async predictNextPhase(
    currentPhase: string,
    emotionHistory: EmotionData[],
    sudsLevel: number
  ): Promise<{ phase: string; confidence: number }> {
    try {
      const response = await fetch('/api/ai/predict-phase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPhase,
          emotionHistory,
          sudsLevel
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to predict phase');
      }

      return await response.json();
    } catch (error) {
      console.error('Phase prediction error:', error);
      return {
        phase: currentPhase,
        confidence: 0.5
      };
    }
  }

  // Private helper method for fallback
  private getDefaultResponse(phase: string): AITherapistResponse {
    return {
      phase: phase as any,
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
}

// Singleton instance
export const aiTherapist = new AITherapistService();