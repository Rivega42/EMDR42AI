/**
 * Session Memory API Routes
 * Revolutionary memory system for EMDR therapy sessions
 */

import { Router } from 'express';
import { z } from 'zod';
import { sessionMemoryService } from '../services/sessionMemory';
import { progressAnalyticsService } from '../services/progressAnalytics';
import type { 
  SaveSessionMemoryRequest,
  SessionHistoryRequest,
  CompareSessionsRequest,
  GenerateProgressReportRequest
} from '../../shared/types';

export const sessionMemoryRouter = Router();

// === MEMORY SNAPSHOT ENDPOINTS ===

/**
 * Save session memory snapshot
 * POST /api/sessions/memory/save
 */
sessionMemoryRouter.post('/save', async (req, res) => {
  try {
    const saveRequest = req.body as SaveSessionMemoryRequest;
    
    // Validate required fields
    if (!saveRequest.sessionId || !saveRequest.patientId || !saveRequest.emotionalSnapshot) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, patientId, emotionalSnapshot' 
      });
    }

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
    const historyRequest = req.body as SessionHistoryRequest;
    
    if (!historyRequest.patientId) {
      return res.status(400).json({ 
        error: 'Missing required field: patientId' 
      });
    }

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
    const compareRequest = req.body as CompareSessionsRequest;
    
    if (!compareRequest.patientId || !compareRequest.baselineSessionId || !compareRequest.compareSessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: patientId, baselineSessionId, compareSessionId' 
      });
    }

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
    const reportRequest = req.body as GenerateProgressReportRequest;
    
    if (!reportRequest.patientId) {
      return res.status(400).json({ 
        error: 'Missing required field: patientId' 
      });
    }

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
    const { patientId } = req.params;
    const { timeWindow = 'month' } = req.query;
    
    const trends = await progressAnalyticsService.analyzeTrends(patientId, timeWindow as string);
    
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
    const { patientId } = req.params;
    
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
    const { patientId } = req.params;
    
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
    const { patientId } = req.body;
    
    if (!patientId) {
      return res.status(400).json({ 
        error: 'Missing required field: patientId' 
      });
    }

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
    const { patientId, currentSnapshot } = req.body;
    
    if (!patientId || !currentSnapshot) {
      return res.status(400).json({ 
        error: 'Missing required fields: patientId, currentSnapshot' 
      });
    }

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