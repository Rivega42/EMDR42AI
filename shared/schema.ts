import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, real, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth - CRITICAL FOR AUTHENTICATION
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User table with Replit Auth support + EMDR platform fields
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // EMDR-specific fields
  role: text("role").notNull().default('patient'), // 'patient', 'therapist', 'admin', 'researcher'
  username: text("username").unique(), // Optional username for display
  specialization: text("specialization"), // For therapists
  licenseNumber: text("license_number"), // For therapists  
  clinicalLevel: text("clinical_level"), // 'trainee', 'licensed', 'supervisor'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// EMDR Sessions table
export const emdrSessions = pgTable("emdr_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull().default(sql`now()`),
  endTime: timestamp("end_time"),
  phase: text("phase").notNull().default('preparation'),
  status: text("status").notNull().default('active'), // 'active', 'paused', 'completed', 'cancelled'
  notes: text("notes"),
  sudsInitial: integer("suds_initial"),
  sudsFinal: integer("suds_final"),
  vocInitial: real("voc_initial"),
  vocFinal: real("voc_final"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Emotion Captures table for storing real-time emotion data
export const emotionCaptures = pgTable("emotion_captures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => emdrSessions.id),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  source: text("source").notNull(), // 'face', 'voice', 'combined'
  arousal: real("arousal").notNull(), // 0-1 scale
  valence: real("valence").notNull(), // 0-1 scale
  affects: jsonb("affects").notNull().default('{}'), // JSON object with 98 affects
  basicEmotions: jsonb("basic_emotions").notNull().default('{}'), // Basic emotions object
  blsConfig: jsonb("bls_config"), // Current BLS configuration at capture time
  phaseContext: text("phase_context"), // EMDR phase at capture time
}, (table) => ({
  sessionIdx: index("emotion_captures_session_idx").on(table.sessionId),
  timestampIdx: index("emotion_captures_timestamp_idx").on(table.timestamp),
}));

// AI Therapy Sessions table for logging AI interventions
export const aiTherapySessions = pgTable("ai_therapy_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => emdrSessions.id),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull().default(sql`now()`),
  endTime: timestamp("end_time"),
  aiModel: text("ai_model").notNull().default('gpt-4'), // Model used for AI therapy
  interventions: jsonb("interventions").notNull().default('[]'), // Array of AI interventions
  emotionCaptureIds: text("emotion_capture_ids").array(), // Array of emotion capture IDs
  sudsChange: real("suds_change"), // Change in SUDS level
  vocChange: real("voc_change"), // Change in VOC level
  emotionalShift: real("emotional_shift"), // Overall emotional shift metric
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Therapeutic Memory table for cross-session continuity
export const therapeuticMemory = pgTable("therapeutic_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  sessionCount: integer("session_count").notNull().default(0),
  keyThemes: text("key_themes").array(), // Array of recurring themes
  progressMetrics: jsonb("progress_metrics").notNull().default('{}'), // Progress tracking object
  adaptivePreferences: jsonb("adaptive_preferences").notNull().default('{}'), // Patient's BLS preferences
  emotionalPatterns: jsonb("emotional_patterns").notNull().default('{}'), // Patterns in emotional responses
  treatmentPlan: text("treatment_plan"),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  patientTherapistIdx: index("therapeutic_memory_patient_therapist_idx").on(table.patientId, table.therapistId),
}));

// BLS Configurations table for storing custom BLS patterns
export const blsConfigurations = pgTable("bls_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  speed: integer("speed").notNull().default(5),
  pattern: text("pattern").notNull().default('horizontal'),
  color: text("color").notNull().default('#3b82f6'),
  size: integer("size").notNull().default(20),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  adaptiveMode: boolean("adaptive_mode").notNull().default(false),
  createdBy: varchar("created_by").references(() => users.id),
  isPublic: boolean("is_public").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Session Notes table for detailed session documentation
export const sessionNotes = pgTable("session_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => emdrSessions.id),
  authorId: varchar("author_id").notNull().references(() => users.id),
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  phase: text("phase").notNull(),
  content: text("content").notNull(),
  emotionalState: jsonb("emotional_state"), // Optional emotion data at note time
  sudsLevel: integer("suds_level"),
  vocLevel: real("voc_level"),
  isPrivate: boolean("is_private").notNull().default(false),
}, (table) => ({
  sessionIdx: index("session_notes_session_idx").on(table.sessionId),
}));

// === REVOLUTIONARY SESSION MEMORY & PROGRESS SYSTEM ===

// Session Memory Snapshots - Comprehensive emotional data snapshots for each session
export const sessionMemorySnapshots = pgTable("session_memory_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => emdrSessions.id),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  snapshotType: text("snapshot_type").notNull(), // 'session_start', 'session_end', 'phase_transition', 'breakthrough', 'crisis'
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  emotionalSnapshot: jsonb("emotional_snapshot").notNull(), // Complete emotion data at this moment
  phaseContext: text("phase_context").notNull(),
  sudsLevel: integer("suds_level"),
  vocLevel: real("voc_level"),
  stabilityScore: real("stability_score"), // 0-1, emotional stability
  engagementLevel: real("engagement_level"), // 0-1, patient engagement
  stressLevel: real("stress_level"), // 0-1, stress indicators
  blsEffectiveness: real("bls_effectiveness"), // 0-1, how effective current BLS was
  aiAnalysis: jsonb("ai_analysis"), // AI insights about this moment
  keyInsights: text("key_insights").array(), // Important observations
  triggerEvents: text("trigger_events").array(), // Events that triggered this snapshot
  recoveryTime: integer("recovery_time"), // ms to recover from distress
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
}, (table) => ({
  sessionIdx: index("session_memory_snapshots_session_idx").on(table.sessionId),
  patientIdx: index("session_memory_snapshots_patient_idx").on(table.patientId),
  timestampIdx: index("session_memory_snapshots_timestamp_idx").on(table.timestamp),
  snapshotTypeIdx: index("session_memory_snapshots_type_idx").on(table.snapshotType),
}));

// Progress Metrics - Detailed progress tracking across sessions
export const progressMetrics = pgTable("progress_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  therapistId: varchar("therapist_id").notNull().references(() => users.id),
  sessionId: varchar("session_id").references(() => emdrSessions.id), // null for cumulative metrics
  metricType: text("metric_type").notNull(), // 'session', 'weekly', 'monthly', 'cumulative'
  timeWindow: text("time_window").notNull(), // ISO date range or session ID
  sudsProgress: jsonb("suds_progress").notNull(), // {initial, final, change, trend}
  vocProgress: jsonb("voc_progress").notNull(), // {initial, final, change, trend}
  emotionalStability: jsonb("emotional_stability").notNull(), // Stability metrics over time
  triggerPatterns: jsonb("trigger_patterns").notNull(), // Identified trigger patterns
  calmingTechniques: jsonb("calming_techniques").notNull(), // Effectiveness of different techniques
  phaseProgression: jsonb("phase_progression").notNull(), // How quickly patient progresses through phases
  breakthroughIndicators: jsonb("breakthrough_indicators").notNull(), // Signs of breakthrough moments
  regressionRisk: real("regression_risk"), // 0-1, risk of regression
  treatmentEffectiveness: real("treatment_effectiveness"), // 0-1, overall treatment effectiveness
  nextSessionPredictions: jsonb("next_session_predictions"), // AI predictions for next session
  calculatedAt: timestamp("calculated_at").notNull().default(sql`now()`),
  isValid: boolean("is_valid").notNull().default(true), // For invalidating outdated metrics
}, (table) => ({
  patientIdx: index("progress_metrics_patient_idx").on(table.patientId),
  sessionIdx: index("progress_metrics_session_idx").on(table.sessionId),
  metricTypeIdx: index("progress_metrics_type_idx").on(table.metricType),
  calculatedAtIdx: index("progress_metrics_calculated_idx").on(table.calculatedAt),
}));

// Session Comparisons - Direct comparisons between sessions
export const sessionComparisons = pgTable("session_comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  baselineSessionId: varchar("baseline_session_id").notNull().references(() => emdrSessions.id),
  compareSessionId: varchar("compare_session_id").notNull().references(() => emdrSessions.id),
  comparisonType: text("comparison_type").notNull(), // 'consecutive', 'milestone', 'regression_check', 'improvement_trend'
  emotionalDelta: jsonb("emotional_delta").notNull(), // Difference in emotional states
  sudsDelta: real("suds_delta").notNull(), // Change in SUDS scores
  vocDelta: real("voc_delta").notNull(), // Change in VOC scores
  stabilityImprovement: real("stability_improvement"), // Change in emotional stability
  triggerSensitivity: real("trigger_sensitivity"), // Change in trigger sensitivity
  copingImprovement: real("coping_improvement"), // Improvement in coping mechanisms
  phaseEfficiency: jsonb("phase_efficiency"), // How efficiently patient moved through phases
  blsEffectivenessChange: real("bls_effectiveness_change"), // Change in BLS effectiveness
  significantChanges: text("significant_changes").array(), // Notable changes observed
  improvementAreas: text("improvement_areas").array(), // Areas showing improvement
  concernAreas: text("concern_areas").array(), // Areas of concern
  aiInsights: jsonb("ai_insights"), // AI analysis of the comparison
  confidenceScore: real("confidence_score"), // 0-1, confidence in comparison analysis
  calculatedAt: timestamp("calculated_at").notNull().default(sql`now()`),
}, (table) => ({
  patientIdx: index("session_comparisons_patient_idx").on(table.patientId),
  baselineIdx: index("session_comparisons_baseline_idx").on(table.baselineSessionId),
  compareIdx: index("session_comparisons_compare_idx").on(table.compareSessionId),
  typeIdx: index("session_comparisons_type_idx").on(table.comparisonType),
}));

// Breakthrough Moments - Key therapeutic breakthroughs and insights
export const breakthroughMoments = pgTable("breakthrough_moments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => emdrSessions.id),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  momentType: text("moment_type").notNull(), // 'cognitive_shift', 'emotional_release', 'memory_integration', 'insight', 'resistance_breakthrough'
  timestamp: timestamp("timestamp").notNull().default(sql`now()`),
  phaseContext: text("phase_context").notNull(),
  description: text("description").notNull(),
  emotionalBefore: jsonb("emotional_before").notNull(), // Emotional state before breakthrough
  emotionalAfter: jsonb("emotional_after").notNull(), // Emotional state after breakthrough
  sudsBefore: integer("suds_before"),
  sudsAfter: integer("suds_after"),
  triggerEvent: text("trigger_event"), // What triggered this breakthrough
  interventionUsed: text("intervention_used"), // BLS pattern, technique, etc.
  duration: integer("duration"), // Duration of breakthrough process in seconds
  intensity: real("intensity"), // 0-1, intensity of the breakthrough
  significanceLevel: real("significance_level"), // 0-1, how significant this breakthrough was
  therapeuticImpact: real("therapeutic_impact"), // 0-1, impact on overall therapy
  aiAnalysis: jsonb("ai_analysis"), // AI insights about this breakthrough
  followUpNeeded: boolean("follow_up_needed").default(false),
  followUpNotes: text("follow_up_notes"),
}, (table) => ({
  sessionIdx: index("breakthrough_moments_session_idx").on(table.sessionId),
  patientIdx: index("breakthrough_moments_patient_idx").on(table.patientId),
  momentTypeIdx: index("breakthrough_moments_type_idx").on(table.momentType),
  timestampIdx: index("breakthrough_moments_timestamp_idx").on(table.timestamp),
}));

// Memory Insights Cache - Pre-computed insights for faster access
export const memoryInsights = pgTable("memory_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  insightType: text("insight_type").notNull(), // 'pattern_analysis', 'progress_summary', 'prediction', 'recommendation', 'risk_assessment'
  timeScope: text("time_scope").notNull(), // 'session', 'week', 'month', 'all_time'
  insightData: jsonb("insight_data").notNull(), // The actual insight content
  confidence: real("confidence").notNull(), // 0-1, confidence in this insight
  relevanceScore: real("relevance_score").notNull(), // 0-1, how relevant/important this insight is
  actionable: boolean("actionable").notNull().default(false), // Whether this insight suggests specific actions
  recommendations: text("recommendations").array(), // Specific recommendations based on insight
  dataSource: text("data_source").array(), // Which data sources contributed to this insight
  calculationMethod: text("calculation_method"), // How this insight was calculated
  expiresAt: timestamp("expires_at"), // When this insight becomes stale
  tags: text("tags").array(), // Tags for categorization
  priority: text("priority").default('medium'), // 'low', 'medium', 'high', 'critical'
  calculatedAt: timestamp("calculated_at").notNull().default(sql`now()`),
  lastAccessed: timestamp("last_accessed").default(sql`now()`),
}, (table) => ({
  patientIdx: index("memory_insights_patient_idx").on(table.patientId),
  typeIdx: index("memory_insights_type_idx").on(table.insightType),
  timeIdx: index("memory_insights_time_idx").on(table.timeScope),
  priorityIdx: index("memory_insights_priority_idx").on(table.priority),
  calculatedIdx: index("memory_insights_calculated_idx").on(table.calculatedAt),
}));

// Emotional Pattern Analysis - Advanced pattern recognition in emotional data
export const emotionalPatternAnalysis = pgTable("emotional_pattern_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: varchar("patient_id").notNull().references(() => users.id),
  patternType: text("pattern_type").notNull(), // 'trigger_response', 'recovery_cycle', 'stability_trend', 'breakthrough_precursor', 'regression_warning'
  patternName: text("pattern_name").notNull(), // Human-readable pattern name
  description: text("description").notNull(),
  detectedAt: timestamp("detected_at").notNull().default(sql`now()`),
  firstObserved: timestamp("first_observed").notNull(),
  lastObserved: timestamp("last_observed").notNull(),
  occurrenceCount: integer("occurrence_count").notNull().default(1),
  patternData: jsonb("pattern_data").notNull(), // Detailed pattern structure
  triggerConditions: jsonb("trigger_conditions"), // Conditions that trigger this pattern
  typicalDuration: integer("typical_duration"), // Average duration in seconds
  emotionalSignature: jsonb("emotional_signature").notNull(), // Characteristic emotional profile
  predictiveValue: real("predictive_value"), // 0-1, how predictive this pattern is
  therapeuticRelevance: real("therapeutic_relevance"), // 0-1, relevance to therapy
  interventionEffectiveness: jsonb("intervention_effectiveness"), // How different interventions affect this pattern
  relatedPatterns: text("related_patterns").array(), // IDs of related patterns
  strengthTrend: real("strength_trend"), // -1 to 1, whether pattern is getting stronger or weaker
  riskLevel: text("risk_level").default('medium'), // 'low', 'medium', 'high' - risk associated with pattern
  isActive: boolean("is_active").notNull().default(true),
  aiAnalysis: jsonb("ai_analysis"), // AI insights about this pattern
}, (table) => ({
  patientIdx: index("emotional_pattern_analysis_patient_idx").on(table.patientId),
  typeIdx: index("emotional_pattern_analysis_type_idx").on(table.patternType),
  detectedIdx: index("emotional_pattern_analysis_detected_idx").on(table.detectedAt),
  activeIdx: index("emotional_pattern_analysis_active_idx").on(table.isActive),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
  fullName: true,
});

export const insertSessionSchema = createInsertSchema(emdrSessions).omit({
  id: true,
  createdAt: true,
});

export const insertEmotionCaptureSchema = createInsertSchema(emotionCaptures).omit({
  id: true,
  timestamp: true,
});

export const insertAITherapySessionSchema = createInsertSchema(aiTherapySessions).omit({
  id: true,
  createdAt: true,
});

export const insertTherapeuticMemorySchema = createInsertSchema(therapeuticMemory).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertBLSConfigurationSchema = createInsertSchema(blsConfigurations).omit({
  id: true,
  createdAt: true,
});

export const insertSessionNoteSchema = createInsertSchema(sessionNotes).omit({
  id: true,
  timestamp: true,
});

// === INSERT SCHEMAS FOR MEMORY & PROGRESS SYSTEM ===

export const insertSessionMemorySnapshotSchema = createInsertSchema(sessionMemorySnapshots).omit({
  id: true,
  timestamp: true,
  createdAt: true,
});

export const insertProgressMetricSchema = createInsertSchema(progressMetrics).omit({
  id: true,
  calculatedAt: true,
});

export const insertSessionComparisonSchema = createInsertSchema(sessionComparisons).omit({
  id: true,
  calculatedAt: true,
});

export const insertBreakthroughMomentSchema = createInsertSchema(breakthroughMoments).omit({
  id: true,
  timestamp: true,
});

export const insertMemoryInsightSchema = createInsertSchema(memoryInsights).omit({
  id: true,
  calculatedAt: true,
  lastAccessed: true,
});

export const insertEmotionalPatternAnalysisSchema = createInsertSchema(emotionalPatternAnalysis).omit({
  id: true,
  detectedAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof emdrSessions.$inferSelect;

export type InsertEmotionCapture = z.infer<typeof insertEmotionCaptureSchema>;
export type EmotionCapture = typeof emotionCaptures.$inferSelect;

export type InsertAITherapySession = z.infer<typeof insertAITherapySessionSchema>;
export type AITherapySession = typeof aiTherapySessions.$inferSelect;

export type InsertTherapeuticMemory = z.infer<typeof insertTherapeuticMemorySchema>;
export type TherapeuticMemory = typeof therapeuticMemory.$inferSelect;

export type InsertBLSConfiguration = z.infer<typeof insertBLSConfigurationSchema>;
export type BLSConfiguration = typeof blsConfigurations.$inferSelect;

export type InsertSessionNote = z.infer<typeof insertSessionNoteSchema>;
export type SessionNote = typeof sessionNotes.$inferSelect;

// === TYPE EXPORTS FOR MEMORY & PROGRESS SYSTEM ===

export type InsertSessionMemorySnapshot = z.infer<typeof insertSessionMemorySnapshotSchema>;
export type SessionMemorySnapshot = typeof sessionMemorySnapshots.$inferSelect;

export type InsertProgressMetric = z.infer<typeof insertProgressMetricSchema>;
export type ProgressMetric = typeof progressMetrics.$inferSelect;

export type InsertSessionComparison = z.infer<typeof insertSessionComparisonSchema>;
export type SessionComparison = typeof sessionComparisons.$inferSelect;

export type InsertBreakthroughMoment = z.infer<typeof insertBreakthroughMomentSchema>;
export type BreakthroughMoment = typeof breakthroughMoments.$inferSelect;

export type InsertMemoryInsight = z.infer<typeof insertMemoryInsightSchema>;
export type MemoryInsight = typeof memoryInsights.$inferSelect;

export type InsertEmotionalPatternAnalysis = z.infer<typeof insertEmotionalPatternAnalysisSchema>;
export type EmotionalPatternAnalysis = typeof emotionalPatternAnalysis.$inferSelect;

// Auth types for Replit authentication
export type UpsertUser = typeof users.$inferInsert;
export type InsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type BLSConfiguration = typeof blsConfigurations.$inferSelect;

export type InsertSessionNote = z.infer<typeof insertSessionNoteSchema>;
export type SessionNote = typeof sessionNotes.$inferSelect;
