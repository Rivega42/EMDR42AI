import { 
  type User, 
  type InsertUser,
  type EmotionCapture,
  type InsertEmotionCapture,
  type Session,
  type InsertSession,
  type SessionMemorySnapshot,
  type InsertSessionMemorySnapshot,
  type ProgressMetric,
  type InsertProgressMetric,
  type SessionComparison,
  type InsertSessionComparison,
  type BreakthroughMoment,
  type InsertBreakthroughMoment,
  type MemoryInsight,
  type InsertMemoryInsight,
  type EmotionalPatternAnalysis,
  type InsertEmotionalPatternAnalysis,
  users,
  emdrSessions,
  emotionCaptures,
  sessionMemorySnapshots,
  progressMetrics,
  sessionComparisons,
  breakthroughMoments,
  memoryInsights,
  emotionalPatternAnalysis
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from './db';
import { eq, desc, and, count, sql } from 'drizzle-orm';

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>; // Alias for getUser
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser(user: { id: string; email: string; firstName: string; lastName: string; profileImageUrl: string }): Promise<User>;
  
  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  getActiveSessionByPatient(patientId: string): Promise<Session | undefined>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  
  // Emotion capture methods
  createEmotionCapture(emotion: InsertEmotionCapture): Promise<EmotionCapture>;
  getEmotionCaptures(sessionId: string, limit?: number): Promise<EmotionCapture[]>;
  getLatestEmotionCapture(sessionId: string): Promise<EmotionCapture | undefined>;
  
  // === SESSION MEMORY & PROGRESS SYSTEM ===
  
  // Session Memory Snapshots
  createSessionSnapshot(snapshot: InsertSessionMemorySnapshot): Promise<SessionMemorySnapshot>;
  getSessionSnapshots(sessionId: string): Promise<SessionMemorySnapshot[]>;
  getSnapshotsByPatient(patientId: string, limit?: number): Promise<SessionMemorySnapshot[]>;
  getSnapshotsByType(patientId: string, snapshotType: string): Promise<SessionMemorySnapshot[]>;
  
  // Progress Metrics
  createProgressMetric(metric: InsertProgressMetric): Promise<ProgressMetric>;
  getProgressMetrics(patientId: string, metricType?: string): Promise<ProgressMetric[]>;
  getLatestProgressMetric(patientId: string, metricType: string): Promise<ProgressMetric | undefined>;
  updateProgressMetric(id: string, updates: Partial<ProgressMetric>): Promise<ProgressMetric | undefined>;
  
  // Session Comparisons
  createSessionComparison(comparison: InsertSessionComparison): Promise<SessionComparison>;
  getSessionComparisons(patientId: string): Promise<SessionComparison[]>;
  getSessionComparison(baselineSessionId: string, compareSessionId: string): Promise<SessionComparison | undefined>;
  
  // Breakthrough Moments
  createBreakthroughMoment(breakthrough: InsertBreakthroughMoment): Promise<BreakthroughMoment>;
  getBreakthroughMoments(sessionId: string): Promise<BreakthroughMoment[]>;
  getAllBreakthroughs(): Promise<BreakthroughMoment[]>;
  
  // Analytics Support Methods
  getAllPatients(): Promise<User[]>;
  getRecentSnapshots(limit?: number): Promise<SessionMemorySnapshot[]>;
  getBreakthroughsByPatient(patientId: string, limit?: number): Promise<BreakthroughMoment[]>;
  
  // Memory Insights
  createMemoryInsight(insight: InsertMemoryInsight): Promise<MemoryInsight>;
  getMemoryInsights(patientId: string, insightType?: string): Promise<MemoryInsight[]>;
  getActiveInsights(patientId: string): Promise<MemoryInsight[]>;
  updateInsightAccess(id: string): Promise<void>;
  
  // Emotional Pattern Analysis
  createEmotionalPattern(pattern: InsertEmotionalPatternAnalysis): Promise<EmotionalPatternAnalysis>;
  getEmotionalPatterns(patientId: string, isActive?: boolean): Promise<EmotionalPatternAnalysis[]>;
  updatePatternOccurrence(id: string): Promise<EmotionalPatternAnalysis | undefined>;
  deactivatePattern(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private emotionCaptures: Map<string, EmotionCapture>;
  private sessionEmotions: Map<string, string[]>; // sessionId -> emotionIds
  
  // === SESSION MEMORY & PROGRESS SYSTEM ===
  private sessionSnapshots: Map<string, SessionMemorySnapshot>;
  private progressMetrics: Map<string, ProgressMetric>;
  private sessionComparisons: Map<string, SessionComparison>;
  private breakthroughMoments: Map<string, BreakthroughMoment>;
  private memoryInsights: Map<string, MemoryInsight>;
  private emotionalPatterns: Map<string, EmotionalPatternAnalysis>;
  
  // Index maps for efficient queries
  private snapshotsBySession: Map<string, string[]>; // sessionId -> snapshotIds
  private snapshotsByPatient: Map<string, string[]>; // patientId -> snapshotIds
  private metricsByPatient: Map<string, string[]>; // patientId -> metricIds
  private comparisonsByPatient: Map<string, string[]>; // patientId -> comparisonIds
  private breakthroughsBySession: Map<string, string[]>; // sessionId -> breakthroughIds
  private breakthroughsByPatient: Map<string, string[]>; // patientId -> breakthroughIds
  private insightsByPatient: Map<string, string[]>; // patientId -> insightIds
  private patternsByPatient: Map<string, string[]>; // patientId -> patternIds

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.emotionCaptures = new Map();
    this.sessionEmotions = new Map();
    
    // Initialize memory system maps
    this.sessionSnapshots = new Map();
    this.progressMetrics = new Map();
    this.sessionComparisons = new Map();
    this.breakthroughMoments = new Map();
    this.memoryInsights = new Map();
    this.emotionalPatterns = new Map();
    
    // Initialize index maps
    this.snapshotsBySession = new Map();
    this.snapshotsByPatient = new Map();
    this.metricsByPatient = new Map();
    this.comparisonsByPatient = new Map();
    this.breakthroughsBySession = new Map();
    this.breakthroughsByPatient = new Map();
    this.insightsByPatient = new Map();
    this.patternsByPatient = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id); // Alias for getUser
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id,
      username: insertUser.username ?? null,
      role: insertUser.role || 'patient',
      email: insertUser.email ?? null,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      profileImageUrl: null,
      password: null, // For OIDC users
      specialization: null,
      licenseNumber: null,
      clinicalLevel: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async upsertUser(userData: { id: string; email: string; firstName: string; lastName: string; profileImageUrl: string }): Promise<User> {
    const existingUser = this.users.get(userData.id);
    if (existingUser) {
      // Update existing user with Replit auth data
      const updatedUser: User = {
        ...existingUser,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        updatedAt: new Date()
      };
      this.users.set(userData.id, updatedUser);
      return updatedUser;
    } else {
      // Create new user from Replit auth data
      const newUser: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        password: null, // OIDC users don't have passwords
        role: 'patient', // Default role for new Replit users
        username: null,
        specialization: null,
        licenseNumber: null,
        clinicalLevel: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.users.set(userData.id, newUser);
      return newUser;
    }
  }
  
  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const id = randomUUID();
    const newSession: Session = {
      id,
      patientId: session.patientId,
      therapistId: session.therapistId,
      startTime: session.startTime || new Date(),
      endTime: session.endTime ?? null,
      phase: session.phase || 'preparation',
      status: session.status || 'active',
      notes: session.notes ?? null,
      sudsInitial: session.sudsInitial ?? null,
      sudsFinal: session.sudsFinal ?? null,
      vocInitial: session.vocInitial ?? null,
      vocFinal: session.vocFinal ?? null,
      createdAt: new Date()
    };
    this.sessions.set(id, newSession);
    return newSession;
  }
  
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }
  
  async getActiveSessionByPatient(patientId: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      (session) => session.patientId === patientId && session.status === 'active'
    );
  }
  
  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (session) {
      const updatedSession = { ...session, ...updates };
      this.sessions.set(id, updatedSession);
      return updatedSession;
    }
    return undefined;
  }
  
  // Emotion capture methods
  async createEmotionCapture(emotion: InsertEmotionCapture): Promise<EmotionCapture> {
    const id = randomUUID();
    const emotionCapture: EmotionCapture = {
      id,
      patientId: emotion.patientId,
      sessionId: emotion.sessionId,
      timestamp: new Date(),
      source: emotion.source,
      arousal: emotion.arousal,
      valence: emotion.valence,
      affects: emotion.affects || {},
      basicEmotions: emotion.basicEmotions || {},
      blsConfig: emotion.blsConfig || {},
      phaseContext: emotion.phaseContext ?? null
    };
    this.emotionCaptures.set(id, emotionCapture);
    
    // Track by session
    const sessionEmotions = this.sessionEmotions.get(emotion.sessionId) || [];
    sessionEmotions.push(id);
    this.sessionEmotions.set(emotion.sessionId, sessionEmotions);
    
    return emotionCapture;
  }
  
  async getEmotionCaptures(sessionId: string, limit: number = 100): Promise<EmotionCapture[]> {
    const emotionIds = this.sessionEmotions.get(sessionId) || [];
    const captures: EmotionCapture[] = [];
    
    for (const id of emotionIds.slice(-limit)) {
      const capture = this.emotionCaptures.get(id);
      if (capture) captures.push(capture);
    }
    
    return captures;
  }
  
  async getLatestEmotionCapture(sessionId: string): Promise<EmotionCapture | undefined> {
    const emotionIds = this.sessionEmotions.get(sessionId) || [];
    if (emotionIds.length === 0) return undefined;
    
    const lastId = emotionIds[emotionIds.length - 1];
    return this.emotionCaptures.get(lastId);
  }
  
  // === SESSION MEMORY & PROGRESS SYSTEM IMPLEMENTATION ===
  
  // Session Memory Snapshots
  async createSessionSnapshot(snapshot: InsertSessionMemorySnapshot): Promise<SessionMemorySnapshot> {
    const id = randomUUID();
    const newSnapshot: SessionMemorySnapshot = {
      id,
      sessionId: snapshot.sessionId,
      patientId: snapshot.patientId,
      snapshotType: snapshot.snapshotType as any,
      timestamp: new Date(),
      emotionalSnapshot: snapshot.emotionalSnapshot,
      phaseContext: snapshot.phaseContext,
      sudsLevel: snapshot.sudsLevel ?? null,
      vocLevel: snapshot.vocLevel ?? null,
      stabilityScore: snapshot.stabilityScore ?? null,
      engagementLevel: snapshot.engagementLevel ?? null,
      stressLevel: snapshot.stressLevel ?? null,
      blsEffectiveness: snapshot.blsEffectiveness ?? null,
      aiAnalysis: snapshot.aiAnalysis ?? null,
      keyInsights: snapshot.keyInsights ?? null,
      triggerEvents: snapshot.triggerEvents ?? null,
      recoveryTime: snapshot.recoveryTime ?? null,
      createdAt: new Date()
    };
    
    this.sessionSnapshots.set(id, newSnapshot);
    
    // Update indexes
    const sessionSnapshots = this.snapshotsBySession.get(snapshot.sessionId) || [];
    sessionSnapshots.push(id);
    this.snapshotsBySession.set(snapshot.sessionId, sessionSnapshots);
    
    const patientSnapshots = this.snapshotsByPatient.get(snapshot.patientId) || [];
    patientSnapshots.push(id);
    this.snapshotsByPatient.set(snapshot.patientId, patientSnapshots);
    
    return newSnapshot;
  }
  
  async getSessionSnapshots(sessionId: string): Promise<SessionMemorySnapshot[]> {
    const snapshotIds = this.snapshotsBySession.get(sessionId) || [];
    const snapshots: SessionMemorySnapshot[] = [];
    
    for (const id of snapshotIds) {
      const snapshot = this.sessionSnapshots.get(id);
      if (snapshot) snapshots.push(snapshot);
    }
    
    return snapshots.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async getSnapshotsByPatient(patientId: string, limit: number = 100): Promise<SessionMemorySnapshot[]> {
    const snapshotIds = this.snapshotsByPatient.get(patientId) || [];
    const snapshots: SessionMemorySnapshot[] = [];
    
    for (const id of snapshotIds.slice(-limit)) {
      const snapshot = this.sessionSnapshots.get(id);
      if (snapshot) snapshots.push(snapshot);
    }
    
    return snapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  async getSnapshotsByType(patientId: string, snapshotType: string): Promise<SessionMemorySnapshot[]> {
    const allSnapshots = await this.getSnapshotsByPatient(patientId, 500);
    return allSnapshots.filter(s => s.snapshotType === snapshotType);
  }
  
  // Progress Metrics
  async createProgressMetric(metric: InsertProgressMetric): Promise<ProgressMetric> {
    const id = randomUUID();
    const newMetric: ProgressMetric = {
      id,
      patientId: metric.patientId,
      therapistId: metric.therapistId,
      sessionId: metric.sessionId ?? null,
      metricType: metric.metricType,
      timeWindow: metric.timeWindow,
      sudsProgress: metric.sudsProgress,
      vocProgress: metric.vocProgress,
      emotionalStability: metric.emotionalStability,
      triggerPatterns: metric.triggerPatterns,
      calmingTechniques: metric.calmingTechniques,
      phaseProgression: metric.phaseProgression,
      breakthroughIndicators: metric.breakthroughIndicators,
      regressionRisk: metric.regressionRisk ?? null,
      treatmentEffectiveness: metric.treatmentEffectiveness ?? null,
      nextSessionPredictions: metric.nextSessionPredictions ?? null,
      calculatedAt: new Date(),
      isValid: metric.isValid ?? true
    };
    
    this.progressMetrics.set(id, newMetric);
    
    // Update indexes
    const patientMetrics = this.metricsByPatient.get(metric.patientId) || [];
    patientMetrics.push(id);
    this.metricsByPatient.set(metric.patientId, patientMetrics);
    
    return newMetric;
  }
  
  async getProgressMetrics(patientId: string, metricType?: string): Promise<ProgressMetric[]> {
    const metricIds = this.metricsByPatient.get(patientId) || [];
    const metrics: ProgressMetric[] = [];
    
    for (const id of metricIds) {
      const metric = this.progressMetrics.get(id);
      if (metric && metric.isValid) {
        if (!metricType || metric.metricType === metricType) {
          metrics.push(metric);
        }
      }
    }
    
    return metrics.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
  }
  
  async getLatestProgressMetric(patientId: string, metricType: string): Promise<ProgressMetric | undefined> {
    const metrics = await this.getProgressMetrics(patientId, metricType);
    return metrics.length > 0 ? metrics[0] : undefined;
  }
  
  async updateProgressMetric(id: string, updates: Partial<ProgressMetric>): Promise<ProgressMetric | undefined> {
    const metric = this.progressMetrics.get(id);
    if (metric) {
      const updatedMetric = { ...metric, ...updates };
      this.progressMetrics.set(id, updatedMetric);
      return updatedMetric;
    }
    return undefined;
  }
  
  // Session Comparisons
  async createSessionComparison(comparison: InsertSessionComparison): Promise<SessionComparison> {
    const id = randomUUID();
    const newComparison: SessionComparison = {
      id,
      patientId: comparison.patientId,
      baselineSessionId: comparison.baselineSessionId,
      compareSessionId: comparison.compareSessionId,
      comparisonType: comparison.comparisonType,
      emotionalDelta: comparison.emotionalDelta,
      sudsDelta: comparison.sudsDelta,
      vocDelta: comparison.vocDelta,
      stabilityImprovement: comparison.stabilityImprovement ?? null,
      triggerSensitivity: comparison.triggerSensitivity ?? null,
      copingImprovement: comparison.copingImprovement ?? null,
      phaseEfficiency: comparison.phaseEfficiency ?? null,
      blsEffectivenessChange: comparison.blsEffectivenessChange ?? null,
      significantChanges: comparison.significantChanges ?? null,
      improvementAreas: comparison.improvementAreas ?? null,
      concernAreas: comparison.concernAreas ?? null,
      aiInsights: comparison.aiInsights ?? null,
      confidenceScore: comparison.confidenceScore ?? null,
      calculatedAt: new Date()
    };
    
    this.sessionComparisons.set(id, newComparison);
    
    // Update indexes
    const patientComparisons = this.comparisonsByPatient.get(comparison.patientId) || [];
    patientComparisons.push(id);
    this.comparisonsByPatient.set(comparison.patientId, patientComparisons);
    
    return newComparison;
  }
  
  async getSessionComparisons(patientId: string): Promise<SessionComparison[]> {
    const comparisonIds = this.comparisonsByPatient.get(patientId) || [];
    const comparisons: SessionComparison[] = [];
    
    for (const id of comparisonIds) {
      const comparison = this.sessionComparisons.get(id);
      if (comparison) comparisons.push(comparison);
    }
    
    return comparisons.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
  }
  
  async getSessionComparison(baselineSessionId: string, compareSessionId: string): Promise<SessionComparison | undefined> {
    return Array.from(this.sessionComparisons.values()).find(
      c => c.baselineSessionId === baselineSessionId && c.compareSessionId === compareSessionId
    );
  }
  
  // Breakthrough Moments
  async createBreakthroughMoment(breakthrough: InsertBreakthroughMoment): Promise<BreakthroughMoment> {
    const id = randomUUID();
    const newBreakthrough: BreakthroughMoment = {
      id,
      sessionId: breakthrough.sessionId,
      patientId: breakthrough.patientId,
      momentType: breakthrough.momentType,
      timestamp: new Date(),
      phaseContext: breakthrough.phaseContext,
      description: breakthrough.description,
      emotionalBefore: breakthrough.emotionalBefore,
      emotionalAfter: breakthrough.emotionalAfter,
      sudsBefore: breakthrough.sudsBefore ?? null,
      sudsAfter: breakthrough.sudsAfter ?? null,
      triggerEvent: breakthrough.triggerEvent ?? null,
      interventionUsed: breakthrough.interventionUsed ?? null,
      duration: breakthrough.duration ?? null,
      intensity: breakthrough.intensity ?? null,
      significanceLevel: breakthrough.significanceLevel ?? null,
      therapeuticImpact: breakthrough.therapeuticImpact ?? null,
      aiAnalysis: breakthrough.aiAnalysis ?? null,
      followUpNeeded: breakthrough.followUpNeeded ?? false,
      followUpNotes: breakthrough.followUpNotes ?? null
    };
    
    this.breakthroughMoments.set(id, newBreakthrough);
    
    // Update indexes
    const sessionBreakthroughs = this.breakthroughsBySession.get(breakthrough.sessionId) || [];
    sessionBreakthroughs.push(id);
    this.breakthroughsBySession.set(breakthrough.sessionId, sessionBreakthroughs);
    
    const patientBreakthroughs = this.breakthroughsByPatient.get(breakthrough.patientId) || [];
    patientBreakthroughs.push(id);
    this.breakthroughsByPatient.set(breakthrough.patientId, patientBreakthroughs);
    
    return newBreakthrough;
  }
  
  async getBreakthroughMoments(sessionId: string): Promise<BreakthroughMoment[]> {
    const breakthroughIds = this.breakthroughsBySession.get(sessionId) || [];
    const breakthroughs: BreakthroughMoment[] = [];
    
    for (const id of breakthroughIds) {
      const breakthrough = this.breakthroughMoments.get(id);
      if (breakthrough) breakthroughs.push(breakthrough);
    }
    
    return breakthroughs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }
  
  async getBreakthroughsByPatient(patientId: string, limit: number = 50): Promise<BreakthroughMoment[]> {
    const breakthroughIds = this.breakthroughsByPatient.get(patientId) || [];
    const breakthroughs: BreakthroughMoment[] = [];
    
    for (const id of breakthroughIds.slice(-limit)) {
      const breakthrough = this.breakthroughMoments.get(id);
      if (breakthrough) breakthroughs.push(breakthrough);
    }
    
    return breakthroughs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  // Analytics Support Methods
  async getAllPatients(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === 'patient')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentSnapshots(limit: number = 100): Promise<SessionMemorySnapshot[]> {
    const allSnapshots = Array.from(this.sessionSnapshots.values());
    return allSnapshots
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getAllBreakthroughs(): Promise<BreakthroughMoment[]> {
    return Array.from(this.breakthroughMoments.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  
  // Memory Insights
  async createMemoryInsight(insight: InsertMemoryInsight): Promise<MemoryInsight> {
    const id = randomUUID();
    const newInsight: MemoryInsight = {
      id,
      patientId: insight.patientId,
      insightType: insight.insightType,
      timeScope: insight.timeScope,
      insightData: insight.insightData,
      confidence: insight.confidence,
      relevanceScore: insight.relevanceScore,
      actionable: insight.actionable ?? false,
      recommendations: insight.recommendations ?? null,
      dataSource: insight.dataSource ?? null,
      calculationMethod: insight.calculationMethod ?? null,
      expiresAt: insight.expiresAt ?? null,
      tags: insight.tags ?? null,
      priority: insight.priority ?? 'medium',
      calculatedAt: new Date(),
      lastAccessed: new Date()
    };
    
    this.memoryInsights.set(id, newInsight);
    
    // Update indexes
    const patientInsights = this.insightsByPatient.get(insight.patientId) || [];
    patientInsights.push(id);
    this.insightsByPatient.set(insight.patientId, patientInsights);
    
    return newInsight;
  }
  
  async getMemoryInsights(patientId: string, insightType?: string): Promise<MemoryInsight[]> {
    const insightIds = this.insightsByPatient.get(patientId) || [];
    const insights: MemoryInsight[] = [];
    
    for (const id of insightIds) {
      const insight = this.memoryInsights.get(id);
      if (insight) {
        // Check if expired
        if (insight.expiresAt && insight.expiresAt < new Date()) {
          continue;
        }
        
        if (!insightType || insight.insightType === insightType) {
          insights.push(insight);
        }
      }
    }
    
    return insights.sort((a, b) => b.calculatedAt.getTime() - a.calculatedAt.getTime());
  }
  
  async getActiveInsights(patientId: string): Promise<MemoryInsight[]> {
    const allInsights = await this.getMemoryInsights(patientId);
    return allInsights.filter(i => 
      i.priority === 'high' || i.priority === 'critical' || i.actionable
    );
  }
  
  async updateInsightAccess(id: string): Promise<void> {
    const insight = this.memoryInsights.get(id);
    if (insight) {
      insight.lastAccessed = new Date();
      this.memoryInsights.set(id, insight);
    }
  }
  
  // Emotional Pattern Analysis
  async createEmotionalPattern(pattern: InsertEmotionalPatternAnalysis): Promise<EmotionalPatternAnalysis> {
    const id = randomUUID();
    const newPattern: EmotionalPatternAnalysis = {
      id,
      patientId: pattern.patientId,
      patternType: pattern.patternType,
      patternName: pattern.patternName,
      description: pattern.description,
      detectedAt: new Date(),
      firstObserved: pattern.firstObserved,
      lastObserved: pattern.lastObserved,
      occurrenceCount: pattern.occurrenceCount ?? 1,
      patternData: pattern.patternData,
      triggerConditions: pattern.triggerConditions ?? null,
      typicalDuration: pattern.typicalDuration ?? null,
      emotionalSignature: pattern.emotionalSignature,
      predictiveValue: pattern.predictiveValue ?? null,
      therapeuticRelevance: pattern.therapeuticRelevance ?? null,
      interventionEffectiveness: pattern.interventionEffectiveness ?? null,
      relatedPatterns: pattern.relatedPatterns ?? null,
      strengthTrend: pattern.strengthTrend ?? null,
      riskLevel: pattern.riskLevel ?? 'medium',
      isActive: pattern.isActive ?? true,
      aiAnalysis: pattern.aiAnalysis ?? null
    };
    
    this.emotionalPatterns.set(id, newPattern);
    
    // Update indexes
    const patientPatterns = this.patternsByPatient.get(pattern.patientId) || [];
    patientPatterns.push(id);
    this.patternsByPatient.set(pattern.patientId, patientPatterns);
    
    return newPattern;
  }
  
  async getEmotionalPatterns(patientId: string, isActive?: boolean): Promise<EmotionalPatternAnalysis[]> {
    const patternIds = this.patternsByPatient.get(patientId) || [];
    const patterns: EmotionalPatternAnalysis[] = [];
    
    for (const id of patternIds) {
      const pattern = this.emotionalPatterns.get(id);
      if (pattern) {
        if (isActive === undefined || pattern.isActive === isActive) {
          patterns.push(pattern);
        }
      }
    }
    
    return patterns.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }
  
  async updatePatternOccurrence(id: string): Promise<EmotionalPatternAnalysis | undefined> {
    const pattern = this.emotionalPatterns.get(id);
    if (pattern) {
      pattern.occurrenceCount++;
      pattern.lastObserved = new Date();
      this.emotionalPatterns.set(id, pattern);
      return pattern;
    }
    return undefined;
  }
  
  async deactivatePattern(id: string): Promise<void> {
    const pattern = this.emotionalPatterns.get(id);
    if (pattern) {
      pattern.isActive = false;
      this.emotionalPatterns.set(id, pattern);
    }
  }
}

/**
 * Production Database Storage Implementation
 * Uses real PostgreSQL database with Drizzle ORM
 * Replaces MemStorage for persistent data storage
 */
export class DbStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id); // Alias for getUser
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async upsertUser(userData: { id: string; email: string; firstName: string; lastName: string; profileImageUrl: string }): Promise<User> {
    // Generate username from email if not provided - critical for NOT NULL constraint
    const username = userData.email ? userData.email.split('@')[0] : userData.id.substring(0, 8);
    
    // Use PostgreSQL ON CONFLICT for upsert behavior
    const result = await db.insert(users)
      .values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        profileImageUrl: userData.profileImageUrl,
        username: username, // Add generated username
        role: 'patient', // Default role for new Replit users
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          username: username, // Update username too
          updatedAt: new Date()
        }
      })
      .returning();
    return result[0];
  }
  
  // Session methods
  async createSession(session: InsertSession): Promise<Session> {
    const result = await db.insert(emdrSessions).values(session).returning();
    return result[0];
  }
  
  async getSession(id: string): Promise<Session | undefined> {
    const result = await db.select().from(emdrSessions).where(eq(emdrSessions.id, id));
    return result[0];
  }
  
  async getActiveSessionByPatient(patientId: string): Promise<Session | undefined> {
    const result = await db.select()
      .from(emdrSessions)
      .where(and(
        eq(emdrSessions.patientId, patientId),
        eq(emdrSessions.status, 'active')
      ));
    return result[0];
  }
  
  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const result = await db.update(emdrSessions)
      .set(updates)
      .where(eq(emdrSessions.id, id))
      .returning();
    return result[0];
  }
  
  // Emotion capture methods
  async createEmotionCapture(emotion: InsertEmotionCapture): Promise<EmotionCapture> {
    const result = await db.insert(emotionCaptures).values(emotion).returning();
    return result[0];
  }
  
  async getEmotionCaptures(sessionId: string, limit: number = 100): Promise<EmotionCapture[]> {
    const result = await db.select()
      .from(emotionCaptures)
      .where(eq(emotionCaptures.sessionId, sessionId))
      .orderBy(desc(emotionCaptures.timestamp))
      .limit(limit);
    return result;
  }
  
  async getLatestEmotionCapture(sessionId: string): Promise<EmotionCapture | undefined> {
    const result = await db.select()
      .from(emotionCaptures)
      .where(eq(emotionCaptures.sessionId, sessionId))
      .orderBy(desc(emotionCaptures.timestamp))
      .limit(1);
    return result[0];
  }
  
  // === SESSION MEMORY & PROGRESS SYSTEM ===
  
  // Session Memory Snapshots
  async createSessionSnapshot(snapshot: InsertSessionMemorySnapshot): Promise<SessionMemorySnapshot> {
    const result = await db.insert(sessionMemorySnapshots).values(snapshot).returning();
    return result[0];
  }
  
  async getSessionSnapshots(sessionId: string): Promise<SessionMemorySnapshot[]> {
    const result = await db.select()
      .from(sessionMemorySnapshots)
      .where(eq(sessionMemorySnapshots.sessionId, sessionId))
      .orderBy(desc(sessionMemorySnapshots.timestamp));
    return result;
  }
  
  async getSnapshotsByPatient(patientId: string, limit?: number): Promise<SessionMemorySnapshot[]> {
    const baseQuery = db.select()
      .from(sessionMemorySnapshots)
      .where(eq(sessionMemorySnapshots.patientId, patientId))
      .orderBy(desc(sessionMemorySnapshots.timestamp));
    
    if (limit) {
      return await baseQuery.limit(limit);
    }
    
    return await baseQuery;
  }
  
  async getSnapshotsByType(patientId: string, snapshotType: string): Promise<SessionMemorySnapshot[]> {
    const result = await db.select()
      .from(sessionMemorySnapshots)
      .where(and(
        eq(sessionMemorySnapshots.patientId, patientId),
        eq(sessionMemorySnapshots.snapshotType, snapshotType)
      ))
      .orderBy(desc(sessionMemorySnapshots.timestamp));
    return result;
  }
  
  // Progress Metrics
  async createProgressMetric(metric: InsertProgressMetric): Promise<ProgressMetric> {
    const result = await db.insert(progressMetrics).values(metric).returning();
    return result[0];
  }
  
  async getProgressMetrics(patientId: string, metricType?: string): Promise<ProgressMetric[]> {
    const whereConditions = metricType 
      ? and(
          eq(progressMetrics.patientId, patientId),
          eq(progressMetrics.metricType, metricType)
        )
      : eq(progressMetrics.patientId, patientId);
    
    return await db.select()
      .from(progressMetrics)
      .where(whereConditions)
      .orderBy(desc(progressMetrics.calculatedAt));
  }
  
  async getLatestProgressMetric(patientId: string, metricType: string): Promise<ProgressMetric | undefined> {
    const result = await db.select()
      .from(progressMetrics)
      .where(and(
        eq(progressMetrics.patientId, patientId),
        eq(progressMetrics.metricType, metricType)
      ))
      .orderBy(desc(progressMetrics.calculatedAt))
      .limit(1);
    return result[0];
  }
  
  async updateProgressMetric(id: string, updates: Partial<ProgressMetric>): Promise<ProgressMetric | undefined> {
    const result = await db.update(progressMetrics)
      .set(updates)
      .where(eq(progressMetrics.id, id))
      .returning();
    return result[0];
  }
  
  // Session Comparisons
  async createSessionComparison(comparison: InsertSessionComparison): Promise<SessionComparison> {
    const result = await db.insert(sessionComparisons).values(comparison).returning();
    return result[0];
  }
  
  async getSessionComparisons(patientId: string): Promise<SessionComparison[]> {
    const result = await db.select()
      .from(sessionComparisons)
      .where(eq(sessionComparisons.patientId, patientId))
      .orderBy(desc(sessionComparisons.calculatedAt));
    return result;
  }
  
  async getSessionComparison(baselineSessionId: string, compareSessionId: string): Promise<SessionComparison | undefined> {
    const result = await db.select()
      .from(sessionComparisons)
      .where(and(
        eq(sessionComparisons.baselineSessionId, baselineSessionId),
        eq(sessionComparisons.compareSessionId, compareSessionId)
      ));
    return result[0];
  }
  
  // Breakthrough Moments
  async createBreakthroughMoment(breakthrough: InsertBreakthroughMoment): Promise<BreakthroughMoment> {
    const result = await db.insert(breakthroughMoments).values(breakthrough).returning();
    return result[0];
  }
  
  async getBreakthroughMoments(sessionId: string): Promise<BreakthroughMoment[]> {
    const result = await db.select()
      .from(breakthroughMoments)
      .where(eq(breakthroughMoments.sessionId, sessionId))
      .orderBy(desc(breakthroughMoments.timestamp));
    return result;
  }
  
  async getBreakthroughsByPatient(patientId: string, limit?: number): Promise<BreakthroughMoment[]> {
    const baseQuery = db.select()
      .from(breakthroughMoments)
      .where(eq(breakthroughMoments.patientId, patientId))
      .orderBy(desc(breakthroughMoments.timestamp));
    
    if (limit) {
      return await baseQuery.limit(limit);
    }
    
    return await baseQuery;
  }
  
  // Memory Insights
  async createMemoryInsight(insight: InsertMemoryInsight): Promise<MemoryInsight> {
    const result = await db.insert(memoryInsights).values(insight).returning();
    return result[0];
  }
  
  async getMemoryInsights(patientId: string, insightType?: string): Promise<MemoryInsight[]> {
    const whereConditions = insightType 
      ? and(
          eq(memoryInsights.patientId, patientId),
          eq(memoryInsights.insightType, insightType)
        )
      : eq(memoryInsights.patientId, patientId);
    
    return await db.select()
      .from(memoryInsights)
      .where(whereConditions)
      .orderBy(desc(memoryInsights.calculatedAt));
  }
  
  async getActiveInsights(patientId: string): Promise<MemoryInsight[]> {
    const result = await db.select()
      .from(memoryInsights)
      .where(and(
        eq(memoryInsights.patientId, patientId),
        sql`${memoryInsights.expiresAt} > NOW() OR ${memoryInsights.expiresAt} IS NULL`
      ))
      .orderBy(desc(memoryInsights.calculatedAt));
    return result;
  }
  
  async updateInsightAccess(id: string): Promise<void> {
    await db.update(memoryInsights)
      .set({ lastAccessed: new Date() })
      .where(eq(memoryInsights.id, id));
  }
  
  // Emotional Pattern Analysis
  async createEmotionalPattern(pattern: InsertEmotionalPatternAnalysis): Promise<EmotionalPatternAnalysis> {
    const result = await db.insert(emotionalPatternAnalysis).values(pattern).returning();
    return result[0];
  }
  
  async getEmotionalPatterns(patientId: string, isActive?: boolean): Promise<EmotionalPatternAnalysis[]> {
    const whereConditions = isActive !== undefined 
      ? and(
          eq(emotionalPatternAnalysis.patientId, patientId),
          eq(emotionalPatternAnalysis.isActive, isActive)
        )
      : eq(emotionalPatternAnalysis.patientId, patientId);
    
    return await db.select()
      .from(emotionalPatternAnalysis)
      .where(whereConditions)
      .orderBy(desc(emotionalPatternAnalysis.detectedAt));
  }
  
  async updatePatternOccurrence(id: string): Promise<EmotionalPatternAnalysis | undefined> {
    const result = await db.update(emotionalPatternAnalysis)
      .set({
        occurrenceCount: sql`${emotionalPatternAnalysis.occurrenceCount} + 1`,
        lastObserved: new Date()
      })
      .where(eq(emotionalPatternAnalysis.id, id))
      .returning();
    return result[0];
  }

  // Analytics Support Methods
  async getAllPatients(): Promise<User[]> {
    const result = await db.select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return result;
  }

  async getRecentSnapshots(limit: number = 100): Promise<SessionMemorySnapshot[]> {
    const result = await db.select()
      .from(sessionMemorySnapshots)
      .orderBy(desc(sessionMemorySnapshots.timestamp))
      .limit(limit);
    return result;
  }

  async getAllBreakthroughs(): Promise<BreakthroughMoment[]> {
    const result = await db.select()
      .from(breakthroughMoments)
      .orderBy(desc(breakthroughMoments.timestamp));
    return result;
  }
  
  async deactivatePattern(id: string): Promise<void> {
    await db.update(emotionalPatternAnalysis)
      .set({ isActive: false })
      .where(eq(emotionalPatternAnalysis.id, id));
  }
}

// Use DbStorage for production-ready persistence
export const storage = new DbStorage();
