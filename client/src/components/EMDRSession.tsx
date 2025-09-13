import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Phone,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Circle,
  Square,
  Triangle,
  Heart,
  Star,
  Zap,
  Clock,
  Eye,
  EyeOff
} from "lucide-react";

interface SessionParticipant {
  id: string;
  name: string;
  role: 'therapist' | 'patient';
  avatar?: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

interface EMDRSettings {
  ballSpeed: number;
  ballSize: number;
  ballShape: 'circle' | 'square' | 'triangle' | 'heart' | 'star' | 'lightning';
  ballColor: string;
  soundEnabled: boolean;
  soundType: 'beep' | 'chime' | 'click' | 'none';
  backgroundColor: string;
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

export default function EMDRSession() {
  const [sessionActive, setSessionActive] = useState(true);
  const [emdrMode, setEmdrMode] = useState(false);
  const [ballPosition, setBallPosition] = useState(0);
  const [ballDirection, setBallDirection] = useState(1);
  const animationRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [phase, setPhase] = useState<'preparation' | 'desensitization' | 'installation' | 'body-scan' | 'closure'>('preparation');
  
  //todo: remove mock functionality
  const [participants] = useState<SessionParticipant[]>([
    {
      id: "1",
      name: "Др. Петров Дмитрий",
      role: "therapist",
      avatar: undefined,
      videoEnabled: true,
      audioEnabled: true
    },
    {
      id: "2", 
      name: "Анна Иванова",
      role: "patient",
      avatar: undefined,
      videoEnabled: true,
      audioEnabled: true
    }
  ]);

  const [emdrSettings, setEmdrSettings] = useState<EMDRSettings>({
    ballSpeed: 3,
    ballSize: 20,
    ballShape: 'circle',
    ballColor: '#3b82f6',
    soundEnabled: true,
    soundType: 'beep',
    backgroundColor: '#f8fafc',
    direction: 'horizontal'
  });

  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (sessionActive) {
      const interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionActive]);

  useEffect(() => {
    if (emdrMode) {
      const animate = () => {
        setBallPosition(prev => {
          let newPos = prev + (ballDirection * emdrSettings.ballSpeed * 0.5);
          
          // Bounce off edges
          if (newPos >= 380 || newPos <= 0) {
            setBallDirection(dir => -dir);
            if (emdrSettings.soundEnabled) {
              // Play sound here
            }
          }
          
          return Math.max(0, Math.min(380, newPos));
        });
        
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [emdrMode, emdrSettings.ballSpeed, ballDirection, emdrSettings.soundEnabled]);

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

  const getBallShapeIcon = (shape: EMDRSettings['ballShape']) => {
    switch (shape) {
      case 'circle': return Circle;
      case 'square': return Square;
      case 'triangle': return Triangle;
      case 'heart': return Heart;
      case 'star': return Star;
      case 'lightning': return Zap;
      default: return Circle;
    }
  };

  const toggleEMDRMode = () => {
    setEmdrMode(!emdrMode);
    if (!emdrMode) {
      setBallPosition(190); // Center position
    }
  };

  const resetBall = () => {
    setBallPosition(190);
    setBallDirection(1);
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
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowSettings(!showSettings)}
                data-testid="button-emdr-settings"
              >
                <Settings className="w-4 h-4 mr-1" />
                Настройки EMDR
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
            {/* EMDR Canvas */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>EMDR Терапевтический модуль</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={emdrMode ? "default" : "outline"}
                      onClick={toggleEMDRMode}
                      data-testid="button-toggle-emdr"
                    >
                      {emdrMode ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                      {emdrMode ? 'Пауза' : 'Начать'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={resetBall}
                      data-testid="button-reset-ball"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  className="relative w-full h-96 flex items-center justify-center"
                  style={{ backgroundColor: emdrSettings.backgroundColor }}
                >
                  {/* EMDR Ball */}
                  <div
                    className="absolute transition-colors duration-200 rounded-full flex items-center justify-center"
                    style={{
                      width: emdrSettings.ballSize + 'px',
                      height: emdrSettings.ballSize + 'px',
                      backgroundColor: emdrSettings.ballColor,
                      left: ballPosition + 'px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      boxShadow: emdrMode ? '0 0 20px rgba(59, 130, 246, 0.5)' : 'none'
                    }}
                  >
                    {emdrSettings.ballShape !== 'circle' && (
                      (() => {
                        const Icon = getBallShapeIcon(emdrSettings.ballShape);
                        return <Icon className="w-3 h-3 text-white" />;
                      })()
                    )}
                  </div>
                  
                  {/* Center guideline */}
                  <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border opacity-30 transform -translate-x-1/2"></div>
                  
                  {/* Instructions overlay */}
                  {!emdrMode && (
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                      <div className="text-center">
                        <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground font-medium">Следите глазами за движущимся объектом</p>
                        <p className="text-sm text-muted-foreground mt-1">Нажмите "Начать" для запуска EMDR модуля</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* EMDR Controls */}
                <div className="p-6 border-t border-border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Скорость:</span>
                        <div className="w-24">
                          <Slider
                            value={[emdrSettings.ballSpeed]}
                            onValueChange={(value) => setEmdrSettings(prev => ({ ...prev, ballSpeed: value[0] }))}
                            max={10}
                            min={1}
                            step={1}
                            data-testid="slider-ball-speed"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-6">{emdrSettings.ballSpeed}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Размер:</span>
                        <div className="w-20">
                          <Slider
                            value={[emdrSettings.ballSize]}
                            onValueChange={(value) => setEmdrSettings(prev => ({ ...prev, ballSize: value[0] }))}
                            max={40}
                            min={10}
                            step={2}
                            data-testid="slider-ball-size"
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8">{emdrSettings.ballSize}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEmdrSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                        data-testid="button-toggle-sound"
                      >
                        {emdrSettings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </Button>
                      
                      <div className="flex space-x-1">
                        {['circle', 'square', 'heart', 'star'].map((shape) => (
                          <Button
                            key={shape}
                            variant={emdrSettings.ballShape === shape ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setEmdrSettings(prev => ({ ...prev, ballShape: shape as EMDRSettings['ballShape'] }))}
                            data-testid={`button-shape-${shape}`}
                          >
                            {(() => {
                              const Icon = getBallShapeIcon(shape as EMDRSettings['ballShape']);
                              return <Icon className="w-4 h-4" />;
                            })()}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                  {participants.map((participant) => (
                    <div key={participant.id} className="relative">
                      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                        {participant.videoEnabled ? (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback className="text-white text-xl">
                                {participant.name.charAt(0)}
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
                  ))}
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
                        onClick={() => setPhase(phaseOption.key as any)}
                        data-testid={`button-phase-${phaseOption.key}`}
                      >
                        {phaseOption.label}
                      </Button>
                    ))}
                  </div>
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
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="font-medium text-muted-foreground">14:30 - Подготовка</p>
                    <p className="mt-1">Обсуждение целевого воспоминания. Пациент готов к работе.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="font-medium text-muted-foreground">14:35 - EMDR запущен</p>
                    <p className="mt-1">Скорость 3, размер 20. Пациент следует за объектом.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Settings */}
            {showSettings && (
              <Card>
                <CardHeader>
                  <CardTitle>Настройки EMDR</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Цвет объекта</label>
                    <div className="flex space-x-2">
                      {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map((color) => (
                        <button
                          key={color}
                          className="w-6 h-6 rounded-full border-2"
                          style={{ 
                            backgroundColor: color,
                            borderColor: emdrSettings.ballColor === color ? '#000' : 'transparent'
                          }}
                          onClick={() => setEmdrSettings(prev => ({ ...prev, ballColor: color }))}
                          data-testid={`button-color-${color.replace('#', '')}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Фон</label>
                    <div className="flex space-x-2">
                      {['#f8fafc', '#1e293b', '#fef3c7', '#dcfce7'].map((bg) => (
                        <button
                          key={bg}
                          className="w-6 h-6 rounded border-2"
                          style={{ 
                            backgroundColor: bg,
                            borderColor: emdrSettings.backgroundColor === bg ? '#000' : '#ccc'
                          }}
                          onClick={() => setEmdrSettings(prev => ({ ...prev, backgroundColor: bg }))}
                          data-testid={`button-background-${bg.replace('#', '')}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Направление</label>
                    <div className="flex space-x-1">
                      {[
                        { key: 'horizontal', label: '↔' },
                        { key: 'vertical', label: '↕' },
                        { key: 'diagonal', label: '↗' }
                      ].map((dir) => (
                        <Button
                          key={dir.key}
                          variant={emdrSettings.direction === dir.key ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEmdrSettings(prev => ({ ...prev, direction: dir.key as EMDRSettings['direction'] }))}
                          data-testid={`button-direction-${dir.key}`}
                        >
                          {dir.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Session Timer */}
            <Card>
              <CardHeader>
                <CardTitle>Таймер сессии</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-mono font-bold text-primary mb-2">
                    {formatTime(sessionTime)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Стандартная сессия EMDR: 60-90 минут
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}