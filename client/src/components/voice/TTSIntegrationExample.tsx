/**
 * TTS Integration Example for EMDR42 Therapeutic Platform
 * 
 * This component demonstrates the complete integration of the TextToSpeechService
 * with all its components: providers, caching, personalization, and UI controls.
 * 
 * Features demonstrated:
 * - Complete TTS service initialization
 * - Voice personalization and recommendation
 * - Real-time audio synthesis and playback
 * - Voice preview and selection interface
 * - Therapeutic context adaptation
 * - Error handling and fallback mechanisms
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Volume2, 
  Settings, 
  Brain, 
  Heart, 
  Loader, 
  CheckCircle, 
  AlertCircle,
  Mic,
  Headphones
} from 'lucide-react';
import { VoicePreview } from './VoicePreview';
import { AudioPlaybackControls } from './AudioPlaybackControls';
import { cn } from '@/lib/utils';

// Import our TTS services (these would be actual imports in a real implementation)
import { TextToSpeechService } from '@/services/voice/textToSpeechService';
import { GoogleCloudTTSProvider } from '@/services/voice/googleCloudTTSProvider';
import { WebSpeechTTSProvider } from '@/services/voice/webSpeechTTSProvider';
import { AudioCacheService } from '@/services/voice/audioCacheService';
import { VoicePersonalizationService } from '@/services/voice/voicePersonalizationService';

import type { 
  TTSVoiceConfig, 
  TTSVoiceRecommendation, 
  TTSSynthesisRequest,
  TTSSynthesisResponse 
} from '@/../../shared/types';

interface TTSIntegrationState {
  isInitialized: boolean;
  currentVoice: TTSVoiceConfig | null;
  availableVoices: TTSVoiceConfig[];
  recommendation: TTSVoiceRecommendation | null;
  synthesisingText: string;
  currentAudio: ArrayBuffer | null;
  error: string | null;
  loading: boolean;
  activeProvider: 'google-cloud' | 'web-speech' | null;
  cacheStats: any;
  therapeuticContext: string;
}

const THERAPEUTIC_CONTEXTS = {
  'preparation': 'Session Preparation',
  'assessment': 'Memory Assessment', 
  'desensitization': 'Desensitization Phase',
  'installation': 'Positive Installation',
  'body-scan': 'Body Scan',
  'grounding': 'Grounding Exercise',
  'closure': 'Session Closure'
};

const SAMPLE_THERAPEUTIC_TEXTS = {
  'preparation': "Welcome to our EMDR session. Take a moment to settle in and find your comfortable position. Remember, you are in control, and we will proceed at your pace.",
  'assessment': "I'd like you to bring up that target memory we discussed. When you think about it now, on a scale of 0 to 10, how disturbing does it feel?",
  'desensitization': "Follow the movements with your eyes while holding that memory in your mind. Just notice whatever comes up - thoughts, feelings, images, or sensations.",
  'installation': "How true do these positive words feel for you now: 'I am safe and in control.' On a scale of 1 to 7, completely false to completely true?",
  'body-scan': "Now I'd like you to close your eyes and scan your body from head to toe. Notice any tension, sensations, or feelings that arise.",
  'grounding': "Feel your feet on the floor, your body in the chair. Take three deep breaths with me. You are here, you are safe, you are present.",
  'closure': "We're going to close our session now. Let's return to your calm place and take a few moments to feel centered and grounded."
};

/**
 * TTS Integration Example Component
 * Demonstrates complete TTS system integration for therapeutic use
 */
export function TTSIntegrationExample() {
  const [state, setState] = useState<TTSIntegrationState>({
    isInitialized: false,
    currentVoice: null,
    availableVoices: [],
    recommendation: null,
    synthesisingText: SAMPLE_THERAPEUTIC_TEXTS.preparation,
    currentAudio: null,
    error: null,
    loading: false,
    activeProvider: null,
    cacheStats: null,
    therapeuticContext: 'preparation'
  });

  // Service references
  const ttsServiceRef = useRef<TextToSpeechService | null>(null);
  const cacheServiceRef = useRef<AudioCacheService | null>(null);
  const personalizationServiceRef = useRef<VoicePersonalizationService | null>(null);

  /**
   * Initialize the complete TTS system
   */
  const initializeTTSSystem = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🎵 Initializing TTS System for EMDR42...');

      // Initialize services
      const cacheService = new AudioCacheService({
        maxCacheSize: 50 * 1024 * 1024, // 50MB
        preloadCommonPhrases: true,
        compressionEnabled: true
      });

      const personalizationService = new VoicePersonalizationService({
        enablePersonalization: true,
        learningEnabled: true,
        culturalSensitivity: true,
        accessibilityOptimization: true
      });

      // Initialize providers
      const googleProvider = new GoogleCloudTTSProvider({
        serverEndpoint: '/api/tts/synthesize',
        timeout: 10000,
        retryAttempts: 2
      });

      const webSpeechProvider = new WebSpeechTTSProvider({
        preferLocalVoices: true,
        qualityEnhancement: {
          enabled: true,
          normalizeVolume: true,
          enhanceClarity: true
        }
      });

      // Initialize main TTS service
      const ttsService = new TextToSpeechService({
        providers: [googleProvider, webSpeechProvider],
        fallbackEnabled: true,
        cacheService: cacheService,
        personalizationService: personalizationService
      });

      // Initialize all services
      await Promise.all([
        cacheService.initialize(),
        ttsService.initialize()
      ]);

      // Get available voices
      const voices = await ttsService.getAvailableVoices();
      
      // Initialize personalization with voices
      await personalizationService.initialize(voices);

      // Get voice recommendation for therapeutic context
      const recommendation = await personalizationService.getVoiceRecommendation(
        'demo-patient-123', // Demo patient ID
        state.therapeuticContext,
        {
          genderPreference: 'female', // Research shows preference in therapy
          languagePreference: 'en-US',
          culturalBackground: 'western'
        }
      );

      // Store service references
      ttsServiceRef.current = ttsService;
      cacheServiceRef.current = cacheService;
      personalizationServiceRef.current = personalizationService;

      // Update state
      setState(prev => ({
        ...prev,
        isInitialized: true,
        availableVoices: voices,
        currentVoice: recommendation.primary.voice,
        recommendation,
        activeProvider: ttsService.getCurrentProvider()?.name as any,
        cacheStats: cacheService.getCacheStats(),
        loading: false
      }));

      console.log('✅ TTS System initialized successfully');

    } catch (error) {
      console.error('❌ TTS System initialization failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Initialization failed',
        loading: false
      }));
    }
  }, [state.therapeuticContext]);

  /**
   * Synthesize speech from text
   */
  const synthesizeSpeech = useCallback(async () => {
    if (!ttsServiceRef.current || !state.currentVoice || !state.synthesisingText.trim()) {
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const request: TTSSynthesisRequest = {
        text: state.synthesisingText,
        voice: state.currentVoice,
        options: {
          speed: 1.0,
          pitch: 0,
          volume: 0.8,
          format: 'wav'
        },
        quality: 'standard',
        metadata: {
          context: state.therapeuticContext,
          sessionId: 'demo-session-123',
          patientId: 'demo-patient-123',
          timestamp: Date.now()
        }
      };

      console.log('🗣️ Synthesizing speech:', request.text.slice(0, 50) + '...');

      const response: TTSSynthesisResponse = await ttsServiceRef.current.synthesize(request);

      // Record usage for personalization learning
      if (personalizationServiceRef.current) {
        await personalizationServiceRef.current.recordVoiceUsage(
          state.currentVoice.name,
          'demo-session-123',
          'demo-patient-123',
          state.therapeuticContext,
          response.duration * 1000,
          {
            sudsImprovement: Math.random() * 2 - 1, // Demo: -1 to 1
            engagementScore: 0.7 + Math.random() * 0.3, // Demo: 0.7 to 1.0
            completionRate: 1.0, // Demo: completed
            patientFeedback: 4 + Math.random() // Demo: 4-5 rating
          }
        );
      }

      setState(prev => ({
        ...prev,
        currentAudio: response.audioData,
        activeProvider: response.metadata.provider as any,
        cacheStats: cacheServiceRef.current?.getCacheStats(),
        loading: false
      }));

      console.log('✅ Speech synthesis completed');

    } catch (error) {
      console.error('❌ Speech synthesis failed:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Synthesis failed',
        loading: false
      }));
    }
  }, [state.currentVoice, state.synthesisingText, state.therapeuticContext]);

  /**
   * Handle voice selection
   */
  const handleVoiceSelection = useCallback(async (voice: TTSVoiceConfig) => {
    setState(prev => ({ ...prev, currentVoice: voice, currentAudio: null }));

    // Update personalization preferences
    if (personalizationServiceRef.current) {
      await personalizationServiceRef.current.updatePatientPreferences('demo-patient-123', {
        genderPreference: voice.gender,
        languagePreference: voice.language,
        accentPreference: voice.accent
      });
    }
  }, []);

  /**
   * Handle context change
   */
  const handleContextChange = useCallback(async (context: string) => {
    setState(prev => ({ 
      ...prev, 
      therapeuticContext: context,
      synthesisingText: SAMPLE_THERAPEUTIC_TEXTS[context as keyof typeof SAMPLE_THERAPEUTIC_TEXTS],
      currentAudio: null
    }));

    // Get new voice recommendation for context
    if (personalizationServiceRef.current) {
      try {
        const recommendation = await personalizationServiceRef.current.getVoiceRecommendation(
          'demo-patient-123',
          context
        );
        setState(prev => ({
          ...prev,
          recommendation,
          currentVoice: recommendation.primary.voice
        }));
      } catch (error) {
        console.error('Failed to get voice recommendation:', error);
      }
    }
  }, []);

  /**
   * Handle voice preview
   */
  const handleVoicePreview = useCallback(async (voice: TTSVoiceConfig, text: string): Promise<ArrayBuffer> => {
    if (!ttsServiceRef.current) {
      throw new Error('TTS service not initialized');
    }

    const request: TTSSynthesisRequest = {
      text,
      voice,
      options: { speed: 1.0, pitch: 0, volume: 0.8, format: 'wav' },
      quality: 'standard',
      metadata: {
        context: 'preview',
        sessionId: 'preview-session',
        patientId: 'demo-patient-123',
        timestamp: Date.now()
      }
    };

    const response = await ttsServiceRef.current.synthesize(request);
    return response.audioData;
  }, []);

  // Initialize on component mount
  useEffect(() => {
    initializeTTSSystem();
  }, [initializeTTSSystem]);

  // Loading state
  if (!state.isInitialized && state.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <Loader className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Initializing TTS System</h3>
            <p className="text-muted-foreground">
              Loading voice providers, cache system, and personalization engine...
            </p>
          </div>
          <Progress value={65} className="w-64" />
        </div>
      </div>
    );
  }

  // Error state
  if (state.error && !state.isInitialized) {
    return (
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            TTS System Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
          <Button 
            onClick={initializeTTSSystem} 
            className="w-full mt-4"
            data-testid="button-retry-initialization"
          >
            Retry Initialization
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">EMDR42 TTS Integration</h1>
        <p className="text-muted-foreground">
          Complete Text-to-Speech system for AI-powered therapeutic sessions
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            System Initialized
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Volume2 className="h-3 w-3 text-blue-500" />
            Active Provider: {state.activeProvider}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Brain className="h-3 w-3 text-purple-500" />
            Personalization: Enabled
          </Badge>
        </div>
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="synthesis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="synthesis">Speech Synthesis</TabsTrigger>
          <TabsTrigger value="voices">Voice Selection</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Speech Synthesis Tab */}
        <TabsContent value="synthesis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Controls */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5" />
                    Therapeutic Speech Synthesis
                  </CardTitle>
                  <CardDescription>
                    Generate AI therapist voice responses for EMDR sessions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Context Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Therapeutic Context</label>
                    <Select value={state.therapeuticContext} onValueChange={handleContextChange}>
                      <SelectTrigger data-testid="select-therapeutic-context">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(THERAPEUTIC_CONTEXTS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Therapist Response</label>
                    <Textarea
                      value={state.synthesisingText}
                      onChange={(e) => setState(prev => ({ 
                        ...prev, 
                        synthesisingText: e.target.value,
                        currentAudio: null 
                      }))}
                      placeholder="Enter the AI therapist's response..."
                      className="min-h-[120px] resize-none"
                      data-testid="textarea-synthesis-text"
                    />
                  </div>

                  {/* Synthesis Button */}
                  <Button
                    onClick={synthesizeSpeech}
                    disabled={state.loading || !state.synthesisingText.trim()}
                    className="w-full"
                    size="lg"
                    data-testid="button-synthesize-speech"
                  >
                    {state.loading ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Synthesizing...
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-4 w-4 mr-2" />
                        Generate Speech
                      </>
                    )}
                  </Button>

                  {/* Error Display */}
                  {state.error && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Audio Playback */}
              {state.currentAudio && (
                <AudioPlaybackControls
                  audioData={state.currentAudio}
                  title="AI Therapist Response"
                  voice={state.currentVoice ? {
                    name: state.currentVoice.name,
                    gender: state.currentVoice.gender,
                    language: state.currentVoice.language
                  } : undefined}
                  showWaveform={true}
                  therapeuticMode={true}
                />
              )}
            </div>

            {/* Current Voice Info */}
            <div className="space-y-4">
              {state.currentVoice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Current Voice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VoicePreview
                      voice={state.currentVoice}
                      isSelected={true}
                      isRecommended={state.recommendation?.primary.voice.name === state.currentVoice.name}
                      recommendation={state.recommendation || undefined}
                      compactMode={false}
                      therapeuticMode={true}
                      showCharacteristics={true}
                      onPreview={handleVoicePreview}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Cache Stats */}
              {state.cacheStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cache Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Hit Rate:</span>
                        <span className="font-mono">
                          {(state.cacheStats.hitRate * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Entries:</span>
                        <span className="font-mono">{state.cacheStats.entryCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span className="font-mono">
                          {(state.cacheStats.totalSize / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Voice Selection Tab */}
        <TabsContent value="voices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Voice Selection & Preview
              </CardTitle>
              <CardDescription>
                Test and select the optimal therapeutic voice for your patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {state.availableVoices.slice(0, 6).map((voice) => (
                  <VoicePreview
                    key={voice.name}
                    voice={voice}
                    isSelected={state.currentVoice?.name === voice.name}
                    isRecommended={state.recommendation?.primary.voice.name === voice.name}
                    recommendation={state.recommendation || undefined}
                    therapeuticMode={true}
                    onVoiceSelect={handleVoiceSelection}
                    onPreview={handleVoicePreview}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>TTS Service</span>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Cache Service</span>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Personalization</span>
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Learning
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Available Voices</span>
                    <Badge variant="outline">
                      {state.availableVoices.length} voices
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cache Hit Rate</span>
                      <span>{state.cacheStats ? (state.cacheStats.hitRate * 100).toFixed(1) : 0}%</span>
                    </div>
                    <Progress value={state.cacheStats ? state.cacheStats.hitRate * 100 : 0} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Voice Match Confidence</span>
                      <span>{state.recommendation ? (state.recommendation.primary.confidence * 100).toFixed(1) : 0}%</span>
                    </div>
                    <Progress value={state.recommendation ? state.recommendation.primary.confidence * 100 : 0} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}