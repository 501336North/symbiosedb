/**
 * AI Query Assistant Types
 */

export interface DatabaseSchema {
  tables: TableSchema[];
  relationships?: Relationship[];
  graphNodeLabels?: string[];
  graphRelationships?: string[];
  vectorCollections?: string[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  indexes: IndexSchema[];
  primaryKey?: string[];
  foreignKeys: ForeignKey[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  unique?: boolean;
}

export interface IndexSchema {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ForeignKey {
  column: string;
  referencesTable: string;
  referencesColumn: string;
}

export interface Relationship {
  fromTable: string;
  toTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  foreignKey: string;
}

export type QueryType = 'sql' | 'cypher' | 'graphql' | 'vector';

export interface NaturalLanguageQuery {
  text: string;
  targetDatabase?: QueryType;
  context?: Record<string, any>;
}

export interface GeneratedQuery {
  query: string;
  type: QueryType;
  explanation: string;
  confidence: number; // 0-1
  suggestions?: string[];
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
}

export interface QueryCache {
  get(key: string): GeneratedQuery | null;
  set(key: string, value: GeneratedQuery, ttl?: number): void;
  has(key: string): boolean;
  clear(): void;
  size(): number;
}

export interface AIProvider {
  generateQuery(
    naturalLanguage: string,
    schema: DatabaseSchema,
    targetType?: QueryType
  ): Promise<GeneratedQuery>;
}

export interface SchemaContext {
  schema: DatabaseSchema;
  getSuggestedTables(intent: string): string[];
  getSuggestedColumns(table: string, intent: string): string[];
  getRelationships(table: string): Relationship[];
  formatForAI(): string;
}

// NLQ v2 Types - Multi-step reasoning
export interface QueryStep {
  database: 'sql' | 'vector' | 'graph' | 'blockchain';
  query: string;
  description: string;
  explanation?: string;
  dependsOn?: number[];
  canRunInParallel?: boolean;
}

export interface MultiStepQueryResult {
  steps: QueryStep[];
  reasoning: string[];
  executionOrder: number[];
  estimatedExecutionTime: number;
}

// NLQ v2 Types - Correction Learning
export interface CorrectionEntry {
  id: string;
  originalNL: string;
  generatedQuery: string;
  correctedQuery: string;
  reason?: string;
  timestamp: number;
  timesApplied?: number;
}

// NLQ v2 Types - Explain Mode
export interface QueryAlternative {
  query: string;
  type: QueryType;
  explanation: string;
  confidence: number;
}

export interface EnhancedGeneratedQuery extends GeneratedQuery {
  reasoning?: string[];
  alternatives?: QueryAlternative[];
  whyChosen?: string;
  matchedPatterns?: string[];
}

// NLQ v2 Types - Voice Recognition
export interface VoiceRecognitionStatus {
  supported: boolean;
  isListening?: boolean;
  continuousMode?: boolean;
}
