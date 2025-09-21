/**
 * Revolutionary AI Therapist Component
 * GPT-5 powered EMDR therapist with real-time emotion recognition and adaptive recommendations
 */

import { useState, useEffect, useRef } from 'react';
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
  Activity
} from 'lucide-react';
import { aiTherapist } from '@/services/ai/therapist';
import type { 
  EMDRPhase, 
  AITherapistMessage, 
  AISessionGuidance, 
  PersonalizedRecommendation,
  CrisisDetection,
  EmotionData
} from '@/../shared/types';

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

  // Process emotion changes in real-time
  useEffect(() => {
    if (isInitialized && emotionData.timestamp > lastEmotionUpdate) {
      processEmotionChange();
      setLastEmotionUpdate(emotionData.timestamp);
    }
  }, [emotionData, isInitialized, lastEmotionUpdate]);

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
      if (emotionResponse.phaseTransitionAdvice.canAdvance) {
        const nextPhase = getNextPhase(currentPhase);
        if (nextPhase) {
          const transitionMessage: ChatMessage = {
            id: `transition-${Date.now()}`,
            type: 'ai',
            message: `Отлично! Вы готовы перейти к следующей фазе: ${getPhaseDisplayName(nextPhase)}. ${emotionResponse.phaseTransitionAdvice.reasoning}`,
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
        message: aiResponse.message,
        timestamp: Date.now(),
        recommendations: aiResponse.personalizedRecommendations
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Process recommendations
      aiResponse.personalizedRecommendations.forEach(onRecommendation);
      
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
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              {getEmotionalStateDisplay(emotionData)}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                      <p className="text-sm">{message.message}</p>
                      
                      {message.emotionalContext && message.type === 'user' && (
                        <div className="mt-2 pt-2 border-t border-primary-foreground/20">
                          <p className="text-xs opacity-75">
                            Эмоциональное состояние: {getEmotionalStateDisplay(message.emotionalContext)}
                          </p>
                        </div>
                      )}
                      
                      {message.recommendations && message.recommendations.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.recommendations.map((rec, index) => (
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

            {/* Quick Actions */}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}