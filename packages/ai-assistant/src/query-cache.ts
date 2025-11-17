/**
 * Query Cache Manager
 * LRU cache with TTL support for generated queries
 */

import { GeneratedQuery } from './types';
import crypto from 'crypto';

interface CacheEntry {
  value: GeneratedQuery;
  expiresAt: number; // 0 = never expires
  accessedAt: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  hitRate: number;
}

interface CacheOptions {
  maxSize?: number;
  defaultTTL?: number; // milliseconds (0 = never expires)
}

export class QueryCacheManager {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;
  private defaultTTL: number;
  private stats: {
    hits: number;
    misses: number;
    evictions: number;
  };

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 1000;
    this.defaultTTL = options.defaultTTL || 3600000; // 1 hour default
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    };
  }

  /**
   * Get query from cache
   */
  get(key: string): GeneratedQuery | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (entry.expiresAt > 0 && entry.expiresAt < now) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access time (LRU)
    entry.accessedAt = now;
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set query in cache
   */
  set(key: string, value: GeneratedQuery, ttl?: number): void {
    const now = Date.now();
    const usedTTL = ttl !== undefined ? ttl : this.defaultTTL;

    const entry: CacheEntry = {
      value,
      expiresAt: usedTTL > 0 ? now + usedTTL : 0,
      accessedAt: now,
    };

    // If key exists, just update it
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.cache.set(key, entry);
      return;
    }

    // Check if we need to evict (LRU)
    if (this.cache.size >= this.maxSize) {
      // Evict least recently used (first entry in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists (and is not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    // Check if expired
    const now = Date.now();
    if (entry.expiresAt > 0 && entry.expiresAt < now) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.stats.evictions = 0;
  }

  /**
   * Generate cache key from input
   */
  generateKey(text: string, context: Record<string, any>): string {
    const input = JSON.stringify({ text, context });
    return crypto.createHash('sha256').update(input).digest('hex');
  }
}
