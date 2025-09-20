import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb, real, boolean, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table with extended fields for EMDR platform
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('patient'), // 'patient', 'therapist', 'admin'
  email: text("email"),
  fullName: text("full_name"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
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
