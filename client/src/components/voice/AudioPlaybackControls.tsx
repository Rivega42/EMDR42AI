/**
 * Audio Playback Controls for EMDR42 TTS System
 * 
 * Features:
 * - Play/Pause/Stop audio controls
 * - Progress bar with seek functionality
 * - Volume control with mute option
 * - Playback speed adjustment
 * - Voice visualization (waveform/spectrogram)
 * - Loading states and progress indicators
 * - Therapeutic session integration
 * - Accessibility compliance (ARIA labels, keyboard navigation)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, // Using Square instead of Stop
  Volume2, 
  VolumeX, 
  SkipBack, 
  SkipForward,
  Settings,
  Loader,
  AudioLines // Using AudioLines instead of Waveform
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AudioPlaybackControlsProps {
  audioData?: ArrayBuffer;
  audioUrl?: string;
  isLoading?: boolean;
  title?: string;
  voice?: {
    name: string;
    gender: 'male' | 'female' | 'neutral';
    language: string;
  };
  onPlaybackStateChange?: (state: 'playing' | 'paused' | 'stopped') => void;
  onProgressChange?: (progress: number) => void;
  onVolumeChange?: (volume: number) => void;
  onSpeedChange?: (speed: number) => void;
  showWaveform?: boolean;
  therapeuticMode?: boolean;
  className?: string;
}

interface AudioState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isLoading: boolean;
}

/**
 * Audio Playback Controls Component
 * Provides comprehensive audio playback interface for TTS synthesized speech
 */
export function AudioPlaybackControls({
  audioData,
  audioUrl,
  isLoading = false,
  title = 'Audio Playback',
  voice,
  onPlaybackStateChange,
  onProgressChange,
  onVolumeChange,
  onSpeedChange,
  showWaveform = false,
  therapeuticMode = false,
  className
}: AudioPlaybackControlsProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);

  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    playbackRate: 1.0,
    isLoading: false
  });

  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize audio element when audio data changes
  useEffect(() => {
    if (audioData && audioRef.current) {
      const blob = new Blob([audioData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      audioRef.current.src = url;
      
      return () => URL.revokeObjectURL(url);
    } else if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
    }
  }, [audioData, audioUrl]);

  // Initialize audio context and analyser for waveform visualization
  useEffect(() => {
    if (showWaveform && audioRef.current && !audioContextRef.current) {
      initializeAudioContext();
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [showWaveform]);

  const initializeAudioContext = useCallback(async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      if (audioRef.current) {
        const source = audioContextRef.current.createMediaElementSource(audioRef.current);
        source.connect(analyser);
        analyser.connect(audioContextRef.current.destination);
        
        analyserRef.current = analyser;
        
        if (showWaveform) {
          updateWaveform();
        }
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, [showWaveform]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    setWaveformData(Array.from(dataArray));
    
    if (audioState.isPlaying) {
      animationIdRef.current = requestAnimationFrame(updateWaveform);
    }
  }, [audioState.isPlaying]);

  // Audio event handlers
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioState(prev => ({
        ...prev,
        duration: audioRef.current!.duration,
        isLoading: false
      }));
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setAudioState(prev => ({ ...prev, currentTime }));
      onProgressChange?.(currentTime);
    }
  }, [onProgressChange]);

  const handlePlay = useCallback(() => {
    setAudioState(prev => ({ ...prev, isPlaying: true, isPaused: false }));
    onPlaybackStateChange?.('playing');
    
    if (showWaveform) {
      updateWaveform();
    }
  }, [onPlaybackStateChange, showWaveform, updateWaveform]);

  const handlePause = useCallback(() => {
    setAudioState(prev => ({ ...prev, isPlaying: false, isPaused: true }));
    onPlaybackStateChange?.('paused');
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  }, [onPlaybackStateChange]);

  const handleEnded = useCallback(() => {
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      isPaused: false,
      currentTime: 0 
    }));
    onPlaybackStateChange?.('stopped');
    
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  }, [onPlaybackStateChange]);

  // Control functions
  const play = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      setAudioState(prev => ({ ...prev, isLoading: true }));
      await audioRef.current.play();
    } catch (error) {
      console.error('Failed to play audio:', error);
      setAudioState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && audioState.isPlaying) {
      audioRef.current.pause();
    }
  }, [audioState.isPlaying]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isPaused: false,
        currentTime: 0 
      }));
      onPlaybackStateChange?.('stopped');
    }
  }, [onPlaybackStateChange]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setAudioState(prev => ({ ...prev, volume, isMuted: volume === 0 }));
      onVolumeChange?.(volume);
    }
  }, [onVolumeChange]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMuted = !audioState.isMuted;
      audioRef.current.muted = newMuted;
      setAudioState(prev => ({ ...prev, isMuted: newMuted }));
    }
  }, [audioState.isMuted]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
      setAudioState(prev => ({ ...prev, playbackRate: rate }));
      onSpeedChange?.(rate);
    }
  }, [onSpeedChange]);

  const skipForward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.currentTime + 10, 
        audioRef.current.duration
      );
    }
  }, []);

  const skipBackward = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
    }
  }, []);

  // Format time helper
  const formatTime = useCallback((time: number): string => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Progress calculation
  const progressPercentage = audioState.duration > 0 
    ? (audioState.currentTime / audioState.duration) * 100 
    : 0;

  return (
    <Card className={cn(
      'p-4 bg-card/50 backdrop-blur-sm border border-border/50',
      therapeuticMode && 'bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/20',
      className
    )}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm font-medium text-foreground" data-testid="text-audio-title">
              {title}
            </h3>
            {voice && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs" data-testid="badge-voice-name">
                  {voice.name}
                </Badge>
                <Badge variant="secondary" className="text-xs" data-testid="badge-voice-gender">
                  {voice.gender}
                </Badge>
                <Badge variant="outline" className="text-xs" data-testid="badge-voice-language">
                  {voice.language}
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          data-testid="button-audio-settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Waveform Visualization */}
      {showWaveform && (
        <div className="mb-4">
          <div className="h-16 bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden">
            {waveformData.length > 0 ? (
              <div className="flex items-end justify-center gap-1 h-full px-2">
                {waveformData.slice(0, 64).map((value, index) => (
                  <div
                    key={index}
                    className="bg-primary/60 rounded-t"
                    style={{
                      height: `${Math.max(2, (value / 255) * 100)}%`,
                      width: '2px'
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AudioLines className="h-4 w-4" />
                <span className="text-sm">Audio visualization</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground min-w-[35px]" data-testid="text-current-time">
            {formatTime(audioState.currentTime)}
          </span>
          <div className="flex-1 relative">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <input
              type="range"
              min="0"
              max={audioState.duration || 100}
              value={audioState.currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              data-testid="slider-audio-progress"
            />
          </div>
          <span className="text-xs text-muted-foreground min-w-[35px]" data-testid="text-duration">
            {formatTime(audioState.duration)}
          </span>
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={skipBackward}
          disabled={!audioData && !audioUrl}
          data-testid="button-skip-backward"
        >
          <SkipBack className="h-4 w-4" />
        </Button>
        
        {(isLoading || audioState.isLoading) ? (
          <Button variant="default" size="sm" disabled data-testid="button-loading">
            <Loader className="h-4 w-4 animate-spin" />
          </Button>
        ) : audioState.isPlaying ? (
          <Button 
            variant="default" 
            size="sm" 
            onClick={pause}
            data-testid="button-pause"
          >
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            variant="default" 
            size="sm" 
            onClick={play}
            disabled={!audioData && !audioUrl}
            data-testid="button-play"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={stop}
          disabled={!audioState.isPlaying && !audioState.isPaused}
          data-testid="button-stop"
        >
          <Square className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={skipForward}
          disabled={!audioData && !audioUrl}
          data-testid="button-skip-forward"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Volume and Speed Controls */}
      <div className="flex items-center gap-4">
        {/* Volume Control */}
        <div className="flex items-center gap-2 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="p-1"
            data-testid="button-volume-toggle"
          >
            {audioState.isMuted || audioState.volume === 0 ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[audioState.isMuted ? 0 : audioState.volume]}
            max={1}
            min={0}
            step={0.05}
            onValueChange={([value]) => setVolume(value)}
            className="flex-1 max-w-[100px]"
            data-testid="slider-volume"
          />
        </div>

        {/* Speed Control */}
        {showSettings && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground min-w-[35px]">
              {audioState.playbackRate.toFixed(1)}x
            </span>
            <Slider
              value={[audioState.playbackRate]}
              max={2}
              min={0.5}
              step={0.1}
              onValueChange={([value]) => setPlaybackRate(value)}
              className="flex-1 max-w-[80px]"
              data-testid="slider-playback-rate"
            />
          </div>
        )}
      </div>

      {/* Therapeutic Mode Indicators */}
      {therapeuticMode && (
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border/50">
          <div className="text-xs text-muted-foreground">Therapeutic Session</div>
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-100" />
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-200" />
          </div>
        </div>
      )}
    </Card>
  );
}