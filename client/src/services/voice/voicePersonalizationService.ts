/**
 * Voice Personalization Service for EMDR42
 * 
 * Features:
 * - Therapeutic voice profiling and selection
 * - Patient preference learning and adaptation
 * - Context-aware voice recommendations
 * - A/B testing for voice effectiveness
 * - Voice matching based on therapeutic goals
 * - Cultural and linguistic sensitivity
 * - Accessibility compliance (hearing impairments, etc.)
 */

import type {
  TTSVoiceConfig,
  TTSVoiceProfile,
  TTSPersonalizationConfig,
  TTSPersonalizationPreferences,
  TTSVoiceRecommendation,
  VoiceEffectivenessMetrics
} from '@/../../shared/types';

interface VoiceUsageData {
  voiceId: string;
  sessionId: string;
  patientId: string;
  context: string;
  duration: number;
  effectiveness: {
    sudsImprovement: number;
    engagementScore: number;
    completionRate: number;
    patientFeedback?: number; // 1-5 rating
  };
  timestamp: Date;
}

interface TherapeuticVoiceProfile {
  voice: TTSVoiceConfig;
  profile: TTSVoiceProfile;
  compatibility: {
    anxiety: number; // 0-1 compatibility score
    trauma: number;
    children: number;
    cultural: Record<string, number>; // culture code -> compatibility
  };
  effectiveness: VoiceEffectivenessMetrics;
  lastUpdated: Date;
}

interface PatientVoiceProfile {
  patientId: string;
  preferences: TTSPersonalizationPreferences;
  voiceHistory: VoiceUsageData[];
  preferredVoices: string[];
  avoidedVoices: string[];
  learningData: {
    contextualPreferences: Record<string, string[]>; // context -> preferred voice IDs
    effectivenessScores: Record<string, number>; // voice ID -> effectiveness score
    personalityAlignment: {
      openness: number;
      conscientiousness: number;
      extraversion: number;
      agreeableness: number;
      neuroticism: number;
    };
  };
  lastUpdated: Date;
}

/**
 * Voice Personalization Service Implementation
 * Manages intelligent voice selection and adaptation for therapeutic contexts
 */
export class VoicePersonalizationService {
  private config: TTSPersonalizationConfig;
  private voiceProfiles = new Map<string, TherapeuticVoiceProfile>();
  private patientProfiles = new Map<string, PatientVoiceProfile>();
  private usageData: VoiceUsageData[] = [];
  private isInitialized = false;

  // Therapeutic context weights for voice selection
  private contextWeights: Record<string, Record<string, number>> = {
    'preparation': {
      warmth: 0.8,
      authority: 0.4,
      empathy: 0.9,
      clarity: 0.7,
      calmness: 0.8
    },
    'assessment': {
      warmth: 0.6,
      authority: 0.7,
      empathy: 0.7,
      clarity: 0.9,
      calmness: 0.6
    },
    'desensitization': {
      warmth: 0.7,
      authority: 0.5,
      empathy: 0.8,
      clarity: 0.8,
      calmness: 0.9
    },
    'installation': {
      warmth: 0.8,
      authority: 0.6,
      empathy: 0.9,
      clarity: 0.7,
      calmness: 0.7
    },
    'body-scan': {
      warmth: 0.7,
      authority: 0.3,
      empathy: 0.8,
      clarity: 0.9,
      calmness: 0.9
    },
    'grounding': {
      warmth: 0.9,
      authority: 0.4,
      empathy: 0.9,
      clarity: 0.8,
      calmness: 0.9
    },
    'crisis-intervention': {
      warmth: 0.9,
      authority: 0.8,
      empathy: 0.9,
      clarity: 1.0,
      calmness: 0.9
    }
  };

  constructor(config: TTSPersonalizationConfig = {}) {
    this.config = {
      enablePersonalization: true,
      learningEnabled: true,
      adaptationRate: 0.1,
      culturalSensitivity: true,
      accessibilityOptimization: true,
      voiceEffectivenessTracking: true,
      minSessionsForLearning: 3,
      ...config
    };
  }

  /**
   * Initialize the voice personalization service
   */
  async initialize(availableVoices: TTSVoiceConfig[]): Promise<void> {
    try {
      console.log('🎭 Initializing Voice Personalization Service...');
      
      // Create therapeutic profiles for all available voices
      await this.profileAvailableVoices(availableVoices);
      
      // Load patient preferences from storage
      await this.loadPatientProfiles();
      
      // Load historical usage data
      await this.loadUsageData();
      
      this.isInitialized = true;
      console.log(`✅ Voice Personalization Service initialized with ${this.voiceProfiles.size} voice profiles`);
      
    } catch (error) {
      console.error('❌ Failed to initialize Voice Personalization Service:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Get personalized voice recommendation for a patient and context
   */
  async getVoiceRecommendation(
    patientId: string,
    context: string,
    preferences?: Partial<TTSPersonalizationPreferences>
  ): Promise<TTSVoiceRecommendation> {
    if (!this.isInitialized) {
      throw new Error('Voice personalization service not initialized');
    }

    try {
      console.log(`🎯 Getting voice recommendation for patient ${patientId}, context: ${context}`);
      
      // Get patient profile or create new one
      const patientProfile = this.getOrCreatePatientProfile(patientId, preferences);
      
      // Calculate voice scores based on multiple factors
      const voiceScores = await this.calculateVoiceScores(patientProfile, context);
      
      // Sort by score and get top recommendations
      const rankedVoices = Array.from(voiceScores.entries())
        .sort(([, a], [, b]) => b.totalScore - a.totalScore)
        .slice(0, 5);

      const primaryRecommendation = rankedVoices[0];
      const alternatives = rankedVoices.slice(1);

      const recommendation: TTSVoiceRecommendation = {
        primary: {
          voice: this.voiceProfiles.get(primaryRecommendation[0])!.voice,
          confidence: primaryRecommendation[1].confidence,
          reasoning: primaryRecommendation[1].reasoning
        },
        alternatives: alternatives.map(([voiceId, scoring]) => ({
          voice: this.voiceProfiles.get(voiceId)!.voice,
          confidence: scoring.confidence,
          reasoning: scoring.reasoning
        })),
        context,
        personalizationUsed: this.config.enablePersonalization,
        timestamp: new Date()
      };

      console.log(`🎤 Recommended voice: ${recommendation.primary.voice.name} (${(recommendation.primary.confidence * 100).toFixed(1)}% confidence)`);
      
      return recommendation;

    } catch (error) {
      console.error('Failed to get voice recommendation:', error);
      throw error;
    }
  }

  /**
   * Record voice usage and effectiveness data
   */
  async recordVoiceUsage(
    voiceId: string,
    sessionId: string,
    patientId: string,
    context: string,
    duration: number,
    effectiveness: VoiceUsageData['effectiveness']
  ): Promise<void> {
    try {
      const usageData: VoiceUsageData = {
        voiceId,
        sessionId,
        patientId,
        context,
        duration,
        effectiveness,
        timestamp: new Date()
      };

      this.usageData.push(usageData);

      // Update patient profile with learning data
      const patientProfile = this.patientProfiles.get(patientId);
      if (patientProfile && this.config.learningEnabled) {
        this.updatePatientLearning(patientProfile, usageData);
      }

      // Update voice effectiveness metrics
      if (this.config.voiceEffectivenessTracking) {
        this.updateVoiceEffectiveness(voiceId, effectiveness);
      }

      console.log(`📊 Recorded voice usage: ${voiceId} for ${duration}ms with effectiveness ${effectiveness.engagementScore}`);

    } catch (error) {
      console.error('Failed to record voice usage:', error);
    }
  }

  /**
   * Get patient voice preferences
   */
  getPatientPreferences(patientId: string): TTSPersonalizationPreferences | null {
    const profile = this.patientProfiles.get(patientId);
    return profile ? profile.preferences : null;
  }

  /**
   * Update patient voice preferences
   */
  async updatePatientPreferences(
    patientId: string,
    preferences: Partial<TTSPersonalizationPreferences>
  ): Promise<void> {
    try {
      const profile = this.getOrCreatePatientProfile(patientId);
      
      // Merge with existing preferences
      profile.preferences = {
        ...profile.preferences,
        ...preferences
      };

      profile.lastUpdated = new Date();
      
      // Save to persistent storage
      await this.savePatientProfile(profile);
      
      console.log(`✅ Updated preferences for patient ${patientId}`);

    } catch (error) {
      console.error('Failed to update patient preferences:', error);
      throw error;
    }
  }

  /**
   * Get voice effectiveness analytics
   */
  getVoiceEffectivenessAnalytics(voiceId?: string): any {
    if (voiceId) {
      const profile = this.voiceProfiles.get(voiceId);
      return profile ? profile.effectiveness : null;
    }

    // Return analytics for all voices
    const analytics: Record<string, any> = {};
    
    this.voiceProfiles.forEach((profile, voiceId) => {
      analytics[voiceId] = {
        voice: profile.voice,
        effectiveness: profile.effectiveness,
        compatibility: profile.compatibility
      };
    });

    return analytics;
  }

  /**
   * Calculate voice scores for a patient and context
   */
  private async calculateVoiceScores(
    patientProfile: PatientVoiceProfile,
    context: string
  ): Promise<Map<string, { totalScore: number; confidence: number; reasoning: string[] }>> {
    const scores = new Map();
    const contextWeights = this.contextWeights[context] || this.contextWeights['preparation'];

    this.voiceProfiles.forEach((voiceProfile, voiceId) => {
      const reasoning: string[] = [];
      let totalScore = 0;
      let scoreComponents = 0;

      // 1. Therapeutic compatibility score (40% weight)
      const therapeuticScore = this.calculateTherapeuticScore(voiceProfile, context, contextWeights);
      totalScore += therapeuticScore * 0.4;
      scoreComponents++;
      reasoning.push(`Therapeutic compatibility: ${(therapeuticScore * 100).toFixed(0)}%`);

      // 2. Patient preference score (30% weight)
      const preferenceScore = this.calculatePreferenceScore(patientProfile, voiceId);
      totalScore += preferenceScore * 0.3;
      scoreComponents++;
      reasoning.push(`Patient preference alignment: ${(preferenceScore * 100).toFixed(0)}%`);

      // 3. Historical effectiveness score (20% weight)
      const effectivenessScore = this.calculateEffectivenessScore(patientProfile, voiceId, context);
      totalScore += effectivenessScore * 0.2;
      scoreComponents++;
      reasoning.push(`Historical effectiveness: ${(effectivenessScore * 100).toFixed(0)}%`);

      // 4. Cultural compatibility (10% weight)
      const culturalScore = this.calculateCulturalScore(patientProfile, voiceProfile);
      totalScore += culturalScore * 0.1;
      scoreComponents++;
      reasoning.push(`Cultural compatibility: ${(culturalScore * 100).toFixed(0)}%`);

      const finalScore = totalScore / scoreComponents;
      const confidence = Math.min(0.95, Math.max(0.1, finalScore * (patientProfile.voiceHistory.length / 10 + 0.5)));

      scores.set(voiceId, {
        totalScore: finalScore,
        confidence,
        reasoning
      });
    });

    return scores;
  }

  /**
   * Calculate therapeutic compatibility score
   */
  private calculateTherapeuticScore(
    voiceProfile: TherapeuticVoiceProfile,
    context: string,
    contextWeights: Record<string, number>
  ): number {
    const { characteristics } = voiceProfile.voice;
    let score = 0;
    let weightSum = 0;

    Object.entries(contextWeights).forEach(([trait, weight]) => {
      if (trait in characteristics) {
        score += (characteristics as any)[trait] * weight;
        weightSum += weight;
      }
    });

    // Add therapeutic profile compatibility
    const therapeuticProfile = voiceProfile.voice.therapeuticProfile;
    if (therapeuticProfile) {
      const contextBonus = this.getContextSpecificBonus(context, therapeuticProfile);
      score += contextBonus * 0.2;
      weightSum += 0.2;
    }

    return weightSum > 0 ? score / weightSum : 0.5;
  }

  /**
   * Calculate patient preference score
   */
  private calculatePreferenceScore(patientProfile: PatientVoiceProfile, voiceId: string): number {
    const { preferences, preferredVoices, avoidedVoices, learningData } = patientProfile;
    let score = 0.5; // Neutral starting point

    // Check if voice is in preferred/avoided lists
    if (preferredVoices.includes(voiceId)) {
      score += 0.3;
    } else if (avoidedVoices.includes(voiceId)) {
      score -= 0.4;
    }

    // Check explicit preferences
    const voice = this.voiceProfiles.get(voiceId)?.voice;
    if (voice && preferences) {
      if (preferences.genderPreference && voice.gender === preferences.genderPreference) {
        score += 0.2;
      }
      if (preferences.languagePreference && voice.language === preferences.languagePreference) {
        score += 0.15;
      }
      if (preferences.accentPreference && voice.accent === preferences.accentPreference) {
        score += 0.1;
      }
    }

    // Apply learning data
    const effectivenessScore = learningData.effectivenessScores[voiceId];
    if (effectivenessScore !== undefined) {
      score = (score + effectivenessScore) / 2; // Average with learned effectiveness
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate effectiveness score based on historical data
   */
  private calculateEffectivenessScore(
    patientProfile: PatientVoiceProfile,
    voiceId: string,
    context: string
  ): number {
    const voiceUsage = patientProfile.voiceHistory.filter(usage => usage.voiceId === voiceId);
    const contextUsage = voiceUsage.filter(usage => usage.context === context);

    if (contextUsage.length === 0) {
      // No specific context data, use general voice data
      if (voiceUsage.length === 0) {
        return 0.5; // No data, neutral score
      }
      
      const avgEffectiveness = voiceUsage.reduce((sum, usage) => 
        sum + usage.effectiveness.engagementScore, 0) / voiceUsage.length;
      return avgEffectiveness;
    }

    // Calculate context-specific effectiveness
    const avgEffectiveness = contextUsage.reduce((sum, usage) => {
      return sum + (
        usage.effectiveness.engagementScore * 0.4 +
        usage.effectiveness.completionRate * 0.3 +
        (usage.effectiveness.sudsImprovement > 0 ? 0.8 : 0.2) * 0.3
      );
    }, 0) / contextUsage.length;

    return avgEffectiveness;
  }

  /**
   * Calculate cultural compatibility score
   */
  private calculateCulturalScore(
    patientProfile: PatientVoiceProfile,
    voiceProfile: TherapeuticVoiceProfile
  ): number {
    if (!patientProfile.preferences.culturalBackground) {
      return 0.7; // Neutral when no cultural preference
    }

    const compatibility = voiceProfile.compatibility.cultural[patientProfile.preferences.culturalBackground];
    return compatibility !== undefined ? compatibility : 0.5;
  }

  /**
   * Get context-specific therapeutic bonus
   */
  private getContextSpecificBonus(context: string, therapeuticProfile: TTSVoiceProfile['therapeuticProfile']): number {
    let bonus = 0;

    switch (context) {
      case 'preparation':
      case 'grounding':
        if (therapeuticProfile.anxietyFriendly) bonus += 0.3;
        break;
      case 'assessment':
      case 'desensitization':
        if (therapeuticProfile.traumaSensitive) bonus += 0.4;
        break;
      case 'crisis-intervention':
        if (therapeuticProfile.anxietyFriendly && therapeuticProfile.traumaSensitive) bonus += 0.5;
        break;
    }

    return bonus;
  }

  /**
   * Profile available voices for therapeutic use
   */
  private async profileAvailableVoices(voices: TTSVoiceConfig[]): Promise<void> {
    console.log(`🔍 Profiling ${voices.length} voices for therapeutic use...`);
    
    voices.forEach(voice => {
      const profile: TherapeuticVoiceProfile = {
        voice,
        profile: voice.therapeuticProfile || {
          anxietyFriendly: voice.gender === 'female',
          traumaSensitive: true,
          childFriendly: voice.characteristics.warmth > 0.6,
          culturallySensitive: [voice.language]
        },
        compatibility: {
          anxiety: this.calculateAnxietyCompatibility(voice),
          trauma: this.calculateTraumaCompatibility(voice),
          children: this.calculateChildCompatibility(voice),
          cultural: this.calculateCulturalCompatibility(voice)
        },
        effectiveness: {
          overallRating: 0.5,
          contexts: {},
          successRate: 0.0,
          patientSatisfaction: 0.0,
          clinicalEffectiveness: 0.0,
          usageCount: 0,
          lastUpdated: new Date()
        },
        lastUpdated: new Date()
      };

      this.voiceProfiles.set(voice.name, profile);
    });

    console.log(`✅ Created therapeutic profiles for ${this.voiceProfiles.size} voices`);
  }

  /**
   * Compatibility calculation helpers
   */
  private calculateAnxietyCompatibility(voice: TTSVoiceConfig): number {
    let score = 0.5;
    
    if (voice.characteristics.warmth > 0.6) score += 0.2;
    if (voice.characteristics.calmness === 'slow' || voice.characteristics.pace === 'slow') score += 0.2;
    if (voice.gender === 'female') score += 0.1;
    
    return Math.min(1, score);
  }

  private calculateTraumaCompatibility(voice: TTSVoiceConfig): number {
    let score = 0.5;
    
    if (voice.characteristics.empathy > 0.7) score += 0.2;
    if (voice.characteristics.authority < 0.6) score += 0.15; // Less authoritative
    if (voice.characteristics.warmth > 0.6) score += 0.15;
    
    return Math.min(1, score);
  }

  private calculateChildCompatibility(voice: TTSVoiceConfig): number {
    let score = 0.5;
    
    if (voice.characteristics.warmth > 0.7) score += 0.2;
    if (voice.characteristics.clarity > 0.8) score += 0.2;
    if (voice.age === 'young-adult') score += 0.1;
    
    return Math.min(1, score);
  }

  private calculateCulturalCompatibility(voice: TTSVoiceConfig): Record<string, number> {
    const compatibility: Record<string, number> = {};
    
    // Base compatibility for language regions
    const languageCompatibility: Record<string, string[]> = {
      'en-US': ['american', 'north-american', 'western'],
      'en-GB': ['british', 'european', 'commonwealth'],
      'es-ES': ['spanish', 'european', 'hispanic'],
      'fr-FR': ['french', 'european', 'francophone']
    };

    const cultures = languageCompatibility[voice.language] || [voice.accent];
    
    cultures.forEach(culture => {
      compatibility[culture] = 0.8;
    });

    // Default compatibility for unlisted cultures
    compatibility['global'] = 0.6;

    return compatibility;
  }

  /**
   * Create or get existing patient profile
   */
  private getOrCreatePatientProfile(
    patientId: string,
    preferences?: Partial<TTSPersonalizationPreferences>
  ): PatientVoiceProfile {
    let profile = this.patientProfiles.get(patientId);
    
    if (!profile) {
      profile = {
        patientId,
        preferences: {
          genderPreference: preferences?.genderPreference || null,
          languagePreference: preferences?.languagePreference || 'en-US',
          accentPreference: preferences?.accentPreference || null,
          speedPreference: preferences?.speedPreference || 1.0,
          culturalBackground: preferences?.culturalBackground || null,
          accessibilityNeeds: preferences?.accessibilityNeeds || []
        },
        voiceHistory: [],
        preferredVoices: [],
        avoidedVoices: [],
        learningData: {
          contextualPreferences: {},
          effectivenessScores: {},
          personalityAlignment: {
            openness: 0.5,
            conscientiousness: 0.5,
            extraversion: 0.5,
            agreeableness: 0.5,
            neuroticism: 0.5
          }
        },
        lastUpdated: new Date()
      };

      this.patientProfiles.set(patientId, profile);
    }

    return profile;
  }

  /**
   * Update patient learning data
   */
  private updatePatientLearning(profile: PatientVoiceProfile, usageData: VoiceUsageData): void {
    // Add to history
    profile.voiceHistory.push(usageData);
    
    // Keep only recent history (last 100 sessions)
    if (profile.voiceHistory.length > 100) {
      profile.voiceHistory = profile.voiceHistory.slice(-100);
    }

    // Update contextual preferences
    const { context, voiceId, effectiveness } = usageData;
    if (!profile.learningData.contextualPreferences[context]) {
      profile.learningData.contextualPreferences[context] = [];
    }

    // Update effectiveness scores
    const currentScore = profile.learningData.effectivenessScores[voiceId] || 0.5;
    const newScore = effectiveness.engagementScore;
    profile.learningData.effectivenessScores[voiceId] = 
      currentScore * (1 - this.config.adaptationRate) + newScore * this.config.adaptationRate;

    // Update preferred/avoided lists based on effectiveness
    if (newScore > 0.7 && !profile.preferredVoices.includes(voiceId)) {
      profile.preferredVoices.push(voiceId);
      profile.preferredVoices = profile.preferredVoices.slice(-5); // Keep top 5
    } else if (newScore < 0.3 && !profile.avoidedVoices.includes(voiceId)) {
      profile.avoidedVoices.push(voiceId);
      profile.avoidedVoices = profile.avoidedVoices.slice(-3); // Keep top 3 to avoid
    }

    profile.lastUpdated = new Date();
  }

  /**
   * Update voice effectiveness metrics
   */
  private updateVoiceEffectiveness(voiceId: string, effectiveness: VoiceUsageData['effectiveness']): void {
    const profile = this.voiceProfiles.get(voiceId);
    if (!profile) return;

    const metrics = profile.effectiveness;
    const adaptationRate = 0.1;

    // Update metrics using exponential moving average
    metrics.patientSatisfaction = metrics.patientSatisfaction * (1 - adaptationRate) + 
                                   (effectiveness.patientFeedback || 0.5) * adaptationRate;
    
    metrics.clinicalEffectiveness = metrics.clinicalEffectiveness * (1 - adaptationRate) + 
                                    (effectiveness.sudsImprovement > 0 ? 0.8 : 0.3) * adaptationRate;
    
    metrics.usageCount++;
    metrics.lastUpdated = new Date();
    
    // Calculate overall rating
    metrics.overallRating = (
      metrics.patientSatisfaction * 0.4 +
      metrics.clinicalEffectiveness * 0.6
    );
  }

  /**
   * Storage methods (would integrate with proper persistence in production)
   */
  private async loadPatientProfiles(): Promise<void> {
    // In production, this would load from a database
    // For now, we'll use localStorage as a simple persistence layer
    try {
      const stored = localStorage.getItem('emdr42_patient_voice_profiles');
      if (stored) {
        const profiles = JSON.parse(stored);
        Object.entries(profiles).forEach(([patientId, profile]) => {
          this.patientProfiles.set(patientId, profile as PatientVoiceProfile);
        });
      }
    } catch (error) {
      console.error('Failed to load patient profiles:', error);
    }
  }

  private async savePatientProfile(profile: PatientVoiceProfile): Promise<void> {
    try {
      const allProfiles = Object.fromEntries(this.patientProfiles.entries());
      localStorage.setItem('emdr42_patient_voice_profiles', JSON.stringify(allProfiles));
    } catch (error) {
      console.error('Failed to save patient profile:', error);
    }
  }

  private async loadUsageData(): Promise<void> {
    // In production, this would load from analytics database
    // For demo, we'll use a small sample
    this.usageData = [];
  }

  /**
   * Get service status and analytics
   */
  getServiceStatus() {
    return {
      isInitialized: this.isInitialized,
      voiceProfilesCount: this.voiceProfiles.size,
      patientProfilesCount: this.patientProfiles.size,
      totalUsageRecords: this.usageData.length,
      config: this.config,
      topVoices: this.getTopVoicesByEffectiveness(),
      recentActivity: this.usageData.slice(-10)
    };
  }

  /**
   * Get top voices by effectiveness
   */
  private getTopVoicesByEffectiveness() {
    return Array.from(this.voiceProfiles.entries())
      .sort(([,a], [,b]) => b.effectiveness.overallRating - a.effectiveness.overallRating)
      .slice(0, 5)
      .map(([voiceId, profile]) => ({
        voiceId,
        name: profile.voice.name,
        rating: profile.effectiveness.overallRating,
        usageCount: profile.effectiveness.usageCount
      }));
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Voice Personalization Service...');
    
    // Save current data
    for (const profile of Array.from(this.patientProfiles.values())) {
      await this.savePatientProfile(profile);
    }

    this.voiceProfiles.clear();
    this.patientProfiles.clear();
    this.usageData = [];
    this.isInitialized = false;
  }
}