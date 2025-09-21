/**
 * Revolutionary 3D BilateralStimulation Component
 * Advanced EMDR bilateral stimulation with 3D patterns, adaptive AI, and therapeutic audio
 * Maintains full backward compatibility with legacy 2D system
 */

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Settings,
  Cpu,
  Headphones,
  Vibrate,
  Palette,
  Gauge,
  Brain
} from "lucide-react";
import type { 
  BLSConfiguration, 
  EmotionData, 
  BLSPattern,
  DeviceCapabilities,
  EMDRPhase 
} from '@/../../shared/types';

// Revolutionary 3D BLS System Imports
import { deviceCapabilities } from '@/services/bls/deviceCapabilities';
import { AudioEngine } from '@/services/bls/audioEngine';
import { HapticsEngine } from '@/services/bls/hapticsEngine';
import { Renderer3D, Pattern3DPosition } from '@/services/bls/renderer3D';
import { AdaptiveController } from '@/services/bls/adaptiveController';
import { TransitionManager } from '@/services/bls/transitionManager';

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
    
    // Revolutionary 3D BLS Configuration with backward compatibility
    const [config, setConfig] = useState<BLSConfiguration>({
      // Core settings (backward compatible)
      speed: initialConfig?.speed || 5,
      pattern: initialConfig?.pattern || 'horizontal',
      color: initialConfig?.color || '#3b82f6',
      size: initialConfig?.size || 20,
      soundEnabled: initialConfig?.soundEnabled ?? true, // Legacy compatibility
      adaptiveMode: initialConfig?.adaptiveMode ?? adaptiveMode,
      
      // Revolutionary 3D Systems
      audio: {
        enabled: initialConfig?.soundEnabled ?? true,
        audioType: 'binaural-beats',
        binauralFrequency: 10,
        binauralType: 'alpha',
        spatialAudio: true,
        panIntensity: 0.6,
        volume: 0.5,
        reverbEnabled: false,
        filterEnabled: false
      },
      haptics: {
        enabled: false,
        pattern: 'pulse',
        intensity: 0.5,
        syncWithMovement: true,
        syncWithAudio: true,
        duration: 150,
        interval: 300
      },
      rendering3D: {
        enabled: true, // Will fallback based on device capabilities
        antialias: true,
        shadows: false,
        lighting: 'therapeutic',
        cameraType: 'perspective',
        fieldOfView: 75,
        cameraDistance: 8,
        bloomEffect: true,
        blurBackground: false,
        particleEffects: false
      },
      transitions: {
        enabled: true,
        duration: 2000,
        easing: 'therapeutic',
        morphing: true,
        crossfade: true
      },
      
      // Adaptive Intelligence
      emotionMapping: true,
      hysteresisEnabled: true,
      
      // Therapeutic Settings
      therapeuticMode: 'standard',
      sessionPhase: 'preparation',
      
      // Additional properties for enhanced config
      secondaryColor: undefined
    });
    
    // Metrics tracking
    const [metrics, setMetrics] = useState<BLSMetrics>({
      cyclesCompleted: 0,
      totalDuration: 0,
      averageSpeed: config.speed,
      patternChanges: 0,
      attentionScore: 1
    });
    
    // Revolutionary 3D System State
    const [deviceCaps, setDeviceCaps] = useState<DeviceCapabilities | null>(null);
    const [is3DMode, setIs3DMode] = useState(true);
    const [systemStatus, setSystemStatus] = useState<'initializing' | 'ready' | 'fallback' | 'error'>('initializing');
    const [adaptiveRecommendations, setAdaptiveRecommendations] = useState<string[]>([]);
    const [currentPosition, setCurrentPosition] = useState<Pattern3DPosition | null>(null);
    
    // Refs for 3D Systems
    const containerRef = useRef<HTMLDivElement>(null);
    const canvas3DRef = useRef<HTMLDivElement>(null);
    const renderer3DRef = useRef<Renderer3D | null>(null);
    const audioEngineRef = useRef<AudioEngine | null>(null);
    const hapticsEngineRef = useRef<HapticsEngine | null>(null);
    const adaptiveControllerRef = useRef<AdaptiveController | null>(null);
    const transitionManagerRef = useRef<TransitionManager | null>(null);
    
    // Legacy 2D Animation Refs (for fallback)
    const animationRef = useRef<number>();
    const startTimeRef = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    
    // Initialize Revolutionary 3D Systems
    useEffect(() => {
      initializeRevolutionary3DSystems();
      return () => {
        cleanup3DSystems();
      };
    }, []);
    
    // Revolutionary 3D System Initialization
    const initializeRevolutionary3DSystems = async () => {
      try {
        setSystemStatus('initializing');
        
        // 1. Detect device capabilities
        const caps = await deviceCapabilities.detect();
        setDeviceCaps(caps);
        
        // 2. Determine if 3D mode is viable
        const use3D = caps.webgl && config.rendering3D.enabled && deviceCapabilities.supportsAdvanced3D();
        setIs3DMode(use3D);
        
        if (use3D && canvas3DRef.current) {
          // 3. Initialize 3D Renderer
          renderer3DRef.current = new Renderer3D(canvas3DRef.current, config.rendering3D);
          renderer3DRef.current.setCallbacks({
            onDirectionChange: handleDirectionChange,
            onPatternComplete: handlePatternComplete,
            onPositionUpdate: handlePositionUpdate
          });
        }
        
        // 4. Initialize Advanced Audio Engine
        if (caps.webaudio) {
          audioEngineRef.current = new AudioEngine();
          const audioInitialized = await audioEngineRef.current.initialize();
          if (!audioInitialized) {
            console.warn('Advanced audio initialization failed, using fallback');
          }
        }
        
        // 5. Initialize Haptics Engine
        if (caps.vibration) {
          hapticsEngineRef.current = new HapticsEngine();
          hapticsEngineRef.current.initialize();
        }
        
        // 6. Initialize Adaptive Controller with 98 emotional states
        adaptiveControllerRef.current = new AdaptiveController(config);
        
        // 7. Initialize Transition Manager
        transitionManagerRef.current = new TransitionManager();
        if (audioEngineRef.current) {
          transitionManagerRef.current.setAudioEngine(audioEngineRef.current);
        }
        transitionManagerRef.current.setCallbacks({
          onTransitionComplete: handleTransitionComplete
        });
        
        setSystemStatus('ready');
        console.log('🚀 Revolutionary 3D BLS System initialized successfully!');
        console.log('Features:', {
          '3D Rendering': use3D,
          'Advanced Audio': !!audioEngineRef.current,
          'Haptic Feedback': !!hapticsEngineRef.current,
          'AI Adaptation': !!adaptiveControllerRef.current,
          'Smooth Transitions': !!transitionManagerRef.current
        });
        
      } catch (error) {
        console.error('Failed to initialize 3D BLS system:', error);
        setSystemStatus('fallback');
        setIs3DMode(false);
      }
    };
    
    // Cleanup 3D Systems
    const cleanup3DSystems = () => {
      renderer3DRef.current?.dispose();
      audioEngineRef.current?.dispose();
      hapticsEngineRef.current?.dispose();
      transitionManagerRef.current?.dispose();
    };
    
    // Expose methods to parent component (Enhanced API)
    useImperativeHandle(ref, () => ({
      start: () => startBLS(),
      pause: () => pauseBLS(),
      reset: () => resetBLS(),
      updateConfig: (newConfig: Partial<BLSConfiguration>) => {
        updateConfigurationWithTransition(newConfig);
      },
      getMetrics: () => metrics,
      
      // Revolutionary 3D API Extensions
      get3DCapabilities: () => deviceCaps,
      toggleMode: () => setIs3DMode(!is3DMode),
      getAdaptiveRecommendations: () => adaptiveRecommendations,
      forceAdaptation: (emotionData: EmotionData) => processAdaptiveResponse(emotionData),
      getCurrentPosition: () => currentPosition
    }));
    
    // Revolutionary Start BLS - 3D + 2D Fallback
    const startBLS = async () => {
      if (isActive) return;
      
      setIsActive(true);
      startTimeRef.current = Date.now();
      
      try {
        if (is3DMode && renderer3DRef.current) {
          // Start 3D Animation
          renderer3DRef.current.start(config.pattern, config.speed);
          
          // Start Advanced Audio
          if (audioEngineRef.current && config.audio.enabled) {
            await audioEngineRef.current.startAudio(config.audio);
          }
          
          // Start Haptics
          if (hapticsEngineRef.current && config.haptics.enabled) {
            hapticsEngineRef.current.start(config.haptics);
          }
        } else {
          // Fallback to 2D animation
          start2DFallback();
        }
        
        console.log(`🎯 BLS Started in ${is3DMode ? '3D' : '2D fallback'} mode`);
      } catch (error) {
        console.error('Failed to start BLS:', error);
        // Fallback to 2D if 3D fails
        setIs3DMode(false);
        start2DFallback();
      }
    };
    
    // 2D Fallback Animation (Legacy)
    const start2DFallback = () => {
      if (config.soundEnabled || config.audio.enabled) {
        initLegacyAudio();
      }
      // Start legacy 2D animation loop
      animate2DFallback();
    };
    
    // Revolutionary Pause BLS - All Systems
    const pauseBLS = () => {
      setIsActive(false);
      
      // Stop 3D Systems
      if (renderer3DRef.current) {
        renderer3DRef.current.stop();
      }
      
      if (audioEngineRef.current) {
        audioEngineRef.current.stopAudio();
      }
      
      if (hapticsEngineRef.current) {
        hapticsEngineRef.current.stop();
      }
      
      // Stop legacy audio
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
      
      console.log('⏸️ BLS Paused');
    };
    
    // Revolutionary Reset BLS - All Systems
    const resetBLS = () => {
      setIsActive(false);
      setBallPosition(getInitialPosition());
      setBallDirection(1);
      
      // Reset 3D Systems
      if (renderer3DRef.current) {
        renderer3DRef.current.stop();
      }
      
      if (audioEngineRef.current) {
        audioEngineRef.current.stopAudio();
      }
      
      if (hapticsEngineRef.current) {
        hapticsEngineRef.current.stop();
      }
      
      if (adaptiveControllerRef.current) {
        adaptiveControllerRef.current.reset();
      }
      
      // Reset legacy systems
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current = null;
      }
      
      // Reset metrics
      setMetrics({
        cyclesCompleted: 0,
        totalDuration: 0,
        averageSpeed: config.speed,
        patternChanges: 0,
        attentionScore: 1
      });
      
      setAdaptiveRecommendations([]);
      setCurrentPosition(null);
      
      console.log('🔄 BLS Reset');
    };
    
    // Revolutionary Adaptive Processing - 98 Emotional States
    const processAdaptiveResponse = async (emotionData: EmotionData) => {
      if (!adaptiveControllerRef.current || !emotionData) return;
      
      try {
        // Get adaptive recommendations
        const adaptiveResult = adaptiveControllerRef.current.adaptConfiguration(
          emotionData, 
          config.sessionPhase, 
          config
        );
        
        if (adaptiveResult.changed) {
          console.log('🤖 AI Adaptation:', adaptiveResult.reasoning);
          
          // Apply smooth transition if enabled
          if (config.transitions.enabled && transitionManagerRef.current) {
            await transitionManagerRef.current.startTransition(
              config, 
              adaptiveResult.config, 
              config.transitions
            );
          }
          
          // Update configuration
          setConfig(adaptiveResult.config);
          
          // Update 3D systems
          if (renderer3DRef.current && isActive) {
            renderer3DRef.current.updatePattern(adaptiveResult.config.pattern);
            renderer3DRef.current.updateSpeed(adaptiveResult.config.speed);
          }
        }
        
        // Get therapeutic recommendations
        const recommendations = adaptiveControllerRef.current.getTherapeuticRecommendations(
          emotionData, 
          config.sessionPhase
        );
        setAdaptiveRecommendations(recommendations);
        
        // Crisis detection
        const crisisDetection = adaptiveControllerRef.current.detectCrisisState(emotionData);
        if (crisisDetection.isCrisis) {
          console.warn('⚠️ Crisis detected:', crisisDetection.severity);
          // Immediate intervention
          pauseBLS();
        }
        
      } catch (error) {
        console.error('Adaptive processing failed:', error);
      }
    };
    
    // Process emotion data when received
    useEffect(() => {
      if (emotionData && config.adaptiveMode) {
        processAdaptiveResponse(emotionData);
      }
    }, [emotionData, config.adaptiveMode]);
    
    // Revolutionary 3D Event Handlers
    const handleDirectionChange = (direction: number) => {
      setBallDirection(direction);
      
      // Update metrics
      setMetrics(prev => ({
        ...prev,
        cyclesCompleted: prev.cyclesCompleted + (direction === 1 ? 0 : 0.5)
      }));
      
      // Trigger haptic feedback
      if (hapticsEngineRef.current) {
        hapticsEngineRef.current.triggerDirectionChange();
      }
      
      // Legacy sound for fallback
      playLegacySound();
    };
    
    const handlePatternComplete = () => {
      setMetrics(prev => ({
        ...prev,
        cyclesCompleted: prev.cyclesCompleted + 1
      }));
      
      if (onSessionComplete) {
        onSessionComplete();
      }
    };
    
    const handlePositionUpdate = (position: Pattern3DPosition) => {
      setCurrentPosition(position);
      
      // Update spatial audio
      if (audioEngineRef.current && config.audio.spatialAudio) {
        audioEngineRef.current.updateSpatialPosition({
          x: position.position.x,
          y: position.position.y,
          z: position.position.z
        });
      }
      
      // Update haptic feedback based on movement
      if (hapticsEngineRef.current && config.haptics.syncWithMovement) {
        hapticsEngineRef.current.triggerMovementSync({
          x: position.position.x,
          y: position.position.y,
          z: position.position.z
        });
      }
    };
    
    const handleTransitionComplete = (finalConfig: BLSConfiguration) => {
      console.log('✨ Transition completed to new configuration');
      setConfig(finalConfig);
    };
    
    // Enhanced Configuration Update with Transitions
    const updateConfigurationWithTransition = async (newConfig: Partial<BLSConfiguration>) => {
      if (config.transitions.enabled && transitionManagerRef.current) {
        const transitionConfig = transitionManagerRef.current.createPatternTransition(
          config.pattern,
          newConfig.pattern || config.pattern
        );
        
        await transitionManagerRef.current.startTransition(
          config,
          { ...config, ...newConfig },
          transitionConfig
        );
      } else {
        setConfig(prev => ({ ...prev, ...newConfig }));
      }
    };
    
    // Legacy Audio Support (for fallback)
    const initLegacyAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };
    
    const playLegacySound = () => {
      if (!config.audio.enabled || !audioContextRef.current) return;
      
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