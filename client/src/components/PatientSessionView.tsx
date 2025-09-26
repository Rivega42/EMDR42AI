import { useState, useEffect, useRef } from "react";
import { UnifiedEmotionService } from '@/services/emotion/emotionService';
import { AITherapistService } from '@/services/ai/therapist';
import { TextToSpeechService } from '@/services/voice/textToSpeechService';
import { AudioStreamMultiplexer, getAudioStreamMultiplexer } from '@/services/audio/audioStreamMultiplexer';
import { AdaptiveController } from '@/services/bls/adaptiveController';
import { Renderer3D } from '@/services/bls/renderer3D';
import type { EmotionData, AITherapistMessage, BLSConfiguration } from '@/../../shared/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  MessageCircle,
  Settings,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Circle,
  Square,
  Heart,
  Star,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Activity,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Move,
  X
} from "lucide-react";
import Header from "./Header";

export default function PatientSessionView() {
  const [isDark, setIsDark] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Floating panels state
  const [panelStates, setPanelStates] = useState({
    controls: { isExpanded: false, position: { x: 20, y: 20 }, isDragging: false },
    emdr: { isExpanded: false, position: { x: 20, y: 100 }, isDragging: false },
    info: { isExpanded: false, position: { x: 20, y: 180 }, isDragging: false },
    chat: { isExpanded: false, position: { x: 20, y: 260 }, isDragging: false }
  });
  
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Real BLS State
  const [isEMDRActive, setIsEMDRActive] = useState(false);
  const [blsConfig, setBlsConfig] = useState<BLSConfiguration>({
    speed: 5,
    pattern: 'horizontal',
    color: '#3b82f6',
    intensity: 0.7,
    adaptive: true,
    audio: {
      enabled: true,
      frequency: 440,
      volume: 0.3,
      binaural: true
    },
    visual: {
      enabled: true,
      size: 20,
      opacity: 0.8,
      trail: true
    },
    haptic: {
      enabled: false,
      intensity: 0.5
    }
  });
  
  // Session State
  const [sessionPhase, setSessionPhase] = useState<'waiting' | 'preparation' | 'desensitization' | 'installation' | 'body-scan' | 'closure'>('waiting');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState('Ожидание подключения психолога...');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [hasMediaPermission, setHasMediaPermission] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  
  // Request camera and microphone permissions on component mount
  useEffect(() => {
    const requestMediaPermissions = async () => {
      try {
        console.log('🎥 Запрашиваем доступ к камере и микрофону...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        console.log('✅ Доступ к медиа получен!', stream);
        setMediaStream(stream);
        setHasMediaPermission(true);
        setCurrentInstruction('Камера и микрофон подключены. Готов к сессии!');
      } catch (error) {
        console.error('❌ Ошибка доступа к медиа:', error);
        setMediaError(error instanceof Error ? error.message : 'Ошибка доступа к камере/микрофону');
        setCurrentInstruction('Нужен доступ к камере и микрофону для проведения сессии');
      }
    };

    requestMediaPermissions();

    // Cleanup function to stop media stream when component unmounts
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Real services
  const [emotionService] = useState(() => new UnifiedEmotionService());
  const [aiTherapist] = useState(() => new AITherapistService());
  const [ttsService] = useState(() => new TextToSpeechService());
  const [audioMultiplexer] = useState(() => getAudioStreamMultiplexer());
  // BLS services initialized when needed
  const [blsController, setBlsController] = useState<AdaptiveController | null>(null);
  const [blsRenderer, setBlsRenderer] = useState<Renderer3D | null>(null);
  
  // AI Therapist state
  const [aiMessages, setAiMessages] = useState<AITherapistMessage[]>([]);
  const [currentEmotionData, setCurrentEmotionData] = useState<EmotionData | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Real user data (will come from auth context later)
  const user = {
    name: "Пациент", 
    email: "patient@emdr42.com",
    role: 'patient' as const,
    avatar: ""
  };
  
  // AI Therapist as virtual therapist
  const therapist = {
    name: "AI Терапевт EMDR42",
    status: isAiSpeaking ? "Говорит" : hasMediaPermission ? "Готов" : "Ожидание",
    avatar: ""
  };

  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const blsContainerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Initialize all real services when connecting
  useEffect(() => {
    if (isConnected && hasMediaPermission) {
      initializeSession();
    }
  }, [isConnected, hasMediaPermission]);

  // Session timer
  useEffect(() => {
    if (isConnected) {
      const timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isConnected]);

  // Initialize real EMDR session with all services
  const initializeSession = async () => {
    try {
      console.log('🚀 Initializing EMDR session with real services...');
      
      // 1. Initialize Audio Multiplexer
      if (mediaStream) {
        await audioMultiplexer.setMediaStream(mediaStream);
        console.log('✅ Audio multiplexer initialized with media stream');
      }

      // 2. Initialize Emotion Service
      const videoElement = document.createElement('video');
      if (mediaStream) {
        videoElement.srcObject = mediaStream;
        await videoElement.play();
      }
      
      await emotionService.initialize({
        face: { enabled: true, smoothingWindow: 5, processEveryNFrames: 10, minConfidence: 0.7 },
        voice: { enabled: true, provider: 'assemblyai', language: 'en-US', sampleRate: 16000 },
        fusion: { enabled: true, strategy: 'weighted-average' },
        multimodal: { enabled: true, preferredMode: 'multimodal', fallbackStrategy: 'face', qualityThreshold: 0.6 },
        audio: { useMultiplexer: true, consumerPriority: 8, consumerName: 'EmotionAnalysis' }
      }, videoElement);
      
      // Set emotion callback for real-time updates
      emotionService.onEmotion((emotionData) => {
        setCurrentEmotionData(emotionData);
        console.log('💡 Real emotion detected:', emotionData.arousal, emotionData.valence);
        
        // Send to AI therapist for real-time adaptation
        if (sessionPhase !== 'waiting') {
          handleEmotionUpdate(emotionData);
        }
      });
      
      await emotionService.start();
      console.log('✅ Emotion service initialized');

      // 3. Initialize AI Therapist
      aiTherapist.initializeSession(
        `session-${Date.now()}`,
        'patient-001',
        'preparation'
      );
      console.log('✅ AI Therapist initialized');

      // 4. Initialize TTS Service
      await ttsService.initialize({
        providers: ['web-speech'],
        defaultProvider: 'web-speech',
        cache: { enabled: true, maxSizeMB: 50, maxItems: 100, persistCache: false }
      });
      console.log('✅ TTS service initialized');

      // 5. Initialize BLS services when first needed (lazy loading)
      console.log('✅ BLS services will be initialized when EMDR starts');

      // 6. Start AI session
      setSessionPhase('preparation');
      setCurrentInstruction('Добро пожаловать! AI терапевт готов к работе. Расскажите, что вас беспокоит.');
      
      // Send initial AI message
      await sendInitialAIMessage();
      
    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      setCurrentInstruction('Ошибка инициализации сессии. Проверьте подключения.');
    }
  };

  // Handle real-time emotion updates
  const handleEmotionUpdate = async (emotionData: EmotionData) => {
    try {
      // Send emotion to AI for adaptive response
      const aiResponse = await aiTherapist.processEmotionResponse(emotionData);
      
      if (aiResponse.recommendedIntervention) {
        console.log('⚡ AI intervention triggered:', aiResponse.recommendedIntervention);
        
        // Speak AI intervention
        if (aiResponse.message) {
          await speakAIMessage(aiResponse.message);
        }
        
        // Adapt BLS if needed
        if (aiResponse.blsAdjustments && isEMDRActive && blsController) {
          const newConfig = {
            ...blsConfig,
            speed: aiResponse.blsAdjustments.speed || blsConfig.speed,
            color: aiResponse.blsAdjustments.color || blsConfig.color,
            intensity: aiResponse.blsAdjustments.intensity || blsConfig.intensity
          };
          setBlsConfig(newConfig);
          console.log('✅ BLS adapted to emotions:', newConfig);
        }
      }
    } catch (error) {
      console.error('❌ Error processing emotion update:', error);
    }
  };

  // Send initial AI message
  const sendInitialAIMessage = async () => {
    try {
      const aiMessage = await aiTherapist.sendMessage('Session started. Begin EMDR preparation phase.');
      setAiMessages(prev => [...prev, aiMessage]);
      
      if (aiMessage.message) {
        await speakAIMessage(aiMessage.message);
      }
    } catch (error) {
      console.error('❌ Error sending initial AI message:', error);
    }
  };

  // Speak AI message using TTS
  const speakAIMessage = async (message: string) => {
    try {
      setIsAiSpeaking(true);
      
      const audioResponse = await ttsService.synthesize({
        text: message,
        voice: {
          name: 'en-US-Studio-M',
          language: 'ru-RU',
          gender: 'neutral',
          age: 'adult',
          accent: 'russian',
          characteristics: {
            warmth: 0.8,
            authority: 0.6,
            empathy: 0.9,
            clarity: 0.9,
            pace: 'normal',
            calmness: 0.8
          },
          therapeuticProfile: {
            anxietyFriendly: true,
            traumaSensitive: true,
            childFriendly: false,
            culturallySensitive: ['ru-RU', 'universal']
          }
        },
        options: {
          ssmlEnabled: false,
          speed: 0.9,
          pitch: 0,
          volume: 0.8,
          emphasis: 'moderate',
          breaks: {
            sentence: 0.3,
            paragraph: 0.6,
            comma: 0.1
          }
        }
      });
      
      if (audioResponse.audioBlob) {
        const audioUrl = URL.createObjectURL(audioResponse.audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsAiSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audio.play();
      }
    } catch (error) {
      console.error('❌ Error speaking AI message:', error);
      setIsAiSpeaking(false);
    }
  };

  // EMDR Animation
  useEffect(() => {
    if (isEMDRActive && gameCanvasRef.current) {
      const canvas = gameCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let position = 0;
      let direction = 1;
      const maxPosition = canvas.width - emdrSettings.ballSize;

      const animate = () => {
        ctx.fillStyle = emdrSettings.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Move ball
        position += direction * emdrSettings.speed;
        if (position <= 0 || position >= maxPosition) {
          direction *= -1;
        }

        // Draw ball
        ctx.fillStyle = emdrSettings.ballColor;
        const centerY = canvas.height / 2;
        const centerX = position + emdrSettings.ballSize / 2;

        switch (emdrSettings.shape) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(centerX, centerY, emdrSettings.ballSize / 2, 0, 2 * Math.PI);
            ctx.fill();
            break;
          case 'square':
            ctx.fillRect(position, centerY - emdrSettings.ballSize / 2, emdrSettings.ballSize, emdrSettings.ballSize);
            break;
          case 'heart':
            // Simplified heart shape
            ctx.beginPath();
            ctx.arc(centerX - emdrSettings.ballSize / 4, centerY - emdrSettings.ballSize / 4, emdrSettings.ballSize / 4, 0, 2 * Math.PI);
            ctx.arc(centerX + emdrSettings.ballSize / 4, centerY - emdrSettings.ballSize / 4, emdrSettings.ballSize / 4, 0, 2 * Math.PI);
            ctx.fill();
            break;
          case 'star':
            // Simplified star shape
            ctx.fillRect(centerX - 2, centerY - emdrSettings.ballSize / 2, 4, emdrSettings.ballSize);
            ctx.fillRect(centerX - emdrSettings.ballSize / 2, centerY - 2, emdrSettings.ballSize, 4);
            break;
        }

        animationRef.current = requestAnimationFrame(animate);
      };

      animate();
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [isEMDRActive, emdrSettings]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'waiting': return 'Ожидание';
      case 'preparation': return 'Подготовка';
      case 'desensitization': return 'Десенсибилизация';
      case 'installation': return 'Инсталляция';
      case 'body-scan': return 'Сканирование тела';
      case 'closure': return 'Завершение';
      default: return phase;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'waiting': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'preparation': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200';
      case 'desensitization': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200';
      case 'installation': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200';
      case 'body-scan': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200';
      case 'closure': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Drag and drop functions
  const handleMouseDown = (panelId: keyof typeof panelStates, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    setPanelStates(prev => ({
      ...prev,
      [panelId]: { ...prev[panelId], isDragging: true }
    }));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    Object.entries(panelStates).forEach(([panelId, state]) => {
      if (state.isDragging) {
        setPanelStates(prev => ({
          ...prev,
          [panelId]: {
            ...prev[panelId as keyof typeof panelStates],
            position: {
              x: e.clientX - dragOffset.x,
              y: e.clientY - dragOffset.y
            }
          }
        }));
      }
    });
  };

  const handleMouseUp = () => {
    setPanelStates(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key as keyof typeof panelStates].isDragging = false;
      });
      return newState;
    });
  };

  const togglePanel = (panelId: keyof typeof panelStates) => {
    setPanelStates(prev => ({
      ...prev,
      [panelId]: { ...prev[panelId], isExpanded: !prev[panelId].isExpanded }
    }));
  };

  return (
    <div 
      className="fixed inset-0 bg-black"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Full-screen video background */}
      <div className="absolute inset-0">
        {isConnected ? (
          <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center text-white relative">
            {/* Main therapist video */}
            <div className="text-center">
              <div className="w-32 h-32 bg-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-4xl font-bold">{therapist.name?.charAt(0) || '?'}</span>
              </div>
              <p className="text-2xl font-medium">{therapist.name}</p>
            </div>
            
            {/* Patient video in corner */}
            <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
              {videoEnabled ? (
                <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                      <span className="text-lg font-bold">{user.name?.charAt(0) || '?'}</span>
                    </div>
                    <p className="text-sm">{user.name}</p>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-800">
                  <VideoOff className="w-8 h-8" />
                </div>
              )}
            </div>

            {/* Real BLS 3D Renderer overlay */}
            {isEMDRActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  ref={blsContainerRef}
                  className="w-full h-full"
                  style={{ maxWidth: '800px', maxHeight: '300px' }}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white bg-gray-900">
            <div className="text-center">
              <Video className="w-24 h-24 mx-auto mb-4 text-gray-400" />
              <p className="text-xl">Ожидание подключения к сессии...</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Control Panel */}
      <div
        className={`absolute bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-300 ${
          panelStates.controls.isExpanded ? 'w-80' : 'w-16'
        } h-16`}
        style={{
          left: panelStates.controls.position.x,
          top: panelStates.controls.position.y,
          cursor: panelStates.controls.isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div 
          className="flex items-center h-full px-4"
          onMouseDown={(e) => handleMouseDown('controls', e)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => togglePanel('controls')}
            data-testid="button-toggle-controls"
          >
            <Settings className="w-5 h-5" />
          </Button>
          
          {panelStates.controls.isExpanded && (
            <div className="flex items-center space-x-2 ml-4">
              {!isConnected ? (
                <Button 
                  size="sm"
                  onClick={() => {
                    if (hasMediaPermission) {
                      setIsConnected(true);
                    } else {
                      setCurrentInstruction('Сначала разрешите доступ к камере и микрофону');
                    }
                  }}
                  disabled={!hasMediaPermission}
                  data-testid="button-connect"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {hasMediaPermission ? 'Начать AI сессию' : 'Ожидание разрешений'}
                </Button>
              ) : (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={async () => {
                    // Cleanup all services
                    try {
                      await emotionService.destroy();
                      // audioMultiplexer cleanup is handled automatically
                    } catch (error) {
                      console.error('Error cleaning up services:', error);
                    }
                    setIsConnected(false);
                    setSessionPhase('waiting');
                    setCurrentInstruction('Сессия завершена.');
                  }}
                  data-testid="button-disconnect"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Завершить сессию
                </Button>
              )}
              
              <Button
                variant={videoEnabled ? "default" : "outline"}
                size="icon"
                onClick={() => setVideoEnabled(!videoEnabled)}
                data-testid="button-toggle-video"
              >
                {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </Button>
              
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="icon"
                onClick={() => setAudioEnabled(!audioEnabled)}
                data-testid="button-toggle-audio"
              >
                {audioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Floating EMDR Panel */}
      <div
        className={`absolute bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-300 ${
          panelStates.emdr.isExpanded ? 'w-96 h-32' : 'w-16 h-16'
        }`}
        style={{
          left: panelStates.emdr.position.x,
          top: panelStates.emdr.position.y,
          cursor: panelStates.emdr.isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div 
          className="flex items-center h-16 px-4"
          onMouseDown={(e) => handleMouseDown('emdr', e)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => togglePanel('emdr')}
            data-testid="button-toggle-emdr"
          >
            <Circle className="w-5 h-5" />
          </Button>
          
          {panelStates.emdr.isExpanded && (
            <div className="flex items-center space-x-2 ml-4">
              {!isEMDRActive ? (
                <Button 
                  size="sm"
                  onClick={async () => {
                    try {
                      // Initialize BLS services if not already done
                      if (!blsController) {
                        const controller = new AdaptiveController(blsConfig);
                        setBlsController(controller);
                        console.log('✅ BLS Controller initialized');
                      }
                      
                      if (!blsRenderer && blsContainerRef.current) {
                        const defaultConfig = {
                          canvas: { width: 800, height: 300, antialias: true, alpha: true },
                          camera: { fov: 75, position: { x: 0, y: 0, z: 50 } },
                          lighting: { ambient: 0.4, directional: 0.8 }
                        };
                        const renderer = new Renderer3D(blsContainerRef.current, defaultConfig);
                        setBlsRenderer(renderer);
                        console.log('✅ BLS 3D Renderer initialized');
                      }
                      
                      // Start EMDR with real BLS
                      setIsEMDRActive(true);
                      console.log('✅ Real BLS session started');
                    } catch (error) {
                      console.error('❌ Failed to start BLS:', error);
                    }
                  }}
                  disabled={!isConnected}
                  data-testid="button-start-emdr"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Старт EMDR
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={async () => {
                    try {
                      // Stop BLS session
                      setIsEMDRActive(false);
                      console.log('✅ BLS session stopped');
                    } catch (error) {
                      console.error('❌ Failed to stop BLS:', error);
                    }
                  }}
                  data-testid="button-pause-emdr"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Пауза
                </Button>
              )}
            </div>
          )}
        </div>
        
        {panelStates.emdr.isExpanded && (
          <div className="px-4 pb-4">
            <div className="space-y-2">
              <p className="text-white text-sm">
                {isEMDRActive ? 'BLS активна' : 'BLS остановлена'}
              </p>
              {isEMDRActive && (
                <div className="text-xs text-gray-300">
                  <div>Скорость: {blsConfig.speed}</div>
                  <div>Паттерн: {blsConfig.pattern}</div>
                  <div>Интенсивность: {Math.round(blsConfig.intensity * 100)}%</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Session Info Panel */}
      <div
        className={`absolute bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-300 ${
          panelStates.info.isExpanded ? 'w-80 h-40' : 'w-16 h-16'
        }`}
        style={{
          left: panelStates.info.position.x,
          top: panelStates.info.position.y,
          cursor: panelStates.info.isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div 
          className="flex items-center h-16 px-4"
          onMouseDown={(e) => handleMouseDown('info', e)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => togglePanel('info')}
            data-testid="button-toggle-info"
          >
            <Activity className="w-5 h-5" />
          </Button>
          
          {panelStates.info.isExpanded && (
            <div className="ml-4 text-white">
              <p className="text-sm font-medium">Информация о сессии</p>
            </div>
          )}
        </div>
        
        {panelStates.info.isExpanded && (
          <div className="px-4 pb-4 text-white space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Фаза:</span>
              <Badge className={getPhaseColor(sessionPhase)} data-testid="badge-session-phase">
                {getPhaseLabel(sessionPhase)}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Время:</span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(sessionDuration)}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-300">Инструкция:</p>
              <p className="text-sm" data-testid="text-instruction">{currentInstruction}</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Panel */}
      <div
        className={`absolute bg-black/80 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-300 ${
          panelStates.chat.isExpanded ? 'w-80 h-32' : 'w-16 h-16'
        }`}
        style={{
          left: panelStates.chat.position.x,
          top: panelStates.chat.position.y,
          cursor: panelStates.chat.isDragging ? 'grabbing' : 'grab'
        }}
      >
        <div 
          className="flex items-center h-16 px-4"
          onMouseDown={(e) => handleMouseDown('chat', e)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => togglePanel('chat')}
            data-testid="button-toggle-chat"
          >
            <MessageCircle className="w-5 h-5" />
          </Button>
          
          {panelStates.chat.isExpanded && (
            <div className="ml-4 text-white">
              <p className="text-sm font-medium">Чат с психологом</p>
            </div>
          )}
        </div>
        
        {panelStates.chat.isExpanded && (
          <div className="px-4 pb-4">
            <Button variant="outline" size="sm" className="text-white border-white/20" data-testid="button-open-chat">
              Открыть полный чат
            </Button>
          </div>
        )}
      </div>

      {/* Emergency buttons in top-right */}
      <div className="absolute top-4 right-4 space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-black/80 text-orange-400 border-orange-400/50 hover:bg-orange-400/20"
          data-testid="button-pause-session"
        >
          <Pause className="w-4 h-4 mr-2" />
          Пауза
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          className="bg-red-900/80 hover:bg-red-900"
          data-testid="button-emergency-stop"
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          SOS
        </Button>
      </div>
    </div>
  );
}