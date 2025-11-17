/**
 * Phase 8.5 Part 3: RAG Query Pipeline
 *
 * Complete RAG (Retrieval-Augmented Generation) pipeline integrating
 * document processing, embeddings, and intelligent query handling
 * Production-grade RAG system for AI applications
 */

import { DocumentProcessor, ProcessDocumentOptions } from './document-processor';
import { EmbeddingManager, SearchOptions, SearchResult } from './embedding-manager';
import * as crypto from 'crypto';

export interface RAGPipelineConfig {
  documentProcessor: DocumentProcessor;
  embeddingManager: EmbeddingManager;
  topK?: number;
  minSimilarity?: number;
  enableHybridSearch?: boolean;
  enableReranking?: boolean;
}

export interface IndexDocumentOptions extends ProcessDocumentOptions {}

export interface IndexDocumentsOptions {
  batchSize?: number;
  continueOnError?: boolean;
}

export interface IndexResult {
  documentId: string;
  chunksIndexed: number;
  success: boolean;
  error?: string;
}

export interface QueryOptions {
  query: string;
  topK?: number;
  minSimilarity?: number;
  filter?: Record<string, any>;
  searchMode?: 'semantic' | 'keyword' | 'hybrid';
  rerank?: boolean;
  explain?: boolean;
}

export interface QueryResult {
  query: string;
  results: EnhancedSearchResult[];
  latency: number;
  explanation?: string;
}

export interface EnhancedSearchResult extends SearchResult {
  chunkId?: string;
  documentId?: string;
}

export interface GenerateContextOptions {
  query: string;
  maxTokens?: number;
  includeCitations?: boolean;
}

export interface ContextResult {
  context: string;
  sources: SourceInfo[];
  totalTokens: number;
}

export interface SourceInfo {
  documentId: string;
  chunkId: string;
  score: number;
}

export interface AnswerOptions {
  question: string;
  conversationHistory?: ConversationMessage[];
  conversationId?: string;
}

export interface AnswerResult {
  question: string;
  answer: string;
  confidence: number;
  sources: SourceInfo[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface PipelineStatistics {
  totalQueries: number;
  totalDocuments: number;
  averageLatency: number;
}

export interface IndexStatistics {
  totalDocuments: number;
  totalChunks: number;
}

/**
 * RAGPipeline - Complete RAG system integrating all components
 */
export class RAGPipeline {
  private config: RAGPipelineConfig;
  private conversations: Map<string, ConversationMessage[]> = new Map();
  private queryCount: number = 0;
  private totalLatency: number = 0;

  // Synonym expansion map
  private synonyms: Map<string, string[]> = new Map([
    ['auth', ['authentication', 'login', 'credentials', 'identity']],
    ['api', ['endpoint', 'interface', 'service']],
    ['db', ['database', 'storage', 'data']],
  ]);

  constructor(config: RAGPipelineConfig) {
    this.config = {
      topK: config.topK ?? 5,
      minSimilarity: config.minSimilarity ?? 0.3,
      enableHybridSearch: config.enableHybridSearch ?? false,
      enableReranking: config.enableReranking ?? false,
      ...config,
    };
  }

  /**
   * Index document with automatic chunking and embedding
   */
  async indexDocument(options: IndexDocumentOptions): Promise<IndexResult> {
    try {
      // Process document into chunks
      const docResult = await this.config.documentProcessor.processDocument(options);

      // Embed each chunk
      let indexed = 0;
      for (const chunk of docResult.chunks) {
        await this.config.embeddingManager.insert({
          id: chunk.id,
          text: chunk.text,
          metadata: {
            ...chunk.metadata,
            documentId: options.id,
            chunkId: chunk.id,
            index: chunk.index,
          },
        });
        indexed++;
      }

      return {
        documentId: options.id,
        chunksIndexed: indexed,
        success: true,
      };
    } catch (error: any) {
      return {
        documentId: options.id,
        chunksIndexed: 0,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Index multiple documents with parallel processing
   */
  async indexDocuments(
    documents: IndexDocumentOptions[],
    options?: IndexDocumentsOptions
  ): Promise<IndexResult[]> {
    const batchSize = options?.batchSize ?? 10; // Default batch size of 10 for parallelization
    const continueOnError = options?.continueOnError ?? false;

    const results: IndexResult[] = [];

    // Process documents in parallel batches
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);

      // Process each batch in parallel
      const batchResults = await Promise.all(
        batch.map(async (doc) => {
          try {
            const result = await this.indexDocument(doc);
            return { ...result, success: true };
          } catch (error: any) {
            if (continueOnError) {
              return {
                documentId: doc.id,
                chunksIndexed: 0,
                success: false,
                error: error.message,
              };
            }
            throw error;
          }
        })
      );

      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Update document
   */
  async updateDocument(
    documentId: string,
    updates: { content?: string; metadata?: Record<string, any> }
  ): Promise<IndexResult> {
    // Delete existing document
    await this.deleteDocument(documentId);

    // Get updated document info
    const doc = this.config.documentProcessor.getDocument(documentId);
    if (!doc && !updates.content) {
      return {
        documentId,
        chunksIndexed: 0,
        success: false,
        error: 'Document not found and no content provided',
      };
    }

    // Reindex with updates
    return this.indexDocument({
      id: documentId,
      content: updates.content ?? doc?.content ?? '',
      metadata: updates.metadata ?? doc?.metadata,
    });
  }

  /**
   * Delete document from index
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    // Delete from document processor
    const deleted = this.config.documentProcessor.deleteDocument(documentId);

    // Note: EmbeddingManager doesn't have a way to delete by documentId filter
    // In a real implementation, you'd delete all chunks for this document
    // For now, just return the document processor result
    return deleted;
  }

  /**
   * Query for relevant documents
   */
  async query(options: QueryOptions): Promise<QueryResult> {
    const startTime = Date.now();

    // Validate query
    if (!options.query || options.query.trim() === '') {
      throw new Error('Query cannot be empty');
    }

    const {
      query,
      topK = this.config.topK!,
      minSimilarity = this.config.minSimilarity!,
      filter,
      searchMode = 'semantic',
      rerank = false,
      explain = false,
    } = options;

    // Expand query if needed
    let effectiveQuery = query;
    if (searchMode === 'hybrid') {
      effectiveQuery = this.expandQuery(query);
    }

    // Perform semantic search
    const searchResults = await this.config.embeddingManager.search({
      query: effectiveQuery,
      limit: topK * 2, // Get more for reranking
      threshold: minSimilarity,
      filter,
    });

    // Enhance results with document info
    let results: EnhancedSearchResult[] = searchResults.map((r) => ({
      ...r,
      chunkId: r.id,
      documentId: r.metadata?.documentId,
    }));

    // Rerank if requested
    if (rerank && results.length > 1) {
      results = this.rerankResults(results, query);
    }

    // Limit to topK
    results = results.slice(0, topK);

    const latency = Date.now() - startTime;

    // Update statistics
    this.queryCount++;
    this.totalLatency += latency;

    const result: QueryResult = {
      query,
      results,
      latency,
    };

    if (explain) {
      result.explanation = `Found ${results.length} results using ${searchMode} search. ` +
        `Top result has similarity score ${results[0]?.score.toFixed(3) ?? 'N/A'}.`;
    }

    return result;
  }

  /**
   * Generate context for LLM from query
   */
  async generateContext(options: GenerateContextOptions): Promise<ContextResult> {
    const {
      query,
      maxTokens = 2000,
      includeCitations = false,
    } = options;

    // Query for relevant documents
    const queryResult = await this.query({ query });

    // Build context from results
    const contextBuilder = await this.config.embeddingManager.buildContext({
      query,
      maxTokens,
      format: 'string',
    });

    let context = contextBuilder.formatted ?? '';

    // Add citations if requested
    if (includeCitations && queryResult.results.length > 0) {
      const citations = queryResult.results
        .map((r, i) => `[${i + 1}] ${r.documentId}`)
        .join('\n');
      context += '\n\nSources:\n' + citations;
    }

    const sources: SourceInfo[] = queryResult.results.map((r) => ({
      documentId: r.documentId ?? 'unknown',
      chunkId: r.chunkId ?? r.id,
      score: r.score,
    }));

    return {
      context,
      sources,
      totalTokens: contextBuilder.totalTokens,
    };
  }

  /**
   * Generate answer from query
   */
  async answer(options: AnswerOptions): Promise<AnswerResult> {
    const {
      question,
      conversationHistory = [],
      conversationId,
    } = options;

    // Get context for question
    const contextResult = await this.generateContext({ query: question });

    // Calculate confidence based on top result score
    const topScore = contextResult.sources[0]?.score ?? 0;
    const confidence = topScore;

    // Generate answer (simplified - in real implementation, use LLM)
    let answer: string;
    if (confidence < 0.5) {
      answer = 'I found no relevant information to answer your question.';
    } else {
      // Simple answer generation from context
      answer = `Based on the available information: ${contextResult.context.slice(0, 200)}...`;
    }

    // Update conversation if ID provided
    if (conversationId) {
      const history = this.conversations.get(conversationId) ?? [];
      history.push(
        { role: 'user', content: question },
        { role: 'assistant', content: answer }
      );
      this.conversations.set(conversationId, history);
    }

    return {
      question,
      answer,
      confidence,
      sources: contextResult.sources,
    };
  }

  /**
   * Create new conversation
   */
  createConversation(): string {
    const id = `conv-${crypto.randomBytes(8).toString('hex')}`;
    this.conversations.set(id, []);
    return id;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(conversationId: string): ConversationMessage[] {
    return this.conversations.get(conversationId) ?? [];
  }

  /**
   * Clear conversation history
   */
  clearConversation(conversationId: string): void {
    this.conversations.set(conversationId, []);
  }

  /**
   * Expand query with synonyms
   */
  expandQuery(query: string): string {
    const words = query.toLowerCase().split(/\s+/);
    const expanded = new Set(words);

    words.forEach((word) => {
      const syns = this.synonyms.get(word);
      if (syns) {
        syns.forEach((syn) => expanded.add(syn));
      }
    });

    return Array.from(expanded).join(' ');
  }

  /**
   * Extract keywords from query
   */
  extractKeywords(query: string): string[] {
    // Remove common stop words
    const stopWords = new Set(['how', 'to', 'the', 'is', 'a', 'an', 'do', 'does', 'i', 'you']);

    const words = query
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
      .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

    return words;
  }

  /**
   * Detect query intent
   */
  detectIntent(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('how to') || lowerQuery.includes('how do')) {
      return 'howto';
    }

    if (lowerQuery.includes('configure') || lowerQuery.includes('setup') || lowerQuery.includes('set up')) {
      return 'configuration';
    }

    if (lowerQuery.includes('what') || lowerQuery.includes('why') || lowerQuery.includes('?')) {
      return 'question';
    }

    return 'unknown';
  }

  /**
   * Rerank search results
   */
  private rerankResults(results: EnhancedSearchResult[], query: string): EnhancedSearchResult[] {
    const keywords = this.extractKeywords(query);

    // Simple reranking: boost results that contain exact keywords
    return results.map((result) => {
      let boost = 1.0;
      const textLower = result.text.toLowerCase();

      keywords.forEach((keyword) => {
        if (textLower.includes(keyword.toLowerCase())) {
          boost += 0.1;
        }
      });

      return {
        ...result,
        score: Math.min(result.score * boost, 1.0),
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Get query statistics
   */
  getStatistics(): PipelineStatistics {
    return {
      totalQueries: this.queryCount,
      totalDocuments: this.config.documentProcessor.listDocuments().length,
      averageLatency: this.queryCount > 0 ? this.totalLatency / this.queryCount : 0,
    };
  }

  /**
   * Get index statistics
   */
  getIndexStatistics(): IndexStatistics {
    const documents = this.config.documentProcessor.listDocuments();
    let totalChunks = 0;

    documents.forEach((doc) => {
      const chunks = this.config.documentProcessor.getDocumentChunks(doc.id);
      totalChunks += chunks.length;
    });

    return {
      totalDocuments: documents.length,
      totalChunks,
    };
  }
}
