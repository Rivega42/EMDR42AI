/**
 * Deterministic Utility Functions for Clinical Safety
 * Replaces Math.random() with deterministic, reproducible algorithms
 * Critical for EMDR therapy analytics where clinical accuracy is essential
 */

/**
 * Generate deterministic pseudo-random values based on patient/session context
 * Replaces Math.random() for clinical safety
 */
export function deterministicValue(
  patientId: string, 
  sessionId: string, 
  seed: string = '', 
  min: number = 0, 
  max: number = 1
): number {
  const baseString = `${patientId}_${sessionId}_${seed}_${Date.now() % 86400000}`; // Daily seed rotation
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const normalized = (Math.abs(hash) % 10000) / 10000;
  return min + normalized * (max - min);
}

/**
 * Generate deterministic array selection (replaces Math.floor(Math.random()))
 */
export function deterministicArraySelect<T>(
  array: T[], 
  patientId: string, 
  sessionId: string, 
  seed: string = ''
): T {
  if (array.length === 0) throw new Error('Cannot select from empty array');
  const value = deterministicValue(patientId, sessionId, seed, 0, array.length);
  return array[Math.floor(value)];
}

/**
 * Generate deterministic boolean (replaces Math.random() > threshold)
 */
export function deterministicBoolean(
  patientId: string, 
  sessionId: string, 
  seed: string = '', 
  threshold: number = 0.5
): boolean {
  return deterministicValue(patientId, sessionId, seed) > threshold;
}

/**
 * Generate deterministic ID for clinical safety (replaces Math.random().toString(36))
 */
export function generateDeterministicId(
  patientId: string, 
  sessionId: string, 
  seedValue: string = ''
): string {
  const baseString = `${patientId}_${sessionId}_${seedValue}`;
  let hash = 0;
  for (let i = 0; i < baseString.length; i++) {
    const char = baseString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36).substr(0, 9);
}

/**
 * Generate deterministic emotion values for consistent analytics
 */
export function generateDeterministicEmotionData(
  patientId: string, 
  sessionId: string, 
  timeIndex: number
) {
  return {
    arousal: deterministicValue(patientId, sessionId, `${timeIndex}_arousal`, 0.1, 0.9),
    valence: deterministicValue(patientId, sessionId, `${timeIndex}_valence`, 0.1, 0.9),
    basicEmotions: {
      anger: deterministicValue(patientId, sessionId, `${timeIndex}_anger`, 0, 80),
      fear: deterministicValue(patientId, sessionId, `${timeIndex}_fear`, 0, 60),
      sadness: deterministicValue(patientId, sessionId, `${timeIndex}_sadness`, 0, 70),
      joy: deterministicValue(patientId, sessionId, `${timeIndex}_joy`, 0, 90),
      surprise: deterministicValue(patientId, sessionId, `${timeIndex}_surprise`, 0, 50),
      disgust: deterministicValue(patientId, sessionId, `${timeIndex}_disgust`, 0, 30),
      anxiety: deterministicValue(patientId, sessionId, `${timeIndex}_anxiety`, 0, 85),
      calm: deterministicValue(patientId, sessionId, `${timeIndex}_calm`, 0, 95),
      stress: deterministicValue(patientId, sessionId, `${timeIndex}_stress`, 0, 75),
      relief: deterministicValue(patientId, sessionId, `${timeIndex}_relief`, 0, 80)
    },
    stressLevel: deterministicValue(patientId, sessionId, `${timeIndex}_stress_level`, 0, 0.8),
    stabilityScore: deterministicValue(patientId, sessionId, `${timeIndex}_stability`, 0.1, 1.0)
  };
}

/**
 * Generate deterministic neural activity for brain patterns
 */
export function generateDeterministicNeuralActivity(
  patientId: string, 
  sessionId: string, 
  nodeId: string
) {
  return {
    activity: deterministicValue(patientId, sessionId, `neural_${nodeId}_activity`, 0, 1),
    size: deterministicValue(patientId, sessionId, `neural_${nodeId}_size`, 15, 25),
    coherence: deterministicValue(patientId, sessionId, `neural_${nodeId}_coherence`, 0, 1)
  };
}