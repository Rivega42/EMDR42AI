/**
 * Web Speech API STT Provider for SpeechToTextService
 * Browser-native speech recognition with real-time capabilities
 * Fallback provider with offline support
 */

import type {
  STTProviderConfig,
  STTTranscriptionResult,
  STTLanguage,
  STTError
} from '@/../../shared/types';

import { STTProviderInterface } from '../speechToTextService';
import { generateDeterministicId } from '@/lib/deterministicUtils';

// Browser Speech Recognition interface
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  grammars: SpeechGrammarList;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export class WebSpeechSTTProvider implements STTProviderInterface {
  private isInitialized: boolean = false;
  private isTranscribing: boolean = false;
  private config: STTProviderConfig | null = null;
  
  // Web Speech API
  private recognition: SpeechRecognition | null = null;
  private isRecognitionStarted: boolean = false;
  
  // Status tracking
  private latency: number = 0;
  private errorCount: number = 0;
  private successCount: number = 0;
  private lastRequestTime: number = 0;
  
  // Language settings
  private currentLanguage: STTLanguage = 'en';
  
  // Event callbacks
  private onTranscriptionCallback: ((result: STTTranscriptionResult) => void) | null = null;
  private onInterimCallback: ((text: string, confidence: number) => void) | null = null;
  
  // Result tracking
  private lastResultIndex: number = 0;
  private accumulatedText: string = '';

  constructor() {
    console.log('🎤 Web Speech STT Provider created');
  }

  async initialize(config: STTProviderConfig): Promise<void> {
    try {
      this.config = config;
      
      // Check browser support
      if (!this.checkBrowserSupport()) {
        throw new Error('Web Speech API not supported in this browser');
      }

      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      // Configure recognition
      this.configureRecognition();
      
      this.isInitialized = true;
      console.log('✅ Web Speech STT Provider initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Web Speech STT Provider:', error);
      throw error;
    }
  }

  private checkBrowserSupport(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  private configureRecognition(): void {
    if (!this.recognition) return;

    const webSpeechSettings = this.config?.settings.webspeech;
    
    // Basic configuration
    this.recognition.continuous = webSpeechSettings?.continuous ?? true;
    this.recognition.interimResults = webSpeechSettings?.interimResults ?? true;
    this.recognition.maxAlternatives = webSpeechSettings?.maxAlternatives ?? 3;
    
    // Language configuration
    this.recognition.lang = this.mapLanguageToWebSpeech(this.currentLanguage);
    
    // Custom service URI if provided
    if (webSpeechSettings?.serviceURI) {
      this.recognition.serviceURI = webSpeechSettings.serviceURI;
    }

    // Set up event handlers
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      console.log('🔊 Web Speech recognition started');
      this.isRecognitionStarted = true;
      this.lastResultIndex = 0;
      this.accumulatedText = '';
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleRecognitionResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Web Speech recognition error:', event.error, event.message);
      this.errorCount++;
      this.handleRecognitionError(event);
    };

    this.recognition.onend = () => {
      console.log('🛑 Web Speech recognition ended');
      this.isRecognitionStarted = false;
      
      // Auto-restart if still transcribing (continuous mode)
      if (this.isTranscribing && this.recognition) {
        setTimeout(() => {
          if (this.isTranscribing && this.recognition) {
            try {
              this.recognition.start();
            } catch (error) {
              console.warn('⚠️ Failed to restart recognition:', error);
            }
          }
        }, 100);
      }
    };
  }

  private handleRecognitionResult(event: SpeechRecognitionEvent): void {
    const timestamp = Date.now();
    
    try {
      for (let i = this.lastResultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const alternative = result[0]; // Use best alternative
        
        if (result.isFinal) {
          // Final result
          const transcriptionResult: STTTranscriptionResult = {
            id: generateDeterministicId('webspeech_result', timestamp.toString(), 'transcription'),
            timestamp,
            text: alternative.transcript.trim(),
            language: this.currentLanguage,
            confidence: alternative.confidence || 0.8,
            isFinal: true,

            provider: 'web-speech-api',
            providerData: {
              alternatives: Array.from(result).map(alt => ({
                transcript: alt.transcript,
                confidence: alt.confidence
              }))
            },

            audioQuality: {
              snr: 10, // Estimated
              clarity: alternative.confidence || 0.8,
              duration: 0 // Not available in Web Speech API
            },

            processing: {
              latency: 50, // Estimated low latency for browser API
              processingTime: 50,
              queueTime: 0
            }
          };

          this.successCount++;
          this.lastRequestTime = timestamp;

          if (this.onTranscriptionCallback) {
            this.onTranscriptionCallback(transcriptionResult);
          }

          console.log(`✅ Web Speech transcription: "${transcriptionResult.text}" (confidence: ${transcriptionResult.confidence})`);

        } else {
          // Interim result
          if (this.onInterimCallback) {
            this.onInterimCallback(alternative.transcript, alternative.confidence || 0.5);
          }
        }
      }

      this.lastResultIndex = event.results.length;

    } catch (error) {
      console.error('❌ Error handling Web Speech result:', error);
      this.errorCount++;
    }
  }

  private handleRecognitionError(event: SpeechRecognitionErrorEvent): void {
    let shouldRestart = false;

    switch (event.error) {
      case 'no-speech':
        console.warn('⚠️ No speech detected');
        shouldRestart = true;
        break;
      case 'audio-capture':
        console.error('❌ Audio capture error');
        break;
      case 'not-allowed':
        console.error('❌ Microphone permission denied');
        break;
      case 'network':
        console.error('❌ Network error');
        shouldRestart = true;
        break;
      case 'service-not-allowed':
        console.error('❌ Speech service not allowed');
        break;
      default:
        console.error(`❌ Recognition error: ${event.error}`);
        shouldRestart = true;
    }

    // Auto-restart on recoverable errors
    if (shouldRestart && this.isTranscribing) {
      setTimeout(() => {
        if (this.isTranscribing && this.recognition && !this.isRecognitionStarted) {
          try {
            this.recognition.start();
          } catch (error) {
            console.warn('⚠️ Failed to restart after error:', error);
          }
        }
      }, 1000);
    }
  }

  private mapLanguageToWebSpeech(language: STTLanguage): string {
    const languageMap: Record<STTLanguage, string> = {
      'en': 'en-US',
      'ru': 'ru-RU',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-PT',
      'zh': 'zh-CN',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'auto': 'en-US' // Default to English for auto
    };
    
    return languageMap[language] || 'en-US';
  }

  async startTranscription(): Promise<void> {
    if (!this.isInitialized || !this.recognition) {
      throw new Error('Provider not initialized');
    }

    try {
      this.isTranscribing = true;
      
      if (!this.isRecognitionStarted) {
        this.recognition.start();
      }
      
      console.log('🔊 Web Speech STT transcription started');

    } catch (error) {
      console.error('❌ Failed to start Web Speech transcription:', error);
      this.isTranscribing = false;
      throw error;
    }
  }

  async processAudioChunk(audioData: Float32Array | Blob): Promise<STTTranscriptionResult | null> {
    // Web Speech API handles audio capture internally
    // This method is not used for Web Speech API but required by interface
    return null;
  }

  // Set callbacks for real-time results
  setCallbacks(
    onTranscription: (result: STTTranscriptionResult) => void,
    onInterim?: (text: string, confidence: number) => void
  ): void {
    this.onTranscriptionCallback = onTranscription;
    this.onInterimCallback = onInterim || null;
  }

  // Change recognition language
  setLanguage(language: STTLanguage): void {
    this.currentLanguage = language;
    
    if (this.recognition) {
      this.recognition.lang = this.mapLanguageToWebSpeech(language);
      
      // Restart recognition if active to apply new language
      if (this.isTranscribing && this.isRecognitionStarted) {
        this.recognition.stop();
        // Recognition will auto-restart via onend handler
      }
    }
  }

  async stopTranscription(): Promise<void> {
    this.isTranscribing = false;

    if (this.recognition && this.isRecognitionStarted) {
      this.recognition.stop();
    }

    console.log('🛑 Web Speech STT transcription stopped');
  }

  async destroy(): Promise<void> {
    await this.stopTranscription();
    
    if (this.recognition) {
      this.recognition.onstart = null;
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition = null;
    }
    
    this.isInitialized = false;
    this.onTranscriptionCallback = null;
    this.onInterimCallback = null;
    
    console.log('🗑️ Web Speech STT Provider destroyed');
  }

  getStatus(): { isAvailable: boolean; latency: number; errorRate: number } {
    const totalRequests = this.successCount + this.errorCount;
    const errorRate = totalRequests > 0 ? this.errorCount / totalRequests : 0;

    return {
      isAvailable: this.isInitialized && this.checkBrowserSupport(),
      latency: this.latency,
      errorRate
    };
  }
}