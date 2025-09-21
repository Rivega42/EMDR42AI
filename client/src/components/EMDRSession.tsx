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
  CheckCircle
} from "lucide-react";
import BilateralStimulation, { BilateralStimulationRef } from "./BilateralStimulation";
import EmotionDisplay from "./emotion/EmotionDisplay";
import { AITherapist } from "./ai/AITherapist";
import type { 
  SessionParticipant, 
  EMDRPhase, 
  EmotionData,
  PersonalizedRecommendation,
  CrisisDetection
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

  // Handle emotion updates from EmotionDisplay
  const handleEmotionUpdate = (emotions: EmotionData) => {
    setCurrentEmotions(emotions);
    lastSavedEmotionsRef.current = emotions; // Update ref for stable saving
    setEmotionHistory(prev => [...prev.slice(-100), emotions]); // Keep last 100 samples
    
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

  // Save emotion snapshot to database
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          emotionData: emotions,
          phase: phase,
          patientId: 'demo-patient', // TODO: Get from auth context
          blsConfig: blsRef.current?.getConfig ? blsRef.current.getConfig() : null
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Emotion snapshot saved:', result.captureId);
    } catch (error) {
      console.error('Failed to save emotion snapshot:', error);
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
            </div>
            
            <div className="flex items-center space-x-2">
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