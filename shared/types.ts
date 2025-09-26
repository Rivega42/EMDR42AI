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

// === AudioStreamMultiplexer Configuration & Interfaces ===

export interface AudioConsumer {
  id: string;
  name: string;
  type: 'emotion-analysis' | 'voice-chat' | 'recording' | 'other';
  priority: number; // 1-10, higher priority gets better audio quality
  active: boolean;
  
  // Audio processing configuration
  config: {
    sampleRate?: number; // Default: 16000 Hz
    channels?: number; // Default: 1 (mono)
    bufferSize?: number; // Default: 4096
    enableEchoCancellation?: boolean; // Default: true
    enableNoiseSuppression?: boolean; // Default: true
    enableAutoGainControl?: boolean; // Default: true
  };
  
  // Callback for receiving audio data
  onAudioData?: (audioData: Float32Array, sampleRate: number) => void;
  onAudioChunk?: (audioChunk: Blob) => void;
  onStatusChange?: (status: AudioConsumerStatus) => void;
  onError?: (error: string) => void;
}

export interface AudioConsumerStatus {
  consumerId: string;
  isActive: boolean;
  isReceivingAudio: boolean;
  sampleRate: number;
  channels: number;
  latency: number; // milliseconds
  quality: number; // 0-1, audio quality score
  packetsReceived: number;
  packetsLost: number;
  lastUpdate: number;
  error?: string;
}

export interface AudioStreamMultiplexerConfig {
  // Master audio configuration
  masterAudio: {
    sampleRate: number; // 16000, 22050, 44100, 48000
    channels: number; // 1 for mono, 2 for stereo
    bufferSize: number; // 1024, 2048, 4096, 8192
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
  };
  
  // Consumer management
  consumers: {
    maxConsumers: number; // Default: 5
    priorityScheduling: boolean; // Higher priority consumers get better resources
    adaptiveQuality: boolean; // Adjust quality based on system load
  };
  
  // Performance optimization
  performance: {
    enableWebWorker: boolean; // Process audio in worker thread
    enableVAD: boolean; // Voice Activity Detection to reduce processing
    vadThreshold: number; // 0-1, voice detection threshold
    maxLatency: number; // Maximum acceptable latency in ms
    dropFramesOnOverload: boolean; // Drop frames when system overloaded
  };
  
  // Error handling and fallback
  fallback: {
    enableFallback: boolean;
    fallbackSampleRate: number; // Lower quality fallback
    maxRetries: number;
    retryDelay: number; // milliseconds
  };
}

export interface AudioStreamMultiplexerStatus {
  isInitialized: boolean;
  isStreaming: boolean;
  masterStream: {
    sampleRate: number;
    channels: number;
    quality: number; // 0-1
    latency: number; // milliseconds
  };
  
  consumers: AudioConsumerStatus[];
  activeConsumers: number;
  
  performance: {
    cpuUsage: number; // 0-100
    memoryUsage: number; // MB
    audioDrops: number;
    totalProcessed: number; // Total audio frames processed
    averageLatency: number;
  };
  
  health: {
    isHealthy: boolean;
    issues: string[];
    lastCheck: number;
  };
}

export interface AudioStreamMultiplexerMetrics {
  uptime: number; // seconds
  totalConsumers: number;
  totalAudioFrames: number;
  droppedFrames: number;
  averageLatency: number;
  peakLatency: number;
  errorCount: number;
  consumerSwitches: number;
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

// === Speech-to-Text (STT) Configuration & Interfaces ===

// STT Provider Types
export type STTProvider = 'openai-whisper' | 'assemblyai' | 'web-speech-api' | 'azure' | 'google-cloud';

// STT Language Support
export type STTLanguage = 'en' | 'ru' | 'auto' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko';

// STT Processing Mode
export type STTProcessingMode = 'streaming' | 'batch' | 'hybrid';

// STT Transcription Result
export interface STTTranscriptionResult {
  id: string; // Unique identifier for this transcription
  timestamp: number; // When transcription was generated
  text: string; // Transcribed text
  language: STTLanguage; // Detected/specified language
  confidence: number; // 0-1, confidence in transcription accuracy
  isFinal: boolean; // true for final results, false for interim
  
  // Advanced Features
  words?: STTWordResult[]; // Word-level timing and confidence
  segments?: STTSegmentResult[]; // Sentence/phrase segments
  
  // Provider-specific data
  provider: STTProvider;
  providerData?: any; // Raw provider response for debugging
  
  // Audio quality metrics
  audioQuality: {
    snr: number; // Signal-to-noise ratio
    clarity: number; // 0-1, audio clarity score
    duration: number; // Audio duration in seconds
  };
  
  // Processing metrics
  processing: {
    latency: number; // Time from audio to result (ms)
    processingTime: number; // Actual processing time (ms)
    queueTime: number; // Time spent in queue (ms)
  };
}

// Word-level transcription result
export interface STTWordResult {
  word: string;
  startTime: number; // Start time in seconds
  endTime: number; // End time in seconds
  confidence: number; // 0-1, confidence for this word
  speaker?: string; // Speaker identification (if available)
}

// Segment-level transcription result (sentences/phrases)
export interface STTSegmentResult {
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  type: 'sentence' | 'phrase' | 'clause';
  punctuation: boolean; // Whether punctuation was added
}

// STT Service Configuration
export interface STTServiceConfig {
  // Provider Configuration
  providers: {
    primary: STTProvider;
    fallback: STTProvider[];
    enableFailover: boolean;
    failoverThreshold: number; // Error threshold before switching providers
  };
  
  // Processing Configuration
  processing: {
    mode: STTProcessingMode;
    realTimeEnabled: boolean;
    batchSizeMs: number; // Batch size in milliseconds
    bufferSizeMs: number; // Audio buffer size
    minSilenceDuration: number; // Minimum silence to trigger batch processing
  };
  
  // Language Configuration
  language: {
    primary: STTLanguage;
    autoDetect: boolean;
    supportedLanguages: STTLanguage[];
    enableTranslation: boolean; // Translate to primary language
  };
  
  // Quality Configuration
  quality: {
    enableVAD: boolean; // Voice Activity Detection
    vadThreshold: number; // 0-1, voice detection sensitivity
    enableNoiseSuppression: boolean;
    enablePunctuation: boolean;
    enableCapitalization: boolean;
    enableProfanityFilter: boolean;
  };
  
  // Performance Configuration
  performance: {
    maxConcurrentRequests: number;
    requestTimeout: number; // ms
    retryCount: number;
    retryDelay: number; // ms
    cachingEnabled: boolean;
    cacheExpiryMs: number;
  };
}

// STT Service Status
export interface STTServiceStatus {
  isInitialized: boolean;
  isListening: boolean;
  isProcessing: boolean;
  currentProvider: STTProvider;
  
  // Connection Status
  connection: {
    isConnected: boolean;
    latency: number; // ms
    error?: string;
    lastSuccessfulRequest: number; // timestamp
  };
  
  // Processing Status
  processing: {
    queueSize: number; // Number of audio chunks in queue
    averageLatency: number; // ms
    successRate: number; // 0-1, success rate over last 100 requests
    totalProcessed: number; // Total transcriptions processed
  };
  
  // Provider Status
  providers: Record<STTProvider, {
    available: boolean;
    latency: number;
    errorRate: number;
    lastUsed: number;
  }>;
  
  // Audio Status
  audio: {
    isReceiving: boolean;
    sampleRate: number;
    channels: number;
    quality: number; // 0-1
    vadState: boolean; // Voice activity detected
  };
}

// STT Provider Interface
export interface STTProviderConfig {
  provider: STTProvider;
  apiKey?: string;
  endpoint?: string;
  region?: string;
  
  // Provider-specific settings
  settings: {
    // OpenAI Whisper settings
    whisper?: {
      model: 'whisper-1' | 'whisper-large-v2' | 'whisper-large-v3';
      temperature: number; // 0-1, randomness in output
      language?: STTLanguage;
      prompt?: string; // Optional context prompt
      responseFormat: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    };
    
    // AssemblyAI settings
    assemblyai?: {
      model: 'best' | 'nano';
      language: STTLanguage;
      punctuation: boolean;
      formatText: boolean;
      dualChannel: boolean;
      speakerLabels: boolean;
      contentSafety: boolean;
      customVocabulary: string[];
    };
    
    // Web Speech API settings
    webspeech?: {
      continuous: boolean;
      interimResults: boolean;
      maxAlternatives: number;
      serviceURI?: string;
      grammars?: string[];
    };
    
    // Azure Speech settings
    azure?: {
      subscriptionKey: string;
      serviceRegion: string;
      language: STTLanguage;
      outputFormat: 'simple' | 'detailed';
      profanityOption: 'masked' | 'removed' | 'raw';
      enableDictation: boolean;
    };
    
    // Google Cloud Speech settings
    googlecloud?: {
      projectId: string;
      keyFilename?: string;
      language: STTLanguage;
      model: 'latest_long' | 'latest_short' | 'command_and_search';
      useEnhanced: boolean;
      enablePunctuation: boolean;
      enableWordTimeOffsets: boolean;
    };
  };
}

// STT Event Types
export interface STTEvents {
  onTranscription: (result: STTTranscriptionResult) => void;
  onInterimResult: (text: string, confidence: number) => void;
  onStatusChange: (status: STTServiceStatus) => void;
  onError: (error: STTError) => void;
  onProviderChange: (newProvider: STTProvider, reason: string) => void;
  onVoiceActivity: (isActive: boolean, confidence: number) => void;
}

// STT Error Interface
export interface STTError {
  code: string;
  message: string;
  provider: STTProvider;
  timestamp: number;
  retryable: boolean;
  details?: any;
}

// STT Consumer Configuration for AudioStreamMultiplexer
export interface STTAudioConsumerConfig {
  id: string;
  priority: number; // 9 - higher than emotion analysis (7)
  sampleRate: number; // 16000 Hz recommended for STT
  channels: number; // 1 (mono)
  bufferSize: number; // 4096 recommended
  
  // STT-specific audio processing
  processingConfig: {
    enableVAD: boolean;
    vadThreshold: number; // 0-1
    enableNoiseSuppression: boolean;
    enableEchoCancellation: boolean;
    enableAutoGainControl: boolean;
    preProcessingFilters: string[]; // Custom audio filters
  };
}

// STT Analytics Interface
export interface STTAnalytics {
  sessionId: string;
  totalTranscriptions: number;
  totalAudioDuration: number; // seconds
  averageLatency: number; // ms
  accuracyScore: number; // 0-1, estimated accuracy
  languageDistribution: Record<STTLanguage, number>; // percentage per language
  providerUsage: Record<STTProvider, number>; // usage statistics
  errorRate: number; // 0-1
  voiceActivityRatio: number; // 0-1, percentage of time with voice activity
  
  // Performance metrics
  performance: {
    averageProcessingTime: number; // ms
    maxProcessingTime: number; // ms
    minProcessingTime: number; // ms
    timeouts: number;
    retries: number;
    failovers: number;
  };
  
  // Quality metrics
  quality: {
    averageConfidence: number; // 0-1
    averageSnr: number; // Signal-to-noise ratio
    averageAudioQuality: number; // 0-1
  };
}

// Voice Activity Detection (VAD) Interface
export interface VADResult {
  timestamp: number;
  isVoiceActive: boolean;
  confidence: number; // 0-1, confidence in voice detection
  energy: number; // Audio energy level
  spectralFeatures: {
    zeroCrossingRate: number;
    spectralCentroid: number;
    spectralRolloff: number;
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
  crisisDetection?: CrisisDetection;
  metadata?: {
    reasoning?: string;
    suggestedActions?: string[];
    criticalityLevel?: 'low' | 'medium' | 'high' | 'crisis';
    voiceContext?: {
      prosody: {
        arousal: number;
        valence: number;
        intensity: number;
        pace: number;
        volume: number;
        pitch: number;
        stability: number;
      };
      emotions: {
        confidence: number;
        excitement: number;
        stress: number;
        fatigue: number;
        engagement: number;
        uncertainty: number;
        authenticity: number;
      };
      confidence: number;
      recommendedVoiceStyle?: string;
    };
    therapeuticVoiceGuidance?: {
      warmth: number;
      pace: 'slow' | 'normal' | 'fast';
      empathy: number;
    };
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

// === TEXT-TO-SPEECH (TTS) SYSTEM ===

// TTS Provider Types
export type TTSProvider = 'google-cloud' | 'web-speech' | 'azure' | 'aws-polly' | 'elevenlabs';

// Voice Selection Configuration
export interface TTSVoiceConfig {
  name: string; // Voice name (e.g., 'en-US-Wavenet-D')
  language: string; // Language code (e.g., 'en-US', 'es-ES')
  gender: 'male' | 'female' | 'neutral';
  age: 'child' | 'young-adult' | 'adult' | 'elderly';
  accent: string; // Regional accent (e.g., 'american', 'british', 'australian')
  characteristics: {
    warmth: number; // 0-1, how warm/friendly the voice sounds
    authority: number; // 0-1, how authoritative the voice sounds
    empathy: number; // 0-1, therapeutic empathy level
    clarity: number; // 0-1, pronunciation clarity
    pace: 'slow' | 'normal' | 'fast'; // Natural speaking pace
    calmness: number; // 0-1, how calming the voice sounds
  };
  therapeuticProfile: {
    anxietyFriendly: boolean; // Good for anxious patients
    traumaSensitive: boolean; // Appropriate for trauma work
    childFriendly: boolean; // Suitable for child therapy
    culturallySensitive: string[]; // Cultural considerations
  };
}

// Audio Quality Settings
export interface TTSAudioQuality {
  sampleRate: 16000 | 22050 | 24000 | 44100 | 48000; // Hz
  bitRate: 64 | 128 | 192 | 256 | 320; // kbps
  format: 'mp3' | 'wav' | 'ogg' | 'aac' | 'webm'; // Audio format
  channels: 1 | 2; // Mono or stereo
  compression: 'none' | 'low' | 'medium' | 'high'; // Compression level
}

// TTS Request Configuration
export interface TTSSynthesisRequest {
  text: string;
  voice: TTSVoiceConfig;
  quality?: TTSAudioQuality | string; // Allow string for backward compatibility
  options: {
    ssmlEnabled: boolean; // Enable SSML markup support
    speed: number; // 0.25-4.0, speech speed multiplier
    pitch: number; // -20-20, pitch adjustment in semitones
    volume: number; // 0-1, volume level
    emphasis: 'none' | 'reduced' | 'moderate' | 'strong'; // Speech emphasis
    breaks: {
      sentence: number; // ms pause between sentences
      paragraph: number; // ms pause between paragraphs
      comma: number; // ms pause at commas
    };
    format?: string; // Audio format (wav, mp3, etc.)
  };
  metadata: {
    sessionId?: string;
    patientId?: string;
    context: 'therapy-response' | 'guidance' | 'emergency' | 'meditation' | 'instruction' | 'preview';
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    cacheKey?: string; // For caching identical requests
    timestamp?: number;
  };
}

// TTS Response Data
export interface TTSSynthesisResponse {
  audioData: ArrayBuffer | Blob | string; // Audio data (binary or base64)
  format: string; // Actual audio format returned
  duration: number; // Audio duration in seconds
  size: number; // File size in bytes
  metadata: {
    provider: TTSProvider;
    voice: TTSVoiceConfig;
    quality: TTSAudioQuality;
    synthesisTime: number; // Time taken to synthesize (ms)
    fromCache: boolean; // Whether served from cache
    cacheKey: string; // Cache identifier
  };
  streaming?: {
    isStreamable: boolean; // Whether audio supports streaming
    chunkSize?: number; // Streaming chunk size
    chunks?: ArrayBuffer[]; // Audio chunks for streaming
  };
}

// TTS Service Status
export interface TTSServiceStatus {
  isInitialized: boolean;
  currentProvider: TTSProvider;
  fallbackProvider?: TTSProvider;
  isProcessing: boolean;
  queueSize: number; // Number of pending requests
  cacheStatus: {
    enabled: boolean;
    size: number; // Current cache size in MB
    hitRate: number; // 0-1, cache hit rate
    maxSize: number; // Maximum cache size in MB
  };
  providers: {
    [key in TTSProvider]?: {
      available: boolean;
      latency: number; // Average response time in ms
      errorRate: number; // 0-1, error rate in last hour
      usage: {
        requestsToday: number;
        quotaRemaining?: number;
        costToday?: number; // USD
      };
    };
  };
}

// TTS Error Types
export interface TTSError {
  type: 'network' | 'quota' | 'authentication' | 'synthesis' | 'format' | 'cache';
  code: string;
  message: string;
  provider: TTSProvider;
  retryable: boolean;
  retryAfter?: number; // Seconds to wait before retry
  details?: any;
}

// Voice Preview Configuration
export interface VoicePreviewConfig {
  sampleText: string; // Text to speak for preview
  duration: number; // Maximum preview duration in seconds
  autoPlay: boolean; // Auto-play when voice selected
  showWaveform: boolean; // Display audio waveform
}

// TTS Cache Configuration
export interface TTSCacheConfig {
  enabled?: boolean;
  maxSize?: number; // MB
  maxCacheSize?: number; // Bytes (alternative property name)
  ttl?: number; // Time to live in seconds
  expirationTime?: number; // Expiration time in milliseconds
  strategy?: 'lru' | 'lfu' | 'ttl-based'; // Cache eviction strategy
  compression?: boolean; // Compress cached audio
  compressionEnabled?: boolean; // Alternative property name
  persistToDisk?: boolean; // Persist cache across sessions
  cacheKeyStrategy?: 'content-hash' | 'text-voice-quality' | 'custom';
  preloadCommonPhrases?: boolean; // Preload common therapeutic phrases
  memoryCache?: {
    maxSize: number; // In-memory cache size in bytes
    maxEntries: number; // Maximum number of entries in memory
  };
  maxEntries?: number; // Maximum total cache entries
}

// Streaming TTS Configuration
export interface TTSStreamingConfig {
  enabled: boolean;
  chunkSize: number; // Characters per chunk for streaming
  overlap: number; // Character overlap between chunks
  bufferSize: number; // Audio buffer size in seconds
  preload: boolean; // Preload next chunks
  adaptiveBitrate: boolean; // Adjust quality based on connection
}

// TTS Service Configuration
export interface TTSServiceConfig {
  primaryProvider: TTSProvider;
  fallbackProviders: TTSProvider[];
  defaultVoice: TTSVoiceConfig;
  defaultQuality: TTSAudioQuality;
  cache: TTSCacheConfig;
  streaming: TTSStreamingConfig;
  retry: {
    maxAttempts: number;
    backoffMultiplier: number; // Exponential backoff
    maxBackoffTime: number; // Maximum backoff time in ms
  };
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  privacy: {
    storeAudio: boolean;
    encryptCache: boolean;
    autoDeleteAfter: number; // Hours
    logRequests: boolean;
  };
}

// Voice Personalization Profile
export interface VoicePersonalizationProfile {
  patientId: string;
  preferredVoices: TTSVoiceConfig[];
  voiceRatings: Record<string, number>; // Voice name -> rating (0-5)
  contextualPreferences: {
    therapy: TTSVoiceConfig;
    emergency: TTSVoiceConfig;
    meditation: TTSVoiceConfig;
    instruction: TTSVoiceConfig;
  };
  adaptiveSettings: {
    speedPreference: number; // Patient's preferred speech speed
    pitchPreference: number; // Patient's preferred pitch
    pausePreferences: {
      sentence: number;
      paragraph: number;
    };
  };
  accessibility: {
    hearingImpaired: boolean;
    preferredVolume: number;
    needsSlowSpeech: boolean;
    needsHighClarity: boolean;
  };
  culturalSettings: {
    language: string;
    dialect?: string;
    culturalSensitivity: string[];
  };
}

// Real-time TTS Control
export interface TTSPlaybackControl {
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seek(position: number): void; // Seek to position in seconds
  setVolume(volume: number): void; // 0-1
  setSpeed(speed: number): void; // 0.25-4.0
  getCurrentTime(): number; // Current playback position
  getDuration(): number; // Total duration
  isPlaying(): boolean;
  isPaused(): boolean;
}

// TTS Analytics and Metrics
export interface TTSAnalytics {
  usage: {
    totalRequests: number;
    uniqueTexts: number;
    totalAudioTime: number; // Seconds
    avgResponseTime: number; // ms
    cacheHitRate: number; // 0-1
  };
  costs: {
    totalCost: number; // USD
    costPerRequest: number;
    costPerSecond: number;
    monthlyCost: number;
  };
  quality: {
    userRatings: number[]; // Array of ratings (0-5)
    avgRating: number;
    errorRate: number; // 0-1
    successRate: number; // 0-1
  };
  performance: {
    avgSynthesisTime: number; // ms
    avgFirstByteTime: number; // ms for streaming
    p95ResponseTime: number; // 95th percentile
    throughput: number; // Requests per second
  };
}

// TTS Integration with AI Therapist
export interface TherapistTTSConfig {
  personalityVoice: TTSVoiceConfig; // Main therapist voice
  alternateVoices: TTSVoiceConfig[]; // For variety/different contexts
  emotionalAdaptation: {
    enabled: boolean;
    voiceForAnxiety: TTSVoiceConfig;
    voiceForDepression: TTSVoiceConfig;
    voiceForTrauma: TTSVoiceConfig;
    voiceForCelebration: TTSVoiceConfig;
  };
  contextualBehavior: {
    emergency: {
      voice: TTSVoiceConfig;
      speed: number; // Faster for urgency
      priority: 'urgent';
    };
    meditation: {
      voice: TTSVoiceConfig;
      speed: number; // Slower for relaxation
      extraPauses: boolean;
    };
    instruction: {
      voice: TTSVoiceConfig;
      clarity: 'high';
      repetition: boolean; // Repeat important parts
    };
  };
}

// === MISSING TTS TYPES ===

// TTS Cache Entry for individual cached audio files
export interface TTSCacheEntry {
  key: string;
  audioData: ArrayBuffer;
  metadata: {
    text: string;
    voice: TTSVoiceConfig;
    quality: TTSAudioQuality;
    context: string;
    synthesisTime: number;
    provider: TTSProvider;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
    size: number;
    format?: string; // Audio format
    originalDuration?: number; // Original audio duration
    cacheKey?: string; // Cache identifier
    cachedAt?: number; // When it was cached
  };
  expiry: number; // Timestamp when entry expires
  size?: number; // Entry size (alternative location)
}

// TTS Cache Statistics
export interface TTSCacheStats {
  hits: number;
  misses: number;
  evictions: number;
  totalSize: number; // Total cache size in bytes
  entryCount: number;
  hitRate: number; // 0-1, calculated hit rate
  avgResponseTime: number; // Average cache response time in ms
  totalRequests: number;
  oldestEntry?: number; // Timestamp of oldest cached entry
  newestEntry?: number; // Timestamp of newest cached entry
}

// Voice Profile for therapeutic contexts
export interface TTSVoiceProfile {
  name: string;
  characteristics: {
    warmth: number; // 0-1
    authority: number; // 0-1
    empathy: number; // 0-1
    clarity: number; // 0-1
    calmness: number; // 0-1
    professionalism: number; // 0-1
  };
  therapeuticSuitability: {
    anxiety: number; // 0-1, suitability for anxiety disorders
    trauma: number; // 0-1, suitability for trauma therapy
    children: number; // 0-1, suitability for child therapy
    depression: number; // 0-1, suitability for depression therapy
    grief: number; // 0-1, suitability for grief counseling
  };
  demographicAlignment: {
    gender: 'male' | 'female' | 'neutral';
    ageGroup: 'young' | 'middle' | 'mature';
    accent: string;
    cultural: string[];
  };
  effectivenessRating: number; // 0-1, overall therapeutic effectiveness
}

// Voice Personalization Configuration
export interface TTSPersonalizationConfig {
  enablePersonalization?: boolean;
  learningEnabled?: boolean;
  adaptationRate?: number; // 0-1, how quickly to adapt preferences
  culturalSensitivity?: boolean;
  accessibilityOptimization?: boolean;
  voiceEffectivenessTracking?: boolean;
  minSessionsForLearning?: number;
  confidenceThreshold?: number; // 0-1, minimum confidence for recommendations
  diversityFactor?: number; // 0-1, balance between personalization and diversity
}

// Patient Voice Preferences
export interface TTSPersonalizationPreferences {
  genderPreference?: 'male' | 'female' | 'neutral' | 'no-preference';
  agePreference?: 'young' | 'middle' | 'mature' | 'no-preference';
  languagePreference: string; // Language code
  accentPreference?: string;
  culturalBackground?: string;
  therapeuticContext?: string; // Primary therapeutic context
  accessibilityNeeds?: {
    hearingImpaired: boolean;
    needsSlowSpeech: boolean;
    needsHighClarity: boolean;
    preferredVolume: number; // 0-1
  };
  emotionalPreferences?: {
    preferWarmVoices: boolean;
    preferCalmVoices: boolean;
    preferAuthoritativeVoices: boolean;
  };
}

// Voice Recommendation with confidence and reasoning
export interface TTSVoiceRecommendation {
  primary: {
    voice: TTSVoiceConfig;
    confidence: number; // 0-1, confidence in this recommendation
    reasoning: string; // Why this voice was recommended
  };
  alternatives: Array<{
    voice: TTSVoiceConfig;
    confidence: number;
    reasoning: string;
  }>;
  contextualFactors: {
    therapeuticPhase: string;
    patientEmotionalState: string;
    sessionProgress: number; // 0-1
    previousVoiceEffectiveness?: number; // 0-1
  };
  personalizationData: {
    basedOnHistory: boolean;
    learningProgress: number; // 0-1, how much we've learned about patient
    confidenceImprovement: number; // How much confidence has improved
  };
}

// Voice Effectiveness Metrics
export interface VoiceEffectivenessMetrics {
  overallRating: number; // 0-1, overall effectiveness score
  patientEngagement: number; // 0-1, how engaging patients find this voice
  therapeuticOutcomes: {
    anxietyReduction: number; // 0-1, effectiveness for anxiety
    traumaProcessing: number; // 0-1, effectiveness for trauma
    emotionalRegulation: number; // 0-1, effectiveness for emotional regulation
    sessionCompletion: number; // 0-1, session completion rate with this voice
  };
  patientFeedback: {
    averageRating: number; // 1-5, direct patient ratings
    totalRatings: number;
    positiveResponses: number; // Number of positive responses
    negativeResponses: number; // Number of negative responses
  };
  clinicalMetrics: {
    sudsImprovement: number; // Average SUDS improvement with this voice
    vocImprovement: number; // Average VOC improvement with this voice
    sessionDuration: number; // Average session duration in minutes
    dropoutRate: number; // 0-1, dropout rate when using this voice
  };
  contextualEffectiveness: {
    preparation: number; // 0-1, effectiveness in preparation phase
    assessment: number; // 0-1, effectiveness in assessment phase
    desensitization: number; // 0-1, effectiveness in desensitization phase
    installation: number; // 0-1, effectiveness in installation phase
    closure: number; // 0-1, effectiveness in closure phase
  };
  lastUpdated: number; // Timestamp of last metrics update
  patientSatisfaction?: number; // Alternative property name
  clinicalEffectiveness?: number; // Alternative property name
  usageCount?: number; // Number of times used
}

// === ADDITIONAL TTS PROVIDER CONFIGURATIONS ===

// Google Cloud TTS Configuration
export interface GoogleCloudTTSConfig {
  apiKey?: string;
  projectId?: string;
  timeout?: number;
  retryAttempts?: number;
  serverEndpoint?: string; // Server endpoint for API calls
  region?: string;
}

// Web Speech TTS Configuration
export interface WebSpeechTTSConfig {
  preferLocalVoices?: boolean;
  qualityEnhancement?: {
    enabled: boolean;
    normalizeVolume: boolean;
    reduceBgNoise: boolean; // Background noise reduction
    enhanceClarity: boolean;
  };
}

// === ElevenLabs TTS Configuration ===

// ElevenLabs Voice Configuration
export interface ElevenLabsVoiceConfig {
  voiceId: string; // ElevenLabs voice ID (e.g., 'EXAVITQu4vr4xnSDxMaL')
  model: 'eleven_monolingual_v1' | 'eleven_multilingual_v1' | 'eleven_multilingual_v2' | 'eleven_turbo_v2';
  stability: number; // 0-1, voice stability (consistency)
  similarity_boost: number; // 0-1, voice similarity boost (clarity vs creativity)
  style?: number; // 0-1, style exaggeration (emotional range)
  use_speaker_boost?: boolean; // Enhanced speaker similarity
  // Therapeutic optimizations
  therapeuticProfile: {
    emotionalContext: 'calm' | 'empathetic' | 'supportive' | 'instructional' | 'emergency';
    paceAdjustment: number; // 0.5-2.0, speaking pace multiplier
    emphasisLevel: 'subtle' | 'moderate' | 'strong'; // Emotional emphasis
    pausePattern: 'minimal' | 'natural' | 'therapeutic'; // Pause patterns
  };
}

// ElevenLabs TTS Provider Interface
export interface ElevenLabsTTSProvider {
  provider: 'elevenlabs';
  config: {
    apiKey?: string; // Server will provide via token endpoint
    serverEndpoint: string; // Server proxy endpoint for API calls
    timeout: number; // Request timeout in ms
    retryAttempts: number; // Number of retry attempts
    maxConcurrentRequests: number; // Rate limiting
    // WebRTC Streaming Configuration
    streaming: {
      enabled: boolean;
      chunkSize: number; // Audio chunk size for streaming
      bufferSize: number; // Client-side buffer size
      latencyOptimization: boolean; // Optimize for low latency
      adaptiveQuality: boolean; // Adjust quality based on connection
    };
    // Voice Selection
    voices: {
      default: ElevenLabsVoiceConfig;
      therapeutic: {
        // Русифицированные терапевтические голоса
        спокойный: ElevenLabsVoiceConfig; // Calm, reassuring voice
        эмпатичный: ElevenLabsVoiceConfig; // Empathetic, understanding voice
        поддерживающий: ElevenLabsVoiceConfig; // Supportive, encouraging voice
        инструктивный: ElevenLabsVoiceConfig; // Clear, instructional voice
        экстренный: ElevenLabsVoiceConfig; // Emergency, direct voice
      };
      // Context-based voice mapping
      contextMapping: {
        preparation: string; // Voice ID for preparation phase
        assessment: string; // Voice ID for assessment phase
        desensitization: string; // Voice ID for desensitization phase
        installation: string; // Voice ID for installation phase
        'body-scan': string; // Voice ID for body scan phase
        closure: string; // Voice ID for closure phase
        reevaluation: string; // Voice ID for reevaluation phase
        integration: string; // Voice ID for integration phase
      };
    };
    // Error handling and fallback
    fallback: {
      enableFallback: boolean;
      fallbackProvider: TTSProvider; // Fallback to another provider
      maxErrorsBeforeFallback: number;
      cooldownPeriod: number; // ms before retrying after errors
    };
  };
}

// WebRTC Audio Streaming Configuration for ElevenLabs
export interface ElevenLabsWebRTCConfig {
  enabled: boolean;
  connection: {
    iceServers: Array<{
      urls: string | string[];
      username?: string;
      credential?: string;
    }>;
    bundlePolicy: 'balanced' | 'max-compat' | 'max-bundle';
    iceCandidatePoolSize: number;
  };
  audio: {
    sampleRate: 16000 | 22050 | 24000 | 44100; // Supported sample rates
    channels: 1 | 2; // Mono or stereo
    bitrate: number; // Target bitrate in kbps
    codec: 'opus' | 'pcm' | 'aac'; // Preferred audio codec
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
  };
  streaming: {
    chunkDuration: number; // ms, duration of each audio chunk
    bufferTime: number; // ms, client-side buffer time
    maxLatency: number; // ms, maximum acceptable latency
    adaptiveBitrate: boolean; // Adjust bitrate based on connection
    jitterBuffer: {
      enabled: boolean;
      targetDelay: number; // ms, target jitter buffer delay
      maxDelay: number; // ms, maximum jitter buffer delay
    };
  };
  quality: {
    dynamicAdjustment: boolean; // Adjust quality based on connection
    minQuality: 'low' | 'medium' | 'high'; // Minimum acceptable quality
    maxQuality: 'low' | 'medium' | 'high'; // Maximum quality to use
    qualitySteps: number; // Number of quality adjustment steps
  };
}

// ElevenLabs API Response Types
export interface ElevenLabsGenerationResponse {
  audio: ArrayBuffer; // Generated audio data
  history_item_id?: string; // ElevenLabs generation ID
  request_id?: string; // Request tracking ID
  metadata?: {
    duration: number; // Audio duration in seconds
    size: number; // Audio file size in bytes
    sample_rate: number; // Audio sample rate
    model_used: string; // Model used for generation
    voice_id: string; // Voice ID used
    settings: {
      stability: number;
      similarity_boost: number;
      style?: number;
    };
  };
}

// ElevenLabs Voice List Response
export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
  description?: string;
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  // Therapeutic categorization
  therapeutic_suitability?: {
    anxiety_friendly: boolean;
    trauma_sensitive: boolean;
    child_friendly: boolean;
    elderly_friendly: boolean;
    gender_neutral: boolean;
    cultural_adaptability: string[]; // Supported cultures/languages
  };
}

// ElevenLabs Streaming Configuration
export interface ElevenLabsStreamingOptions {
  model: ElevenLabsVoiceConfig['model'];
  voice_settings: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
  pronunciation_dictionary_locators?: Array<{
    pronunciation_dictionary_id: string;
    version_id: string;
  }>;
  generation_config?: {
    chunk_length_schedule?: number[];
  };
  output_format?: 'mp3_22050_32' | 'mp3_44100_32' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
}

// Updated TTS Service Configuration
export interface TTSServiceConfig {
  primaryProvider?: TTSProvider;
  fallbackProviders?: TTSProvider[];
  defaultVoice?: TTSVoiceConfig;
  defaultQuality?: TTSAudioQuality;
  cache?: TTSCacheConfig;
  streaming?: TTSStreamingConfig;
  providers?: any[]; // Array of provider instances
  fallbackEnabled?: boolean;
  cacheService?: any;
  personalizationService?: any;
  providerConfigs?: {
    elevenlabs?: any;
    googleCloud?: any;
    webSpeech?: any;
  };
  retry?: {
    maxAttempts: number;
    backoffMultiplier: number; // Exponential backoff
    maxBackoffTime: number; // Maximum backoff time in ms
  };
  rateLimit?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  privacy?: {
    storeAudio: boolean;
    encryptCache: boolean;
    autoDeleteAfter: number; // Hours
    logRequests: boolean;
  };
}