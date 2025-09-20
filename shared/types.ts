/**
 * Shared TypeScript interfaces for EMDR42 platform
 */

// EMDR Phase types
export type EMDRPhase = 
  | 'preparation' 
  | 'desensitization' 
  | 'installation' 
  | 'body-scan' 
  | 'closure';

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