/**
 * Phase 6: Caching Layer Type Definitions
 *
 * Type definitions for the caching system
 */

export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
  strategy: 'lru' | 'lfu' | 'fifo'; // Eviction strategy
  namespace?: string; // Optional namespace prefix
  cleanupIntervalMs?: number; // Quality Audit Fix: Configurable cleanup interval (default: 30000ms)
  maxCleanupBatchSize?: number; // Quality Audit Fix: Max entries to delete per cleanup cycle (default: 100)
}

export interface CacheEntry<T = any> {
  value: T;
  key: string;
  expiresAt: number;
  tags?: string[];
  namespace?: string;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheSetOptions {
  ttl?: number; // Override default TTL
  tags?: string[]; // Tags for grouped invalidation
  namespace?: string; // Namespace for key
}

export interface CacheGetOptions {
  namespace?: string; // Namespace for key
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number; // Current number of entries
  evictions: number; // Number of evicted entries
  expirations: number; // Number of expired entries
}

export interface CacheStrategy {
  /**
   * Called when an entry is accessed
   */
  onAccess(key: string): void;

  /**
   * Returns the key to evict when cache is full
   */
  getEvictionCandidate(): string | null;

  /**
   * Called when an entry is added
   */
  onAdd(key: string): void;

  /**
   * Called when an entry is removed
   */
  onRemove(key: string): void;

  /**
   * Reset the strategy state
   */
  reset(): void;
}
