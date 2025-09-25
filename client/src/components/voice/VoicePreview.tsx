/**
 * Voice Preview Component for EMDR42 TTS System
 * 
 * Features:
 * - Real-time voice preview with sample text
 * - Voice comparison interface
 * - Therapeutic voice ratings and recommendations
 * - Custom text input for voice testing
 * - Loading states during synthesis
 * - Voice characteristics visualization
 * - Accessibility features for voice selection
 */

import { useState, useEffect, useCallback } from 'react';
import { Play, Loader, Star, Heart, Brain, Volume2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { AudioPlaybackControls } from './AudioPlaybackControls';
import { cn } from '@/lib/utils';
import type { TTSVoiceConfig, TTSVoiceRecommendation } from '@/../../shared/types';

interface VoicePreviewProps {
  voice: TTSVoiceConfig;
  isSelected?: boolean;
  isRecommended?: boolean;
  recommendation?: TTSVoiceRecommendation;
  sampleText?: string;
  onVoiceSelect?: (voice: TTSVoiceConfig) => void;
  onPreview?: (voice: TTSVoiceConfig, text: string) => Promise<ArrayBuffer>;
  showCharacteristics?: boolean;
  compactMode?: boolean;
  therapeuticMode?: boolean;
  className?: string;
}

interface PreviewState {
  isLoading: boolean;
  audioData: ArrayBuffer | null;
  customText: string;
  previewSettings: {
    speed: number;
    pitch: number;
    volume: number;
  };
  showDetails: boolean;
  lastPreviewText: string;
}

const DEFAULT_SAMPLE_TEXTS = {
  'preparation': "Take a deep breath and let yourself settle into this safe space. We'll work together at your own pace.",
  'grounding': "Notice your feet on the ground, your back against the chair. You are safe here and now.",
  'assessment': "On a scale from 0 to 10, how disturbing does this memory feel right now?",
  'processing': "Go with that. What comes up for you when you think about that?",
  'installation': "How true does that positive belief feel for you right now, on a scale of 1 to 7?",
  'closure': "We're going to close our session now. Let's return to your calm, safe place."
};

/**
 * Voice Preview Component
 * Allows users to test and compare TTS voices for therapeutic contexts
 */
export function VoicePreview({
  voice,
  isSelected = false,
  isRecommended = false,
  recommendation,
  sampleText,
  onVoiceSelect,
  onPreview,
  showCharacteristics = true,
  compactMode = false,
  therapeuticMode = false,
  className
}: VoicePreviewProps) {
  const [state, setState] = useState<PreviewState>({
    isLoading: false,
    audioData: null,
    customText: sampleText || DEFAULT_SAMPLE_TEXTS.preparation,
    previewSettings: {
      speed: 1.0,
      pitch: 0,
      volume: 0.8
    },
    showDetails: !compactMode,
    lastPreviewText: ''
  });

  // Auto-preview for recommended voices
  useEffect(() => {
    if (isRecommended && !state.audioData && onPreview) {
      handlePreview();
    }
  }, [isRecommended]);

  const handlePreview = useCallback(async () => {
    if (!onPreview || state.isLoading) return;

    const textToSpeak = state.customText || DEFAULT_SAMPLE_TEXTS.preparation;
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      lastPreviewText: textToSpeak 
    }));

    try {
      const audioData = await onPreview(voice, textToSpeak);
      setState(prev => ({ 
        ...prev, 
        audioData, 
        isLoading: false 
      }));
    } catch (error) {
      console.error('Voice preview failed:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        audioData: null 
      }));
    }
  }, [voice, onPreview, state.customText, state.isLoading]);

  const handleVoiceSelect = useCallback(() => {
    onVoiceSelect?.(voice);
  }, [voice, onVoiceSelect]);

  const updateCustomText = useCallback((text: string) => {
    setState(prev => ({ 
      ...prev, 
      customText: text,
      audioData: null // Clear previous audio when text changes
    }));
  }, []);

  const loadSampleText = useCallback((context: keyof typeof DEFAULT_SAMPLE_TEXTS) => {
    updateCustomText(DEFAULT_SAMPLE_TEXTS[context]);
  }, [updateCustomText]);

  // Calculate therapeutic score
  const therapeuticScore = voice.therapeuticProfile ? (
    (voice.therapeuticProfile.anxietyFriendly ? 25 : 0) +
    (voice.therapeuticProfile.traumaSensitive ? 25 : 0) +
    (voice.therapeuticProfile.childFriendly ? 15 : 0) +
    (voice.characteristics.empathy * 35)
  ) : 50;

  // Voice characteristic bars
  const CharacteristicBar = ({ label, value, icon: Icon }: { 
    label: string; 
    value: number; 
    icon: any; 
  }) => (
    <div className="flex items-center gap-2">
      <Icon className="h-3 w-3 text-muted-foreground" />
      <span className="text-xs text-muted-foreground w-12">{label}</span>
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8">
        {Math.round(value * 100)}
      </span>
    </div>
  );

  if (compactMode) {
    return (
      <Card 
        className={cn(
          'p-3 transition-all duration-200 hover-elevate cursor-pointer',
          isSelected && 'ring-2 ring-primary bg-primary/5',
          isRecommended && 'border-primary/50 bg-primary/5',
          className
        )}
        onClick={handleVoiceSelect}
        data-testid={`card-voice-${voice.name}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {voice.name}
              </span>
              <div className="flex items-center gap-1 mt-1">
                <Badge variant="outline" className="text-xs">
                  {voice.gender}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {voice.language}
                </Badge>
                {isRecommended && (
                  <Badge variant="default" className="text-xs">
                    <Star className="h-2 w-2 mr-1" />
                    Recommended
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handlePreview();
            }}
            disabled={state.isLoading}
            data-testid={`button-preview-${voice.name}`}
          >
            {state.isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>

        {state.audioData && (
          <div className="mt-3">
            <AudioPlaybackControls
              audioData={state.audioData}
              title="Voice Preview"
              voice={{
                name: voice.name,
                gender: voice.gender,
                language: voice.language
              }}
              therapeuticMode={therapeuticMode}
              className="border-none bg-transparent p-0"
            />
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'p-4 transition-all duration-200',
        isSelected && 'ring-2 ring-primary bg-primary/5',
        isRecommended && 'border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10',
        className
      )}
      data-testid={`card-voice-preview-${voice.name}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                {voice.name}
              </h3>
              {isRecommended && recommendation && (
                <Badge variant="default" className="text-xs">
                  <Star className="h-3 w-3 mr-1" />
                  {(recommendation.primary.confidence * 100).toFixed(0)}% Match
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {voice.gender} • {voice.language}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {voice.accent}
              </Badge>
              {voice.age && (
                <Badge variant="outline" className="text-xs">
                  {voice.age}
                </Badge>
              )}
            </div>
            
            {therapeuticMode && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-muted-foreground">
                    Therapeutic Score: {therapeuticScore}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, showDetails: !prev.showDetails }))}
            data-testid="button-toggle-details"
          >
            Details
          </Button>
          <Button
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={handleVoiceSelect}
            data-testid={`button-select-${voice.name}`}
          >
            {isSelected ? 'Selected' : 'Select'}
          </Button>
        </div>
      </div>

      {/* Recommendation Reasoning */}
      {isRecommended && recommendation && (
        <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Why this voice is recommended:
            </span>
          </div>
          <ul className="text-xs text-muted-foreground space-y-1">
            {recommendation.primary.reasoning.map((reason, index) => (
              <li key={index}>• {reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Voice Characteristics */}
      {showCharacteristics && state.showDetails && (
        <div className="mb-4 space-y-2">
          <h4 className="text-sm font-medium text-foreground mb-2">Voice Characteristics</h4>
          <CharacteristicBar 
            label="Warmth" 
            value={voice.characteristics.warmth} 
            icon={Heart} 
          />
          <CharacteristicBar 
            label="Empathy" 
            value={voice.characteristics.empathy} 
            icon={Heart} 
          />
          <CharacteristicBar 
            label="Authority" 
            value={voice.characteristics.authority} 
            icon={Brain} 
          />
          <CharacteristicBar 
            label="Clarity" 
            value={voice.characteristics.clarity} 
            icon={Volume2} 
          />
          
          {therapeuticMode && voice.therapeuticProfile && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center gap-4 text-xs">
                <div className={cn(
                  "flex items-center gap-1",
                  voice.therapeuticProfile.anxietyFriendly ? "text-green-600" : "text-muted-foreground"
                )}>
                  <Heart className="h-3 w-3" />
                  Anxiety-Friendly
                </div>
                <div className={cn(
                  "flex items-center gap-1",
                  voice.therapeuticProfile.traumaSensitive ? "text-green-600" : "text-muted-foreground"
                )}>
                  <Brain className="h-3 w-3" />
                  Trauma-Sensitive
                </div>
                <div className={cn(
                  "flex items-center gap-1",
                  voice.therapeuticProfile.childFriendly ? "text-green-600" : "text-muted-foreground"
                )}>
                  <Star className="h-3 w-3" />
                  Child-Friendly
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sample Text Selection */}
      {state.showDetails && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-foreground">Preview Text</h4>
            <div className="flex gap-1">
              {Object.keys(DEFAULT_SAMPLE_TEXTS).map((context) => (
                <Button
                  key={context}
                  variant="ghost"
                  size="sm"
                  onClick={() => loadSampleText(context as keyof typeof DEFAULT_SAMPLE_TEXTS)}
                  className="text-xs"
                  data-testid={`button-sample-${context}`}
                >
                  {context}
                </Button>
              ))}
            </div>
          </div>
          
          <Textarea
            value={state.customText}
            onChange={(e) => updateCustomText(e.target.value)}
            placeholder="Enter text to preview with this voice..."
            className="min-h-[80px] text-sm"
            data-testid="textarea-custom-text"
          />
        </div>
      )}

      {/* Preview Controls */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="default"
          size="sm"
          onClick={handlePreview}
          disabled={state.isLoading || !state.customText.trim()}
          data-testid={`button-preview-voice-${voice.name}`}
        >
          {state.isLoading ? (
            <>
              <Loader className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Preview Voice
            </>
          )}
        </Button>
        
        {state.audioData && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setState(prev => ({ ...prev, audioData: null }))}
            data-testid="button-clear-preview"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Audio Playback */}
      {state.audioData && (
        <div className="border-t border-border/50 pt-4">
          <AudioPlaybackControls
            audioData={state.audioData}
            title={`Preview: ${state.lastPreviewText.slice(0, 50)}${state.lastPreviewText.length > 50 ? '...' : ''}`}
            voice={{
              name: voice.name,
              gender: voice.gender,
              language: voice.language
            }}
            showWaveform={true}
            therapeuticMode={therapeuticMode}
            className="border-none bg-muted/30"
          />
        </div>
      )}
    </Card>
  );
}