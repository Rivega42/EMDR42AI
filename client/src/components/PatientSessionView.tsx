import { useState, useEffect, useRef } from "react";
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
  
  // EMDR Game State
  const [isEMDRActive, setIsEMDRActive] = useState(false);
  const [emdrSettings, setEmdrSettings] = useState({
    speed: 5,
    ballSize: 20,
    shape: 'circle',
    ballColor: '#3b82f6',
    backgroundColor: '#000000',
    soundOn: true
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
  
  // TODO: Get user and therapist data from authentication/session context
  const user = {
    name: "", // Will be loaded from context
    email: "",
    role: 'patient' as const,
    avatar: ""
  };
  
  // TODO: Get therapist data from session/API
  const therapist = {
    name: "", // Will be loaded from session
    status: "Ожидание",
    avatar: ""
  };

  const gameCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  // Session timer
  useEffect(() => {
    if (isConnected) {
      const timer = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isConnected]);

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

            {/* EMDR Canvas overlay */}
            {isEMDRActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <canvas 
                  ref={gameCanvasRef}
                  width={800}
                  height={300}
                  className="bg-transparent"
                  style={{ backgroundColor: emdrSettings.backgroundColor }}
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
                  onClick={() => setIsConnected(true)}
                  data-testid="button-connect"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Подключиться
                </Button>
              ) : (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => setIsConnected(false)}
                  data-testid="button-disconnect"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  Завершить
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
                  onClick={() => setIsEMDRActive(true)}
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
                  onClick={() => setIsEMDRActive(false)}
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
            <p className="text-white text-sm">
              {isEMDRActive ? 'EMDR активна' : 'EMDR остановлена'}
            </p>
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