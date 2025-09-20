import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { backendAITherapist } from "./services/aiTherapist";
import type { EmotionData, BLSConfiguration } from "../shared/types";

// Zod schemas for validation
const EmotionDataSchema = z.object({
  timestamp: z.number(),
  arousal: z.number().min(0).max(1),
  valence: z.number().min(0).max(1),
  affects: z.record(z.number()),
  basicEmotions: z.record(z.number())
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

  // Existing storage routes can go here
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}