/**
 * Revolutionary Adaptive Controller for 3D BLS
 * Maps 98 emotional states to optimal therapeutic settings with hysteresis and AI integration
 */

import type { 
  EmotionData, 
  BLSConfiguration, 
  BLSPattern, 
  EMDRPhase,
  EmotionalState98 
} from '@/../../shared/types';
import { 
  createDefaultBLSAudioConfig,
  createDefaultBLSHapticsConfig,
  createDefaultBLS3DConfig,
  createDefaultBLSTransitionConfig 
} from '@/../../shared/types';
import { affects98, calculateAffects, getDominantAffect } from '@/../../shared/emotionAffects';

export interface AdaptiveRule {
  condition: (emotion: EmotionData) => boolean;
  adaptations: Partial<BLSConfiguration>;
  priority: number; // Higher priority rules override lower ones
  therapeutic: string; // Therapeutic reasoning for the adaptation
}

export interface AdaptiveState {
  currentRule: AdaptiveRule | null;
  lastChange: number;
  stabilityScore: number; // 0-1, higher means more stable
  changeCount: number;
  adaptationHistory: Array<{
    timestamp: number;
    rule: string;
    emotion: EmotionData;
    adaptation: Partial<BLSConfiguration>;
  }>;
}

export interface HysteresisThreshold {
  enterValue: number;
  exitValue: number;
  name: string;
}

export class AdaptiveController {
  private state: AdaptiveState;
  private rules: Map<string, AdaptiveRule> = new Map();
  private hysteresisThresholds: Map<string, HysteresisThreshold> = new Map();
  private config: BLSConfiguration;
  private lastEmotionData: EmotionData | null = null;
  private stabilityWindow: EmotionData[] = [];
  private readonly STABILITY_WINDOW_SIZE = 10;
  private readonly HYSTERESIS_DEBOUNCE = 2000; // 2 seconds
  private readonly MAX_CHANGES_PER_MINUTE = 6;
  
  constructor(initialConfig: BLSConfiguration) {
    this.config = initialConfig;
    this.state = {
      currentRule: null,
      lastChange: 0,
      stabilityScore: 1.0,
      changeCount: 0,
      adaptationHistory: []
    };
    
    this.initializeAdaptiveRules();
    this.initializeHysteresisThresholds();
    
    console.log(`Adaptive Controller initialized with ${this.rules.size} emotional state mapping rules`);
  }

  /**
   * Process emotion data and return adaptive BLS configuration
   */
  adaptConfiguration(
    emotionData: EmotionData, 
    currentPhase: EMDRPhase,
    currentConfig: BLSConfiguration
  ): { config: BLSConfiguration; reasoning: string; changed: boolean } {
    
    this.updateStabilityMetrics(emotionData);
    this.lastEmotionData = emotionData;
    
    // Find applicable rules based on current emotion and phase
    const applicableRules = this.findApplicableRules(emotionData, currentPhase);
    const bestRule = this.selectBestRule(applicableRules, emotionData);
    
    // Apply hysteresis to prevent oscillations
    const shouldApplyRule = this.shouldApplyRule(bestRule, emotionData);
    
    if (!shouldApplyRule || !bestRule) {
      return {
        config: currentConfig,
        reasoning: 'No adaptation needed - maintaining current settings',
        changed: false
      };
    }
    
    // Apply the rule adaptation
    const adaptedConfig = this.applyRuleAdaptation(bestRule, currentConfig, emotionData);
    
    // Update state
    this.updateAdaptiveState(bestRule, emotionData, adaptedConfig);
    
    return {
      config: adaptedConfig,
      reasoning: bestRule.therapeutic,
      changed: true
    };
  }

  /**
   * Get therapeutic recommendations based on emotion analysis
   */
  getTherapeuticRecommendations(emotionData: EmotionData, phase: EMDRPhase): string[] {
    const recommendations: string[] = [];
    
    // High arousal recommendations
    if (emotionData.arousal > 0.7) {
      recommendations.push('Consider slowing down stimulation to help regulate arousal');
      recommendations.push('Introduce grounding techniques between sets');
    }
    
    // Low arousal recommendations  
    if (emotionData.arousal < 0.3) {
      recommendations.push('Increase stimulation intensity to maintain engagement');
      recommendations.push('Consider more dynamic movement patterns');
    }
    
    // Negative valence recommendations
    if (emotionData.valence < 0.3) {
      recommendations.push('Use calming colors and gentle patterns');
      recommendations.push('Consider extending processing time');
    }
    
    // Phase-specific recommendations
    switch (phase) {
      case 'desensitization':
        if (emotionData.arousal > 0.6) {
          recommendations.push('Monitor for reactivation - consider slowing pace');
        }
        break;
      case 'installation':
        if (emotionData.valence < 0.5) {
          recommendations.push('Positive cognition may need strengthening');
        }
        break;
    }
    
    return recommendations;
  }

  /**
   * Check if emotions indicate crisis or high distress
   */
  detectCrisisState(emotionData: EmotionData): { isCrisis: boolean; severity: string; interventions: string[] } {
    const arousal = emotionData.arousal;
    const valence = emotionData.valence;
    
    // Crisis detection logic
    const isCrisis = (arousal > 0.9 && valence < 0.2) || // Extreme distress
                     (arousal > 0.8 && valence < 0.1);   // Severe trauma response
    
    if (isCrisis) {
      return {
        isCrisis: true,
        severity: arousal > 0.9 ? 'severe' : 'high',
        interventions: [
          'Stop bilateral stimulation immediately',
          'Implement grounding techniques',
          'Return to stabilization resources',
          'Consider session pause or termination',
          'Activate safety protocols'
        ]
      };
    }
    
    // High distress but manageable
    if (arousal > 0.75 && valence < 0.3) {
      return {
        isCrisis: false,
        severity: 'moderate',
        interventions: [
          'Slow down stimulation speed',
          'Use calming colors and sounds',
          'Increase therapist support',
          'Consider brief resource break'
        ]
      };
    }
    
    return {
      isCrisis: false,
      severity: 'low',
      interventions: []
    };
  }

  // === Private Methods ===

  private initializeAdaptiveRules(): void {
    this.createCrisisRules();
    this.createHighArousalRules();
    this.createLowArousalRules();
    this.createPositiveEmotionRules();
    this.createNegativeEmotionRules();
    this.createSpecificAffectRules();
    this.createTherapeuticPhaseRules();
    
    console.log(`Initialized ${this.rules.size} adaptive rules for 98 emotional states`);
  }

  /**
   * Crisis and safety rules - highest priority
   */
  private createCrisisRules(): void {
    // Extreme distress - panic states
    this.rules.set('crisis-extreme-distress', {
      condition: (e) => e.arousal > 0.9 && e.valence < 0.2,
      adaptations: {
        speed: 1,
        pattern: 'horizontal',
        color: '#1e293b', // Dark grounding
        audio: createDefaultBLSAudioConfig({ enabled: false }),
        haptics: createDefaultBLSHapticsConfig({ 
          enabled: true, 
          pattern: 'breathing', 
          intensity: 0.1, 
          duration: 6000, 
          interval: 8000,
          syncWithMovement: false,
          syncWithAudio: false
        }),
        rendering3D: createDefaultBLS3DConfig({ enabled: false }) // Fallback to 2D
      },
      priority: 100,
      therapeutic: 'CRISIS: Extreme distress - minimal stimulation, basic grounding, emergency stabilization'
    });

    // Panic attack state
    this.rules.set('panic-attack', {
      condition: (e) => this.hasAffectAbove(e, ['Afraid', 'Alarmed', 'Scared'], 25) && e.arousal > 0.8,
      adaptations: {
        speed: 1,
        pattern: 'circle',
        color: '#475569', // Stable gray-blue
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'alpha',
          binauralFrequency: 8,
          volume: 0.3,
          spatialAudio: false
        })
      },
      priority: 95,
      therapeutic: 'Panic attack detected - slow circles with deep alpha waves for immediate stabilization'
    });

    // Severe trauma activation
    this.rules.set('trauma-severe', {
      condition: (e) => e.arousal > 0.85 && e.valence < 0.25,
      adaptations: {
        speed: 2,
        pattern: 'horizontal',
        color: '#60a5fa', // Calming blue
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'nature-sounds',
          volume: 0.3,
          spatialAudio: false
        }),
        haptics: createDefaultBLSHapticsConfig({ enabled: false })
      },
      priority: 90,
      therapeutic: 'Severe trauma activation - basic bilateral with nature sounds for safety'
    });
  }

  /**
   * High arousal state rules
   */
  private createHighArousalRules(): void {
    // Angry states (Angry, Hostile, Hateful, Frustrated)
    this.rules.set('anger-rage', {
      condition: (e) => this.hasAffectAbove(e, ['Angry', 'Hostile', 'Hateful', 'Frustrated'], 15),
      adaptations: {
        speed: 3,
        pattern: 'horizontal', // Linear movement for discharge
        color: '#64748b', // Cool gray to calm
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'white-noise',
          volume: 0.4
        }),
        haptics: createDefaultBLSHapticsConfig({
          enabled: true,
          pattern: 'wave',
          intensity: 0.3,
          syncWithMovement: true
        })
      },
      priority: 80,
      therapeutic: 'Anger discharge - linear movement with white noise for emotional regulation'
    });

    // Excited positive states (Excited, Elated, Enthusiastic, Passionate)
    this.rules.set('excitement-elation', {
      condition: (e) => this.hasAffectAbove(e, ['Excited', 'Elated', 'Enthusiastic', 'Passionate'], 12),
      adaptations: {
        speed: 8,
        pattern: 'spiral3d',
        color: '#f59e0b', // Energetic orange
        secondaryColor: '#dc2626', // Red accent
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'beta',
          binauralFrequency: 20,
          volume: 0.7,
          spatialAudio: true
        }),
        rendering3D: createDefaultBLS3DConfig({
          lighting: 'dramatic',
          particleEffects: true,
          bloomEffect: true
        })
      },
      priority: 40,
      therapeutic: 'High positive energy - dynamic 3D patterns to channel and focus excitement'
    });

    // Anxiety/worry states (Anxious, Worried, Tense, Strained)
    this.rules.set('anxiety-worry', {
      condition: (e) => this.hasAffectAbove(e, ['Anxious', 'Worried', 'Tense', 'Strained'], 15),
      adaptations: {
        speed: 2,
        pattern: 'circle',
        color: '#3b82f6', // Calming blue
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'alpha',
          binauralFrequency: 10,
          volume: 0.4
        }),
        haptics: createDefaultBLSHapticsConfig({
          enabled: true,
          pattern: 'breathing',
          intensity: 0.2,
          duration: 4000,
          interval: 6000
        })
      },
      priority: 75,
      therapeutic: 'Anxiety regulation - slow circles with breathing pattern for grounding'
    });
  }

  /**
   * Low arousal state rules
   */
  private createLowArousalRules(): void {
    // Depression states (Depressed, Hopeless, Miserable, Dejected)
    this.rules.set('depression-despair', {
      condition: (e) => this.hasAffectAbove(e, ['Depressed', 'Hopeless', 'Miserable', 'Dejected'], 15),
      adaptations: {
        speed: 4,
        pattern: 'helix3d', // Upward spiral
        color: '#f97316', // Warm orange
        secondaryColor: '#fbbf24', // Gold
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'sacred-geometry',
          volume: 0.5
        }),
        haptics: createDefaultBLSHapticsConfig({
          enabled: true,
          pattern: 'heartbeat',
          intensity: 0.4
        })
      },
      priority: 70,
      therapeutic: 'Depression support - upward helix with warm colors for gentle activation'
    });

    // Boredom/disengagement (Bored, Indifferent, Tired, Sleepy)
    this.rules.set('boredom-disengagement', {
      condition: (e) => this.hasAffectAbove(e, ['Bored', 'Indifferent', 'Tired', 'Sleepy'], 12),
      adaptations: {
        speed: 6,
        pattern: 'lissajous3d',
        color: '#8b5cf6', // Engaging purple
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'beta',
          binauralFrequency: 15
        }),
        haptics: createDefaultBLSHapticsConfig({
          enabled: true,
          pattern: 'pulse',
          intensity: 0.5,
          syncWithMovement: true
        })
      },
      priority: 60,
      therapeutic: 'Engagement activation - complex patterns with beta waves for alertness'
    });

    // Peaceful calm states (Peaceful, Calm, Tranquil, Relaxed)
    this.rules.set('peaceful-calm', {
      condition: (e) => this.hasAffectAbove(e, ['Peaceful', 'Calm', 'Tranquil', 'Relaxed'], 12),
      adaptations: {
        speed: 3,
        pattern: 'wave3d',
        color: '#10b981', // Peaceful green
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'nature-sounds',
          volume: 0.3
        }),
        haptics: createDefaultBLSHapticsConfig({
          enabled: true,
          pattern: 'breathing',
          intensity: 0.2
        })
      },
      priority: 30,
      therapeutic: 'Peaceful state - maintaining calm with gentle wave patterns'
    });
  }

  /**
   * Positive emotion rules
   */
  private createPositiveEmotionRules(): void {
    // Joy and happiness (Happy, Joyful, Delighted, Light-hearted)
    this.rules.set('joy-happiness', {
      condition: (e) => this.hasAffectAbove(e, ['Happy', 'Joyful', 'Delighted', 'Light-hearted'], 12),
      adaptations: {
        speed: 7,
        pattern: 'butterfly3d',
        color: '#fbbf24', // Bright yellow
        secondaryColor: '#f59e0b', // Orange
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'sacred-geometry',
          volume: 0.6
        }),
        rendering3D: createDefaultBLS3DConfig({
          lighting: 'dramatic',
          bloomEffect: true,
          particleEffects: true
        })
      },
      priority: 35,
      therapeutic: 'Joy celebration - beautiful butterfly patterns to amplify positive emotions'
    });

    // Love and compassion (Amorous, Compassionate, Friendly)
    this.rules.set('love-compassion', {
      condition: (e) => this.hasAffectAbove(e, ['Amorous', 'Compassionate', 'Friendly'], 10),
      adaptations: {
        speed: 4,
        pattern: 'DNA3d',
        color: '#ec4899', // Love pink
        secondaryColor: '#a855f7', // Purple
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'singing-bowls',
          volume: 0.5
        }),
        haptics: createDefaultBLSHapticsConfig({
          enabled: true,
          pattern: 'heartbeat',
          intensity: 0.4
        })
      },
      priority: 25,
      therapeutic: 'Love and connection - DNA helix with heart resonance'
    });

    // Confidence and success (Confident, Successful, Courageous, Ambitious)
    this.rules.set('confidence-success', {
      condition: (e) => this.hasAffectAbove(e, ['Confident', 'Successful', 'Courageous', 'Ambitious'], 12),
      adaptations: {
        speed: 6,
        pattern: 'cube3d',
        color: '#7c3aed', // Royal purple
        secondaryColor: '#f59e0b', // Gold
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'beta',
          binauralFrequency: 18
        })
      },
      priority: 30,
      therapeutic: 'Confidence building - structured cube patterns with beta waves'
    });

    // Hope and inspiration (Hopeful, Inspired, Eager, Determined)
    this.rules.set('hope-inspiration', {
      condition: (e) => this.hasAffectAbove(e, ['Hopeful', 'Inspired', 'Eager', 'Determined'], 10),
      adaptations: {
        speed: 7,
        pattern: 'helix3d',
        color: '#f59e0b', // Gold
        secondaryColor: '#dc2626', // Red energy
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'sacred-geometry',
          volume: 0.6
        })
      },
      priority: 20,
      therapeutic: 'Hope and determination - upward helix for positive momentum'
    });
  }

  /**
   * Negative emotion rules
   */
  private createNegativeEmotionRules(): void {
    // Sadness and grief (Sad, Gloomy, Melancholic, Lonely)
    this.rules.set('sadness-grief', {
      condition: (e) => this.hasAffectAbove(e, ['Sad', 'Gloomy', 'Melancholic', 'Lonely'], 15),
      adaptations: {
        speed: 4,
        pattern: 'spiral3d',
        color: '#f97316', // Warm orange for comfort
        secondaryColor: '#fbbf24', // Yellow hope
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'nature-sounds',
          volume: 0.4
        }),
        haptics: createDefaultBLSHapticsConfig({
          enabled: true,
          pattern: 'heartbeat',
          intensity: 0.3
        })
      },
      priority: 65,
      therapeutic: 'Sadness comfort - gentle upward spirals with warm colors for healing'
    });

    // Shame and guilt (Ashamed, Feel guilt, Embarrassed)
    this.rules.set('shame-guilt', {
      condition: (e) => this.hasAffectAbove(e, ['Ashamed', 'Feel guilt', 'Embarrassed'], 10),
      adaptations: {
        speed: 5,
        pattern: 'infinity3d',
        color: '#10b981', // Healing green
        secondaryColor: '#3b82f6', // Calming blue
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'singing-bowls',
          volume: 0.4
        }),
        rendering3D: createDefaultBLS3DConfig({
          lighting: 'therapeutic',
          bloomEffect: true
        })
      },
      priority: 55,
      therapeutic: 'Shame healing - infinity patterns for self-forgiveness and renewal'
    });

    // Fear and terror (Afraid, Scared, Startled, Distressed)
    this.rules.set('fear-terror', {
      condition: (e) => this.hasAffectAbove(e, ['Afraid', 'Scared', 'Startled', 'Distressed'], 15),
      adaptations: {
        speed: 2,
        pattern: 'circle',
        color: '#3b82f6', // Safe blue
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'alpha',
          binauralFrequency: 10,
          volume: 0.4
        }),
        haptics: createDefaultBLSHapticsConfig({
          enabled: true,
          pattern: 'breathing',
          intensity: 0.2
        }),
        rendering3D: createDefaultBLS3DConfig({
          shadows: false,
          particleEffects: false
        })
      },
      priority: 80,
      therapeutic: 'Fear containment - safe circular patterns with alpha waves for calming'
    });

    // Disgust and revulsion (Disgusted, Bitter, Uncomfortable)
    this.rules.set('disgust-revulsion', {
      condition: (e) => this.hasAffectAbove(e, ['Disgusted', 'Bitter', 'Uncomfortable'], 12),
      adaptations: {
        speed: 4,
        pattern: 'horizontal',
        color: '#6b7280', // Neutral gray
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'white-noise',
          volume: 0.3
        })
      },
      priority: 50,
      therapeutic: 'Disgust processing - neutral patterns for emotional detoxification'
    });
  }

  /**
   * Specific affect-based rules for unique emotional states
   */
  private createSpecificAffectRules(): void {
    // Curiosity and interest (Curious, Interested, Attentive)
    this.rules.set('curiosity-interest', {
      condition: (e) => this.hasAffectAbove(e, ['Curious', 'Interested', 'Attentive'], 12),
      adaptations: {
        speed: 6,
        pattern: 'lissajous3d',
        color: '#8b5cf6', // Purple creativity
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'beta',
          binauralFrequency: 16
        })
      },
      priority: 25,
      therapeutic: 'Curiosity engagement - complex patterns to enhance focused attention'
    });

    // Contemplation (Pensive, Serious, Reverent, Solemn)
    this.rules.set('contemplation', {
      condition: (e) => this.hasAffectAbove(e, ['Pensive', 'Serious', 'Reverent', 'Solemn'], 12),
      adaptations: {
        speed: 3,
        pattern: 'sphere3d',
        color: '#7c3aed', // Deep purple wisdom
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'theta',
          binauralFrequency: 6
        })
      },
      priority: 40,
      therapeutic: 'Deep contemplation - spherical wholeness with theta waves for insight'
    });

    // Surprise and astonishment (Surprised, Astonished, Taken aback)
    this.rules.set('surprise-astonishment', {
      condition: (e) => this.hasAffectAbove(e, ['Surprised', 'Astonished', 'Taken aback'], 10),
      adaptations: {
        speed: 5,
        pattern: 'lemniscate3d',
        color: '#f59e0b', // Bright orange
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'alpha',
          binauralFrequency: 12
        }),
        transitions: createDefaultBLSTransitionConfig({
          enabled: true,
          duration: 3000,
          morphing: true
        })
      },
      priority: 45,
      therapeutic: 'Surprise integration - figure-8 patterns for processing unexpected experiences'
    });

    // Dissociation (Indifferent, Apathetic, Languid)
    this.rules.set('dissociation', {
      condition: (e) => this.hasAffectAbove(e, ['Indifferent', 'Apathetic', 'Languid'], 15) && e.arousal < 0.2,
      adaptations: {
        speed: 6,
        pattern: 'cube3d',
        color: '#dc2626', // Alert red
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'theta',
          binauralFrequency: 5
        }),
        haptics: createDefaultBLSHapticsConfig({
          enabled: true,
          pattern: 'pulse',
          intensity: 0.6,
          syncWithMovement: true
        })
      },
      priority: 85,
      therapeutic: 'Dissociation grounding - structured patterns with haptic feedback for reconnection'
    });
  }

  /**
   * Therapeutic phase-specific rules
   */
  private createTherapeuticPhaseRules(): void {
    // Optimal processing window
    this.rules.set('optimal-processing', {
      condition: (e) => e.arousal >= 0.4 && e.arousal <= 0.7 && e.valence >= 0.3 && e.valence <= 0.7,
      adaptations: {
        speed: 5,
        pattern: 'lemniscate3d',
        color: '#3b82f6',
        audio: createDefaultBLSAudioConfig({
          enabled: true,
          audioType: 'binaural-beats',
          binauralType: 'alpha',
          binauralFrequency: 10,
          volume: 0.5,
          spatialAudio: true
        })
      },
      priority: 50,
      therapeutic: 'Optimal processing window - balanced stimulation for effective integration'
    });
  }

  /**
   * Helper method to check if any affects are above threshold
   */
  private hasAffectAbove(emotionData: EmotionData, affectNames: string[], threshold: number): boolean {
    return affectNames.some(name => emotionData.affects[name] > threshold);
  }

  private initializeHysteresisThresholds(): void {
    // Define hysteresis thresholds to prevent oscillation
    this.hysteresisThresholds.set('high-arousal', {
      enterValue: 0.7,
      exitValue: 0.6,
      name: 'high-arousal'
    });

    this.hysteresisThresholds.set('low-arousal', {
      enterValue: 0.3,
      exitValue: 0.4,
      name: 'low-arousal'
    });

    this.hysteresisThresholds.set('negative-valence', {
      enterValue: 0.3,
      exitValue: 0.4,
      name: 'negative-valence'
    });

    this.hysteresisThresholds.set('positive-valence', {
      enterValue: 0.7,
      exitValue: 0.6,
      name: 'positive-valence'
    });
  }

  private findApplicableRules(emotionData: EmotionData, phase: EMDRPhase): AdaptiveRule[] {
    const applicable: AdaptiveRule[] = [];
    
    for (const rule of Array.from(this.rules.values())) {
      if (rule.condition(emotionData)) {
        applicable.push(rule);
      }
    }
    
    return applicable.sort((a, b) => b.priority - a.priority);
  }

  private selectBestRule(rules: AdaptiveRule[], emotionData: EmotionData): AdaptiveRule | null {
    if (rules.length === 0) return null;
    
    // Return highest priority rule that passes hysteresis check
    for (const rule of rules) {
      if (this.passesHysteresisCheck(rule, emotionData)) {
        return rule;
      }
    }
    
    return null;
  }

  private passesHysteresisCheck(rule: AdaptiveRule, emotionData: EmotionData): boolean {
    // If no current rule, allow any new rule
    if (!this.state.currentRule) return true;
    
    // If same rule, always allow (no change)
    if (this.state.currentRule === rule) return true;
    
    // If different rule, check time debounce
    const timeSinceLastChange = Date.now() - this.state.lastChange;
    if (timeSinceLastChange < this.HYSTERESIS_DEBOUNCE) return false;
    
    // Check rate limiting
    const recentChanges = this.state.adaptationHistory.filter(
      h => Date.now() - h.timestamp < 60000 // Last minute
    ).length;
    
    if (recentChanges >= this.MAX_CHANGES_PER_MINUTE) return false;
    
    // Check if the emotional change is significant enough
    if (this.lastEmotionData) {
      const arousalDelta = Math.abs(emotionData.arousal - this.lastEmotionData.arousal);
      const valenceDelta = Math.abs(emotionData.valence - this.lastEmotionData.valence);
      
      // Require significant change to trigger adaptation
      if (arousalDelta < 0.15 && valenceDelta < 0.15) return false;
    }
    
    return true;
  }

  private shouldApplyRule(rule: AdaptiveRule | null, emotionData: EmotionData): boolean {
    if (!rule) return false;
    
    // Always apply crisis rules immediately
    if (rule.priority >= 100) return true;
    
    return this.passesHysteresisCheck(rule, emotionData);
  }

  private applyRuleAdaptation(
    rule: AdaptiveRule, 
    currentConfig: BLSConfiguration, 
    emotionData: EmotionData
  ): BLSConfiguration {
    
    // Deep clone current config and apply adaptations
    const adaptedConfig: BLSConfiguration = JSON.parse(JSON.stringify(currentConfig));
    
    // Apply rule adaptations
    Object.assign(adaptedConfig, rule.adaptations);
    
    // Apply fine-tuning based on specific emotion values
    this.applyEmotionBasedTuning(adaptedConfig, emotionData);
    
    return adaptedConfig;
  }

  private applyEmotionBasedTuning(config: BLSConfiguration, emotionData: EmotionData): void {
    // Fine-tune speed based on arousal
    const arousalFactor = emotionData.arousal;
    if (arousalFactor > 0.8) {
      config.speed = Math.max(1, config.speed * 0.7); // Slow down for high arousal
    } else if (arousalFactor < 0.3) {
      config.speed = Math.min(10, config.speed * 1.3); // Speed up for low arousal
    }
    
    // Fine-tune audio volume based on emotional intensity
    const emotionalIntensity = Math.sqrt(emotionData.arousal * emotionData.arousal + emotionData.valence * emotionData.valence);
    config.audio.volume = Math.max(0.1, Math.min(1.0, emotionalIntensity * 0.8));
    
    // Fine-tune haptic intensity based on arousal
    if (config.haptics.enabled) {
      config.haptics.intensity = Math.max(0.1, Math.min(1.0, (1 - emotionData.arousal) * 0.8 + 0.2));
    }
  }

  private updateStabilityMetrics(emotionData: EmotionData): void {
    // Add to stability window
    this.stabilityWindow.push(emotionData);
    if (this.stabilityWindow.length > this.STABILITY_WINDOW_SIZE) {
      this.stabilityWindow.shift();
    }
    
    // Calculate stability score
    if (this.stabilityWindow.length >= 3) {
      const arousalVariance = this.calculateVariance(this.stabilityWindow.map(e => e.arousal));
      const valenceVariance = this.calculateVariance(this.stabilityWindow.map(e => e.valence));
      
      // Lower variance = higher stability
      this.state.stabilityScore = Math.max(0, 1 - (arousalVariance + valenceVariance));
    }
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private updateAdaptiveState(
    rule: AdaptiveRule, 
    emotionData: EmotionData, 
    adaptedConfig: BLSConfiguration
  ): void {
    this.state.currentRule = rule;
    this.state.lastChange = Date.now();
    this.state.changeCount++;
    
    // Add to history
    this.state.adaptationHistory.push({
      timestamp: Date.now(),
      rule: rule.therapeutic,
      emotion: emotionData,
      adaptation: rule.adaptations
    });
    
    // Trim history to last 50 entries
    if (this.state.adaptationHistory.length > 50) {
      this.state.adaptationHistory = this.state.adaptationHistory.slice(-50);
    }
  }

  /**
   * Get current adaptive state for monitoring
   */
  getAdaptiveState(): AdaptiveState {
    return { ...this.state };
  }

  /**
   * Reset adaptive state (for new session)
   */
  reset(): void {
    this.state = {
      currentRule: null,
      lastChange: 0,
      stabilityScore: 1.0,
      changeCount: 0,
      adaptationHistory: []
    };
    this.stabilityWindow = [];
    this.lastEmotionData = null;
  }

  /**
   * Enhanced emotion state analysis with 98 affects integration
   */
  analyzeEmotionalState(emotionData: EmotionData): EmotionalState98 {
    const affects = emotionData.affects;
    const primaryAffects: Array<{name: string; intensity: number; arousal: number; valence: number}> = [];
    const secondaryAffects: Array<{name: string; intensity: number}> = [];
    
    // Sort affects by intensity
    const sortedAffects = Object.entries(affects)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // Top 10 affects
    
    // Map affects to coordinates
    sortedAffects.forEach(([affectName, intensity], index) => {
      const coords = affects98[affectName];
      if (coords) {
        if (index < 3) {
          primaryAffects.push({
            name: affectName,
            intensity: intensity,
            arousal: coords.arousal,
            valence: coords.valence
          });
        } else {
          secondaryAffects.push({
            name: affectName,
            intensity: intensity
          });
        }
      }
    });
    
    // Calculate stability score
    const stabilityScore = this.calculateEmotionalStability(emotionData);
    
    // Calculate engagement level
    const engagementLevel = Math.max(0, Math.min(1, 
      (emotionData.arousal + Math.abs(emotionData.valence - 0.5)) / 1.5
    ));
    
    // Calculate overall stress level
    const stressLevel = Math.max(0, Math.min(1,
      emotionData.arousal * (emotionData.valence < 0.5 ? 1.5 : 0.7)
    ));
    
    return {
      primaryAffects,
      secondaryAffects,
      stabilityScore,
      engagementLevel,
      stressLevel
    };
  }

  /**
   * Calculate emotional stability based on recent history
   */
  private calculateEmotionalStability(emotionData: EmotionData): number {
    if (this.stabilityWindow.length < 3) return 1.0;
    
    // Calculate variance in arousal and valence
    const arousalVariance = this.calculateVariance(
      this.stabilityWindow.map(e => e.arousal)
    );
    const valenceVariance = this.calculateVariance(
      this.stabilityWindow.map(e => e.valence)
    );
    
    // Higher variance = lower stability
    const totalVariance = arousalVariance + valenceVariance;
    return Math.max(0, Math.min(1, 1 - (totalVariance * 2)));
  }

  /**
   * Get detailed therapeutic reasoning for current adaptation
   */
  getTherapeuticReasoning(emotionData: EmotionData): string {
    const currentRule = this.state.currentRule;
    if (!currentRule) return 'No active adaptation rule';
    
    const emotionalState = this.analyzeEmotionalState(emotionData);
    const dominantAffects = emotionalState.primaryAffects
      .map(a => a.name)
      .join(', ');
    
    return `${currentRule.therapeutic}\n\n` +
           `Dominant affects: ${dominantAffects}\n` +
           `Arousal: ${emotionData.arousal.toFixed(2)} | Valence: ${emotionData.valence.toFixed(2)}\n` +
           `Stability: ${emotionalState.stabilityScore.toFixed(2)} | ` +
           `Engagement: ${emotionalState.engagementLevel.toFixed(2)} | ` +
           `Stress: ${emotionalState.stressLevel.toFixed(2)}`;
  }

  /**
   * Configure sensitivity of adaptive responses
   */
  setSensitivity(level: 'low' | 'medium' | 'high'): void {
    switch (level) {
      case 'low':
        // @ts-ignore - modifying readonly property for configuration
        this.HYSTERESIS_DEBOUNCE = 5000; // 5 seconds
        break;
      case 'medium':
        // @ts-ignore
        this.HYSTERESIS_DEBOUNCE = 2000; // 2 seconds
        break;
      case 'high':
        // @ts-ignore
        this.HYSTERESIS_DEBOUNCE = 1000; // 1 second
        break;
    }
  }

  /**
   * Get comprehensive emotional assessment for therapist
   */
  getEmotionalAssessment(emotionData: EmotionData): {
    dominantEmotion: string;
    emotionalQuadrant: string;
    riskLevel: string;
    recommendations: string[];
    stabilityTrend: string;
  } {
    const dominantEmotion = getDominantAffect(emotionData.arousal, emotionData.valence);
    
    // Determine emotional quadrant
    let emotionalQuadrant = '';
    if (emotionData.arousal > 0.5 && emotionData.valence > 0.5) {
      emotionalQuadrant = 'High Energy Positive (Excited/Joyful)';
    } else if (emotionData.arousal > 0.5 && emotionData.valence < 0.5) {
      emotionalQuadrant = 'High Energy Negative (Anxious/Angry)';
    } else if (emotionData.arousal < 0.5 && emotionData.valence > 0.5) {
      emotionalQuadrant = 'Low Energy Positive (Calm/Peaceful)';
    } else {
      emotionalQuadrant = 'Low Energy Negative (Sad/Depressed)';
    }
    
    // Determine risk level
    const crisis = this.detectCrisisState(emotionData);
    let riskLevel = crisis.severity;
    
    // Get therapeutic recommendations
    const recommendations = this.getTherapeuticRecommendations(emotionData, 'desensitization');
    
    // Stability trend
    const stabilityTrend = this.state.stabilityScore > 0.7 ? 'Stable' : 
                          this.state.stabilityScore > 0.4 ? 'Moderately Stable' : 'Unstable';
    
    return {
      dominantEmotion,
      emotionalQuadrant,
      riskLevel,
      recommendations,
      stabilityTrend
    };
  }
}