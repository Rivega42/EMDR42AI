/**
 * Shared TypeScript interfaces for EMDR42 platform
 */

// EMDR Phase types - Complete 8-phase protocol
export type EMDRPhase = 
  | 'preparation'      // Phase 1: Client preparation and stabilization
  | 'assessment'       // Phase 2: Assessment and target identification  
  | 'desensitization'  // Phase 3: Desensitization and reprocessing
  | 'installation'     // Phase 4: Installation of positive cognition
  | 'body-scan'        // Phase 5: Body scan
  | 'closure'          // Phase 6: Closure
  | 'reevaluation'     // Phase 7: Reevaluation
  | 'integration';     // Phase 8: Integration and stabilization

// Emotion Analysis interfaces
export interface EmotionData {
  timestamp: number;
  arousal: number; // 0-1, where 0 is calm and 1 is highly aroused
  valence: number; // 0-1, where 0 is negative and 1 is positive
  affects: Record<string, number>; // 98 affects from affect theory
  basicEmotions: Record<string, number>; // Basic emotions (happy, sad, angry, etc.)
}

// BLS (Bilateral Stimulation) Configuration
export interface BLSConfiguration {
  speed: number; // 1-10 speed scale
  pattern: 'horizontal' | 'vertical' | 'diagonal' | 'circle' | '3d-wave';
  color: string; // Hex color code
  size: number; // Size in pixels
  soundEnabled: boolean;
  adaptiveMode: boolean; // Whether to adapt based on emotion data
}

// AI Therapist Response
export interface AITherapistResponse {
  phase: EMDRPhase;
  message: string;
  suggestedBLS: BLSConfiguration;
  emotionalAnalysis: EmotionData;
}

// Session Participant
export interface SessionParticipant {
  id: string;
  name: string;
  role: 'therapist' | 'patient';
  avatar?: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

// EMDR Settings (for legacy compatibility)
export interface EMDRSettings {
  ballSpeed: number;
  ballSize: number;
  ballShape: 'circle' | 'square' | 'triangle' | 'heart' | 'star' | 'lightning';
  ballColor: string;
  soundEnabled: boolean;
  soundType: 'beep' | 'chime' | 'click' | 'none';
  backgroundColor: string;
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

// Therapeutic Memory for cross-session continuity
export interface TherapeuticMemory {
  patientId: string;
  therapistId: string;
  sessionCount: number;
  keyThemes: string[];
  progressMetrics: {
    sudsReduction: number;
    vocImprovement: number;
    emotionalStability: number;
  };
  adaptivePreferences: {
    preferredBLSPattern: string;
    optimalSpeed: number;
    effectiveColors: string[];
  };
}

// Session Notes
export interface SessionNote {
  id: string;
  sessionId: string;
  timestamp: number;
  phase: EMDRPhase;
  content: string;
  emotionalState?: EmotionData;
  sudsLevel?: number;
  vocLevel?: number;
}

// Assessment Data
export interface AssessmentData {
  sudsLevel: number; // Subjective Units of Disturbance (0-10)
  vocLevel: number; // Validity of Cognition (1-7)
  negativeBeliefs: string;
  positiveBeliefs: string;
  targetMemory: string;
  bodyActivation: string;
  emotionRating: number;
  validityRating: number;
}

// Emotion Capture for database
export interface EmotionCapture {
  id: string;
  sessionId: string;
  patientId: string;
  timestamp: number;
  source: 'face' | 'voice' | 'combined';
  emotionData: EmotionData;
  blsConfig?: BLSConfiguration;
  phaseContext?: EMDRPhase;
}

// AI Therapy Session Log
export interface AITherapySession {
  id: string;
  sessionId: string;
  therapistId: string;
  patientId: string;
  startTime: number;
  endTime?: number;
  aiInterventions: AITherapistResponse[];
  emotionCaptures: string[]; // IDs of emotion captures
  outcomes: {
    sudsChange: number;
    vocChange: number;
    emotionalShift: number;
  };
  notes: string;
}

// === AI Therapist Enhanced Types ===

// AI Therapist Message Types
export interface AITherapistMessage {
  id: string;
  type: 'therapist' | 'patient' | 'system' | 'phase-guidance' | 'crisis-alert';
  content: string;
  timestamp: number;
  phase: EMDRPhase;
  emotionalContext?: EmotionData;
  confidence: number; // 0-1 confidence in the response
  metadata?: {
    reasoning?: string;
    suggestedActions?: string[];
    criticalityLevel?: 'low' | 'medium' | 'high' | 'crisis';
  };
}

// Session Guidance for AI Therapist
export interface AISessionGuidance {
  currentPhase: EMDRPhase;
  suggestedNextPhase?: EMDRPhase;
  phaseProgress: number; // 0-1 completion of current phase
  recommendations: {
    immediate: string[];
    nextSteps: string[];
    concerns: string[];
  };
  adaptiveBLS: BLSConfiguration;
  estimatedTimeRemaining: number; // minutes
  readinessForNextPhase: {
    isReady: boolean;
    criteria: string[];
    missingCriteria: string[];
  };
}

// AI Emotion Response
export interface AIEmotionResponse {
  recognizedEmotions: EmotionData;
  emotionalState: EmotionalState98;
  interventionLevel: 'none' | 'mild' | 'moderate' | 'intensive' | 'crisis';
  recommendations: PersonalizedRecommendation[];
  blsAdjustments: Partial<BLSConfiguration>;
  phaseTransitionAdvice?: {
    canAdvance: boolean;
    shouldRegress: boolean;
    stayInPhase: boolean;
    reasoning: string;
  };
}

// 98 Emotional States Mapping
export interface EmotionalState98 {
  primaryAffects: Array<{
    name: string;
    intensity: number; // 0-100
    arousal: number;   // -1 to 1
    valence: number;   // -1 to 1
  }>;
  secondaryAffects: Array<{
    name: string;
    intensity: number;
  }>;
  stabilityScore: number; // 0-1, how stable the emotional state is
  engagementLevel: number; // 0-1, how engaged the patient is
  stressLevel: number; // 0-1, overall stress level
}

// Crisis Detection Interface
export interface CrisisDetection {
  isCrisis: boolean;
  riskLevel: 'none' | 'low' | 'moderate' | 'high' | 'severe';
  triggers: string[];
  interventions: {
    immediate: string[];
    escalation: string[];
    contacts: string[];
  };
  monitoring: {
    increaseFrequency: boolean;
    alertTherapist: boolean;
    requireSupervision: boolean;
  };
}

// Personalized Recommendations
export interface PersonalizedRecommendation {
  type: 'breathing' | 'grounding' | 'bls-adjustment' | 'phase-transition' | 'break' | 'safety';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  duration?: number; // seconds
  instructions: string[];
  effectiveness?: number; // 0-1 based on patient history
}

// AI Chat Context
export interface AIChatContext {
  sessionId: string;
  patientProfile: {
    id: string;
    preferences: TherapeuticMemory;
    triggers: string[];
    calmingTechniques: string[];
  };
  conversationHistory: AITherapistMessage[];
  currentEmotionalState: EmotionData;
  phaseContext: {
    currentPhase: EMDRPhase;
    timeInPhase: number;
    phaseGoals: string[];
    completionCriteria: string[];
  };
  sessionMetrics: {
    sudsLevels: number[];
    vocLevels: number[];
    stabilityTrend: number;
  };
}

// Enhanced AI Therapist Response
export interface EnhancedAITherapistResponse extends AITherapistResponse {
  chatMessage?: AITherapistMessage;
  sessionGuidance?: AISessionGuidance;
  emotionResponse?: AIEmotionResponse;
  crisisDetection?: CrisisDetection;
  personalizedRecommendations: PersonalizedRecommendation[];
  nextPhaseReadiness: {
    isReady: boolean;
    confidence: number;
    reasoning: string;
  };
}

// EMDR Protocol Definition
export interface EMDRProtocol {
  phases: Array<{
    phase: EMDRPhase;
    name: string;
    description: string;
    goals: string[];
    typicalDuration: number; // minutes
    prerequisites: string[];
    completionCriteria: string[];
    commonChallenges: string[];
    interventions: string[];
  }>;
  adaptationRules: {
    emotionalThresholds: Record<string, number>;
    phaseTransitionRules: Record<EMDRPhase, string[]>;
    crisisProtocols: Record<string, string[]>;
  };
}