/**
 * EmotionDisplay Component
 * Real-time emotion visualization with circumplex model
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Video,
  VideoOff,
  Activity,
  TrendingUp,
  TrendingDown,
  Brain,
  Eye,
  Heart,
  Zap
} from 'lucide-react';
import { faceRecognition } from '@/services/emotion/faceRecognition';
import CircumplexModel from './CircumplexModel';
import type { EmotionData } from '@/../../shared/types';

interface EmotionDisplayProps {
  onEmotionUpdate?: (emotions: EmotionData) => void;
  isActive?: boolean;
  showCircumplex?: boolean;
  showTopEmotions?: boolean;
  showBasicEmotions?: boolean;
}

export default function EmotionDisplay({
  onEmotionUpdate,
  isActive = true,
  showCircumplex = true,
  showTopEmotions = true,
  showBasicEmotions = true
}: EmotionDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isVideoStarted, setIsVideoStarted] = useState(false);
  const [currentEmotions, setCurrentEmotions] = useState<EmotionData | null>(null);
  const [attentionLevel, setAttentionLevel] = useState(0);
  const [emotionHistory, setEmotionHistory] = useState<EmotionData[]>([]);
  
  // Start video and emotion recognition
  useEffect(() => {
    if (isActive && videoRef.current && !isVideoStarted) {
      startEmotionRecognition();
    }
    
    return () => {
      if (isVideoStarted) {
        stopEmotionRecognition();
      }
    };
  }, [isActive, isVideoStarted]);

  const startEmotionRecognition = async () => {
    if (!videoRef.current) return;
    
    try {
      await faceRecognition.initialize(videoRef.current);
      setIsVideoStarted(true);
      
      // Start continuous emotion recognition
      faceRecognition.startRecognition((emotions) => {
        setCurrentEmotions(emotions);
        
        // Update emotion history (keep last 30 seconds at 3fps)
        setEmotionHistory(prev => {
          const updated = [...prev, emotions];
          return updated.slice(-90); // Keep last 90 samples
        });
        
        // Calculate attention level periodically
        faceRecognition.calculateAttentionLevel().then(level => {
          setAttentionLevel(level);
        });
        
        // Notify parent component
        if (onEmotionUpdate) {
          onEmotionUpdate(emotions);
        }
      });
    } catch (error) {
      console.error('Failed to start emotion recognition:', error);
    }
  };

  const stopEmotionRecognition = () => {
    faceRecognition.stopRecognition();
    faceRecognition.dispose();
    setIsVideoStarted(false);
  };

  // Get top N affects sorted by intensity percentage
  const getTopAffects = (affects: Record<string, number>, n: number = 5) => {
    return Object.entries(affects)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .filter(([_, value]) => value > 5); // Only show affects above 5% intensity
  };

  // Calculate emotion trend
  const getEmotionTrend = () => {
    if (emotionHistory.length < 10) return 'stable';
    
    const recent = emotionHistory.slice(-10);
    const avgRecentValence = recent.reduce((sum, e) => sum + e.valence, 0) / recent.length;
    const avgRecentArousal = recent.reduce((sum, e) => sum + e.arousal, 0) / recent.length;
    
    const older = emotionHistory.slice(-20, -10);
    const avgOlderValence = older.reduce((sum, e) => sum + e.valence, 0) / older.length;
    const avgOlderArousal = older.reduce((sum, e) => sum + e.arousal, 0) / older.length;
    
    const valenceChange = avgRecentValence - avgOlderValence;
    const arousalChange = avgRecentArousal - avgOlderArousal;
    
    if (valenceChange > 0.1) return 'improving';
    if (valenceChange < -0.1) return 'declining';
    if (Math.abs(arousalChange) > 0.2) return 'fluctuating';
    return 'stable';
  };

  // Draw circumplex visualization
  useEffect(() => {
    if (!canvasRef.current || !currentEmotions || !showCircumplex) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    
    // X-axis (Valence)
    ctx.beginPath();
    ctx.moveTo(10, canvas.height / 2);
    ctx.lineTo(canvas.width - 10, canvas.height / 2);
    ctx.stroke();
    
    // Y-axis (Arousal)
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 10);
    ctx.lineTo(canvas.width / 2, canvas.height - 10);
    ctx.stroke();
    
    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter';
    ctx.textAlign = 'center';
    
    // Valence labels
    ctx.fillText('Negative', 30, canvas.height / 2 - 5);
    ctx.fillText('Positive', canvas.width - 30, canvas.height / 2 - 5);
    
    // Arousal labels
    ctx.save();
    ctx.translate(canvas.width / 2 + 5, 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('High', 0, 0);
    ctx.restore();
    
    ctx.save();
    ctx.translate(canvas.width / 2 + 5, canvas.height - 20);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Low', 0, 0);
    ctx.restore();
    
    // Draw quadrant labels
    ctx.fillStyle = '#d1d5db';
    ctx.font = '10px Inter';
    ctx.fillText('Excited', canvas.width * 0.75, canvas.height * 0.25);
    ctx.fillText('Calm', canvas.width * 0.75, canvas.height * 0.75);
    ctx.fillText('Sad', canvas.width * 0.25, canvas.height * 0.75);
    ctx.fillText('Stressed', canvas.width * 0.25, canvas.height * 0.25);
    
    // Draw current emotion point
    const x = currentEmotions.valence * (canvas.width - 20) + 10;
    const y = (1 - currentEmotions.arousal) * (canvas.height - 20) + 10;
    
    // Draw trail from history
    if (emotionHistory.length > 1) {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      emotionHistory.slice(-20).forEach((emotion, i) => {
        const hx = emotion.valence * (canvas.width - 20) + 10;
        const hy = (1 - emotion.arousal) * (canvas.height - 20) + 10;
        
        if (i === 0) {
          ctx.moveTo(hx, hy);
        } else {
          ctx.lineTo(hx, hy);
        }
      });
      
      ctx.stroke();
    }
    
    // Current point
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Pulse animation
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.stroke();
  }, [currentEmotions, emotionHistory, showCircumplex]);

  const trend = getEmotionTrend();

  return (
    <div className="space-y-4">
      {/* Video Feed (Hidden) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="hidden"
        data-testid="emotion-video-feed"
      />
      
      {/* Main Emotion Display Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-5 h-5" />
              <span>Анализ эмоций</span>
            </div>
            <div className="flex items-center space-x-2">
              {isVideoStarted ? (
                <Badge variant="default" className="bg-green-500">
                  <Video className="w-3 h-3 mr-1" />
                  Активно
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <VideoOff className="w-3 h-3 mr-1" />
                  Неактивно
                </Badge>
              )}
              {trend === 'improving' && (
                <Badge variant="outline" className="text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Улучшение
                </Badge>
              )}
              {trend === 'declining' && (
                <Badge variant="outline" className="text-orange-600">
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Снижение
                </Badge>
              )}
              {trend === 'stable' && (
                <Badge variant="outline">
                  <Activity className="w-3 h-3 mr-1" />
                  Стабильно
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentEmotions ? (
            <>
              {/* Arousal and Valence Meters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Zap className="w-3 h-3 mr-1" />
                      Возбуждение
                    </span>
                    <span className="font-medium">
                      {Math.round(currentEmotions.arousal * 100)}%
                    </span>
                  </div>
                  <Progress value={currentEmotions.arousal * 100} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      Валентность
                    </span>
                    <span className="font-medium">
                      {Math.round(currentEmotions.valence * 100)}%
                    </span>
                  </div>
                  <Progress value={currentEmotions.valence * 100} className="h-2" />
                </div>
              </div>
              
              {/* Attention Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center">
                    <Eye className="w-3 h-3 mr-1" />
                    Уровень внимания
                  </span>
                  <span className="font-medium">
                    {Math.round(attentionLevel * 100)}%
                  </span>
                </div>
                <Progress value={attentionLevel * 100} className="h-2" />
              </div>
              
              <Separator />
              
              {/* Circumplex Visualization */}
              {showCircumplex && currentEmotions && (
                <div className="mt-4">
                  <CircumplexModel
                    emotionData={currentEmotions}
                    showLabels={true}
                    showGrid={true}
                    animated={true}
                    interactive={true}
                    fullscreen={false}
                  />
                </div>
              )}
              
              {/* Top Affects */}
              {showTopEmotions && currentEmotions.affects && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Топ-5 эмоциональных состояний (из 98)</h4>
                  <div className="space-y-2">
                    {getTopAffects(currentEmotions.affects).length > 0 ? (
                      getTopAffects(currentEmotions.affects).map(([name, value]) => {
                        // Определяем цвет в зависимости от интенсивности
                        const getEmotionColor = (intensity: number) => {
                          if (intensity > 70) return 'text-red-600';
                          if (intensity > 40) return 'text-orange-600';
                          if (intensity > 20) return 'text-yellow-600';
                          return 'text-muted-foreground';
                        };
                        
                        return (
                          <div key={name} className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${getEmotionColor(value)}`}>
                              {name}
                            </span>
                            <div className="flex items-center space-x-2">
                              <Progress 
                                value={value} 
                                className="w-24 h-2" 
                              />
                              <span className="text-xs font-bold w-12 text-right">
                                {Math.round(value)}%
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-muted-foreground">Определяется...</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Basic Emotions */}
              {showBasicEmotions && currentEmotions.basicEmotions && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Базовые эмоции Экмана</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(currentEmotions.basicEmotions).map(([emotion, value]) => (
                        <div key={emotion} className="flex items-center justify-between">
                          <span className="text-xs capitalize">{emotion}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round((value as number) * 100)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ожидание данных об эмоциях...</p>
              {!isVideoStarted && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={startEmotionRecognition}
                  data-testid="button-start-emotion"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Начать анализ
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}