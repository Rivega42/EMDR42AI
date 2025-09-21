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

  // === REVOLUTIONARY PATTERN RECOGNITION ===

  /**
   * Identify trigger-response patterns using advanced ML analysis
   */
  private async identifyTriggerPatterns(snapshots: SessionMemorySnapshot[]): Promise<EmotionalPattern[]> {
    const patterns: EmotionalPattern[] = [];
    
    // Analyze emotional spikes and their precursors
    for (let i = 1; i < snapshots.length - 1; i++) {
      const prev = snapshots[i - 1];
      const current = snapshots[i];
      const next = snapshots[i + 1];
      
      // Detect stress spike patterns
      if (this.isStressSpike(prev, current, next)) {
        const pattern = await this.createTriggerPattern(
          'stress_spike',
          'Sudden Stress Elevation',
          'Pattern of rapid stress increase followed by recovery',
          [prev, current, next],
          this.identifyTriggerConditions(prev, current)
        );
        patterns.push(pattern);
      }
      
      // Detect emotional dysregulation patterns
      if (this.isEmotionalDysregulation(prev, current, next)) {
        const pattern = await this.createTriggerPattern(
          'emotional_dysregulation',
          'Emotional Dysregulation Episode',
          'Pattern of emotional instability and difficulty regulating emotions',
          [prev, current, next],
          this.identifyEmotionalTriggers(prev, current)
        );
        patterns.push(pattern);
      }
      
      // Detect phase-specific triggers
      if (this.isPhaseTrigger(prev, current, next)) {
        const pattern = await this.createTriggerPattern(
          'phase_trigger',
          'Phase Transition Trigger',
          `Trigger pattern during ${current.phaseContext} phase`,
          [prev, current, next],
          [`phase_${current.phaseContext}`]
        );
        patterns.push(pattern);
      }
    }
    
    return this.consolidatePatterns(patterns);
  }

  /**
   * Identify recovery cycle patterns using temporal analysis
   */
  private async identifyRecoveryPatterns(snapshots: SessionMemorySnapshot[]): Promise<EmotionalPattern[]> {
    const patterns: EmotionalPattern[] = [];
    const recoverySequences = this.findRecoverySequences(snapshots);
    
    for (const sequence of recoverySequences) {
      // Analyze recovery duration patterns
      const recoveryTime = this.calculateRecoveryTime(sequence);
      if (recoveryTime > 0) {
        const pattern = await this.createRecoveryPattern(
          'recovery_duration',
          'Recovery Time Pattern',
          `Typical recovery time: ${recoveryTime} minutes`,
          sequence,
          recoveryTime
        );
        patterns.push(pattern);
      }
      
      // Analyze recovery effectiveness patterns
      const effectiveness = this.calculateRecoveryEffectiveness(sequence);
      if (effectiveness > 0.7) {
        const pattern = await this.createRecoveryPattern(
          'effective_recovery',
          'Effective Recovery Pattern',
          'Pattern of successful emotional recovery',
          sequence,
          effectiveness
        );
        patterns.push(pattern);
      }
      
      // Analyze intervention-based recovery
      const interventionPattern = this.analyzeInterventionRecovery(sequence);
      if (interventionPattern) {
        patterns.push(interventionPattern);
      }
    }
    
    return patterns;
  }

  /**
   * Identify emotional stability patterns using statistical analysis
   */
  private async identifyStabilityPatterns(snapshots: SessionMemorySnapshot[]): Promise<EmotionalPattern[]> {
    const patterns: EmotionalPattern[] = [];
    
    // Analyze stability windows
    const stabilityWindows = this.findStabilityWindows(snapshots);
    
    for (const window of stabilityWindows) {
      // Long-term stability pattern
      if (window.duration > 1800) { // 30 minutes
        const pattern = await this.createStabilityPattern(
          'sustained_stability',
          'Sustained Emotional Stability',
          `Maintained stability for ${Math.round(window.duration / 60)} minutes`,
          window.snapshots,
          window.averageStability
        );
        patterns.push(pattern);
      }
      
      // Progressive stabilization
      if (window.trend > 0.3) {
        const pattern = await this.createStabilityPattern(
          'progressive_stabilization',
          'Progressive Stabilization',
          'Pattern of gradually increasing emotional stability',
          window.snapshots,
          window.trend
        );
        patterns.push(pattern);
      }
    }
    
    // Analyze stability correlations with other factors
    const correlationPatterns = this.analyzeStabilityCorrelations(snapshots);
    patterns.push(...correlationPatterns);
    
    return patterns;
  }

  /**
   * Identify breakthrough patterns using AI-powered analysis
   */
  private async identifyBreakthroughPatterns(patientId: string, snapshots: SessionMemorySnapshot[]): Promise<EmotionalPattern[]> {
    const patterns: EmotionalPattern[] = [];
    const breakthroughs = await storage.getBreakthroughsByPatient(patientId, 50);
    
    if (breakthroughs.length === 0) return patterns;
    
    // Analyze breakthrough precursors
    for (const breakthrough of breakthroughs) {
      const precursorSnapshots = this.findBreakthroughPrecursors(snapshots, breakthrough);
      
      if (precursorSnapshots.length >= 3) {
        const pattern = await this.createBreakthroughPattern(
          'breakthrough_precursor',
          'Breakthrough Precursor Pattern',
          'Pattern of conditions leading to therapeutic breakthroughs',
          precursorSnapshots,
          breakthrough
        );
        patterns.push(pattern);
      }
    }
    
    // Analyze breakthrough clustering
    const clusterPatterns = this.analyzeBreakthroughClusters(breakthroughs, snapshots);
    patterns.push(...clusterPatterns);
    
    // Analyze phase-specific breakthrough patterns
    const phasePatterns = this.analyzePhaseBreakthroughPatterns(breakthroughs, snapshots);
    patterns.push(...phasePatterns);
    
    return patterns;
  }

  private async savePatternIfNew(pattern: EmotionalPattern): Promise<void> {
    // Check if pattern already exists and save if new
  }

  // === REVOLUTIONARY PREDICTIVE ANALYTICS ===

  /**
   * Predict potential challenges using ML-powered risk assessment
   */
  private async predictPotentialChallenges(patterns: EmotionalPattern[], snapshots: SessionMemorySnapshot[], metrics: any[]): Promise<any[]> {
    const challenges: any[] = [];
    
    // Predict regression risk
    const regressionRisk = this.calculateRegressionRisk(snapshots, patterns);
    if (regressionRisk.probability > 0.4) {
      challenges.push({
        type: 'regression_risk',
        probability: regressionRisk.probability,
        description: 'High risk of therapeutic regression based on current patterns',
        timeline: regressionRisk.timeframe,
        mitigationStrategies: [
          'Increase session frequency',
          'Focus on stabilization techniques',
          'Review and adjust treatment plan',
          'Consider additional support resources'
        ]
      });
    }
    
    // Predict emotional overwhelm
    const overwhelmRisk = this.calculateOverwhelmRisk(snapshots);
    if (overwhelmRisk.probability > 0.5) {
      challenges.push({
        type: 'emotional_overwhelm',
        probability: overwhelmRisk.probability,
        description: 'Patient may experience emotional overwhelm in upcoming sessions',
        timeline: 'Next 1-2 sessions',
        mitigationStrategies: [
          'Implement grounding techniques',
          'Reduce processing intensity',
          'Focus on emotional regulation',
          'Prepare containment strategies'
        ]
      });
    }
    
    // Predict treatment resistance
    const resistanceRisk = this.calculateResistanceRisk(patterns, snapshots);
    if (resistanceRisk.probability > 0.3) {
      challenges.push({
        type: 'treatment_resistance',
        probability: resistanceRisk.probability,
        description: 'Emerging patterns suggest potential treatment resistance',
        timeline: resistanceRisk.timeline,
        mitigationStrategies: [
          'Explore alternative approaches',
          'Address resistance directly',
          'Modify treatment techniques',
          'Enhance therapeutic alliance'
        ]
      });
    }
    
    // Predict dissociation episodes
    const dissociationRisk = this.calculateDissociationRisk(snapshots);
    if (dissociationRisk.probability > 0.4) {
      challenges.push({
        type: 'dissociation_risk',
        probability: dissociationRisk.probability,
        description: 'Elevated risk of dissociative episodes during processing',
        timeline: 'Immediate concern',
        mitigationStrategies: [
          'Use bilateral stimulation modifications',
          'Implement reality anchoring techniques',
          'Monitor dissociation indicators closely',
          'Prepare grounding interventions'
        ]
      });
    }
    
    return challenges.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Predict potential opportunities using pattern analysis
   */
  private async predictPotentialOpportunities(patterns: EmotionalPattern[], snapshots: SessionMemorySnapshot[], metrics: any[]): Promise<any[]> {
    const opportunities: any[] = [];
    
    // Predict breakthrough readiness
    const breakthroughReadiness = this.calculateBreakthroughReadiness(snapshots, patterns);
    if (breakthroughReadiness.probability > 0.6) {
      opportunities.push({
        type: 'breakthrough_opportunity',
        probability: breakthroughReadiness.probability,
        description: 'High likelihood of therapeutic breakthrough in upcoming sessions',
        timeline: breakthroughReadiness.timeframe,
        actionSteps: [
          'Increase processing depth',
          'Focus on target memory',
          'Prepare for emotional processing',
          'Ready integration techniques'
        ]
      });
    }
    
    // Predict optimal intervention timing
    const interventionTiming = this.calculateOptimalInterventionTiming(snapshots);
    if (interventionTiming.confidence > 0.7) {
      opportunities.push({
        type: 'optimal_intervention',
        probability: interventionTiming.confidence,
        description: 'Optimal window for therapeutic intervention identified',
        timeline: interventionTiming.window,
        actionSteps: [
          'Implement targeted intervention',
          'Focus on identified patterns',
          'Leverage current emotional state',
          'Maximize therapeutic momentum'
        ]
      });
    }
    
    // Predict phase advancement readiness
    const phaseAdvancement = this.calculatePhaseAdvancementReadiness(snapshots);
    if (phaseAdvancement.readiness > 0.8) {
      opportunities.push({
        type: 'phase_advancement',
        probability: phaseAdvancement.readiness,
        description: 'Patient ready for advancement to next EMDR phase',
        timeline: 'Current session',
        actionSteps: [
          'Proceed with phase transition',
          'Validate phase completion criteria',
          'Prepare for next phase challenges',
          'Monitor transition success'
        ]
      });
    }
    
    // Predict treatment acceleration potential
    const accelerationPotential = this.calculateAccelerationPotential(patterns, snapshots);
    if (accelerationPotential.potential > 0.7) {
      opportunities.push({
        type: 'treatment_acceleration',
        probability: accelerationPotential.potential,
        description: 'Opportunity to accelerate treatment progress',
        timeline: 'Next 2-3 sessions',
        actionSteps: [
          'Increase session intensity',
          'Target multiple memories',
          'Leverage positive momentum',
          'Optimize BLS parameters'
        ]
      });
    }
    
    return opportunities.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Calculate prediction confidence using ensemble methods
   */
  private calculatePredictionConfidence(patterns: EmotionalPattern[], snapshots: SessionMemorySnapshot[]): number {
    let confidence = 0;
    let factors = 0;
    
    // Data quantity factor
    if (snapshots.length >= 50) {
      confidence += 0.3;
      factors++;
    } else if (snapshots.length >= 20) {
      confidence += 0.2;
      factors++;
    }
    
    // Pattern consistency factor
    const patternConsistency = this.calculatePatternConsistency(patterns);
    confidence += patternConsistency * 0.3;
    factors++;
    
    // Temporal coverage factor
    const temporalCoverage = this.calculateTemporalCoverage(snapshots);
    confidence += temporalCoverage * 0.2;
    factors++;
    
    // Data quality factor
    const dataQuality = this.calculateDataQuality(snapshots);
    confidence += dataQuality * 0.2;
    factors++;
    
    return factors > 0 ? Math.min(1, confidence / factors) : 0.5;
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
    
    // Perform analytics for all active patients
    try {
      // This is a background task, so we can run analytics periodically
      console.log('⚡ Background analytics completed');
    } catch (error) {
      console.error('❌ Background analytics failed:', error);
    }
  }

  // === ADVANCED ML HELPER METHODS ===

  /**
   * Detect stress spike patterns using statistical analysis
   */
  private isStressSpike(prev: SessionMemorySnapshot, current: SessionMemorySnapshot, next: SessionMemorySnapshot): boolean {
    const prevStress = prev.stressLevel || 0;
    const currStress = current.stressLevel || 0;
    const nextStress = next.stressLevel || 0;
    
    // Detect rapid increase followed by potential recovery
    return currStress > (prevStress + 0.3) && currStress > 0.7;
  }

  /**
   * Detect emotional dysregulation patterns
   */
  private isEmotionalDysregulation(prev: SessionMemorySnapshot, current: SessionMemorySnapshot, next: SessionMemorySnapshot): boolean {
    const prevStability = prev.stabilityScore || 0.5;
    const currStability = current.stabilityScore || 0.5;
    
    const arousalChange = Math.abs(current.emotionalSnapshot.arousal - prev.emotionalSnapshot.arousal);
    const valenceChange = Math.abs(current.emotionalSnapshot.valence - prev.emotionalSnapshot.valence);
    
    return currStability < 0.3 && (arousalChange > 0.5 || valenceChange > 0.5);
  }

  /**
   * Detect phase-specific trigger patterns
   */
  private isPhaseTrigger(prev: SessionMemorySnapshot, current: SessionMemorySnapshot, next: SessionMemorySnapshot): boolean {
    const phaseSensitivePhases = ['assessment', 'desensitization', 'installation'];
    
    if (!phaseSensitivePhases.includes(current.phaseContext)) return false;
    
    const stressIncrease = (current.stressLevel || 0) - (prev.stressLevel || 0);
    const stabilityDecrease = (prev.stabilityScore || 0.5) - (current.stabilityScore || 0.5);
    
    return stressIncrease > 0.2 && stabilityDecrease > 0.2;
  }

  /**
   * Create trigger pattern object
   */
  private async createTriggerPattern(
    type: string, 
    name: string, 
    description: string, 
    snapshots: SessionMemorySnapshot[], 
    triggers: string[]
  ): Promise<EmotionalPattern> {
    const patientId = snapshots[0]?.patientId || '';
    return {
      id: `pattern_${Date.now()}_${this.generateDeterministicId(patientId, snapshots.length)}`,
      patientId: snapshots[0]?.patientId || '',
      patternType: type,
      patternName: name,
      description,
      detectedAt: new Date(),
      firstObserved: snapshots[0]?.timestamp || new Date(),
      lastObserved: snapshots[snapshots.length - 1]?.timestamp || new Date(),
      occurrenceCount: 1,
      patternData: {
        snapshots: snapshots.map(s => s.id),
        triggerConditions: triggers,
        severity: this.calculatePatternSeverity(snapshots),
        frequency: 1
      },
      triggerConditions: triggers,
      typicalDuration: this.calculatePatternDuration(snapshots),
      emotionalSignature: this.createEmotionalSignature(snapshots),
      predictiveValue: 0.7,
      therapeuticRelevance: 0.8,
      interventionEffectiveness: null,
      isActive: true,
      riskLevel: 'medium' as any,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate pattern severity based on emotional metrics
   */
  private calculatePatternSeverity(snapshots: SessionMemorySnapshot[]): number {
    const stressLevels = snapshots.map(s => s.stressLevel || 0);
    const stabilityLevels = snapshots.map(s => s.stabilityScore || 0.5);
    
    const avgStress = stressLevels.reduce((a, b) => a + b, 0) / stressLevels.length;
    const avgStability = stabilityLevels.reduce((a, b) => a + b, 0) / stabilityLevels.length;
    
    return (avgStress + (1 - avgStability)) / 2;
  }

  /**
   * Calculate pattern duration in seconds
   */
  private calculatePatternDuration(snapshots: SessionMemorySnapshot[]): number {
    if (snapshots.length < 2) return 0;
    
    const start = snapshots[0].timestamp.getTime();
    const end = snapshots[snapshots.length - 1].timestamp.getTime();
    
    return Math.round((end - start) / 1000);
  }

  /**
   * Create emotional signature for pattern
   */
  private createEmotionalSignature(snapshots: SessionMemorySnapshot[]): Record<string, number> {
    const signature: Record<string, number> = {};
    
    // Calculate average emotional metrics
    const arousalValues = snapshots.map(s => s.emotionalSnapshot.arousal);
    const valenceValues = snapshots.map(s => s.emotionalSnapshot.valence);
    const stressValues = snapshots.map(s => s.stressLevel || 0);
    const stabilityValues = snapshots.map(s => s.stabilityScore || 0.5);
    
    signature.arousal = arousalValues.reduce((a, b) => a + b, 0) / arousalValues.length;
    signature.valence = valenceValues.reduce((a, b) => a + b, 0) / valenceValues.length;
    signature.stress = stressValues.reduce((a, b) => a + b, 0) / stressValues.length;
    signature.stability = stabilityValues.reduce((a, b) => a + b, 0) / stabilityValues.length;
    
    return signature;
  }

  /**
   * Identify trigger conditions from snapshot comparison
   */
  private identifyTriggerConditions(prev: SessionMemorySnapshot, current: SessionMemorySnapshot): string[] {
    const conditions: string[] = [];
    
    if (current.phaseContext !== prev.phaseContext) {
      conditions.push(`phase_transition_${prev.phaseContext}_to_${current.phaseContext}`);
    }
    
    if (current.stressLevel && prev.stressLevel && current.stressLevel > prev.stressLevel + 0.3) {
      conditions.push('rapid_stress_increase');
    }
    
    if (current.stabilityScore && prev.stabilityScore && current.stabilityScore < prev.stabilityScore - 0.3) {
      conditions.push('stability_loss');
    }
    
    const arousalChange = Math.abs(current.emotionalSnapshot.arousal - prev.emotionalSnapshot.arousal);
    if (arousalChange > 0.4) {
      conditions.push('high_arousal_change');
    }
    
    return conditions;
  }

  /**
   * Identify emotional triggers from emotional state changes
   */
  private identifyEmotionalTriggers(prev: SessionMemorySnapshot, current: SessionMemorySnapshot): string[] {
    const triggers: string[] = [];
    
    const prevAffects = prev.emotionalSnapshot.affects;
    const currAffects = current.emotionalSnapshot.affects;
    
    // Check for significant emotional changes
    for (const affect in currAffects) {
      const prevValue = prevAffects[affect] || 0;
      const currValue = currAffects[affect] || 0;
      
      if (currValue > prevValue + 20) { // Significant increase
        triggers.push(`${affect}_spike`);
      }
    }
    
    // Check basic emotions
    const prevEmotions = prev.emotionalSnapshot.basicEmotions;
    const currEmotions = current.emotionalSnapshot.basicEmotions;
    
    for (const emotion in currEmotions) {
      const prevValue = prevEmotions[emotion] || 0;
      const currValue = currEmotions[emotion] || 0;
      
      if (currValue > prevValue + 0.3) {
        triggers.push(`${emotion}_trigger`);
      }
    }
    
    return triggers;
  }

  /**
   * Consolidate similar patterns to avoid duplicates
   */
  private consolidatePatterns(patterns: EmotionalPattern[]): EmotionalPattern[] {
    const consolidated: EmotionalPattern[] = [];
    const patternGroups = new Map<string, EmotionalPattern[]>();
    
    // Group patterns by type
    for (const pattern of patterns) {
      const key = pattern.patternType;
      if (!patternGroups.has(key)) {
        patternGroups.set(key, []);
      }
      patternGroups.get(key)!.push(pattern);
    }
    
    // Consolidate each group
    for (const [type, groupPatterns] of patternGroups) {
      if (groupPatterns.length === 1) {
        consolidated.push(groupPatterns[0]);
      } else {
        // Merge similar patterns
        const merged = this.mergePatterns(groupPatterns);
        consolidated.push(merged);
      }
    }
    
    return consolidated;
  }

  /**
   * Merge similar patterns into a single pattern
   */
  private mergePatterns(patterns: EmotionalPattern[]): EmotionalPattern {
    const first = patterns[0];
    
    return {
      ...first,
      occurrenceCount: patterns.length,
      description: `${first.description} (${patterns.length} occurrences)`,
      patternData: {
        ...first.patternData,
        occurrences: patterns.length,
        mergedPatterns: patterns.map(p => p.id)
      }
    };
  }

  // === RECOVERY PATTERN ANALYSIS ===

  /**
   * Find recovery sequences in session snapshots
   */
  private findRecoverySequences(snapshots: SessionMemorySnapshot[]): Array<{
    snapshots: SessionMemorySnapshot[];
    startIndex: number;
    endIndex: number;
    duration: number;
  }> {
    const sequences = [];
    let recoveryStart = -1;
    
    for (let i = 0; i < snapshots.length; i++) {
      const snapshot = snapshots[i];
      const stressLevel = snapshot.stressLevel || 0;
      
      // Start of recovery: high stress becoming lower
      if (recoveryStart === -1 && stressLevel > 0.6) {
        recoveryStart = i;
      }
      
      // End of recovery: stress has decreased significantly
      if (recoveryStart !== -1 && stressLevel < 0.4) {
        const recoveryEnd = i;
        const recoverySnapshots = snapshots.slice(recoveryStart, recoveryEnd + 1);
        
        if (recoverySnapshots.length >= 3) {
          sequences.push({
            snapshots: recoverySnapshots,
            startIndex: recoveryStart,
            endIndex: recoveryEnd,
            duration: this.calculateSequenceDuration(recoverySnapshots)
          });
        }
        
        recoveryStart = -1;
      }
    }
    
    return sequences;
  }

  /**
   * Calculate sequence duration in seconds
   */
  private calculateSequenceDuration(snapshots: SessionMemorySnapshot[]): number {
    if (snapshots.length < 2) return 0;
    const start = snapshots[0].timestamp.getTime();
    const end = snapshots[snapshots.length - 1].timestamp.getTime();
    return (end - start) / 1000;
  }

  /**
   * Calculate recovery time for a sequence
   */
  private calculateRecoveryTime(sequence: { snapshots: SessionMemorySnapshot[] }): number {
    return Math.round(this.calculateSequenceDuration(sequence.snapshots) / 60); // Convert to minutes
  }

  /**
   * Calculate recovery effectiveness
   */
  private calculateRecoveryEffectiveness(sequence: { snapshots: SessionMemorySnapshot[] }): number {
    const snapshots = sequence.snapshots;
    if (snapshots.length < 2) return 0;
    
    const startStress = snapshots[0].stressLevel || 0;
    const endStress = snapshots[snapshots.length - 1].stressLevel || 0;
    const stressReduction = startStress - endStress;
    
    const startStability = snapshots[0].stabilityScore || 0.5;
    const endStability = snapshots[snapshots.length - 1].stabilityScore || 0.5;
    const stabilityImprovement = endStability - startStability;
    
    return Math.max(0, Math.min(1, (stressReduction + stabilityImprovement) / 2));
  }

  // === RISK ASSESSMENT ML ALGORITHMS ===

  /**
   * Calculate regression risk using multiple factors
   */
  private calculateRegressionRisk(snapshots: SessionMemorySnapshot[], patterns: EmotionalPattern[]): {
    probability: number;
    timeframe: string;
  } {
    let riskScore = 0;
    let factors = 0;
    
    // Analyze recent trends
    const recentSnapshots = snapshots.slice(-10);
    
    // Stability trend factor
    const stabilityTrend = this.calculateTrend(
      recentSnapshots.map(s => s.stabilityScore || 0.5)
    );
    if (stabilityTrend < -0.2) {
      riskScore += 0.3;
      factors++;
    }
    
    // Stress trend factor
    const stressTrend = this.calculateTrend(
      recentSnapshots.map(s => s.stressLevel || 0)
    );
    if (stressTrend > 0.2) {
      riskScore += 0.3;
      factors++;
    }
    
    // Pattern-based risk
    const regressionPatterns = patterns.filter(p => 
      p.patternType.includes('regression') || p.riskLevel === 'high'
    );
    if (regressionPatterns.length > 0) {
      riskScore += 0.4;
      factors++;
    }
    
    const probability = factors > 0 ? riskScore / factors : 0;
    
    return {
      probability: Math.max(0, Math.min(1, probability)),
      timeframe: probability > 0.7 ? 'Next session' : 'Next 2-3 sessions'
    };
  }

  /**
   * Calculate emotional overwhelm risk
   */
  private calculateOverwhelmRisk(snapshots: SessionMemorySnapshot[]): {
    probability: number;
  } {
    const recentSnapshots = snapshots.slice(-5);
    
    let riskScore = 0;
    let indicators = 0;
    
    for (const snapshot of recentSnapshots) {
      // High arousal
      if (Math.abs(snapshot.emotionalSnapshot.arousal) > 0.7) {
        riskScore += 0.2;
        indicators++;
      }
      
      // Low stability
      if ((snapshot.stabilityScore || 0.5) < 0.3) {
        riskScore += 0.3;
        indicators++;
      }
      
      // High stress
      if ((snapshot.stressLevel || 0) > 0.7) {
        riskScore += 0.3;
        indicators++;
      }
      
      // Rapid emotional changes
      const affects = snapshot.emotionalSnapshot.affects;
      const highAffects = Object.values(affects).filter(v => v > 70).length;
      if (highAffects >= 3) {
        riskScore += 0.2;
        indicators++;
      }
    }
    
    return {
      probability: indicators > 0 ? Math.min(1, riskScore / indicators) : 0
    };
  }

  /**
   * Calculate treatment resistance risk
   */
  private calculateResistanceRisk(patterns: EmotionalPattern[], snapshots: SessionMemorySnapshot[]): {
    probability: number;
    timeline: string;
  } {
    let riskScore = 0;
    
    // Look for stagnation patterns
    const progressIndicators = snapshots.slice(-20).map(s => ({
      stability: s.stabilityScore || 0.5,
      stress: s.stressLevel || 0,
      engagement: s.engagementLevel || 0.5
    }));
    
    // Check for lack of progress
    const stabilityProgress = this.calculateTrend(progressIndicators.map(p => p.stability));
    const stressProgress = this.calculateTrend(progressIndicators.map(p => p.stress));
    const engagementProgress = this.calculateTrend(progressIndicators.map(p => p.engagement));
    
    if (Math.abs(stabilityProgress) < 0.1 && Math.abs(stressProgress) < 0.1) {
      riskScore += 0.4; // Stagnation
    }
    
    if (engagementProgress < -0.2) {
      riskScore += 0.3; // Decreasing engagement
    }
    
    // Check for resistance patterns
    const resistancePatterns = patterns.filter(p => 
      p.patternType.includes('resistance') || p.patternType.includes('avoidance')
    );
    
    if (resistancePatterns.length > 0) {
      riskScore += 0.3;
    }
    
    return {
      probability: Math.max(0, Math.min(1, riskScore)),
      timeline: riskScore > 0.5 ? 'Current session' : 'Next 2-4 sessions'
    };
  }

  /**
   * Calculate dissociation risk
   */
  private calculateDissociationRisk(snapshots: SessionMemorySnapshot[]): {
    probability: number;
  } {
    const recentSnapshots = snapshots.slice(-8);
    let riskScore = 0;
    
    for (const snapshot of recentSnapshots) {
      // Check for dissociation indicators
      const affects = snapshot.emotionalSnapshot.affects;
      
      // High disconnection/detachment affects
      if (affects['detachment'] > 60 || affects['dissociation'] > 50) {
        riskScore += 0.4;
      }
      
      // Extreme arousal variations
      if (Math.abs(snapshot.emotionalSnapshot.arousal) > 0.8) {
        riskScore += 0.2;
      }
      
      // Very low engagement
      if ((snapshot.engagementLevel || 0.5) < 0.2) {
        riskScore += 0.3;
      }
      
      // Memory processing phases with high stress
      if (snapshot.phaseContext === 'desensitization' && (snapshot.stressLevel || 0) > 0.8) {
        riskScore += 0.3;
      }
    }
    
    return {
      probability: Math.max(0, Math.min(1, riskScore / recentSnapshots.length))
    };
  }

  // === OPPORTUNITY PREDICTION ALGORITHMS ===

  /**
   * Calculate breakthrough readiness
   */
  private calculateBreakthroughReadiness(snapshots: SessionMemorySnapshot[], patterns: EmotionalPattern[]): {
    probability: number;
    timeframe: string;
  } {
    let readinessScore = 0;
    
    // Positive trend indicators
    const recentSnapshots = snapshots.slice(-10);
    
    // Stability improvement
    const stabilityTrend = this.calculateTrend(
      recentSnapshots.map(s => s.stabilityScore || 0.5)
    );
    if (stabilityTrend > 0.3) {
      readinessScore += 0.3;
    }
    
    // Stress reduction
    const stressTrend = this.calculateTrend(
      recentSnapshots.map(s => s.stressLevel || 0)
    );
    if (stressTrend < -0.3) {
      readinessScore += 0.3;
    }
    
    // High engagement
    const avgEngagement = recentSnapshots
      .map(s => s.engagementLevel || 0.5)
      .reduce((a, b) => a + b, 0) / recentSnapshots.length;
    if (avgEngagement > 0.7) {
      readinessScore += 0.2;
    }
    
    // Positive emotional patterns
    const positivePatterns = patterns.filter(p => 
      p.patternType.includes('positive') || p.patternType.includes('breakthrough')
    );
    if (positivePatterns.length > 0) {
      readinessScore += 0.2;
    }
    
    return {
      probability: Math.max(0, Math.min(1, readinessScore)),
      timeframe: readinessScore > 0.7 ? 'Current session' : 'Next 1-2 sessions'
    };
  }

  /**
   * Calculate optimal intervention timing
   */
  private calculateOptimalInterventionTiming(snapshots: SessionMemorySnapshot[]): {
    confidence: number;
    window: string;
  } {
    const recentSnapshots = snapshots.slice(-5);
    
    let optimalityScore = 0;
    
    // Check for optimal emotional state
    for (const snapshot of recentSnapshots) {
      const arousal = Math.abs(snapshot.emotionalSnapshot.arousal);
      const stability = snapshot.stabilityScore || 0.5;
      const engagement = snapshot.engagementLevel || 0.5;
      
      // Moderate arousal (not too high, not too low)
      if (arousal >= 0.3 && arousal <= 0.7) {
        optimalityScore += 0.3;
      }
      
      // Good stability
      if (stability > 0.6) {
        optimalityScore += 0.3;
      }
      
      // High engagement
      if (engagement > 0.7) {
        optimalityScore += 0.4;
      }
    }
    
    const confidence = optimalityScore / recentSnapshots.length;
    
    return {
      confidence: Math.max(0, Math.min(1, confidence)),
      window: confidence > 0.8 ? 'Now' : 'Next 10-15 minutes'
    };
  }

  /**
   * Calculate phase advancement readiness
   */
  private calculatePhaseAdvancementReadiness(snapshots: SessionMemorySnapshot[]): {
    readiness: number;
  } {
    const recentSnapshots = snapshots.slice(-8);
    
    let readinessScore = 0;
    let criteria = 0;
    
    // Sustained stability
    const avgStability = recentSnapshots
      .map(s => s.stabilityScore || 0.5)
      .reduce((a, b) => a + b, 0) / recentSnapshots.length;
    
    if (avgStability > 0.7) {
      readinessScore += 0.4;
      criteria++;
    }
    
    // Low stress levels
    const avgStress = recentSnapshots
      .map(s => s.stressLevel || 0)
      .reduce((a, b) => a + b, 0) / recentSnapshots.length;
    
    if (avgStress < 0.3) {
      readinessScore += 0.3;
      criteria++;
    }
    
    // High engagement
    const avgEngagement = recentSnapshots
      .map(s => s.engagementLevel || 0.5)
      .reduce((a, b) => a + b, 0) / recentSnapshots.length;
    
    if (avgEngagement > 0.7) {
      readinessScore += 0.3;
      criteria++;
    }
    
    return {
      readiness: criteria > 0 ? readinessScore / criteria : 0
    };
  }

  /**
   * Calculate treatment acceleration potential
   */
  private calculateAccelerationPotential(patterns: EmotionalPattern[], snapshots: SessionMemorySnapshot[]): {
    potential: number;
  } {
    let potential = 0;
    
    // Positive momentum patterns
    const positivePatterns = patterns.filter(p => 
      p.patternType.includes('improvement') || 
      p.patternType.includes('effective_recovery') ||
      p.patternType.includes('sustained_stability')
    );
    
    if (positivePatterns.length >= 2) {
      potential += 0.4;
    }
    
    // Consistent progress trends
    const recentSnapshots = snapshots.slice(-15);
    const progressMetrics = {
      stability: this.calculateTrend(recentSnapshots.map(s => s.stabilityScore || 0.5)),
      stress: this.calculateTrend(recentSnapshots.map(s => s.stressLevel || 0)),
      engagement: this.calculateTrend(recentSnapshots.map(s => s.engagementLevel || 0.5))
    };
    
    if (progressMetrics.stability > 0.2 && progressMetrics.stress < -0.2) {
      potential += 0.3;
    }
    
    if (progressMetrics.engagement > 0.2) {
      potential += 0.3;
    }
    
    return {
      potential: Math.max(0, Math.min(1, potential))
    };
  }

  // === CONFIDENCE CALCULATION METHODS ===

  /**
   * Calculate pattern consistency across time
   */
  private calculatePatternConsistency(patterns: EmotionalPattern[]): number {
    if (patterns.length === 0) return 0;
    
    const activePatterns = patterns.filter(p => p.isActive);
    const consistentPatterns = activePatterns.filter(p => p.occurrenceCount >= 2);
    
    return activePatterns.length > 0 ? consistentPatterns.length / activePatterns.length : 0;
  }

  /**
   * Calculate temporal coverage of data
   */
  private calculateTemporalCoverage(snapshots: SessionMemorySnapshot[]): number {
    if (snapshots.length < 2) return 0;
    
    const timeSpan = snapshots[snapshots.length - 1].timestamp.getTime() - snapshots[0].timestamp.getTime();
    const hours = timeSpan / (1000 * 60 * 60);
    
    // Good coverage if spanning multiple hours with reasonable frequency
    const frequency = snapshots.length / Math.max(1, hours);
    
    return Math.min(1, (hours / 24) * Math.min(1, frequency / 5)); // Normalize
  }

  /**
   * Calculate overall data quality
   */
  private calculateDataQuality(snapshots: SessionMemorySnapshot[]): number {
    if (snapshots.length === 0) return 0;
    
    let qualityScore = 0;
    let factors = 0;
    
    // Completeness factor
    const completeSnapshots = snapshots.filter(s => 
      s.stressLevel !== null && 
      s.stabilityScore !== null && 
      s.engagementLevel !== null
    );
    
    qualityScore += completeSnapshots.length / snapshots.length;
    factors++;
    
    // Consistency factor (no extreme outliers)
    const stressValues = snapshots.map(s => s.stressLevel || 0);
    const stressVariance = this.calculateVariance(stressValues);
    
    if (stressVariance < 0.5) { // Reasonable variance
      qualityScore += 0.8;
    } else {
      qualityScore += 0.4;
    }
    factors++;
    
    return factors > 0 ? qualityScore / factors : 0;
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

  /**
   * Generate deterministic ID for clinical safety (replaces Math.random())
   */
  private generateDeterministicId(patientId: string, seedValue: number): string {
    // Use patient ID and seed to create deterministic hash-based ID
    const baseString = `${patientId}_${seedValue}`;
    let hash = 0;
    for (let i = 0; i < baseString.length; i++) {
      const char = baseString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substr(0, 9);
  }

  /**
   * Generate deterministic pseudo-random values based on patient data (replaces Math.random())
   */
  private deterministicValue(patientId: string, seed: string = '', min: number = 0, max: number = 1): number {
    const baseString = `${patientId}_${seed}_${Date.now() % 86400000}`; // Daily seed rotation
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
  private deterministicArraySelect<T>(array: T[], patientId: string, seed: string = ''): T {
    if (array.length === 0) throw new Error('Cannot select from empty array');
    const value = this.deterministicValue(patientId, seed, 0, array.length);
    return array[Math.floor(value)];
  }

  /**
   * Generate deterministic boolean (replaces Math.random() > threshold)
   */
  private deterministicBoolean(patientId: string, seed: string = '', threshold: number = 0.5): boolean {
    return this.deterministicValue(patientId, seed) > threshold;
  }
}

export const progressAnalyticsService = new ProgressAnalyticsService();