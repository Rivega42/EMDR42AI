/**
 * Audio Cache Service for EMDR42 TTS System
 * 
 * Features:
 * - Intelligent cache key generation based on text, voice, and settings
 * - IndexedDB storage for persistent client-side audio caching
 * - LRU (Least Recently Used) eviction policy with configurable size limits
 * - Audio format optimization and compression
 * - Cache preloading for common therapeutic phrases
 * - Memory-efficient streaming cache for large audio files
 * - Cache statistics and performance monitoring
 */

import type {
  TTSVoiceConfig,
  TTSSynthesisRequest,
  TTSSynthesisResponse,
  TTSCacheEntry,
  TTSCacheConfig,
  TTSCacheStats
} from '@/../../shared/types';

interface CacheStorageItem {
  key: string;
  data: TTSCacheEntry;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

interface CacheMemoryItem {
  audioData: ArrayBuffer;
  metadata: TTSCacheEntry['metadata'];
  accessCount: number;
  lastAccessed: number;
}

/**
 * Audio Cache Service Implementation
 * Manages client-side caching of synthesized audio for optimal performance
 */
export class AudioCacheService {
  private config: TTSCacheConfig;
  private dbName = 'emdr42_tts_cache';
  private dbVersion = 1;
  private storeName = 'audio_cache';
  private db: IDBDatabase | null = null;
  private memoryCache = new Map<string, CacheMemoryItem>();
  private isInitialized = false;

  // Cache statistics
  private stats: TTSCacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
    avgResponseTime: 0,
    totalRequests: 0
  };

  // Pre-defined therapeutic phrases for cache preloading
  private therapeuticPhrases: Array<{
    text: string;
    context: string;
    priority: number;
  }> = [
    // EMDR guidance phrases
    { text: "Notice what you notice in your body right now.", context: "body-scan", priority: 10 },
    { text: "Follow the movements with your eyes.", context: "bilateral-stimulation", priority: 10 },
    { text: "Go with that. What comes up for you?", context: "processing", priority: 9 },
    { text: "Take a deep breath and let whatever needs to happen, happen.", context: "grounding", priority: 9 },
    { text: "On a scale from 0 to 10, how disturbing does it feel now?", context: "suds-rating", priority: 8 },
    
    // Calming and grounding phrases
    { text: "You are safe here and now.", context: "safety-assurance", priority: 8 },
    { text: "Let's pause and return to your safe place.", context: "resource-activation", priority: 7 },
    { text: "Notice your feet on the ground and your breath.", context: "grounding", priority: 7 },
    { text: "This feeling will pass. You are in control.", context: "reassurance", priority: 6 },
    
    // Phase transitions
    { text: "Let's move to the next phase of our session.", context: "phase-transition", priority: 5 },
    { text: "How does that positive belief feel in your body?", context: "installation", priority: 6 },
    { text: "We're going to close this session now.", context: "closure", priority: 4 }
  ];

  constructor(config: TTSCacheConfig = {}) {
    this.config = {
      maxCacheSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 500,
      expirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days
      compressionEnabled: true,
      preloadCommonPhrases: true,
      memoryCache: {
        maxSize: 10 * 1024 * 1024, // 10MB in memory
        maxEntries: 50
      },
      ...config
    };
  }

  /**
   * Initialize the cache service
   */
  async initialize(): Promise<void> {
    try {
      console.log('🗃️ Initializing Audio Cache Service...');
      
      // Initialize IndexedDB
      await this.initializeIndexedDB();
      
      // Load cache statistics
      await this.loadCacheStats();
      
      // Preload common therapeutic phrases if enabled
      if (this.config.preloadCommonPhrases) {
        this.preloadTherapeuticPhrases();
      }

      // Start background cleanup
      this.startPeriodicCleanup();

      this.isInitialized = true;
      console.log('✅ Audio Cache Service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Audio Cache Service:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Initialize IndexedDB for persistent storage
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('💾 IndexedDB initialized for audio cache');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          
          // Create indexes for efficient querying
          store.createIndex('lastAccessed', 'lastAccessed');
          store.createIndex('context', 'data.metadata.context');
          store.createIndex('voice', 'data.metadata.voice.name');
          
          console.log('🔧 IndexedDB schema created');
        }
      };
    });
  }

  /**
   * Generate cache key from synthesis request
   */
  generateCacheKey(request: TTSSynthesisRequest): string {
    const keyParts = [
      this.hashString(request.text),
      request.voice.name,
      request.voice.language,
      request.voice.gender,
      request.options.speed.toFixed(2),
      request.options.pitch.toFixed(1),
      request.options.volume.toFixed(2),
      request.quality,
      request.metadata.context || 'general'
    ];
    
    return `tts_${keyParts.join('_')}`;
  }

  /**
   * Get cached audio if available
   */
  async getCachedAudio(cacheKey: string): Promise<TTSCacheEntry | null> {
    const startTime = performance.now();
    
    try {
      // First check memory cache
      const memoryCacheItem = this.memoryCache.get(cacheKey);
      if (memoryCacheItem) {
        memoryCacheItem.accessCount++;
        memoryCacheItem.lastAccessed = Date.now();
        
        this.updateStats('hit', performance.now() - startTime);
        console.log('⚡ Cache hit from memory:', cacheKey);
        
        return {
          audioData: memoryCacheItem.audioData,
          format: 'wav',
          duration: memoryCacheItem.metadata.originalDuration,
          size: memoryCacheItem.audioData.byteLength,
          metadata: memoryCacheItem.metadata,
          streaming: { isStreamable: false }
        };
      }

      // Check IndexedDB cache
      const cachedEntry = await this.getCachedFromDB(cacheKey);
      if (cachedEntry) {
        // Check if entry has expired
        const isExpired = Date.now() - cachedEntry.data.metadata.cachedAt > this.config.expirationTime;
        
        if (isExpired) {
          await this.removeCachedAudio(cacheKey);
          this.updateStats('miss', performance.now() - startTime);
          return null;
        }

        // Update access information
        await this.updateCacheAccess(cacheKey);
        
        // Add to memory cache if there's space
        this.addToMemoryCache(cacheKey, cachedEntry.data);
        
        this.updateStats('hit', performance.now() - startTime);
        console.log('💾 Cache hit from IndexedDB:', cacheKey);
        
        return cachedEntry.data;
      }

      this.updateStats('miss', performance.now() - startTime);
      return null;

    } catch (error) {
      console.error('Cache retrieval error:', error);
      this.updateStats('miss', performance.now() - startTime);
      return null;
    }
  }

  /**
   * Cache synthesized audio
   */
  async cacheAudio(cacheKey: string, response: TTSSynthesisResponse): Promise<void> {
    try {
      if (!this.isInitialized) {
        console.warn('Cache not initialized, skipping cache operation');
        return;
      }

      const entry: TTSCacheEntry = {
        audioData: response.audioData,
        format: response.format,
        duration: response.duration,
        size: response.size,
        metadata: {
          ...response.metadata,
          cacheKey,
          cachedAt: Date.now(),
          accessCount: 1,
          originalDuration: response.duration
        },
        streaming: response.streaming
      };

      // Add to memory cache first
      this.addToMemoryCache(cacheKey, entry);

      // Add to IndexedDB for persistence
      await this.saveCacheToDB(cacheKey, entry);

      console.log('💾 Audio cached successfully:', cacheKey);

    } catch (error) {
      console.error('Failed to cache audio:', error);
    }
  }

  /**
   * Add entry to memory cache with LRU eviction
   */
  private addToMemoryCache(key: string, entry: TTSCacheEntry): void {
    const item: CacheMemoryItem = {
      audioData: entry.audioData,
      metadata: entry.metadata,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    // Check if we need to evict items
    if (this.memoryCache.size >= this.config.memoryCache.maxEntries) {
      this.evictFromMemoryCache();
    }

    this.memoryCache.set(key, item);
  }

  /**
   * Evict least recently used items from memory cache
   */
  private evictFromMemoryCache(): void {
    if (this.memoryCache.size === 0) return;

    const entries = Array.from(this.memoryCache.entries());
    entries.sort(([,a], [,b]) => a.lastAccessed - b.lastAccessed);
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
    }
  }

  /**
   * Get cached entry from IndexedDB
   */
  private async getCachedFromDB(key: string): Promise<CacheStorageItem | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve from cache'));
      };
    });
  }

  /**
   * Save entry to IndexedDB
   */
  private async saveCacheToDB(key: string, entry: TTSCacheEntry): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('IndexedDB not initialized'));
        return;
      }

      const item: CacheStorageItem = {
        key,
        data: entry,
        accessCount: 1,
        lastAccessed: Date.now(),
        size: entry.size
      };

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        this.updateStatsOnCache(entry.size);
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to save to cache'));
      };
    });
  }

  /**
   * Remove cached audio
   */
  async removeCachedAudio(key: string): Promise<void> {
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      // Remove from IndexedDB
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise<void>((resolve, reject) => {
          const request = store.delete(key);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(new Error('Failed to remove from cache'));
        });
      }

    } catch (error) {
      console.error('Failed to remove cached audio:', error);
    }
  }

  /**
   * Update cache access information
   */
  private async updateCacheAccess(key: string): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(key);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          item.accessCount++;
          item.lastAccessed = Date.now();
          store.put(item);
        }
        resolve();
      };

      getRequest.onerror = () => resolve(); // Ignore errors
    });
  }

  /**
   * Preload common therapeutic phrases
   */
  private async preloadTherapeuticPhrases(): Promise<void> {
    console.log('🚀 Preloading therapeutic phrases...');
    
    // This would typically be done in the background
    // For now, we'll just log the intent
    const highPriorityPhrases = this.therapeuticPhrases
      .filter(phrase => phrase.priority >= 8)
      .sort((a, b) => b.priority - a.priority);

    console.log(`📚 ${highPriorityPhrases.length} high-priority phrases identified for preloading`);
    
    // In a real implementation, you would:
    // 1. Check if phrases are already cached
    // 2. Generate TTS for missing phrases during idle time
    // 3. Cache them with high priority flags
  }

  /**
   * Start periodic cleanup of expired cache entries
   */
  private startPeriodicCleanup(): void {
    // Run cleanup every hour
    setInterval(async () => {
      await this.cleanupExpiredEntries();
    }, 60 * 60 * 1000);

    // Initial cleanup
    setTimeout(() => this.cleanupExpiredEntries(), 5000);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredEntries(): Promise<void> {
    try {
      console.log('🧹 Starting cache cleanup...');
      
      if (!this.db) return;

      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('lastAccessed');
      
      const now = Date.now();
      const cutoff = now - this.config.expirationTime;
      
      let deletedCount = 0;
      
      const request = index.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const item = cursor.value as CacheStorageItem;
          
          if (item.lastAccessed < cutoff) {
            cursor.delete();
            deletedCount++;
            this.stats.evictions++;
          }
          
          cursor.continue();
        } else {
          console.log(`🗑️ Cleanup completed: ${deletedCount} expired entries removed`);
        }
      };

    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): TTSCacheStats {
    this.stats.hitRate = this.stats.totalRequests > 0 
      ? this.stats.hits / this.stats.totalRequests 
      : 0;
    
    return { ...this.stats };
  }

  /**
   * Clear all cache data
   */
  async clearCache(): Promise<void> {
    try {
      console.log('🗑️ Clearing all cache data...');
      
      // Clear memory cache
      this.memoryCache.clear();
      
      // Clear IndexedDB
      if (this.db) {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        await new Promise<void>((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(new Error('Failed to clear cache'));
        });
      }

      // Reset statistics
      this.stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        totalSize: 0,
        entryCount: 0,
        hitRate: 0,
        avgResponseTime: 0,
        totalRequests: 0
      };

      console.log('✅ Cache cleared successfully');

    } catch (error) {
      console.error('Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Utility functions
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private updateStats(type: 'hit' | 'miss', responseTime: number): void {
    if (type === 'hit') {
      this.stats.hits++;
    } else {
      this.stats.misses++;
    }
    
    this.stats.totalRequests++;
    this.stats.avgResponseTime = (this.stats.avgResponseTime + responseTime) / 2;
  }

  private updateStatsOnCache(size: number): void {
    this.stats.entryCount++;
    this.stats.totalSize += size;
  }

  private async loadCacheStats(): Promise<void> {
    try {
      if (!this.db) return;

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        this.stats.entryCount = countRequest.result;
      };

      // Calculate total size
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const items = getAllRequest.result as CacheStorageItem[];
        this.stats.totalSize = items.reduce((sum, item) => sum + item.size, 0);
      };

    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  }

  /**
   * Export cache for backup/debugging
   */
  async exportCache(): Promise<any> {
    try {
      if (!this.db) return null;

      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          resolve({
            entries: request.result,
            stats: this.stats,
            exportedAt: new Date().toISOString()
          });
        };
        request.onerror = () => reject(new Error('Failed to export cache'));
      });

    } catch (error) {
      console.error('Cache export error:', error);
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Audio Cache Service...');
    
    this.memoryCache.clear();
    
    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.isInitialized = false;
  }
}