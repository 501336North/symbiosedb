/**
 * Phase 8.5 Part 2: RAG Pipelines - Document Processor
 *
 * Text chunking, preprocessing, and document management for RAG systems
 * Production-grade document processing for AI applications
 */

import * as crypto from 'crypto';

export interface DocumentProcessorConfig {
  defaultChunkSize?: number;
  defaultOverlap?: number;
  defaultStrategy?: ChunkStrategy;
  maxChunkSize?: number;
  maxDocuments?: number; // Quality Audit Fix: Prevent unbounded growth
  maxChunksTotal?: number; // Quality Audit Fix: Prevent unbounded growth
}

export type ChunkStrategy = 'fixed' | 'sentence' | 'paragraph' | 'semantic' | string;

export interface ChunkOptions {
  text: string;
  strategy?: ChunkStrategy;
  chunkSize?: number;
  overlap?: number;
  sentencesPerChunk?: number;
  metadata?: Record<string, any>;
  maxChunks?: number;
  includeStats?: boolean;
}

export interface TextChunk {
  id: string;
  text: string;
  index: number;
  startChar: number;
  endChar: number;
  documentId?: string;
  metadata?: Record<string, any>;
  wordCount?: number;
  charCount?: number;
}

export interface ProcessOptions {
  normalizeWhitespace?: boolean;
  removeUrls?: boolean;
  removeEmails?: boolean;
  toLowerCase?: boolean;
  removeSpecialChars?: boolean;
}

export interface ProcessDocumentOptions {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  chunkStrategy?: ChunkStrategy;
  chunkSize?: number;
  overlap?: number;
  preprocess?: ProcessOptions;
}

export interface ProcessDocumentResult {
  documentId: string;
  chunks: TextChunk[];
  totalChunks: number;
  success?: boolean;
  error?: string;
}

export interface Document {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchProcessOptions {
  continueOnError?: boolean;
}

type ChunkingFunction = (text: string, options: ChunkOptions) => TextChunk[];

/**
 * DocumentProcessor - Advanced text chunking and preprocessing for RAG
 */
export class DocumentProcessor {
  private config: DocumentProcessorConfig;
  private documents: Map<string, Document> = new Map();
  private chunks: Map<string, TextChunk> = new Map();
  private customStrategies: Map<string, ChunkingFunction> = new Map();
  private documentAccessOrder: Map<string, number> = new Map(); // Quality Audit Fix: LRU tracking
  private chunkAccessOrder: Map<string, number> = new Map(); // Quality Audit Fix: LRU tracking

  constructor(config: DocumentProcessorConfig = {}) {
    this.config = {
      defaultChunkSize: config.defaultChunkSize ?? 500,
      defaultOverlap: config.defaultOverlap ?? 50,
      defaultStrategy: config.defaultStrategy ?? 'fixed',
      maxChunkSize: config.maxChunkSize ?? 2000,
      maxDocuments: config.maxDocuments ?? 1000, // Quality Audit Fix: Default limit
      maxChunksTotal: config.maxChunksTotal ?? 10000, // Quality Audit Fix: Default limit
    };
  }

  /**
   * Chunk text using specified strategy
   */
  chunkText(options: ChunkOptions): TextChunk[] {
    const {
      text,
      strategy = this.config.defaultStrategy!,
      chunkSize = this.config.defaultChunkSize!,
      overlap = this.config.defaultOverlap!,
      metadata,
      maxChunks,
      includeStats = false,
    } = options;

    // Validation
    if (chunkSize <= 0) {
      throw new Error('Invalid chunk size: must be greater than 0');
    }

    if (overlap >= chunkSize) {
      throw new Error('Overlap cannot be larger than chunk size');
    }

    // Handle empty text
    if (!text || text.trim() === '') {
      return [];
    }

    let chunks: TextChunk[];

    // Check for custom strategy
    if (this.customStrategies.has(strategy)) {
      const customFn = this.customStrategies.get(strategy)!;
      chunks = customFn(text, options);
    } else {
      // Built-in strategies
      switch (strategy) {
        case 'fixed':
          chunks = this.chunkFixed(text, chunkSize, overlap);
          break;
        case 'sentence':
          chunks = this.chunkBySentence(text, options.sentencesPerChunk ?? 3);
          break;
        case 'paragraph':
          chunks = this.chunkByParagraph(text);
          break;
        case 'semantic':
          chunks = this.chunkSemantic(text, chunkSize);
          break;
        default:
          chunks = this.chunkFixed(text, chunkSize, overlap);
      }
    }

    // Add metadata to all chunks
    if (metadata) {
      chunks = chunks.map((chunk) => ({
        ...chunk,
        metadata: { ...chunk.metadata, ...metadata },
      }));
    }

    // Add statistics if requested
    if (includeStats) {
      chunks = chunks.map((chunk) => ({
        ...chunk,
        wordCount: this.getWordCount(chunk.text),
        charCount: this.getCharCount(chunk.text),
      }));
    }

    // Limit chunks if maxChunks specified
    if (maxChunks && chunks.length > maxChunks) {
      chunks = chunks.slice(0, maxChunks);
    }

    return chunks;
  }

  /**
   * Fixed-size chunking with overlap
   */
  private chunkFixed(text: string, chunkSize: number, overlap: number): TextChunk[] {
    const chunks: TextChunk[] = [];
    let index = 0;
    let startChar = 0;

    while (startChar < text.length) {
      const endChar = Math.min(startChar + chunkSize, text.length);
      const chunkText = text.slice(startChar, endChar);

      chunks.push({
        id: this.generateChunkId(),
        text: chunkText,
        index,
        startChar,
        endChar,
      });

      // Move start position, accounting for overlap
      startChar += chunkSize - overlap;
      index++;

      // Prevent infinite loop if overlap >= chunkSize
      if (startChar <= chunks[chunks.length - 1].startChar && index > 1) {
        break;
      }
    }

    return chunks;
  }

  /**
   * Sentence-based chunking
   */
  private chunkBySentence(text: string, sentencesPerChunk: number): TextChunk[] {
    // Split by sentence boundaries (., !, ?)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: TextChunk[] = [];
    let index = 0;

    for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
      const chunkSentences = sentences.slice(i, i + sentencesPerChunk);
      const chunkText = chunkSentences.join(' ').trim();

      // Calculate character positions
      const startChar = text.indexOf(chunkSentences[0]);
      const endChar = startChar + chunkText.length;

      chunks.push({
        id: this.generateChunkId(),
        text: chunkText,
        index,
        startChar,
        endChar,
      });

      index++;
    }

    return chunks;
  }

  /**
   * Paragraph-based chunking
   */
  private chunkByParagraph(text: string): TextChunk[] {
    const paragraphs = text.split(/\n\n+/);
    const chunks: TextChunk[] = [];
    let currentPos = 0;

    paragraphs.forEach((para, index) => {
      const trimmed = para.trim();
      if (trimmed) {
        const startChar = text.indexOf(trimmed, currentPos);
        const endChar = startChar + trimmed.length;

        chunks.push({
          id: this.generateChunkId(),
          text: trimmed,
          index,
          startChar,
          endChar,
        });

        currentPos = endChar;
      }
    });

    return chunks;
  }

  /**
   * Semantic chunking (simple word-boundary aware)
   */
  private chunkSemantic(text: string, chunkSize: number): TextChunk[] {
    const chunks: TextChunk[] = [];
    const words = text.split(/\s+/);
    let currentChunk: string[] = [];
    let currentSize = 0;
    let index = 0;
    let startChar = 0;

    words.forEach((word) => {
      const wordSize = word.length + 1; // +1 for space

      if (currentSize + wordSize > chunkSize && currentChunk.length > 0) {
        // Finish current chunk
        const chunkText = currentChunk.join(' ');
        const endChar = startChar + chunkText.length;

        chunks.push({
          id: this.generateChunkId(),
          text: chunkText,
          index,
          startChar,
          endChar,
        });

        startChar = endChar + 1;
        index++;
        currentChunk = [];
        currentSize = 0;
      }

      currentChunk.push(word);
      currentSize += wordSize;
    });

    // Add remaining chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join(' ');
      const endChar = startChar + chunkText.length;

      chunks.push({
        id: this.generateChunkId(),
        text: chunkText,
        index,
        startChar,
        endChar,
      });
    }

    return chunks;
  }

  /**
   * Normalize whitespace
   */
  normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Remove special characters
   */
  removeSpecialChars(text: string): string {
    return text.replace(/[^a-zA-Z0-9\s.,!?-]/g, '');
  }

  /**
   * Convert to lowercase
   */
  toLowerCase(text: string): string {
    return text.toLowerCase();
  }

  /**
   * Remove URLs
   */
  removeUrls(text: string): string {
    return text.replace(/https?:\/\/[^\s]+/g, '').trim();
  }

  /**
   * Remove email addresses
   */
  removeEmails(text: string): string {
    return text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '').trim();
  }

  /**
   * Apply preprocessing pipeline
   */
  preprocess(text: string, options: ProcessOptions = {}): string {
    let processed = text;

    if (options.removeUrls) {
      processed = this.removeUrls(processed);
    }

    if (options.removeEmails) {
      processed = this.removeEmails(processed);
    }

    if (options.removeSpecialChars) {
      processed = this.removeSpecialChars(processed);
    }

    if (options.normalizeWhitespace) {
      processed = this.normalizeWhitespace(processed);
    }

    if (options.toLowerCase) {
      processed = this.toLowerCase(processed);
    }

    return processed;
  }

  /**
   * Process and store document
   */
  async processDocument(options: ProcessDocumentOptions): Promise<ProcessDocumentResult> {
    const {
      id,
      content,
      metadata,
      chunkStrategy,
      chunkSize,
      overlap,
      preprocess: preprocessOpts,
    } = options;

    // Validate content
    if (!content || content.trim() === '') {
      throw new Error('Document content cannot be empty');
    }

    // Preprocess content if options provided
    let processedContent = content;
    if (preprocessOpts) {
      processedContent = this.preprocess(content, preprocessOpts);
    }

    // Chunk the content
    const chunks = this.chunkText({
      text: processedContent,
      strategy: chunkStrategy,
      chunkSize,
      overlap,
      metadata,
    });

    // Add documentId to each chunk
    const documentChunks = chunks.map((chunk) => ({
      ...chunk,
      documentId: id,
    }));

    // Store document (with LRU eviction)
    this.addDocument(id, {
      id,
      content,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Store chunks (with LRU eviction)
    documentChunks.forEach((chunk) => {
      this.addChunk(chunk.id, chunk);
    });

    return {
      documentId: id,
      chunks: documentChunks,
      totalChunks: documentChunks.length,
      success: true,
    };
  }

  /**
   * Get document by ID
   */
  getDocument(id: string): Document | undefined {
    const doc = this.documents.get(id);
    if (doc) {
      // Quality Audit Fix: Update access time for LRU
      this.documentAccessOrder.set(id, Date.now());
    }
    return doc;
  }

  /**
   * Delete document and its chunks
   */
  deleteDocument(id: string): boolean {
    const doc = this.documents.get(id);
    if (!doc) {
      return false;
    }

    // Delete all chunks for this document
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.documentId === id) {
        this.chunks.delete(chunkId);
        this.chunkAccessOrder.delete(chunkId); // Quality Audit Fix: Clean up access tracking
      }
    }

    // Delete document
    this.documents.delete(id);
    this.documentAccessOrder.delete(id); // Quality Audit Fix: Clean up access tracking
    return true;
  }

  /**
   * List all documents
   */
  listDocuments(): Document[] {
    return Array.from(this.documents.values());
  }

  /**
   * Update document content
   */
  async updateDocument(
    id: string,
    updates: { content?: string; metadata?: Record<string, any> }
  ): Promise<ProcessDocumentResult> {
    const doc = this.documents.get(id);
    if (!doc) {
      throw new Error(`Document ${id} not found`);
    }

    // Delete existing chunks
    this.deleteDocument(id);

    // Reprocess with updated content
    return this.processDocument({
      id,
      content: updates.content ?? doc.content,
      metadata: updates.metadata ?? doc.metadata,
    });
  }

  /**
   * Get all chunks for a document
   */
  getDocumentChunks(documentId: string): TextChunk[] {
    const chunks: TextChunk[] = [];

    for (const chunk of this.chunks.values()) {
      if (chunk.documentId === documentId) {
        chunks.push(chunk);
      }
    }

    return chunks.sort((a, b) => a.index - b.index);
  }

  /**
   * Get chunk by ID
   */
  getChunk(id: string): TextChunk | undefined {
    return this.chunks.get(id);
  }

  /**
   * Get word count
   */
  getWordCount(text: string): number {
    const words = text.trim().split(/\s+/);
    return words.filter((w) => w.length > 0).length;
  }

  /**
   * Get character count
   */
  getCharCount(text: string): number {
    return text.length;
  }

  /**
   * Estimate reading time (assumes 200 words per minute)
   */
  estimateReadingTime(text: string, wordsPerMinute: number = 200): number {
    const wordCount = this.getWordCount(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * Detect language (simple heuristic)
   */
  detectLanguage(text: string): string {
    // Simple heuristic: if text contains common English words, assume English
    const commonEnglish = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or'];
    const lowerText = text.toLowerCase();
    const hasEnglish = commonEnglish.some((word) => lowerText.includes(` ${word} `));

    return hasEnglish ? 'en' : 'unknown';
  }

  /**
   * Process multiple documents
   */
  async processDocuments(
    documents: ProcessDocumentOptions[],
    options: BatchProcessOptions = {}
  ): Promise<ProcessDocumentResult[]> {
    const results: ProcessDocumentResult[] = [];

    for (const doc of documents) {
      try {
        const result = await this.processDocument(doc);
        results.push(result);
      } catch (error: any) {
        if (options.continueOnError) {
          results.push({
            documentId: doc.id,
            chunks: [],
            totalChunks: 0,
            success: false,
            error: error.message,
          });
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  /**
   * Register custom chunking strategy
   */
  registerStrategy(name: string, fn: ChunkingFunction): void {
    this.customStrategies.set(name, fn);
  }

  /**
   * Quality Audit Fix: Add document with LRU eviction
   */
  private addDocument(id: string, doc: Document): void {
    // Evict LRU document if at capacity
    if (this.documents.size >= this.config.maxDocuments! && !this.documents.has(id)) {
      this.evictLRUDocument();
    }

    this.documents.set(id, doc);
    this.documentAccessOrder.set(id, Date.now());
  }

  /**
   * Quality Audit Fix: Evict least recently used document
   */
  private evictLRUDocument(): void {
    let oldestTime = Infinity;
    let oldestKey: string | null = null;

    for (const [key, time] of this.documentAccessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      // Delete document and all its chunks
      this.deleteDocument(oldestKey);
    }
  }

  /**
   * Quality Audit Fix: Add chunk with LRU eviction
   */
  private addChunk(id: string, chunk: TextChunk): void {
    // Evict LRU chunk if at capacity
    if (this.chunks.size >= this.config.maxChunksTotal! && !this.chunks.has(id)) {
      this.evictLRUChunk();
    }

    this.chunks.set(id, chunk);
    this.chunkAccessOrder.set(id, Date.now());
  }

  /**
   * Quality Audit Fix: Evict least recently used chunk
   */
  private evictLRUChunk(): void {
    let oldestTime = Infinity;
    let oldestKey: string | null = null;

    for (const [key, time] of this.chunkAccessOrder) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.chunks.delete(oldestKey);
      this.chunkAccessOrder.delete(oldestKey);
    }
  }

  /**
   * Generate unique chunk ID
   */
  private generateChunkId(): string {
    return `chunk-${crypto.randomBytes(8).toString('hex')}`;
  }
}
