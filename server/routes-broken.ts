import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { backendAITherapist } from "./services/aiTherapist";
import type { 
  EmotionData, 
  BLSConfiguration, 
  EMDRPhase, 
  AIChatContext,
  AITherapistMessage,
  AISessionGuidance,
  AIEmotionResponse,
  FaceEmotionData,
  VoiceEmotionData 
} from "../shared/types";

// Express session type augmentation
declare global {
  namespace Express {
    interface Request {
      session?: {
        user?: {
          id: string;
          role: string;
          name: string;
        };
      };
    }
  }
}

interface AuthenticatedRequest extends Request {
  session: {
    user?: {
      id: string;
      role: string;
      name: string;
    };
  };
}

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

// === New AI Therapist Schemas ===

// AI Chat Message Schema
const AIChatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z.object({
    sessionId: z.string(),
    patientProfile: z.object({
      id: z.string(),
      triggers: z.array(z.string()).default([]),
      calmingTechniques: z.array(z.string()).default([])
    }),
    conversationHistory: z.array(z.any()).default([]), // AITherapistMessage array
    currentEmotionalState: EmotionDataSchema,
    phaseContext: z.object({
      currentPhase: z.enum(['preparation', 'assessment', 'desensitization', 'installation', 'body-scan', 'closure', 'reevaluation', 'integration']),
      timeInPhase: z.number(),
      phaseGoals: z.array(z.string()).default([]),
      completionCriteria: z.array(z.string()).default([])
    }),
    sessionMetrics: z.object({
      sudsLevels: z.array(z.number()).default([]),
      vocLevels: z.array(z.number()).default([]),
      stabilityTrend: z.number().default(0.5)
    }).optional()
  })
});

// Session Guidance Schema
const SessionGuidanceSchema = z.object({
  currentPhase: z.enum(['preparation', 'assessment', 'desensitization', 'installation', 'body-scan', 'closure', 'reevaluation', 'integration']),
  emotionData: EmotionDataSchema,
  sessionMetrics: z.object({
    sudsLevels: z.array(z.number()).default([]),
    vocLevels: z.array(z.number()).default([]),
    stabilityTrend: z.number().default(0.5),
    timeInSession: z.number().default(0),
    phaseHistory: z.array(z.string()).default([])
  }).optional().default({})
});

// Emotion Response Schema
const EmotionResponseSchema = z.object({
  emotionData: EmotionDataSchema,
  currentPhase: z.enum(['preparation', 'assessment', 'desensitization', 'installation', 'body-scan', 'closure', 'reevaluation', 'integration']),
  sessionContext: z.object({
    sessionDuration: z.number().default(0),
    recentEmotions: z.array(EmotionDataSchema).default([]),
    interventionHistory: z.array(z.string()).default([])
  }).optional().default({})
});

// Rate limiting store for AI endpoints
const aiRateLimitStore = new Map<string, { count: number; resetTime: number }>();

// WebSocket connections for real-time voice streaming
const wsConnections = new Map<string, { ws: any; provider: string; lastActivity: number }>>();
const activeStreams = new Map<string, { provider: string; connection: any }>();
let wss: WebSocketServer;

// Helper function to create full EmotionData from basic emotion data
function createFullEmotionData(basicData: {
  timestamp: number;
  arousal: number;
  valence: number;
  affects: Record<string, number>;
  basicEmotions: Record<string, number>;
}): EmotionData {
  return {
    ...basicData,
    sources: {
      face: null, // Will be populated by face recognition service
      voice: null, // Will be populated by voice recognition service
      combined: false // Set to true when both sources are available
    },
    fusion: {
      confidence: 0.7, // Default confidence when using basic emotion data
      agreement: 0.8, // Default agreement score
      dominantSource: 'balanced', // Balanced when no specific source
      conflictResolution: 'weighted-average' // Default conflict resolution method
    },
    quality: {
      faceQuality: 0.0, // No face data available
      voiceQuality: 0.0, // No voice data available
      environmentalNoise: 0.1, // Low noise assumed
      overallQuality: 0.5 // Moderate quality for basic emotion data
    }
  };
}

// === Voice Provider API Keys (Server-Side Only) ===
const VOICE_PROVIDER_KEYS = {
  assemblyai: process.env.ASSEMBLYAI_API_KEY || '',
  humeai: process.env.HUME_AI_API_KEY || '',
  azure: process.env.AZURE_SPEECH_KEY || '',
  google: process.env.GOOGLE_CLOUD_API_KEY || ''
};

// Voice Provider Proxy Schemas
const VoiceProxyRequestSchema = z.object({
  provider: z.enum(['assemblyai', 'hume-ai', 'azure', 'google-cloud']),
  audioData: z.string(), // Base64 encoded audio
  audioFormat: z.enum(['pcm', 'webm', 'wav']).default('pcm'),
  sampleRate: z.number().default(16000),
  sessionId: z.string().optional()
});

const VoiceStreamRequestSchema = z.object({
  provider: z.enum(['assemblyai', 'hume-ai', 'azure', 'google-cloud']),
  sessionId: z.string(),
  action: z.enum(['start', 'stop', 'status'])
});

// Authentication middleware for AI therapist endpoints
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.user) {
    return res.status(401).json({ 
      error: "Authentication required for AI therapist access" 
    });
  }
  next();
}

// Rate limiting middleware for AI endpoints (10 requests per minute)
function aiRateLimit(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  const now = Date.now();
  const userLimit = aiRateLimitStore.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    aiRateLimitStore.set(userId, { count: 1, resetTime: now + 60000 }); // 1 minute
    return next();
  }
  
  if (userLimit.count >= 10) {
    return res.status(429).json({ 
      error: "Rate limit exceeded. Maximum 10 AI requests per minute." 
    });
  }
  
  userLimit.count++;
  next();
}

// Session ownership validation
function validateSessionOwnership(req: Request, res: Response, next: NextFunction) {
  const { sessionId } = req.body.context || req.body;
  const userId = req.session?.user?.id;
  
  if (!sessionId) {
    return res.status(400).json({ error: "Session ID required" });
  }
  
  // Extract patient ID from session ID if it follows pattern "session-patientId-timestamp-rand"
  const sessionParts = sessionId.split('-');
  if (sessionParts.length >= 3) {
    const sessionPatientId = sessionParts[1];
    if (sessionPatientId !== userId) {
      return res.status(403).json({ 
        error: "Access denied: Session does not belong to authenticated user" 
      });
    }
  }
  
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // AI Therapist endpoints - secure backend-only processing with authentication
  
  // Analyze emotions and generate therapeutic response
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const validatedData = AnalyzeRequestSchema.parse(req.body);
      
      const response = await backendAITherapist.analyzeAndRespond(
        createFullEmotionData(validatedData.emotionData),
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
        createFullEmotionData(validatedData.emotionData)
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
        validatedData.emotionHistory.map(createFullEmotionData),
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

  // === Revolutionary AI Therapist Endpoints ===

  // AI Therapist Chat Message - Direct communication with AI therapist
  app.post("/api/ai-therapist/message", requireAuth, aiRateLimit, validateSessionOwnership, async (req, res) => {
    try {
      const validatedData = AIChatMessageSchema.parse(req.body);
      
      // Create full AIChatContext with complete EmotionData
      const fullContext: AIChatContext = {
        ...validatedData.context,
        currentEmotionalState: createFullEmotionData(validatedData.context.currentEmotionalState),
        patientProfile: {
          ...validatedData.context.patientProfile,
          preferences: {} as any // Will be populated by backend service
        },
        sessionMetrics: validatedData.context.sessionMetrics || {
          sudsLevels: [],
          vocLevels: [],
          stabilityTrend: 0.5
        }
      };
      
      const aiMessage = await backendAITherapist.handleChatMessage(
        validatedData.message,
        fullContext
      );
      
      res.json(aiMessage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Validation error", 
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        console.error("AI therapist chat error:", error);
        res.status(500).json({ 
          error: "Failed to process chat message" 
        });
      }
    }
  });

  // AI Therapist Session Guidance - Get phase-specific guidance  
  app.post("/api/ai-therapist/session-guidance", requireAuth, aiRateLimit, async (req, res) => {
    try {
      const validatedData = SessionGuidanceSchema.parse(req.body);
      
      const sessionGuidance = await backendAITherapist.getSessionGuidance(
        validatedData.currentPhase,
        createFullEmotionData(validatedData.emotionData),
        validatedData.sessionMetrics
      );
      
      res.json(sessionGuidance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Validation error", 
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        console.error("Session guidance error:", error);
        res.status(500).json({ 
          error: "Failed to get session guidance" 
        });
      }
    }
  });

  // AI Therapist Emotion Response - Real-time emotion analysis and intervention
  app.post("/api/ai-therapist/emotion-response", requireAuth, aiRateLimit, validateSessionOwnership, async (req, res) => {
    try {
      const validatedData = EmotionResponseSchema.parse(req.body);
      
      const emotionResponse = await backendAITherapist.processEmotionResponse(
        createFullEmotionData(validatedData.emotionData),
        validatedData.currentPhase
      );
      
      res.json(emotionResponse);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Validation error", 
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        console.error("Emotion response error:", error);
        res.status(500).json({ 
          error: "Failed to process emotion response" 
        });
      }
    }
  });

  // === Voice Provider Security Proxy Endpoints ===
  
  // Process audio through voice providers (secure backend proxy)
  app.post("/api/voice/process", requireAuth, async (req, res) => {
    try {
      const validatedData = VoiceProxyRequestSchema.parse(req.body);
      const { provider, audioData, audioFormat, sampleRate } = validatedData;
      
      // Get API key for provider
      const apiKey = VOICE_PROVIDER_KEYS[provider as keyof typeof VOICE_PROVIDER_KEYS];
      if (!apiKey) {
        return res.status(500).json({ 
          error: `${provider} API key not configured on server` 
        });
      }
      
      // Process audio based on provider
      let emotionResult;
      
      switch (provider) {
        case 'assemblyai':
          emotionResult = await processAssemblyAIAudio(audioData, apiKey);
          break;
        case 'hume-ai':
          emotionResult = await processHumeAIAudio(audioData, apiKey);
          break;
        case 'azure':
          emotionResult = await processAzureAudio(audioData, apiKey);
          break;
        case 'google-cloud':
          emotionResult = await processGoogleAudio(audioData, apiKey);
          break;
        default:
          return res.status(400).json({ error: "Unsupported provider" });
      }
      
      res.json(emotionResult);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      } else {
        console.error(`Voice processing error:`, error);
        res.status(500).json({ 
          error: "Failed to process audio" 
        });
      }
    }
  });
  
  // Manage voice provider streaming sessions  
  app.post("/api/voice/stream", requireAuth, async (req, res) => {
    try {
      const validatedData = VoiceStreamRequestSchema.parse(req.body);
      const { provider, sessionId, action } = validatedData;
      
      // Get API key for provider
      const apiKey = VOICE_PROVIDER_KEYS[provider as keyof typeof VOICE_PROVIDER_KEYS];
      if (!apiKey) {
        return res.status(500).json({ 
          error: `${provider} API key not configured on server` 
        });
      }
      
      let result;
      
      switch (action) {
        case 'start':
          result = await startProviderStream(provider, sessionId, apiKey);
          break;
        case 'stop':
          result = await stopProviderStream(provider, sessionId);
          break;
        case 'status':
          result = await getProviderStreamStatus(provider, sessionId);
          break;
      }
      
      res.json(result);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      } else {
        console.error(`Voice stream error:`, error);
        res.status(500).json({ 
          error: "Failed to manage voice stream" 
        });
      }
    }
  });
  
  // Get available voice providers and their status
  app.get("/api/voice/providers", requireAuth, async (req, res) => {
    try {
      const providers = {
        assemblyai: { 
          name: "AssemblyAI", 
          available: !!VOICE_PROVIDER_KEYS.assemblyai,
          features: ["Real-time streaming", "Sentiment analysis", "High accuracy"]
        },
        "hume-ai": { 
          name: "Hume AI", 
          available: !!VOICE_PROVIDER_KEYS.humeai,
          features: ["48 emotion dimensions", "Prosody analysis", "Premium accuracy"]
        },
        azure: { 
          name: "Azure Speech", 
          available: !!VOICE_PROVIDER_KEYS.azure,
          features: ["Enterprise grade", "Multi-language", "Azure ecosystem"]
        },
        "google-cloud": { 
          name: "Google Cloud Speech", 
          available: !!VOICE_PROVIDER_KEYS.google,
          features: ["Google AI", "Auto-punctuation", "Cloud integration"]
        }
      };
      
      res.json({ providers });
      
    } catch (error) {
      console.error("Get providers error:", error);
      res.status(500).json({ 
        error: "Failed to get provider information" 
      });
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

  // Voice stream health check endpoint
  app.get("/api/voice/health", (req, res) => {
    const activeSessionsCount = wsConnections.size;
    const activeStreamsCount = activeStreams.size;
    
    res.json({
      status: 'healthy',
      websocketConnections: activeSessionsCount,
      activeStreams: activeStreamsCount,
      uptime: process.uptime(),
      timestamp: Date.now()
    });
  });

  // Create HTTP server and WebSocket server for real-time voice streaming
  const server = createServer(app);
  
  // Initialize WebSocket server for voice streaming
  wss = new WebSocketServer({ server, path: '/voice-stream' });
  
  // Handle WebSocket connections for real-time voice streaming
  wss.on('connection', (ws: any, req: any) => {
    const sessionId = new URL(req.url || '', 'http://localhost').searchParams.get('sessionId');
    const provider = new URL(req.url || '', 'http://localhost').searchParams.get('provider');
    
    if (!sessionId || !provider) {
      ws.close(1000, 'Missing sessionId or provider');
      return;
    }
    
    console.log(`🎤 WebSocket connected: ${provider} session ${sessionId}`);
    
    // Store WebSocket connection
    wsConnections.set(sessionId, {
      ws,
      provider,
      lastActivity: Date.now()
    });
    
    // Handle incoming audio data
    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'audio') {
          // Get stream configuration
          const stream = activeStreams.get(sessionId);
          if (!stream) {
            ws.send(JSON.stringify({ error: 'No active stream for session' }));
            return;
          }
          
          // Process audio through the appropriate provider
          const result = await processProviderAudio(provider, message.audioData, stream.connection.apiKey);
          
          // Send emotion results back to client
          ws.send(JSON.stringify({
            type: 'emotion',
            sessionId,
            provider,
            data: result,
            timestamp: Date.now()
          }));
          
          // Update last activity
          const connection = wsConnections.get(sessionId);
          if (connection) {
            connection.lastActivity = Date.now();
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ 
          error: 'Failed to process audio data',
          details: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });
    
    ws.on('close', () => {
      console.log(`🎤 WebSocket disconnected: ${provider} session ${sessionId}`);
      wsConnections.delete(sessionId);
    });
    
    ws.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(sessionId);
    });
  });
  
  // Cleanup inactive WebSocket connections every 30 seconds
  setInterval(() => {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes
    
    for (const [sessionId, connection] of wsConnections.entries()) {
      if (now - connection.lastActivity > timeout) {
        console.log(`🧹 Cleaning up inactive WebSocket: ${sessionId}`);
        try {
          connection.ws.close();
        } catch (err) {
          console.warn('Error closing inactive WebSocket:', err);
        }
        wsConnections.delete(sessionId);
      }
    }
  }, 30000);

  console.log('🚀 Voice WebSocket Server initialized on /voice-stream');
  return server;
}

// === Voice Provider Proxy Helper Functions ===

// Session management for streaming providers
// Note: activeStreams is declared at the top of the file with wsConnections

async function processAssemblyAIAudio(audioData: string, apiKey: string) {
  try {
    const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        expires_in: 3600, // 1 hour
        sample_rate: 16000
      })
    });

    if (!response.ok) {
      throw new Error(`AssemblyAI API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      provider: 'assemblyai',
      success: true,
      data: result,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('AssemblyAI processing error:', error);
    return {
      provider: 'assemblyai',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
}

async function processHumeAIAudio(audioData: string, apiKey: string) {
  try {
    // Hume AI WebSocket token generation
    const response = await fetch('https://api.hume.ai/oauth2-cc/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `grant_type=client_credentials&client_id=${apiKey}&client_secret=${apiKey}`
    });

    if (!response.ok) {
      throw new Error(`Hume AI API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      provider: 'hume-ai',
      success: true,
      data: result,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Hume AI processing error:', error);
    return {
      provider: 'hume-ai',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
}

async function processAzureAudio(audioData: string, apiKey: string) {
  try {
    // Use Azure Speech-to-Text with sentiment analysis
    const audioBuffer = Buffer.from(audioData, 'base64');
    
    // First get speech-to-text
    const speechResponse = await fetch('https://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed', {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'audio/wav'
      },
      body: audioBuffer
    });

    if (!speechResponse.ok) {
      throw new Error(`Azure Speech API error: ${speechResponse.status}`);
    }
    
    const speechResult = await speechResponse.json();
    const recognizedText = speechResult.DisplayText || '';
    
    // Then analyze sentiment using Text Analytics
    const sentimentResponse = await fetch('https://eastus.api.cognitive.microsoft.com/text/analytics/v3.1/sentiment', {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        documents: [{
          id: '1',
          language: 'en',
          text: recognizedText || 'neutral text'
        }]
      })
    });
    
    let sentimentResult = { documents: [{ sentiment: 'neutral', confidenceScores: { positive: 0.5, neutral: 0.5, negative: 0.0 } }] };
    if (sentimentResponse.ok) {
      sentimentResult = await sentimentResponse.json();
    }
    
    const sentiment = sentimentResult.documents[0];
    const confidence = Math.max(
      sentiment.confidenceScores.positive,
      sentiment.confidenceScores.neutral,
      sentiment.confidenceScores.negative
    );
    
    // Convert Azure sentiment to voice emotions
    const arousal = sentiment.sentiment === 'positive' ? 0.5 : (sentiment.sentiment === 'negative' ? -0.3 : 0);
    const valence = sentiment.confidenceScores.positive - sentiment.confidenceScores.negative;
    
    const voiceEmotions = {
      timestamp: Date.now(),
      prosody: {
        arousal,
        valence,
        intensity: confidence,
        pace: 0.5,
        volume: 0.6,
        pitch: valence * 0.3 + 0.5,
        stability: confidence
      },
      voiceEmotions: {
        confidence: confidence,
        excitement: sentiment.confidenceScores.positive * 0.8,
        stress: sentiment.confidenceScores.negative * 0.7,
        fatigue: 0.2,
        engagement: confidence,
        uncertainty: 1 - confidence,
        authenticity: 0.85
      },
      provider: 'azure',
      confidence: confidence,
      rawData: { speech: speechResult, sentiment: sentimentResult }
    };
    
    return {
      provider: 'azure',
      success: true,
      voiceEmotions,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Azure processing error:', error);
    return {
      provider: 'azure',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
}

async function processGoogleAudio(audioData: string, apiKey: string) {
  try {
    // Use Google Cloud Speech-to-Text
    const speechResponse = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true
        },
        audio: {
          content: audioData
        }
      })
    });

    if (!speechResponse.ok) {
      throw new Error(`Google Cloud Speech API error: ${speechResponse.status}`);
    }

    const speechResult = await speechResponse.json();
    const transcript = speechResult.results?.[0]?.alternatives?.[0]?.transcript || '';
    const confidence = speechResult.results?.[0]?.alternatives?.[0]?.confidence || 0.5;
    
    // Use Google Cloud Natural Language for sentiment
    const sentimentResponse = await fetch(`https://language.googleapis.com/v1/documents:analyzeSentiment?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        document: {
          type: 'PLAIN_TEXT',
          content: transcript || 'neutral text'
        }
      })
    });
    
    let sentimentResult = { documentSentiment: { score: 0, magnitude: 0.5 } };
    if (sentimentResponse.ok) {
      sentimentResult = await sentimentResponse.json();
    }
    
    const sentiment = sentimentResult.documentSentiment;
    const arousal = sentiment.magnitude * 0.5; // Magnitude indicates emotional intensity
    const valence = sentiment.score; // Score indicates positive/negative
    
    const voiceEmotions = {
      timestamp: Date.now(),
      prosody: {
        arousal,
        valence,
        intensity: sentiment.magnitude,
        pace: 0.5,
        volume: 0.6,
        pitch: valence * 0.3 + 0.5,
        stability: confidence
      },
      voiceEmotions: {
        confidence: confidence,
        excitement: Math.max(0, sentiment.score * sentiment.magnitude),
        stress: Math.max(0, -sentiment.score * sentiment.magnitude),
        fatigue: 0.2,
        engagement: confidence,
        uncertainty: 1 - confidence,
        authenticity: 0.8
      },
      provider: 'google-cloud',
      confidence: confidence,
      rawData: { speech: speechResult, sentiment: sentimentResult }
    };
    
    return {
      provider: 'google-cloud',
      success: true,
      voiceEmotions,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Google Cloud processing error:', error);
    return {
      provider: 'google-cloud',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
}

async function startProviderStream(provider: string, sessionId: string, apiKey: string) {
  try {
    // Create WebSocket connection for real-time streaming
    let providerWsUrl: string;
    let providerConfig: any = {};
    
    switch (provider) {
      case 'assemblyai':
        // Get AssemblyAI real-time token
        const assemblyResponse = await fetch('https://api.assemblyai.com/v2/realtime/token', {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            expires_in: 3600,
            sample_rate: 16000
          })
        });
        const assemblyData = await assemblyResponse.json();
        providerWsUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${assemblyData.token}`;
        break;
        
      case 'hume-ai':
        providerWsUrl = `wss://api.hume.ai/v0/stream/voice?apikey=${apiKey}`;
        providerConfig = {
          models: {
            prosody: {
              granularity: "utterance"
            }
          }
        };
        break;
        
      case 'azure':
        // Get Azure access token
        const azureTokenResponse = await fetch('https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken', {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        const azureToken = await azureTokenResponse.text();
        providerWsUrl = `wss://eastus.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?format=simple&language=en-US&X-ConnectionId=${sessionId}`;
        providerConfig = { token: azureToken };
        break;
        
      case 'google-cloud':
        providerWsUrl = `wss://speech.googleapis.com/v1/speech:streamingrecognize?key=${apiKey}`;
        providerConfig = {
          streamingConfig: {
            config: {
              encoding: 'LINEAR16',
              sampleRateHertz: 16000,
              languageCode: 'en-US',
              enableAutomaticPunctuation: true
            },
            interimResults: true
          }
        };
        break;
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }

    // Store stream configuration
    const streamConfig = {
      provider,
      sessionId,
      wsUrl: providerWsUrl,
      config: providerConfig,
      startTime: Date.now(),
      status: 'active',
      apiKey // Stored securely on server only
    };

    activeStreams.set(sessionId, { provider, connection: streamConfig });

    return {
      success: true,
      sessionId,
      provider,
      wsUrl: providerWsUrl,
      config: providerConfig,
      message: `${provider} stream started`,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`Start stream error for ${provider}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
}

async function stopProviderStream(provider: string, sessionId: string) {
  try {
    // Close WebSocket connection if exists
    const wsConnection = wsConnections.get(sessionId);
    if (wsConnection) {
      try {
        wsConnection.ws.close();
      } catch (err) {
        console.warn('Error closing WebSocket:', err);
      }
      wsConnections.delete(sessionId);
    }
    
    // Remove from active streams
    const stream = activeStreams.get(sessionId);
    if (stream) {
      activeStreams.delete(sessionId);
    }

    return {
      success: true,
      sessionId,
      provider,
      message: `${provider} stream stopped`,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`Stop stream error for ${provider}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
}

async function getProviderStreamStatus(provider: string, sessionId: string) {
  try {
    const stream = activeStreams.get(sessionId);
    
    return {
      success: true,
      sessionId,
      provider,
      isActive: !!stream,
      status: stream ? 'active' : 'inactive',
      timestamp: Date.now()
    };
  } catch (error) {
    console.error(`Get stream status error for ${provider}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    };
  }
}

// Helper function to route audio processing to correct provider
async function processProviderAudio(provider: string, audioData: string, apiKey: string) {
  switch (provider) {
    case 'assemblyai':
      return await processAssemblyAIAudio(audioData, apiKey);
    case 'hume-ai':
      return await processHumeAIAudio(audioData, apiKey);
    case 'azure':
      return await processAzureAudio(audioData, apiKey);
    case 'google-cloud':
      return await processGoogleAudio(audioData, apiKey);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

