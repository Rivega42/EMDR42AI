import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { backendAITherapist } from "./services/aiTherapist";
import type { EmotionData, BLSConfiguration } from "../shared/types";

// Zod schemas for validation
const EmotionDataSchema = z.object({
  timestamp: z.number(),
  arousal: z.number().min(-1).max(1), // Fixed: Now uses [-1, 1] range
  valence: z.number().min(-1).max(1), // Fixed: Now uses [-1, 1] range
  affects: z.record(z.number().min(0).max(100)), // Percentages 0-100
  basicEmotions: z.record(z.number().min(0).max(1)) // Normalized 0-1
});

// Schema for emotion capture endpoint
const EmotionCaptureSchema = z.object({
  sessionId: z.string().min(1).max(100),
  emotionData: EmotionDataSchema,
  phase: z.enum(['preparation', 'assessment', 'desensitization', 'installation', 'body-scan', 'closure', 'reevaluation']).optional(),
  patientId: z.string().min(1).max(100).optional(),
  blsConfig: z.object({
    speed: z.number().min(1).max(10),
    color: z.string(),
    pattern: z.enum(['horizontal', 'vertical', 'diagonal', 'circular'])
  }).optional()
}).refine(data => {
  // Additional validation: ensure data size is reasonable
  const jsonSize = JSON.stringify(data).length;
  return jsonSize < 50000; // Max 50KB per capture
}, {
  message: "Emotion capture data too large (max 50KB)"
});

const AnalyzeRequestSchema = z.object({
  emotionData: EmotionDataSchema,
  sessionPhase: z.string(),
  sessionHistory: z.array(z.any()).optional().default([])
});

const BLSRequestSchema = z.object({
  emotionData: EmotionDataSchema
});

const InsightsRequestSchema = z.object({
  sessionData: z.object({
    emotionHistory: z.array(EmotionDataSchema).optional(),
    sudsLevel: z.number().optional(),
    vocLevel: z.number().optional()
  })
});

const PredictPhaseRequestSchema = z.object({
  currentPhase: z.string(),
  emotionHistory: z.array(EmotionDataSchema),
  sudsLevel: z.number().min(0).max(10)
});

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Therapist endpoints - secure backend-only processing
  
  // Analyze emotions and generate therapeutic response
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const validatedData = AnalyzeRequestSchema.parse(req.body);
      
      const response = await backendAITherapist.analyzeAndRespond(
        validatedData.emotionData,
        validatedData.sessionPhase,
        validatedData.sessionHistory
      );
      
      res.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      } else {
        console.error("AI analyze error:", error);
        res.status(500).json({ 
          error: "Failed to analyze emotions" 
        });
      }
    }
  });

  // Generate adaptive BLS configuration
  app.post("/api/ai/bls", async (req, res) => {
    try {
      const validatedData = BLSRequestSchema.parse(req.body);
      
      const blsConfig = await backendAITherapist.generateAdaptiveBLS(
        validatedData.emotionData
      );
      
      res.json(blsConfig);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      } else {
        console.error("BLS generation error:", error);
        res.status(500).json({ 
          error: "Failed to generate BLS configuration" 
        });
      }
    }
  });

  // Get therapeutic insights
  app.post("/api/ai/insights", async (req, res) => {
    try {
      const validatedData = InsightsRequestSchema.parse(req.body);
      
      const insights = await backendAITherapist.getTherapeuticInsights(
        validatedData.sessionData
      );
      
      res.json({ insights });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      } else {
        console.error("Insights generation error:", error);
        res.status(500).json({ 
          error: "Failed to generate insights" 
        });
      }
    }
  });

  // Predict next phase
  app.post("/api/ai/predict-phase", async (req, res) => {
    try {
      const validatedData = PredictPhaseRequestSchema.parse(req.body);
      
      const prediction = await backendAITherapist.predictNextPhase(
        validatedData.currentPhase,
        validatedData.emotionHistory,
        validatedData.sudsLevel
      );
      
      res.json(prediction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      } else {
        console.error("Phase prediction error:", error);
        res.status(500).json({ 
          error: "Failed to predict next phase" 
        });
      }
    }
  });

  // Rate limiting middleware for emotion capture
  const emotionCaptureRateLimiter = new Map<string, { count: number; resetTime: number }>();
  
  const checkRateLimit = (identifier: string): boolean => {
    const now = Date.now();
    const limit = emotionCaptureRateLimiter.get(identifier);
    
    if (!limit || now > limit.resetTime) {
      // Reset counter every minute
      emotionCaptureRateLimiter.set(identifier, {
        count: 1,
        resetTime: now + 60000 // 1 minute
      });
      return true;
    }
    
    if (limit.count >= 20) {
      // Max 20 requests per minute
      return false;
    }
    
    limit.count++;
    return true;
  };
  
  // Cleanup old rate limit entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    emotionCaptureRateLimiter.forEach((value, key) => {
      if (now > value.resetTime) {
        emotionCaptureRateLimiter.delete(key);
      }
    });
  }, 300000); // 5 minutes
  
  // Emotion capture endpoints with full validation
  
  // Save emotion capture with validation and rate limiting
  app.post("/api/emotions/capture", async (req, res) => {
    try {
      // Check authentication
      if (!req.session?.user) {
        return res.status(401).json({ 
          error: "Authentication required. Please log in to capture emotions." 
        });
      }
      
      // Rate limiting per user/IP combination
      const rateLimitKey = `${req.session.user.id}_${req.ip}`;
      if (!checkRateLimit(rateLimitKey)) {
        return res.status(429).json({ 
          error: "Rate limit exceeded. Maximum 20 requests per minute." 
        });
      }
      
      // Validate request body with Zod schema
      let validatedData;
      try {
        validatedData = EmotionCaptureSchema.parse(req.body);
      } catch (zodError) {
        if (zodError instanceof z.ZodError) {
          return res.status(400).json({ 
            error: "Invalid request data", 
            details: zodError.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          });
        }
        throw zodError;
      }
      
      // Use validated data with fallbacks
      const { emotionData, sessionId } = validatedData;
      const patientId = validatedData.patientId || req.session.user.id;
      const phase = validatedData.phase || 'desensitization';
      
      // Additional security: verify patient access
      if (req.session.user.role === 'patient' && 
          patientId !== req.session.user.id) {
        return res.status(403).json({ 
          error: "Access denied: cannot capture emotions for other patients" 
        });
      }
      
      // Create emotion capture record with validated data
      const emotionCapture = await storage.createEmotionCapture({
        sessionId,
        patientId,
        source: 'face',
        arousal: emotionData.arousal,
        valence: emotionData.valence,
        affects: emotionData.affects || {},
        basicEmotions: emotionData.basicEmotions || {},
        phaseContext: phase,
        blsConfig: validatedData.blsConfig || null
      });
      
      res.json({ 
        success: true, 
        captureId: emotionCapture.id,
        message: "Emotion captured successfully" 
      });
    } catch (error) {
      console.error("Emotion capture error:", error);
      res.status(500).json({ 
        error: "Failed to capture emotion data" 
      });
    }
  });
  
  // Get emotion captures for session
  app.get("/api/emotions/session/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const emotions = await storage.getEmotionCaptures(sessionId, limit);
      
      res.json({ 
        emotions,
        count: emotions.length 
      });
    } catch (error) {
      console.error("Get emotions error:", error);
      res.status(500).json({ 
        error: "Failed to get emotion data" 
      });
    }
  });
  
  // Get latest emotion for session
  app.get("/api/emotions/session/:sessionId/latest", async (req, res) => {
    try {
      const { sessionId } = req.params;
      
      const latestEmotion = await storage.getLatestEmotionCapture(sessionId);
      
      if (!latestEmotion) {
        return res.status(404).json({ 
          error: "No emotion data found for session" 
        });
      }
      
      res.json(latestEmotion);
    } catch (error) {
      console.error("Get latest emotion error:", error);
      res.status(500).json({ 
        error: "Failed to get latest emotion data" 
      });
    }
  });
  
  // Session management endpoints
  
  // Create new EMDR session
  app.post("/api/sessions", async (req, res) => {
    try {
      const { patientId, therapistId } = req.body;
      
      if (!patientId || !therapistId) {
        return res.status(400).json({ 
          error: "Missing required fields: patientId and therapistId" 
        });
      }
      
      const session = await storage.createSession({
        patientId,
        therapistId,
        phase: 'preparation',
        status: 'active',
        startTime: new Date(),
        endTime: null,
        notes: null,
        sudsInitial: null,
        sudsFinal: null,
        vocInitial: null,
        vocFinal: null
      });
      
      res.json(session);
    } catch (error) {
      console.error("Create session error:", error);
      res.status(500).json({ 
        error: "Failed to create session" 
      });
    }
  });
  
  // Get active session for patient
  app.get("/api/sessions/active/:patientId", async (req, res) => {
    try {
      const { patientId } = req.params;
      
      const session = await storage.getActiveSessionByPatient(patientId);
      
      if (!session) {
        return res.status(404).json({ 
          error: "No active session found" 
        });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Get active session error:", error);
      res.status(500).json({ 
        error: "Failed to get active session" 
      });
    }
  });
  
  // Update session
  app.patch("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const updates = req.body;
      
      const updatedSession = await storage.updateSession(sessionId, updates);
      
      if (!updatedSession) {
        return res.status(404).json({ 
          error: "Session not found" 
        });
      }
      
      res.json(updatedSession);
    } catch (error) {
      console.error("Update session error:", error);
      res.status(500).json({ 
        error: "Failed to update session" 
      });
    }
  });

  // Existing storage routes can go here
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}