/**
 * AudioStreamMultiplexer Service for EMDR42
 * Provides conflict-free microphone access for multiple consumers
 * Supports emotion analysis, voice chat, recording simultaneously
 * 
 * Features:
 * - Single getUserMedia request with AudioContext multiplexing
 * - Consumer priority management and quality optimization
 * - ChannelSplitter/Merger for independent audio branches
 * - 16kHz echo cancellation and noise suppression
 * - Backward compatibility with existing services
 */

import type {
  AudioConsumer,
  AudioConsumerStatus,
  AudioStreamMultiplexerConfig,
  AudioStreamMultiplexerStatus,
  AudioStreamMultiplexerMetrics
} from '@/../../shared/types';

import { generateDeterministicId } from '@/lib/deterministicUtils';

// === Default Configuration ===

export const defaultMultiplexerConfig: AudioStreamMultiplexerConfig = {
  masterAudio: {
    sampleRate: 16000, // Optimal for voice processing
    channels: 1, // Mono for efficiency
    bufferSize: 4096, // Balance latency vs stability
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  },
  consumers: {
    maxConsumers: 5,
    priorityScheduling: true,
    adaptiveQuality: true
  },
  performance: {
    enableWebWorker: false, // Keep simple for now
    enableVAD: true,
    vadThreshold: 0.01,
    maxLatency: 100,
    dropFramesOnOverload: true
  },
  fallback: {
    enableFallback: true,
    fallbackSampleRate: 8000,
    maxRetries: 3,
    retryDelay: 1000
  }
};

// === AudioStreamMultiplexer Class ===

export class AudioStreamMultiplexer {
  private config: AudioStreamMultiplexerConfig;
  private isInitialized: boolean = false;
  private isStreaming: boolean = false;
  private startTime: number = 0;
  
  // Core Audio Infrastructure
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private splitterNode: ChannelSplitterNode | null = null;
  private mergerNode: ChannelMergerNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  
  // Consumer Management
  private consumers: Map<string, AudioConsumer> = new Map();
  private consumerStatuses: Map<string, AudioConsumerStatus> = new Map();
  private consumerNodes: Map<string, GainNode> = new Map();
  
  // Performance Tracking
  private metrics: AudioStreamMultiplexerMetrics = {
    uptime: 0,
    totalConsumers: 0,
    totalAudioFrames: 0,
    droppedFrames: 0,
    averageLatency: 0,
    peakLatency: 0,
    errorCount: 0,
    consumerSwitches: 0
  };
  
  // Status and Error Handling
  private lastError: string | null = null;
  private retryCount: number = 0;
  private vadState: boolean = false; // Voice Activity Detection
  
  // Event Callbacks
  private onStatusChangeCallback: ((status: AudioStreamMultiplexerStatus) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onMetricsUpdateCallback: ((metrics: AudioStreamMultiplexerMetrics) => void) | null = null;
  
  constructor(config?: Partial<AudioStreamMultiplexerConfig>) {
    this.config = {
      ...defaultMultiplexerConfig,
      ...config
    };
    
    console.log('🎤 AudioStreamMultiplexer created with config:', this.config);
  }
  
  // === Core Methods ===
  
  /**
   * Initialize the audio stream multiplexer
   * Single getUserMedia request with optimized constraints
   */
  async initializeStream(): Promise<void> {
    if (this.isInitialized) {
      console.warn('AudioStreamMultiplexer already initialized');
      return;
    }
    
    try {
      this.startTime = Date.now();
      
      // Validate browser support
      await this.validateBrowserSupport();
      
      // Initialize AudioContext
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resume AudioContext if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      // Request microphone access with optimized constraints
      const constraints = this.buildAudioConstraints();
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set up audio processing chain
      await this.setupAudioProcessingChain();
      
      this.isInitialized = true;
      console.log('✅ AudioStreamMultiplexer initialized successfully');
      
      this.updateStatus();
      
    } catch (error) {
      console.error('❌ Failed to initialize AudioStreamMultiplexer:', error);
      this.handleError(`Initialization failed: ${error}`);
      await this.attemptFallback();
      throw error;
    }
  }
  
  /**
   * Start streaming audio to all consumers
   */
  async startStreaming(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeStream();
    }
    
    if (this.isStreaming) {
      console.warn('AudioStreamMultiplexer already streaming');
      return;
    }
    
    try {
      // Start audio processing
      if (this.processorNode && this.audioContext) {
        this.processorNode.connect(this.audioContext.destination);
      }
      
      this.isStreaming = true;
      this.startTime = Date.now();
      
      // Activate all consumers
      for (const consumerId of Array.from(this.consumers.keys())) {
        const consumer = this.consumers.get(consumerId);
        if (consumer && consumer.active) {
          await this.activateConsumer(consumerId);
        }
      }
      
      console.log(`🎵 AudioStreamMultiplexer started streaming to ${this.consumers.size} consumers`);
      this.updateStatus();
      
    } catch (error) {
      console.error('❌ Failed to start streaming:', error);
      this.handleError(`Streaming failed: ${error}`);
      throw error;
    }
  }
  
  /**
   * Stop streaming audio
   */
  async stopStreaming(): Promise<void> {
    if (!this.isStreaming) {
      return;
    }
    
    try {
      // Deactivate all consumers
      for (const consumerId of Array.from(this.consumers.keys())) {
        await this.deactivateConsumer(consumerId);
      }
      
      // Disconnect audio processing
      if (this.processorNode) {
        this.processorNode.disconnect();
      }
      
      this.isStreaming = false;
      console.log('🛑 AudioStreamMultiplexer stopped streaming');
      
      this.updateStatus();
      
    } catch (error) {
      console.error('❌ Failed to stop streaming:', error);
      this.handleError(`Stop streaming failed: ${error}`);
    }
  }
  
  /**
   * Add a new audio consumer
   */
  async addConsumer(consumer: AudioConsumer): Promise<boolean> {
    try {
      // Validate consumer
      if (!consumer.id || this.consumers.has(consumer.id)) {
        throw new Error(`Consumer with ID ${consumer.id} already exists`);
      }
      
      if (this.consumers.size >= this.config.consumers.maxConsumers) {
        throw new Error('Maximum number of consumers reached');
      }
      
      // Set default configuration
      const fullConsumer: AudioConsumer = {
        ...consumer,
        config: {
          sampleRate: this.config.masterAudio.sampleRate,
          channels: this.config.masterAudio.channels,
          bufferSize: this.config.masterAudio.bufferSize,
          enableEchoCancellation: this.config.masterAudio.echoCancellation,
          enableNoiseSuppression: this.config.masterAudio.noiseSuppression,
          enableAutoGainControl: this.config.masterAudio.autoGainControl,
          ...consumer.config
        }
      };
      
      // Add consumer to collection
      this.consumers.set(consumer.id, fullConsumer);
      this.metrics.totalConsumers++;
      
      // Create audio nodes for the consumer
      await this.createConsumerAudioNodes(consumer.id);
      
      // Initialize consumer status
      const status: AudioConsumerStatus = {
        consumerId: consumer.id,
        isActive: false,
        isReceivingAudio: false,
        sampleRate: fullConsumer.config.sampleRate || this.config.masterAudio.sampleRate,
        channels: fullConsumer.config.channels || this.config.masterAudio.channels,
        latency: 0,
        quality: 1.0,
        packetsReceived: 0,
        packetsLost: 0,
        lastUpdate: Date.now()
      };
      
      this.consumerStatuses.set(consumer.id, status);
      
      // Activate consumer if streaming and consumer is active
      if (this.isStreaming && fullConsumer.active) {
        await this.activateConsumer(consumer.id);
      }
      
      console.log(`➕ Added consumer: ${consumer.name} (${consumer.type}), priority: ${consumer.priority}`);
      
      this.updateStatus();
      return true;
      
    } catch (error) {
      console.error('❌ Failed to add consumer:', error);
      this.handleError(`Add consumer failed: ${error}`);
      return false;
    }
  }
  
  /**
   * Remove an audio consumer
   */
  async removeConsumer(consumerId: string): Promise<boolean> {
    try {
      const consumer = this.consumers.get(consumerId);
      if (!consumer) {
        console.warn(`Consumer ${consumerId} not found`);
        return false;
      }
      
      // Deactivate consumer
      await this.deactivateConsumer(consumerId);
      
      // Remove audio nodes
      this.removeConsumerAudioNodes(consumerId);
      
      // Remove from collections
      this.consumers.delete(consumerId);
      this.consumerStatuses.delete(consumerId);
      
      console.log(`➖ Removed consumer: ${consumer.name} (${consumerId})`);
      
      this.updateStatus();
      return true;
      
    } catch (error) {
      console.error('❌ Failed to remove consumer:', error);
      this.handleError(`Remove consumer failed: ${error}`);
      return false;
    }
  }
  
  /**
   * Update consumer configuration
   */
  async updateConsumer(consumerId: string, updates: Partial<AudioConsumer>): Promise<boolean> {
    try {
      const consumer = this.consumers.get(consumerId);
      if (!consumer) {
        throw new Error(`Consumer ${consumerId} not found`);
      }
      
      // Update consumer
      const updatedConsumer = { ...consumer, ...updates };
      this.consumers.set(consumerId, updatedConsumer);
      
      // Update audio nodes if needed
      if (updates.config) {
        await this.updateConsumerAudioNodes(consumerId, updates.config);
      }
      
      // Update activation state
      if (updates.active !== undefined && updates.active !== consumer.active) {
        if (updates.active && this.isStreaming) {
          await this.activateConsumer(consumerId);
        } else if (!updates.active) {
          await this.deactivateConsumer(consumerId);
        }
      }
      
      console.log(`🔄 Updated consumer: ${updatedConsumer.name} (${consumerId})`);
      
      this.updateStatus();
      return true;
      
    } catch (error) {
      console.error('❌ Failed to update consumer:', error);
      this.handleError(`Update consumer failed: ${error}`);
      return false;
    }
  }
  
  /**
   * Get current status
   */
  getStatus(): AudioStreamMultiplexerStatus {
    const consumerStatuses = Array.from(this.consumerStatuses.values());
    const activeConsumers = consumerStatuses.filter(s => s.isActive).length;
    
    const performance = this.calculatePerformanceMetrics();
    const health = this.assessSystemHealth();
    
    return {
      isInitialized: this.isInitialized,
      isStreaming: this.isStreaming,
      masterStream: {
        sampleRate: this.config.masterAudio.sampleRate,
        channels: this.config.masterAudio.channels,
        quality: this.calculateOverallQuality(),
        latency: performance.averageLatency
      },
      consumers: consumerStatuses,
      activeConsumers,
      performance,
      health
    };
  }
  
  /**
   * Get performance metrics
   */
  getMetrics(): AudioStreamMultiplexerMetrics {
    this.metrics.uptime = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    return { ...this.metrics };
  }
  
  /**
   * Completely dispose of the multiplexer
   */
  async dispose(): Promise<void> {
    try {
      // Stop streaming
      await this.stopStreaming();
      
      // Remove all consumers
      const consumerIds = Array.from(this.consumers.keys());
      for (const consumerId of consumerIds) {
        await this.removeConsumer(consumerId);
      }
      
      // Disconnect and clean up audio nodes
      this.cleanupAudioNodes();
      
      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        await this.audioContext.close();
        this.audioContext = null;
      }
      
      this.isInitialized = false;
      this.isStreaming = false;
      
      console.log('🗑️ AudioStreamMultiplexer disposed');
      
    } catch (error) {
      console.error('❌ Failed to dispose AudioStreamMultiplexer:', error);
      this.handleError(`Disposal failed: ${error}`);
    }
  }
  
  // === Event Handlers ===
  
  onStatusChange(callback: (status: AudioStreamMultiplexerStatus) => void): void {
    this.onStatusChangeCallback = callback;
  }
  
  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }
  
  onMetricsUpdate(callback: (metrics: AudioStreamMultiplexerMetrics) => void): void {
    this.onMetricsUpdateCallback = callback;
  }
  
  // === Private Helper Methods ===
  
  /**
   * Validate browser support for required audio features
   */
  private async validateBrowserSupport(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia not supported in this browser');
    }
    
    if (!window.AudioContext && !(window as any).webkitAudioContext) {
      throw new Error('AudioContext not supported in this browser');
    }
    
    // Check for ScriptProcessorNode support (deprecated but still needed)
    const tempContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (!tempContext.createScriptProcessor) {
      throw new Error('ScriptProcessorNode not supported');
    }
    
    await tempContext.close();
  }
  
  /**
   * Build optimized audio constraints
   */
  private buildAudioConstraints(): MediaStreamConstraints {
    return {
      audio: {
        sampleRate: this.config.masterAudio.sampleRate,
        channelCount: this.config.masterAudio.channels,
        echoCancellation: this.config.masterAudio.echoCancellation,
        noiseSuppression: this.config.masterAudio.noiseSuppression,
        autoGainControl: this.config.masterAudio.autoGainControl,
        // Additional constraints for quality
        // Note: sampleSize and latency are not standard MediaTrackConstraints
        // They would be handled by the audio processing pipeline
      }
    };
  }
  
  /**
   * Set up the audio processing chain with multiplexing
   */
  private async setupAudioProcessingChain(): Promise<void> {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('AudioContext or MediaStream not available');
    }
    
    // Create source node from media stream
    this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
    
    // Create channel splitter for multiplexing
    this.splitterNode = this.audioContext.createChannelSplitter(this.config.masterAudio.channels);
    
    // Create channel merger for combining processed audio
    this.mergerNode = this.audioContext.createChannelMerger(this.config.masterAudio.channels);
    
    // Create script processor for real-time audio processing
    this.processorNode = this.audioContext.createScriptProcessor(
      this.config.masterAudio.bufferSize,
      this.config.masterAudio.channels,
      this.config.masterAudio.channels
    );
    
    // Set up audio processing callback
    this.processorNode.onaudioprocess = (event) => {
      this.processAudioFrame(event);
    };
    
    // Connect the audio processing chain
    this.sourceNode.connect(this.splitterNode);
    this.splitterNode.connect(this.mergerNode, 0, 0);
    if (this.config.masterAudio.channels === 2) {
      this.splitterNode.connect(this.mergerNode, 1, 1);
    }
    this.mergerNode.connect(this.processorNode);
    
    console.log('🔗 Audio processing chain established');
  }
  
  /**
   * Process audio frame and distribute to consumers
   */
  private processAudioFrame(event: AudioProcessingEvent): void {
    const inputBuffer = event.inputBuffer;
    const outputBuffer = event.outputBuffer;
    
    // Copy input to output (pass-through)
    for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      const inputData = inputBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      outputData.set(inputData);
    }
    
    // Voice Activity Detection
    if (this.config.performance.enableVAD) {
      this.vadState = this.detectVoiceActivity(inputBuffer);
    }
    
    // Distribute audio to active consumers
    this.distributeAudioToConsumers(inputBuffer);
    
    // Update metrics
    this.metrics.totalAudioFrames++;
    this.updateLatencyMetrics(Date.now());
  }
  
  /**
   * Simple Voice Activity Detection
   */
  private detectVoiceActivity(buffer: AudioBuffer): boolean {
    let sum = 0;
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < channelData.length; i++) {
      sum += Math.abs(channelData[i]);
    }
    
    const average = sum / channelData.length;
    return average > this.config.performance.vadThreshold;
  }
  
  /**
   * Distribute audio data to all active consumers
   */
  private distributeAudioToConsumers(buffer: AudioBuffer): void {
    // Skip distribution if no voice activity and VAD is enabled
    if (this.config.performance.enableVAD && !this.vadState) {
      return;
    }
    
    for (const consumerId of Array.from(this.consumers.keys())) {
      const consumer = this.consumers.get(consumerId);
      if (!consumer || !consumer.active) continue;
      
      const status = this.consumerStatuses.get(consumerId);
      if (!status || !status.isActive || !status.isReceivingAudio) continue;
      
      try {
        // Call consumer's audio data callback
        if (consumer.onAudioData) {
          const channelData = buffer.getChannelData(0);
          consumer.onAudioData(channelData, buffer.sampleRate);
        }
        
        // Call consumer's audio chunk callback
        if (consumer.onAudioChunk) {
          const audioBlob = this.bufferToBlob(buffer);
          consumer.onAudioChunk(audioBlob);
        }
        
        // Update consumer status
        status.packetsReceived++;
        status.lastUpdate = Date.now();
        
      } catch (error) {
        console.error(`❌ Error distributing audio to consumer ${consumerId}:`, error);
        status.packetsLost++;
        this.metrics.errorCount++;
      }
    }
  }
  
  /**
   * Convert AudioBuffer to Blob
   */
  private bufferToBlob(buffer: AudioBuffer): Blob {
    const channelData = buffer.getChannelData(0);
    const pcmData = new Int16Array(channelData.length);
    
    // Convert Float32 to Int16 PCM
    for (let i = 0; i < channelData.length; i++) {
      pcmData[i] = Math.max(-32768, Math.min(32767, channelData[i] * 32768));
    }
    
    return new Blob([pcmData.buffer], { type: 'audio/pcm' });
  }
  
  /**
   * Create audio nodes for a specific consumer
   */
  private async createConsumerAudioNodes(consumerId: string): Promise<void> {
    if (!this.audioContext) return;
    
    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1.0;
    
    this.consumerNodes.set(consumerId, gainNode);
  }
  
  /**
   * Remove audio nodes for a consumer
   */
  private removeConsumerAudioNodes(consumerId: string): void {
    const gainNode = this.consumerNodes.get(consumerId);
    if (gainNode) {
      gainNode.disconnect();
      this.consumerNodes.delete(consumerId);
    }
  }
  
  /**
   * Update consumer audio nodes configuration
   */
  private async updateConsumerAudioNodes(consumerId: string, config: any): Promise<void> {
    const gainNode = this.consumerNodes.get(consumerId);
    if (gainNode && config.volume !== undefined) {
      gainNode.gain.value = config.volume;
    }
  }
  
  /**
   * Activate a consumer
   */
  private async activateConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    const status = this.consumerStatuses.get(consumerId);
    
    if (!consumer || !status) return;
    
    status.isActive = true;
    status.isReceivingAudio = true;
    status.lastUpdate = Date.now();
    
    // Trigger consumer status callback
    if (consumer.onStatusChange) {
      consumer.onStatusChange(status);
    }
    
    console.log(`🟢 Activated consumer: ${consumer.name}`);
  }
  
  /**
   * Deactivate a consumer
   */
  private async deactivateConsumer(consumerId: string): Promise<void> {
    const consumer = this.consumers.get(consumerId);
    const status = this.consumerStatuses.get(consumerId);
    
    if (!consumer || !status) return;
    
    status.isActive = false;
    status.isReceivingAudio = false;
    status.lastUpdate = Date.now();
    
    // Trigger consumer status callback
    if (consumer.onStatusChange) {
      consumer.onStatusChange(status);
    }
    
    console.log(`🔴 Deactivated consumer: ${consumer.name}`);
  }
  
  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(): AudioStreamMultiplexerStatus['performance'] {
    const activeConsumers = Array.from(this.consumerStatuses.values())
      .filter(s => s.isActive).length;
    
    return {
      cpuUsage: Math.min(100, activeConsumers * 15), // Rough estimate
      memoryUsage: Math.min(500, activeConsumers * 10), // Rough estimate
      audioDrops: this.metrics.droppedFrames,
      totalProcessed: this.metrics.totalAudioFrames,
      averageLatency: this.metrics.averageLatency
    };
  }
  
  /**
   * Assess system health
   */
  private assessSystemHealth(): AudioStreamMultiplexerStatus['health'] {
    const issues: string[] = [];
    
    if (this.lastError) {
      issues.push(`Last error: ${this.lastError}`);
    }
    
    if (this.metrics.droppedFrames > this.metrics.totalAudioFrames * 0.05) {
      issues.push('High frame drop rate detected');
    }
    
    if (this.metrics.averageLatency > this.config.performance.maxLatency) {
      issues.push('Latency exceeding target');
    }
    
    return {
      isHealthy: issues.length === 0,
      issues,
      lastCheck: Date.now()
    };
  }
  
  /**
   * Calculate overall audio quality
   */
  private calculateOverallQuality(): number {
    if (this.consumerStatuses.size === 0) return 1.0;
    
    let totalQuality = 0;
    const statuses = Array.from(this.consumerStatuses.values());
    for (const status of statuses) {
      totalQuality += status.quality;
    }
    
    return totalQuality / statuses.length;
  }
  
  /**
   * Update latency metrics
   */
  private updateLatencyMetrics(timestamp: number): void {
    const latency = timestamp - (this.startTime || timestamp);
    
    if (latency > this.metrics.peakLatency) {
      this.metrics.peakLatency = latency;
    }
    
    // Rolling average
    this.metrics.averageLatency = (this.metrics.averageLatency * 0.9) + (latency * 0.1);
  }
  
  /**
   * Clean up all audio nodes
   */
  private cleanupAudioNodes(): void {
    try {
      if (this.processorNode) {
        this.processorNode.disconnect();
        this.processorNode = null;
      }
      
      if (this.mergerNode) {
        this.mergerNode.disconnect();
        this.mergerNode = null;
      }
      
      if (this.splitterNode) {
        this.splitterNode.disconnect();
        this.splitterNode = null;
      }
      
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      
      // Clean up consumer nodes
      const gainNodes = Array.from(this.consumerNodes.values());
      for (const gainNode of gainNodes) {
        gainNode.disconnect();
      }
      this.consumerNodes.clear();
      
    } catch (error) {
      console.error('Error cleaning up audio nodes:', error);
    }
  }
  
  /**
   * Handle errors and trigger callbacks
   */
  private handleError(error: string): void {
    this.lastError = error;
    this.metrics.errorCount++;
    
    console.error('🚨 AudioStreamMultiplexer error:', error);
    
    if (this.onErrorCallback) {
      this.onErrorCallback(error);
    }
  }
  
  /**
   * Attempt fallback configuration
   */
  private async attemptFallback(): Promise<void> {
    if (!this.config.fallback.enableFallback) return;
    
    this.retryCount++;
    if (this.retryCount > this.config.fallback.maxRetries) {
      console.error('❌ Max fallback retries exceeded');
      return;
    }
    
    console.log(`🔄 Attempting fallback #${this.retryCount}...`);
    
    // Use fallback sample rate
    this.config.masterAudio.sampleRate = this.config.fallback.fallbackSampleRate;
    this.config.masterAudio.bufferSize = 2048; // Smaller buffer for stability
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, this.config.fallback.retryDelay));
    
    try {
      await this.initializeStream();
    } catch (error) {
      console.error('Fallback also failed:', error);
    }
  }
  
  /**
   * Update status and trigger callbacks
   */
  private updateStatus(): void {
    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.getStatus());
    }
    
    if (this.onMetricsUpdateCallback) {
      this.onMetricsUpdateCallback(this.getMetrics());
    }
  }
}

// === Singleton Export ===

export let audioStreamMultiplexer: AudioStreamMultiplexer | null = null;

/**
 * Get or create the global AudioStreamMultiplexer instance
 */
export function getAudioStreamMultiplexer(config?: Partial<AudioStreamMultiplexerConfig>): AudioStreamMultiplexer {
  if (!audioStreamMultiplexer) {
    audioStreamMultiplexer = new AudioStreamMultiplexer(config);
  }
  return audioStreamMultiplexer;
}

/**
 * Reset the global AudioStreamMultiplexer instance
 */
export async function resetAudioStreamMultiplexer(): Promise<void> {
  if (audioStreamMultiplexer) {
    await audioStreamMultiplexer.dispose();
    audioStreamMultiplexer = null;
  }
}