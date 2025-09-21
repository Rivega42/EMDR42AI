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

// === Revolutionary 3D BLS Configuration ===

// 3D Movement Patterns - Enhanced for therapeutic effectiveness
export type BLSPattern = 
  // 2D Patterns (legacy compatibility + fallback)
  | 'horizontal' | 'vertical' | 'diagonal' | 'circle' | '3d-wave'
  // Revolutionary 3D Patterns
  | 'cube3d'        // Movement along cube edges for spatial awareness
  | 'spiral3d'      // 3D spiral for deep processing
  | 'helix3d'       // Helical movement for bilateral integration
  | 'lemniscate3d'  // 3D figure-8 for memory consolidation  
  | 'lissajous3d'   // Complex Lissajous curves for attention
  | 'sphere3d'      // Spherical movement for grounding
  | 'infinity3d'    // 3D infinity symbol for flow states
  | 'wave3d'        // Ocean wave motion for calming
  | 'butterfly3d'   // Butterfly pattern for transformation
  | 'DNA3d';        // DNA helix for healing visualization

// Advanced Audio Configuration
export interface BLSAudioConfig {
  enabled: boolean;
  // Audio Types - Revolutionary therapeutic sounds
  audioType: 'binaural-beats' | 'white-noise' | 'nature-sounds' | 'sacred-geometry' | 'singing-bowls' | 'simple-tone';
  // Binaural Beats Settings
  binauralFrequency: number; // Hz for brainwave entrainment (0.5-40Hz)
  binauralType: 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma'; // Brainwave states
  // Spatial Audio
  spatialAudio: boolean; // 3D positional audio following movement
  panIntensity: number; // 0-1 stereo panning intensity
  // Volume and Effects
  volume: number; // 0-1 master volume
  reverbEnabled: boolean; // Add spatial reverb
  filterEnabled: boolean; // Dynamic frequency filtering
}

// Haptic Feedback Configuration  
export interface BLSHapticsConfig {
  enabled: boolean;
  // Vibration Patterns
  pattern: 'pulse' | 'wave' | 'heartbeat' | 'breathing' | 'custom';
  intensity: number; // 0-1 vibration intensity
  // Synchronization
  syncWithMovement: boolean; // Sync vibration with ball position
  syncWithAudio: boolean; // Sync with audio beats
  // Timing
  duration: number; // ms per vibration
  interval: number; // ms between vibrations
  // Advanced Patterns
  customPattern?: number[]; // Custom vibration pattern array
}

// 3D Rendering Configuration
export interface BLS3DConfig {
  enabled: boolean; // Enable 3D rendering (fallback to 2D if false)
  // Rendering Quality
  antialias: boolean;
  shadows: boolean; 
  lighting: 'basic' | 'ambient' | 'dramatic' | 'therapeutic';
  // Camera Settings
  cameraType: 'perspective' | 'orthographic';
  fieldOfView: number; // degrees for perspective camera
  cameraDistance: number; // Distance from scene center
  // Post-Processing Effects
  bloomEffect: boolean; // Glow effect for therapeutic ambiance
  blurBackground: boolean; // Focus attention on stimulus
  particleEffects: boolean; // Trailing particles for visual appeal
}

// Device Capability Detection
export interface DeviceCapabilities {
  webgl: boolean; // WebGL support for 3D
  webgl2: boolean; // WebGL2 for advanced effects
  vibration: boolean; // Haptic feedback support
  webaudio: boolean; // Advanced audio support
  fullscreen: boolean; // Fullscreen API support
  performance: 'low' | 'medium' | 'high'; // Device performance tier
  maxTextureSize: number; // Graphics capability
  audioContext: boolean; // Web Audio API support
}

// Transition Configuration for Smooth Pattern Changes
export interface BLSTransitionConfig {
  enabled: boolean;
  duration: number; // ms for transition
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'therapeutic';
  morphing: boolean; // Morphing between patterns vs instant switch
  crossfade: boolean; // Audio crossfading during transitions
}

// Main BLS Configuration - Revolutionary 3D System
export interface BLSConfiguration {
  // Core Settings
  speed: number; // 1-10 speed scale
  pattern: BLSPattern;
  color: string; // Primary color (hex)
  secondaryColor?: string; // Secondary color for gradients
  size: number; // Size in pixels/units
  
  // Revolutionary Systems
  audio: BLSAudioConfig;
  haptics: BLSHapticsConfig;
  rendering3D: BLS3DConfig;
  transitions: BLSTransitionConfig;
  
  // Adaptive Intelligence
  adaptiveMode: boolean; // AI-driven adaptation
  emotionMapping: boolean; // Map emotions to settings
  hysteresisEnabled: boolean; // Prevent oscillations
  
  // Therapeutic Settings  
  therapeuticMode: 'standard' | 'trauma-sensitive' | 'anxiety-focused' | 'depression-focused';
  sessionPhase: EMDRPhase; // Current EMDR phase for context
  
  // Legacy Compatibility
  soundEnabled: boolean; // Backward compatibility
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