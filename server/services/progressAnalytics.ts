/**
 * Revolutionary Progress Analytics Service
 * Advanced analytics and pattern recognition for EMDR therapy progress
 * Provides predictive insights and trend analysis
 */

import { storage } from '../storage';
import { sessionMemoryService } from './sessionMemory';
import type { 
  ProgressMetrics,
  ProgressMetricData,
  EmotionalPattern,
  MemoryInsight,
  EmotionData,
  EMDRPhase,
  SessionMemorySnapshot,
  BreakthroughMoment
} from '../../shared/types';

export class ProgressAnalyticsService {
  private analyticsCallbacks: ((insight: MemoryInsight) => void)[] = [];
  
  constructor() {
    this.initializeAnalytics();
  }

  /**
   * Analyze emotional trends for a patient
   */
  async analyzeTrends(patientId: string, timeWindow: string = 'month'): Promise<{
    sudsProgress: ProgressMetricData;
    vocProgress: ProgressMetricData;
    emotionalStability: any;
    riskFactors: string[];
    improvements: string[];
  }> {
    const snapshots = await storage.getSnapshotsByPatient(patientId, 100);
    
    if (snapshots.length < 2) {
      return this.getDefaultTrendAnalysis();
    }

    // Analyze SUDS progression
    const sudsValues = snapshots
      .filter(s => s.sudsLevel !== null)
      .map(s => s.sudsLevel!)
      .filter(v => v !== undefined);
    
    const sudsProgress = this.calculateProgressMetric(sudsValues);

    // Analyze VOC progression  
    const vocValues = snapshots
      .filter(s => s.vocLevel !== null)
      .map(s => s.vocLevel!)
      .filter(v => v !== undefined);
    
    const vocProgress = this.calculateProgressMetric(vocValues);

    // Analyze emotional stability
    const emotionalStability = this.analyzeEmotionalStability(snapshots);

    // Identify risk factors
    const riskFactors = await this.identifyRiskFactors(patientId, snapshots);

    // Identify improvements
    const improvements = await this.identifyImprovements(snapshots);

    return {
      sudsProgress,
      vocProgress,
      emotionalStability,
      riskFactors,
      improvements
    };
  }

  /**
   * Identify emotional and behavioral patterns
   */
  async identifyPatterns(patientId: string): Promise<EmotionalPattern[]> {
    const snapshots = await storage.getSnapshotsByPatient(patientId, 200);
    const patterns: EmotionalPattern[] = [];

    // Trigger-response patterns
    const triggerPatterns = await this.identifyTriggerPatterns(snapshots);
    patterns.push(...triggerPatterns);

    // Recovery cycle patterns
    const recoveryPatterns = await this.identifyRecoveryPatterns(snapshots);
    patterns.push(...recoveryPatterns);

    // Stability trend patterns
    const stabilityPatterns = await this.identifyStabilityPatterns(snapshots);
    patterns.push(...stabilityPatterns);

    // Breakthrough precursor patterns
    const breakthroughPatterns = await this.identifyBreakthroughPatterns(patientId, snapshots);
    patterns.push(...breakthroughPatterns);

    // Save new patterns to storage
    for (const pattern of patterns) {
      await this.savePatternIfNew(pattern);
    }

    return patterns;
  }

  /**
   * Predict potential challenges and opportunities
   */
  async predictChallenges(patientId: string): Promise<{
    challenges: Array<{
      type: string;
      probability: number;
      description: string;
      timeline: string;
      mitigationStrategies: string[];
    }>;
    opportunities: Array<{
      type: string;
      probability: number;
      description: string;
      timeline: string;
      actionSteps: string[];
    }>;
    confidence: number;
  }> {
    const patterns = await storage.getEmotionalPatterns(patientId, true);
    const recentSnapshots = await storage.getSnapshotsByPatient(patientId, 50);
    const progressMetrics = await storage.getProgressMetrics(patientId);

    const challenges = await this.predictPotentialChallenges(patterns, recentSnapshots, progressMetrics);
    const opportunities = await this.predictPotentialOpportunities(patterns, recentSnapshots, progressMetrics);
    const confidence = this.calculatePredictionConfidence(patterns, recentSnapshots);

    return {
      challenges,
      opportunities,
      confidence
    };
  }

  /**
   * Generate comprehensive patient insights
   */
  async generateInsights(patientId: string): Promise<MemoryInsight[]> {
    const insights: MemoryInsight[] = [];

    // Pattern analysis insights
    const patternInsights = await this.generatePatternInsights(patientId);
    insights.push(...patternInsights);

    // Progress summary insights
    const progressInsights = await this.generateProgressInsights(patientId);
    insights.push(...progressInsights);

    // Prediction insights
    const predictionInsights = await this.generatePredictionInsights(patientId);
    insights.push(...predictionInsights);

    // Risk assessment insights
    const riskInsights = await this.generateRiskInsights(patientId);
    insights.push(...riskInsights);

    // Save insights to storage
    for (const insight of insights) {
      await storage.createMemoryInsight({
        patientId,
        insightType: insight.insightType,
        timeScope: insight.timeScope,
        insightData: insight.insightData,
        confidence: insight.confidence,
        relevanceScore: insight.relevanceScore,
        actionable: insight.actionable,
        recommendations: insight.recommendations,
        dataSource: insight.dataSource,
        calculationMethod: insight.calculationMethod,
        expiresAt: insight.expiresAt,
        tags: insight.tags,
        priority: insight.priority
      });
    }

    return insights;
  }

  /**
   * Real-time pattern monitoring
   */
  async monitorPatterns(patientId: string, currentSnapshot: SessionMemorySnapshot): Promise<{
    matchedPatterns: EmotionalPattern[];
    newPatterns: EmotionalPattern[];
    alerts: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      recommendations: string[];
    }>;
  }> {
    const existingPatterns = await storage.getEmotionalPatterns(patientId, true);
    const matchedPatterns: EmotionalPattern[] = [];
    const newPatterns: EmotionalPattern[] = [];
    const alerts: any[] = [];

    // Check against existing patterns
    for (const pattern of existingPatterns) {
      const isMatch = await this.checkPatternMatch(pattern, currentSnapshot);
      if (isMatch) {
        matchedPatterns.push(pattern);
        await storage.updatePatternOccurrence(pattern.id);

        // Generate alerts if pattern indicates risk
        if (pattern.riskLevel === 'high' || pattern.patternType === 'regression_warning') {
          alerts.push({
            type: 'pattern_match',
            severity: pattern.riskLevel === 'high' ? 'high' : 'medium',
            message: `Pattern detected: ${pattern.patternName}`,
            recommendations: this.getPatternRecommendations(pattern)
          });
        }
      }
    }

    // Check for new patterns
    const potentialNewPatterns = await this.detectNewPatterns(patientId, currentSnapshot);
    newPatterns.push(...potentialNewPatterns);

    return {
      matchedPatterns,
      newPatterns,
      alerts
    };
  }

  // === PRIVATE HELPER METHODS ===

  private async initializeAnalytics(): Promise<void> {
    console.log('📊 Progress Analytics Service initialized');
    
    // Set up periodic analytics updates
    setInterval(async () => {
      await this.performBackgroundAnalytics();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private calculateProgressMetric(values: number[]): ProgressMetricData {
    if (values.length === 0) {
      return {
        initial: 0,
        final: 0,
        change: 0,
        trend: 0,
        variance: 0,
        stability: 0
      };
    }

    const initial = values[0];
    const final = values[values.length - 1];
    const change = final - initial;
    const trend = this.calculateTrend(values);
    const variance = this.calculateVariance(values);
    const stability = 1 - (variance / Math.max(1, Math.max(...values) - Math.min(...values)));

    return {
      initial,
      final,
      change,
      trend,
      variance,
      stability: Math.max(0, Math.min(1, stability))
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

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  private analyzeEmotionalStability(snapshots: SessionMemorySnapshot[]): any {
    const stabilityScores = snapshots
      .filter(s => s.stabilityScore !== null)
      .map(s => s.stabilityScore!);

    const arousalValues = snapshots
      .map(s => s.emotionalSnapshot.arousal);

    const valenceValues = snapshots
      .map(s => s.emotionalSnapshot.valence);

    return {
      overall: this.calculateProgressMetric(stabilityScores),
      arousal: this.calculateProgressMetric(arousalValues),
      valence: this.calculateProgressMetric(valenceValues)
    };
  }

  private async identifyRiskFactors(patientId: string, snapshots: SessionMemorySnapshot[]): Promise<string[]> {
    const riskFactors: string[] = [];

    // High stress persistence
    const highStressSnapshots = snapshots.filter(s => 
      s.stressLevel !== null && s.stressLevel > 0.7
    );
    if (highStressSnapshots.length > snapshots.length * 0.3) {
      riskFactors.push('Persistent high stress levels');
    }

    // Low engagement
    const lowEngagementSnapshots = snapshots.filter(s => 
      s.engagementLevel !== null && s.engagementLevel < 0.3
    );
    if (lowEngagementSnapshots.length > snapshots.length * 0.4) {
      riskFactors.push('Low patient engagement');
    }

    // Poor stability
    const unstableSnapshots = snapshots.filter(s => 
      s.stabilityScore !== null && s.stabilityScore < 0.4
    );
    if (unstableSnapshots.length > snapshots.length * 0.5) {
      riskFactors.push('Emotional instability');
    }

    return riskFactors;
  }

  private async identifyImprovements(snapshots: SessionMemorySnapshot[]): Promise<string[]> {
    const improvements: string[] = [];

    // Stability improvements
    const stabilityTrend = this.calculateTrend(
      snapshots
        .filter(s => s.stabilityScore !== null)
        .map(s => s.stabilityScore!)
    );
    if (stabilityTrend > 0.3) {
      improvements.push('Improving emotional stability');
    }

    // Stress reduction
    const stressTrend = this.calculateTrend(
      snapshots
        .filter(s => s.stressLevel !== null)
        .map(s => s.stressLevel!)
    );
    if (stressTrend < -0.3) {
      improvements.push('Decreasing stress levels');
    }

    // Engagement increase
    const engagementTrend = this.calculateTrend(
      snapshots
        .filter(s => s.engagementLevel !== null)
        .map(s => s.engagementLevel!)
    );
    if (engagementTrend > 0.3) {
      improvements.push('Increasing patient engagement');
    }

    return improvements;
  }

  private getDefaultTrendAnalysis(): any {
    return {
      sudsProgress: {
        initial: 8,
        final: 8,
        change: 0,
        trend: 0,
        variance: 0,
        stability: 0.5
      },
      vocProgress: {
        initial: 3,
        final: 3,
        change: 0,
        trend: 0,
        variance: 0,
        stability: 0.5
      },
      emotionalStability: {
        overall: { trend: 0, stability: 0.5 },
        arousal: { trend: 0, stability: 0.5 },
        valence: { trend: 0, stability: 0.5 }
      },
      riskFactors: [],
      improvements: []
    };
  }

  // Placeholder methods for pattern identification
  private async identifyTriggerPatterns(snapshots: SessionMemorySnapshot[]): Promise<EmotionalPattern[]> {
    return [];
  }

  private async identifyRecoveryPatterns(snapshots: SessionMemorySnapshot[]): Promise<EmotionalPattern[]> {
    return [];
  }

  private async identifyStabilityPatterns(snapshots: SessionMemorySnapshot[]): Promise<EmotionalPattern[]> {
    return [];
  }

  private async identifyBreakthroughPatterns(patientId: string, snapshots: SessionMemorySnapshot[]): Promise<EmotionalPattern[]> {
    return [];
  }

  private async savePatternIfNew(pattern: EmotionalPattern): Promise<void> {
    // Check if pattern already exists and save if new
  }

  private async predictPotentialChallenges(patterns: EmotionalPattern[], snapshots: SessionMemorySnapshot[], metrics: any[]): Promise<any[]> {
    return [];
  }

  private async predictPotentialOpportunities(patterns: EmotionalPattern[], snapshots: SessionMemorySnapshot[], metrics: any[]): Promise<any[]> {
    return [];
  }

  private calculatePredictionConfidence(patterns: EmotionalPattern[], snapshots: SessionMemorySnapshot[]): number {
    return 0.7; // Placeholder
  }

  private async generatePatternInsights(patientId: string): Promise<MemoryInsight[]> {
    return [];
  }

  private async generateProgressInsights(patientId: string): Promise<MemoryInsight[]> {
    return [];
  }

  private async generatePredictionInsights(patientId: string): Promise<MemoryInsight[]> {
    return [];
  }

  private async generateRiskInsights(patientId: string): Promise<MemoryInsight[]> {
    return [];
  }

  private async checkPatternMatch(pattern: EmotionalPattern, snapshot: SessionMemorySnapshot): Promise<boolean> {
    // Simplified pattern matching
    return false;
  }

  private async detectNewPatterns(patientId: string, snapshot: SessionMemorySnapshot): Promise<EmotionalPattern[]> {
    return [];
  }

  private getPatternRecommendations(pattern: EmotionalPattern): string[] {
    return [`Address ${pattern.patternType} pattern`, 'Monitor closely', 'Apply targeted intervention'];
  }

  private async performBackgroundAnalytics(): Promise<void> {
    console.log('🔄 Performing background analytics...');
  }

  // === PUBLIC SUBSCRIPTION METHODS ===

  onInsightGenerated(callback: (insight: MemoryInsight) => void): void {
    this.analyticsCallbacks.push(callback);
  }

  offInsightGenerated(callback: (insight: MemoryInsight) => void): void {
    const index = this.analyticsCallbacks.indexOf(callback);
    if (index > -1) {
      this.analyticsCallbacks.splice(index, 1);
    }
  }
}

export const progressAnalyticsService = new ProgressAnalyticsService();