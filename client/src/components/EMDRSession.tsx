import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Phone,
  Settings,
  Clock,
  Square,
  Brain,
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Activity,
  Waves,
  Eye
} from "lucide-react";
import BilateralStimulation, { BilateralStimulationRef } from "./BilateralStimulation";
import EmotionDisplay from "./emotion/EmotionDisplay";
import { AITherapist } from "./ai/AITherapist";

// === REVOLUTIONARY MULTIMODAL EMOTION SYSTEM ===
import { 
  unifiedEmotionService, 
  type UnifiedEmotionConfig,
  type EmotionServiceStatus
} from '@/services/emotion/emotionService';

import type { 
  SessionParticipant, 
  EMDRPhase, 
  EmotionData,
  PersonalizedRecommendation,
  CrisisDetection,
  VoiceAnalysisStatus
} from '@/../../shared/types';

// Types are now imported from shared/types.ts

export default function EMDRSession() {
  const [sessionActive, setSessionActive] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [phase, setPhase] = useState<EMDRPhase>('preparation');
  const [currentEmotions, setCurrentEmotions] = useState<EmotionData | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  const emotionSaveIntervalRef = useRef<number | null>(null);
  const lastSavedEmotionsRef = useRef<EmotionData | null>(null);
  
  // === REVOLUTIONARY MULTIMODAL EMOTION STATE ===
  const [emotionServiceStatus, setEmotionServiceStatus] = useState<EmotionServiceStatus | null>(null);
  const [isMultimodalActive, setIsMultimodalActive] = useState(false);
  const [voiceRecordingEnabled, setVoiceRecordingEnabled] = useState(false);
  const [emotionMode, setEmotionMode] = useState<'face-only' | 'voice-only' | 'multimodal' | 'auto'>('auto');
  const videoElementRef = useRef<HTMLVideoElement>(null);
  
  // === REVOLUTIONARY LIVE TELEMETRY & PROVIDER HEALTH ===
  const [voiceAnalysisStatus, setVoiceAnalysisStatus] = useState<VoiceAnalysisStatus | null>(null);
  const [providerHealth, setProviderHealth] = useState<Map<string, any>>(new Map());
  const [currentProvider, setCurrentProvider] = useState<string>('assemblyai');
  const [providerSwitchHistory, setProviderSwitchHistory] = useState<Array<{oldProvider: string, newProvider: string, timestamp: number, reason: string}>>([]);
  const [liveTelemetry, setLiveTelemetry] = useState({
    packetsReceived: 0,
    providerFailures: 0,
    currentLatency: 0,
    uptime: 0,
    connectionId: '',
    authMethod: 'unknown',
    lastUpdate: Date.now()
  });
  const [fusionMetrics, setFusionMetrics] = useState({
    isActive: false,
    strategy: 'weighted-average',
    confidence: 0,
    conflictRate: 0,
    faceSources: 0,
    voiceSources: 0,
    lastFusion: 0
  });
  const [systemMetrics, setSystemMetrics] = useState({
    totalPackets: 0,
    lostPackets: 0,
    avgLatency: 0,
    jitter: 0,
    uptime: 0,
    reconnections: 0
  });
  const [showTelemetry, setShowTelemetry] = useState(true);
  
  // === Revolutionary AI Therapist State ===
  const [aiTherapistActive, setAiTherapistActive] = useState(true);
  const [currentRecommendations, setCurrentRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [crisisAlert, setCrisisAlert] = useState<CrisisDetection | null>(null);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [patientId] = useState(() => `patient-${Date.now()}`); // TODO: Get from auth context
  const [aiPhaseRecommendations, setAiPhaseRecommendations] = useState<string[]>([]);
  const [autoPhaseTransition, setAutoPhaseTransition] = useState(true);
  
  // Adaptive BLS control with hysteresis
  const [blsState, setBlsState] = useState<'normal' | 'stressed' | 'low-engagement'>('normal');
  const lastBlsUpdateRef = useRef<number>(Date.now());
  const blsDebounceTime = 2000; // 2 seconds debounce
  
  // Hysteresis thresholds to prevent oscillations
  const hysteresis = {
    stress: {
      enter: { arousal: 0.7, valence: -0.5 },  // Enter stressed state
      exit: { arousal: 0.5, valence: -0.3 }    // Exit stressed state
    },
    lowEngagement: {
      enter: { arousal: -0.3 },   // Enter low engagement
      exit: { arousal: -0.1 }      // Exit low engagement  
    }
  };
  
  // TODO: Integrate with real session data from backend/context
  // Participants should be loaded from session context or API
  const [participants] = useState<SessionParticipant[]>([]);
  
  // Ref for BLS component control
  const blsRef = useRef<BilateralStimulationRef>(null);

  // === CRITICAL: Initialize Unified Emotion Service ===
  useEffect(() => {
    const initializeEmotionService = async () => {
      try {
        console.log('🔄 Initializing Unified Emotion Service...');
        
        // Initialize with video element for face recognition
        await unifiedEmotionService.initialize(videoElementRef.current || undefined);
        
        // CRITICAL: Set up telemetry and status callbacks for live UI updates
        unifiedEmotionService.onStatus((status: EmotionServiceStatus) => {
          console.log('📊 Emotion service status update:', status);
          setEmotionServiceStatus(status);
          
          // Update voice analysis status from the service
          setVoiceAnalysisStatus(status.voice);
          
          // Update current provider
          setCurrentProvider(status.voice.provider || 'unknown');
          
          // Update fusion metrics
          setFusionMetrics({
            isActive: status.fusion.enabled,
            strategy: status.fusion.strategy,
            confidence: status.fusion.averageConfidence,
            conflictRate: status.fusion.conflictRate,
            faceSources: status.face.enabled ? 1 : 0,
            voiceSources: status.voice.isConnected ? 1 : 0,
            lastFusion: Date.now()
          });
          
          // Update system metrics
          setSystemMetrics({
            totalPackets: status.voice.streamHealth?.packetsReceived || 0,
            lostPackets: status.voice.streamHealth?.packetsLost || 0,
            avgLatency: status.voice.latency || 0,
            jitter: status.voice.streamHealth?.jitter || 0,
            uptime: status.performance?.currentLatency || 0,
            reconnections: 0 // TODO: Track reconnections
          });
        });
        
        unifiedEmotionService.onError((error: string) => {
          console.error('❌ Unified emotion service error:', error);
          // Update status to show error state
          setVoiceAnalysisStatus(prev => prev ? {
            ...prev,
            error: error,
            isConnected: false
          } : null);
        });
        
        // CRITICAL: Set up provider change tracking for live telemetry
        if (voiceRecognitionService.onProviderChanged) {
          voiceRecognitionService.onProviderChanged((change: any) => {
            console.log(`🔄 Provider change detected: ${change.oldProvider} → ${change.newProvider}`);
            setCurrentProvider(change.newProvider);
            setProviderSwitchHistory(prev => [
              ...prev.slice(-4), // Keep last 5 entries
              {
                oldProvider: change.oldProvider,
                newProvider: change.newProvider,
                timestamp: change.timestamp,
                reason: change.reason
              }
            ]);
          });
        }
        
        // Set up emotion callback to receive live emotion updates
        unifiedEmotionService.onEmotion((emotion: EmotionData) => {
          console.log('📊 New emotion data from unified service:', emotion);
          setCurrentEmotions(emotion);
          lastSavedEmotionsRef.current = emotion;
          
          // Update telemetry metrics from emotion data
          if (emotion.sources?.voice?.provider) {
            setCurrentProvider(emotion.sources.voice.provider);
          }
          setEmotionHistory(prev => [...prev.slice(-100), emotion]);
          
          // Adaptive BLS control with hysteresis and debounce
          if (blsRef.current) {
            const now = Date.now();
            const timeSinceLastUpdate = now - lastBlsUpdateRef.current;
            
            // Apply debounce - only update if enough time has passed
            if (timeSinceLastUpdate < blsDebounceTime) {
              return;
            }
            
            let newState = blsState;
            
            // Check transitions with hysteresis
            if (blsState !== 'stressed') {
              // Check if should enter stressed state
              if (emotion.arousal > hysteresis.stress.enter.arousal && 
                  emotion.valence < hysteresis.stress.enter.valence) {
                newState = 'stressed';
              }
            } else {
              // Check if should exit stressed state
              if (emotion.arousal < hysteresis.stress.exit.arousal || 
                  emotion.valence > hysteresis.stress.exit.valence) {
                newState = 'normal';
              }
            }
            
            if (blsState !== 'low-engagement' && newState !== 'stressed') {
              // Check if should enter low engagement state
              if (emotion.arousal < hysteresis.lowEngagement.enter.arousal) {
                newState = 'low-engagement';
              }
            } else if (blsState === 'low-engagement') {
              // Check if should exit low engagement state
              if (emotion.arousal > hysteresis.lowEngagement.exit.arousal) {
                newState = 'normal';
              }
            }
            
            // Apply state changes if different
            if (newState !== blsState) {
              setBlsState(newState);
              lastBlsUpdateRef.current = now;
              
              switch (newState) {
                case 'stressed':
                  blsRef.current.updateConfig({
                    speed: 2, // Slow speed for calming
                    color: '#60a5fa', // Calming blue
                    pattern: 'horizontal'
                  });
                  break;
                  
                case 'low-engagement':
                  blsRef.current.updateConfig({
                    speed: 7, // Fast speed for stimulation
                    color: '#fbbf24', // Bright yellow
                    pattern: 'diagonal'
                  });
                  break;
                  
                case 'normal':
                default:
                  blsRef.current.updateConfig({
                    speed: 5, // Medium speed
                    color: '#34d399', // Balanced green
                    pattern: 'horizontal'
                  });
                  break;
              }
            }
          }
        });
        
        // Set up status callback to track service health
        unifiedEmotionService.onStatus((status: EmotionServiceStatus) => {
          console.log('📊 Emotion service status update:', status);
          setEmotionServiceStatus(status);
          setIsMultimodalActive(status.isActive);
          
          // Update voice analysis status for telemetry
          if (status.voice) {
            setVoiceAnalysisStatus(status.voice);
            
            // Update system metrics
            setSystemMetrics(prev => ({
              ...prev,
              totalPackets: status.voice.streamHealth?.packetsReceived || 0,
              lostPackets: status.voice.streamHealth?.packetsLost || 0,
              avgLatency: status.voice.latency || 0,
              jitter: status.voice.streamHealth?.jitter || 0,
              uptime: Date.now() - (status.voice.lastUpdate || Date.now())
            }));
          }
          
          // Update fusion metrics
          if (status.fusion) {
            setFusionMetrics(prev => ({
              ...prev,
              isActive: status.fusion.enabled,
              strategy: status.fusion.strategy || 'weighted-average',
              confidence: status.fusion.averageConfidence || 0,
              conflictRate: status.fusion.conflictRate || 0,
              lastFusion: Date.now()
            }));
          }
        });
        
        // Set up error callback for debugging
        unifiedEmotionService.onError((error: string) => {
          console.error('❌ Emotion service error:', error);
          setSystemMetrics(prev => ({ ...prev, reconnections: prev.reconnections + 1 }));
          // TODO: Show user-friendly error message
        });
        
        console.log('✅ Unified Emotion Service initialized successfully');
        
      } catch (error) {
        console.error('❌ Failed to initialize Unified Emotion Service:', error);
      }
    };
    
    initializeEmotionService();
    
    // Cleanup on unmount
    return () => {
      unifiedEmotionService.destroy();
    };
  }, []); // Initialize once on mount

  // === CRITICAL: Live Telemetry Updates ===
  useEffect(() => {
    const telemetryInterval = setInterval(() => {
      try {
        // Get fresh status and metrics from UnifiedEmotionService
        const status = unifiedEmotionService.getStatus();
        const metrics = unifiedEmotionService.getMetrics();
        
        // Update all telemetry state with fresh data
        setEmotionServiceStatus(status);
        setVoiceAnalysisStatus(status.voice);
        setCurrentProvider(status.voice.provider || 'assemblyai');
        
        // Update provider health map
        setProviderHealth(prevHealth => {
          const newHealth = new Map(prevHealth);
          newHealth.set(status.voice.provider || 'assemblyai', {
            isHealthy: status.voice.isConnected,
            latency: status.voice.latency,
            packetsReceived: status.voice.streamHealth?.packetsReceived || 0,
            lastUpdate: Date.now(),
            errorRate: metrics.errorRate || 0
          });
          return newHealth;
        });
        
        // Update fusion metrics with fresh data
        setFusionMetrics({
          isActive: status.fusion.enabled,
          strategy: status.fusion.strategy,
          confidence: status.fusion.averageConfidence,
          conflictRate: status.fusion.conflictRate,
          faceSources: status.face.enabled ? 1 : 0,
          voiceSources: status.voice.isConnected ? 1 : 0,
          lastFusion: Date.now()
        });
        
        // Update system metrics with comprehensive data
        setSystemMetrics({
          totalPackets: status.voice.streamHealth?.packetsReceived || 0,
          lostPackets: status.voice.streamHealth?.packetsLost || 0,
          avgLatency: status.voice.latency || 0,
          jitter: status.voice.streamHealth?.jitter || 0,
          uptime: metrics.uptimeSeconds || 0,
          reconnections: 0 // TODO: Track reconnections
        });
        
      } catch (error) {
        console.error('❌ Error updating telemetry:', error);
      }
    }, 1000); // Update every second for live telemetry
    
    return () => clearInterval(telemetryInterval);
  }, [isMultimodalActive]);

  useEffect(() => {
    if (sessionActive) {
      const interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionActive]);

  // Save emotion snapshots every 5 seconds using stable interval
  useEffect(() => {
    if (sessionActive) {
      // Set up stable interval for saving emotions
      emotionSaveIntervalRef.current = window.setInterval(() => {
        // Use ref to get latest emotions without depending on state
        if (lastSavedEmotionsRef.current) {
          saveEmotionSnapshot(lastSavedEmotionsRef.current);
        }
      }, 5000); // Save every 5 seconds
      
      return () => {
        if (emotionSaveIntervalRef.current) {
          clearInterval(emotionSaveIntervalRef.current);
          emotionSaveIntervalRef.current = null;
        }
      };
    }
  }, [sessionActive]); // Only depend on sessionActive, not currentEmotions

  // Handle BLS metrics updates
  const handleBLSMetricsUpdate = (metrics: any) => {
    // TODO: Send metrics to backend for analysis
    console.log('BLS Metrics:', metrics);
  };

  // === MULTIMODAL EMOTION HANDLERS ===
  
  /**
   * Toggle voice recording on/off
   */
  const toggleVoiceRecording = async () => {
    try {
      if (voiceRecordingEnabled) {
        await unifiedEmotionService.stopRecognition();
        console.log('🎤 Multimodal emotion recognition stopped');
      } else {
        await unifiedEmotionService.startRecognition();
        console.log('🎤 Multimodal emotion recognition started');
      }
      setVoiceRecordingEnabled(!voiceRecordingEnabled);
    } catch (error) {
      console.error('Failed to toggle multimodal recognition:', error);
      // TODO: Show user-friendly error toast
    }
  };
  
  /**
   * Switch emotion recognition mode
   */
  const switchEmotionMode = async (newMode: 'face-only' | 'voice-only' | 'multimodal' | 'auto') => {
    try {
      await unifiedEmotionService.switchMode(newMode);
      setEmotionMode(newMode);
      console.log(`🔄 Switched to ${newMode} emotion recognition`);
    } catch (error) {
      console.error('Failed to switch emotion mode:', error);
    }
  };
  
  // Legacy handler for backward compatibility (now handled by unified service)
  const handleEmotionUpdate = (emotions: EmotionData) => {
    console.log('📊 Legacy emotion update (now handled by unified service):', emotions);
    // This is kept for compatibility but emotions now come from unified service
    setCurrentEmotions(emotions);
    lastSavedEmotionsRef.current = emotions;
    setEmotionHistory(prev => [...prev.slice(-100), emotions]);
    
    // Adaptive BLS control with hysteresis and debounce
    if (blsRef.current && emotions) {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastBlsUpdateRef.current;
      
      // Apply debounce - only update if enough time has passed
      if (timeSinceLastUpdate < blsDebounceTime) {
        return;
      }
      
      let newState = blsState;
      
      // Check transitions with hysteresis
      if (blsState !== 'stressed') {
        // Check if should enter stressed state
        if (emotions.arousal > hysteresis.stress.enter.arousal && 
            emotions.valence < hysteresis.stress.enter.valence) {
          newState = 'stressed';
        }
      } else {
        // Check if should exit stressed state
        if (emotions.arousal < hysteresis.stress.exit.arousal || 
            emotions.valence > hysteresis.stress.exit.valence) {
          newState = 'normal';
        }
      }
      
      if (blsState !== 'low-engagement' && newState !== 'stressed') {
        // Check if should enter low engagement state
        if (emotions.arousal < hysteresis.lowEngagement.enter.arousal) {
          newState = 'low-engagement';
        }
      } else if (blsState === 'low-engagement') {
        // Check if should exit low engagement state
        if (emotions.arousal > hysteresis.lowEngagement.exit.arousal) {
          newState = 'normal';
        }
      }
      
      // Apply state changes if different
      if (newState !== blsState) {
        setBlsState(newState);
        lastBlsUpdateRef.current = now;
        
        switch (newState) {
          case 'stressed':
            // При высоком стрессе замедлять БЛС
            blsRef.current.updateConfig({
              speed: 2, // Медленная скорость для успокоения
              color: '#60a5fa', // Успокаивающий синий
              pattern: 'horizontal' // Простой паттерн
            });
            break;
            
          case 'low-engagement':
            // При низком вовлечении усиливать стимуляцию
            blsRef.current.updateConfig({
              speed: 7, // Быстрая скорость для стимуляции
              color: '#fbbf24', // Яркий желтый
              pattern: 'diagonal' // Более активный паттерн
            });
            break;
            
          case 'normal':
          default:
            // Нормальное состояние
            blsRef.current.updateConfig({
              speed: 5, // Средняя скорость
              color: '#34d399', // Сбалансированный зеленый
              pattern: 'horizontal'
            });
            break;
        }
      }
    }
  };

  // Error throttling for emotion snapshot saves
  const emotionSaveErrorThrottle = useRef<{ lastError: number; count: number }>({ lastError: 0, count: 0 });

  // Save emotion snapshot to database with error throttling
  const saveEmotionSnapshot = async (emotions: EmotionData) => {
    try {
      // Get or create session ID (temporary demo implementation)
      const sessionId = sessionStorage.getItem('currentSessionId') || 'demo-session-' + Date.now();
      if (!sessionStorage.getItem('currentSessionId')) {
        sessionStorage.setItem('currentSessionId', sessionId);
      }
      
      // Save emotion data to backend
      const response = await fetch('/api/emotions/capture', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          sessionId: sessionId,
          emotionData: emotions,
          phase: phase,
          patientId: 'demo-patient', // TODO: Get from auth context
          blsConfig: blsRef.current?.getConfig ? blsRef.current.getConfig() : null
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Emotion snapshot saved:', result.captureId);
      
      // Reset error count on success
      emotionSaveErrorThrottle.current.count = 0;
    } catch (error) {
      // Throttle error logging to prevent spam
      const now = Date.now();
      const timeSinceLastError = now - emotionSaveErrorThrottle.current.lastError;
      
      if (timeSinceLastError > 5000 || emotionSaveErrorThrottle.current.count < 3) {
        console.error('Failed to save emotion snapshot:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
          errorCount: emotionSaveErrorThrottle.current.count + 1
        });
        emotionSaveErrorThrottle.current.lastError = now;
        emotionSaveErrorThrottle.current.count++;
      }
    }
  };

  // === Revolutionary AI Therapist Event Handlers ===

  /**
   * Handle AI therapist recommendations
   */
  const handleAIRecommendation = (recommendation: PersonalizedRecommendation) => {
    setCurrentRecommendations(prev => {
      // Add new recommendation and keep last 5
      const updated = [recommendation, ...prev].slice(0, 5);
      return updated;
    });

    // Apply BLS adjustments if recommended
    if (recommendation.type === 'bls-adjustment' && blsRef.current) {
      if (recommendation.message.includes('замедлить')) {
        blsRef.current.updateConfig({ speed: 2, color: '#60a5fa' });
      } else if (recommendation.message.includes('ускорить')) {
        blsRef.current.updateConfig({ speed: 7, color: '#fbbf24' });
      }
    }

    // Auto-remove recommendation after duration
    if (recommendation.duration) {
      setTimeout(() => {
        setCurrentRecommendations(prev => 
          prev.filter(rec => rec !== recommendation)
        );
      }, recommendation.duration * 1000);
    }
  };

  /**
   * Handle crisis detection from AI therapist
   */
  const handleCrisisDetection = (crisis: CrisisDetection) => {
    setCrisisAlert(crisis);
    
    // Apply immediate crisis interventions
    if (crisis.interventions.immediate.length > 0) {
      console.log('Applying crisis interventions:', crisis.interventions.immediate);
      
      // Force calming BLS settings
      if (blsRef.current) {
        blsRef.current.updateConfig({
          speed: 1, // Very slow
          color: '#10b981', // Calming green
          pattern: 'horizontal' // Simple pattern
        });
      }
    }

    // Auto-dismiss crisis alert after 30 seconds (but keep monitoring)
    setTimeout(() => {
      setCrisisAlert(null);
    }, 30000);
  };

  /**
   * Handle AI-recommended phase changes
   */
  const handleAIPhaseChange = (newPhase: EMDRPhase) => {
    if (autoPhaseTransition) {
      setPhase(newPhase);
      setAiPhaseRecommendations(prev => [
        ...prev, 
        `AI рекомендует переход к фазе: ${getPhaseLabel(newPhase)}`
      ].slice(-3)); // Keep last 3 recommendations
    }
  };

  /**
   * Dismiss current crisis alert
   */
  const dismissCrisisAlert = () => {
    setCrisisAlert(null);
  };

  /**
   * Clear current recommendations
   */
  const clearRecommendations = () => {
    setCurrentRecommendations([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'preparation': return 'Подготовка';
      case 'desensitization': return 'Десенсибилизация';
      case 'installation': return 'Инсталляция';
      case 'body-scan': return 'Сканирование тела';
      case 'closure': return 'Завершение';
      default: return phase;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Session Header */}
      <div className="border-b border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-semibold text-card-foreground">EMDR Сессия в процессе</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono text-sm">{formatTime(sessionTime)}</span>
              </div>
              <Badge variant="secondary" className="font-medium">
                {getPhaseLabel(phase)}
              </Badge>
              
              {/* AI Therapist Status */}
              {aiTherapistActive && (
                <Badge variant="outline" className="font-medium flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  AI Терапевт активен
                </Badge>
              )}
              
              {/* AI Phase Recommendations */}
              {aiPhaseRecommendations.length > 0 && (
                <Badge variant="default" className="font-medium flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  AI рекомендация
                </Badge>
              )}
              
              {/* === REVOLUTIONARY MULTIMODAL STATUS === */}
              {emotionServiceStatus && (
                <>
                  {/* Emotion Recognition Mode */}
                  <Badge 
                    variant={emotionServiceStatus.mode === 'multimodal' ? 'default' : 'secondary'} 
                    className="font-medium flex items-center gap-1"
                  >
                    {emotionServiceStatus.mode === 'multimodal' && <Activity className="w-3 h-3" />}
                    {emotionServiceStatus.mode === 'face-only' && <Eye className="w-3 h-3" />}
                    {emotionServiceStatus.mode === 'voice-only' && <Waves className="w-3 h-3" />}
                    {emotionServiceStatus.mode === 'fallback' && <AlertTriangle className="w-3 h-3" />}
                    
                    {emotionServiceStatus.mode === 'multimodal' && 'Мультимодальный'}
                    {emotionServiceStatus.mode === 'face-only' && 'Только лицо'}
                    {emotionServiceStatus.mode === 'voice-only' && 'Только голос'}
                    {emotionServiceStatus.mode === 'fallback' && 'Резерв'}
                  </Badge>
                  
                  {/* Voice Analysis Status */}
                  {emotionServiceStatus.voice.isRecording && (
                    <Badge variant="outline" className="font-medium flex items-center gap-1 animate-pulse">
                      <Mic className="w-3 h-3 text-green-500" />
                      Голос активен
                    </Badge>
                  )}
                  
                  {/* Fusion Quality Indicator */}
                  {emotionServiceStatus.mode === 'multimodal' && (
                    <Badge 
                      variant="outline" 
                      className={`font-medium flex items-center gap-1 ${
                        emotionServiceStatus.fusion.averageConfidence > 0.7 
                          ? 'text-green-600 border-green-300' 
                          : emotionServiceStatus.fusion.averageConfidence > 0.5
                          ? 'text-yellow-600 border-yellow-300'
                          : 'text-red-600 border-red-300'
                      }`}
                    >
                      <Activity className="w-3 h-3" />
                      Качество: {Math.round(emotionServiceStatus.fusion.averageConfidence * 100)}%
                    </Badge>
                  )}
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* === MULTIMODAL CONTROLS === */}
              <div className="flex items-center space-x-1 border rounded-md p-1">
                {/* Voice Recording Toggle */}
                <Button
                  variant={voiceRecordingEnabled ? "default" : "ghost"}
                  size="sm"
                  onClick={toggleVoiceRecording}
                  data-testid="button-voice-toggle"
                  className="h-7 px-2"
                >
                  {voiceRecordingEnabled ? (
                    <Mic className="w-3 h-3 text-green-500" />
                  ) : (
                    <MicOff className="w-3 h-3" />
                  )}
                </Button>
                
                {/* Emotion Mode Selector */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const modes: Array<'face-only' | 'voice-only' | 'multimodal' | 'auto'> = ['auto', 'multimodal', 'face-only', 'voice-only'];
                    const currentIndex = modes.indexOf(emotionMode);
                    const nextMode = modes[(currentIndex + 1) % modes.length];
                    switchEmotionMode(nextMode);
                  }}
                  data-testid="button-emotion-mode"
                  className="h-7 px-2 text-xs"
                >
                  {emotionMode === 'auto' && 'AUTO'}
                  {emotionMode === 'multimodal' && 'MULTI'}
                  {emotionMode === 'face-only' && 'FACE'}
                  {emotionMode === 'voice-only' && 'VOICE'}
                </Button>
              </div>
              
              {/* Crisis Alert */}
              {crisisAlert && (
                <Alert className="flex items-center p-2 border-red-500 bg-red-50 dark:bg-red-950">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700 dark:text-red-200 text-sm">
                    КРИЗИС: {crisisAlert.triggers.join(', ')}
                  </AlertDescription>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={dismissCrisisAlert}
                    className="ml-2 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </Alert>
              )}
              
              {/* AI Therapist Toggle */}
              <Button 
                variant={aiTherapistActive ? "default" : "outline"} 
                size="sm" 
                onClick={() => setAiTherapistActive(!aiTherapistActive)}
                data-testid="button-toggle-ai-therapist"
              >
                <Brain className="w-4 h-4 mr-1" />
                AI Терапевт
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => blsRef.current?.updateConfig({ adaptiveMode: true })}
                data-testid="button-adaptive-mode"
              >
                <Settings className="w-4 h-4 mr-1" />
                Адаптивный режим
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setSessionActive(false)}
                data-testid="button-end-session"
              >
                <Phone className="w-4 h-4 mr-1" />
                Завершить сессию
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main EMDR Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Bilateral Stimulation Component */}
            <BilateralStimulation
              ref={blsRef}
              onMetricsUpdate={handleBLSMetricsUpdate}
              emotionData={currentEmotions || undefined}
              adaptiveMode={sessionActive}
              showControls={true}
              fullscreen={false}
            />

            {/* Video Conference */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>Видеосвязь</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {participants.length === 0 ? (
                    <div className="col-span-2 text-center py-8 text-muted-foreground">
                      <VideoOff className="w-12 h-12 mx-auto mb-3" />
                      <p>Нет активных участников</p>
                      <p className="text-sm mt-1">Участники будут отображены после подключения</p>
                    </div>
                  ) : (
                    participants.map((participant) => (
                      <div key={participant.id} className="relative">
                        <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                          {participant.videoEnabled ? (
                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                              <Avatar className="w-16 h-16">
                                <AvatarImage src={participant.avatar} />
                                <AvatarFallback className="text-white text-xl">
                                  {participant.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                              <VideoOff className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Participant Info */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="flex items-center justify-between">
                              <div className="bg-black/70 rounded px-2 py-1">
                                <span className="text-white text-sm font-medium">{participant.name}</span>
                                <Badge variant={participant.role === 'therapist' ? 'default' : 'secondary'} className="ml-2 text-xs">
                                  {participant.role === 'therapist' ? 'Терапевт' : 'Пациент'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 ${participant.audioEnabled ? 'text-white' : 'text-red-500'}`}
                                >
                                  {participant.audioEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-6 w-6 p-0 ${participant.videoEnabled ? 'text-white' : 'text-red-500'}`}
                                >
                                  {participant.videoEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Video Controls */}
                <div className="flex items-center justify-center space-x-4 mt-4 pt-4 border-t border-border">
                  <Button variant="outline" size="sm" data-testid="button-toggle-video">
                    <Video className="w-4 h-4 mr-2" />
                    Видео
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-toggle-audio">
                    <Mic className="w-4 h-4 mr-2" />
                    Микрофон
                  </Button>
                  <Button variant="outline" size="sm" data-testid="button-share-screen">
                    <Square className="w-4 h-4 mr-2" />
                    Поделиться экраном
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* === HEALTH/STATUS UI AND TELEMETRY PANEL === */}
            {showTelemetry && (
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>System Telemetry & Health Status</span>
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowTelemetry(false)}
                      className="h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Voice Analysis Status */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Waves className="w-4 h-4 mr-2" />
                      Voice Analysis Status
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Provider:</span>
                        <Badge variant={voiceAnalysisStatus?.isConnected ? "default" : "secondary"} className="text-xs">
                          {voiceAnalysisStatus?.provider || 'none'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Status:</span>
                        <Badge variant={voiceAnalysisStatus?.isConnected ? "default" : "destructive"} className="text-xs">
                          {voiceAnalysisStatus?.isConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Latency:</span>
                        <span className={`font-mono ${systemMetrics.avgLatency > 200 ? 'text-orange-500' : 'text-green-500'}`}>
                          {systemMetrics.avgLatency.toFixed(0)}ms
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Packets:</span>
                        <span className="font-mono text-blue-500">
                          {systemMetrics.totalPackets}/{systemMetrics.lostPackets}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Jitter:</span>
                        <span className={`font-mono ${systemMetrics.jitter > 50 ? 'text-orange-500' : 'text-green-500'}`}>
                          {systemMetrics.jitter.toFixed(1)}ms
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Recording:</span>
                        <Badge variant={voiceAnalysisStatus?.isRecording ? "default" : "secondary"} className="text-xs">
                          {voiceAnalysisStatus?.isRecording ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Fusion Status */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      Multimodal Fusion Status
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Fusion Mode:</span>
                        <Badge variant={fusionMetrics.isActive ? "default" : "secondary"} className="text-xs">
                          {emotionMode}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Strategy:</span>
                        <span className="font-mono text-purple-500">{fusionMetrics.strategy}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Confidence:</span>
                        <span className={`font-mono ${fusionMetrics.confidence > 0.8 ? 'text-green-500' : fusionMetrics.confidence > 0.6 ? 'text-yellow-500' : 'text-red-500'}`}>
                          {(fusionMetrics.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Face/Voice Sources:</span>
                        <span className="font-mono text-indigo-500">
                          {emotionServiceStatus?.face?.cameraConnected ? '✓' : '✗'}/
                          {emotionServiceStatus?.voice?.isConnected ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Telemetry Metrics */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Activity className="w-4 h-4 mr-2" />
                      Live WebSocket Telemetry
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Current Provider:</span>
                        <Badge variant="default" className="text-xs">
                          {currentProvider}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Packets Received:</span>
                        <span className="font-mono text-green-500">{liveTelemetry.packetsReceived}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Provider Failures:</span>
                        <span className={`font-mono ${liveTelemetry.providerFailures > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                          {liveTelemetry.providerFailures}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Auth Method:</span>
                        <Badge variant={liveTelemetry.authMethod === 'jwt' ? 'default' : 'secondary'} className="text-xs">
                          {liveTelemetry.authMethod}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Connection Uptime:</span>
                        <span className="font-mono text-blue-500">
                          {Math.floor(liveTelemetry.uptime / 1000)}s
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Connection ID:</span>
                        <span className="font-mono text-xs text-gray-500">
                          {liveTelemetry.connectionId.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Provider Switch History */}
                  {providerSwitchHistory.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center">
                        <Waves className="w-4 h-4 mr-2" />
                        Provider Fallback History
                      </h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {providerSwitchHistory.map((switch_, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                            <span>
                              {switch_.oldProvider} → {switch_.newProvider}
                            </span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {switch_.reason}
                              </Badge>
                              <span className="text-gray-500">
                                {new Date(switch_.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Test Controls */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Testing Controls
                    </h4>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/voice/force-failure', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ sessionId })
                            });
                            if (response.ok) {
                              console.log('🧪 Forced provider failure simulation triggered');
                            }
                          } catch (error) {
                            console.error('Failed to trigger provider failure:', error);
                          }
                        }}
                        data-testid="button-force-failure"
                      >
                        🧪 Force Provider Failure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={async () => {
                          try {
                            const response = await fetch('/api/voice/health');
                            const health = await response.json();
                            console.log('📊 Voice WebSocket health:', health);
                          } catch (error) {
                            console.error('Failed to get health status:', error);
                          }
                        }}
                        data-testid="button-health-check"
                      >
                        📊 Health Check
                      </Button>
                    </div>
                  </div>

                  {/* System Performance */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      System Performance
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Uptime:</span>
                        <span className="font-mono text-green-500">
                          {Math.floor(sessionTime / 60)}m {sessionTime % 60}s
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Reconnects:</span>
                        <span className={`font-mono ${systemMetrics.reconnections > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                          {systemMetrics.reconnections}
                        </span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>BLS State:</span>
                        <Badge variant={blsState === 'normal' ? "default" : blsState === 'stressed' ? "destructive" : "secondary"} className="text-xs">
                          {blsState}
                        </Badge>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span>Emotions:</span>
                        <span className="font-mono text-purple-500">{emotionHistory.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex space-x-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setEmotionMode(emotionMode === 'auto' ? 'face-only' : 'auto')}
                      className="text-xs"
                      data-testid="button-toggle-emotion-mode"
                    >
                      Toggle Mode
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowTelemetry(false)}
                      className="text-xs"
                      data-testid="button-hide-telemetry"
                    >
                      Hide Panel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Session Sidebar */}
          <div className="space-y-6">
            {/* Emotion Analysis */}
            <EmotionDisplay
              onEmotionUpdate={handleEmotionUpdate}
              isActive={sessionActive}
              showCircumplex={true}
              showTopEmotions={true}
              showBasicEmotions={false}
            />

            {/* Current AI Recommendations */}
            {currentRecommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      AI Рекомендации
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearRecommendations}
                      data-testid="button-clear-recommendations"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {currentRecommendations.map((rec, index) => (
                    <Alert key={index} className={`border-${rec.priority === 'high' ? 'red' : 'blue'}-200`}>
                      <AlertDescription className="text-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <Badge 
                              variant={rec.priority === 'high' ? 'destructive' : 'secondary'} 
                              className="mb-1 text-xs"
                            >
                              {rec.type}
                            </Badge>
                            <p>{rec.message}</p>
                            {rec.instructions && (
                              <ul className="mt-2 text-xs opacity-75">
                                {rec.instructions.map((instruction, i) => (
                                  <li key={i}>• {instruction}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          {rec.duration && (
                            <Badge variant="outline" className="text-xs">
                              {rec.duration}с
                            </Badge>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}
            
            {/* Revolutionary AI Therapist */}
            <AITherapist
              sessionId={sessionId}
              patientId={patientId}
              currentPhase={phase}
              emotionData={currentEmotions || {
                timestamp: Date.now(),
                arousal: 0.5,
                valence: 0.5,
                affects: {},
                basicEmotions: {}
              }}
              onPhaseChange={handleAIPhaseChange}
              onRecommendation={handleAIRecommendation}
              onCrisis={handleCrisisDetection}
              isActive={aiTherapistActive && sessionActive}
            />
            
            {/* Session Controls */}
            <Card>
              <CardHeader>
                <CardTitle>Управление сессией</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Фаза EMDR</label>
                  <div className="grid grid-cols-1 gap-1">
                    {[
                      { key: 'preparation', label: 'Подготовка' },
                      { key: 'desensitization', label: 'Десенсибилизация' },
                      { key: 'installation', label: 'Инсталляция' },
                      { key: 'body-scan', label: 'Сканирование' },
                      { key: 'closure', label: 'Завершение' }
                    ].map((phaseOption) => (
                      <Button
                        key={phaseOption.key}
                        variant={phase === phaseOption.key ? "default" : "ghost"}
                        size="sm"
                        className="justify-start"
                        onClick={() => setPhase(phaseOption.key as EMDRPhase)}
                        data-testid={`button-phase-${phaseOption.key}`}
                      >
                        {phaseOption.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                {/* AI Auto Phase Transition */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Функции</label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Автопереходы фаз</span>
                    <Button
                      variant={autoPhaseTransition ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAutoPhaseTransition(!autoPhaseTransition)}
                      data-testid="button-toggle-auto-phase"
                    >
                      {autoPhaseTransition ? 'Вкл' : 'Выкл'}
                    </Button>
                  </div>
                  
                  {/* Display AI Phase Recommendations */}
                  {aiPhaseRecommendations.length > 0 && (
                    <div className="text-xs space-y-1">
                      <p className="font-medium text-muted-foreground">Последние рекомендации AI:</p>
                      {aiPhaseRecommendations.map((rec, index) => (
                        <p key={index} className="text-muted-foreground">• {rec}</p>
                      ))}
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Button className="w-full" data-testid="button-save-notes">
                    Сохранить заметки
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="button-session-break">
                    Перерыв
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Заметки сессии</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {/* TODO: Load session notes from backend */}
                  {/* Notes will be displayed here */}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* End Session Confirmation Modal */}
      {!sessionActive && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Сессия завершена</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Сессия EMDR была успешно завершена. Все данные сохранены.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSessionActive(true)}>
                  Продолжить сессию
                </Button>
                <Button onClick={() => window.location.href = '/'}>
                  Завершить
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}