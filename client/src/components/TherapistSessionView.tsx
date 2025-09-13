import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  FileText,
  Save,
  User,
  Zap,
  Brain,
  Eye,
  Timer,
  Target,
  CheckCircle2
} from "lucide-react";
import Header from "./Header";

export default function TherapistSessionView() {
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
  const [currentInstruction, setCurrentInstruction] = useState('');
  
  // Session Notes and Protocol
  const [sessionNotes, setSessionNotes] = useState('');
  const [targetMemory, setTargetMemory] = useState('');
  const [negativeBeliefs, setNegativeBeliefs] = useState('');
  const [positiveBeliefs, setPositiveBeliefs] = useState('');
  const [emotionRating, setEmotionRating] = useState([5]);
  const [bodyActivation, setBodyActivation] = useState('');
  const [validityRating, setValidityRating] = useState([4]);
  const [currentSet, setCurrentSet] = useState(1);
  const [totalSets, setTotalSets] = useState(0);
  
  // Mock user data
  const user = {
    name: "Доктор Иванова",
    email: "dr.ivanova@email.com",
    role: 'therapist' as const,
    avatar: ""
  };
  
  // Mock patient data
  const patient = {
    name: "Анна Петрова",
    status: "Онлайн",
    avatar: "",
    previousSessions: 5,
    diagnosis: "ПТСР, тревожное расстройство"
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
          if (isEMDRActive) {
            setTotalSets(prev => prev + 0.5); // Half set per direction change
          }
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
            ctx.beginPath();
            ctx.arc(centerX - emdrSettings.ballSize / 4, centerY - emdrSettings.ballSize / 4, emdrSettings.ballSize / 4, 0, 2 * Math.PI);
            ctx.arc(centerX + emdrSettings.ballSize / 4, centerY - emdrSettings.ballSize / 4, emdrSettings.ballSize / 4, 0, 2 * Math.PI);
            ctx.fill();
            break;
          case 'star':
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

  const nextPhase = () => {
    const phases: typeof sessionPhase[] = ['waiting', 'preparation', 'desensitization', 'installation', 'body-scan', 'closure'];
    const currentIndex = phases.indexOf(sessionPhase);
    if (currentIndex < phases.length - 1) {
      setSessionPhase(phases[currentIndex + 1]);
    }
  };

  const sendInstruction = () => {
    // In real app, this would send instruction to patient's interface
    console.log('Sending instruction:', currentInstruction);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onThemeToggle={() => setIsDark(!isDark)} isDark={isDark} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Session Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">EMDR Сессия - Управление</h1>
              <p className="text-muted-foreground">Сессия с пациентом {patient.name}</p>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4">
            {/* Patient Video */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Пациент: {patient.name}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
                      {patient.status}
                    </Badge>
                    <Badge variant="outline">
                      Сессия {patient.previousSessions + 1}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                  {isConnected ? (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center text-white">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <span className="text-2xl font-bold">{patient.name.charAt(0)}</span>
                        </div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm opacity-75">{patient.diagnosis}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <User className="w-12 h-12 mx-auto mb-2" />
                        <p>Ожидание подключения пациента...</p>
                      </div>
                    </div>
                  )}
                  
                  {isConnected && (
                    <div className="absolute bottom-4 left-4">
                      <Badge className="bg-black/50 text-white">{patient.name}</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* EMDR Control Panel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">EMDR Управление</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-sm">
                      Сет: {Math.floor(totalSets)}/{Math.floor(totalSets) + 10}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* EMDR Canvas */}
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
                          <p className="text-sm">Настройте параметры и нажмите "Старт"</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* EMDR Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Скорость: {emdrSettings.speed}</Label>
                      <Slider
                        value={[emdrSettings.speed]}
                        onValueChange={([value]) => setEmdrSettings(prev => ({ ...prev, speed: value }))}
                        max={10}
                        min={1}
                        step={1}
                        disabled={isEMDRActive}
                        data-testid="slider-speed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Размер: {emdrSettings.ballSize}px</Label>
                      <Slider
                        value={[emdrSettings.ballSize]}
                        onValueChange={([value]) => setEmdrSettings(prev => ({ ...prev, ballSize: value }))}
                        max={40}
                        min={10}
                        step={2}
                        disabled={isEMDRActive}
                        data-testid="slider-size"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Форма</Label>
                      <Select 
                        value={emdrSettings.shape} 
                        onValueChange={(value) => setEmdrSettings(prev => ({ ...prev, shape: value }))}
                        disabled={isEMDRActive}
                      >
                        <SelectTrigger data-testid="select-shape">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">Круг</SelectItem>
                          <SelectItem value="square">Квадрат</SelectItem>
                          <SelectItem value="heart">Сердце</SelectItem>
                          <SelectItem value="star">Звезда</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Цвет объекта</Label>
                      <div className="flex space-x-2">
                        {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 ${
                              emdrSettings.ballColor === color ? 'border-foreground' : 'border-muted'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setEmdrSettings(prev => ({ ...prev, ballColor: color }))}
                            disabled={isEMDRActive}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center space-x-4">
                    {!isEMDRActive ? (
                      <Button 
                        onClick={() => setIsEMDRActive(true)}
                        disabled={!isConnected}
                        data-testid="button-start-emdr"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Начать EMDR
                      </Button>
                    ) : (
                      <>
                        <Button 
                          variant="outline"
                          onClick={() => setIsEMDRActive(false)}
                          data-testid="button-pause-emdr"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Пауза
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setIsEMDRActive(false);
                            setTotalSets(0);
                          }}
                          data-testid="button-reset-emdr"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Сброс
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Protocol */}
            <Tabs defaultValue="assessment" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="assessment" data-testid="tab-assessment">
                  <Target className="w-4 h-4 mr-2" />
                  Оценка
                </TabsTrigger>
                <TabsTrigger value="processing" data-testid="tab-processing">
                  <Brain className="w-4 h-4 mr-2" />
                  Обработка
                </TabsTrigger>
                <TabsTrigger value="notes" data-testid="tab-notes">
                  <FileText className="w-4 h-4 mr-2" />
                  Заметки
                </TabsTrigger>
                <TabsTrigger value="instructions" data-testid="tab-instructions">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Инструкции
                </TabsTrigger>
              </TabsList>

              <TabsContent value="assessment" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Оценка травматической памяти</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetMemory">Целевая память</Label>
                      <Textarea
                        id="targetMemory"
                        placeholder="Опишите травматическую память или ситуацию..."
                        value={targetMemory}
                        onChange={(e) => setTargetMemory(e.target.value)}
                        data-testid="textarea-target-memory"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="negativeBeliefs">Негативные убеждения</Label>
                        <Textarea
                          id="negativeBeliefs"
                          placeholder="Я беспомощен, Это моя вина..."
                          value={negativeBeliefs}
                          onChange={(e) => setNegativeBeliefs(e.target.value)}
                          data-testid="textarea-negative-beliefs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="positiveBeliefs">Позитивные убеждения</Label>
                        <Textarea
                          id="positiveBeliefs"
                          placeholder="Я в безопасности, Я справился..."
                          value={positiveBeliefs}
                          onChange={(e) => setPositiveBeliefs(e.target.value)}
                          data-testid="textarea-positive-beliefs"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>SUD (дистресс): {emotionRating[0]}/10</Label>
                        <Slider
                          value={emotionRating}
                          onValueChange={setEmotionRating}
                          max={10}
                          min={0}
                          step={1}
                          data-testid="slider-emotion"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>VoC (достоверность): {validityRating[0]}/7</Label>
                        <Slider
                          value={validityRating}
                          onValueChange={setValidityRating}
                          max={7}
                          min={1}
                          step={1}
                          data-testid="slider-validity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bodyActivation">Активация в теле</Label>
                        <Input
                          id="bodyActivation"
                          placeholder="Грудь, живот, горло..."
                          value={bodyActivation}
                          onChange={(e) => setBodyActivation(e.target.value)}
                          data-testid="input-body-activation"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="processing" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Контроль обработки</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <Zap className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                        <p className="font-medium">Общие сеты</p>
                        <p className="text-2xl font-bold">{Math.floor(totalSets)}</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Timer className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <p className="font-medium">Текущий сет</p>
                        <p className="text-2xl font-bold">{currentSet}</p>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Activity className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <p className="font-medium">Активность</p>
                        <p className="text-lg font-medium">{isEMDRActive ? 'Активна' : 'Пауза'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-center space-x-4">
                        <Button 
                          onClick={nextPhase}
                          disabled={!isConnected}
                          data-testid="button-next-phase"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Следующая фаза
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setCurrentSet(prev => prev + 1)}
                          data-testid="button-next-set"
                        >
                          Новый сет
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Заметки сессии</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Записи о ходе сессии, реакции пациента, важные наблюдения..."
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        className="min-h-[200px]"
                        data-testid="textarea-session-notes"
                      />
                      <Button data-testid="button-save-notes">
                        <Save className="w-4 h-4 mr-2" />
                        Сохранить заметки
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Инструкции пациенту</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Введите инструкцию для пациента..."
                        value={currentInstruction}
                        onChange={(e) => setCurrentInstruction(e.target.value)}
                        data-testid="textarea-instruction"
                      />
                      <div className="flex space-x-2">
                        <Button 
                          onClick={sendInstruction}
                          data-testid="button-send-instruction"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Отправить инструкцию
                        </Button>
                        <Button variant="outline" data-testid="button-preset-instructions">
                          Шаблоны
                        </Button>
                      </div>
                      
                      {/* Quick instruction templates */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentInstruction('Следите глазами за движущимся объектом')}
                        >
                          Следить за объектом
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentInstruction('Сделайте глубокий вдох и расслабьтесь')}
                        >
                          Расслабиться
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentInstruction('Что приходит на ум сейчас?')}
                        >
                          Что приходит на ум?
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCurrentInstruction('Оцените уровень дискомфорта от 0 до 10')}
                        >
                          Оценить дискомфорт
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Control Panel */}
          <div className="space-y-4">
            {/* Connection Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Статус сессии</CardTitle>
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
                    data-testid="button-start-session"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Начать сессию
                  </Button>
                ) : (
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={() => setIsConnected(false)}
                    data-testid="button-end-session"
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
                <CardTitle className="text-lg">Управление медиа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant={videoEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setVideoEnabled(!videoEnabled)}
                    data-testid="button-toggle-video"
                  >
                    {videoEnabled ? <Video className="w-4 h-4 mr-2" /> : <VideoOff className="w-4 h-4 mr-2" />}
                    {videoEnabled ? 'Камера ВКЛ' : 'Камера ВЫКЛ'}
                  </Button>
                  <Button
                    variant={audioEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    data-testid="button-toggle-audio"
                  >
                    {audioEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                    {audioEnabled ? 'Микрофон ВКЛ' : 'Микрофон ВЫКЛ'}
                  </Button>
                  <Button
                    variant={soundEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    data-testid="button-toggle-sound"
                  >
                    {soundEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                    {soundEnabled ? 'Звук ВКЛ' : 'Звук ВЫКЛ'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Patient Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Информация о пациенте</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Имя:</span>
                    <span className="font-medium">{patient.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Предыдущие сессии:</span>
                    <span className="font-medium">{patient.previousSessions}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">Диагноз:</span>
                    <p className="text-xs">{patient.diagnosis}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session Progress */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Прогресс</CardTitle>
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
                    <span>Время:</span>
                    <span>{formatTime(sessionDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Сеты EMDR:</span>
                    <span>{Math.floor(totalSets)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Controls */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-600">Экстренное управление</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full text-orange-600 border-orange-200"
                  data-testid="button-emergency-pause"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Экстренная пауза
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  data-testid="button-emergency-stop"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Прервать сессию
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}