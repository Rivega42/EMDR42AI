/**
 * EMDR Services - Main Export
 * Revolutionary AI-Driven EMDR Therapy System
 */

// Main Session Conductor - Full Implementation
export { default as EMDRSessionConductor } from './sessionConductor';

// Simplified Session Conductor - Working Implementation
export { default as SimplifiedEMDRConductor } from './conductorSimplified';
export type { SimplifiedEMDRSession, ConductorConfig, ConductorEvents } from './conductorSimplified';

// Types and Interfaces
export type {
  // Main conductor types
  EMDRSessionState,
  EMDRPhaseConfig, 
  EMDRSessionData,
  EMDRSessionConductorConfig,
  EMDRSessionConductorEvents,
  
  // Session management
  SessionMetrics,
  SessionPersonalization,
  TargetMemory,
  SessionProgress,
  SessionAlgorithmStatus,
  
  // Emotion and analysis
  EmotionSnapshot,
  EmotionThresholds,
  
  // Interaction records
  BLSEffectivenessRecord,
  VoiceInteractionRecord,
  AIInteractionRecord,
  CrisisEventRecord,
  
  // Adaptive logic
  AdaptiveLogicRule,
  EmotionCondition,
  AdaptiveAction
} from './types';

// Convenience factory function
import EMDRSessionConductor from './sessionConductor';
import type { EMDRSessionConductorConfig, EMDRSessionConductorEvents } from './types';

/**
 * Create a new EMDR Session Conductor with default configuration
 * @param config Optional configuration overrides
 * @param events Optional event handlers
 * @returns Configured EMDR Session Conductor instance
 */
export function createEMDRSessionConductor(
  config?: Partial<EMDRSessionConductorConfig>,
  events?: Partial<EMDRSessionConductorEvents>
): EMDRSessionConductor {
  return new EMDRSessionConductor(config, events);
}

/**
 * Default configuration for production use
 */
export const PRODUCTION_CONFIG: Partial<EMDRSessionConductorConfig> = {
  ai: {
    model: 'gpt-4-turbo',
    enableVoiceMode: true,
    temperature: 0.7
  },
  emotion: {
    enableMultimodal: true,
    samplingRate: 2,
    smoothingWindow: 3
  },
  voice: {
    enabled: true,
    provider: 'google-cloud',
    enableEmotionalAdaptation: true,
    enableInterruption: true
  },
  session: {
    maxDurationMinutes: 90,
    enableAutomaticPhaseTransition: true,
    enableEmergencyProtocols: true,
    autoSaveInterval: 30
  },
  safety: {
    enableCrisisDetection: true,
    enableSafetyMonitoring: true
  },
  personalization: {
    enableLearning: true,
    enablePreferenceTracking: true,
    enableHistoryBasedOptimization: true
  }
};

/**
 * Development configuration with enhanced debugging
 */
export const DEVELOPMENT_CONFIG: Partial<EMDRSessionConductorConfig> = {
  ...PRODUCTION_CONFIG,
  session: {
    ...PRODUCTION_CONFIG.session,
    maxDurationMinutes: 30, // Shorter sessions for testing
    autoSaveInterval: 10 // More frequent saves
  },
  data: {
    enablePersistence: true,
    enableAnalytics: true,
    encryptionEnabled: false, // Disabled for debugging
    dataRetention: 30 // Shorter retention for testing
  }
};

/**
 * Create production-ready EMDR conductor
 */
export function createProductionConductor(
  events?: Partial<EMDRSessionConductorEvents>
): EMDRSessionConductor {
  return createEMDRSessionConductor(PRODUCTION_CONFIG, events);
}

/**
 * Create development EMDR conductor with debugging features
 */
export function createDevelopmentConductor(
  events?: Partial<EMDRSessionConductorEvents>
): EMDRSessionConductor {
  return createEMDRSessionConductor(DEVELOPMENT_CONFIG, events);
}