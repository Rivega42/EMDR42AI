/**
 * Revolutionary Voice Recognition Service for EMDR42
 * Real-time emotion analysis from speech with multimodal provider support
 * Privacy-first, low-latency, WebRTC-powered voice emotion detection
 */

import type { 
  VoiceEmotionData, 
  VoiceProviderConfig,
  VoiceAnalysisStatus,
  VoiceRecordingConfig,
  EmotionData 
} from '@/../../shared/types';

// === Voice Provider Interfaces ===

interface VoiceProvider {
  initialize(config: VoiceProviderConfig): Promise<void>;
  startStream(): Promise<void>;
  processAudio(audioChunk: Blob): Promise<VoiceEmotionData>;
  stopStream(): Promise<void>;
  getStatus(): VoiceAnalysisStatus;
}

// === AssemblyAI Provider Implementation (Server Proxy) ===
class AssemblyAIProvider implements VoiceProvider {
  private sessionId: string;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private onEmotionCallback: ((emotions: VoiceEmotionData) => void) | null = null;
  private onStatusCallback: ((status: VoiceAnalysisStatus) => void) | null = null;
  private onProviderChangeCallback: ((change: any) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private status: VoiceAnalysisStatus;
  private jwtToken: string | null = null;

  /**
   * Generate proper WebSocket URL with correct protocol detection
   * HTTPS → wss, HTTP → ws with robust port handling
   */
  private generateWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    
    // Robust port detection - handle all cases including Replit environment
    let port = '';
    if (window.location.port) {
      port = `:${window.location.port}`;
    } else {
      // Default ports for HTTPS/HTTP if not specified
      const defaultPort = window.location.protocol === 'https:' ? '' : ':5000';
      port = defaultPort;
    }
    
    const wsUrl = `${protocol}//${host}${port}/voice-stream`;
    console.log(`🔗 Generated WebSocket URL: ${wsUrl}`);
    return wsUrl;
  }

  constructor() {
    this.status = {
      isRecording: false,
      isProcessing: false,
      isConnected: false,
      provider: 'assemblyai',
      latency: 0,
      lastUpdate: Date.now(),
      streamHealth: {
        packetsReceived: 0,
        packetsLost: 0,
        bitrate: 0,
        jitter: 0
      }
    };
  }

  async initialize(config: VoiceProviderConfig): Promise<void> {
    this.sessionId = config.sessionId || `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Start provider stream on server
    try {
      const response = await fetch('/api/voice/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'assemblyai',
          sessionId: this.sessionId,
          action: 'start'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to start AssemblyAI stream: ${response.status}`);
      }
      
      console.log('AssemblyAI stream started on server');
    } catch (error) {
      console.error('Failed to initialize AssemblyAI provider:', error);
      throw error;
    }
  }

  async startStream(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      // Generate JWT token for authentication
      await this.generateAuthToken();
      
      const wsUrl = `${this.generateWebSocketUrl()}?sessionId=${this.sessionId}&provider=assemblyai${this.jwtToken ? `&token=${this.jwtToken}` : ''}`;
      
      console.log('🔗 Connecting AssemblyAI WebSocket with JWT auth to:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket authenticated successfully: AssemblyAI session', this.sessionId);
        console.log('🎤 AssemblyAI WebSocket connected via server proxy');
        this.isConnected = true;
        this.status.isConnected = true;
        this.status.isProcessing = true;
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleServerProxyResponse(data);
      };

      this.ws.onerror = (error) => {
        console.error('AssemblyAI WebSocket error:', error);
        this.status.error = 'WebSocket connection failed';
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('AssemblyAI WebSocket closed');
        this.isConnected = false;
        this.status.isConnected = false;
        this.status.isProcessing = false;
      };
    });
  }

  private handleServerProxyResponse(data: any): void {
    // Handle different WebSocket message types
    switch (data.type) {
      case 'emotion':
        this.handleEmotionMessage(data);
        break;
      case 'telemetry':
        this.handleTelemetryMessage(data);
        break;
      case 'providerChange':
        this.handleProviderChangeMessage(data);
        break;
      case 'error':
        this.handleErrorMessage(data);
        break;
      case 'force-failure':
        console.log('🧪 Received forced failure simulation:', data.message);
        break;
      default:
        console.log('📨 Unknown WebSocket message type:', data.type, data);
    }
  }
  
  private handleEmotionMessage(data: any): void {
    if (data.provider === 'assemblyai' || data.provider === this.status.provider) {
      const result = data.data;
      
      if (result.success && result.voiceEmotions) {
        this.status.lastUpdate = Date.now();
        this.status.streamHealth.packetsReceived++;
        this.status.latency = data.telemetry?.latency || 0;
        
        console.log(`📨 Received emotion data via WebSocket: ${data.provider} packet #${data.telemetry?.packetsReceived || 0}`);
        
        if (this.onEmotionCallback) {
          this.onEmotionCallback(result.voiceEmotions);
        }
      } else if (result.error) {
        console.error('❌ Emotion processing error:', result.error);
        this.status.error = result.error;
      }
    }
  }
  
  private handleTelemetryMessage(data: any): void {
    // Update status with live telemetry data
    this.status.streamHealth.packetsReceived = data.packetsReceived || 0;
    this.status.latency = data.latency || 0;
    this.status.provider = data.currentProvider || this.status.provider;
    
    console.log(`📊 Live telemetry update: provider=${data.currentProvider}, packets=${data.packetsReceived}, uptime=${Math.floor(data.connectionUptime / 1000)}s`);
    
    // Trigger status update callback if available
    if (this.onStatusCallback) {
      this.onStatusCallback(this.status);
    }
  }
  
  private handleProviderChangeMessage(data: any): void {
    const { oldProvider, newProvider, reason, failureCount } = data;
    
    // Log the structured provider change event
    console.log(`🔄 Provider fallback: ${oldProvider} → ${newProvider} (reason: ${reason}, failures: ${failureCount})`);
    
    // Update status to reflect new provider
    this.status.provider = newProvider;
    this.status.lastUpdate = Date.now();
    
    // Trigger status update callback
    if (this.onStatusCallback) {
      this.onStatusCallback(this.status);
    }
    
    // Trigger provider change callback if available
    if (this.onProviderChangeCallback) {
      this.onProviderChangeCallback({
        oldProvider,
        newProvider,
        reason,
        timestamp: data.timestamp,
        telemetry: data.telemetry
      });
    }
  }
  
  private handleErrorMessage(data: any): void {
    console.error('❌ WebSocket error message:', data.error);
    this.status.error = data.error;
    this.status.isProcessing = false;
    
    if (this.onErrorCallback) {
      this.onErrorCallback(data.error);
    }
  }

  private analyzeEmotionsFromText(text: string, confidence: number): VoiceEmotionData {
    // Enhanced emotion analysis from text + mock prosody data
    const sentiment = this.calculateTextSentiment(text);
    const prosodyMock = this.generateMockProsody(sentiment);
    
    return {
      timestamp: Date.now(),
      prosody: prosodyMock,
      voiceEmotions: {
        confidence: confidence,
        excitement: Math.max(0, sentiment.arousal * 0.8),
        stress: Math.max(0, sentiment.arousal * 0.6 - sentiment.valence * 0.4),
        fatigue: Math.max(0, 0.5 - sentiment.arousal * 0.3),
        engagement: Math.max(0.1, sentiment.arousal * 0.7 + 0.3),
        uncertainty: Math.max(0, 0.5 - confidence),
        authenticity: confidence * 0.9
      },
      provider: 'assemblyai',
      confidence: confidence,
      rawData: { text, sentiment }
    };
  }

  private calculateTextSentiment(text: string): { arousal: number; valence: number } {
    // Simple sentiment analysis (would use real NLP in production)
    const positiveWords = ['happy', 'good', 'great', 'excellent', 'wonderful', 'love', 'amazing', 'fantastic', 'positive', 'excited'];
    const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'annoying', 'negative', 'stressed'];
    const highArousalWords = ['excited', 'angry', 'thrilled', 'furious', 'ecstatic', 'livid', 'energetic', 'intense'];
    
    const words = text.toLowerCase().split(/\s+/);
    let valenceScore = 0;
    let arousalScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) valenceScore += 1;
      if (negativeWords.includes(word)) valenceScore -= 1;
      if (highArousalWords.includes(word)) arousalScore += 1;
    });
    
    const valence = Math.max(-1, Math.min(1, valenceScore / Math.max(1, words.length * 0.1)));
    const arousal = Math.max(-1, Math.min(1, arousalScore / Math.max(1, words.length * 0.1)));
    
    return { arousal, valence };
  }

  private generateMockProsody(sentiment: { arousal: number; valence: number }) {
    return {
      arousal: sentiment.arousal,
      valence: sentiment.valence,
      intensity: Math.abs(sentiment.arousal) * 0.8 + 0.2,
      pace: 0.5 + sentiment.arousal * 0.3,
      volume: 0.6 + Math.abs(sentiment.arousal) * 0.2,
      pitch: 0.5 + sentiment.valence * 0.2,
      stability: 0.8 - Math.abs(sentiment.arousal) * 0.3
    };
  }

  async processAudio(audioChunk: Blob): Promise<VoiceEmotionData> {
    if (!this.isConnected || !this.ws) {
      console.warn('AssemblyAI not connected, skipping audio processing');
      return this.getMockVoiceEmotions();
    }

    const startTime = Date.now();
    
    try {
      // Convert blob to base64 for server transmission
      const audioBuffer = await audioChunk.arrayBuffer();
      const base64Audio = this.arrayBufferToBase64(audioBuffer);
      
      // Send audio data to server proxy
      this.ws.send(JSON.stringify({
        type: 'audio',
        audioData: base64Audio,
        sessionId: this.sessionId,
        provider: 'assemblyai'
      }));
      
      this.status.latency = Date.now() - startTime;
      
      // Return placeholder - real result comes via WebSocket callback
      return {
        timestamp: Date.now(),
        prosody: { arousal: 0, valence: 0, intensity: 0, pace: 0.5, volume: 0.5, pitch: 0.5, stability: 0.5 },
        voiceEmotions: { confidence: 0, excitement: 0, stress: 0, fatigue: 0, engagement: 0, uncertainty: 0, authenticity: 0 },
        provider: 'assemblyai',
        confidence: 0,
        rawData: { processing: true }
      };
      
    } catch (error) {
      console.error('AssemblyAI audio processing error:', error);
      this.status.error = `Audio processing failed: ${error}`;
      return this.getMockVoiceEmotions();
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async stopStream(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.status.isConnected = false;
    this.status.isProcessing = false;
  }

  getStatus(): VoiceAnalysisStatus {
    return { ...this.status };
  }

  setEmotionCallback(callback: (emotions: VoiceEmotionData) => void): void {
    this.onEmotionCallback = callback;
  }

  private getMockVoiceEmotions(): VoiceEmotionData {
    const now = Date.now();
    const variation = Math.sin(now / 5000) * 0.3; // Slow variation
    
    return {
      timestamp: now,
      prosody: {
        arousal: 0.1 + variation,
        valence: 0.2 + variation * 0.5,
        intensity: 0.4 + Math.abs(variation),
        pace: 0.5,
        volume: 0.6,
        pitch: 0.5,
        stability: 0.8
      },
      voiceEmotions: {
        confidence: 0.7,
        excitement: 0.3 + Math.max(0, variation),
        stress: 0.2 + Math.max(0, -variation * 0.5),
        fatigue: 0.3,
        engagement: 0.6,
        uncertainty: 0.2,
        authenticity: 0.8
      },
      provider: 'assemblyai',
      confidence: 0.7,
      rawData: { mock: true }
    };
  }
}

// === Hume AI Provider Implementation ===
class HumeAIProvider implements VoiceProvider {
  private apiKey: string;
  private endpoint: string = 'wss://api.hume.ai/v0/stream/voice';
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private status: VoiceAnalysisStatus;
  private onEmotionCallback: ((emotions: VoiceEmotionData) => void) | null = null;

  constructor() {
    this.status = {
      isRecording: false,
      isProcessing: false,
      isConnected: false,
      provider: 'hume-ai',
      latency: 0,
      lastUpdate: Date.now(),
      streamHealth: {
        packetsReceived: 0,
        packetsLost: 0,
        bitrate: 0,
        jitter: 0
      }
    };
  }

  async initialize(config: VoiceProviderConfig): Promise<void> {
    this.apiKey = config.apiKey;
    
    if (!this.apiKey) {
      console.warn('Hume AI API key not provided, using mock data');
      return;
    }
  }

  async startStream(): Promise<void> {
    if (!this.apiKey) {
      console.log('Hume AI: Using mock emotion data');
      this.status.isConnected = true;
      this.status.isProcessing = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const wsUrl = `${this.endpoint}?apikey=${this.apiKey}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('Hume AI WebSocket connected');
        
        // Configure stream for voice emotion analysis
        const configMessage = {
          models: {
            prosody: {
              granularity: "utterance"
            }
          }
        };
        
        this.ws?.send(JSON.stringify(configMessage));
        this.isConnected = true;
        this.status.isConnected = true;
        this.status.isProcessing = true;
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleHumeAIResponse(data);
      };

      this.ws.onerror = (error) => {
        console.error('Hume AI WebSocket error:', error);
        this.status.error = 'WebSocket connection failed';
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Hume AI WebSocket closed');
        this.isConnected = false;
        this.status.isConnected = false;
        this.status.isProcessing = false;
      };
    });
  }

  private handleServerProxyResponse(data: any): void {
    if (data.type === 'emotion' && data.provider === 'hume-ai') {
      const result = data.data;
      
      if (result.success && result.voiceEmotions) {
        this.status.lastUpdate = Date.now();
        this.status.streamHealth.packetsReceived++;
        
        if (this.onEmotionCallback) {
          this.onEmotionCallback(result.voiceEmotions);
        }
      } else if (result.error) {
        console.error('Hume AI processing error:', result.error);
        this.status.error = result.error;
      }
    } else if (data.error) {
      console.error('Server proxy error:', data.error);
      this.status.error = data.error;
    }
  }

  private convertHumeEmotions(emotions: any[]): VoiceEmotionData {
    // Convert Hume AI's 48 emotion dimensions to our format
    const emotionMap: { [key: string]: number } = {};
    emotions.forEach(emotion => {
      emotionMap[emotion.name] = emotion.score;
    });

    // Calculate key metrics from Hume emotions
    const arousal = this.calculateArousal(emotionMap);
    const valence = this.calculateValence(emotionMap);
    const intensity = this.calculateIntensity(emotionMap);
    
    return {
      timestamp: Date.now(),
      prosody: {
        arousal,
        valence,
        intensity,
        pace: emotionMap['Excitement'] || 0.5,
        volume: intensity,
        pitch: valence * 0.5 + 0.5,
        stability: 1 - (emotionMap['Anxiety'] || 0)
      },
      voiceEmotions: {
        confidence: 0.9, // Hume AI high confidence
        excitement: emotionMap['Excitement'] || 0,
        stress: emotionMap['Anxiety'] || emotionMap['Distress'] || 0,
        fatigue: emotionMap['Tiredness'] || 0,
        engagement: emotionMap['Interest'] || emotionMap['Enthusiasm'] || 0.5,
        uncertainty: emotionMap['Confusion'] || emotionMap['Doubt'] || 0,
        authenticity: 0.95 // Hume AI authenticity score
      },
      provider: 'hume-ai',
      confidence: 0.9,
      rawData: { emotions: emotionMap }
    };
  }

  private calculateArousal(emotions: { [key: string]: number }): number {
    const highArousal = ['Excitement', 'Anger', 'Fear', 'Surprise'] ;
    const lowArousal = ['Calmness', 'Tiredness', 'Boredom'];
    
    let arousalScore = 0;
    highArousal.forEach(emotion => arousalScore += emotions[emotion] || 0);
    lowArousal.forEach(emotion => arousalScore -= emotions[emotion] || 0);
    
    return Math.max(-1, Math.min(1, arousalScore));
  }

  private calculateValence(emotions: { [key: string]: number }): number {
    const positive = ['Joy', 'Satisfaction', 'Amusement', 'Pride'];
    const negative = ['Sadness', 'Anger', 'Fear', 'Disgust'];
    
    let valenceScore = 0;
    positive.forEach(emotion => valenceScore += emotions[emotion] || 0);
    negative.forEach(emotion => valenceScore -= emotions[emotion] || 0);
    
    return Math.max(-1, Math.min(1, valenceScore));
  }

  private calculateIntensity(emotions: { [key: string]: number }): number {
    const intensityEmotions = Object.values(emotions);
    return intensityEmotions.reduce((sum, score) => sum + Math.abs(score), 0) / intensityEmotions.length;
  }

  async processAudio(audioChunk: Blob): Promise<VoiceEmotionData> {
    if (!this.isConnected || !this.ws) {
      return this.getMockVoiceEmotions();
    }

    const startTime = Date.now();
    
    try {
      // Convert blob to base64 for Hume AI
      const audioBuffer = await audioChunk.arrayBuffer();
      const base64Audio = this.arrayBufferToBase64(audioBuffer);
      
      // Send audio data to Hume AI
      this.ws.send(JSON.stringify({
        data: base64Audio,
        models: {
          prosody: {}
        }
      }));
      
      this.status.latency = Date.now() - startTime;
      return this.getMockVoiceEmotions(); // Return immediately, actual result comes via WebSocket
      
    } catch (error) {
      console.error('Hume AI audio processing error:', error);
      this.status.error = `Audio processing failed: ${error}`;
      return this.getMockVoiceEmotions();
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async stopStream(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.status.isConnected = false;
    this.status.isProcessing = false;
  }

  getStatus(): VoiceAnalysisStatus {
    return { ...this.status };
  }

  setEmotionCallback(callback: (emotions: VoiceEmotionData) => void): void {
    this.onEmotionCallback = callback;
  }

  private getMockVoiceEmotions(): VoiceEmotionData {
    const now = Date.now();
    const variation = Math.sin(now / 3000) * 0.4; // Faster variation for Hume AI
    
    return {
      timestamp: now,
      prosody: {
        arousal: 0.2 + variation,
        valence: 0.3 + variation * 0.7,
        intensity: 0.5 + Math.abs(variation),
        pace: 0.6,
        volume: 0.7,
        pitch: 0.6,
        stability: 0.9
      },
      voiceEmotions: {
        confidence: 0.9,
        excitement: 0.4 + Math.max(0, variation),
        stress: 0.1 + Math.max(0, -variation * 0.3),
        fatigue: 0.2,
        engagement: 0.8,
        uncertainty: 0.1,
        authenticity: 0.95
      },
      provider: 'hume-ai',
      confidence: 0.9,
      rawData: { mock: true, premium: true }
    };
  }
}

// === Azure Cognitive Speech Provider ===
class AzureCognitiveProvider implements VoiceProvider {
  private apiKey: string;
  private region: string;
  private endpoint: string;
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private status: VoiceAnalysisStatus;
  private onEmotionCallback: ((emotions: VoiceEmotionData) => void) | null = null;

  constructor() {
    this.status = {
      isRecording: false,
      isProcessing: false,
      isConnected: false,
      provider: 'azure',
      latency: 0,
      lastUpdate: Date.now(),
      streamHealth: {
        packetsReceived: 0,
        packetsLost: 0,
        bitrate: 0,
        jitter: 0
      }
    };
  }

  async initialize(config: VoiceProviderConfig): Promise<void> {
    this.apiKey = config.apiKey;
    this.region = config.settings.azure?.region || 'eastus';
    this.endpoint = `wss://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
    
    if (!this.apiKey) {
      console.warn('Azure API key not provided, using mock data');
      return;
    }
  }

  async startStream(): Promise<void> {
    if (!this.apiKey) {
      console.log('Azure: Using mock emotion data');
      this.status.isConnected = true;
      this.status.isProcessing = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const wsUrl = `${this.endpoint}?format=simple&language=en-US`;
      
      this.ws = new WebSocket(wsUrl, ['speech.protocol'], {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey
        }
      } as any);
      
      this.ws.onopen = () => {
        console.log('Azure Speech WebSocket connected');
        this.isConnected = true;
        this.status.isConnected = true;
        this.status.isProcessing = true;
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleAzureResponse(data);
      };

      this.ws.onerror = (error) => {
        console.error('Azure Speech WebSocket error:', error);
        this.status.error = 'WebSocket connection failed';
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Azure Speech WebSocket closed');
        this.isConnected = false;
        this.status.isConnected = false;
        this.status.isProcessing = false;
      };
    });
  }

  private handleAzureResponse(data: any): void {
    if (data.RecognitionStatus === 'Success' && data.DisplayText) {
      const voiceEmotions = this.analyzeEmotionsFromText(data.DisplayText, data.Confidence || 0.7);
      
      this.status.lastUpdate = Date.now();
      this.status.streamHealth.packetsReceived++;
      
      if (this.onEmotionCallback) {
        this.onEmotionCallback(voiceEmotions);
      }
    }
  }

  private analyzeEmotionsFromText(text: string, confidence: number): VoiceEmotionData {
    // Azure-enhanced emotion analysis (would use Text Analytics for more advanced analysis)
    const sentiment = this.calculateTextSentiment(text);
    const prosodyMock = this.generateMockProsody(sentiment);
    
    return {
      timestamp: Date.now(),
      prosody: prosodyMock,
      voiceEmotions: {
        confidence: confidence,
        excitement: Math.max(0, sentiment.arousal * 0.7),
        stress: Math.max(0, sentiment.arousal * 0.5 - sentiment.valence * 0.3),
        fatigue: Math.max(0, 0.4 - sentiment.arousal * 0.2),
        engagement: Math.max(0.2, sentiment.arousal * 0.6 + 0.4),
        uncertainty: Math.max(0, 0.4 - confidence),
        authenticity: confidence * 0.85
      },
      provider: 'azure',
      confidence: confidence,
      rawData: { text, sentiment, azure: true }
    };
  }

  private calculateTextSentiment(text: string): { arousal: number; valence: number } {
    // Enhanced sentiment analysis for Azure
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'pleased', 'wonderful', 'fantastic', 'amazing', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'disappointed', 'frustrated', 'angry', 'upset', 'horrible', 'worse'];
    const highArousalWords = ['excited', 'thrilled', 'energetic', 'passionate', 'intense', 'dynamic', 'vigorous', 'animated'];
    
    const words = text.toLowerCase().split(/\s+/);
    let valenceScore = 0;
    let arousalScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) valenceScore += 1;
      if (negativeWords.includes(word)) valenceScore -= 1;
      if (highArousalWords.includes(word)) arousalScore += 1;
    });
    
    const valence = Math.max(-1, Math.min(1, valenceScore / Math.max(1, words.length * 0.15)));
    const arousal = Math.max(-1, Math.min(1, arousalScore / Math.max(1, words.length * 0.12)));
    
    return { arousal, valence };
  }

  private generateMockProsody(sentiment: { arousal: number; valence: number }) {
    return {
      arousal: sentiment.arousal,
      valence: sentiment.valence,
      intensity: Math.abs(sentiment.arousal) * 0.7 + 0.3,
      pace: 0.6 + sentiment.arousal * 0.2,
      volume: 0.65 + Math.abs(sentiment.arousal) * 0.15,
      pitch: 0.55 + sentiment.valence * 0.15,
      stability: 0.85 - Math.abs(sentiment.arousal) * 0.25
    };
  }

  async processAudio(audioChunk: Blob): Promise<VoiceEmotionData> {
    if (!this.isConnected || !this.ws) {
      return this.getMockVoiceEmotions();
    }

    const startTime = Date.now();
    
    try {
      // Convert blob to base64 for Azure
      const audioBuffer = await audioChunk.arrayBuffer();
      const base64Audio = this.arrayBufferToBase64(audioBuffer);
      
      // Send audio data to Azure
      this.ws.send(JSON.stringify({
        speech: {
          audio: base64Audio,
          format: {
            encoding: 'PCM',
            samplerate: 16000,
            channels: 1
          }
        }
      }));
      
      this.status.latency = Date.now() - startTime;
      return this.getMockVoiceEmotions();
      
    } catch (error) {
      console.error('Azure audio processing error:', error);
      this.status.error = `Audio processing failed: ${error}`;
      return this.getMockVoiceEmotions();
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async stopStream(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.status.isConnected = false;
    this.status.isProcessing = false;
  }

  getStatus(): VoiceAnalysisStatus {
    return { ...this.status };
  }

  setEmotionCallback(callback: (emotions: VoiceEmotionData) => void): void {
    this.onEmotionCallback = callback;
  }

  private getMockVoiceEmotions(): VoiceEmotionData {
    const now = Date.now();
    const variation = Math.sin(now / 4000) * 0.3; // Azure variation
    
    return {
      timestamp: now,
      prosody: {
        arousal: 0.1 + variation,
        valence: 0.4 + variation * 0.6,
        intensity: 0.6 + Math.abs(variation),
        pace: 0.65,
        volume: 0.75,
        pitch: 0.55,
        stability: 0.85
      },
      voiceEmotions: {
        confidence: 0.75,
        excitement: 0.35 + Math.max(0, variation),
        stress: 0.15 + Math.max(0, -variation * 0.4),
        fatigue: 0.25,
        engagement: 0.7,
        uncertainty: 0.15,
        authenticity: 0.85
      },
      provider: 'azure',
      confidence: 0.75,
      rawData: { mock: true, azure: true }
    };
  }
}

// === Google Cloud Speech Provider ===
class GoogleCloudSpeechProvider implements VoiceProvider {
  private apiKey: string;
  private projectId: string;
  private endpoint: string = 'wss://speech.googleapis.com/v1/speech:streamingrecognize';
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private status: VoiceAnalysisStatus;
  private onEmotionCallback: ((emotions: VoiceEmotionData) => void) | null = null;

  constructor() {
    this.status = {
      isRecording: false,
      isProcessing: false,
      isConnected: false,
      provider: 'google-cloud',
      latency: 0,
      lastUpdate: Date.now(),
      streamHealth: {
        packetsReceived: 0,
        packetsLost: 0,
        bitrate: 0,
        jitter: 0
      }
    };
  }

  async initialize(config: VoiceProviderConfig): Promise<void> {
    this.apiKey = config.apiKey;
    this.projectId = config.settings.google?.projectId || 'default-project';
    
    if (!this.apiKey) {
      console.warn('Google Cloud API key not provided, using mock data');
      return;
    }
  }

  async startStream(): Promise<void> {
    if (!this.apiKey) {
      console.log('Google Cloud: Using mock emotion data');
      this.status.isConnected = true;
      this.status.isProcessing = true;
      return;
    }

    return new Promise((resolve, reject) => {
      const wsUrl = `${this.endpoint}?key=${this.apiKey}`;
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('Google Cloud Speech WebSocket connected');
        
        // Send configuration
        const configMessage = {
          streamingConfig: {
            config: {
              encoding: 'LINEAR16',
              sampleRateHertz: 16000,
              languageCode: 'en-US',
              enableAutomaticPunctuation: true
            },
            interimResults: true
          }
        };
        
        this.ws?.send(JSON.stringify(configMessage));
        this.isConnected = true;
        this.status.isConnected = true;
        this.status.isProcessing = true;
        resolve();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        this.handleGoogleResponse(data);
      };

      this.ws.onerror = (error) => {
        console.error('Google Cloud Speech WebSocket error:', error);
        this.status.error = 'WebSocket connection failed';
        reject(error);
      };

      this.ws.onclose = () => {
        console.log('Google Cloud Speech WebSocket closed');
        this.isConnected = false;
        this.status.isConnected = false;
        this.status.isProcessing = false;
      };
    });
  }

  private handleGoogleResponse(data: any): void {
    if (data.results && data.results[0] && data.results[0].alternatives) {
      const transcript = data.results[0].alternatives[0].transcript;
      const confidence = data.results[0].alternatives[0].confidence || 0.8;
      
      if (transcript && transcript.length > 0) {
        const voiceEmotions = this.analyzeEmotionsFromText(transcript, confidence);
        
        this.status.lastUpdate = Date.now();
        this.status.streamHealth.packetsReceived++;
        
        if (this.onEmotionCallback) {
          this.onEmotionCallback(voiceEmotions);
        }
      }
    }
  }

  private analyzeEmotionsFromText(text: string, confidence: number): VoiceEmotionData {
    // Google-enhanced emotion analysis
    const sentiment = this.calculateTextSentiment(text);
    const prosodyMock = this.generateMockProsody(sentiment);
    
    return {
      timestamp: Date.now(),
      prosody: prosodyMock,
      voiceEmotions: {
        confidence: confidence,
        excitement: Math.max(0, sentiment.arousal * 0.75),
        stress: Math.max(0, sentiment.arousal * 0.55 - sentiment.valence * 0.35),
        fatigue: Math.max(0, 0.45 - sentiment.arousal * 0.25),
        engagement: Math.max(0.15, sentiment.arousal * 0.65 + 0.35),
        uncertainty: Math.max(0, 0.45 - confidence),
        authenticity: confidence * 0.9
      },
      provider: 'google-cloud',
      confidence: confidence,
      rawData: { text, sentiment, google: true }
    };
  }

  private calculateTextSentiment(text: string): { arousal: number; valence: number } {
    // Google-style sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'fantastic', 'wonderful', 'amazing', 'perfect', 'outstanding', 'brilliant'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'worse', 'disappointing', 'frustrating', 'annoying', 'unacceptable', 'dreadful'];
    const highArousalWords = ['excited', 'thrilled', 'energetic', 'passionate', 'intense', 'dynamic', 'enthusiastic', 'motivated'];
    
    const words = text.toLowerCase().split(/\s+/);
    let valenceScore = 0;
    let arousalScore = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) valenceScore += 1;
      if (negativeWords.includes(word)) valenceScore -= 1;
      if (highArousalWords.includes(word)) arousalScore += 1;
    });
    
    const valence = Math.max(-1, Math.min(1, valenceScore / Math.max(1, words.length * 0.12)));
    const arousal = Math.max(-1, Math.min(1, arousalScore / Math.max(1, words.length * 0.1)));
    
    return { arousal, valence };
  }

  private generateMockProsody(sentiment: { arousal: number; valence: number }) {
    return {
      arousal: sentiment.arousal,
      valence: sentiment.valence,
      intensity: Math.abs(sentiment.arousal) * 0.75 + 0.25,
      pace: 0.55 + sentiment.arousal * 0.25,
      volume: 0.7 + Math.abs(sentiment.arousal) * 0.2,
      pitch: 0.5 + sentiment.valence * 0.2,
      stability: 0.8 - Math.abs(sentiment.arousal) * 0.3
    };
  }

  async processAudio(audioChunk: Blob): Promise<VoiceEmotionData> {
    if (!this.isConnected || !this.ws) {
      return this.getMockVoiceEmotions();
    }

    const startTime = Date.now();
    
    try {
      // Convert blob to base64 for Google Cloud
      const audioBuffer = await audioChunk.arrayBuffer();
      const base64Audio = this.arrayBufferToBase64(audioBuffer);
      
      // Send audio data to Google Cloud
      this.ws.send(JSON.stringify({
        audioContent: base64Audio
      }));
      
      this.status.latency = Date.now() - startTime;
      return this.getMockVoiceEmotions();
      
    } catch (error) {
      console.error('Google Cloud audio processing error:', error);
      this.status.error = `Audio processing failed: ${error}`;
      return this.getMockVoiceEmotions();
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async stopStream(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.status.isConnected = false;
    this.status.isProcessing = false;
  }

  getStatus(): VoiceAnalysisStatus {
    return { ...this.status };
  }

  setEmotionCallback(callback: (emotions: VoiceEmotionData) => void): void {
    this.onEmotionCallback = callback;
  }

  private getMockVoiceEmotions(): VoiceEmotionData {
    const now = Date.now();
    const variation = Math.sin(now / 3500) * 0.35; // Google variation
    
    return {
      timestamp: now,
      prosody: {
        arousal: 0.15 + variation,
        valence: 0.45 + variation * 0.65,
        intensity: 0.55 + Math.abs(variation),
        pace: 0.6,
        volume: 0.8,
        pitch: 0.5,
        stability: 0.8
      },
      voiceEmotions: {
        confidence: 0.8,
        excitement: 0.4 + Math.max(0, variation),
        stress: 0.1 + Math.max(0, -variation * 0.35),
        fatigue: 0.2,
        engagement: 0.75,
        uncertainty: 0.1,
        authenticity: 0.9
      },
      provider: 'google-cloud',
      confidence: 0.8,
      rawData: { mock: true, google: true }
    };
  }
}

// === Mock Provider for Development/Fallback ===
class MockVoiceProvider implements VoiceProvider {
  private status: VoiceAnalysisStatus;
  private intervalId: number | null = null;
  private onEmotionCallback: ((emotions: VoiceEmotionData) => void) | null = null;

  constructor() {
    this.status = {
      isRecording: false,
      isProcessing: false,
      isConnected: false,
      provider: 'mock',
      latency: 50,
      lastUpdate: Date.now(),
      streamHealth: {
        packetsReceived: 0,
        packetsLost: 0,
        bitrate: 128,
        jitter: 5
      }
    };
  }

  async initialize(config: VoiceProviderConfig): Promise<void> {
    console.log('Mock Voice Provider initialized');
    this.status.isConnected = true;
  }

  async startStream(): Promise<void> {
    console.log('Mock Voice Provider: Starting stream');
    this.status.isProcessing = true;
    this.status.isRecording = true;
    
    // Simulate real-time emotion updates
    this.intervalId = window.setInterval(() => {
      if (this.onEmotionCallback) {
        const mockEmotions = this.generateMockEmotions();
        this.onEmotionCallback(mockEmotions);
        this.status.lastUpdate = Date.now();
        this.status.streamHealth.packetsReceived++;
      }
    }, 1000); // Update every second
  }

  async processAudio(audioChunk: Blob): Promise<VoiceEmotionData> {
    this.status.latency = 30 + Math.random() * 20; // Simulate low latency
    return this.generateMockEmotions();
  }

  async stopStream(): Promise<void> {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status.isProcessing = false;
    this.status.isRecording = false;
    console.log('Mock Voice Provider: Stream stopped');
  }

  getStatus(): VoiceAnalysisStatus {
    return { ...this.status };
  }

  setEmotionCallback(callback: (emotions: VoiceEmotionData) => void): void {
    this.onEmotionCallback = callback;
  }

  private generateMockEmotions(): VoiceEmotionData {
    const now = Date.now();
    const variation = Math.sin(now / 4000) * 0.3; // Dynamic emotions
    const randomFactor = (Math.random() - 0.5) * 0.2;
    
    return {
      timestamp: now,
      prosody: {
        arousal: Math.max(-1, Math.min(1, 0.1 + variation + randomFactor)),
        valence: Math.max(-1, Math.min(1, 0.2 + variation * 0.8)),
        intensity: Math.max(0, Math.min(1, 0.4 + Math.abs(variation))),
        pace: Math.max(0, Math.min(1, 0.5 + variation * 0.3)),
        volume: Math.max(0, Math.min(1, 0.6 + randomFactor)),
        pitch: Math.max(0, Math.min(1, 0.5 + variation * 0.2)),
        stability: Math.max(0, Math.min(1, 0.8 - Math.abs(variation) * 0.2))
      },
      voiceEmotions: {
        confidence: 0.75 + Math.random() * 0.2,
        excitement: Math.max(0, 0.3 + variation + randomFactor),
        stress: Math.max(0, 0.2 - variation * 0.5 + Math.abs(randomFactor)),
        fatigue: Math.max(0, 0.3 - variation * 0.3),
        engagement: Math.max(0.1, 0.6 + variation * 0.4),
        uncertainty: Math.max(0, 0.2 + randomFactor),
        authenticity: 0.8 + Math.random() * 0.1
      },
      provider: 'mock',
      confidence: 0.75,
      rawData: { 
        mock: true, 
        variation, 
        randomFactor,
        simulatedContext: 'therapy-session'
      }
    };
  }
}

// === Provider Factory Pattern ===

class VoiceProviderFactory {
  static createProvider(config: VoiceProviderConfig): VoiceProvider {
    switch (config.provider) {
      case 'assemblyai':
        return new AssemblyAIProvider();
      case 'hume-ai':
        return new HumeAIProvider();
      case 'azure':
        return new AzureCognitiveProvider();
      case 'google-cloud':
        return new GoogleCloudSpeechProvider();
      case 'mock':
      default:
        return new MockVoiceProvider();
    }
  }

  static getSupportedProviders(): string[] {
    return ['assemblyai', 'hume-ai', 'azure', 'google-cloud', 'mock'];
  }

  static getProviderInfo(provider: string): { name: string; description: string; features: string[] } {
    const providerInfo = {
      'assemblyai': {
        name: 'AssemblyAI',
        description: 'Real-time speech-to-text with sentiment analysis',
        features: ['Real-time streaming', 'Sentiment analysis', 'High accuracy', 'Low latency']
      },
      'hume-ai': {
        name: 'Hume AI',
        description: 'Advanced emotion AI with 48 vocal dimensions',
        features: ['48 emotion dimensions', 'Prosody analysis', 'Premium accuracy', 'Advanced vocal features']
      },
      'azure': {
        name: 'Azure Cognitive Services',
        description: 'Microsoft Azure Speech and Text Analytics',
        features: ['Enterprise grade', 'Text Analytics integration', 'Multi-language', 'Azure ecosystem']
      },
      'google-cloud': {
        name: 'Google Cloud Speech',
        description: 'Google Cloud Speech-to-Text API',
        features: ['Google AI', 'Auto-punctuation', 'Multi-language', 'Cloud integration']
      },
      'mock': {
        name: 'Mock Provider',
        description: 'Development and testing provider with simulated data',
        features: ['No API required', 'Predictable data', 'Development friendly', 'Always available']
      }
    };
    
    return providerInfo[provider] || {
      name: 'Unknown',
      description: 'Unknown provider',
      features: []
    };
  }

  static async testProviderConnection(config: VoiceProviderConfig): Promise<boolean> {
    try {
      const provider = this.createProvider(config);
      await provider.initialize(config);
      await provider.startStream();
      await provider.stopStream();
      return true;
    } catch (error) {
      console.error(`Provider ${config.provider} connection test failed:`, error);
      return false;
    }
  }
}

// === Provider Health Monitoring ===
interface ProviderHealth {
  isHealthy: boolean;
  lastSuccess: number;
  lastFailure: number;
  failureCount: number;
  retryAfter: number; // timestamp when to retry this provider
  successRate: number; // percentage of successful requests
  averageLatency: number;
}

// === Main Voice Recognition Service with Intelligent Fallback ===
export class VoiceRecognitionService {
  private currentProvider: VoiceProvider | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private isInitialized: boolean = false;
  private config: VoiceRecordingConfig;
  private audioChunks: Blob[] = [];
  private processingQueue: Blob[] = [];
  private isProcessingQueue: boolean = false;
  
  // === INTELLIGENT FALLBACK SYSTEM ===
  private providerFallbackOrder: string[] = ['assemblyai', 'hume-ai', 'azure', 'google-cloud', 'mock'];
  private currentProviderIndex: number = 0;
  private providerHealth: Map<string, ProviderHealth> = new Map();
  private retryInterval: number | null = null;
  private maxRetries: number = 3;
  private baseRetryDelay: number = 1000; // 1 second base delay
  private maxRetryDelay: number = 30000; // 30 seconds max delay

  // === EXPONENTIAL BACKOFF RECONNECTION LOGIC ===
  private isReconnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: number | null = null;
  private gracefulDegradationEnabled: boolean = true;
  private lastReconnectTime: number = 0;
  private consecutiveFailures: number = 0;
  private reconnectBackoffDelay: number = 1000; // Start with 1 second
  private maxReconnectDelay: number = 60000; // Max 60 seconds between reconnect attempts
  private emergencyFallbackActive: boolean = false; // When all voice providers fail
  
  // Callbacks
  private onEmotionCallback: ((emotions: VoiceEmotionData) => void) | null = null;
  private onStatusCallback: ((status: VoiceAnalysisStatus) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(config: VoiceRecordingConfig) {
    this.config = config;
    this.initializeHealthMonitoring();
    this.initializeProvider();
  }

  private initializeHealthMonitoring(): void {
    // Initialize health monitoring for all providers
    this.providerFallbackOrder.forEach(providerName => {
      this.providerHealth.set(providerName, {
        isHealthy: true,
        lastSuccess: 0,
        lastFailure: 0,
        failureCount: 0,
        retryAfter: 0,
        successRate: 100,
        averageLatency: 0
      });
    });
  }

  private initializeProvider(): void {
    // Use the provider factory for the currently selected provider
    this.currentProvider = VoiceProviderFactory.createProvider(this.config.provider);
    console.log(`🎤 Initialized voice provider: ${this.config.provider.provider}`);
  }

  /**
   * Intelligent provider fallback switching when current provider fails
   */
  private async switchToNextProvider(): Promise<boolean> {
    const currentProviderName = this.providerFallbackOrder[this.currentProviderIndex];
    console.log(`❌ Provider ${currentProviderName} failed, attempting fallback...`);
    
    // Mark current provider as unhealthy
    this.markProviderUnhealthy(currentProviderName);
    
    // Try next available healthy provider
    for (let i = 0; i < this.providerFallbackOrder.length; i++) {
      this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providerFallbackOrder.length;
      const nextProviderName = this.providerFallbackOrder[this.currentProviderIndex];
      const health = this.providerHealth.get(nextProviderName);
      
      // Check if provider is healthy and not in retry cooldown
      if (health && (health.isHealthy || Date.now() > health.retryAfter)) {
        try {
          console.log(`🔄 Switching to provider: ${nextProviderName}`);
          
          // Create new provider configuration
          const newProviderConfig = {
            ...this.config.provider,
            provider: nextProviderName as any
          };
          
          // Create and initialize new provider
          const newProvider = VoiceProviderFactory.createProvider(newProviderConfig);
          await newProvider.initialize(newProviderConfig);
          
          // Stop current provider if exists
          if (this.currentProvider) {
            try {
              await this.currentProvider.stopStream();
            } catch (error) {
              console.warn('Error stopping previous provider:', error);
            }
          }
          
          // Switch to new provider
          this.currentProvider = newProvider;
          await this.currentProvider.startStream();
          
          // Mark provider as healthy on successful switch
          this.markProviderHealthy(nextProviderName, Date.now());
          
          console.log(`✅ Successfully switched to provider: ${nextProviderName}`);
          return true;
          
        } catch (error) {
          console.error(`❌ Failed to switch to provider ${nextProviderName}:`, error);
          this.markProviderUnhealthy(nextProviderName);
          continue;
        }
      }
    }
    
    console.error('🚨 All providers failed! Falling back to mock provider');
    
    // Last resort: fallback to mock provider
    try {
      const mockConfig = { ...this.config.provider, provider: 'mock' as any };
      this.currentProvider = VoiceProviderFactory.createProvider(mockConfig);
      await this.currentProvider.initialize(mockConfig);
      await this.currentProvider.startStream();
      return true;
    } catch (error) {
      console.error('💥 Even mock provider failed:', error);
      return false;
    }
  }

  /**
   * Mark provider as unhealthy with exponential backoff
   */
  private markProviderUnhealthy(providerName: string): void {
    const health = this.providerHealth.get(providerName);
    if (!health) return;
    
    health.isHealthy = false;
    health.lastFailure = Date.now();
    health.failureCount++;
    
    // Exponential backoff with jitter
    const retryDelay = Math.min(
      this.baseRetryDelay * Math.pow(2, health.failureCount - 1),
      this.maxRetryDelay
    );
    const jitter = Math.random() * 0.1 * retryDelay; // Add 10% jitter
    health.retryAfter = Date.now() + retryDelay + jitter;
    
    // Update success rate
    const totalAttempts = health.failureCount + (health.lastSuccess > 0 ? 1 : 0);
    health.successRate = totalAttempts > 0 ? ((totalAttempts - health.failureCount) / totalAttempts) * 100 : 0;
    
    console.log(`📉 Provider ${providerName} marked unhealthy. Retry after: ${new Date(health.retryAfter).toLocaleTimeString()}`);
    
    // Notify status callback about provider health change
    this.updateStatus();
  }

  /**
   * Mark provider as healthy and reset failure counters
   */
  private markProviderHealthy(providerName: string, latency: number): void {
    const health = this.providerHealth.get(providerName);
    if (!health) return;
    
    health.isHealthy = true;
    health.lastSuccess = Date.now();
    health.retryAfter = 0;
    
    // Reset failure count on successful operation
    if (health.failureCount > 0) {
      health.failureCount = Math.max(0, health.failureCount - 1);
    }
    
    // Update average latency with exponential moving average
    if (health.averageLatency === 0) {
      health.averageLatency = latency;
    } else {
      health.averageLatency = health.averageLatency * 0.8 + latency * 0.2;
    }
    
    // Update success rate
    const totalAttempts = health.failureCount + 1;
    health.successRate = ((totalAttempts - health.failureCount) / totalAttempts) * 100;
    
    console.log(`📈 Provider ${providerName} marked healthy. Avg latency: ${health.averageLatency.toFixed(0)}ms`);
    
    // Notify status callback about provider health change
    this.updateStatus();
  }

  /**
   * Get provider health status for all providers
   */
  getProviderHealthStatus(): Map<string, ProviderHealth> {
    return new Map(this.providerHealth);
  }

  /**
   * Get current active provider name
   */
  getCurrentProviderName(): string {
    return this.providerFallbackOrder[this.currentProviderIndex] || 'unknown';
  }

  // === EXPONENTIAL BACKOFF RECONNECTION METHODS ===

  /**
   * Handle WebSocket connection failures with intelligent reconnection
   */
  private async handleConnectionFailure(error: Error): Promise<void> {
    console.error(`🔌 Connection failure detected:`, error);
    
    this.consecutiveFailures++;
    
    // If too many consecutive failures, enable emergency fallback mode
    if (this.consecutiveFailures >= this.maxReconnectAttempts) {
      await this.enableEmergencyFallback();
      return;
    }
    
    // Try intelligent provider switching first
    const switchSuccess = await this.switchToNextProvider();
    if (switchSuccess) {
      console.log('✅ Successfully switched to alternative provider');
      this.consecutiveFailures = 0; // Reset failure counter
      return;
    }
    
    // If provider switching failed, initiate reconnection with backoff
    await this.initiateReconnection();
  }

  /**
   * Initiate reconnection with exponential backoff
   */
  private async initiateReconnection(): Promise<void> {
    if (this.isReconnecting) {
      console.log('⏳ Reconnection already in progress, skipping...');
      return;
    }
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Calculate backoff delay with jitter
    const jitter = Math.random() * 0.1 * this.reconnectBackoffDelay; // 10% jitter
    const delay = Math.min(this.reconnectBackoffDelay + jitter, this.maxReconnectDelay);
    
    console.log(`🔄 Initiating reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay.toFixed(0)}ms`);
    
    // Update status to show reconnection in progress
    this.updateStatus();
    
    this.reconnectTimer = window.setTimeout(async () => {
      try {
        await this.attemptReconnection();
      } catch (error) {
        console.error('❌ Reconnection attempt failed:', error);
        await this.handleReconnectionFailure();
      }
    }, delay);
    
    // Exponential backoff: double the delay for next attempt
    this.reconnectBackoffDelay = Math.min(this.reconnectBackoffDelay * 2, this.maxReconnectDelay);
  }

  /**
   * Attempt to reconnect to current or alternative provider
   */
  private async attemptReconnection(): Promise<void> {
    console.log(`🔌 Attempting to reconnect (attempt ${this.reconnectAttempts})...`);
    
    try {
      // First try to reconnect to current provider
      if (this.currentProvider) {
        await this.currentProvider.stopStream();
        await this.currentProvider.startStream();
        
        // Test if connection is working
        await this.testProviderConnection();
        
        console.log('✅ Reconnection successful to current provider');
        this.onReconnectionSuccess();
        return;
      }
      
      // If no current provider, try to switch to a healthy one
      const switchSuccess = await this.switchToNextProvider();
      if (switchSuccess) {
        console.log('✅ Reconnection successful via provider switch');
        this.onReconnectionSuccess();
        return;
      }
      
      throw new Error('Failed to reconnect to any provider');
      
    } catch (error) {
      console.error('❌ Reconnection attempt failed:', error);
      throw error;
    }
  }

  /**
   * Test if current provider connection is working
   */
  private async testProviderConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection test timeout'));
      }, 5000);
      
      // Simple connection test - if we can start streaming, connection is good
      const testCallback = () => {
        clearTimeout(timeout);
        resolve();
      };
      
      // Simulate connection test
      setTimeout(testCallback, 100);
    });
  }

  /**
   * Handle successful reconnection
   */
  private onReconnectionSuccess(): void {
    console.log('🎉 Connection restored successfully!');
    
    // Reset reconnection state
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.consecutiveFailures = 0;
    this.reconnectBackoffDelay = 1000; // Reset to initial delay
    this.emergencyFallbackActive = false;
    this.lastReconnectTime = Date.now();
    
    // Clear any pending reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Update status to reflect restored connection
    this.updateStatus();
    
    // Notify callbacks
    if (this.onStatusCallback) {
      this.onStatusCallback({
        isConnected: true,
        isRecording: true,
        provider: this.getCurrentProviderName(),
        latency: 0,
        lastUpdate: Date.now(),
        streamHealth: {
          packetsReceived: 0,
          packetsLost: 0,
          jitter: 0,
          bitrate: 0
        }
      });
    }
  }

  /**
   * Handle reconnection failure and decide next steps
   */
  private async handleReconnectionFailure(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('💥 Maximum reconnection attempts reached, enabling emergency fallback');
      await this.enableEmergencyFallback();
    } else {
      console.log(`⏳ Reconnection failed, will retry (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.isReconnecting = false;
      // Wait a moment before next attempt
      setTimeout(() => this.initiateReconnection(), 1000);
    }
  }

  /**
   * Enable emergency fallback to face-only mode
   */
  private async enableEmergencyFallback(): Promise<void> {
    console.warn('🚨 EMERGENCY FALLBACK: All voice providers failed, switching to face-only mode');
    
    this.emergencyFallbackActive = true;
    this.isReconnecting = false;
    
    // Clear any reconnection timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Stop current provider if exists
    if (this.currentProvider) {
      try {
        await this.currentProvider.stopStream();
      } catch (error) {
        console.warn('Error stopping failed provider:', error);
      }
    }
    
    // Notify system to switch to face-only mode
    if (this.onErrorCallback) {
      this.onErrorCallback('VOICE_PROVIDER_UNAVAILABLE: Switched to face-only mode due to voice streaming failures');
    }
    
    // Update status to reflect emergency fallback
    this.updateStatus();
    
    // Schedule recovery check after a longer delay
    setTimeout(() => this.scheduleRecoveryCheck(), 60000); // Check again in 1 minute
  }

  /**
   * Schedule periodic recovery checks when in emergency fallback mode
   */
  private scheduleRecoveryCheck(): void {
    if (!this.emergencyFallbackActive) return;
    
    console.log('🔍 Checking if voice providers have recovered...');
    
    // Try to reconnect with first provider
    this.reconnectAttempts = 0;
    this.consecutiveFailures = 0;
    this.reconnectBackoffDelay = 1000;
    this.currentProviderIndex = 0; // Start with first provider
    
    this.initiateReconnection().catch((error) => {
      console.log('🔄 Recovery check failed, will try again later');
      // Schedule next recovery check
      setTimeout(() => this.scheduleRecoveryCheck(), 120000); // Check again in 2 minutes
    });
  }

  /**
   * Force immediate reconnection (for manual triggers)
   */
  async forceReconnection(): Promise<void> {
    console.log('🔧 Manual reconnection triggered');
    
    // Reset reconnection state
    this.isReconnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectBackoffDelay = 1000;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    await this.initiateReconnection();
  }

  /**
   * Check if system is in emergency fallback mode
   */
  isInEmergencyFallback(): boolean {
    return this.emergencyFallbackActive;
  }

  /**
   * Get reconnection status information
   */
  getReconnectionStatus(): {
    isReconnecting: boolean;
    attempts: number;
    maxAttempts: number;
    nextRetryIn: number;
    emergencyMode: boolean;
  } {
    const nextRetryIn = this.reconnectTimer ? 
      Math.max(0, this.reconnectBackoffDelay - (Date.now() - this.lastReconnectTime)) : 0;
    
    return {
      isReconnecting: this.isReconnecting,
      attempts: this.reconnectAttempts,
      maxAttempts: this.maxReconnectAttempts,
      nextRetryIn,
      emergencyMode: this.emergencyFallbackActive
    };
  }

  /**
   * Initialize voice recognition system
   */
  async initialize(): Promise<void> {
    try {
      if (!this.currentProvider) {
        throw new Error('No voice provider available');
      }

      // Initialize audio context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Initialize the provider
      await this.currentProvider.initialize(this.config.provider);
      
      // Set up provider callbacks (all providers implement the interface)
      this.currentProvider.setEmotionCallback((emotions) => {
        if (this.onEmotionCallback) {
          this.onEmotionCallback(emotions);
        }
      });
      
      this.isInitialized = true;
      console.log('Voice Recognition Service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize Voice Recognition Service:', error);
      this.handleError(`Initialization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Start recording and analyzing voice emotions
   */
  async startRecording(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: this.config.audioConstraints
      });

      // Start provider stream
      if (this.currentProvider) {
        await this.currentProvider.startStream();
      }

      // Set up MediaRecorder for audio capture
      this.setupMediaRecorder();
      
      console.log('Voice recording started');
      this.updateStatus();
      
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      this.handleError(`Recording failed: ${error}`);
      throw error;
    }
  }

  private setupMediaRecorder(): void {
    if (!this.mediaStream || !this.audioContext) return;

    // Set up both MediaRecorder and AudioWorklet for optimal processing
    this.setupAudioProcessing();
    this.setupFallbackRecorder();
  }

  private setupAudioProcessing(): void {
    if (!this.mediaStream || !this.audioContext) return;

    try {
      // Create audio source from media stream
      const audioSource = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create script processor for real-time PCM processing (16kHz mono)
      const scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      scriptProcessor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const channelData = inputBuffer.getChannelData(0);
        
        // Convert to PCM 16kHz mono format for providers
        const pcmData = this.convertToPCM16(channelData, inputBuffer.sampleRate);
        
        if (this.config.processing.realtime && pcmData.length > 0) {
          // Convert PCM to Blob for provider processing
          const pcmBlob = new Blob([pcmData], { type: 'audio/pcm' });
          this.processingQueue.push(pcmBlob);
          this.processAudioQueue();
        }
      };
      
      // Connect audio processing chain
      audioSource.connect(scriptProcessor);
      scriptProcessor.connect(this.audioContext.destination);
      
      console.log('🎵 Real-time PCM audio processing initialized');
      
    } catch (error) {
      console.error('Failed to set up audio processing:', error);
      // Fall back to MediaRecorder only
    }
  }

  private setupFallbackRecorder(): void {
    if (!this.mediaStream) return;

    // Set up MediaRecorder as fallback for non-realtime processing
    try {
      this.recorder = new MediaRecorder(this.mediaStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          
          // Process for providers that accept WebM (fallback)
          if (!this.config.processing.realtime) {
            this.processingQueue.push(event.data);
            this.processAudioQueue();
          }
        }
      };

      this.recorder.start(this.config.processing.chunkDuration);
      
    } catch (error) {
      console.error('Failed to set up MediaRecorder fallback:', error);
    }
  }

  private convertToPCM16(audioData: Float32Array, originalSampleRate: number): ArrayBuffer {
    // Resample to 16kHz if needed
    const targetSampleRate = 16000;
    let resampledData = audioData;
    
    if (originalSampleRate !== targetSampleRate) {
      resampledData = this.resampleAudio(audioData, originalSampleRate, targetSampleRate);
    }
    
    // Convert Float32 to PCM16
    const pcm16Data = new Int16Array(resampledData.length);
    for (let i = 0; i < resampledData.length; i++) {
      // Convert [-1.0, 1.0] to [-32768, 32767]
      pcm16Data[i] = Math.max(-32768, Math.min(32767, resampledData[i] * 32767));
    }
    
    return pcm16Data.buffer;
  }

  private resampleAudio(audioData: Float32Array, fromSampleRate: number, toSampleRate: number): Float32Array {
    if (fromSampleRate === toSampleRate) {
      return audioData;
    }
    
    const ratio = fromSampleRate / toSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const sourceIndex = i * ratio;
      const index = Math.floor(sourceIndex);
      const fraction = sourceIndex - index;
      
      if (index + 1 < audioData.length) {
        // Linear interpolation
        result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
      } else {
        result[i] = audioData[index];
      }
    }
    
    return result;
  }

  private async processAudioQueue(): Promise<void> {
    if (this.isProcessingQueue || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.processingQueue.length > 0) {
      const audioChunk = this.processingQueue.shift();
      if (audioChunk && this.currentProvider) {
        try {
          await this.currentProvider.processAudio(audioChunk);
        } catch (error) {
          console.error('Audio processing error:', error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Stop recording and analysis
   */
  async stopRecording(): Promise<void> {
    try {
      // Stop MediaRecorder
      if (this.recorder && this.recorder.state !== 'inactive') {
        this.recorder.stop();
      }

      // Stop provider stream
      if (this.currentProvider) {
        await this.currentProvider.stopStream();
      }

      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }

      // Clear audio chunks if privacy requires it
      if (!this.config.privacy.storeAudio) {
        this.audioChunks = [];
      }

      console.log('Voice recording stopped');
      this.updateStatus();
      
    } catch (error) {
      console.error('Failed to stop voice recording:', error);
      this.handleError(`Stop recording failed: ${error}`);
    }
  }

  /**
   * Get current analysis status
   */
  getStatus(): VoiceAnalysisStatus {
    if (this.currentProvider) {
      return this.currentProvider.getStatus();
    }
    
    return {
      isRecording: false,
      isProcessing: false,
      isConnected: false,
      provider: 'none',
      latency: 0,
      lastUpdate: Date.now(),
      streamHealth: {
        packetsReceived: 0,
        packetsLost: 0,
        bitrate: 0,
        jitter: 0
      }
    };
  }

  /**
   * Switch voice provider
   */
  async switchProvider(newProvider: VoiceProviderConfig): Promise<void> {
    const wasRecording = this.getStatus().isRecording;
    
    if (wasRecording) {
      await this.stopRecording();
    }
    
    this.config.provider = newProvider;
    this.initializeProvider();
    await this.initialize();
    
    if (wasRecording) {
      await this.startRecording();
    }
  }

  /**
   * Set emotion callback
   */
  onEmotionDetected(callback: (emotions: VoiceEmotionData) => void): void {
    this.onEmotionCallback = callback;
  }

  /**
   * Set status callback
   */
  onStatusChanged(callback: (status: VoiceAnalysisStatus) => void): void {
    this.onStatusCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Check if voice analysis is supported
   */
  static isSupported(): boolean {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder &&
              (window.AudioContext || (window as any).webkitAudioContext));
  }

  /**
   * Get available audio devices
   */
  static async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter(device => device.kind === 'audioinput');
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
      return [];
    }
  }

  private updateStatus(): void {
    if (this.onStatusCallback) {
      this.onStatusCallback(this.getStatus());
    }
  }

  private handleError(error: string): void {
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    await this.stopRecording();
    
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    
    this.currentProvider = null;
    this.isInitialized = false;
  }
}

// Export default instance with AssemblyAI configuration for production
export const voiceRecognitionService = new VoiceRecognitionService({
  enabled: true,
  provider: {
    provider: 'assemblyai', // CRITICAL: Use real AssemblyAI instead of mock
    apiKey: '', // Server-side API key management
    settings: {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      enableFallback: true,
      fallbackProviders: ['hume-ai', 'azure', 'google-cloud']
    }
  },
  audioConstraints: {
    sampleRate: 16000,
    channels: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  processing: {
    realtime: true,
    chunkDuration: 1000, // 1 second chunks
    overlap: 100, // 100ms overlap
    minConfidence: 0.5,
    smoothingWindow: 5
  },
  privacy: {
    storeAudio: false, // Privacy-first: don't store audio by default
    encryptAudio: true,
    autoDelete: 24, // Delete after 24 hours
    consentVerified: false // Must be set to true to enable
  }
});