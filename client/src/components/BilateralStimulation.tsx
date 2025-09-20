/**
 * BilateralStimulation Component
 * Reusable component for EMDR bilateral stimulation
 */

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
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
  Eye,
  Settings
} from "lucide-react";
import type { BLSConfiguration, EmotionData } from '@/../../shared/types';

export interface BilateralStimulationProps {
  onSessionComplete?: () => void;
  onMetricsUpdate?: (metrics: BLSMetrics) => void;
  emotionData?: EmotionData;
  adaptiveMode?: boolean;
  initialConfig?: Partial<BLSConfiguration>;
  showControls?: boolean;
  fullscreen?: boolean;
}

export interface BLSMetrics {
  cyclesCompleted: number;
  totalDuration: number;
  averageSpeed: number;
  patternChanges: number;
  attentionScore: number;
}

export interface BilateralStimulationRef {
  start: () => void;
  pause: () => void;
  reset: () => void;
  updateConfig: (config: Partial<BLSConfiguration>) => void;
  getMetrics: () => BLSMetrics;
}

const BilateralStimulation = forwardRef<BilateralStimulationRef, BilateralStimulationProps>(
  ({ 
    onSessionComplete, 
    onMetricsUpdate,
    emotionData,
    adaptiveMode = false,
    initialConfig,
    showControls = true,
    fullscreen = false
  }, ref) => {
    
    // State management
    const [isActive, setIsActive] = useState(false);
    const [ballPosition, setBallPosition] = useState(0);
    const [ballDirection, setBallDirection] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    
    // BLS Configuration
    const [config, setConfig] = useState<BLSConfiguration>({
      speed: initialConfig?.speed || 5,
      pattern: initialConfig?.pattern || 'horizontal',
      color: initialConfig?.color || '#3b82f6',
      size: initialConfig?.size || 20,
      soundEnabled: initialConfig?.soundEnabled ?? true,
      adaptiveMode: initialConfig?.adaptiveMode ?? adaptiveMode
    });
    
    // Metrics tracking
    const [metrics, setMetrics] = useState<BLSMetrics>({
      cyclesCompleted: 0,
      totalDuration: 0,
      averageSpeed: config.speed,
      patternChanges: 0,
      attentionScore: 1
    });
    
    // Refs
    const animationRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    
    // Expose methods to parent component
    useImperativeHandle(ref, () => ({
      start: () => startBLS(),
      pause: () => pauseBLS(),
      reset: () => resetBLS(),
      updateConfig: (newConfig: Partial<BLSConfiguration>) => {
        setConfig(prev => ({ ...prev, ...newConfig }));
      },
      getMetrics: () => metrics
    }));
    
    // Start BLS animation
    const startBLS = () => {
      if (isActive) return;
      
      setIsActive(true);
      startTimeRef.current = Date.now();
      
      if (config.soundEnabled) {
        initAudio();
      }
    };
    
    // Pause BLS
    const pauseBLS = () => {
      setIsActive(false);
      
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      
      // Update total duration
      if (startTimeRef.current) {
        const duration = Date.now() - startTimeRef.current;
        setMetrics(prev => ({
          ...prev,
          totalDuration: prev.totalDuration + duration
        }));
      }
    };
    
    // Reset BLS
    const resetBLS = () => {
      setIsActive(false);
      setBallPosition(getInitialPosition());
      setBallDirection(1);
      
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
    };
    
    // Initialize audio context for sound effects
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    
    // Play sound on direction change
    const playSound = () => {
      if (!config.soundEnabled || !audioContextRef.current) return;
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + 0.05); // 50ms beep
    };
    
    // Get initial ball position based on pattern
    const getInitialPosition = () => {
      if (!containerRef.current) return 190;
      
      const width = containerRef.current.offsetWidth;
      
      switch (config.pattern) {
        case 'horizontal':
        case 'diagonal':
          return width / 2 - config.size / 2;
        case 'vertical':
          return 190; // Center vertically
        case 'circle':
        case '3d-wave':
          return 0;
        default:
          return 190;
      }
    };
    
    // Calculate ball position based on pattern
    const calculatePosition = (progress: number): { x: number; y: number } => {
      if (!containerRef.current) return { x: 0, y: 0 };
      
      const width = containerRef.current.offsetWidth - config.size;
      const height = 384 - config.size; // Container height minus ball size
      
      switch (config.pattern) {
        case 'horizontal':
          return { 
            x: progress * width, 
            y: height / 2 
          };
        
        case 'vertical':
          return { 
            x: width / 2, 
            y: progress * height 
          };
        
        case 'diagonal':
          return { 
            x: progress * width, 
            y: progress * height 
          };
        
        case 'circle':
          const angle = progress * Math.PI * 2;
          const centerX = width / 2;
          const centerY = height / 2;
          const radius = Math.min(width, height) * 0.4;
          return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          };
        
        case '3d-wave':
          const waveX = progress * width;
          const waveY = (height / 2) + Math.sin(progress * Math.PI * 4) * (height * 0.3);
          return { x: waveX, y: waveY };
        
        default:
          return { x: 0, y: 0 };
      }
    };
    
    // Animation loop
    useEffect(() => {
      if (isActive) {
        let progress = 0;
        let direction = 1;
        let lastTimestamp = performance.now();
        
        const animate = (timestamp: number) => {
          const deltaTime = timestamp - lastTimestamp;
          lastTimestamp = timestamp;
          
          // Update progress based on speed
          const speedFactor = config.speed / 500;
          progress += direction * speedFactor * (deltaTime / 16);
          
          // Handle bounds and direction change
          if (progress >= 1 || progress <= 0) {
            direction *= -1;
            progress = Math.max(0, Math.min(1, progress));
            
            // Play sound on bounce
            playSound();
            
            // Count cycles
            if (progress === 0) {
              setMetrics(prev => ({
                ...prev,
                cyclesCompleted: prev.cyclesCompleted + 1
              }));
            }
          }
          
          // Calculate position
          const position = calculatePosition(Math.abs(progress));
          setBallPosition(position.x);
          
          // Continue animation
          if (isActive) {
            animationRef.current = requestAnimationFrame(animate);
          }
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
    }, [isActive, config]);
    
    // Adaptive mode - adjust based on emotion data
    useEffect(() => {
      if (config.adaptiveMode && emotionData) {
        // Adjust speed based on arousal
        const targetSpeed = emotionData.arousal > 0.7 
          ? 3 // Slow for high arousal
          : emotionData.arousal < 0.3 
          ? 7 // Moderate for low arousal
          : 5; // Normal speed
        
        // Adjust color based on valence
        const targetColor = emotionData.valence < 0.3 
          ? '#10b981' // Green for negative emotions
          : emotionData.valence > 0.7 
          ? '#8b5cf6' // Purple for positive
          : '#3b82f6'; // Blue for neutral
        
        // Apply gradual changes
        if (targetSpeed !== config.speed || targetColor !== config.color) {
          setConfig(prev => ({
            ...prev,
            speed: targetSpeed,
            color: targetColor
          }));
          
          setMetrics(prev => ({
            ...prev,
            patternChanges: prev.patternChanges + 1
          }));
        }
      }
    }, [emotionData, config.adaptiveMode]);
    
    // Update metrics callback
    useEffect(() => {
      if (onMetricsUpdate) {
        onMetricsUpdate(metrics);
      }
    }, [metrics, onMetricsUpdate]);
    
    // Get shape icon component
    const getShapeIcon = (shape: string) => {
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
    
    // Render component
    const containerClass = fullscreen 
      ? "fixed inset-0 bg-black z-50"
      : "relative";
    
    return (
      <Card className={`overflow-hidden ${fullscreen ? 'border-0 rounded-none' : ''}`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Билатеральная стимуляция</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={isActive ? "default" : "outline"}
                onClick={() => isActive ? pauseBLS() : startBLS()}
                data-testid="button-toggle-bls"
              >
                {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isActive ? 'Пауза' : 'Начать'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetBLS}
                data-testid="button-reset-bls"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              {showControls && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  data-testid="button-toggle-settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div 
            ref={containerRef}
            className={`${containerClass} w-full h-96 flex items-center justify-center`}
            style={{ backgroundColor: fullscreen ? '#000' : config.pattern === '3d-wave' ? '#1a1a2e' : '#f8fafc' }}
          >
            {/* Stimulation Ball */}
            <div
              className="absolute transition-all duration-100 rounded-full flex items-center justify-center"
              style={{
                width: config.size + 'px',
                height: config.size + 'px',
                backgroundColor: config.color,
                left: ballPosition + 'px',
                top: '50%',
                transform: 'translateY(-50%)',
                boxShadow: isActive ? `0 0 20px ${config.color}80` : 'none'
              }}
              data-testid="bls-ball"
            />
            
            {/* Center guideline */}
            {config.pattern === 'horizontal' && (
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border opacity-30 transform -translate-x-1/2" />
            )}
            
            {/* Instructions overlay */}
            {!isActive && (
              <div className="absolute inset-0 bg-black/5 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Eye className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground font-medium">Следите глазами за движущимся объектом</p>
                  <p className="text-sm text-muted-foreground mt-1">Нажмите "Начать" для запуска стимуляции</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Controls */}
          {showControls && (
            <div className="p-6 border-t border-border bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Speed control */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium w-20">Скорость:</span>
                  <Slider
                    value={[config.speed]}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, speed: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="flex-1"
                    disabled={isActive}
                    data-testid="slider-speed"
                  />
                  <span className="text-xs text-muted-foreground w-8">{config.speed}</span>
                </div>
                
                {/* Size control */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium w-20">Размер:</span>
                  <Slider
                    value={[config.size]}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, size: value[0] }))}
                    max={40}
                    min={10}
                    step={2}
                    className="flex-1"
                    disabled={isActive}
                    data-testid="slider-size"
                  />
                  <span className="text-xs text-muted-foreground w-8">{config.size}px</span>
                </div>
                
                {/* Sound toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Звук:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfig(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                    data-testid="button-toggle-sound"
                  >
                    {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              {/* Pattern selection */}
              {showSettings && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Паттерн движения:</p>
                    <div className="flex space-x-2">
                      {(['horizontal', 'vertical', 'diagonal', 'circle', '3d-wave'] as const).map((pattern) => (
                        <Button
                          key={pattern}
                          variant={config.pattern === pattern ? "default" : "outline"}
                          size="sm"
                          onClick={() => setConfig(prev => ({ ...prev, pattern }))}
                          disabled={isActive}
                          data-testid={`button-pattern-${pattern}`}
                        >
                          {pattern === 'horizontal' && '↔'}
                          {pattern === 'vertical' && '↕'}
                          {pattern === 'diagonal' && '⤢'}
                          {pattern === 'circle' && '○'}
                          {pattern === '3d-wave' && '∿'}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Цвет объекта:</p>
                    <div className="flex space-x-2">
                      {['#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b'].map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded-full border-2"
                          style={{ 
                            backgroundColor: color,
                            borderColor: config.color === color ? '#000' : 'transparent'
                          }}
                          onClick={() => setConfig(prev => ({ ...prev, color }))}
                          disabled={isActive}
                          data-testid={`button-color-${color.replace('#', '')}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Adaptive mode toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Адаптивный режим:</span>
                    <Button
                      variant={config.adaptiveMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setConfig(prev => ({ ...prev, adaptiveMode: !prev.adaptiveMode }))}
                      data-testid="button-toggle-adaptive"
                    >
                      {config.adaptiveMode ? 'Включен' : 'Выключен'}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Metrics display */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Циклов:</span>
                    <span className="ml-2 font-medium" data-testid="metric-cycles">
                      {metrics.cyclesCompleted}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Время:</span>
                    <span className="ml-2 font-medium" data-testid="metric-duration">
                      {Math.floor(metrics.totalDuration / 1000)}с
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Ср. скорость:</span>
                    <span className="ml-2 font-medium" data-testid="metric-avg-speed">
                      {metrics.averageSpeed.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Внимание:</span>
                    <span className="ml-2 font-medium" data-testid="metric-attention">
                      {(metrics.attentionScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

BilateralStimulation.displayName = 'BilateralStimulation';

export default BilateralStimulation;