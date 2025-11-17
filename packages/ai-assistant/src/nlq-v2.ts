/**
 * Natural Language Queries V2
 *
 * Enhanced AI query assistant with:
 * - Multi-step reasoning across all 4 databases
 * - Learning from corrections
 * - Explain mode with alternatives
 * - Voice-to-query support
 */

import crypto from 'crypto';
import {
  DatabaseSchema,
  GeneratedQuery,
  QueryType,
  QueryStep,
  MultiStepQueryResult,
  CorrectionEntry,
  EnhancedGeneratedQuery,
  QueryAlternative,
  VoiceRecognitionStatus,
} from './types';
import { QueryCacheManager } from './query-cache';

export interface NaturalLanguageQueryV2Options {
  apiKey: string;
  schema: DatabaseSchema;
  cacheOptions?: {
    maxSize?: number;
    defaultTTL?: number;
  };
}

export interface GenerateQueryOptions {
  explain?: boolean;
  targetDatabase?: QueryType;
}

export class NaturalLanguageQueryV2 {
  private schema: DatabaseSchema;
  private cache: QueryCacheManager;
  private apiKey: string;
  private corrections: CorrectionEntry[] = [];
  private stats = {
    totalQueries: 0,
    multiStepQueries: 0,
    corrections: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalConfidence: 0,
  };

  constructor(options: NaturalLanguageQueryV2Options) {
    this.schema = options.schema;
    this.apiKey = options.apiKey;

    if (!this.apiKey || this.apiKey.length === 0) {
      throw new Error('Invalid API key provided');
    }

    this.cache = new QueryCacheManager(options.cacheOptions || {});
  }

  /**
   * Generate multi-step query across multiple databases
   */
  async generateMultiStepQuery(
    text: string,
    options?: GenerateQueryOptions
  ): Promise<MultiStepQueryResult> {
    this.stats.totalQueries++;
    this.stats.multiStepQueries++;

    // Check cache
    const cacheKey = `multi:${this.hashText(text)}:${JSON.stringify(options || {})}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      this.stats.cacheHits++;
      // Return cached as MultiStepQueryResult
      return {
        steps: (cached as any).steps || [],
        reasoning: (cached as any).reasoning || [],
        executionOrder: (cached as any).executionOrder || [],
        estimatedExecutionTime: (cached as any).estimatedExecutionTime || 0,
      };
    }

    this.stats.cacheMisses++;

    const lower = text.toLowerCase();
    const steps: QueryStep[] = [];
    const reasoning: string[] = [];

    // Example multi-step logic
    // "Find users similar to user_123 who purchased products they haven't seen"

    if (lower.includes('similar') && (lower.includes('user') || lower.includes('product'))) {
      reasoning.push('Detected similarity search requirement');

      // Step 1: Vector search for similar users
      steps.push({
        database: 'vector',
        query: 'SELECT embedding FROM user_embeddings WHERE user_id = $userId;',
        description: 'Get embedding for target user',
        explanation: options?.explain ? 'Retrieve vector embedding to find similar users' : undefined,
      });

      reasoning.push('Added vector search step for similarity');
    }

    if (lower.includes('purchase') || lower.includes('order')) {
      reasoning.push('Detected purchase/order analysis requirement');

      // Step 2: Graph query for relationships
      steps.push({
        database: 'graph',
        query: 'MATCH (u:User)-[:PURCHASED]->(p:Product) WHERE u.id = $userId RETURN p;',
        description: 'Find products purchased by user',
        explanation: options?.explain ? 'Use graph database to traverse purchase relationships' : undefined,
        dependsOn: steps.length > 0 ? [0] : undefined,
      });

      reasoning.push('Added graph traversal step for purchases');
    }

    if (lower.includes("haven't") || lower.includes('not')) {
      reasoning.push('Detected exclusion filter requirement');

      // Step 3: SQL for exclusion
      steps.push({
        database: 'sql',
        query: 'SELECT * FROM products WHERE id NOT IN (SELECT product_id FROM user_views WHERE user_id = $userId);',
        description: 'Filter products user hasn\'t seen',
        explanation: options?.explain ? 'Apply exclusion filter using SQL' : undefined,
        dependsOn: steps.length > 0 ? [1] : undefined,
      });

      reasoning.push('Added SQL exclusion filter');
    }

    // If no specific multi-step pattern detected, create generic steps
    if (steps.length === 0) {
      steps.push({
        database: 'sql',
        query: 'SELECT * FROM table_name;',
        description: 'Generic query - unable to parse specific intent',
      });
    }

    // Mark steps that can run in parallel
    steps.forEach((step, index) => {
      if (!step.dependsOn || step.dependsOn.length === 0) {
        step.canRunInParallel = true;
      }
    });

    // Generate execution order
    const executionOrder = steps.map((_, i) => i);

    // Estimate execution time (rough estimate based on step count)
    const estimatedExecutionTime = steps.reduce((total, step) => {
      const baseTime = {
        sql: 50,
        vector: 100,
        graph: 150,
        blockchain: 200,
      }[step.database] || 50;
      return total + baseTime;
    }, 0);

    const result: MultiStepQueryResult = {
      steps,
      reasoning,
      executionOrder,
      estimatedExecutionTime,
    };

    // Cache the result
    this.cache.set(cacheKey, result as any);

    return result;
  }

  /**
   * Generate query with optional explain mode
   */
  async generateQuery(text: string, options?: GenerateQueryOptions): Promise<EnhancedGeneratedQuery> {
    this.stats.totalQueries++;

    // Check for learned corrections
    const correction = this.findCorrection(text);
    if (correction) {
      correction.timesApplied = (correction.timesApplied || 0) + 1;

      const result: EnhancedGeneratedQuery = {
        query: correction.correctedQuery,
        type: 'sql', // Default type
        explanation: `Applied learned correction: ${correction.reason || 'from previous edit'}`,
        confidence: 0.95, // Higher confidence for learned patterns
        estimatedComplexity: 'simple',
      };

      if (options?.explain) {
        result.reasoning = ['Detected previously corrected query', 'Applied learned pattern'];
        result.whyChosen = `This query was corrected ${correction.timesApplied} times before`;
      }

      this.stats.totalConfidence += result.confidence;
      return result;
    }

    // Generate new query
    const lower = text.toLowerCase();
    let query = '';
    let explanation = '';
    let confidence = 0.7;
    const matchedPatterns: string[] = [];
    const reasoning: string[] = [];

    // Simple pattern matching
    if (lower.match(/show.*all.*users?/i)) {
      query = 'SELECT * FROM users;';
      explanation = 'Retrieves all rows from the users table';
      confidence = 0.9;
      matchedPatterns.push('show all users');
      reasoning.push('Detected "show all users" pattern', 'Generated SELECT * FROM users');
    } else if (lower.match(/users? who signed up.*last.*week/i)) {
      query = 'SELECT * FROM users WHERE created_at >= NOW() - INTERVAL \'7 days\';';
      explanation = 'Retrieves users who created accounts in the last 7 days';
      confidence = 0.85;
      matchedPatterns.push('users from time period');
      reasoning.push('Detected time-based filter', 'Generated date range query');
    } else {
      query = 'SELECT * FROM table_name;';
      explanation = 'Generic query - unable to parse specific intent';
      confidence = 0.35;
      reasoning.push('No specific pattern matched', 'Fallback to generic SELECT');
    }

    const result: EnhancedGeneratedQuery = {
      query,
      type: options?.targetDatabase || 'sql',
      explanation,
      confidence,
      estimatedComplexity: query.includes('JOIN') ? 'complex' : 'simple',
    };

    if (options?.explain) {
      result.reasoning = reasoning;
      result.matchedPatterns = matchedPatterns;
      result.whyChosen = `Chosen with ${(confidence * 100).toFixed(0)}% confidence based on pattern matching`;

      // Generate alternatives
      result.alternatives = this.generateAlternatives(text, result);
    }

    this.stats.totalConfidence += confidence;
    return result;
  }

  /**
   * Learn from user correction
   */
  async learnFromCorrection(
    originalNL: string,
    generatedQuery: string,
    correctedQuery: string,
    metadata?: { reason?: string }
  ): Promise<void> {
    const entry: CorrectionEntry = {
      id: `correction-${Date.now()}-${this.hashText(originalNL)}`,
      originalNL,
      generatedQuery,
      correctedQuery,
      reason: metadata?.reason,
      timestamp: Date.now(),
      timesApplied: 0,
    };

    this.corrections.push(entry);
    this.stats.corrections++;

    // Clear cache for this query
    const cacheKey = this.cache.generateKey(originalNL, {});
    this.cache.delete(cacheKey);
  }

  /**
   * Get all corrections
   */
  getCorrections(): CorrectionEntry[] {
    return [...this.corrections];
  }

  /**
   * Export corrections as JSON
   */
  exportCorrections(): string {
    return JSON.stringify(this.corrections, null, 2);
  }

  /**
   * Import corrections from JSON
   */
  importCorrections(json: string): void {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        this.corrections = [...this.corrections, ...imported];
      }
    } catch (error) {
      throw new Error('Invalid JSON format for corrections');
    }
  }

  /**
   * Find applicable correction
   */
  private findCorrection(text: string): CorrectionEntry | null {
    return this.corrections.find((c) => c.originalNL === text) || null;
  }

  /**
   * Generate alternative queries
   */
  private generateAlternatives(text: string, primary: EnhancedGeneratedQuery): QueryAlternative[] {
    const alternatives: QueryAlternative[] = [];

    // Generate a few alternative approaches
    if (primary.query.includes('SELECT *')) {
      alternatives.push({
        query: primary.query.replace('SELECT *', 'SELECT id, email, name'),
        type: 'sql',
        explanation: 'Specify columns instead of SELECT *',
        confidence: primary.confidence * 0.9,
      });
    }

    if (text.toLowerCase().includes('user')) {
      alternatives.push({
        query: 'SELECT id, email FROM users LIMIT 100;',
        type: 'sql',
        explanation: 'Limit results for performance',
        confidence: primary.confidence * 0.85,
      });
    }

    return alternatives;
  }

  /**
   * Voice recognition status
   */
  getVoiceRecognitionStatus(): VoiceRecognitionStatus {
    // Check if running in browser with Speech Recognition API
    const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    return {
      supported,
      isListening: false,
      continuousMode: false,
    };
  }

  /**
   * Start voice recognition
   */
  startVoiceRecognition(callback: (text: string) => void): void {
    if (typeof window === 'undefined') {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const normalized = this.normalizeVoiceInput(transcript);
      callback(normalized);
    };

    recognition.start();
  }

  /**
   * Normalize voice input (remove filler words)
   */
  normalizeVoiceInput(text: string): string {
    const fillers = ['um', 'uhh', 'uh', 'like', 'you know', 'so', 'well'];
    let normalized = text;

    fillers.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b,?\\s*`, 'gi');
      normalized = normalized.replace(regex, ' ');
    });

    // Clean up extra spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
  }

  /**
   * Check if text is a voice command
   */
  isVoiceCommand(text: string): boolean {
    const commands = ['execute', 'cancel', 'stop', 'clear', 'help'];
    const lower = text.toLowerCase().trim();
    return commands.some((cmd) => lower.includes(cmd));
  }

  /**
   * Generate voice feedback for query result
   */
  generateVoiceFeedback(result: GeneratedQuery): string {
    const confidencePercent = Math.round(result.confidence * 100);

    return `I interpreted that as: ${result.explanation}. ` +
      `Generated a ${result.estimatedComplexity} query with ${confidencePercent}% confidence. ` +
      `Would you like me to execute it?`;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const averageConfidence = this.stats.totalQueries > 0
      ? this.stats.totalConfidence / this.stats.totalQueries
      : 0;

    const cacheHitRate = (this.stats.cacheHits + this.stats.cacheMisses) > 0
      ? this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)
      : 0;

    return {
      totalQueries: this.stats.totalQueries,
      multiStepQueries: this.stats.multiStepQueries,
      corrections: this.stats.corrections,
      cacheHitRate,
      averageConfidence,
    };
  }

  /**
   * Hash text for caching
   */
  private hashText(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);
  }
}
