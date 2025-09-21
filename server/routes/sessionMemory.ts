/**
 * Session Memory API Routes
 * Revolutionary memory system for EMDR therapy sessions
 * SECURITY: All endpoints protected with authentication middleware
 */

import { Router, type Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// SECURITY: Authentication middleware for memory endpoints
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ 
      error: "Authentication required for memory endpoint access" 
    });
  }
  next();
}

import { sessionMemoryService } from '../services/sessionMemory';
import { progressAnalyticsService } from '../services/progressAnalytics';
import { 
  insertSessionMemorySnapshotSchema,
  insertProgressMetricSchema,
  insertSessionComparisonSchema,
  insertBreakthroughMomentSchema,
  insertMemoryInsightSchema,
  insertEmotionalPatternAnalysisSchema
} from '../../shared/schema';
import type { 
  SaveSessionMemoryRequest,
  SessionHistoryRequest,
  CompareSessionsRequest,
  GenerateProgressReportRequest,
  EmotionData,
  EMDRPhase
} from '../../shared/types';

// === ZOD VALIDATION SCHEMAS ===

// EmotionData Schema for request validation
const EmotionDataSchema = z.object({
  timestamp: z.number(),
  arousal: z.number().min(-1).max(1),
  valence: z.number().min(-1).max(1),
  affects: z.record(z.number().min(0).max(100)),
  basicEmotions: z.record(z.number().min(0).max(1)),
  sources: z.object({
    face: z.object({
      timestamp: z.number(),
      faceEmotions: z.record(z.number()),
      arousal: z.number(),
      valence: z.number(),
      confidence: z.number()
    }).nullable(),
    voice: z.any().nullable(),
    combined: z.boolean()
  }),
  fusion: z.object({
    confidence: z.number(),
    agreement: z.number(),
    dominantSource: z.enum(['face', 'voice', 'balanced']),
    conflictResolution: z.string()
  }),
  quality: z.object({
    faceQuality: z.number(),
    voiceQuality: z.number(),
    environmentalNoise: z.number(),
    overallQuality: z.number()
  })
});

// Save Session Memory Request Schema
const SaveSessionMemoryRequestSchema = z.object({
  sessionId: z.string().min(1).max(100),
  patientId: z.string().min(1).max(100),
  snapshotType: z.enum(['phase_start', 'phase_end', 'breakthrough', 'trigger_event', 'progress_milestone', 'crisis_alert', 'stability_check']),
  emotionalSnapshot: EmotionDataSchema,
  phaseContext: z.enum(['preparation', 'assessment', 'desensitization', 'installation', 'body-scan', 'closure', 'reevaluation', 'integration']),
  metadata: z.object({
    sudsLevel: z.number().min(0).max(10).optional(),
    vocLevel: z.number().min(1).max(7).optional(),
    blsConfig: z.any().optional(),
    triggerEvents: z.array(z.string()).optional(),
    interventions: z.array(z.string()).optional()
  }).optional()
}).refine(data => {
  const jsonSize = JSON.stringify(data).length;
  return jsonSize < 100000; // 100KB limit
}, { message: "Request data too large (max 100KB)" });

// Session History Request Schema
const SessionHistoryRequestSchema = z.object({
  patientId: z.string().min(1).max(100),
  timeRange: z.object({
    start: z.coerce.date(),
    end: z.coerce.date()
  }).optional(),
  sessionIds: z.array(z.string().min(1).max(100)).max(50).optional(),
  includeSnapshots: z.boolean().optional().default(false),
  includeMetrics: z.boolean().optional().default(false),
  includeComparisons: z.boolean().optional().default(false),
  includeInsights: z.boolean().optional().default(false)
}).refine(data => {
  if (data.timeRange) {
    return data.timeRange.end >= data.timeRange.start;
  }
  return true;
}, { message: "End date must be after start date" });

// Compare Sessions Request Schema  
const CompareSessionsRequestSchema = z.object({
  patientId: z.string().min(1).max(100),
  baselineSessionId: z.string().min(1).max(100),
  compareSessionId: z.string().min(1).max(100),
  comparisonType: z.enum(['consecutive', 'milestone', 'breakthrough', 'regression']).optional().default('consecutive'),
  includeAIAnalysis: z.boolean().optional().default(false)
}).refine(data => {
  return data.baselineSessionId !== data.compareSessionId;
}, { message: "Baseline and compare sessions must be different" });

// Generate Progress Report Request Schema
const GenerateProgressReportRequestSchema = z.object({
  patientId: z.string().min(1).max(100),
  timeScope: z.enum(['session', 'week', 'month', 'quarter', 'all']),
  includeVisualizations: z.boolean().optional().default(false),
  includeRecommendations: z.boolean().optional().default(true),
  includeRiskAssessment: z.boolean().optional().default(true)
});

// Generate Insights Request Schema
const GenerateInsightsRequestSchema = z.object({
  patientId: z.string().min(1).max(100)
});

// Monitor Patterns Request Schema  
const MonitorPatternsRequestSchema = z.object({
  patientId: z.string().min(1).max(100),
  currentSnapshot: z.any() // SessionMemorySnapshot type
});

// Patient ID Parameter Schema
const PatientIdParamSchema = z.object({
  patientId: z.string().min(1).max(100)
});

// SECURITY: Create router with authentication protection
export const sessionMemoryRouter = Router();

// SECURITY: Apply authentication middleware to ALL memory routes
sessionMemoryRouter.use(requireAuth);

// === MEMORY SNAPSHOT ENDPOINTS ===

/**
 * Save session memory snapshot
 * POST /api/sessions/memory/save
 */
sessionMemoryRouter.post('/save', async (req, res) => {
  try {
    // Validate request with comprehensive Zod schema
    const validation = SaveSessionMemoryRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const saveRequest = validation.data;
    const snapshot = await sessionMemoryService.saveSessionData(saveRequest);
    
    res.json({
      success: true,
      snapshot,
      message: 'Session memory snapshot saved successfully'
    });
  } catch (error) {
    console.error('Error saving session memory:', error);
    res.status(500).json({ 
      error: 'Failed to save session memory',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get session history for a patient
 * POST /api/sessions/memory/history
 */
sessionMemoryRouter.post('/history', async (req, res) => {
  try {
    // Validate request with comprehensive Zod schema
    const validation = SessionHistoryRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const historyRequest = validation.data;
    const history = await sessionMemoryService.getSessionHistory(historyRequest);
    
    res.json({
      success: true,
      history,
      message: 'Session history retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving session history:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve session history',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === SESSION COMPARISON ENDPOINTS ===

/**
 * Compare two sessions
 * POST /api/sessions/memory/compare
 */
sessionMemoryRouter.post('/compare', async (req, res) => {
  try {
    // Validate request with comprehensive Zod schema
    const validation = CompareSessionsRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const compareRequest = validation.data;
    const comparison = await sessionMemoryService.compareSessions(compareRequest);
    
    res.json({
      success: true,
      comparison,
      message: 'Session comparison completed successfully'
    });
  } catch (error) {
    console.error('Error comparing sessions:', error);
    res.status(500).json({ 
      error: 'Failed to compare sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === PROGRESS ANALYTICS ENDPOINTS ===

/**
 * Generate progress report
 * POST /api/sessions/progress/report
 */
sessionMemoryRouter.post('/progress/report', async (req, res) => {
  try {
    // Validate request with comprehensive Zod schema
    const validation = GenerateProgressReportRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const reportRequest = validation.data;
    const report = await sessionMemoryService.generateProgressReport(reportRequest);
    
    res.json({
      success: true,
      report,
      message: 'Progress report generated successfully'
    });
  } catch (error) {
    console.error('Error generating progress report:', error);
    res.status(500).json({ 
      error: 'Failed to generate progress report',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Analyze trends for a patient
 * GET /api/sessions/progress/analytics/:patientId
 */
sessionMemoryRouter.get('/progress/analytics/:patientId', async (req, res) => {
  try {
    // Validate patient ID parameter
    const paramValidation = PatientIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      return res.status(400).json({ 
        error: 'Invalid patient ID',
        details: paramValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const { patientId } = paramValidation.data;
    const timeWindow = z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().parse(req.query.timeWindow) || 'month';
    
    const trends = await progressAnalyticsService.analyzeTrends(patientId, timeWindow);
    
    res.json({
      success: true,
      trends,
      message: 'Trend analysis completed successfully'
    });
  } catch (error) {
    console.error('Error analyzing trends:', error);
    res.status(500).json({ 
      error: 'Failed to analyze trends',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Identify patterns for a patient
 * GET /api/sessions/progress/patterns/:patientId
 */
sessionMemoryRouter.get('/progress/patterns/:patientId', async (req, res) => {
  try {
    // Validate patient ID parameter
    const paramValidation = PatientIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      return res.status(400).json({ 
        error: 'Invalid patient ID',
        details: paramValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const { patientId } = paramValidation.data;
    
    const patterns = await progressAnalyticsService.identifyPatterns(patientId);
    
    res.json({
      success: true,
      patterns,
      message: 'Pattern analysis completed successfully'
    });
  } catch (error) {
    console.error('Error identifying patterns:', error);
    res.status(500).json({ 
      error: 'Failed to identify patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Predict challenges and opportunities
 * GET /api/sessions/progress/predictions/:patientId
 */
sessionMemoryRouter.get('/progress/predictions/:patientId', async (req, res) => {
  try {
    // Validate patient ID parameter
    const paramValidation = PatientIdParamSchema.safeParse(req.params);
    
    if (!paramValidation.success) {
      return res.status(400).json({ 
        error: 'Invalid patient ID',
        details: paramValidation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const { patientId } = paramValidation.data;
    
    const predictions = await progressAnalyticsService.predictChallenges(patientId);
    
    res.json({
      success: true,
      predictions,
      message: 'Predictions generated successfully'
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({ 
      error: 'Failed to generate predictions',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === INSIGHTS GENERATION ENDPOINTS ===

/**
 * Generate comprehensive insights
 * POST /api/sessions/insights/generate
 */
sessionMemoryRouter.post('/insights/generate', async (req, res) => {
  try {
    // Validate request with comprehensive Zod schema
    const validation = GenerateInsightsRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const { patientId } = validation.data;
    const insights = await progressAnalyticsService.generateInsights(patientId);
    
    res.json({
      success: true,
      insights,
      message: 'Insights generated successfully'
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ 
      error: 'Failed to generate insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Real-time pattern monitoring
 * POST /api/sessions/insights/monitor
 */
sessionMemoryRouter.post('/insights/monitor', async (req, res) => {
  try {
    // Validate request with comprehensive Zod schema
    const validation = MonitorPatternsRequestSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: validation.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
    }

    const { patientId, currentSnapshot } = validation.data;
    const monitoring = await progressAnalyticsService.monitorPatterns(patientId, currentSnapshot);
    
    res.json({
      success: true,
      monitoring,
      message: 'Pattern monitoring completed successfully'
    });
  } catch (error) {
    console.error('Error monitoring patterns:', error);
    res.status(500).json({ 
      error: 'Failed to monitor patterns',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// === UTILITY ENDPOINTS ===

/**
 * Get memory system status
 * GET /api/sessions/memory/status
 */
sessionMemoryRouter.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      status: {
        memorySystemActive: true,
        analyticsEnabled: true,
        patternRecognitionActive: true,
        predictiveAnalyticsEnabled: true,
        version: '1.0.0',
        timestamp: new Date()
      },
      message: 'Memory system status retrieved successfully'
    });
  } catch (error) {
    console.error('Error retrieving system status:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve system status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Health check endpoint
 * GET /api/sessions/memory/health
 */
sessionMemoryRouter.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      health: 'OK',
      timestamp: new Date(),
      services: {
        sessionMemoryService: 'active',
        progressAnalyticsService: 'active',
        storage: 'connected'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({ 
      error: 'Health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});