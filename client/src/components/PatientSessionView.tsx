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
  AlertCircle
} from "lucide-react";
import Header from "./Header";

export default function PatientSessionView() {
  const [isDark, setIsDark] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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
  
  // Mock user data
  const user = {
    name: "Анна Петрова",
    email: "anna.petrova@email.com",
    role: 'patient' as const,
    avatar: ""
  };
  
  // Mock therapist data
  const therapist = {
    name: "Доктор Иванова",
    status: "Онлайн",
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

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onThemeToggle={() => setIsDark(!isDark)} isDark={isDark} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Session Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">EMDR Сессия</h1>
              <p className="text-muted-foreground">Сессия с {therapist.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className={getPhaseColor(sessionPhase)} data-testid="badge-session-phase">
                {getPhaseLabel(sessionPhase)}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(sessionDuration)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Therapist Video */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Ваш психолог</CardTitle>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                    {therapist.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  {isConnected ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <span className="text-2xl font-bold">{therapist.name.charAt(0)}</span>
                        </div>
                        <p className="font-medium">{therapist.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Video className="w-12 h-12 mx-auto mb-2" />
                        <p>Ожидание подключения...</p>
                      </div>
                    </div>
                  )}
                  
                  {isConnected && (
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-black/50 text-white">{therapist.name}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* EMDR Game Area */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">EMDR Упражнение</CardTitle>
                  <div className="flex items-center space-x-2">
                    {isEMDRActive ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEMDRActive(false)}
                        data-testid="button-pause-emdr"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Пауза
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEMDRActive(true)}
                        disabled={!isConnected}
                        data-testid="button-start-emdr"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Старт
                      </Button>
                    )}
                    <Button variant="outline" size="sm" data-testid="button-emdr-settings">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <canvas 
                    ref={gameCanvasRef}
                    width={600}
                    height={200}
                    className="w-full border rounded-lg bg-black"
                    style={{ backgroundColor: emdrSettings.backgroundColor }}
                  />
                  {!isEMDRActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <div className="text-center text-white">
                        <Circle className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">
                          {isConnected ? 'Нажмите "Старт" для начала упражнения' : 'Ожидание подключения психолога'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Current Instruction */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-1">Инструкция:</p>
                      <p className="text-sm text-muted-foreground" data-testid="text-instruction">
                        {currentInstruction}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Video (Preview) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ваше видео</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  {videoEnabled ? (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <span className="text-lg font-bold">{user.name.charAt(0)}</span>
                        </div>
                        <p className="text-sm">{user.name}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-800">
                      <div className="text-center">
                        <VideoOff className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">Камера отключена</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            {/* Connection Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Подключение</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-medium">
                    {isConnected ? 'Подключен' : 'Не подключен'}
                  </span>
                </div>
                
                {!isConnected ? (
                  <Button 
                    className="w-full" 
                    onClick={() => setIsConnected(true)}
                    data-testid="button-connect"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Подключиться к сессии
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setIsConnected(false)}
                    data-testid="button-disconnect"
                  >
                    <PhoneOff className="w-4 h-4 mr-2" />
                    Завершить сессию
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Media Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Управление</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={videoEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    data-testid="button-toggle-video"
                  >
                    {videoEnabled ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                    {videoEnabled ? 'Видео' : 'Видео'}
                  </Button>
                  <Button
                    variant={audioEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    data-testid="button-toggle-audio"
                  >
                    {audioEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                    {audioEnabled ? 'Микрофон' : 'Микрофон'}
                  </Button>
                  <Button
                    variant={soundEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    data-testid="button-toggle-sound"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                    Звук
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    data-testid="button-fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                    Экран
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Session Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Прогресс сессии</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Фаза сессии</span>
                    <span>{getPhaseLabel(sessionPhase)}</span>
                  </div>
                  <Progress value={sessionPhase === 'waiting' ? 0 : 
                                  sessionPhase === 'preparation' ? 16 :
                                  sessionPhase === 'desensitization' ? 33 :
                                  sessionPhase === 'installation' ? 50 :
                                  sessionPhase === 'body-scan' ? 75 : 100} />
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Время сессии:</span>
                    <span>{formatTime(sessionDuration)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Сообщения</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" data-testid="button-open-chat">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Открыть чат
                </Button>
              </CardContent>
            </Card>

            {/* Emergency Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-600">Экстренные действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full text-orange-600 border-orange-200" data-testid="button-pause-session">
                  <Pause className="w-4 h-4 mr-2" />
                  Приостановить сессию
                </Button>
                <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200" data-testid="button-emergency-stop">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Экстренная остановка
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}