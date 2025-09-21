/**
 * Shared TypeScript interfaces for EMDR42 platform
 */

// Import database types from schema
import type {
  Session,
  User,
  SessionMemorySnapshot,
  ProgressMetric,
  SessionComparison,
  BreakthroughMoment,
  MemoryInsight,
  EmotionalPatternAnalysis,
  InsertSessionMemorySnapshot,
  InsertProgressMetric,
  InsertSessionComparison,
  InsertBreakthroughMoment,
  InsertMemoryInsight,
  InsertEmotionalPatternAnalysis
} from './schema';

// Type aliases for compatibility
export type EmotionalPattern = EmotionalPatternAnalysis;

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

// === Revolutionary Voice & Multimodal Emotion Analysis ===

// Voice Emotion Data from speech analysis
export interface VoiceEmotionData {
  timestamp: number;
  // Speech Prosody - 48 dimensions from Hume AI / AssemblyAI
  prosody: {
    arousal: number; // -1 to 1, arousal from vocal tone
    valence: number; // -1 to 1, emotional valence from voice
    intensity: number; // 0-1, emotional intensity
    pace: number; // 0-1, speech pace (slow to fast)
    volume: number; // 0-1, relative volume level
    pitch: number; // 0-1, relative pitch level
    stability: number; // 0-1, voice stability/tremor
  };
  // Voice-specific emotions
  voiceEmotions: {
    confidence: number; // 0-1, confidence in voice detection
    excitement: number; // 0-1, excitement level
    stress: number; // 0-1, stress indicators
    fatigue: number; // 0-1, fatigue level
    engagement: number; // 0-1, vocal engagement
    uncertainty: number; // 0-1, hesitation patterns
    authenticity: number; // 0-1, emotional authenticity
  };
  // Provider-specific data
  provider: 'assemblyai' | 'hume-ai' | 'azure' | 'google-cloud' | 'mock';
  confidence: number; // 0-1, overall confidence in analysis
  rawData?: any; // Raw provider response for debugging
}

// Enhanced Emotion Data with multimodal support
export interface EmotionData {
  timestamp: number;
  arousal: number; // -1 to 1, combined arousal (face + voice)
  valence: number; // -1 to 1, combined valence (face + voice)
  affects: Record<string, number>; // 98 affects from affect theory
  basicEmotions: Record<string, number>; // Basic emotions (happy, sad, angry, etc.)
  
  // === MULTIMODAL REVOLUTION ===
  sources: {
    face: FaceEmotionData | null;
    voice: VoiceEmotionData | null;
    combined: boolean; // true if both sources available
  };
  
  // Fusion metrics
  fusion: {
    confidence: number; // 0-1, confidence in combined result
    agreement: number; // 0-1, how much face and voice agree
    dominantSource: 'face' | 'voice' | 'balanced'; // Which source is more reliable
    conflictResolution: string; // How conflicts were resolved
  };
  
  // Quality indicators
  quality: {
    faceQuality: number; // 0-1, face detection quality
    voiceQuality: number; // 0-1, voice analysis quality
    environmentalNoise: number; // 0-1, background noise level
    overallQuality: number; // 0-1, combined quality score
  };
}

// Face Emotion Data (extracted from existing FaceRecognition)
export interface FaceEmotionData {
  timestamp: number;
  // Face-specific emotions from face-api.js
  faceEmotions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  // Face-derived arousal/valence
  arousal: number; // -1 to 1
  valence: number; // -1 to 1
  confidence: number; // 0-1, face detection confidence
  landmarks?: any; // Facial landmarks data
}

// Voice Provider Configuration
export interface VoiceProviderConfig {
  provider: 'assemblyai' | 'hume-ai' | 'azure' | 'google-cloud';
  apiKey: string;
  endpoint?: string;
  // Provider-specific settings
  settings: {
    // AssemblyAI settings
    assemblyai?: {
      sentiment: boolean;
      emotionDetection: boolean;
      realtime: boolean;
      language?: string;
    };
    // Hume AI settings  
    humeai?: {
      models: string[]; // ['prosody', 'vocal_burst', 'language']
      granularity: 'utterance' | 'word' | 'segment';
      emotionDimensions: number; // 48 for voice
    };
    // Azure settings
    azure?: {
      speechService: string;
      languageService: string;
      region: string;
    };
    // Google Cloud settings
    googlecloud?: {
      speechProject: string;
      languageProject: string;
      region: string;
    };
  };
}

// Voice Analysis Status
export interface VoiceAnalysisStatus {
  isRecording: boolean;
  isProcessing: boolean;
  isConnected: boolean;
  provider: string;
  latency: number; // ms, current processing latency
  error?: string;
  lastUpdate: number;
  streamHealth: {
    packetsReceived: number;
    packetsLost: number;
    bitrate: number;
    jitter: number;
  };
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

// === DEFAULT CONFIG FACTORIES ===
// These factory functions create complete BLS config objects with sensible defaults
// Used to prevent TypeScript errors when creating partial configurations

/**
 * Creates a complete BLSAudioConfig with sensible defaults
 */
export function createDefaultBLSAudioConfig(overrides: Partial<BLSAudioConfig> = {}): BLSAudioConfig {
  return {
    enabled: false,
    audioType: 'binaural-beats',
    binauralFrequency: 10, // Alpha waves
    binauralType: 'alpha',
    spatialAudio: false,
    panIntensity: 0.5,
    volume: 0.5,
    reverbEnabled: false,
    filterEnabled: false,
    ...overrides
  };
}

/**
 * Creates a complete BLSHapticsConfig with sensible defaults
 */
export function createDefaultBLSHapticsConfig(overrides: Partial<BLSHapticsConfig> = {}): BLSHapticsConfig {
  return {
    enabled: false,
    pattern: 'pulse',
    intensity: 0.5,
    syncWithMovement: false,
    syncWithAudio: false,
    duration: 100,
    interval: 500,
    ...overrides
  };
}

/**
 * Creates a complete BLS3DConfig with sensible defaults
 */
export function createDefaultBLS3DConfig(overrides: Partial<BLS3DConfig> = {}): BLS3DConfig {
  return {
    enabled: false,
    antialias: true,
    shadows: false,
    lighting: 'basic',
    cameraType: 'perspective',
    fieldOfView: 75,
    cameraDistance: 10,
    bloomEffect: false,
    blurBackground: false,
    particleEffects: false,
    ...overrides
  };
}

/**
 * Creates a complete BLSTransitionConfig with sensible defaults
 */
export function createDefaultBLSTransitionConfig(overrides: Partial<BLSTransitionConfig> = {}): BLSTransitionConfig {
  return {
    enabled: true,
    duration: 500,
    easing: 'ease-in-out',
    morphing: false,
    crossfade: false,
    ...overrides
  };
}

/**
 * Creates a complete BLSConfiguration with sensible defaults
 */
export function createDefaultBLSConfiguration(overrides: Partial<BLSConfiguration> = {}): BLSConfiguration {
  return {
    speed: 5,
    pattern: 'horizontal',
    color: '#3b82f6',
    size: 20,
    audio: createDefaultBLSAudioConfig(),
    haptics: createDefaultBLSHapticsConfig(),
    rendering3D: createDefaultBLS3DConfig(),
    transitions: createDefaultBLSTransitionConfig(),
    adaptiveMode: false,
    emotionMapping: false,
    hysteresisEnabled: true,
    therapeuticMode: 'standard',
    sessionPhase: 'preparation',
    soundEnabled: false,
    ...overrides
  };
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

// Enhanced Emotion Capture with multimodal support
export interface EmotionCapture {
  id: string;
  sessionId: string;
  patientId: string;
  timestamp: number;
  source: 'face' | 'voice' | 'multimodal' | 'fused'; // Updated for multimodal
  emotionData: EmotionData;
  blsConfig?: BLSConfiguration;
  phaseContext?: EMDRPhase;
  
  // === MULTIMODAL ENHANCEMENTS ===
  multimodalMetrics: {
    fusionQuality: number; // 0-1, quality of face+voice fusion
    modalityAgreement: number; // 0-1, how much modalities agree
    preferredModality: 'face' | 'voice' | 'balanced';
    processingLatency: number; // ms, total processing time
    confidenceThreshold: number; // 0-1, minimum confidence used
  };
  
  // Raw modality data for research/debugging
  rawData?: {
    faceRaw?: any;
    voiceRaw?: any;
    fusionLog?: string[];
  };
}

// Voice Recording Configuration
export interface VoiceRecordingConfig {
  enabled: boolean;
  provider: VoiceProviderConfig;
  
  // Audio capture settings
  audioConstraints: {
    sampleRate: number; // 16000 Hz recommended
    channels: number; // 1 for mono, 2 for stereo
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
  };
  
  // Processing settings
  processing: {
    realtime: boolean; // Real-time vs batch processing
    chunkDuration: number; // ms, audio chunk size
    overlap: number; // ms, overlap between chunks
    minConfidence: number; // 0-1, minimum confidence threshold
    smoothingWindow: number; // Number of samples for smoothing
  };
  
  // Privacy settings
  privacy: {
    storeAudio: boolean; // Store raw audio files
    encryptAudio: boolean; // Encrypt stored audio
    autoDelete: number; // Hours after which to delete audio
    consentVerified: boolean; // User consent for voice recording
  };
}

// Multimodal Fusion Configuration
export interface EmotionFusionConfig {
  enabled: boolean;
  
  // Fusion strategy
  strategy: 'weighted-average' | 'confidence-based' | 'mutual-information' | 'ai-learned';
  
  // Weighting preferences
  weights: {
    faceWeight: number; // 0-1, weight for face emotions
    voiceWeight: number; // 0-1, weight for voice emotions
    adaptiveWeighting: boolean; // Adjust weights based on quality
  };
  
  // Conflict resolution
  conflictResolution: {
    strategy: 'average' | 'highest-confidence' | 'contextual' | 'ai-mediated';
    disagreementThreshold: number; // 0-1, when modalities are considered in conflict
    fallbackToSingle: boolean; // Use single modality if fusion fails
  };
  
  // Quality requirements
  qualityGates: {
    minFaceConfidence: number; // 0-1
    minVoiceConfidence: number; // 0-1
    minOverallQuality: number; // 0-1
    requireBothModalities: boolean; // Require both face and voice
  };
  
  // Temporal synchronization
  synchronization: {
    maxTimeDrift: number; // ms, max acceptable time difference
    interpolationMethod: 'linear' | 'cubic' | 'nearest';
    bufferSize: number; // Number of samples to buffer for sync
  };
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

// Enhanced AI Therapist Response with Memory Integration
export interface EnhancedAITherapistResponse extends AITherapistResponse {
  chatMessage?: AITherapistMessage;
  sessionGuidance?: AISessionGuidance;
  emotionResponse?: AIEmotionResponse;
  crisisDetection?: CrisisDetection;
  personalizedRecommendations: PersonalizedRecommendation[];
  memoryBasedRecommendations?: MemoryBasedRecommendation[];
  nextPhaseReadiness: {
    isReady: boolean;
    confidence: number;
    reasoning: string;
  };
  memoryInsights?: {
    patterns: EmotionalPattern[];
    breakthroughs: BreakthroughMoment[];
    riskFactors: string[];
    historicalContext: string[];
  };
  progressUpdate?: {
    metrics: Partial<ProgressMetric>;
    improvementAreas: string[];
    concernAreas: string[];
    predictions: string[];
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

// === IMPORTANT: Using shared/schema.ts as SINGLE SOURCE OF TRUTH ===
// All database-related types are now imported from shared/schema.ts
// This fixes the critical TYPE/MODEL DIVERGENCE issue

// Progress Metrics Helper Types (for complex calculations)
export interface ProgressMetricData {
  initial: number;
  final: number;
  change: number;
  trend: number; // -1 to 1, negative = worsening, positive = improving
  variance: number;
  stability: number;
}

// === TYPES NOW IMPORTED AT TOP OF FILE ===
// All database-related types are imported at the top to fix TYPE/MODEL DIVERGENCE
// Re-export for backwards compatibility
export type { 
  SessionMemorySnapshot, 
  ProgressMetric, 
  SessionComparison, 
  BreakthroughMoment, 
  MemoryInsight, 
  Session,
  User,
  // Insert types
  InsertSessionMemorySnapshot,
  InsertProgressMetric,
  InsertSessionComparison,
  InsertBreakthroughMoment,
  InsertMemoryInsight,
  InsertEmotionalPatternAnalysis
};

// === SESSION MEMORY SERVICE TYPES ===

// Session Memory Configuration
export interface SessionMemoryConfig {
  enableAutoSnapshots: boolean;
  snapshotFrequency: number; // seconds
  enableBreakthroughDetection: boolean;
  enablePatternRecognition: boolean;
  enablePredictiveAnalytics: boolean;
  retentionPeriod: number; // days
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

// Progress Analytics Configuration
export interface ProgressAnalyticsConfig {
  calculateRealtime: boolean;
  aggregationIntervals: ('session' | 'daily' | 'weekly' | 'monthly')[];
  enableTrendAnalysis: boolean;
  enableAnomalyDetection: boolean;
  confidenceThreshold: number;
  enablePredictions: boolean;
  predictionHorizon: number; // days
  enableInsightGeneration: boolean;
}

// Session Memory API Request/Response Types
export interface SaveSessionMemoryRequest {
  sessionId: string;
  patientId: string;
  snapshotType: string;
  emotionalSnapshot: EmotionData;
  phaseContext: EMDRPhase;
  metadata?: {
    sudsLevel?: number;
    vocLevel?: number;
    blsConfig?: any;
    triggerEvents?: string[];
    interventions?: string[];
  };
}

export interface SessionHistoryRequest {
  patientId: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  sessionIds?: string[];
  includeSnapshots?: boolean;
  includeMetrics?: boolean;
  includeComparisons?: boolean;
  includeInsights?: boolean;
}

export interface SessionHistoryResponse {
  sessions: Session[];
  snapshots?: SessionMemorySnapshot[];
  metrics?: ProgressMetric[];
  comparisons?: SessionComparison[];
  insights?: MemoryInsight[];
  patterns?: EmotionalPattern[];
  breakthroughs?: BreakthroughMoment[];
  totalSessions: number;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface CompareSessionsRequest {
  patientId: string;
  baselineSessionId: string;
  compareSessionId: string;
  comparisonType?: string;
  includeAIAnalysis?: boolean;
}

export interface CompareSessionsResponse {
  comparison: SessionComparison;
  recommendations: PersonalizedRecommendation[];
  insights: MemoryInsight[];
  trends: {
    shortTerm: string[];
    longTerm: string[];
  };
}

export interface GenerateProgressReportRequest {
  patientId: string;
  timeScope: 'session' | 'week' | 'month' | 'quarter' | 'all';
  includeVisualizations?: boolean;
  includeRecommendations?: boolean;
  includeRiskAssessment?: boolean;
}

export interface ProgressReportResponse {
  metrics: ProgressMetric;
  visualizations?: {
    charts: any[];
    heatmaps: any[];
    timelines: any[];
  };
  insights: MemoryInsight[];
  recommendations: PersonalizedRecommendation[];
  riskAssessment?: {
    regressionRisk: number;
    crisisRisk: number;
    dropoutRisk: number;
    factors: string[];
  };
  summary: {
    overallProgress: number;
    keyAchievements: string[];
    concernAreas: string[];
    nextSteps: string[];
  };
}

// === LIVE MEMORY INTEGRATION TYPES ===

// For real-time memory updates during sessions
export interface LiveMemoryUpdate {
  sessionId: string;
  patientId: string;
  timestamp: Date;
  updateType: 'emotion_change' | 'breakthrough_detected' | 'pattern_matched' | 'risk_alert';
  data: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresAction: boolean;
  aiRecommendations?: string[];
}

// Memory-enhanced AI context
export interface MemoryEnhancedAIContext extends AIChatContext {
  historicalPatterns: EmotionalPattern[];
  recentBreakthroughs: BreakthroughMoment[];
  progressTrends: ProgressMetric;
  riskFactors: string[];
  effectiveInterventions: Record<string, number>;
  memoryInsights: MemoryInsight[];
}

// Enhanced therapy recommendations with memory context
export interface MemoryBasedRecommendation extends PersonalizedRecommendation {
  basedOnPattern?: string;
  historicalEffectiveness?: number;
  previouslySuccessful?: boolean;
  adaptedFromSession?: string;
  memoryContext: {
    similarSituations: string[];
    effectiveInterventions: string[];
    patientPreferences: string[];
  };
}