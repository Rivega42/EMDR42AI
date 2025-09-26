/**
 * EMDR Session Conductor Demo Component
 * Demonstrates the revolutionary AI-driven EMDR therapy system
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Pause, 
  Square, 
  Brain, 
  Heart, 
  Eye, 
  Mic, 
  Volume2,
  Activity,
  Target,
  TrendingUp,
  CheckCircle2,
  Clock
} from "lucide-react";

import { SimplifiedEMDRConductor } from '../services/emdr';
import type { SimplifiedEMDRSession, ConductorEvents } from '../services/emdr';
import type { EMDRPhase, User, EmotionData } from '@/../../shared/types';
import BilateralStimulation from './BilateralStimulation';
import { VoiceAITherapistService } from '../services/ai/voiceAITherapistService';

interface SessionStatus {
  phase: EMDRPhase;
  progress: number;
  sud: number;
  voc: number;
  timeElapsed: number;
  emotionState: string;
}

const PHASE_DESCRIPTIONS = {
  preparation: "Подготовка к сессии",
  assessment: "Оценка и выбор цели", 
  desensitization: "Десенсибилизация",
  installation: "Инсталляция позитивного убеждения",
  'body-scan': "Сканирование тела",
  closure: "Завершение сессии",
  reevaluation: "Переоценка результатов",
  integration: "Интеграция изменений"
};

export default function EMDRConductorDemo() {
  // Conductor state
  const [conductor] = useState(() => new SimplifiedEMDRConductor({
    enableEmotionAdaptation: true,
    enableVoiceMode: true, // Enable voice mode for full integration
    enableAutoPhaseTransition: false, // Manual control for demo
    maxSessionDuration: 30, // 30 minutes for demo
    sudTarget: 2,
    vocTarget: 6
  }, {
    onPhaseChange: (from, to) => {
      console.log(`Phase transition: ${from} → ${to}`);
      setSessionStatus(prev => prev ? { ...prev, phase: to } : null);
    },
    onSUDChange: (oldSUD, newSUD) => {
      console.log(`SUD change: ${oldSUD} → ${newSUD}`);
      setSessionStatus(prev => prev ? { ...prev, sud: newSUD } : null);
    },
    onVOCChange: (oldVOC, newVOC) => {
      console.log(`VOC change: ${oldVOC} → ${newVOC}`);
      setSessionStatus(prev => prev ? { ...prev, voc: newVOC } : null);
    },
    onEmotionChange: (emotion) => {
      setCurrentEmotion(emotion);
      const dominantEmotion = getDominantEmotion(emotion);
      setSessionStatus(prev => prev ? { ...prev, emotionState: dominantEmotion } : null);
    },
    onSessionComplete: (session) => {
      console.log('Session completed:', session);
      setIsActive(false);
    }
  } as ConductorEvents));

  // State
  const [isActive, setIsActive] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus | null>(null);
  const [targetMemory, setTargetMemory] = useState('');
  const [currentSUD, setCurrentSUD] = useState([10]);
  const [currentVOC, setCurrentVOC] = useState([1]);
  const [currentEmotion, setCurrentEmotion] = useState<EmotionData | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SimplifiedEMDRSession[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceService, setVoiceService] = useState<VoiceAITherapistService | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const blsRef = useRef<any>(null);
  const sessionStartTime = useRef<number>(0);

  // Mock user for demo
  const demoUser: User = {
    id: 'demo-user',
    email: 'demo@emdr.com',
    role: 'patient',
    name: 'Demo Patient'
  };

  // Initialize conductor
  useEffect(() => {
    const initializeConductor = async () => {
      try {
        await conductor.initialize(videoRef.current || undefined);
        conductor.setBLSReference(blsRef.current);
        setIsInitialized(true);
        
        // Load session history
        const history = await SimplifiedEMDRConductor.getUserSessions(demoUser.id);
        setSessionHistory(history);
        
        addLog('🎭 EMDR Session Conductor initialized successfully');
      } catch (error) {
        console.error('Failed to initialize conductor:', error);
        addLog(`❌ Initialization failed: ${error}`);
      }
    };

    initializeConductor();
  }, [conductor]);

  // Update session status periodically
  useEffect(() => {
    if (!isActive || !sessionStatus) return;

    const interval = setInterval(() => {
      const session = conductor.getSession();
      if (session) {
        setSessionStatus(prev => ({
          ...prev!,
          progress: conductor.getProgress() * 100,
          timeElapsed: Math.floor((Date.now() - sessionStartTime.current) / 1000)
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, sessionStatus, conductor]);

  // Helper functions
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]);
  };

  const getDominantEmotion = (emotion: EmotionData): string => {
    if (!emotion.affects) return 'Neutral';
    
    let maxEmotion = 'Neutral';
    let maxValue = 0;
    
    for (const [emotionName, value] of Object.entries(emotion.affects)) {
      if (value > maxValue) {
        maxValue = value;
        maxEmotion = emotionName;
      }
    }
    
    return maxEmotion;
  };

  const startSession = async () => {
    if (!targetMemory.trim()) {
      addLog('❌ Please enter target memory description');
      return;
    }

    try {
      addLog('🎬 Starting EMDR session...');
      const session = await conductor.startSession(demoUser, targetMemory);
      
      setIsActive(true);
      sessionStartTime.current = Date.now();
      setSessionStatus({
        phase: session.currentPhase,
        progress: 0,
        sud: session.targetMemory.currentSUD,
        voc: session.targetMemory.currentVOC,
        timeElapsed: 0,
        emotionState: 'Neutral'
      });
      
      addLog(`✅ Session started: ${session.sessionId}`);
    } catch (error) {
      addLog(`❌ Failed to start session: ${error}`);
    }
  };

  const endSession = async () => {
    try {
      addLog('🏁 Ending session...');
      const completedSession = await conductor.endSession();
      
      setIsActive(false);
      setSessionStatus(null);
      
      // Update session history
      const history = await SimplifiedEMDRConductor.getUserSessions(demoUser.id);
      setSessionHistory(history);
      
      addLog(`✅ Session completed: ${completedSession.sessionId}`);
    } catch (error) {
      addLog(`❌ Failed to end session: ${error}`);
    }
  };

  const updateSUD = async () => {
    try {
      await conductor.updateSUD(currentSUD[0]);
      addLog(`📊 SUD updated to ${currentSUD[0]}`);
    } catch (error) {
      addLog(`❌ Failed to update SUD: ${error}`);
    }
  };

  const updateVOC = async () => {
    try {
      await conductor.updateVOC(currentVOC[0]);
      addLog(`📈 VOC updated to ${currentVOC[0]}`);
    } catch (error) {
      addLog(`❌ Failed to update VOC: ${error}`);
    }
  };

  const nextPhase = async () => {
    if (!sessionStatus) return;

    const phases: EMDRPhase[] = ['preparation', 'assessment', 'desensitization', 'installation', 'body-scan', 'closure', 'reevaluation', 'integration'];
    const currentIndex = phases.indexOf(sessionStatus.phase);
    const nextPhase = phases[currentIndex + 1];

    if (nextPhase) {
      try {
        await conductor.transitionToPhase(nextPhase);
        addLog(`🔄 Transitioned to ${nextPhase} phase`);
      } catch (error) {
        addLog(`❌ Failed to transition: ${error}`);
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6" data-testid="emdr-conductor-demo">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            Revolutionary EMDR Session Conductor Demo
            {isInitialized && <Badge variant="secondary">Ready</Badge>}
            {isActive && <Badge className="bg-green-500">Active Session</Badge>}
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Control */}
        <div className="lg:col-span-2 space-y-4">
          {/* Target Memory Input */}
          {!isActive && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Session Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="target-memory">Target Memory Description</Label>
                  <Textarea
                    id="target-memory"
                    placeholder="Describe the memory you want to work with..."
                    value={targetMemory}
                    onChange={(e) => setTargetMemory(e.target.value)}
                    data-testid="target-memory-input"
                  />
                </div>
                
                <Button 
                  onClick={startSession}
                  disabled={!isInitialized || !targetMemory.trim()}
                  className="w-full"
                  data-testid="button-start-session"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start EMDR Session
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Session Status */}
          {isActive && sessionStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Session Status
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(sessionStatus.timeElapsed)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Current Phase</span>
                    <Badge>{sessionStatus.phase}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {PHASE_DESCRIPTIONS[sessionStatus.phase]}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-sm">{Math.round(sessionStatus.progress)}%</span>
                  </div>
                  <Progress value={sessionStatus.progress} className="h-2" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{sessionStatus.sud}</div>
                    <div className="text-xs text-muted-foreground">SUD (0-10)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{sessionStatus.voc}</div>
                    <div className="text-xs text-muted-foreground">VOC (1-7)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium truncate">{sessionStatus.emotionState}</div>
                    <div className="text-xs text-muted-foreground">Emotion</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={nextPhase} variant="outline" size="sm" data-testid="button-next-phase">
                    Next Phase
                  </Button>
                  <Button onClick={endSession} variant="destructive" size="sm" data-testid="button-end-session">
                    <Square className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating Controls */}
          {isActive && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Rating Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>SUD Level (Subjective Units of Disturbance)</Label>
                    <span className="font-bold">{currentSUD[0]}</span>
                  </div>
                  <Slider
                    value={currentSUD}
                    onValueChange={setCurrentSUD}
                    max={10}
                    min={0}
                    step={1}
                    className="mb-2"
                    data-testid="sud-slider"
                  />
                  <Button onClick={updateSUD} size="sm" variant="outline" data-testid="button-update-sud">
                    Update SUD
                  </Button>
                </div>

                <Separator />

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label>VOC Level (Validity of Positive Cognition)</Label>
                    <span className="font-bold">{currentVOC[0]}</span>
                  </div>
                  <Slider
                    value={currentVOC}
                    onValueChange={setCurrentVOC}
                    max={7}
                    min={1}
                    step={1}
                    className="mb-2"
                    data-testid="voc-slider"
                  />
                  <Button onClick={updateVOC} size="sm" variant="outline" data-testid="button-update-voc">
                    Update VOC
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bilateral Stimulation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                3D Bilateral Stimulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BilateralStimulation
                ref={blsRef}
                adaptiveMode={true}
                showControls={true}
                emotionData={currentEmotion || undefined}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Camera Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Emotion Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full h-32 bg-gray-100 rounded-lg object-cover"
                data-testid="emotion-video-feed"
              />
              {currentEmotion && (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Arousal:</span>
                    <span className={currentEmotion.arousal > 0 ? "text-orange-500" : "text-blue-500"}>
                      {currentEmotion.arousal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valence:</span>
                    <span className={currentEmotion.valence > 0 ? "text-green-500" : "text-red-500"}>
                      {currentEmotion.valence.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Session History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Session History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionHistory.length > 0 ? (
                <div className="space-y-2" data-testid="session-history">
                  {sessionHistory.slice(0, 5).map((session, index) => (
                    <div key={session.sessionId} className="text-sm p-2 bg-muted rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Session {sessionHistory.length - index}</span>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.startTime).toLocaleDateString()}
                      </div>
                      <div className="text-xs">
                        SUD: {session.targetMemory.initialSUD} → {session.targetMemory.currentSUD}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No previous sessions</p>
              )}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-60 overflow-y-auto text-xs font-mono" data-testid="activity-log">
                {logs.map((log, index) => (
                  <div key={index} className="text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}