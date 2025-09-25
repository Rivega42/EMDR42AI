/**
 * Revolutionary AI Therapist Component
 * GPT-5 powered EMDR therapist with real-time emotion recognition and adaptive recommendations
 * Now with Voice Mode Support!
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  MessageSquare, 
  AlertTriangle, 
  Heart, 
  Target, 
  CheckCircle,
  Clock,
  Lightbulb,
  Shield,
  Activity,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Square,
  Pause,
  Play,
  PhoneCall,
  AudioLines,
  Headphones,
  Zap,
  TrendingUp,
  Eye,
  Waves,
  Signal
} from 'lucide-react';
import { aiTherapist } from '@/services/ai/therapist';
import { getVoiceAITherapistService } from '@/services/ai/voiceAITherapistService';
import { unifiedEmotionService } from '@/services/emotion/emotionService';
import type { 
  EMDRPhase, 
  AITherapistMessage, 
  AISessionGuidance, 
  PersonalizedRecommendation,
  CrisisDetection,
  EmotionData
} from '@/../../shared/types';
import type {
  VoiceConversationState,
  VoiceListeningMode,
  VoiceConversationTurn,
  VoiceConversationStatus
} from '@/services/ai/voiceAITherapistService';

interface AITherapistProps {
  sessionId: string;
  patientId: string;
  currentPhase: EMDRPhase;
  emotionData: EmotionData;
  onPhaseChange: (phase: EMDRPhase) => void;
  onRecommendation: (recommendation: PersonalizedRecommendation) => void;
  onCrisis: (crisis: CrisisDetection) => void;
  isActive: boolean;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: number;
  emotionalContext?: EmotionData;
  recommendations?: PersonalizedRecommendation[];
  isVoice?: boolean;
  audioUrl?: string;
  transcriptionConfidence?: number;
}

export function AITherapist({
  sessionId,
  patientId,
  currentPhase,
  emotionData,
  onPhaseChange,
  onRecommendation,
  onCrisis,
  isActive
}: AITherapistProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionGuidance, setSessionGuidance] = useState<AISessionGuidance | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastEmotionUpdate, setLastEmotionUpdate] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // === Enhanced Voice Mode State for Emotion-Aware System ===
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceConversationState>('idle');
  const [voiceConversationStatus, setVoiceConversationStatus] = useState<VoiceConversationStatus | null>(null);
  const [voiceListeningMode, setVoiceListeningMode] = useState<VoiceListeningMode>('continuous');
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [audioLevels, setAudioLevels] = useState({ input: 0, output: 0, voiceActivity: 0 });
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceConversationHistory, setVoiceConversationHistory] = useState<VoiceConversationTurn[]>([]);
  
  // Missing push-to-talk and voice state variables
  const [usePushToTalk, setUsePushToTalk] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Real-time emotion feedback state
  const [currentEmotionForVoice, setCurrentEmotionForVoice] = useState<EmotionData | null>(null);
  const [emotionTrend, setEmotionTrend] = useState<'improving' | 'stable' | 'declining' | null>(null);
  const [crisisLevel, setCrisisLevel] = useState<'none' | 'mild' | 'moderate' | 'severe'>('none');
  const [voiceAdaptationActive, setVoiceAdaptationActive] = useState(false);
  
  // Service references
  const voiceServiceRef = useRef(getVoiceAITherapistService());
  const emotionServiceRef = useRef(unifiedEmotionService);
  
  // Legacy refs (kept for cleanup)
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechSynthRef = useRef<any>(null);

  // Cleanup voice resources on unmount
  useEffect(() => {
    return () => {
      // Cleanup enhanced voice service
      if (voiceServiceRef.current && voiceServiceRef.current.getStatus().state !== 'idle') {
        voiceServiceRef.current.stopConversation().catch(console.error);
      }
      
      // Legacy cleanup
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speechSynthRef.current) {
        speechSynthesis.cancel();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Initialize voice service event handlers
  useEffect(() => {
    const voiceService = voiceServiceRef.current;
    
    if (voiceService) {
      // Subscribe to voice state changes
      voiceService.addEventListener('onStateChange', (newState: VoiceConversationState, prevState: VoiceConversationState) => {
        setVoiceStatus(newState);
        console.log(`Voice state changed: ${prevState} → ${newState}`);
      });
      
      // Subscribe to turn completion (conversation flow)
      voiceService.addEventListener('onTurnComplete', (turn: VoiceConversationTurn) => {
        setVoiceConversationHistory(prev => [...prev, turn]);
        
        // Add to chat messages
        const chatMessage: ChatMessage = {
          id: `voice-turn-${Date.now()}`,
          type: turn.type === 'patient' ? 'user' : 'ai',
          message: turn.transcription?.text || turn.aiResponse?.message.content || '',
          timestamp: Date.now(),
          emotionalContext: turn.emotionContext?.patientEmotion || currentEmotionForVoice || undefined,
          isVoice: true,
          transcriptionConfidence: turn.transcription?.confidence || 0
        };
        setMessages(prev => [...prev, chatMessage]);
      });
      
      // Subscribe to crisis detection during voice
      voiceService.addEventListener('onCrisisDetected', (crisis: CrisisDetection) => {
        setCrisisLevel('severe');
        
        // Emit crisis event to parent
        onCrisis(crisis);
      });
      
      // Subscribe to voice activity detection
      voiceService.addEventListener('onVoiceActivity', (isActive: boolean, confidence: number) => {
        setAudioLevels(prev => ({
          ...prev,
          voiceActivity: confidence
        }));
      });
      
      // Subscribe to error events
      voiceService.addEventListener('onError', (error: string) => {
        setVoiceError(error);
        setVoiceStatus('error');
      });
    }
    
    return () => {
      // Cleanup event listeners if needed
    };
  }, [currentEmotionForVoice, onCrisis]);
  
  // Initialize AI therapist session
  useEffect(() => {
    if (!isInitialized) {
      aiTherapist.initializeSession(sessionId, patientId, currentPhase);
      
      // Subscribe to crisis detection
      aiTherapist.onCrisisDetected((crisis) => {
        onCrisis(crisis);
        
        // Add crisis alert to chat
        const crisisMessage: ChatMessage = {
          id: `crisis-${Date.now()}`,
          type: 'ai',
          message: `КРИЗИСНАЯ СИТУАЦИЯ ОБНАРУЖЕНА: ${crisis.triggers.join(', ')}. Применяю экстренные меры поддержки.`,
          timestamp: Date.now(),
          emotionalContext: emotionData
        };
        setMessages(prev => [...prev, crisisMessage]);
      });

      setIsInitialized(true);
      
      // Welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'ai',
        message: 'Здравствуйте! Я ваш AI-терапевт, специализирующийся на EMDR. Я буду сопровождать вас через все фазы терапии, адаптируясь к вашему эмоциональному состоянию в реальном времени. Как вы себя чувствуете?',
        timestamp: Date.now()
      };
      setMessages([welcomeMessage]);
    }
  }, [sessionId, patientId, currentPhase, isInitialized, emotionData, onCrisis]);

  // Update session guidance when phase changes
  useEffect(() => {
    if (isInitialized) {
      updateSessionGuidance();
      aiTherapist.updatePhase(currentPhase);
    }
  }, [currentPhase, isInitialized]);

  // Process emotion changes in real-time with voice integration
  useEffect(() => {
    if (isInitialized && emotionData.timestamp > lastEmotionUpdate) {
      processEmotionChange();
      
      // Real-time emotion updates for voice mode
      if (isVoiceMode) {
        updateVoiceEmotionContext(emotionData);
      }
      
      setLastEmotionUpdate(emotionData.timestamp);
    }
  }, [emotionData, isInitialized, lastEmotionUpdate, isVoiceMode]);
  
  // Emotion trend analysis for voice adaptation
  const updateVoiceEmotionContext = useCallback(async (emotion: EmotionData) => {
    setCurrentEmotionForVoice(emotion);
    
    // Determine emotion trend
    if (currentEmotionForVoice) {
      const valenceDiff = emotion.valence - currentEmotionForVoice.valence;
      const arousalDiff = emotion.arousal - currentEmotionForVoice.arousal;
      
      if (valenceDiff > 0.1 || (arousalDiff < -0.1 && emotion.valence > 0)) {
        setEmotionTrend('improving');
      } else if (valenceDiff < -0.1 || (arousalDiff > 0.1 && emotion.valence < 0)) {
        setEmotionTrend('declining');
      } else {
        setEmotionTrend('stable');
      }
    }
    
    // Crisis level monitoring during voice
    const crisisScore = calculateCrisisScore(emotion);
    if (crisisScore > 0.3) {
      setCrisisLevel(crisisScore > 0.8 ? 'severe' : crisisScore > 0.6 ? 'moderate' : 'mild');
    } else {
      setCrisisLevel('none');
    }
    
    // Update voice adaptation status
    const needsAdaptation = (
      emotion.arousal > 0.7 || 
      emotion.valence < -0.5 || 
      emotion.basicEmotions.fearful > 0.6 ||
      emotion.basicEmotions.angry > 0.6
    );
    setVoiceAdaptationActive(needsAdaptation);
    
  }, [currentEmotionForVoice]);
  
  // Calculate crisis score from emotion data
  const calculateCrisisScore = useCallback((emotion: EmotionData): number => {
    let score = 0;
    
    // High arousal + negative valence
    if (emotion.arousal > 0.8 && emotion.valence < -0.7) score += 0.4;
    
    // Strong negative emotions
    if (emotion.basicEmotions.fearful > 0.7) score += 0.3;
    if (emotion.basicEmotions.angry > 0.7) score += 0.2;
    if (emotion.basicEmotions.disgusted > 0.8) score += 0.2;
    
    // Fusion confidence affects scoring
    score *= emotion.fusion.confidence;
    
    return Math.min(1.0, score);
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateSessionGuidance = async () => {
    try {
      const guidance = await aiTherapist.getSessionGuidance();
      setSessionGuidance(guidance);
    } catch (error) {
      console.error('Failed to get session guidance:', error);
    }
  };

  const processEmotionChange = async () => {
    try {
      const emotionResponse = await aiTherapist.processEmotionResponse(emotionData);
      
      // If AI recommends interventions, show them
      if (emotionResponse.recommendations.length > 0) {
        emotionResponse.recommendations.forEach(onRecommendation);
        
        // Add AI message about emotion change if significant
        if (emotionResponse.interventionLevel !== 'mild') {
          const emotionMessage: ChatMessage = {
            id: `emotion-${Date.now()}`,
            type: 'ai',
            message: `Я заметил изменения в вашем эмоциональном состоянии. ${emotionResponse.recommendations[0]?.message || 'Давайте адаптируем нашу работу.'}`,
            timestamp: Date.now(),
            emotionalContext: emotionData,
            recommendations: emotionResponse.recommendations
          };
          setMessages(prev => [...prev, emotionMessage]);
        }
      }

      // Check for phase transition advice
      if (emotionResponse.phaseTransitionAdvice?.canAdvance) {
        const nextPhase = getNextPhase(currentPhase);
        if (nextPhase && emotionResponse.phaseTransitionAdvice) {
          const transitionMessage: ChatMessage = {
            id: `transition-${Date.now()}`,
            type: 'ai',
            message: `Отлично! Вы готовы перейти к следующей фазе: ${getPhaseDisplayName(nextPhase)}. ${emotionResponse.phaseTransitionAdvice.reasoning || ''}`,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, transitionMessage]);
        }
      }
    } catch (error) {
      console.error('Failed to process emotion response:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      message: inputMessage,
      timestamp: Date.now(),
      emotionalContext: emotionData
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const aiResponse: AITherapistMessage = await aiTherapist.sendMessage(inputMessage);
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        message: aiResponse.content,
        timestamp: Date.now(),
        recommendations: [] // We'll handle recommendations through the existing callback system
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // If voice mode is active, speak the AI response
      if (isVoiceMode) {
        speakText(aiResponse.content);
      }
      
      // Update session guidance after AI response
      await updateSessionGuidance();
      
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'ai',
        message: 'Извините, произошла ошибка. Давайте продолжим с техниками безопасности.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Voice Mode Functions
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setVoiceError('Распознавание речи не поддерживается в этом браузере');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = !usePushToTalk;
    recognition.interimResults = true;
    recognition.lang = 'ru-RU';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('listening');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        handleVoiceInput(finalTranscript, event.results[0][0].confidence);
      }
    };

    recognition.onerror = (event: any) => {
      setVoiceError(`Ошибка распознавания речи: ${event.error}`);
      setVoiceStatus('error');
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (voiceStatus === 'listening' && !usePushToTalk) {
        setVoiceStatus('idle');
      }
    };

    return recognition;
  }, [usePushToTalk, voiceStatus]);

  const handleVoiceInput = async (text: string, confidence: number) => {
    const userMessage: ChatMessage = {
      id: `voice-user-${Date.now()}`,
      type: 'user',
      message: text,
      timestamp: Date.now(),
      emotionalContext: emotionData,
      isVoice: true,
      transcriptionConfidence: confidence
    };
    
    setMessages(prev => [...prev, userMessage]);
    setVoiceStatus('ai-processing');
    
    try {
      const aiResponse = await aiTherapist.sendMessage(text);
      
      const aiMessage: ChatMessage = {
        id: `voice-ai-${Date.now()}`,
        type: 'ai',
        message: aiResponse.content,
        timestamp: Date.now(),
        recommendations: [], // Handle through callback system
        isVoice: true
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Speak AI response
      await speakText(aiResponse.content);
      
      setVoiceStatus('idle');
    } catch (error) {
      console.error('Failed to process voice input:', error);
      setVoiceError('Ошибка обработки голосового сообщения');
      setVoiceStatus('error');
    }
  };

  const speakText = async (text: string) => {
    if (!speechSynthesis) return;
    
    setIsSpeaking(true);
    setVoiceStatus('speaking');
    
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setVoiceStatus('idle');
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setVoiceStatus('error');
      setVoiceError('Ошибка синтеза речи');
    };
    
    speechSynthesis.speak(utterance);
  };

  const toggleVoiceMode = useCallback(async () => {
    if (!isVoiceMode) {
      // === Enable Enhanced Voice Mode with Emotion Awareness ===
      try {
        setIsVoiceMode(true);
        setVoiceError(null);
        
        const voiceService = voiceServiceRef.current;
        
        // Initialize voice service if not already done
        const status = voiceService.getStatus();
        if (!status.isActive) {
          await voiceService.initialize();
        }
        
        // Start emotion-aware voice conversation
        await voiceService.startConversation(sessionId, patientId, currentPhase);
        
        // Update status
        setVoiceConversationStatus(voiceService.getStatus());
        
        const voiceMessage: ChatMessage = {
          id: `voice-activated-${Date.now()}`,
          type: 'ai',
          message: 'Улучшенный голосовой режим с анализом эмоций активирован! Я буду адаптировать свой голос и ответы в зависимости от вашего эмоционального состояния.',
          timestamp: Date.now(),
          isVoice: true
        };
        setMessages(prev => [...prev, voiceMessage]);
        
        console.log('✅ Enhanced voice mode activated with emotion awareness');
        
      } catch (error) {
        console.error('❌ Failed to activate voice mode:', error);
        setVoiceError(`Не удалось активировать голосовой режим: ${error}`);
        setIsVoiceMode(false);
      }
      
    } else {
      // === Disable Enhanced Voice Mode ===
      try {
        const voiceService = voiceServiceRef.current;
        
        // Stop voice conversation
        if (voiceService.getStatus().state !== 'idle') {
          await voiceService.stopConversation();
        }
        
        // Reset state
        setIsVoiceMode(false);
        setVoiceStatus('idle');
        setVoiceConversationStatus(null);
        setCurrentEmotionForVoice(null);
        setEmotionTrend(null);
        setCrisisLevel('none');
        setVoiceAdaptationActive(false);
        
        // Legacy cleanup
        if (recognitionRef.current) {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        }
        speechSynthesis.cancel();
        
        const textMessage: ChatMessage = {
          id: `voice-deactivated-${Date.now()}`,
          type: 'ai',
          message: 'Перешли в текстовый режим. Данные об эмоциях сохранены для улучшения терапии.',
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, textMessage]);
        
        console.log('Voice mode deactivated');
        
      } catch (error) {
        console.error('Error deactivating voice mode:', error);
        setVoiceError(`Ошибка при отключении голосового режима: ${error}`);
      }
    }
  }, [isVoiceMode]);

  const startVoiceListening = useCallback(async () => {
    if (recognitionRef.current && usePushToTalk) {
      setIsPushToTalkActive(true);
      recognitionRef.current.start();
    } else if (recognitionRef.current && !isListening) {
      recognitionRef.current.start();
    }
  }, [usePushToTalk, isListening]);

  const stopVoiceListening = useCallback(async () => {
    if (recognitionRef.current && usePushToTalk) {
      setIsPushToTalkActive(false);
      recognitionRef.current.stop();
    }
  }, [usePushToTalk]);

  const interruptSpeech = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
    setVoiceStatus('idle');
  }, []);

  const toggleListeningMode = useCallback(() => {
    setUsePushToTalk(!usePushToTalk);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setTimeout(() => {
        const newRecognition = initializeSpeechRecognition();
        if (newRecognition) {
          recognitionRef.current = newRecognition;
        }
      }, 100);
    }
  }, [usePushToTalk, initializeSpeechRecognition]);

  const getVoiceStatusMessage = useCallback(() => {
    switch (voiceStatus) {
      case 'listening':
        return 'Слушаю вас...';
      case 'ai-processing':
        return 'Обрабатываю речь...';
      case 'speaking':
        return 'AI говорит...';
      case 'error':
        return 'Ошибка';
      default:
        return 'Готов к разговору';
    }
  }, [voiceStatus]);

  const getPhaseDisplayName = (phase: EMDRPhase): string => {
    const phaseNames: Record<EMDRPhase, string> = {
      'preparation': 'Подготовка',
      'assessment': 'Оценка', 
      'desensitization': 'Десенсибилизация',
      'installation': 'Инсталляция',
      'body-scan': 'Сканирование тела',
      'closure': 'Закрытие',
      'reevaluation': 'Переоценка',
      'integration': 'Интеграция'
    };
    return phaseNames[phase];
  };

  const getNextPhase = (current: EMDRPhase): EMDRPhase | null => {
    const phases: EMDRPhase[] = [
      'preparation', 'assessment', 'desensitization', 'installation', 
      'body-scan', 'closure', 'reevaluation', 'integration'
    ];
    const currentIndex = phases.indexOf(current);
    return currentIndex < phases.length - 1 ? phases[currentIndex + 1] : null;
  };

  const getEmotionalStateDisplay = (data: EmotionData) => {
    const arousalLevel = data.arousal > 0.6 ? 'Высокий' : data.arousal > 0.3 ? 'Средний' : 'Низкий';
    const valenceLevel = data.valence > 0.3 ? 'Позитивный' : data.valence > -0.3 ? 'Нейтральный' : 'Негативный';
    
    return `${arousalLevel} arousal, ${valenceLevel} valence`;
  };

  if (!isActive) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Терапевт
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>AI Терапевт неактивен</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session Guidance Panel */}
      {sessionGuidance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Рекомендации по фазе: {getPhaseDisplayName(currentPhase)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">Прогресс фазы</p>
                <Progress value={sessionGuidance.phaseProgress * 100} className="h-2" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{Math.round(sessionGuidance.phaseProgress * 100)}%</p>
                <p className="text-xs text-muted-foreground">
                  ~{sessionGuidance.estimatedTimeRemaining} мин
                </p>
              </div>
            </div>

            {sessionGuidance.recommendations.immediate.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Lightbulb className="h-4 w-4" />
                  Немедленные действия:
                </p>
                <div className="space-y-1">
                  {sessionGuidance.recommendations.immediate.map((rec, index) => (
                    <Badge key={index} variant="secondary" className="mr-2">
                      {rec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {sessionGuidance.recommendations.concerns.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Внимание: {sessionGuidance.recommendations.concerns.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Терапевт (GPT-5)
              {isVoiceMode && (
                <Badge variant="secondary" className="ml-2">
                  <Headphones className="h-3 w-3 mr-1" />
                  Голосовой режим
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4">
              {/* Voice Mode Toggle */}
              <Button
                variant={isVoiceMode ? "default" : "outline"}
                size="sm"
                onClick={toggleVoiceMode}
                disabled={isLoading}
                data-testid="button-toggle-voice-mode"
              >
                {isVoiceMode ? (
                  <><Mic className="h-4 w-4 mr-1" /> Голос</>
                ) : (
                  <><MicOff className="h-4 w-4 mr-1" /> Текст</>
                )}
              </Button>
              
              {/* Real-time Emotion Display */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                {getEmotionalStateDisplay(emotionData)}
                
                {/* Voice-specific emotion indicators */}
                {isVoiceMode && (
                  <>
                    {emotionTrend && (
                      <Badge variant={emotionTrend === 'improving' ? 'default' : emotionTrend === 'declining' ? 'destructive' : 'secondary'}>
                        {emotionTrend === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                        {emotionTrend === 'declining' && <Activity className="h-3 w-3 mr-1" />}
                        {emotionTrend === 'stable' && <Signal className="h-3 w-3 mr-1" />}
                        {emotionTrend}
                      </Badge>
                    )}
                    
                    {voiceAdaptationActive && (
                      <Badge variant="outline">
                        <Zap className="h-3 w-3 mr-1" />
                        Адаптация
                      </Badge>
                    )}
                    
                    {crisisLevel !== 'none' && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {crisisLevel === 'severe' ? 'Критично' : crisisLevel === 'moderate' ? 'Средне' : 'Внимание'}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Voice Error Alert */}
            {voiceError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p>{voiceError}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVoiceError(null)}
                        data-testid="button-dismiss-voice-error"
                      >
                        Понятно
                      </Button>
                      {isVoiceMode && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            setVoiceError(null);
                            toggleVoiceMode();
                          }}
                          data-testid="button-fallback-text-mode"
                        >
                          Текстовый режим
                        </Button>
                      )}
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {/* Enhanced Voice Status Panel with Real-time Emotion Feedback */}
            {isVoiceMode && (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Voice Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {voiceStatus === 'listening' ? (
                          <Radio className="h-4 w-4 text-green-500 animate-pulse" />
                        ) : voiceStatus === 'speaking' ? (
                          <Volume2 className="h-4 w-4 text-blue-500 animate-pulse" />
                        ) : voiceStatus === 'ai-processing' ? (
                          <Brain className="h-4 w-4 text-yellow-500 animate-pulse" />
                        ) : (
                          <Mic className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{getVoiceStatusMessage()}</span>
                        
                        {/* Voice adaptation indicator */}
                        {voiceAdaptationActive && (
                          <Badge variant="outline" className="ml-2">
                            <Waves className="h-3 w-3 mr-1" />
                            Адаптирую голос
                          </Badge>
                        )}
                      </div>
                      
                      {/* Stop conversation button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await voiceServiceRef.current.stopConversation();
                          } catch (error) {
                            console.error('Error stopping conversation:', error);
                          }
                        }}
                        data-testid="button-stop-voice-conversation"
                      >
                        <Square className="h-3 w-3 mr-1" />
                        Стоп
                      </Button>
                    </div>
                    
                    {/* Real-time Emotion Feedback Panel */}
                    {currentEmotionForVoice && (
                      <div className="p-3 bg-background/50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Эмоциональный контекст голоса
                          </span>
                          <div className="flex items-center gap-1">
                            {emotionTrend && (
                              <Badge variant={emotionTrend === 'improving' ? 'default' : emotionTrend === 'declining' ? 'destructive' : 'secondary'} className="text-xs">
                                {emotionTrend === 'improving' && <TrendingUp className="h-3 w-3 mr-1" />}
                                {emotionTrend}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">Возбуждение:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-muted rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    currentEmotionForVoice.arousal > 0.7 ? 'bg-red-500' : 
                                    currentEmotionForVoice.arousal > 0.3 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${currentEmotionForVoice.arousal * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {(currentEmotionForVoice.arousal * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-muted-foreground">Валентность:</span>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex-1 bg-muted rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    currentEmotionForVoice.valence > 0.3 ? 'bg-green-500' : 
                                    currentEmotionForVoice.valence > -0.3 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${((currentEmotionForVoice.valence + 1) / 2) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {currentEmotionForVoice.valence > 0 ? '+' : ''}{(currentEmotionForVoice.valence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Crisis level warning */}
                        {crisisLevel !== 'none' && (
                          <Alert className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Обнаружен {crisisLevel === 'severe' ? 'критический' : crisisLevel === 'moderate' ? 'умеренный' : 'слабый'} уровень стресса. 
                              Голос AI адаптирован для поддержки.
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                    
                    {/* Voice Controls */}
                    <div className="flex items-center gap-2">
                      {/* Listening mode toggle */}
                      <Button
                        size="sm"
                        variant={voiceListeningMode === 'push-to-talk' ? "default" : "outline"}
                        onClick={() => setVoiceListeningMode(voiceListeningMode === 'continuous' ? 'push-to-talk' : 'continuous')}
                        data-testid="button-toggle-listening-mode"
                      >
                        {voiceListeningMode === 'push-to-talk' ? (
                          <><PhoneCall className="h-3 w-3 mr-1" /> Push-to-Talk</>
                        ) : (
                          <><Radio className="h-3 w-3 mr-1" /> Постоянно</>
                        )}
                      </Button>
                      
                      {/* Voice Activity Indicators */}
                      {voiceStatus === 'listening' && (
                        <Badge variant="default" className="animate-pulse">
                          <AudioLines className="h-3 w-3 mr-1" />
                          Слушаю
                        </Badge>
                      )}
                      
                      {voiceStatus === 'speaking' && (
                        <Badge variant="secondary" className="animate-pulse">
                          <Volume2 className="h-3 w-3 mr-1" />
                          Говорю
                        </Badge>
                      )}
                      
                      {voiceStatus === 'ai-processing' && (
                        <Badge variant="secondary" className="animate-pulse">
                          <Brain className="h-3 w-3 mr-1" />
                          Обрабатываю
                        </Badge>
                      )}
                    </div>
                    
                    {/* Audio levels visualization */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Уровень микрофона:</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-100"
                            style={{ width: `${audioLevels.input * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Активность голоса:</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-100"
                            style={{ width: `${audioLevels.voiceActivity * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Chat Messages */}
            <ScrollArea className="h-96 w-full rounded-md border p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="space-y-2">
                        <p className="text-sm">{message.message}</p>
                        
                        {/* Voice message indicators */}
                        {message.isVoice && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {message.type === 'user' ? (
                                <><Mic className="h-2 w-2 mr-1" /> Голосовое сообщение</>
                              ) : (
                                <><Volume2 className="h-2 w-2 mr-1" /> Голосовой ответ</>
                              )}
                            </Badge>
                            {message.transcriptionConfidence && (
                              <Badge variant="secondary" className="text-xs">
                                Точность: {Math.round(message.transcriptionConfidence * 100)}%
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {message.emotionalContext && message.type === 'user' && (
                        <div className="mt-2 pt-2 border-t border-primary-foreground/20">
                          <p className="text-xs opacity-75">
                            Эмоциональное состояние: {getEmotionalStateDisplay(message.emotionalContext)}
                          </p>
                        </div>
                      )}
                      
                      {message.recommendations && message.recommendations.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.recommendations.map((rec: any, index: number) => (
                            <Badge 
                              key={index} 
                              variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                              className="mr-1 text-xs"
                            >
                              {rec.type}: {rec.message}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-xs opacity-75 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        <p className="text-sm">AI анализирует ваше сообщение...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            <Separator />

            {/* Message Input */}
            {!isVoiceMode && (
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Поделитесь своими мыслями и чувствами..."
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="input-ai-message"
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={!inputMessage.trim() || isLoading}
                  data-testid="button-send-ai-message"
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Voice Mode Hint */}
            {isVoiceMode && !usePushToTalk && (
              <div className="text-center py-4 text-muted-foreground">
                <div className="space-y-2">
                  <Mic className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm">
                    Голосовой режим активен. Нажмите "Начать слушать" и говорите.
                  </p>
                </div>
              </div>
            )}
            
            {isVoiceMode && usePushToTalk && (
              <div className="text-center py-4 text-muted-foreground">
                <div className="space-y-2">
                  <PhoneCall className="h-8 w-8 mx-auto opacity-50" />
                  <p className="text-sm">
                    Нажмите и удерживайте кнопку микрофона чтобы говорить.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {!isVoiceMode && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage('Как дела с текущей фазой?')}
                  data-testid="button-quick-phase-check"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Проверить прогресс фазы
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage('Мне нужна поддержка')}
                  data-testid="button-quick-support"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Нужна поддержка
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInputMessage('Я чувствую дискомфорт')}
                  data-testid="button-quick-discomfort"
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Дискомфорт
                </Button>
              </div>
            )}
            
            {/* Voice Quick Actions */}
            {isVoiceMode && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await handleVoiceInput('Как дела с текущей фазой?', 1.0);
                  }}
                  data-testid="button-voice-quick-phase-check"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Проверить фазу
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await handleVoiceInput('Мне нужна поддержка', 1.0);
                  }}
                  data-testid="button-voice-quick-support"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Поддержка
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}