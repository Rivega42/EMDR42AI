/**
 * Comprehensive Types for EMDR Session Conductor
 * Revolutionary AI-driven EMDR therapy system
 */

import type {
  EmotionData,
  BLSConfiguration,
  EMDRPhase,
  AITherapistMessage,
  AISessionGuidance,
  SessionMemorySnapshot,
  ProgressMetric,
  CrisisDetection,
  PersonalizedRecommendation,
  EmotionalState98,
  STTTranscriptionResult,
  TTSSynthesisResponse,
  DeviceCapabilities,
  User
} from '@/../../shared/types';

// === EMDR Session State Management ===

export type EMDRSessionState = 
  | 'initialization'     // Setting up session, loading user data
  | 'preparation'        // Phase 1: Client preparation and stabilization
  | 'assessment'         // Phase 2: Assessment and target identification  
  | 'desensitization'    // Phase 3: Desensitization and reprocessing
  | 'installation'       // Phase 4: Installation of positive cognition
  | 'body-scan'          // Phase 5: Body scan
  | 'closure'            // Phase 6: Closure
  | 'reevaluation'       // Phase 7: Reevaluation
  | 'integration'        // Phase 8: Integration and stabilization
  | 'paused'             // Session temporarily paused
  | 'interrupted'        // Session interrupted (crisis, technical issues)
  | 'completed'          // Session successfully completed
  | 'terminated';        // Session terminated early

export interface EMDRPhaseConfig {
  phase: EMDRPhase;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  requiredCompletions: string[]; // List of required tasks/goals
  exitCriteria: EMDRExitCriteria;
  adaptiveThresholds: EmotionThresholds;
  blsSettings: Partial<BLSConfiguration>;
  aiPrompts: {
    phaseIntroduction: string;
    guidancePrompts: string[];
    transitionPrompt: string;
    completionCheckPrompt: string;
  };
}

export interface EMDRExitCriteria {
  sudThreshold?: number; // Subjective Units of Disturbance (0-10)
  vocThreshold?: number; // Validity of Positive Cognition (1-7)
  emotionStabilityMinutes?: number; // Minutes of emotional stability
  userConfirmation?: boolean; // User confirms readiness to proceed
  aiRecommendation?: boolean; // AI therapist recommends progression
  timeMinimum?: boolean; // Minimum time requirement met
}

export interface EmotionThresholds {
  highAnxiety: number; // Threshold for high anxiety intervention
  dissociation: number; // Threshold for dissociation detection
  overwhelm: number; // Threshold for overwhelming emotions
  stability: number; // Threshold for emotional stability
  engagement: number; // Minimum engagement threshold
  crisis: number; // Crisis intervention threshold
}

// === Session Data Persistence ===

export interface EMDRSessionData {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  currentPhase: EMDRPhase;
  sessionState: EMDRSessionState;
  
  // Target Memory Information
  targetMemory: TargetMemory;
  
  // Progress Tracking
  progress: SessionProgress;
  
  // AI Interaction History
  aiInteractions: AIInteractionRecord[];
  
  // Emotion Analysis History
  emotionHistory: EmotionSnapshot[];
  
  // BLS Configuration and Effectiveness
  blsHistory: BLSEffectivenessRecord[];
  
  // Voice Interaction Data
  voiceInteractions: VoiceInteractionRecord[];
  
  // Session Metrics
  metrics: SessionMetrics;
  
  // Personalization Data
  personalization: SessionPersonalization;
  
  // Emergency/Crisis Records
  crisisEvents: CrisisEventRecord[];
}

export interface TargetMemory {
  id: string;
  description: string;
  initialSUD: number; // 0-10 scale
  currentSUD: number;
  targetSUD: number; // Usually 0-2
  
  // Associated Elements
  negativeBeliefs: string[];
  positiveBeliefs: string[];
  currentVOC: number; // 1-7 scale for Validity of Positive Cognition
  targetVOC: number; // Usually 6-7
  
  // Body Sensations
  bodySensations: {
    location: string;
    sensation: string;
    intensity: number; // 0-10
  }[];
  
  // Processing History
  processingHistory: MemoryProcessingSnapshot[];
}

export interface MemoryProcessingSnapshot {
  timestamp: number;
  phase: EMDRPhase;
  sud: number;
  voc: number;
  dominantEmotion: string;
  insights: string[];
  breakthroughs: string[];
}

export interface SessionProgress {
  overallProgress: number; // 0-1, overall session completion
  phaseProgress: Record<EMDRPhase, PhaseProgress>;
  sudProgress: SUDProgressTracker;
  vocProgress: VOCProgressTracker;
  emotionalStability: EmotionalStabilityTracker;
  aiEngagement: AIEngagementTracker;
}

export interface PhaseProgress {
  phase: EMDRPhase;
  status: 'not-started' | 'in-progress' | 'completed' | 'skipped';
  startTime?: number;
  endTime?: number;
  durationMinutes?: number;
  completionRatio: number; // 0-1
  exitCriteriasMet: string[];
  challenges: string[];
  breakthroughs: string[];
}

export interface SUDProgressTracker {
  initialSUD: number;
  currentSUD: number;
  targetSUD: number;
  progressHistory: { timestamp: number; sud: number; phase: EMDRPhase }[];
  reductionRate: number; // SUD reduction per minute
  stabilityPeriod: number; // Minutes at current SUD level
  projectedCompletion: number; // Estimated minutes to target SUD
}

export interface VOCProgressTracker {
  initialVOC: number;
  currentVOC: number;
  targetVOC: number;
  progressHistory: { timestamp: number; voc: number; phase: EMDRPhase }[];
  strengtheningRate: number; // VOC increase per minute
  stabilityPeriod: number; // Minutes at current VOC level
}

export interface EmotionalStabilityTracker {
  currentStability: number; // 0-1, emotional stability score
  stabilityTrend: 'improving' | 'stable' | 'declining';
  stabilityHistory: { timestamp: number; stability: number }[];
  volatilityIndex: number; // 0-1, emotional volatility
  coherenceScore: number; // 0-1, emotional coherence
}

export interface AIEngagementTracker {
  engagementScore: number; // 0-1, patient engagement with AI
  responseQuality: number; // 0-1, quality of AI responses
  therapeuticRapport: number; // 0-1, therapeutic relationship strength
  interventionSuccess: number; // 0-1, success rate of AI interventions
  adaptationEffectiveness: number; // 0-1, how well AI adapts to patient
}

// === AI Interaction Records ===

export interface AIInteractionRecord {
  id: string;
  timestamp: number;
  phase: EMDRPhase;
  interactionType: 'guidance' | 'intervention' | 'assessment' | 'support' | 'crisis';
  
  // Context
  emotionContext: EmotionData;
  sessionContext: {
    sud: number;
    voc: number;
    timeInPhase: number;
    overallProgress: number;
  };
  
  // AI Input/Output
  userMessage?: string;
  aiResponse: AITherapistMessage;
  
  // Effectiveness Tracking
  effectiveness: {
    emotionImpact: number; // -1 to 1, impact on emotions
    sudImpact: number; // Impact on SUD level
    engagementImpact: number; // Impact on user engagement
    overallHelpfulness: number; // 0-1, overall helpfulness
  };
  
  // Intervention Details
  intervention?: {
    type: 'grounding' | 'breathing' | 'safe-place' | 'resource' | 'bilateral';
    parameters: Record<string, any>;
    duration: number; // seconds
    success: boolean;
  };
}

// === Emotion Monitoring & Analysis ===

export interface EmotionSnapshot {
  timestamp: number;
  emotionData: EmotionData;
  phase: EMDRPhase;
  
  // Context
  sessionContext: {
    sud: number;
    voc: number;
    activeIntervention?: string;
    blsActive: boolean;
  };
  
  // Analysis
  analysis: {
    dominantAffect: string;
    arousalLevel: 'low' | 'moderate' | 'high' | 'extreme';
    valenceLevel: 'very-negative' | 'negative' | 'neutral' | 'positive' | 'very-positive';
    stabilityScore: number; // 0-1
    coherenceScore: number; // 0-1
    therapeuticReadiness: number; // 0-1
  };
  
  // Recommendations
  recommendations: {
    interventionNeeded: boolean;
    interventionType?: 'grounding' | 'breathing' | 'safe-place' | 'slow-down' | 'pause';
    blsAdjustment?: Partial<BLSConfiguration>;
    phaseAdjustment?: 'continue' | 'pause' | 'retreat' | 'advance';
  };
}

// === BLS Effectiveness Tracking ===

export interface BLSEffectivenessRecord {
  timestamp: number;
  configuration: BLSConfiguration;
  duration: number; // seconds
  phase: EMDRPhase;
  
  // Emotional Response
  preEmotionState: EmotionData;
  postEmotionState: EmotionData;
  
  // Progress Impact
  sudImpact: number; // Change in SUD
  engagementImpact: number; // Change in engagement
  stabilityImpact: number; // Change in emotional stability
  
  // User Experience
  userExperience: {
    comfort: number; // 0-10
    effectiveness: number; // 0-10
    preference: number; // 0-10
    sideEffects?: string[];
  };
  
  // Effectiveness Metrics
  effectiveness: {
    overallScore: number; // 0-1
    emotionalProcessing: number; // 0-1
    memoryAccess: number; // 0-1
    bilateralActivation: number; // 0-1
    therapeuticGain: number; // 0-1
  };
}

// === Voice Interaction Records ===

export interface VoiceInteractionRecord {
  id: string;
  timestamp: number;
  duration: number; // seconds
  phase: EMDRPhase;
  
  // Voice Data
  transcription: STTTranscriptionResult;
  aiResponse: AITherapistMessage;
  synthesis: TTSSynthesisResponse;
  
  // Quality Metrics
  audioQuality: {
    clarity: number; // 0-1
    noiseLevel: number; // 0-1
    emotionDetectionAccuracy: number; // 0-1
  };
  
  // Therapeutic Impact
  therapeuticImpact: {
    emotionImpact: number; // -1 to 1
    rapportBuilding: number; // 0-1
    therapeuticAlliance: number; // 0-1
    processingFacilitation: number; // 0-1
  };
  
  // Voice Emotion Analysis
  voiceEmotionAnalysis: {
    preCallEmotion: EmotionData;
    duringCallEmotion: EmotionData;
    postCallEmotion: EmotionData;
    emotionalJourney: EmotionData[];
  };
}

// === Session Metrics ===

export interface SessionMetrics {
  // Duration Metrics
  totalDuration: number; // seconds
  effectiveTherapyTime: number; // seconds of actual therapeutic work
  phaseDistribution: Record<EMDRPhase, number>; // seconds per phase
  
  // Progress Metrics
  sudReduction: number; // Initial SUD - Final SUD
  vocImprovement: number; // Final VOC - Initial VOC
  emotionalStabilityGain: number; // 0-1 improvement
  
  // AI Interaction Metrics
  aiInteractions: {
    total: number;
    effectiveness: number; // 0-1 average effectiveness
    responseTime: number; // average AI response time
    interventionSuccess: number; // 0-1 intervention success rate
  };
  
  // Voice Interaction Metrics
  voiceInteractions: {
    total: number;
    averageDuration: number; // seconds
    audioQuality: number; // 0-1 average quality
    therapeuticImpact: number; // 0-1 average impact
  };
  
  // BLS Metrics
  blsMetrics: {
    totalTime: number; // seconds of BLS
    patternChanges: number;
    averageEffectiveness: number; // 0-1
    optimalConfiguration: BLSConfiguration;
  };
  
  // Emotion Analysis Metrics
  emotionMetrics: {
    samplesCollected: number;
    averageStability: number; // 0-1
    volatilityIndex: number; // 0-1
    processingDepth: number; // 0-1
  };
  
  // Crisis & Safety Metrics
  safetyMetrics: {
    crisisDetections: number;
    interventionsNeeded: number;
    safetyProtocolsActivated: number;
    earlyWarnings: number;
  };
}

// === Personalization Data ===

export interface SessionPersonalization {
  userId: string;
  
  // Learned Preferences
  preferences: {
    preferredBLSPatterns: string[];
    preferredAIVoice: string;
    preferredPace: 'slow' | 'moderate' | 'fast';
    preferredCommunicationStyle: 'formal' | 'casual' | 'supportive' | 'directive';
  };
  
  // Effective Configurations
  effectiveConfigs: {
    blsConfigurations: BLSConfiguration[];
    emotionThresholds: EmotionThresholds;
    aiGuidanceStyles: string[];
    voiceInteractionSettings: any;
  };
  
  // Learned Patterns
  learnedPatterns: {
    emotionalTriggers: string[];
    effectiveInterventions: string[];
    optimalSessionTiming: number; // minutes
    preferredPhaseTransitions: Record<EMDRPhase, EMDRPhase>;
  };
  
  // Historical Performance
  historicalData: {
    averageSessionDuration: number; // minutes
    typicalSUDReduction: number;
    averageVOCGain: number;
    successfulPatterns: string[];
    challengingAreas: string[];
  };
}

// === Crisis Event Records ===

export interface CrisisEventRecord {
  id: string;
  timestamp: number;
  phase: EMDRPhase;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  
  // Crisis Detection
  detection: CrisisDetection;
  
  // Context
  context: {
    emotionData: EmotionData;
    sud: number;
    sessionDuration: number;
    recentInterventions: string[];
  };
  
  // Response
  response: {
    protocol: string; // Crisis response protocol used
    interventions: string[]; // Interventions applied
    duration: number; // seconds to resolve
    resolved: boolean;
    followUpRequired: boolean;
  };
  
  // Outcome
  outcome: {
    emotionalStabilization: boolean;
    sessionContinuation: boolean;
    referralNeeded: boolean;
    lessonsLearned: string[];
  };
}

// === Session Conductor Configuration ===

export interface EMDRSessionConductorConfig {
  // AI Configuration
  ai: {
    model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-5'; // AI model to use
    maxTokens: number;
    temperature: number;
    systemPrompt: string;
    enableVoiceMode: boolean;
    voicePersonality: string;
  };
  
  // Emotion Analysis Configuration
  emotion: {
    samplingRate: number; // Hz, emotion sampling frequency
    smoothingWindow: number; // seconds for emotion smoothing
    thresholds: EmotionThresholds;
    enableMultimodal: boolean;
    prioritizeVoiceEmotions: boolean;
  };
  
  // BLS Configuration
  bls: {
    adaptiveMode: boolean;
    defaultConfiguration: BLSConfiguration;
    emergencyConfiguration: BLSConfiguration; // For crisis situations
    performanceOptimization: boolean;
  };
  
  // Voice Configuration
  voice: {
    enabled: boolean;
    provider: 'elevenlabs' | 'google-cloud' | 'azure';
    voiceId: string;
    enableEmotionalAdaptation: boolean;
    enableInterruption: boolean;
  };
  
  // Session Management
  session: {
    maxDurationMinutes: number;
    enableAutomaticPhaseTransition: boolean;
    requireUserConfirmation: boolean;
    enableEmergencyProtocols: boolean;
    autoSaveInterval: number; // seconds
  };
  
  // Safety & Crisis Management
  safety: {
    enableCrisisDetection: boolean;
    crisisThresholds: EmotionThresholds;
    emergencyContacts: string[];
    escalationProtocols: string[];
    enableSafetyMonitoring: boolean;
  };
  
  // Personalization
  personalization: {
    enableLearning: boolean;
    adaptationRate: number; // 0-1, how quickly to adapt
    enablePreferenceTracking: boolean;
    enableHistoryBasedOptimization: boolean;
  };
  
  // Data Management
  data: {
    enablePersistence: boolean;
    encryptionEnabled: boolean;
    backupInterval: number; // seconds
    dataRetention: number; // days
    enableAnalytics: boolean;
  };
}

// === Session Conductor Events ===

export interface EMDRSessionConductorEvents {
  // Session Lifecycle
  onSessionStart: (sessionData: EMDRSessionData) => void;
  onSessionEnd: (sessionData: EMDRSessionData, metrics: SessionMetrics) => void;
  onPhaseTransition: (fromPhase: EMDRPhase, toPhase: EMDRPhase, reason: string) => void;
  onSessionPause: (reason: string, resumable: boolean) => void;
  onSessionResume: () => void;
  
  // Progress Events
  onSUDChange: (oldSUD: number, newSUD: number, progress: number) => void;
  onVOCChange: (oldVOC: number, newVOC: number, progress: number) => void;
  onEmotionChange: (emotionData: EmotionData, analysis: any) => void;
  onBreakthrough: (phase: EMDRPhase, description: string, impact: number) => void;
  
  // AI Events
  onAIInteraction: (interaction: AIInteractionRecord) => void;
  onAIRecommendation: (recommendation: PersonalizedRecommendation) => void;
  onVoiceInteraction: (interaction: VoiceInteractionRecord) => void;
  
  // BLS Events
  onBLSConfigChange: (newConfig: BLSConfiguration, reason: string) => void;
  onBLSEffectivenessUpdate: (effectiveness: BLSEffectivenessRecord) => void;
  
  // Crisis & Safety Events
  onCrisisDetected: (crisis: CrisisEventRecord) => void;
  onCrisisResolved: (crisis: CrisisEventRecord) => void;
  onSafetyProtocolActivated: (protocol: string, severity: string) => void;
  onEmergencyStop: (reason: string) => void;
  
  // System Events
  onError: (error: string, severity: 'low' | 'medium' | 'high' | 'critical') => void;
  onConfigurationChange: (config: EMDRSessionConductorConfig) => void;
  onMetricsUpdate: (metrics: SessionMetrics) => void;
  onPersonalizationUpdate: (personalization: SessionPersonalization) => void;
}

// === Utility Types ===

export interface AdaptiveLogicRule {
  id: string;
  condition: EmotionCondition;
  action: AdaptiveAction;
  priority: number; // 1-10, higher priority rules execute first
  enabled: boolean;
}

export interface EmotionCondition {
  type: 'single' | 'combined' | 'pattern' | 'threshold';
  parameters: {
    emotion?: string; // Specific emotion name
    arousal?: { min?: number; max?: number };
    valence?: { min?: number; max?: number };
    stability?: { min?: number; max?: number };
    duration?: number; // Required duration in seconds
    pattern?: string; // Emotion pattern name
    threshold?: number; // Threshold value
  };
}

export interface AdaptiveAction {
  type: 'bls-adjustment' | 'intervention' | 'phase-control' | 'ai-guidance' | 'emergency';
  parameters: {
    // BLS Adjustments
    blsConfig?: Partial<BLSConfiguration>;
    
    // Interventions
    intervention?: 'grounding' | 'breathing' | 'safe-place' | 'resource' | 'pause';
    interventionDuration?: number; // seconds
    
    // Phase Control
    phaseAction?: 'continue' | 'pause' | 'retreat' | 'advance' | 'skip';
    
    // AI Guidance
    aiPrompt?: string;
    urgencyLevel?: 'low' | 'medium' | 'high' | 'critical';
    
    // Emergency Actions
    emergencyProtocol?: string;
    escalationLevel?: number; // 1-5
  };
}

export type SessionAlgorithmStatus = {
  currentStep: string;
  progress: number; // 0-1
  estimatedTimeRemaining: number; // minutes
  nextMilestone: string;
  completionCriteria: string[];
  currentlyWaitingFor: string | null;
};