/**
 * Phase 6: Query Memoization
 *
 * Automatic caching of query results with TTL and invalidation
 */

import { CacheManager } from './cache';

export interface MemoizationConfig {
  cache: CacheManager;
  defaultTTL: number;
  enableMemoization: boolean;
}

export interface QueryExecutionOptions {
  ttl?: number;
  tags?: string[];
  skipCache?: boolean;
}

export interface MemoizationStats {
  hits: number;
  misses: number;
  totalQueries: number;
  hitRate: number;
}

/**
 * Query memoization wrapper that automatically caches query results
 */
export class QueryMemoizer {
  private config: MemoizationConfig;
  private cache: CacheManager;

  // Statistics
  private stats = {
    hits: 0,
    misses: 0,
  };

  constructor(config: MemoizationConfig) {
    this.config = config;
    this.cache = config.cache;
  }

  /**
   * Execute a query with automatic result memoization
   *
   * @param sql - SQL query string
   * @param params - Query parameters
   * @param executor - Function that executes the query
   * @param options - Execution options (TTL, tags, skipCache)
   * @returns Query result (cached or freshly executed)
   */
  async execute<T = any>(
    sql: string,
    params: any[],
    executor: (sql: string, params: any[]) => Promise<T>,
    options?: QueryExecutionOptions
  ): Promise<T> {
    // Skip cache if memoization is disabled globally or for this query
    if (!this.config.enableMemoization || options?.skipCache) {
      this.stats.misses++;
      return await executor(sql, params);
    }

    // Generate cache key
    const cacheKey = this.cache.generateQueryKey(sql, params);

    // Try to get from cache
    const cached = await this.cache.get(cacheKey);
    if (cached !== null) {
      this.stats.hits++;
      return cached as T;
    }

    // Cache miss - execute query
    this.stats.misses++;

    try {
      const result = await executor(sql, params);

      // Cache the result
      const ttl = options?.ttl ?? this.config.defaultTTL;
      await this.cache.set(cacheKey, result, {
        ttl,
        tags: options?.tags,
      });

      return result;
    } catch (error) {
      // Don't cache errors - re-throw
      throw error;
    }
  }

  /**
   * Invalidate all cached queries with a specific tag
   */
  async invalidateByTag(tag: string): Promise<void> {
    await this.cache.invalidateByTag(tag);
  }

  /**
   * Invalidate queries matching a pattern
   */
  async invalidateByPattern(pattern: string): Promise<void> {
    await this.cache.invalidatePattern(pattern);
  }

  /**
   * Clear all cached queries
   */
  async clearAll(): Promise<void> {
    await this.cache.clear();
  }

  /**
   * Get memoization statistics
   */
  getStats(): MemoizationStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      totalQueries: total,
      hitRate,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
    };
  }
}
