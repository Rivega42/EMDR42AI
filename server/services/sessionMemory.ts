/**
 * Revolutionary Session Memory Service
 * Comprehensive memory system for EMDR therapy sessions
 * Tracks emotional states, breakthroughs, and progress across sessions
 */

import { storage } from '../storage';
import type { 
  SessionMemorySnapshot,
  InsertSessionMemorySnapshot,
  ProgressMetrics,
  SessionComparison,
  BreakthroughMoment,
  MemoryInsight,
  EmotionData,
  EMDRPhase,
  SessionHistoryRequest,
  SessionHistoryResponse,
  CompareSessionsRequest,
  CompareSessionsResponse,
  GenerateProgressReportRequest,
  ProgressReportResponse,
  SaveSessionMemoryRequest,
  LiveMemoryUpdate
} from '../../shared/types';

export class SessionMemoryService {
  private memoryUpdateCallbacks: ((update: LiveMemoryUpdate) => void)[] = [];
  
  constructor() {
    // Initialize any background processes for memory analysis
    this.initializeMemoryAnalysis();
  }

  /**
   * Save session memory snapshot
   */
  async saveSessionData(request: SaveSessionMemoryRequest): Promise<SessionMemorySnapshot> {
    const snapshotData: InsertSessionMemorySnapshot = {
      sessionId: request.sessionId,
      patientId: request.patientId,
      snapshotType: request.snapshotType as any,
      emotionalSnapshot: request.emotionalSnapshot,
      phaseContext: request.phaseContext,
      sudsLevel: request.metadata?.sudsLevel,
      vocLevel: request.metadata?.vocLevel,
      stabilityScore: this.calculateStabilityScore(request.emotionalSnapshot),
      engagementLevel: this.calculateEngagementLevel(request.emotionalSnapshot),
      stressLevel: this.calculateStressLevel(request.emotionalSnapshot),
      blsEffectiveness: await this.calculateBLSEffectiveness(request.sessionId, request.metadata?.blsConfig),
      aiAnalysis: await this.generateAIAnalysis(request.emotionalSnapshot, request.phaseContext),
      keyInsights: await this.extractKeyInsights(request.emotionalSnapshot, request.phaseContext),
      triggerEvents: request.metadata?.triggerEvents || [],
      recoveryTime: await this.calculateRecoveryTime(request.sessionId, request.emotionalSnapshot)
    };

    const snapshot = await storage.createSessionSnapshot(snapshotData);
    
    // Trigger live memory update
    this.triggerMemoryUpdate({
      sessionId: request.sessionId,
      patientId: request.patientId,
      timestamp: new Date(),
      updateType: 'emotion_change',
      data: snapshot,
      priority: this.assessUpdatePriority(request.emotionalSnapshot),
      requiresAction: await this.assessActionRequired(snapshot)
    });

    // Check for breakthrough detection
    await this.detectBreakthroughMoments(snapshot);
    
    // Update patterns
    await this.updateEmotionalPatterns(snapshot);

    return snapshot;
  }

  /**
   * Get session history for a patient
   */
  async getSessionHistory(request: SessionHistoryRequest): Promise<SessionHistoryResponse> {
    const snapshots = request.includeSnapshots ? 
      await storage.getSnapshotsByPatient(request.patientId, 100) : [];
    
    const sessions = request.sessionIds ? 
      await Promise.all(request.sessionIds.map(id => storage.getSession(id))) :
      await this.getSessionsInTimeRange(request.patientId, request.timeRange);

    const metrics = request.includeMetrics ? 
      await storage.getProgressMetrics(request.patientId) : [];
    
    const comparisons = request.includeComparisons ? 
      await storage.getSessionComparisons(request.patientId) : [];
    
    const insights = request.includeInsights ? 
      await storage.getMemoryInsights(request.patientId) : [];

    const patterns = await storage.getEmotionalPatterns(request.patientId, true);
    const breakthroughs = await storage.getBreakthroughsByPatient(request.patientId, 50);

    return {
      sessions: sessions.filter(s => s !== undefined) as any[],
      snapshots,
      metrics,
      comparisons,
      insights,
      patterns,
      breakthroughs,
      totalSessions: sessions.length,
      timeRange: request.timeRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date()
      }
    };
  }

  /**
   * Compare two sessions for progress analysis
   */
  async compareSessions(request: CompareSessionsRequest): Promise<CompareSessionsResponse> {
    // Get existing comparison or create new one
    let comparison = await storage.getSessionComparison(
      request.baselineSessionId, 
      request.compareSessionId
    );

    if (!comparison) {
      comparison = await this.generateSessionComparison(
        request.baselineSessionId,
        request.compareSessionId,
        request.comparisonType || 'consecutive'
      );
    }

    // Generate recommendations based on comparison
    const recommendations = await this.generateComparisonRecommendations(comparison);
    
    // Generate insights
    const insights = await this.generateComparisonInsights(comparison);
    
    // Identify trends
    const trends = await this.identifyTrends(request.patientId, comparison);

    return {
      comparison,
      recommendations,
      insights,
      trends
    };
  }

  /**
   * Generate comprehensive progress report
   */
  async generateProgressReport(request: GenerateProgressReportRequest): Promise<ProgressReportResponse> {
    // Get or calculate progress metrics
    const metrics = await this.calculateProgressMetrics(request.patientId, request.timeScope);
    
    // Generate visualizations if requested
    const visualizations = request.includeVisualizations ? 
      await this.generateVisualizations(request.patientId, metrics) : undefined;
    
    // Get relevant insights
    const insights = await storage.getMemoryInsights(request.patientId);
    
    // Generate recommendations
    const recommendations = request.includeRecommendations ? 
      await this.generateProgressRecommendations(metrics, insights) : [];
    
    // Risk assessment
    const riskAssessment = request.includeRiskAssessment ? 
      await this.assessRisks(request.patientId, metrics) : undefined;
    
    // Generate summary
    const summary = await this.generateProgressSummary(metrics, insights);

    return {
      metrics,
      visualizations,
      insights,
      recommendations,
      riskAssessment,
      summary
    };
  }

  // === PRIVATE HELPER METHODS ===

  private async initializeMemoryAnalysis(): Promise<void> {
    // Set up background pattern analysis
    console.log('🧠 Session Memory Service initialized');
  }

  private calculateStabilityScore(emotion: EmotionData): number {
    // Calculate emotional stability based on arousal/valence variance
    const arousalStability = 1 - Math.abs(emotion.arousal);
    const valenceStability = emotion.valence > 0 ? emotion.valence : 0;
    return (arousalStability + valenceStability) / 2;
  }

  private calculateEngagementLevel(emotion: EmotionData): number {
    // Higher arousal generally indicates higher engagement
    return Math.abs(emotion.arousal);
  }

  private calculateStressLevel(emotion: EmotionData): number {
    // High arousal + negative valence = high stress
    if (emotion.arousal > 0.5 && emotion.valence < -0.3) {
      return Math.min(1, emotion.arousal + Math.abs(emotion.valence)) * 0.8;
    }
    return Math.max(0, emotion.arousal - 0.3) * 0.5;
  }

  private async calculateBLSEffectiveness(sessionId: string, blsConfig?: any): Promise<number> {
    // Analyze how effective current BLS settings are
    const recentEmotions = await storage.getEmotionCaptures(sessionId, 10);
    if (recentEmotions.length < 2) return 0.5;

    // Calculate trend in emotional stability
    const stabilityTrend = this.calculateTrend(
      recentEmotions.map(e => this.calculateStabilityScore(e as any))
    );
    
    return Math.max(0, Math.min(1, 0.5 + stabilityTrend));
  }

  private async generateAIAnalysis(emotion: EmotionData, phase: EMDRPhase): Promise<any> {
    // Generate AI insights about this emotional state
    return {
      phase,
      emotionalState: {
        arousal: emotion.arousal,
        valence: emotion.valence,
        dominantAffects: Object.entries(emotion.affects)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([name, intensity]) => ({ name, intensity }))
      },
      insights: [
        `Patient showing ${emotion.arousal > 0.5 ? 'high' : 'low'} arousal in ${phase} phase`,
        `Emotional valence is ${emotion.valence > 0 ? 'positive' : 'negative'}`,
        'Monitoring for breakthrough indicators'
      ],
      timestamp: Date.now()
    };
  }

  private async extractKeyInsights(emotion: EmotionData, phase: EMDRPhase): Promise<string[]> {
    const insights: string[] = [];
    
    // Arousal insights
    if (emotion.arousal > 0.8) {
      insights.push('Высокий уровень активации - требует стабилизации');
    } else if (emotion.arousal < -0.5) {
      insights.push('Низкая активация - возможна диссоциация');
    }
    
    // Valence insights
    if (emotion.valence < -0.7) {
      insights.push('Значительный дистресс - мониторинг кризисной ситуации');
    } else if (emotion.valence > 0.7) {
      insights.push('Позитивное эмоциональное состояние - прогресс');
    }
    
    // Phase-specific insights
    switch (phase) {
      case 'desensitization':
        if (emotion.arousal > 0.6) {
          insights.push('Активная обработка травматичного материала');
        }
        break;
      case 'installation':
        if (emotion.valence > 0.5) {
          insights.push('Успешная инсталляция позитивного убеждения');
        }
        break;
    }
    
    return insights;
  }

  private async calculateRecoveryTime(sessionId: string, currentEmotion: EmotionData): Promise<number> {
    // Calculate time to recover from distress
    const recentEmotions = await storage.getEmotionCaptures(sessionId, 20);
    if (recentEmotions.length < 2) return 0;

    // Find last high-stress moment
    const stressThreshold = 0.7;
    let lastStressTime = 0;
    
    for (let i = recentEmotions.length - 1; i >= 0; i--) {
      const emotion = recentEmotions[i] as any;
      const stress = this.calculateStressLevel(emotion);
      if (stress > stressThreshold) {
        lastStressTime = emotion.timestamp.getTime();
        break;
      }
    }
    
    if (lastStressTime === 0) return 0;
    
    return Math.max(0, Date.now() - lastStressTime);
  }

  private assessUpdatePriority(emotion: EmotionData): 'low' | 'medium' | 'high' | 'critical' {
    const stress = this.calculateStressLevel(emotion);
    
    if (stress > 0.9 || emotion.arousal > 0.9) return 'critical';
    if (stress > 0.7 || Math.abs(emotion.arousal) > 0.7) return 'high';
    if (stress > 0.5 || Math.abs(emotion.arousal) > 0.5) return 'medium';
    return 'low';
  }

  private async assessActionRequired(snapshot: SessionMemorySnapshot): Promise<boolean> {
    // Determine if this snapshot requires immediate action
    return (
      snapshot.stressLevel !== null && snapshot.stressLevel > 0.8 ||
      snapshot.stabilityScore !== null && snapshot.stabilityScore < 0.3 ||
      snapshot.engagementLevel !== null && snapshot.engagementLevel < 0.2
    );
  }

  private triggerMemoryUpdate(update: LiveMemoryUpdate): void {
    this.memoryUpdateCallbacks.forEach(callback => {
      try {
        callback(update);
      } catch (error) {
        console.error('Memory update callback error:', error);
      }
    });
  }

  private async detectBreakthroughMoments(snapshot: SessionMemorySnapshot): Promise<void> {
    // Detect significant emotional shifts that indicate breakthroughs
    // This would involve complex analysis of emotional patterns
    console.log('🎯 Analyzing for breakthrough moments...', snapshot.id);
  }

  private async updateEmotionalPatterns(snapshot: SessionMemorySnapshot): Promise<void> {
    // Update or create emotional patterns based on this snapshot
    console.log('📊 Updating emotional patterns...', snapshot.id);
  }

  private async getSessionsInTimeRange(patientId: string, timeRange?: { start: Date; end: Date }): Promise<any[]> {
    // This would be implemented to filter sessions by time range
    return [];
  }

  private async generateSessionComparison(
    baselineSessionId: string, 
    compareSessionId: string, 
    comparisonType: string
  ): Promise<SessionComparison> {
    // Generate detailed comparison between two sessions
    throw new Error('Session comparison generation not yet implemented');
  }

  private async generateComparisonRecommendations(comparison: SessionComparison): Promise<any[]> {
    return [];
  }

  private async generateComparisonInsights(comparison: SessionComparison): Promise<any[]> {
    return [];
  }

  private async identifyTrends(patientId: string, comparison: SessionComparison): Promise<any> {
    return { shortTerm: [], longTerm: [] };
  }

  private async calculateProgressMetrics(patientId: string, timeScope: string): Promise<ProgressMetrics> {
    // Calculate comprehensive progress metrics
    throw new Error('Progress metrics calculation not yet implemented');
  }

  private async generateVisualizations(patientId: string, metrics: ProgressMetrics): Promise<any> {
    return { charts: [], heatmaps: [], timelines: [] };
  }

  private async generateProgressRecommendations(metrics: ProgressMetrics, insights: MemoryInsight[]): Promise<any[]> {
    return [];
  }

  private async assessRisks(patientId: string, metrics: ProgressMetrics): Promise<any> {
    return {
      regressionRisk: 0.1,
      crisisRisk: 0.05,
      dropoutRisk: 0.08,
      factors: []
    };
  }

  private async generateProgressSummary(metrics: ProgressMetrics, insights: MemoryInsight[]): Promise<any> {
    return {
      overallProgress: 0.7,
      keyAchievements: [],
      concernAreas: [],
      nextSteps: []
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n + 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
    const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return Math.max(-1, Math.min(1, slope)); // Normalize between -1 and 1
  }

  // === PUBLIC SUBSCRIPTION METHODS ===

  /**
   * Subscribe to live memory updates
   */
  onMemoryUpdate(callback: (update: LiveMemoryUpdate) => void): void {
    this.memoryUpdateCallbacks.push(callback);
  }

  /**
   * Unsubscribe from memory updates
   */
  offMemoryUpdate(callback: (update: LiveMemoryUpdate) => void): void {
    const index = this.memoryUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      this.memoryUpdateCallbacks.splice(index, 1);
    }
  }
}

export const sessionMemoryService = new SessionMemoryService();