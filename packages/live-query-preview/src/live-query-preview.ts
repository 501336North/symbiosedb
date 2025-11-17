/**
 * Live Query Preview
 * Debounced query execution with smart caching for instant feedback
 */

import { createHash } from 'crypto';
import {
  QueryResult,
  LiveQueryOptions,
  QueryExecutor,
  CacheEntry,
  LiveQueryPreviewStats,
} from './types';

export class LiveQueryPreview {
  private executor: QueryExecutor;
  private options: Required<LiveQueryOptions>;
  private cache: Map<string, CacheEntry>;
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingQuery: string | null = null;
  private pendingResolve: ((result: QueryResult) => void) | null = null;

  // Statistics tracking
  private stats = {
    totalQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
    debouncedCalls: 0,
    executionTimes: [] as number[],
  };

  constructor(executor: QueryExecutor, options: LiveQueryOptions = {}) {
    this.executor = executor;
    this.options = {
      debounceMs: options.debounceMs ?? 300,
      previewRowLimit: options.previewRowLimit ?? 100,
      enableCache: options.enableCache ?? true,
      cacheTTL: options.cacheTTL ?? 60000,
      maxCacheSize: options.maxCacheSize ?? 100,
    };
    this.cache = new Map();
  }

  /**
   * Execute query with debouncing and caching
   */
  async executeQuery(query: string): Promise<QueryResult> {
    // Handle empty query
    if (!query || query.trim() === '') {
      return {
        query,
        rows: [],
        totalRows: 0,
        hasMore: false,
        executionTime: 0,
        fromCache: false,
        timestamp: Date.now(),
        error: 'Query text is empty',
      };
    }

    // Check cache first
    if (this.options.enableCache) {
      const cachedResult = this.getFromCache(query);
      if (cachedResult) {
        this.stats.cacheHits++;
        this.stats.totalQueries++;
        return {
          ...cachedResult,
          fromCache: true,
        };
      }
    }

    // Return a promise that will be resolved after debounce
    return new Promise<QueryResult>((resolve) => {
      // Cancel previous pending execution
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.stats.debouncedCalls++;

        // Reject previous promise with debounced result
        if (this.pendingResolve) {
          this.pendingResolve({
            query: this.pendingQuery || '',
            rows: [],
            totalRows: 0,
            hasMore: false,
            executionTime: 0,
            fromCache: false,
            timestamp: Date.now(),
            error: 'Query was debounced',
          });
        }
      }

      this.pendingQuery = query;
      this.pendingResolve = resolve;

      // Set new debounce timer
      this.debounceTimer = setTimeout(() => {
        this.executeActualQuery(query).then(resolve);
      }, this.options.debounceMs);
    });
  }

  /**
   * Actually execute the query (after debounce)
   */
  private async executeActualQuery(query: string): Promise<QueryResult> {
    const startTime = Date.now();

    try {
      // Execute query
      const allRows = await this.executor(query);
      const executionTime = Date.now() - startTime;

      // Track execution time
      this.stats.executionTimes.push(executionTime);
      this.stats.cacheMisses++;
      this.stats.totalQueries++;

      // Limit rows for preview
      const totalRows = allRows.length;
      const rows = allRows.slice(0, this.options.previewRowLimit);
      const hasMore = totalRows > this.options.previewRowLimit;

      const result: QueryResult = {
        query,
        rows,
        totalRows,
        hasMore,
        executionTime,
        fromCache: false,
        timestamp: Date.now(),
      };

      // Cache the result
      if (this.options.enableCache) {
        this.addToCache(query, result);
      }

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Don't track failed queries in stats
      this.stats.cacheMisses++;
      this.stats.totalQueries++;

      return {
        query,
        rows: [],
        totalRows: 0,
        hasMore: false,
        executionTime,
        fromCache: false,
        timestamp: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate cache key from query
   */
  private generateCacheKey(query: string): string {
    return createHash('sha256').update(query.trim()).digest('hex');
  }

  /**
   * Get result from cache
   */
  private getFromCache(query: string): QueryResult | null {
    const key = this.generateCacheKey(query);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update LRU order: delete and re-add to move to end
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.result;
  }

  /**
   * Add result to cache
   */
  private addToCache(query: string, result: QueryResult): void {
    const key = this.generateCacheKey(query);

    // Evict oldest entry if cache is full
    if (this.cache.size >= this.options.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      ttl: this.options.cacheTTL,
    });
  }

  /**
   * Clear all cached results
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get statistics
   */
  getStats(): LiveQueryPreviewStats {
    const totalQueries = this.stats.totalQueries;
    const hitRate = totalQueries > 0 ? this.stats.cacheHits / totalQueries : 0;

    const avgExecutionTime =
      this.stats.executionTimes.length > 0
        ? this.stats.executionTimes.reduce((a, b) => a + b, 0) / this.stats.executionTimes.length
        : 0;

    return {
      totalQueries,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      hitRate,
      avgExecutionTime,
      debouncedCalls: this.stats.debouncedCalls,
    };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
      debouncedCalls: 0,
      executionTimes: [],
    };
  }
}
