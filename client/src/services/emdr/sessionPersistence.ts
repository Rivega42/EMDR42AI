/**
 * Session Persistence Service for EMDR Session Conductor
 * Handles data storage, retrieval, and session history management
 */

import type { 
  EMDRSessionData, 
  SessionPersonalization, 
  TargetMemory,
  SessionMetrics,
  BLSEffectivenessRecord
} from './types';
import type { BLSConfiguration, User } from '@/../../shared/types';
import { generateDeterministicId } from '@/lib/deterministicUtils';

export interface SessionHistoryEntry {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime: number;
  phase: string;
  sudReduction: number;
  vocImprovement: number;
  duration: number; // minutes
  completed: boolean;
  targetMemory: {
    description: string;
    initialSUD: number;
    finalSUD: number;
  };
}

export interface UserSessionHistory {
  userId: string;
  totalSessions: number;
  completedSessions: number;
  averageSessionDuration: number; // minutes
  averageSUDReduction: number;
  averageVOCImprovement: number;
  mostEffectiveBLSPatterns: string[];
  challengingPhases: string[];
  recentSessions: SessionHistoryEntry[];
  personalization: SessionPersonalization;
}

export interface PersistenceConfig {
  enableEncryption: boolean;
  enableCompression: boolean;
  backupInterval: number; // seconds
  maxHistoryEntries: number;
  enableRemoteBackup: boolean;
}

/**
 * EMDR Session Persistence Service
 * Handles all data storage and retrieval for session conductor
 */
export class EMDRSessionPersistence {
  private config: PersistenceConfig;
  private encryptionKey: string | null = null;

  constructor(config: Partial<PersistenceConfig> = {}) {
    this.config = {
      enableEncryption: true,
      enableCompression: true,
      backupInterval: 60,
      maxHistoryEntries: 100,
      enableRemoteBackup: false,
      ...config
    };
  }

  /**
   * Save complete session data
   */
  async saveSession(sessionData: EMDRSessionData): Promise<void> {
    try {
      console.log('💾 Saving EMDR session data...');
      
      // Prepare session data for storage
      const dataToSave = this.prepareSessionDataForStorage(sessionData);
      
      // Save to localStorage (primary storage)
      await this.saveToLocalStorage(`emdr_session_${sessionData.sessionId}`, dataToSave);
      
      // Update session history
      await this.updateSessionHistory(sessionData);
      
      // Update user personalization
      await this.updatePersonalization(sessionData);
      
      // Remote backup if enabled
      if (this.config.enableRemoteBackup) {
        await this.saveToRemoteStorage(sessionData);
      }
      
      console.log('✅ Session data saved successfully');
      
    } catch (error) {
      console.error('Failed to save session data:', error);
      throw new Error(`Session save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load session data by ID
   */
  async loadSession(sessionId: string): Promise<EMDRSessionData | null> {
    try {
      console.log(`📂 Loading session: ${sessionId}`);
      
      // Try localStorage first
      const data = await this.loadFromLocalStorage(`emdr_session_${sessionId}`);
      
      if (data) {
        return this.parseSessionDataFromStorage(data);
      }
      
      // Try remote storage if local not found
      if (this.config.enableRemoteBackup) {
        return await this.loadFromRemoteStorage(sessionId);
      }
      
      return null;
      
    } catch (error) {
      console.error('Failed to load session data:', error);
      return null;
    }
  }

  /**
   * Get user session history
   */
  async getUserHistory(userId: string): Promise<UserSessionHistory | null> {
    try {
      console.log(`📊 Loading user history: ${userId}`);
      
      const historyData = await this.loadFromLocalStorage(`emdr_history_${userId}`);
      
      if (historyData) {
        return JSON.parse(historyData);
      }
      
      // Create empty history if none exists
      return this.createEmptyUserHistory(userId);
      
    } catch (error) {
      console.error('Failed to load user history:', error);
      return null;
    }
  }

  /**
   * Get user personalization data
   */
  async getUserPersonalization(userId: string): Promise<SessionPersonalization | null> {
    try {
      const history = await this.getUserHistory(userId);
      return history?.personalization || null;
    } catch (error) {
      console.error('Failed to load user personalization:', error);
      return null;
    }
  }

  /**
   * Save user personalization preferences
   */
  async savePersonalization(userId: string, personalization: SessionPersonalization): Promise<void> {
    try {
      console.log(`🎯 Saving personalization for user: ${userId}`);
      
      const history = await this.getUserHistory(userId);
      if (history) {
        history.personalization = personalization;
        await this.saveToLocalStorage(`emdr_history_${userId}`, JSON.stringify(history));
      }
      
      console.log('✅ Personalization saved');
      
    } catch (error) {
      console.error('Failed to save personalization:', error);
      throw error;
    }
  }

  /**
   * Get most effective BLS configurations for user
   */
  async getEffectiveBLSConfigs(userId: string, limit: number = 5): Promise<BLSConfiguration[]> {
    try {
      const history = await this.getUserHistory(userId);
      
      if (!history || !history.personalization.effectiveConfigs.blsConfigurations) {
        return [];
      }
      
      return history.personalization.effectiveConfigs.blsConfigurations.slice(0, limit);
      
    } catch (error) {
      console.error('Failed to load effective BLS configs:', error);
      return [];
    }
  }

  /**
   * Record BLS effectiveness for future personalization
   */
  async recordBLSEffectiveness(
    userId: string, 
    config: BLSConfiguration, 
    effectiveness: number,
    context: {
      phase: string;
      emotionState: string;
      sudBefore: number;
      sudAfter: number;
    }
  ): Promise<void> {
    try {
      const history = await this.getUserHistory(userId);
      if (!history) return;
      
      // Update effective configurations
      const effectiveConfigs = history.personalization.effectiveConfigs.blsConfigurations;
      
      // Add or update configuration effectiveness
      const existingIndex = effectiveConfigs.findIndex(c => 
        c.pattern === config.pattern && 
        Math.abs(c.speed - config.speed) < 0.5
      );
      
      if (existingIndex >= 0) {
        // Update existing config with weighted average
        const existing = effectiveConfigs[existingIndex];
        effectiveConfigs[existingIndex] = {
          ...config,
          // Store effectiveness as a custom property
          _effectiveness: ((existing as any)._effectiveness || 0.5 + effectiveness) / 2
        };
      } else {
        // Add new effective configuration
        effectiveConfigs.push({
          ...config,
          _effectiveness: effectiveness
        } as any);
      }
      
      // Sort by effectiveness and keep top configurations
      effectiveConfigs.sort((a, b) => ((b as any)._effectiveness || 0) - ((a as any)._effectiveness || 0));
      history.personalization.effectiveConfigs.blsConfigurations = effectiveConfigs.slice(0, 10);
      
      // Update patterns list
      if (effectiveness > 0.7) {
        const pattern = config.pattern;
        if (!history.personalization.learnedPatterns.successfulPatterns.includes(pattern)) {
          history.personalization.learnedPatterns.successfulPatterns.push(pattern);
        }
      }
      
      await this.saveToLocalStorage(`emdr_history_${userId}`, JSON.stringify(history));
      
    } catch (error) {
      console.error('Failed to record BLS effectiveness:', error);
    }
  }

  /**
   * Get session recommendations based on user history
   */
  async getSessionRecommendations(userId: string): Promise<{
    recommendedBLSConfig: BLSConfiguration;
    recommendedDuration: number; // minutes
    challengingAreas: string[];
    successfulInterventions: string[];
    personalizedThresholds: any;
  }> {
    try {
      const history = await this.getUserHistory(userId);
      
      if (!history) {
        return this.getDefaultRecommendations();
      }
      
      const personalization = history.personalization;
      
      return {
        recommendedBLSConfig: personalization.effectiveConfigs.blsConfigurations[0] || this.getDefaultBLSConfig(),
        recommendedDuration: personalization.historicalData.averageSessionDuration,
        challengingAreas: personalization.historicalData.challengingAreas,
        successfulInterventions: personalization.learnedPatterns.effectiveInterventions,
        personalizedThresholds: personalization.effectiveConfigs.emotionThresholds
      };
      
    } catch (error) {
      console.error('Failed to get session recommendations:', error);
      return this.getDefaultRecommendations();
    }
  }

  /**
   * Clean up old session data
   */
  async cleanupOldSessions(maxAge: number = 30): Promise<void> {
    try {
      console.log(`🧹 Cleaning up sessions older than ${maxAge} days`);
      
      const cutoffTime = Date.now() - (maxAge * 24 * 60 * 60 * 1000);
      const keysToRemove: string[] = [];
      
      // Check localStorage for old sessions
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('emdr_session_')) {
          try {
            const data = localStorage.getItem(key);
            if (data) {
              const sessionData = JSON.parse(data);
              if (sessionData.startTime && sessionData.startTime < cutoffTime) {
                keysToRemove.push(key);
              }
            }
          } catch (e) {
            // Invalid data, mark for removal
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove old sessions
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`✅ Cleaned up ${keysToRemove.length} old sessions`);
      
    } catch (error) {
      console.error('Failed to cleanup old sessions:', error);
    }
  }

  /**
   * Export user data for backup/transfer
   */
  async exportUserData(userId: string): Promise<{
    history: UserSessionHistory;
    sessions: EMDRSessionData[];
    exportDate: number;
    version: string;
  }> {
    try {
      console.log(`📤 Exporting data for user: ${userId}`);
      
      const history = await this.getUserHistory(userId);
      const sessions: EMDRSessionData[] = [];
      
      // Load all user sessions
      if (history) {
        for (const entry of history.recentSessions) {
          const sessionData = await this.loadSession(entry.sessionId);
          if (sessionData) {
            sessions.push(sessionData);
          }
        }
      }
      
      return {
        history: history || this.createEmptyUserHistory(userId),
        sessions,
        exportDate: Date.now(),
        version: '1.0'
      };
      
    } catch (error) {
      console.error('Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Import user data from backup
   */
  async importUserData(data: {
    history: UserSessionHistory;
    sessions: EMDRSessionData[];
    exportDate: number;
    version: string;
  }): Promise<void> {
    try {
      console.log('📥 Importing user data...');
      
      // Save history
      await this.saveToLocalStorage(`emdr_history_${data.history.userId}`, JSON.stringify(data.history));
      
      // Save sessions
      for (const session of data.sessions) {
        await this.saveSession(session);
      }
      
      console.log(`✅ Imported ${data.sessions.length} sessions and history`);
      
    } catch (error) {
      console.error('Failed to import user data:', error);
      throw error;
    }
  }

  // === Private Helper Methods ===

  private prepareSessionDataForStorage(sessionData: EMDRSessionData): any {
    const prepared = { ...sessionData };
    
    // Add metadata
    prepared.savedAt = Date.now();
    prepared.version = '1.0';
    
    // Compress if enabled
    if (this.config.enableCompression) {
      // Simple compression: remove verbose emotion history if too large
      if (prepared.emotionHistory && prepared.emotionHistory.length > 100) {
        prepared.emotionHistory = prepared.emotionHistory.slice(-50); // Keep last 50
      }
    }
    
    return prepared;
  }

  private parseSessionDataFromStorage(data: string): EMDRSessionData {
    const parsed = JSON.parse(data);
    
    // Migrate old versions if needed
    if (!parsed.version) {
      console.log('📈 Migrating session data to current version');
      // Add migration logic here if needed
    }
    
    return parsed;
  }

  private async saveToLocalStorage(key: string, data: any): Promise<void> {
    try {
      const serialized = typeof data === 'string' ? data : JSON.stringify(data);
      
      if (this.config.enableEncryption && this.encryptionKey) {
        // Simple encryption placeholder
        const encrypted = btoa(serialized); // Base64 encoding as placeholder
        localStorage.setItem(key, encrypted);
      } else {
        localStorage.setItem(key, serialized);
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('🚨 LocalStorage quota exceeded, cleaning up...');
        await this.cleanupOldSessions(7); // Clean sessions older than 7 days
        
        // Try again
        const serialized = typeof data === 'string' ? data : JSON.stringify(data);
        localStorage.setItem(key, serialized);
      } else {
        throw error;
      }
    }
  }

  private async loadFromLocalStorage(key: string): Promise<string | null> {
    try {
      const data = localStorage.getItem(key);
      
      if (!data) return null;
      
      if (this.config.enableEncryption && this.encryptionKey) {
        // Simple decryption placeholder
        return atob(data); // Base64 decoding as placeholder
      } else {
        return data;
      }
      
    } catch (error) {
      console.error(`Failed to load from localStorage: ${key}`, error);
      return null;
    }
  }

  private async saveToRemoteStorage(sessionData: EMDRSessionData): Promise<void> {
    // Placeholder for remote storage implementation
    console.log('🌐 Remote storage save (placeholder)');
    
    // TODO: Implement actual remote storage
    // This could be a REST API, Firebase, or other cloud storage
  }

  private async loadFromRemoteStorage(sessionId: string): Promise<EMDRSessionData | null> {
    // Placeholder for remote storage implementation
    console.log('🌐 Remote storage load (placeholder)');
    return null;
  }

  private async updateSessionHistory(sessionData: EMDRSessionData): Promise<void> {
    try {
      let history = await this.getUserHistory(sessionData.userId);
      
      if (!history) {
        history = this.createEmptyUserHistory(sessionData.userId);
      }
      
      // Create history entry
      const entry: SessionHistoryEntry = {
        sessionId: sessionData.sessionId,
        userId: sessionData.userId,
        startTime: sessionData.startTime,
        endTime: sessionData.endTime || Date.now(),
        phase: sessionData.currentPhase,
        sudReduction: sessionData.metrics.sudReduction,
        vocImprovement: sessionData.metrics.vocImprovement,
        duration: (sessionData.endTime || Date.now() - sessionData.startTime) / 60000, // minutes
        completed: sessionData.sessionState === 'completed',
        targetMemory: {
          description: sessionData.targetMemory.description,
          initialSUD: sessionData.targetMemory.initialSUD,
          finalSUD: sessionData.targetMemory.currentSUD
        }
      };
      
      // Add to recent sessions
      history.recentSessions.unshift(entry);
      
      // Keep only recent sessions
      history.recentSessions = history.recentSessions.slice(0, this.config.maxHistoryEntries);
      
      // Update statistics
      history.totalSessions++;
      if (entry.completed) {
        history.completedSessions++;
      }
      
      // Update averages
      const completedSessions = history.recentSessions.filter(s => s.completed);
      if (completedSessions.length > 0) {
        history.averageSessionDuration = completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length;
        history.averageSUDReduction = completedSessions.reduce((sum, s) => sum + s.sudReduction, 0) / completedSessions.length;
        history.averageVOCImprovement = completedSessions.reduce((sum, s) => sum + s.vocImprovement, 0) / completedSessions.length;
      }
      
      // Save updated history
      await this.saveToLocalStorage(`emdr_history_${sessionData.userId}`, JSON.stringify(history));
      
    } catch (error) {
      console.error('Failed to update session history:', error);
    }
  }

  private async updatePersonalization(sessionData: EMDRSessionData): Promise<void> {
    try {
      let history = await this.getUserHistory(sessionData.userId);
      
      if (!history) {
        history = this.createEmptyUserHistory(sessionData.userId);
      }
      
      // Merge session personalization
      const sessionPersonalization = sessionData.personalization;
      const currentPersonalization = history.personalization;
      
      // Update preferences (latest wins)
      currentPersonalization.preferences = {
        ...currentPersonalization.preferences,
        ...sessionPersonalization.preferences
      };
      
      // Merge effective configurations
      currentPersonalization.effectiveConfigs.blsConfigurations = [
        ...sessionPersonalization.effectiveConfigs.blsConfigurations,
        ...currentPersonalization.effectiveConfigs.blsConfigurations
      ].slice(0, 10); // Keep top 10
      
      // Update learned patterns
      const learnedPatterns = currentPersonalization.learnedPatterns;
      sessionPersonalization.learnedPatterns.effectiveInterventions.forEach(intervention => {
        if (!learnedPatterns.effectiveInterventions.includes(intervention)) {
          learnedPatterns.effectiveInterventions.push(intervention);
        }
      });
      
      // Update historical data with weighted averages
      const historical = currentPersonalization.historicalData;
      const sessionHistorical = sessionPersonalization.historicalData;
      
      historical.averageSessionDuration = (historical.averageSessionDuration + sessionHistorical.averageSessionDuration) / 2;
      historical.typicalSUDReduction = (historical.typicalSUDReduction + sessionHistorical.typicalSUDReduction) / 2;
      historical.averageVOCGain = (historical.averageVOCGain + sessionHistorical.averageVOCGain) / 2;
      
      // Save updated history
      await this.saveToLocalStorage(`emdr_history_${sessionData.userId}`, JSON.stringify(history));
      
    } catch (error) {
      console.error('Failed to update personalization:', error);
    }
  }

  private createEmptyUserHistory(userId: string): UserSessionHistory {
    return {
      userId,
      totalSessions: 0,
      completedSessions: 0,
      averageSessionDuration: 60,
      averageSUDReduction: 5,
      averageVOCImprovement: 4,
      mostEffectiveBLSPatterns: ['horizontal'],
      challengingPhases: [],
      recentSessions: [],
      personalization: {
        userId,
        preferences: {
          preferredBLSPatterns: ['horizontal'],
          preferredAIVoice: 'therapeutic-voice',
          preferredPace: 'moderate',
          preferredCommunicationStyle: 'supportive'
        },
        effectiveConfigs: {
          blsConfigurations: [],
          emotionThresholds: {
            highAnxiety: 0.7,
            dissociation: 0.6,
            overwhelm: 0.8,
            stability: 0.3,
            engagement: 0.4,
            crisis: 0.9
          },
          aiGuidanceStyles: ['supportive'],
          voiceInteractionSettings: {}
        },
        learnedPatterns: {
          emotionalTriggers: [],
          effectiveInterventions: [],
          optimalSessionTiming: 60,
          preferredPhaseTransitions: {} as any
        },
        historicalData: {
          averageSessionDuration: 60,
          typicalSUDReduction: 5,
          averageVOCGain: 4,
          successfulPatterns: [],
          challengingAreas: []
        }
      }
    };
  }

  private getDefaultRecommendations() {
    return {
      recommendedBLSConfig: this.getDefaultBLSConfig(),
      recommendedDuration: 60,
      challengingAreas: [],
      successfulInterventions: ['safe-place', 'breathing'],
      personalizedThresholds: {
        highAnxiety: 0.7,
        dissociation: 0.6,
        overwhelm: 0.8,
        stability: 0.3,
        engagement: 0.4,
        crisis: 0.9
      }
    };
  }

  private getDefaultBLSConfig(): BLSConfiguration {
    return {
      speed: 5,
      pattern: 'horizontal',
      color: '#3b82f6',
      size: 20,
      adaptiveMode: true,
      emotionMapping: true,
      therapeuticMode: 'standard',
      sessionPhase: 'preparation'
    };
  }
}

// Export singleton instance
export const sessionPersistence = new EMDRSessionPersistence();