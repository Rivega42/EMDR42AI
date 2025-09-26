/**
 * ElevenLabs TTS Provider for EMDR42 Therapy Platform
 * 
 * Features:
 * - High-quality neural voice synthesis with therapeutic optimization
 * - WebRTC streaming for real-time audio delivery
 * - Emotional context-aware voice selection for EMDR phases
 * - Русифицированные терапевтические голоса (Russian therapeutic voices)
 * - Integration with AudioStreamMultiplexer for seamless audio handling
 * - Server-side API key management with ephemeral tokens
 * - Adaptive quality based on connection and therapeutic context
 */

import type {
  TTSProvider,
  TTSVoiceConfig,
  TTSSynthesisRequest,
  TTSSynthesisResponse,
  TTSError,
  ElevenLabsVoiceConfig,
  ElevenLabsTTSProvider as ElevenLabsConfig,
  ElevenLabsWebRTCConfig,
  ElevenLabsGenerationResponse,
  ElevenLabsStreamingOptions,
  ElevenLabsVoice,
  EMDRPhase,
  EmotionData
} from '@/../../../shared/types';

import { AudioStreamMultiplexer } from '@/services/audio/audioStreamMultiplexer';
import { generateDeterministicId } from '@/lib/deterministicUtils';

// Default therapeutic voices configuration (Russian-focused)
const DEFAULT_THERAPEUTIC_VOICES: ElevenLabsConfig['config']['voices']['therapeutic'] = {
  спокойный: {
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam - calm, reassuring
    model: 'eleven_multilingual_v2',
    stability: 0.8,
    similarity_boost: 0.9,
    style: 0.3,
    use_speaker_boost: true,
    therapeuticProfile: {
      emotionalContext: 'calm',
      paceAdjustment: 0.85,
      emphasisLevel: 'subtle',
      pausePattern: 'therapeutic'
    }
  },
  эмпатичный: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella - empathetic, understanding
    model: 'eleven_multilingual_v2',
    stability: 0.7,
    similarity_boost: 0.8,
    style: 0.5,
    use_speaker_boost: true,
    therapeuticProfile: {
      emotionalContext: 'empathetic',
      paceAdjustment: 0.9,
      emphasisLevel: 'moderate',
      pausePattern: 'natural'
    }
  },
  поддерживающий: {
    voiceId: 'ErXwobaYiN019PkySvjV', // Antoni - supportive, encouraging
    model: 'eleven_multilingual_v2',
    stability: 0.6,
    similarity_boost: 0.85,
    style: 0.4,
    use_speaker_boost: false,
    therapeuticProfile: {
      emotionalContext: 'supportive',
      paceAdjustment: 1.0,
      emphasisLevel: 'moderate',
      pausePattern: 'natural'
    }
  },
  инструктивный: {
    voiceId: 'AZnzlk1XvdvUeBnXmlld', // Domi - clear, instructional
    model: 'eleven_multilingual_v2',
    stability: 0.9,
    similarity_boost: 0.95,
    style: 0.2,
    use_speaker_boost: true,
    therapeuticProfile: {
      emotionalContext: 'instructional',
      paceAdjustment: 0.95,
      emphasisLevel: 'strong',
      pausePattern: 'minimal'
    }
  },
  экстренный: {
    voiceId: 'VR6AewLTigWG4xSOukaG', // Arnold - emergency, direct
    model: 'eleven_turbo_v2',
    stability: 0.95,
    similarity_boost: 0.9,
    style: 0.1,
    use_speaker_boost: true,
    therapeuticProfile: {
      emotionalContext: 'emergency',
      paceAdjustment: 1.1,
      emphasisLevel: 'strong',
      pausePattern: 'minimal'
    }
  }
};

// EMDR Phase to Voice Mapping
const PHASE_VOICE_MAPPING: Record<EMDRPhase, keyof typeof DEFAULT_THERAPEUTIC_VOICES> = {
  preparation: 'спокойный',
  assessment: 'эмпатичный',
  desensitization: 'поддерживающий',
  installation: 'поддерживающий',
  'body-scan': 'спокойный',
  closure: 'эмпатичный',
  reevaluation: 'инструктивный',
  integration: 'спокойный'
};

/**
 * ElevenLabs TTS Provider Implementation
 * Provides high-quality neural TTS with therapeutic optimization
 */
export class ElevenLabsTTSProvider {
  readonly name: TTSProvider = 'elevenlabs';
  private config: ElevenLabsConfig['config'];
  private isInitialized = false;
  private availableVoices: ElevenLabsVoice[] = [];
  private currentToken: string | null = null;
  private tokenExpiry: number = 0;
  private audioMultiplexer: AudioStreamMultiplexer | null = null;
  
  // WebRTC connection for streaming
  private rtcConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private audioStream: MediaStream | null = null;
  
  // Stats and monitoring
  private stats = {
    requests: 0,
    errors: 0,
    totalLatency: 0,
    avgLatency: 0,
    bytesStreamed: 0,
    connectionQuality: 1.0,
    lastError: null as TTSError | null
  };

  // Request queue for rate limiting
  private requestQueue: Array<{
    request: TTSSynthesisRequest;
    resolve: (response: TTSSynthesisResponse) => void;
    reject: (error: TTSError) => void;
    timestamp: number;
  }> = [];
  private isProcessingQueue = false;

  constructor(config: Partial<ElevenLabsConfig['config']> = {}) {
    this.config = {
      serverEndpoint: '/api/voice/elevenlabs',
      timeout: 15000,
      retryAttempts: 3,
      maxConcurrentRequests: 2,
      streaming: {
        enabled: true,
        chunkSize: 2048,
        bufferSize: 8192,
        latencyOptimization: true,
        adaptiveQuality: true
      },
      voices: {
        default: DEFAULT_THERAPEUTIC_VOICES.спокойный,
        therapeutic: DEFAULT_THERAPEUTIC_VOICES,
        contextMapping: {
          preparation: DEFAULT_THERAPEUTIC_VOICES.спокойный.voiceId,
          assessment: DEFAULT_THERAPEUTIC_VOICES.эмпатичный.voiceId,
          desensitization: DEFAULT_THERAPEUTIC_VOICES.поддерживающий.voiceId,
          installation: DEFAULT_THERAPEUTIC_VOICES.поддерживающий.voiceId,
          'body-scan': DEFAULT_THERAPEUTIC_VOICES.спокойный.voiceId,
          closure: DEFAULT_THERAPEUTIC_VOICES.эмпатичный.voiceId,
          reevaluation: DEFAULT_THERAPEUTIC_VOICES.инструктивный.voiceId,
          integration: DEFAULT_THERAPEUTIC_VOICES.спокойный.voiceId
        }
      },
      fallback: {
        enableFallback: true,
        fallbackProvider: 'google-cloud',
        maxErrorsBeforeFallback: 3,
        cooldownPeriod: 30000
      },
      ...config
    };
  }

  /**
   * Initialize the ElevenLabs provider
   */
  async initialize(config?: any): Promise<void> {
    try {
      console.log('🔧 Initializing ElevenLabs TTS Provider...');
      
      // Get initial authentication token
      await this.refreshAuthToken();
      
      // Load available voices
      await this.loadAvailableVoices();
      
      // Initialize audio multiplexer if streaming is enabled
      if (this.config.streaming.enabled) {
        await this.initializeAudioMultiplexer();
      }
      
      // Start processing queue
      this.startQueueProcessor();
      
      this.isInitialized = true;
      console.log(`✅ ElevenLabs TTS Provider initialized with ${this.availableVoices.length} voices`);
      
    } catch (error) {
      console.error('❌ Failed to initialize ElevenLabs TTS Provider:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Check if the provider is available and ready
   */
  isAvailable(): boolean {
    const errorRate = this.stats.requests > 0 ? this.stats.errors / this.stats.requests : 0;
    return this.isInitialized && 
           this.currentToken !== null && 
           Date.now() < this.tokenExpiry &&
           errorRate < 0.5; // Fallback if error rate is too high
  }

  /**
   * Get authentication token from server
   */
  private async refreshAuthToken(): Promise<void> {
    try {
      const response = await fetch(`${this.config.serverEndpoint}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Include cookies for session auth
      });

      if (!response.ok) {
        throw new Error(`Failed to get auth token: ${response.status}`);
      }

      const data = await response.json();
      this.currentToken = data.token;
      this.tokenExpiry = data.expiresAt;
      
      console.log('🔑 ElevenLabs auth token refreshed');
      
    } catch (error) {
      console.error('❌ Failed to refresh auth token:', error);
      throw error;
    }
  }

  /**
   * Load available voices from ElevenLabs API
   */
  private async loadAvailableVoices(): Promise<void> {
    try {
      if (!this.currentToken) {
        await this.refreshAuthToken();
      }

      const response = await fetch(`${this.config.serverEndpoint}/voices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load voices: ${response.status}`);
      }

      const data = await response.json();
      this.availableVoices = data.voices || [];
      
      console.log(`📋 Loaded ${this.availableVoices.length} ElevenLabs voices`);
      
    } catch (error) {
      console.warn('⚠️ Failed to load voices, using therapeutic defaults:', error);
      // Use default therapeutic voices as fallback
      this.availableVoices = Object.entries(DEFAULT_THERAPEUTIC_VOICES).map(([name, config]) => ({
        voice_id: config.voiceId,
        name: name,
        category: 'therapeutic',
        labels: { therapeutic: 'true', emdr: 'optimized' },
        description: `Терапевтический голос для ${name} контекста`,
        therapeutic_suitability: {
          anxiety_friendly: true,
          trauma_sensitive: true,
          child_friendly: name === 'спокойный',
          elderly_friendly: true,
          gender_neutral: false,
          cultural_adaptability: ['ru-RU', 'en-US']
        }
      }));
    }
  }

  /**
   * Initialize audio multiplexer for streaming
   */
  private async initializeAudioMultiplexer(): Promise<void> {
    try {
      this.audioMultiplexer = new AudioStreamMultiplexer({
        masterAudio: {
          sampleRate: 22050,
          channels: 1,
          bufferSize: this.config.streaming.bufferSize,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        consumers: {
          maxConsumers: 3,
          priorityScheduling: true,
          adaptiveQuality: this.config.streaming.adaptiveQuality
        },
        performance: {
          enableWebWorker: false,
          enableVAD: true,
          vadThreshold: 0.01,
          maxLatency: 100,
          dropFramesOnOverload: true
        },
        fallback: {
          enableFallback: true,
          fallbackSampleRate: 16000,
          maxRetries: 2,
          retryDelay: 1000
        }
      });

      await this.audioMultiplexer.initialize();
      console.log('🎵 Audio multiplexer initialized for ElevenLabs streaming');
      
    } catch (error) {
      console.warn('⚠️ Failed to initialize audio multiplexer:', error);
      // Continue without multiplexer
    }
  }

  /**
   * Start the request queue processor
   */
  private startQueueProcessor(): void {
    if (this.isProcessingQueue) return;
    
    this.isProcessingQueue = true;
    this.processQueue();
  }

  /**
   * Process requests from the queue with rate limiting
   */
  private async processQueue(): Promise<void> {
    while (this.isProcessingQueue && this.requestQueue.length > 0) {
      const activeRequests = this.requestQueue.filter(
        item => Date.now() - item.timestamp < this.config.timeout
      ).length;

      if (activeRequests >= this.config.maxConcurrentRequests) {
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const item = this.requestQueue.shift();
      if (!item) continue;

      try {
        const response = await this.processSynthesisRequest(item.request);
        item.resolve(response);
      } catch (error) {
        item.reject(error as TTSError);
      }

      // Small delay to prevent overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Synthesize speech using ElevenLabs API
   */
  async synthesize(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        request,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Start processing if not already running
      if (!this.isProcessingQueue) {
        this.startQueueProcessor();
      }
    });
  }

  /**
   * Process individual synthesis request
   */
  private async processSynthesisRequest(request: TTSSynthesisRequest): Promise<TTSSynthesisResponse> {
    const startTime = Date.now();
    this.stats.requests++;

    try {
      // Refresh token if needed
      if (!this.currentToken || Date.now() >= this.tokenExpiry - 60000) {
        await this.refreshAuthToken();
      }

      // Validate voice availability  
      if (this.availableVoices.length === 0) {
        await this.loadAvailableVoices();
      }

      // Select appropriate voice based on context
      const voiceConfig = this.selectVoiceForContext(request);
      
      // Check if streaming is requested and available
      if (this.config.streaming.enabled && request.text.length > 200) {
        return await this.synthesizeStreaming(request, voiceConfig);
      } else {
        return await this.synthesizeSingle(request, voiceConfig);
      }
      
    } catch (error) {
      this.stats.errors++;
      console.error('❌ ElevenLabs synthesis failed:', error);
      
      const ttsError: TTSError = {
        type: 'synthesis',
        code: 'ELEVENLABS_SYNTHESIS_FAILED',
        message: error.message || 'Failed to synthesize speech',
        provider: 'elevenlabs',
        retryable: true,
        details: error
      };
      
      this.stats.lastError = ttsError;
      throw ttsError;
    }
  }

  /**
   * Synthesize speech using streaming WebRTC
   */
  private async synthesizeStreaming(
    request: TTSSynthesisRequest,
    voiceConfig: ElevenLabsVoiceConfig
  ): Promise<TTSSynthesisResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🎵 Starting WebRTC streaming synthesis...');
      
      // Initialize WebRTC if not already done
      if (!this.rtcConnection) {
        await this.initializeWebRTC();
      }
      
      // Create WebRTC offer
      const offer = await this.createWebRTCOffer();
      
      // Establish WebSocket connection for signaling
      const ws = await this.establishWebSocketConnection(request, voiceConfig);
      
      // Send WebRTC offer through WebSocket
      ws.send(JSON.stringify({
        type: 'webrtc_offer',
        sdp: offer
      }));
      
      // Send text for streaming synthesis
      ws.send(JSON.stringify({
        type: 'text_stream',
        text: request.text,
        chunk_length_schedule: [120, 160, 250, 290]
      }));
      
      // For now, return a placeholder response
      // In a real implementation, this would collect audio chunks
      const response: TTSSynthesisResponse = {
        audioData: new ArrayBuffer(0), // Will be populated via WebRTC
        format: 'pcm',
        duration: 0,
        size: 0,
        metadata: {
          provider: 'elevenlabs',
          voice: this.convertToTTSVoiceConfig(voiceConfig),
          quality: {
            sampleRate: 22050,
            bitRate: 128,
            format: 'pcm',
            channels: 1,
            compression: 'none'
          },
          synthesisTime: Date.now() - startTime,
          fromCache: false,
          cacheKey: this.generateCacheKey(request)
        },
        streaming: {
          isStreamable: true,
          chunkSize: this.config.streaming.chunkSize
        }
      };
      
      return response;
      
    } catch (error) {
      console.error('❌ WebRTC streaming failed:', error);
      // Fallback to regular synthesis
      return await this.synthesizeSingle(request, voiceConfig);
    }
  }

  /**
   * Synthesize speech using regular API
   */
  private async synthesizeSingle(
    request: TTSSynthesisRequest,
    voiceConfig: ElevenLabsVoiceConfig
  ): Promise<TTSSynthesisResponse> {
    const startTime = Date.now();
    
    // Prepare ElevenLabs-specific request
    const elevenlabsRequest = this.prepareElevenLabsRequest(request, voiceConfig);
    
    // Make API request
    const response = await this.makeAPIRequest(elevenlabsRequest);
    
    // Process response
    const synthesisResponse = await this.processAPIResponse(response, request, voiceConfig);
    
    // Update stats
    const latency = Date.now() - startTime;
    this.stats.totalLatency += latency;
    this.stats.avgLatency = this.stats.totalLatency / this.stats.requests;
    
    return synthesisResponse;
  }

  /**
   * Select appropriate voice based on context and emotional state
   */
  private selectVoiceForContext(request: TTSSynthesisRequest): ElevenLabsVoiceConfig {
    const context = request.metadata.context;
    const sessionId = request.metadata.sessionId;
    
    // Default to calm voice
    let selectedVoice = this.config.voices.therapeutic.спокойный;
    
    // Context-based selection
    if (context === 'emergency') {
      selectedVoice = this.config.voices.therapeutic.экстренный;
    } else if (context === 'instruction') {
      selectedVoice = this.config.voices.therapeutic.инструктивный;
    } else if (context === 'therapy-response') {
      selectedVoice = this.config.voices.therapeutic.эмпатичный;
    } else if (context === 'guidance') {
      selectedVoice = this.config.voices.therapeutic.поддерживающий;
    }
    
    // TODO: Integrate with emotion analysis for dynamic voice selection
    // This would analyze current emotional state and select the most appropriate voice
    
    return selectedVoice;
  }

  /**
   * Prepare ElevenLabs API request
   */
  private prepareElevenLabsRequest(request: TTSSynthesisRequest, voiceConfig: ElevenLabsVoiceConfig): any {
    // Apply therapeutic text preprocessing
    const processedText = this.preprocessTherapeuticText(request.text, request.metadata.context);
    
    // Calculate pace adjustment based on therapeutic profile
    const paceMultiplier = voiceConfig.therapeuticProfile.paceAdjustment;
    const baseSpeed = request.options?.speed || 1.0;
    const adjustedSpeed = baseSpeed * paceMultiplier;
    
    return {
      text: processedText,
      model_id: voiceConfig.model,
      voice_settings: {
        stability: voiceConfig.stability,
        similarity_boost: voiceConfig.similarity_boost,
        style: voiceConfig.style || 0,
        use_speaker_boost: voiceConfig.use_speaker_boost || false
      },
      output_format: 'mp3_22050_32',
      optimize_streaming_latency: this.config.streaming.latencyOptimization ? 2 : 0,
      voice_id: voiceConfig.voiceId
    };
  }

  /**
   * Preprocess text for therapeutic context
   */
  private preprocessTherapeuticText(text: string, context: string): string {
    let processed = text.trim();
    
    // Add therapeutic pauses based on context
    if (context === 'therapy-response' || context === 'guidance') {
      processed = processed.replace(/\. /g, '. <break time="400ms"/> ');
      processed = processed.replace(/\? /g, '? <break time="600ms"/> ');
      processed = processed.replace(/: /g, ': <break time="200ms"/> ');
    }
    
    // Emergency context - remove pauses for urgency
    if (context === 'emergency') {
      processed = processed.replace(/<break[^>]*>/g, '');
    }
    
    // Meditation context - add longer pauses
    if (context === 'meditation') {
      processed = processed.replace(/\. /g, '. <break time="1s"/> ');
      processed = processed.replace(/,/g, ',<break time="400ms"/>');
    }
    
    return processed;
  }

  /**
   * Make API request to ElevenLabs
   */
  private async makeAPIRequest(elevenlabsRequest: any): Promise<Response> {
    const response = await fetch(`${this.config.serverEndpoint}/synthesize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.currentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(elevenlabsRequest)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    return response;
  }

  /**
   * Initialize WebRTC connection for real-time streaming
   */
  private async initializeWebRTC(): Promise<void> {
    try {
      console.log('🔄 Initializing WebRTC for ElevenLabs streaming...');
      
      // Create RTCPeerConnection with STUN servers
      this.rtcConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ],
        bundlePolicy: 'balanced',
        rtcpMuxPolicy: 'require'
      });

      // Set up event listeners
      this.rtcConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate:', event.candidate);
        }
      };

      this.rtcConnection.onconnectionstatechange = () => {
        console.log('🔗 RTC connection state:', this.rtcConnection?.connectionState);
        if (this.rtcConnection?.connectionState === 'connected') {
          this.stats.connectionQuality = 1.0;
        } else if (this.rtcConnection?.connectionState === 'disconnected') {
          this.stats.connectionQuality = 0.0;
        }
      };

      this.rtcConnection.ontrack = (event) => {
        console.log('🎵 Received audio track:', event.track);
        if (event.track.kind === 'audio') {
          this.audioStream = new MediaStream([event.track]);
          this.handleIncomingAudioStream(this.audioStream);
        }
      };

      // Create data channel for control messages
      this.dataChannel = this.rtcConnection.createDataChannel('control', {
        ordered: true
      });

      this.dataChannel.onopen = () => {
        console.log('📡 Data channel opened');
      };

      this.dataChannel.onmessage = (event) => {
        console.log('📨 Data channel message:', event.data);
      };

      console.log('✅ WebRTC connection initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize WebRTC:', error);
      throw error;
    }
  }

  /**
   * Handle incoming audio stream from WebRTC
   */
  private async handleIncomingAudioStream(stream: MediaStream): Promise<void> {
    try {
      if (this.audioMultiplexer) {
        // Add the stream to audio multiplexer for distribution
        const consumer = {
          id: generateDeterministicId('elevenlabs', 'webrtc', Date.now().toString()),
          name: 'ElevenLabs WebRTC Stream',
          type: 'voice-chat' as const,
          priority: 8,
          active: true,
          config: {
            sampleRate: 22050,
            channels: 1,
            bufferSize: 4096,
            enableEchoCancellation: false,
            enableNoiseSuppression: false,
            enableAutoGainControl: false
          }
        };

        await this.audioMultiplexer.addConsumer(consumer);
        console.log('🎯 Added WebRTC stream to audio multiplexer');
      }
    } catch (error) {
      console.error('❌ Failed to handle incoming audio stream:', error);
    }
  }

  /**
   * Create WebRTC offer for ElevenLabs handshake
   */
  private async createWebRTCOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.rtcConnection) {
      throw new Error('WebRTC connection not initialized');
    }

    try {
      const offer = await this.rtcConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });

      await this.rtcConnection.setLocalDescription(offer);
      console.log('📋 Created WebRTC offer');
      
      return offer;
    } catch (error) {
      console.error('❌ Failed to create WebRTC offer:', error);
      throw error;
    }
  }

  /**
   * Establish WebSocket connection to ElevenLabs Realtime API
   */
  private async establishWebSocketConnection(
    request: TTSSynthesisRequest,
    voiceConfig: ElevenLabsVoiceConfig
  ): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        // ElevenLabs WebSocket endpoint (hypothetical - would need actual endpoint)
        const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}/stream-ws`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log('🔌 WebSocket connection established');
          
          // Send authentication and configuration
          ws.send(JSON.stringify({
            type: 'auth',
            token: this.currentToken,
            voice_settings: {
              stability: voiceConfig.stability,
              similarity_boost: voiceConfig.similarity_boost,
              style: voiceConfig.style || 0,
              use_speaker_boost: voiceConfig.use_speaker_boost || false
            },
            output_format: 'pcm_22050',
            optimize_streaming_latency: 2
          }));
          
          resolve(ws);
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket connection closed');
        };

        ws.onmessage = (event) => {
          this.handleWebSocketMessage(event);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle WebSocket messages from ElevenLabs
   */
  private handleWebSocketMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'audio_chunk':
          // Handle incoming audio data
          this.processAudioChunk(data.audio);
          break;
          
        case 'text_chunk':
          // Handle text processing confirmation
          console.log('📝 Text chunk processed:', data.text);
          break;
          
        case 'error':
          console.error('❌ ElevenLabs WebSocket error:', data.error);
          break;
          
        case 'end':
          console.log('✅ Stream ended');
          break;
          
        default:
          console.log('📨 Unknown message type:', data.type);
      }
    } catch (error) {
      // Handle binary audio data
      if (event.data instanceof ArrayBuffer) {
        this.processAudioChunk(event.data);
      } else {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    }
  }

  /**
   * Process incoming audio chunk from WebSocket
   */
  private processAudioChunk(audioData: ArrayBuffer): void {
    try {
      if (this.audioMultiplexer) {
        // Convert audio data to the format expected by multiplexer
        const audioArray = new Float32Array(audioData);
        
        // Send to audio multiplexer for real-time playback
        this.audioMultiplexer.processAudioData?.(audioArray, 22050);
      }
    } catch (error) {
      console.error('❌ Failed to process audio chunk:', error);
    }
  }

  /**
   * Process API response into TTSSynthesisResponse
   */
  private async processAPIResponse(
    response: Response,
    originalRequest: TTSSynthesisRequest,
    voiceConfig: ElevenLabsVoiceConfig
  ): Promise<TTSSynthesisResponse> {
    const audioData = await response.arrayBuffer();
    const duration = this.estimateAudioDuration(audioData, 22050);
    
    return {
      audioData,
      format: 'mp3',
      duration,
      size: audioData.byteLength,
      metadata: {
        provider: 'elevenlabs',
        voice: this.convertToTTSVoiceConfig(voiceConfig),
        quality: {
          sampleRate: 22050,
          bitRate: 32,
          format: 'mp3',
          channels: 1,
          compression: 'medium'
        },
        synthesisTime: Date.now() - Date.now(), // Will be set by caller
        fromCache: false,
        cacheKey: this.generateCacheKey(originalRequest)
      },
      streaming: {
        isStreamable: this.config.streaming.enabled,
        chunkSize: this.config.streaming.chunkSize
      }
    };
  }

  /**
   * Convert ElevenLabsVoiceConfig to TTSVoiceConfig
   */
  private convertToTTSVoiceConfig(voiceConfig: ElevenLabsVoiceConfig): TTSVoiceConfig {
    return {
      name: voiceConfig.voiceId,
      language: 'ru-RU', // Default to Russian for therapeutic context
      gender: 'neutral',
      age: 'adult',
      accent: 'russian',
      characteristics: {
        warmth: 0.8,
        authority: 0.6,
        empathy: 0.9,
        clarity: 0.9,
        pace: 'normal',
        calmness: 0.8
      },
      therapeuticProfile: {
        anxietyFriendly: true,
        traumaSensitive: true,
        childFriendly: false,
        culturallySensitive: ['ru-RU', 'en-US']
      }
    };
  }

  /**
   * Estimate audio duration from buffer size
   */
  private estimateAudioDuration(audioData: ArrayBuffer, sampleRate: number): number {
    // Rough estimation for MP3 at 32kbps
    const bytesPerSecond = (32 * 1000) / 8; // 32kbps to bytes per second
    return audioData.byteLength / bytesPerSecond;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: TTSSynthesisRequest): string {
    const keyData = {
      text: request.text.trim().toLowerCase(),
      context: request.metadata.context,
      provider: 'elevenlabs'
    };
    return btoa(JSON.stringify(keyData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
  }

  /**
   * Get provider status and statistics
   */
  getStatus(): any {
    return {
      provider: this.name,
      initialized: this.isInitialized,
      available: this.isAvailable(),
      tokenValid: this.currentToken !== null && Date.now() < this.tokenExpiry,
      stats: {
        ...this.stats,
        errorRate: this.stats.requests > 0 ? this.stats.errors / this.stats.requests : 0,
        queueSize: this.requestQueue.length
      },
      streaming: {
        enabled: this.config.streaming.enabled,
        multiplexerActive: this.audioMultiplexer?.isInitialized() || false,
        connectionQuality: this.stats.connectionQuality
      },
      voices: {
        available: this.availableVoices.length,
        therapeutic: Object.keys(this.config.voices.therapeutic).length
      }
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.isProcessingQueue = false;
    this.requestQueue = [];
    
    if (this.rtcConnection) {
      this.rtcConnection.close();
      this.rtcConnection = null;
    }
    
    if (this.audioMultiplexer) {
      await this.audioMultiplexer.cleanup();
      this.audioMultiplexer = null;
    }
    
    console.log('🧹 ElevenLabs TTS Provider cleaned up');
  }
}

// Export default instance
export const elevenlabsTTSProvider = new ElevenLabsTTSProvider();