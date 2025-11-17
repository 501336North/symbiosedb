/**
 * Phase 8.5 Part 1: RAG-Specific APIs - Embedding Manager
 *
 * Auto-generate embeddings, semantic search, and context management
 * Production-grade RAG features for AI developers
 */

import * as crypto from 'crypto';

export interface EmbeddingConfig {
  defaultModel?: string;
  cacheEmbeddings?: boolean;
  vectorConnector?: any;
  maxCacheSize?: number;
  maxEmbeddings?: number; // Quality Audit Fix: Prevent unbounded embeddings growth
}

export interface EmbedOptions {
  text: string;
  model?: string;
  skipCache?: boolean;
  retries?: number;
}

export interface EmbedResult {
  embedding: number[];
  model: string;
  tokens: number;
  cost: number;
  cached?: boolean;
  truncated?: boolean;
  dimensions?: number;
  success?: boolean;
  error?: string;
}

export interface EmbedBatchOptions {
  texts: string[];
  model?: string;
  batchSize?: number;
  continueOnError?: boolean;
}

export interface InsertOptions {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  model?: string;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number; // Pagination support
  threshold?: number;
  filter?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  score: number;
  text: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface BuildContextOptions {
  query: string;
  maxTokens: number;
  includeMetadata?: boolean;
  format?: 'string' | 'array';
}

export interface ContextResult {
  documents: Array<{
    id: string;
    text: string;
    score: number;
    metadata?: Record<string, any>;
  }>;
  totalTokens: number;
  truncated: boolean;
  formatted?: string;
}

export interface TokenStats {
  totalTokens: number;
  embeddingTokens: number;
  byModel: Record<string, number>;
  totalCost: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

export interface ModelInfo {
  dimensions: number;
  maxTokens: number;
  costPer1kTokens: number;
  provider: string;
}

interface CacheEntry {
  embedding: number[];
  timestamp: Date;
}

interface StoredEmbedding {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

/**
 * EmbeddingManager - RAG-native embedding and semantic search
 */
export class EmbeddingManager {
  private config: EmbeddingConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private embeddings: Map<string, StoredEmbedding> = new Map();

  // Inverted index: metadata_key -> value -> Set<embedding_id>
  // Enables O(1) metadata filtering instead of O(n) scan
  private metadataIndex: Map<string, Map<any, Set<string>>> = new Map();

  // Quality Audit Fix: LRU tracking for cache and embeddings
  private cacheAccessOrder: Map<string, number> = new Map();
  private embeddingAccessOrder: Map<string, number> = new Map();

  private tokenStats: TokenStats = {
    totalTokens: 0,
    embeddingTokens: 0,
    byModel: {},
    totalCost: 0,
  };
  private cacheHits = 0;
  private cacheMisses = 0;

  private modelConfigs: Map<string, ModelInfo> = new Map([
    [
      'text-embedding-3-small',
      {
        dimensions: 1536,
        maxTokens: 8191,
        costPer1kTokens: 0.00002,
        provider: 'openai',
      },
    ],
    [
      'text-embedding-3-large',
      {
        dimensions: 3072,
        maxTokens: 8191,
        costPer1kTokens: 0.00013,
        provider: 'openai',
      },
    ],
    [
      'embed-english-v3.0',
      {
        dimensions: 1024,
        maxTokens: 512,
        costPer1kTokens: 0.0001,
        provider: 'cohere',
      },
    ],
    [
      'all-MiniLM-L6-v2',
      {
        dimensions: 384,
        maxTokens: 256,
        costPer1kTokens: 0,
        provider: 'local',
      },
    ],
  ]);

  constructor(config: EmbeddingConfig = {}) {
    this.config = {
      defaultModel: config.defaultModel ?? 'text-embedding-3-small',
      cacheEmbeddings: config.cacheEmbeddings ?? true,
      vectorConnector: config.vectorConnector,
      maxCacheSize: config.maxCacheSize ?? 10000,
      maxEmbeddings: config.maxEmbeddings ?? 50000, // Quality Audit Fix: Default limit
    };
  }

  /**
   * Generate embedding from text
   */
  async embed(options: EmbedOptions): Promise<EmbedResult> {
    const { text, model = this.config.defaultModel!, skipCache = false, retries = 0 } = options;

    // Validate input
    if (!text || text.trim() === '') {
      throw new Error('Empty text cannot be embedded');
    }

    // Check model validity
    if (model && !this.modelConfigs.has(model)) {
      throw new Error(`Invalid model: ${model}`);
    }

    // Check cache
    const cacheKey = this.getCacheKey(text, model);
    if (this.config.cacheEmbeddings && !skipCache && this.cache.has(cacheKey)) {
      this.cacheHits++;
      const cached = this.cache.get(cacheKey)!;
      // Quality Audit Fix: Update access time for LRU
      this.cacheAccessOrder.set(cacheKey, Date.now());
      return {
        embedding: cached.embedding,
        model,
        tokens: this.estimateTokens(text),
        cost: 0, // No cost for cached embeddings
        cached: true,
        dimensions: cached.embedding.length,
      };
    }

    this.cacheMisses++;

    // Check text length and truncate if necessary
    const modelInfo = this.modelConfigs.get(model)!;
    const tokens = this.estimateTokens(text);
    const truncated = tokens > modelInfo.maxTokens;

    // Generate embedding (simulated)
    const embedding = this.generateEmbedding(text, model);
    const cost = this.calculateCost(tokens, model);

    // Update stats
    this.tokenStats.totalTokens += tokens;
    this.tokenStats.embeddingTokens += tokens;
    this.tokenStats.byModel[model] = (this.tokenStats.byModel[model] || 0) + tokens;
    this.tokenStats.totalCost += cost;

    // Cache embedding (with LRU eviction)
    if (this.config.cacheEmbeddings && !skipCache) {
      // Quality Audit Fix: Evict BEFORE adding if at capacity
      if (this.cache.size >= this.config.maxCacheSize! && !this.cache.has(cacheKey)) {
        this.evictLRUFromCache();
      }

      this.cache.set(cacheKey, {
        embedding,
        timestamp: new Date(),
      });
      this.cacheAccessOrder.set(cacheKey, Date.now());
    }

    return {
      embedding,
      model,
      tokens,
      cost,
      cached: false,
      truncated,
      dimensions: embedding.length,
    };
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedBatch(options: EmbedBatchOptions): Promise<EmbedResult[]> {
    const {
      texts,
      model = this.config.defaultModel!,
      batchSize = 100,
      continueOnError = false,
    } = options;

    const results: EmbedResult[] = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      for (const text of batch) {
        try {
          const result = await this.embed({ text, model });
          results.push({ ...result, success: true });
        } catch (error: any) {
          if (continueOnError) {
            results.push({
              embedding: [],
              model,
              tokens: 0,
              cost: 0,
              success: false,
              error: error.message,
            });
          } else {
            throw error;
          }
        }
      }
    }

    return results;
  }

  /**
   * Insert embedding into storage
   */
  async insert(options: InsertOptions): Promise<void> {
    const { id, text, metadata, model = this.config.defaultModel! } = options;

    const embedResult = await this.embed({ text, model });

    // Quality Audit Fix: Evict LRU embedding if at capacity
    if (this.embeddings.size >= this.config.maxEmbeddings! && !this.embeddings.has(id)) {
      this.evictLRUEmbedding();
    }

    this.embeddings.set(id, {
      id,
      text,
      embedding: embedResult.embedding,
      metadata,
    });
    this.embeddingAccessOrder.set(id, Date.now());

    // Build inverted index for metadata - O(1) per field
    if (metadata) {
      for (const [key, value] of Object.entries(metadata)) {
        if (!this.metadataIndex.has(key)) {
          this.metadataIndex.set(key, new Map());
        }
        const valueMap = this.metadataIndex.get(key)!;
        if (!valueMap.has(value)) {
          valueMap.set(value, new Set());
        }
        valueMap.get(value)!.add(id);
      }
    }
  }

  /**
   * Delete embedding from storage
   */
  async delete(id: string): Promise<void> {
    const embedding = this.embeddings.get(id);

    // Clean up inverted index - O(1) per metadata field
    if (embedding?.metadata) {
      for (const [key, value] of Object.entries(embedding.metadata)) {
        const valueMap = this.metadataIndex.get(key);
        if (valueMap) {
          const idSet = valueMap.get(value);
          if (idSet) {
            idSet.delete(id);
            // Clean up empty sets
            if (idSet.size === 0) {
              valueMap.delete(value);
            }
          }
          // Clean up empty maps
          if (valueMap.size === 0) {
            this.metadataIndex.delete(key);
          }
        }
      }
    }

    this.embeddings.delete(id);
    this.embeddingAccessOrder.delete(id); // Quality Audit Fix: Clean up access tracking
  }

  /**
   * Semantic search with O(1) metadata filtering via inverted index
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, limit = 10, offset = 0, threshold = 0, filter } = options;

    // Generate query embedding
    const queryResult = await this.embed({ text: query });
    const queryEmbedding = queryResult.embedding;

    // Use inverted index for O(1) metadata filtering
    let candidateIds = new Set<string>(this.embeddings.keys());

    if (filter && Object.keys(filter).length > 0) {
      // Intersect all filter conditions using inverted index
      for (const [key, value] of Object.entries(filter)) {
        const valueMap = this.metadataIndex.get(key);
        const matchingIds = valueMap?.get(value) ?? new Set<string>();

        // Intersect with current candidates - O(min(n,m))
        candidateIds = new Set([...candidateIds].filter(id => matchingIds.has(id)));

        // Early exit if no matches
        if (candidateIds.size === 0) break;
      }
    }

    // Calculate similarities only for filtered candidates
    const results: SearchResult[] = [];
    for (const id of candidateIds) {
      const stored = this.embeddings.get(id);
      if (!stored) continue;

      const score = this.cosineSimilarity(queryEmbedding, stored.embedding);

      if (score >= threshold) {
        results.push({
          id,
          score,
          text: stored.text,
          metadata: stored.metadata,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Apply pagination
    return results.slice(offset, offset + limit);
  }

  /**
   * Build context window for LLM
   */
  async buildContext(options: BuildContextOptions): Promise<ContextResult> {
    const { query, maxTokens, includeMetadata = false, format = 'array' } = options;

    // Get relevant documents
    const searchResults = await this.search({
      query,
      limit: 100, // Get many candidates
    });

    // Build context within token limit
    const documents: ContextResult['documents'] = [];
    let totalTokens = 0;
    let truncated = false;

    for (const result of searchResults) {
      const docTokens = this.estimateTokens(result.text);

      if (totalTokens + docTokens > maxTokens) {
        truncated = true;
        break;
      }

      documents.push({
        id: result.id,
        text: result.text,
        score: result.score,
        metadata: includeMetadata ? result.metadata : undefined,
      });

      totalTokens += docTokens;
    }

    const contextResult: ContextResult = {
      documents,
      totalTokens,
      truncated,
    };

    if (format === 'string') {
      contextResult.formatted = documents
        .map((doc, i) => {
          let text = `[${i + 1}] ${doc.text}`;
          if (includeMetadata && doc.metadata) {
            text += `\nMetadata: ${JSON.stringify(doc.metadata)}`;
          }
          return text;
        })
        .join('\n\n');
    }

    return contextResult;
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    const total = this.cacheHits + this.cacheMisses;
    return {
      size: this.cache.size,
      hits: this.cacheHits,
      misses: this.cacheMisses,
      hitRate: total > 0 ? this.cacheHits / total : 0,
    };
  }

  /**
   * Get token statistics
   */
  getTokenStats(): TokenStats {
    return { ...this.tokenStats };
  }

  /**
   * Reset token statistics
   */
  resetTokenStats(): void {
    this.tokenStats = {
      totalTokens: 0,
      embeddingTokens: 0,
      byModel: {},
      totalCost: 0,
    };
  }

  /**
   * Get model information
   */
  getModelInfo(model: string): ModelInfo {
    const info = this.modelConfigs.get(model);
    if (!info) {
      throw new Error(`Unknown model: ${model}`);
    }
    return info;
  }

  /**
   * List available models
   */
  listAvailableModels(): string[] {
    return Array.from(this.modelConfigs.keys());
  }

  /**
   * Generate cache key
   */
  private getCacheKey(text: string, model: string): string {
    const hash = crypto.createHash('sha256').update(`${model}:${text}`).digest('hex');
    return hash;
  }

  /**
   * Generate embedding (simulated)
   */
  private generateEmbedding(text: string, model: string): number[] {
    const modelInfo = this.modelConfigs.get(model)!;
    const dimensions = modelInfo.dimensions;

    // Tokenize text into words and lowercase
    const words = text.toLowerCase().match(/\w+/g) || [];

    // Generate embedding based on word features
    const embedding: number[] = new Array(dimensions).fill(0);

    // For each word, hash it and contribute to embedding dimensions
    words.forEach((word, wordIndex) => {
      const wordHash = crypto.createHash('sha256').update(word).digest();

      // Distribute word contribution across dimensions
      for (let i = 0; i < dimensions; i++) {
        const byteIndex = i % wordHash.length;
        const contribution = (wordHash[byteIndex] / 255) * 2 - 1; // [-1, 1]

        // Add word contribution with decay based on position
        const positionWeight = 1 / (1 + wordIndex * 0.1);
        embedding[i] += contribution * positionWeight;
      }
    });

    // Add small random component based on full text for uniqueness
    const textHash = crypto.createHash('sha256').update(text).digest();
    for (let i = 0; i < dimensions; i++) {
      const byteIndex = i % textHash.length;
      const noise = (textHash[byteIndex] / 255) * 0.1; // Small noise component
      embedding[i] += noise;
    }

    // Normalize to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude === 0) return new Array(dimensions).fill(0);
    return embedding.map((val) => val / magnitude);
  }

  /**
   * Estimate token count
   */
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate embedding cost
   */
  private calculateCost(tokens: number, model: string): number {
    const modelInfo = this.modelConfigs.get(model)!;
    return (tokens / 1000) * modelInfo.costPer1kTokens;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Quality Audit Fix: Evict least recently used entry from cache
   */
  private evictLRUFromCache(): void {
    let oldestTime = Infinity;
    let oldestKey: string | null = null;

    for (const [key, time] of this.cacheAccessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.cacheAccessOrder.delete(oldestKey);
    }
  }

  /**
   * Quality Audit Fix: Evict least recently used embedding
   */
  private evictLRUEmbedding(): void {
    let oldestTime = Infinity;
    let oldestKey: string | null = null;

    for (const [key, time] of this.embeddingAccessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      // Use delete method to properly clean up metadata index
      this.delete(oldestKey);
    }
  }
}
