/**
 * Live Query Preview Types
 * Defines interfaces for debounced query execution with caching
 */

export interface QueryResult {
  /** Query that was executed */
  query: string;
  /** Result rows (limited to previewRowLimit) */
  rows: any[];
  /** Total number of rows available (before limit) */
  totalRows: number;
  /** Whether more rows are available beyond the preview */
  hasMore: boolean;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Whether result came from cache */
  fromCache: boolean;
  /** Timestamp when result was generated */
  timestamp: number;
  /** Any error that occurred during execution */
  error?: string;
}

export interface LiveQueryOptions {
  /** Debounce delay in milliseconds (default: 300ms) */
  debounceMs?: number;
  /** Maximum rows to return in preview (default: 100) */
  previewRowLimit?: number;
  /** Enable caching (default: true) */
  enableCache?: boolean;
  /** Cache TTL in milliseconds (default: 60000 = 1 minute) */
  cacheTTL?: number;
  /** Max cache size (default: 100 queries) */
  maxCacheSize?: number;
}

export interface CacheEntry {
  result: QueryResult;
  timestamp: number;
  ttl: number;
}

export type QueryExecutor = (query: string) => Promise<any[]>;

export interface LiveQueryPreviewStats {
  /** Total queries executed */
  totalQueries: number;
  /** Queries served from cache */
  cacheHits: number;
  /** Queries executed (not cached) */
  cacheMisses: number;
  /** Cache hit rate (0-1) */
  hitRate: number;
  /** Average execution time (ms) */
  avgExecutionTime: number;
  /** Number of debounced calls (prevented executions) */
  debouncedCalls: number;
}
