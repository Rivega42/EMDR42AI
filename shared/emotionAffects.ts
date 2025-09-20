/**
 * Centralized emotion affects mapping
 * Complete mapping of 98 affects in emotional space based on Circumplex Model
 * 
 * Arousal: -1 (low/calm) to +1 (high/excited)  
 * Valence: -1 (negative) to +1 (positive)
 */

export interface AffectMapping {
  arousal: number;
  valence: number;
}

export const affects98: Record<string, AffectMapping> = {
  "Adventurous": { arousal: 0.4, valence: 0.6 },
  "Afraid": { arousal: 0.7, valence: -0.6 },
  "Alarmed": { arousal: 0.8, valence: -0.5 },
  "Ambitious": { arousal: 0.5, valence: 0.4 },
  "Amorous": { arousal: 0.3, valence: 0.7 },
  "Amused": { arousal: 0.3, valence: 0.6 },
  "Angry": { arousal: 0.7, valence: -0.7 },
  "Annoyed": { arousal: 0.4, valence: -0.4 },
  "Anxious": { arousal: 0.6, valence: -0.3 },
  "Apathetic": { arousal: -0.6, valence: -0.2 },
  "Aroused": { arousal: 0.8, valence: 0.3 },
  "Ashamed": { arousal: -0.2, valence: -0.6 },
  "Astonished": { arousal: 0.6, valence: 0.1 },
  "At ease": { arousal: -0.3, valence: 0.3 },
  "Attentive": { arousal: 0.2, valence: 0.3 },
  "Bellicose": { arousal: 0.6, valence: -0.5 },
  "Bitter": { arousal: 0.2, valence: -0.7 },
  "Bored": { arousal: -0.7, valence: -0.3 },
  "Calm": { arousal: -0.4, valence: 0.4 },
  "Compassionate": { arousal: 0.1, valence: 0.6 },
  "Confident": { arousal: 0.3, valence: 0.5 },
  "Conscientious": { arousal: 0.2, valence: 0.4 },
  "Content": { arousal: -0.1, valence: 0.6 },
  "Convinced": { arousal: 0.1, valence: 0.5 },
  "Courageous": { arousal: 0.5, valence: 0.5 },
  "Curious": { arousal: 0.3, valence: 0.3 },
  "Dejected": { arousal: -0.3, valence: -0.6 },
  "Delighted": { arousal: 0.4, valence: 0.8 },
  "Depressed": { arousal: -0.5, valence: -0.7 },
  "Despairing": { arousal: -0.2, valence: -0.8 },
  "Determined": { arousal: 0.4, valence: 0.4 },
  "Disappointed": { arousal: -0.1, valence: -0.5 },
  "Disgusted": { arousal: 0.1, valence: -0.6 },
  "Dissatisfied": { arousal: 0.0, valence: -0.4 },
  "Distressed": { arousal: 0.5, valence: -0.6 },
  "Doubtful": { arousal: 0.0, valence: -0.3 },
  "Droopy": { arousal: -0.6, valence: -0.4 },
  "Eager": { arousal: 0.5, valence: 0.6 },
  "Elated": { arousal: 0.6, valence: 0.8 },
  "Embarrassed": { arousal: 0.0, valence: -0.5 },
  "Enthusiastic": { arousal: 0.6, valence: 0.7 },
  "Envious": { arousal: 0.2, valence: -0.5 },
  "Excited": { arousal: 0.8, valence: 0.6 },
  "Expectant": { arousal: 0.3, valence: 0.2 },
  "Feel guilt": { arousal: -0.1, valence: -0.6 },
  "Feel well": { arousal: 0.0, valence: 0.5 },
  "Feeling superior": { arousal: 0.2, valence: 0.3 },
  "Friendly": { arousal: 0.1, valence: 0.6 },
  "Frustrated": { arousal: 0.4, valence: -0.5 },
  "Glad": { arousal: 0.2, valence: 0.6 },
  "Gloomy": { arousal: -0.4, valence: -0.5 },
  "Happy": { arousal: 0.3, valence: 0.7 },
  "Hateful": { arousal: 0.5, valence: -0.8 },
  "Hesitant": { arousal: -0.1, valence: -0.2 },
  "Hopeful": { arousal: 0.2, valence: 0.5 },
  "Hopeless": { arousal: -0.4, valence: -0.7 },
  "Hostile": { arousal: 0.6, valence: -0.6 },
  "Impatient": { arousal: 0.4, valence: -0.3 },
  "Impressed": { arousal: 0.3, valence: 0.4 },
  "Indifferent": { arousal: -0.5, valence: 0.0 },
  "Inspired": { arousal: 0.4, valence: 0.7 },
  "Interested": { arousal: 0.3, valence: 0.4 },
  "Joyful": { arousal: 0.4, valence: 0.8 },
  "Languid": { arousal: -0.7, valence: 0.0 },
  "Light-hearted": { arousal: 0.2, valence: 0.7 },
  "Lonely": { arousal: -0.3, valence: -0.5 },
  "Longing": { arousal: -0.1, valence: -0.3 },
  "Lusting": { arousal: 0.5, valence: 0.4 },
  "Melancholic": { arousal: -0.3, valence: -0.4 },
  "Miserable": { arousal: -0.2, valence: -0.8 },
  "Passionate": { arousal: 0.7, valence: 0.5 },
  "Peaceful": { arousal: -0.5, valence: 0.5 },
  "Pensive": { arousal: -0.2, valence: -0.1 },
  "Pleased": { arousal: 0.0, valence: 0.6 },
  "Polite": { arousal: -0.1, valence: 0.4 },
  "Relaxed": { arousal: -0.6, valence: 0.6 },
  "Reverent": { arousal: 0.0, valence: 0.3 },
  "Sad": { arousal: -0.3, valence: -0.7 },
  "Satisfied": { arousal: -0.2, valence: 0.6 },
  "Scared": { arousal: 0.6, valence: -0.7 },
  "Selfconfident": { arousal: 0.3, valence: 0.5 },
  "Serene": { arousal: -0.4, valence: 0.6 },
  "Serious": { arousal: 0.0, valence: 0.0 },
  "Sleepy": { arousal: -0.8, valence: 0.1 },
  "Solemn": { arousal: -0.1, valence: 0.1 },
  "Startled": { arousal: 0.7, valence: -0.2 },
  "Stimulated": { arousal: 0.6, valence: 0.4 },
  "Strained": { arousal: 0.3, valence: -0.4 },
  "Successful": { arousal: 0.3, valence: 0.7 },
  "Suspicious": { arousal: 0.2, valence: -0.3 },
  "Taken aback": { arousal: 0.4, valence: -0.1 },
  "Tense": { arousal: 0.5, valence: -0.4 },
  "Tired": { arousal: -0.7, valence: -0.2 },
  "Tranquil": { arousal: -0.5, valence: 0.4 },
  "Uncomfortable": { arousal: 0.1, valence: -0.4 },
  "Unhappy": { arousal: -0.1, valence: -0.7 },
  "Unsatisfied": { arousal: 0.1, valence: -0.5 },
  "Upset": { arousal: 0.3, valence: -0.6 },
  "Wavering": { arousal: 0.0, valence: -0.2 },
  "Worried": { arousal: 0.4, valence: -0.5 }
};

/**
 * Calculate affect percentages based on current emotion coordinates
 * Uses inverse distance weighting for interpolation
 * @param arousal Current arousal value (-1 to 1)
 * @param valence Current valence value (-1 to 1)
 * @returns Record of affect names to intensity percentages (0-100)
 */
export function calculateAffects(arousal: number, valence: number): Record<string, number> {
  const affects: Record<string, number> = {};
  let totalWeight = 0;
  const weights: Record<string, number> = {};
  
  // Calculate inverse distance weights for each affect
  Object.entries(affects98).forEach(([affect, coords]) => {
    const distance = Math.sqrt(
      Math.pow(coords.arousal - arousal, 2) + 
      Math.pow(coords.valence - valence, 2)
    );
    
    // Use inverse distance with small epsilon to avoid division by zero
    // Closer affects have higher weights
    const weight = distance < 0.01 ? 100 : 1 / (distance + 0.1);
    weights[affect] = weight;
    totalWeight += weight;
  });
  
  // Normalize weights to percentages (0-100)
  Object.entries(weights).forEach(([affect, weight]) => {
    affects[affect] = Math.round((weight / totalWeight) * 100);
  });
  
  return affects;
}

/**
 * Get the dominant affect based on current emotion
 * @param arousal Current arousal value (-1 to 1)
 * @param valence Current valence value (-1 to 1)
 * @returns The name of the closest affect
 */
export function getDominantAffect(arousal: number, valence: number): string {
  let closestAffect = "Neutral";
  let minDistance = Infinity;
  
  Object.entries(affects98).forEach(([affect, coords]) => {
    const distance = Math.sqrt(
      Math.pow(coords.arousal - arousal, 2) + 
      Math.pow(coords.valence - valence, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      closestAffect = affect;
    }
  });
  
  return closestAffect;
}

/**
 * Map basic emotions (from face-api) to arousal/valence coordinates
 * Returns values in [-1, 1] range
 */
export function basicEmotionsToArousalValence(emotions: {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}): { arousal: number; valence: number } {
  // Weight each emotion by its contribution to arousal and valence
  const emotionMappings = {
    neutral: { arousal: 0, valence: 0 },
    happy: { arousal: 0.3, valence: 0.7 },
    sad: { arousal: -0.3, valence: -0.7 },
    angry: { arousal: 0.7, valence: -0.7 },
    fearful: { arousal: 0.6, valence: -0.6 },
    disgusted: { arousal: 0.1, valence: -0.6 },
    surprised: { arousal: 0.6, valence: 0.1 }
  };
  
  let totalArousal = 0;
  let totalValence = 0;
  let totalWeight = 0;
  
  Object.entries(emotions).forEach(([emotion, weight]) => {
    const mapping = emotionMappings[emotion as keyof typeof emotionMappings];
    if (mapping) {
      totalArousal += mapping.arousal * weight;
      totalValence += mapping.valence * weight;
      totalWeight += weight;
    }
  });
  
  // Normalize to ensure we stay in [-1, 1] range
  if (totalWeight > 0) {
    totalArousal = Math.max(-1, Math.min(1, totalArousal / totalWeight));
    totalValence = Math.max(-1, Math.min(1, totalValence / totalWeight));
  }
  
  return { arousal: totalArousal, valence: totalValence };
}