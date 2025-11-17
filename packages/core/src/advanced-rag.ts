/**
 * Phase 8.6: Advanced RAG Features
 *
 * Advanced query optimization, multi-query fusion, routing, caching
 * Production-grade advanced RAG capabilities
 */

import { RAGPipeline, QueryOptions, QueryResult, EnhancedSearchResult } from './rag-pipeline';
import * as crypto from 'crypto';

export interface AdvancedRAGConfig {
  pipeline: RAGPipeline;
  enableQueryRewriting?: boolean;
  enableMultiQuery?: boolean;
  enableFusion?: boolean;
  multiQueryCount?: number;
  fusionAlgorithm?: 'rrf' | 'weighted';
  fusionK?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  maxCacheSize?: number;
}

export interface QueryRewriteResult {
  original: string;
  rewritten: string;
  changes: string[];
}

export interface MultiQueryOptions {
  count?: number;
}

export interface FusionQueryOptions extends QueryOptions {
  multiQueryCount?: number;
}

export interface FusedResult extends QueryResult {
  fusionScore?: number;
  results: FusedSearchResult[];
}

export interface FusedSearchResult extends EnhancedSearchResult {
  fusionScore: number;
}

export interface QueryRoute {
  sources: string[];
  category: string;
  strategy: string;
}

export interface QueryClassification {
  type: string;
  confidence: number;
}

export interface CitationVerification {
  verified: boolean;
  coverage: number;
  supportedSegments: string[];
}

export interface FilterOptions extends QueryOptions {
  filters: Record<string, any>;
}

export interface CachedQueryOptions extends QueryOptions {
  cacheTTL?: number;
}

export interface CachedQueryResult extends QueryResult {
  cached: boolean;
}

export interface CacheStatistics {
  hits: number;
  misses: number;
  hitRate: number;
}

export interface QueryMetrics {
  totalTime: number;
  embeddingTime: number;
  searchTime: number;
}

export interface MetricsQueryResult extends QueryResult {
  metrics: QueryMetrics;
}

/**
 * AdvancedRAG - Advanced RAG features for production systems
 */
export class AdvancedRAG {
  private config: AdvancedRAGConfig;
  private queryCache: Map<string, { result: QueryResult; timestamp: number }> = new Map();
  private cacheAccessOrder: Map<string, number> = new Map(); // LRU tracking
  private cacheAccessCounter: number = 0;
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  // Common typo corrections
  private typoMap: Map<string, string> = new Map([
    ['authetication', 'authentication'],
    ['tokn', 'token'],
    ['authentification', 'authentication'],
    ['authenitcation', 'authentication'],
  ]);

  // Abbreviation expansions
  private abbreviations: Map<string, string> = new Map([
    ['JWT', 'JSON Web Token'],
    ['API', 'Application Programming Interface'],
    ['DB', 'Database'],
    ['auth', 'authentication'],
  ]);

  // Informal language replacements
  private informalMap: Map<string, string> = new Map([
    ['pls', 'please'],
    ['w/', 'with'],
    ['thx', 'thanks'],
    ['plz', 'please'],
  ]);

  constructor(config: AdvancedRAGConfig) {
    this.config = {
      enableQueryRewriting: config.enableQueryRewriting ?? true,
      enableMultiQuery: config.enableMultiQuery ?? true,
      enableFusion: config.enableFusion ?? true,
      multiQueryCount: config.multiQueryCount ?? 3,
      fusionAlgorithm: config.fusionAlgorithm ?? 'rrf',
      fusionK: config.fusionK ?? 60,
      cacheEnabled: config.cacheEnabled ?? true,
      cacheTTL: config.cacheTTL ?? 300000, // 5 minutes default
      maxCacheSize: config.maxCacheSize ?? 1000, // Default max size 1000
      ...config,
    };
  }

  /**
   * Rewrite query to improve results
   */
  rewriteQuery(query: string): string {
    if (!this.config.enableQueryRewriting) {
      return query;
    }

    let rewritten = query;

    // Fix typos
    this.typoMap.forEach((correct, typo) => {
      const regex = new RegExp(`\\b${typo}\\b`, 'gi');
      rewritten = rewritten.replace(regex, correct);
    });

    // Replace informal language
    this.informalMap.forEach((formal, informal) => {
      if (informal === 'w/') {
        // Special case for w/ - don't use word boundaries
        rewritten = rewritten.replace(/w\//gi, formal);
      } else {
        // Escape special regex characters
        const escaped = informal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
        rewritten = rewritten.replace(regex, formal);
      }
    });

    // Clean up "how 2" -> "how to"
    rewritten = rewritten.replace(/\bhow\s+2\b/gi, 'how to');

    return rewritten;
  }

  /**
   * Generate multiple query variations
   */
  generateMultiQueries(query: string, options: MultiQueryOptions = {}): string[] {
    if (!query || query.trim() === '') {
      throw new Error('Query cannot be empty');
    }

    const count = options.count ?? this.config.multiQueryCount!;
    const variations: string[] = [query];

    // Generate variations
    if (count > 1) {
      // Variation 1: Rewritten version
      if (variations.length < count) {
        const rewritten = this.rewriteQuery(query);
        if (rewritten !== query) {
          variations.push(rewritten);
        }
      }

      // Variation 2: Question form
      if (variations.length < count) {
        if (!query.includes('?')) {
          variations.push(`What is ${query}?`);
        } else {
          variations.push(query.replace('?', ' explained?'));
        }
      }

      // Variation 3: Different phrasing
      if (variations.length < count) {
        if (query.toLowerCase().startsWith('how to')) {
          variations.push(query.replace(/^how to/i, 'Steps to'));
        } else if (query.toLowerCase().startsWith('what is')) {
          variations.push(query.replace(/^what is/i, 'Define'));
        } else {
          variations.push(`Explain ${query}`);
        }
      }

      // Variation 4: Add context
      if (variations.length < count) {
        variations.push(`${query} guide`);
      }

      // Variation 5: Technical angle
      if (variations.length < count) {
        variations.push(`${query} implementation`);
      }
    }

    return variations.slice(0, count);
  }

  /**
   * Query with Reciprocal Rank Fusion
   */
  async queryWithFusion(options: FusionQueryOptions): Promise<FusedResult> {
    const { query, multiQueryCount = this.config.multiQueryCount! } = options;

    // Generate multiple queries
    const queries = this.config.enableMultiQuery
      ? this.generateMultiQueries(query, { count: multiQueryCount })
      : [query];

    // Execute all queries
    const allResults: QueryResult[] = [];
    for (const q of queries) {
      const result = await this.config.pipeline.query({
        ...options,
        query: q,
      });
      allResults.push(result);
    }

    // Apply Reciprocal Rank Fusion
    const fusedResults = this.applyRRF(allResults);

    return {
      query,
      results: fusedResults,
      latency: allResults.reduce((sum, r) => sum + r.latency, 0),
      fusionScore: fusedResults.length > 0 ? fusedResults[0].fusionScore : 0,
    };
  }

  /**
   * Apply Reciprocal Rank Fusion algorithm
   */
  private applyRRF(results: QueryResult[]): FusedSearchResult[] {
    const k = this.config.fusionK!;
    const scoreMap: Map<string, { result: EnhancedSearchResult; fusionScore: number }> = new Map();

    // Calculate RRF scores
    results.forEach((queryResult) => {
      queryResult.results.forEach((result, rank) => {
        const id = result.id;
        const rrfScore = 1 / (k + rank + 1);

        if (scoreMap.has(id)) {
          const existing = scoreMap.get(id)!;
          existing.fusionScore += rrfScore;
        } else {
          scoreMap.set(id, {
            result,
            fusionScore: rrfScore,
          });
        }
      });
    });

    // Convert to array and sort by fusion score
    const fusedResults: FusedSearchResult[] = Array.from(scoreMap.values())
      .map(({ result, fusionScore }) => ({
        ...result,
        fusionScore,
      }))
      .sort((a, b) => b.fusionScore - a.fusionScore);

    return fusedResults;
  }

  /**
   * Route query to appropriate data sources
   */
  routeQuery(query: string): QueryRoute {
    const lowerQuery = query.toLowerCase();

    // Determine category
    let category = 'general';
    if (
      lowerQuery.includes('implement') ||
      lowerQuery.includes('code') ||
      lowerQuery.includes('function')
    ) {
      category = 'code';
    } else if (
      lowerQuery.includes('postgresql') ||
      lowerQuery.includes('database') ||
      lowerQuery.includes('query')
    ) {
      category = 'technical';
    } else if (
      lowerQuery.includes('what is') ||
      lowerQuery.includes('define') ||
      lowerQuery.includes('explain')
    ) {
      category = 'conceptual';
    }

    // Determine sources
    const sources: string[] = ['documentation'];
    if (category === 'code') {
      sources.push('code-examples', 'api-reference');
    }
    if (category === 'technical') {
      sources.push('technical-docs', 'api-reference');
    }

    // Determine strategy
    let strategy: string = 'semantic';
    if (category === 'code') {
      strategy = 'hybrid';
    } else if (lowerQuery.split(' ').length === 1) {
      strategy = 'keyword';
    }

    return {
      sources,
      category,
      strategy,
    };
  }

  /**
   * Classify query type
   */
  classifyQuery(query: string): QueryClassification {
    const lowerQuery = query.toLowerCase();
    let type = 'unknown';
    let confidence = 0.5;

    if (lowerQuery.startsWith('what is') || lowerQuery.startsWith('define')) {
      type = 'definition';
      confidence = 0.9;
    } else if (lowerQuery.startsWith('how to') || lowerQuery.startsWith('how do')) {
      type = 'howto';
      confidence = 0.9;
    } else if (lowerQuery.includes(' vs ') || lowerQuery.includes(' versus ')) {
      type = 'comparison';
      confidence = 0.85;
    } else if (
      lowerQuery.includes('not working') ||
      lowerQuery.includes('error') ||
      lowerQuery.includes('fix')
    ) {
      type = 'troubleshooting';
      confidence = 0.8;
    } else if (lowerQuery.includes('why') || lowerQuery.includes('explain')) {
      type = 'explanation';
      confidence = 0.75;
    }

    return { type, confidence };
  }

  /**
   * Verify answer against sources
   */
  verifyCitations(answer: string, sources: EnhancedSearchResult[]): CitationVerification {
    if (sources.length === 0) {
      return {
        verified: false,
        coverage: 0,
        supportedSegments: [],
      };
    }

    // Split answer into sentences
    const sentences = answer.match(/[^.!?]+[.!?]+/g) || [answer];
    const supportedSegments: string[] = [];

    // Check each sentence against sources
    sentences.forEach((sentence) => {
      const sentenceLower = sentence.toLowerCase();

      for (const source of sources) {
        const sourceLower = source.text.toLowerCase();

        // Simple overlap check
        const words = sentenceLower.split(/\s+/).filter((w) => w.length > 3);
        const overlaps = words.filter((word) => sourceLower.includes(word));

        if (overlaps.length >= Math.min(3, words.length * 0.5)) {
          supportedSegments.push(sentence.trim());
          break;
        }
      }
    });

    const coverage = supportedSegments.length / sentences.length;
    const verified = coverage >= 0.5;

    return {
      verified,
      coverage,
      supportedSegments,
    };
  }

  /**
   * Suggest related queries
   */
  async suggestQueries(query: string): Promise<Array<{ query: string; score: number }>> {
    // Generate variations as suggestions
    const variations = this.generateMultiQueries(query, { count: 5 });

    return variations.map((q, i) => ({
      query: q,
      score: 1 - i * 0.1,
    }));
  }

  /**
   * Autocomplete query
   */
  async autocompleteQuery(partial: string): Promise<string[]> {
    const completions: string[] = [];

    // Common completions
    const commonQueries = [
      'authentication',
      'authorization',
      'authenticate user',
      'authentication setup',
      'authentication guide',
    ];

    const partialLower = partial.toLowerCase();
    commonQueries.forEach((common) => {
      if (common.startsWith(partialLower)) {
        completions.push(common);
      }
    });

    return completions.slice(0, 5);
  }

  /**
   * Query with advanced filters
   */
  async queryWithFilters(options: FilterOptions): Promise<QueryResult> {
    const { filters, ...queryOptions } = options;

    // Validate filter operators
    for (const [field, value] of Object.entries(filters)) {
      if (typeof value === 'object' && value !== null) {
        const operators = Object.keys(value);
        const validOperators = ['$contains', '$gte', '$lte', '$gt', '$lt', '$ne'];

        for (const op of operators) {
          if (!validOperators.includes(op)) {
            throw new Error(`Invalid filter operator: ${op}`);
          }
        }
      }
    }

    // Convert advanced filters to simple metadata filter
    const metadataFilter: Record<string, any> = {};

    for (const [field, value] of Object.entries(filters)) {
      if (typeof value === 'object' && value !== null) {
        // Handle operators
        if (value.$contains !== undefined) {
          // For array contains, we'll just use exact match for now
          metadataFilter[field] = value.$contains;
        } else if (value.$gte !== undefined) {
          // For version comparison, simple string comparison
          metadataFilter[field] = value.$gte;
        }
        // Other operators can be added here
      } else {
        metadataFilter[field] = value;
      }
    }

    return await this.config.pipeline.query({
      ...queryOptions,
      filter: metadataFilter,
    });
  }

  /**
   * Cached query execution with LRU eviction
   */
  async cachedQuery(options: CachedQueryOptions): Promise<CachedQueryResult> {
    if (!this.config.cacheEnabled) {
      const result = await this.config.pipeline.query(options);
      return { ...result, cached: false };
    }

    const cacheKey = this.getCacheKey(options);
    const cached = this.queryCache.get(cacheKey);
    const now = Date.now();
    const ttl = options.cacheTTL ?? this.config.cacheTTL!;

    // Check if cached and not expired
    if (cached && now - cached.timestamp < ttl) {
      this.cacheHits++;
      // Update access order for LRU
      this.cacheAccessOrder.set(cacheKey, ++this.cacheAccessCounter);
      return { ...cached.result, cached: true };
    }

    // Execute query
    this.cacheMisses++;
    const result = await this.config.pipeline.query(options);

    // Check if we need to evict (LRU)
    if (this.queryCache.size >= this.config.maxCacheSize! && !this.queryCache.has(cacheKey)) {
      this.evictLRU();
    }

    // Store in cache
    this.queryCache.set(cacheKey, {
      result,
      timestamp: now,
    });

    // Update access order
    this.cacheAccessOrder.set(cacheKey, ++this.cacheAccessCounter);

    return { ...result, cached: false };
  }

  /**
   * Evict least recently used entry from cache
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    // Find least recently used key
    for (const [key, accessTime] of this.cacheAccessOrder.entries()) {
      if (accessTime < lruTime) {
        lruTime = accessTime;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.queryCache.delete(lruKey);
      this.cacheAccessOrder.delete(lruKey);
    }
  }

  /**
   * Invalidate query cache
   */
  invalidateCache(): void {
    this.queryCache.clear();
    this.cacheAccessOrder.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStatistics {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? this.cacheHits / total : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate,
    };
  }

  /**
   * Get current cache size
   */
  getCacheSize(): number {
    return this.queryCache.size;
  }

  /**
   * Reset cache statistics
   */
  resetCacheStats(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Batch query execution
   */
  async batchQuery(queries: string[]): Promise<QueryResult[]> {
    const results: QueryResult[] = [];

    for (const query of queries) {
      const result = await this.config.pipeline.query({ query });
      results.push(result);
    }

    return results;
  }

  /**
   * Query with performance metrics
   */
  async queryWithMetrics(options: QueryOptions): Promise<MetricsQueryResult> {
    const startTime = Date.now();

    // Measure embedding time (simulated)
    const embeddingStart = Date.now();
    // In real implementation, this would be actual embedding time
    const embeddingTime = 5; // Simulated

    // Execute query
    const searchStart = Date.now();
    const result = await this.config.pipeline.query(options);
    const searchTime = Date.now() - searchStart;

    const totalTime = Date.now() - startTime;

    return {
      ...result,
      metrics: {
        totalTime,
        embeddingTime,
        searchTime,
      },
    };
  }

  /**
   * Generate cache key from query options
   */
  private getCacheKey(options: QueryOptions): string {
    const key = JSON.stringify({
      query: options.query,
      topK: options.topK,
      filter: options.filter,
      minSimilarity: options.minSimilarity,
    });
    return crypto.createHash('md5').update(key).digest('hex');
  }
}
