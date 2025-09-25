/**
 * Voice conversation interfaces for UI state management
 * Provides type safety for voice session handling, audio visualization, and conversation states
 */

// Voice Session State Management
export interface VoiceSessionState {
  id: string;
  status: 'idle' | 'listening' | 'processing' | 'speaking' | 'paused' | 'error';
  isActive: boolean;
  startTime?: number;
  lastActivity?: number;
  error?: string;
  
  // Voice configuration
  voiceProfile: VoiceProfile;
  
  // Current interaction state
  currentInteraction?: {
    userSpeaking: boolean;
    aiSpeaking: boolean;
    transcriptionInProgress: boolean;
    synthesisInProgress: boolean;
  };
  
  // Audio feedback
  audioLevels: {
    input: number; // 0-1, current microphone level
    output: number; // 0-1, current speaker level
    voiceActivity: number; // 0-1, detected voice activity
  };
}

export interface VoiceProfile {
  preferredLanguage: string;
  voiceType: 'male' | 'female' | 'neutral';
  therapeuticStyle: 'calming' | 'warm' | 'supportive' | 'authoritative' | 'gentle';
  adaptationLevel: number; // 0-1, how much AI adapts to patient's voice
  
  // User preferences
  pushToTalk: boolean;
  continuousListening: boolean;
  interruptionAllowed: boolean;
  
  // Voice activity detection settings
  vadSettings: {
    threshold: number; // 0-1, voice detection sensitivity
    timeout: number; // ms, silence timeout before stopping
    warmupTime: number; // ms, initial listening period
  };
}

// Conversation Flow States
export interface VoiceConversationFlow {
  phase: 'idle' | 'listening' | 'transcribing' | 'analyzing' | 'responding' | 'speaking';
  progress: number; // 0-1, current phase progress
  message?: string; // Status message for UI
  
  // Step-by-step progress
  steps: {
    listening: { active: boolean; duration?: number; };
    transcription: { active: boolean; text?: string; confidence?: number; };
    aiProcessing: { active: boolean; thinking?: boolean; };
    synthesis: { active: boolean; voice?: string; };
    playback: { active: boolean; duration?: number; };
  };
  
  // Interruption state
  canInterrupt: boolean;
  interruptionReason?: 'user_spoke' | 'crisis_detected' | 'timeout' | 'manual';
}

// Audio Visualization Data
export interface AudioVisualization {
  // Real-time audio levels (for waveform, bars, etc.)
  frequencyData: Float32Array;
  timeData: Float32Array;
  
  // Simplified levels for basic UI
  volume: number; // 0-1, overall volume
  pitch: number; // 0-1, normalized pitch
  activity: boolean; // Voice activity detected
  
  // Visual feedback configuration
  visualizer: {
    type: 'waveform' | 'bars' | 'circle' | 'simple';
    sensitivity: number; // 0-1, visualization sensitivity
    smoothing: number; // 0-1, animation smoothing
    color: string; // Primary color for visualization
  };
}

// Voice Session Management Actions
export interface VoiceSessionActions {
  // Session control
  start: (profile?: Partial<VoiceProfile>) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  
  // Voice interaction
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  interrupt: () => Promise<void>;
  
  // Configuration
  updateProfile: (updates: Partial<VoiceProfile>) => void;
  togglePushToTalk: () => void;
  toggleContinuousListening: () => void;
  
  // Audio control
  adjustInputLevel: (level: number) => void;
  adjustOutputLevel: (level: number) => void;
  muteInput: (muted: boolean) => void;
  muteOutput: (muted: boolean) => void;
}

// Voice Message Context for UI Display
export interface VoiceMessageContext {
  // Message metadata
  id: string;
  timestamp: number;
  type: 'user' | 'therapist';
  
  // Content
  text: string;
  audioUrl?: string;
  duration?: number;
  
  // Voice analysis (for display)
  voiceMetadata?: {
    emotion: string;
    confidence: number;
    stress: number;
    engagement: number;
    quality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  
  // AI processing metadata
  aiMetadata?: {
    processingTime: number;
    confidence: number;
    criticalityLevel: 'low' | 'medium' | 'high' | 'crisis';
    therapeuticStyle: string;
  };
  
  // UI state
  isPlaying?: boolean;
  isHighlighted?: boolean;
  showAnalysis?: boolean;
}

// Voice Session Statistics for UI
export interface VoiceSessionStats {
  // Session metrics
  duration: number; // ms, total session time
  speechTime: number; // ms, user speaking time
  silenceTime: number; // ms, silence periods
  interactionCount: number; // Number of voice exchanges
  
  // Quality metrics
  averageConfidence: number; // 0-1, STT confidence
  audioQuality: number; // 0-1, overall audio quality
  connectionStability: number; // 0-1, connection quality
  
  // Emotional progression
  emotionalJourney: {
    start: { arousal: number; valence: number; };
    current: { arousal: number; valence: number; };
    progression: Array<{ time: number; arousal: number; valence: number; }>;
  };
  
  // Therapeutic progress
  therapeuticMetrics: {
    engagementLevel: number; // 0-1, overall engagement
    responseQuality: number; // 0-1, AI response appropriateness
    crisisEvents: number; // Number of crisis interventions
    adaptationEffectiveness: number; // 0-1, how well AI adapted
  };
}

// Voice Error Handling for UI
export interface VoiceError {
  type: 'microphone' | 'network' | 'stt' | 'tts' | 'ai' | 'audio' | 'permission';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: string;
  timestamp: number;
  
  // Recovery options
  canRetry: boolean;
  fallbackAvailable: boolean;
  fallbackType?: 'text' | 'offline' | 'reduced_quality';
  
  // User actions
  actions: Array<{
    label: string;
    action: 'retry' | 'fallback' | 'dismiss' | 'report';
    primary?: boolean;
  }>;
}

// Voice UI Component Props
export interface VoiceConversationUIProps {
  session: VoiceSessionState;
  conversation: VoiceConversationFlow;
  visualization: AudioVisualization;
  actions: VoiceSessionActions;
  
  // UI configuration
  showAnalytics?: boolean;
  showVisualization?: boolean;
  compactMode?: boolean;
  theme?: 'light' | 'dark' | 'therapeutic';
  
  // Event handlers
  onMessage?: (message: VoiceMessageContext) => void;
  onError?: (error: VoiceError) => void;
  onStateChange?: (state: VoiceSessionState) => void;
}

// Push-to-Talk UI Component
export interface PushToTalkProps {
  isActive: boolean;
  isListening: boolean;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'emergency';
  
  // Event handlers
  onPress: () => void;
  onRelease: () => void;
  onLongPress?: () => void;
  
  // Visual feedback
  showWaveform?: boolean;
  showLevel?: boolean;
  pulseDuration?: number;
}

// Audio Level Meter Props
export interface AudioLevelMeterProps {
  level: number; // 0-1, current audio level
  type: 'input' | 'output';
  orientation: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  
  // Visual configuration
  showNumbers?: boolean;
  showPeaks?: boolean;
  color?: string;
  backgroundColor?: string;
  
  // Thresholds for visual feedback
  thresholds?: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

// Voice Session Status Display
export interface VoiceSessionStatusProps {
  session: VoiceSessionState;
  stats?: VoiceSessionStats;
  
  // Display options
  showDetailedStats?: boolean;
  showEmotionalProgress?: boolean;
  showQualityMetrics?: boolean;
  
  // Layout
  layout?: 'compact' | 'detailed' | 'dashboard';
  position?: 'top' | 'bottom' | 'sidebar';
}