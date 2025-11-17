/**
 * Phase 6: Caching Layer Implementation
 *
 * In-memory caching with LRU eviction, TTL support, and tag-based invalidation
 */

import crypto from 'crypto';
import {
  CacheConfig,
  CacheEntry,
  CacheSetOptions,
  CacheGetOptions,
  CacheStats,
  CacheStrategy,
} from './cache-types';

/**
 * Doubly-linked list node for O(1) LRU
 */
class LRUNode {
  key: string;
  prev: LRUNode | null = null;
  next: LRUNode | null = null;

  constructor(key: string) {
    this.key = key;
  }
}

/**
 * LRU (Least Recently Used) eviction strategy with O(1) operations
 * Uses doubly-linked list + hash map for constant-time access and eviction
 */
class LRUStrategy implements CacheStrategy {
  private head: LRUNode | null = null; // Most recently used
  private tail: LRUNode | null = null; // Least recently used
  private nodeMap: Map<string, LRUNode> = new Map(); // O(1) node lookup

  /**
   * Move node to head (mark as most recently used) - O(1)
   */
  private moveToHead(node: LRUNode): void {
    if (node === this.head) return; // Already at head

    // Remove from current position
    this.removeNode(node);

    // Add to head
    this.addToHead(node);
  }

  /**
   * Remove node from list - O(1)
   */
  private removeNode(node: LRUNode): void {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next; // Node was head
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev; // Node was tail
    }

    node.prev = null;
    node.next = null;
  }

  /**
   * Add node to head - O(1)
   */
  private addToHead(node: LRUNode): void {
    node.next = this.head;
    node.prev = null;

    if (this.head) {
      this.head.prev = node;
    }

    this.head = node;

    if (!this.tail) {
      this.tail = node; // First node
    }
  }

  onAccess(key: string): void {
    const node = this.nodeMap.get(key);
    if (node) {
      this.moveToHead(node); // O(1)
    }
  }

  getEvictionCandidate(): string | null {
    return this.tail?.key ?? null; // O(1) - always return tail
  }

  onAdd(key: string): void {
    const node = new LRUNode(key);
    this.nodeMap.set(key, node);
    this.addToHead(node); // O(1)
  }

  onRemove(key: string): void {
    const node = this.nodeMap.get(key);
    if (node) {
      this.removeNode(node); // O(1)
      this.nodeMap.delete(key);
    }
  }

  reset(): void {
    this.head = null;
    this.tail = null;
    this.nodeMap.clear();
  }
}

/**
 * In-memory cache manager with LRU eviction and TTL support
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> Set of keys
  private config: CacheConfig;
  private strategy: CacheStrategy;

  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    expirations: 0,
  };

  // Expiration cleanup interval
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.config = config;
    this.strategy = new LRUStrategy();

    // Start periodic cleanup of expired entries
    this.startCleanup();
  }

  /**
   * Set a value in the cache
   */
  async set(key: string, value: any, options?: CacheSetOptions): Promise<void> {
    const fullKey = this.getFullKey(key, options?.namespace);
    const ttl = options?.ttl ?? this.config.ttl;
    const now = Date.now();

    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize && !this.cache.has(fullKey)) {
      await this.evict();
    }

    const entry: CacheEntry = {
      value,
      key: fullKey,
      expiresAt: now + ttl,
      tags: options?.tags || [],
      namespace: options?.namespace,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
    };

    this.cache.set(fullKey, entry);
    this.strategy.onAdd(fullKey);

    // Update tag index
    if (options?.tags) {
      for (const tag of options.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set());
        }
        this.tagIndex.get(tag)!.add(fullKey);
      }
    }
  }

  /**
   * Get a value from the cache
   */
  async get(key: string, options?: CacheGetOptions): Promise<any> {
    const fullKey = this.getFullKey(key, options?.namespace);
    const entry = this.cache.get(fullKey);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      await this.delete(key, options);
      this.stats.misses++;
      this.stats.expirations++;
      return null;
    }

    // Update access time and count
    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.strategy.onAccess(fullKey);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Check if a key exists in the cache
   */
  async has(key: string, options?: CacheGetOptions): Promise<boolean> {
    const value = await this.get(key, options);
    return value !== null;
  }

  /**
   * Delete a key from the cache
   */
  async delete(key: string, options?: CacheGetOptions): Promise<void> {
    const fullKey = this.getFullKey(key, options?.namespace);
    const entry = this.cache.get(fullKey);

    if (entry) {
      // Remove from tag index
      if (entry.tags) {
        for (const tag of entry.tags) {
          this.tagIndex.get(tag)?.delete(fullKey);
        }
      }

      this.cache.delete(fullKey);
      this.strategy.onRemove(fullKey);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.tagIndex.clear();
    this.strategy.reset();
  }

  /**
   * Invalidate all keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    const regex = this.patternToRegex(pattern);
    const keysToDelete: string[] = [];

    for (const [fullKey, entry] of this.cache.entries()) {
      // Extract the key part after namespace
      const keyParts = fullKey.split(':');
      const keyWithoutNamespace = keyParts.slice(1).join(':');

      if (regex.test(keyWithoutNamespace)) {
        keysToDelete.push(fullKey);
      }
    }

    for (const fullKey of keysToDelete) {
      this.cache.delete(fullKey);
      this.strategy.onRemove(fullKey);
    }
  }

  /**
   * Invalidate all keys with a specific tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);
    if (!keys) return;

    const keysToDelete = Array.from(keys);
    for (const fullKey of keysToDelete) {
      const entry = this.cache.get(fullKey);
      if (entry) {
        // Remove from all tag indexes
        if (entry.tags) {
          for (const t of entry.tags) {
            this.tagIndex.get(t)?.delete(fullKey);
          }
        }
        this.cache.delete(fullKey);
        this.strategy.onRemove(fullKey);
      }
    }
  }

  /**
   * Clear all entries in a namespace
   */
  async clearNamespace(namespace: string): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [fullKey, entry] of this.cache.entries()) {
      if (entry.namespace === namespace) {
        keysToDelete.push(fullKey);
      }
    }

    for (const fullKey of keysToDelete) {
      const entry = this.cache.get(fullKey);
      if (entry) {
        // Remove from tag indexes
        if (entry.tags) {
          for (const tag of entry.tags) {
            this.tagIndex.get(tag)?.delete(fullKey);
          }
        }
        this.cache.delete(fullKey);
        this.strategy.onRemove(fullKey);
      }
    }
  }

  /**
   * Generate a cache key for a query
   */
  generateQueryKey(sql: string, params?: any[]): string {
    // Use FNV-1a hash (20x faster than SHA-256, good enough for cache keys)
    const serialized = sql + JSON.stringify(params || []);
    const hash = this.fnv1a(serialized);

    return `query:${hash}`;
  }

  /**
   * FNV-1a hash function (fast non-cryptographic hash for cache keys)
   * 20x faster than SHA-256, good enough for cache key generation
   */
  private fnv1a(str: string): string {
    let hash = 2166136261; // FNV offset basis (32-bit)
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return (hash >>> 0).toString(36); // Convert to base36 string (unsigned 32-bit)
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
      hitRate,
      size: this.cache.size,
      evictions: this.stats.evictions,
      expirations: this.stats.expirations,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
    };
  }

  /**
   * Disconnect and cleanup
   */
  async disconnect(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Private: Get full key with namespace
   */
  private getFullKey(key: string, namespace?: string): string {
    const ns = namespace || this.config.namespace || 'default';
    return `${ns}:${key}`;
  }

  /**
   * Private: Evict least recently used entry
   */
  private async evict(): Promise<void> {
    const fullKeyToEvict = this.strategy.getEvictionCandidate();
    if (fullKeyToEvict) {
      const entry = this.cache.get(fullKeyToEvict);
      if (entry) {
        // Remove from tag indexes
        if (entry.tags) {
          for (const tag of entry.tags) {
            this.tagIndex.get(tag)?.delete(fullKeyToEvict);
          }
        }
        this.cache.delete(fullKeyToEvict);
        this.strategy.onRemove(fullKeyToEvict);
        this.stats.evictions++;
      }
    }
  }

  /**
   * Private: Convert glob pattern to regex
   */
  private patternToRegex(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    const regexPattern = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Private: Start periodic cleanup of expired entries
   * Quality Audit Fix: Adaptive interval (30s default) with batch deletion limits
   */
  private startCleanup(): void {
    // Default to 30 seconds (Quality Audit Fix: Changed from 5s)
    const cleanupInterval = this.config.cleanupIntervalMs || 30000;
    const maxBatchSize = this.config.maxCleanupBatchSize || 100;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      // Quality Audit Fix: Limit batch size to prevent long-running cleanup
      let count = 0;
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          keysToDelete.push(key);
          count++;
          if (count >= maxBatchSize) {
            break; // Stop after max batch size
          }
        }
      }

      // Delete expired entries
      for (const key of keysToDelete) {
        const entry = this.cache.get(key);
        if (entry) {
          this.delete(entry.key, { namespace: entry.namespace });
          this.stats.expirations++;
        }
      }
    }, cleanupInterval);

    // Don't keep the process alive
    this.cleanupInterval.unref();
  }
}
