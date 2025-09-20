import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff,
  Phone,
  Settings,
  Clock,
  Square
} from "lucide-react";
import BilateralStimulation, { BilateralStimulationRef } from "./BilateralStimulation";
import type { SessionParticipant, EMDRPhase } from '@/../../shared/types';

// Types are now imported from shared/types.ts

export default function EMDRSession() {
  const [sessionActive, setSessionActive] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [phase, setPhase] = useState<EMDRPhase>('preparation');
  
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

  // Handle BLS metrics updates
  const handleBLSMetricsUpdate = (metrics: any) => {
    // TODO: Send metrics to backend for analysis
    console.log('BLS Metrics:', metrics);
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
            </div>
            
            <div className="flex items-center space-x-2">
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
              adaptiveMode={false}
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