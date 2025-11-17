/**
 * SymbioseDB TypeScript Type Definitions
 * Provides IntelliSense and type checking for SymbioseDB SDK
 */

declare module 'symbiosedb' {
  // Core Types
  export type DatabaseType = 'sql' | 'cypher' | 'vector' | 'blockchain';

  export interface ConnectionOptions {
    apiUrl: string;
    apiKey?: string;
    timeout?: number;
  }

  export interface ConnectionResult {
    success: boolean;
    message?: string;
    responseTime?: number;
  }

  // Query Types
  export interface QueryOptions {
    type: DatabaseType;
    query: string;
    params?: any[];
  }

  export interface QueryResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
    queryType: DatabaseType;
  }

  // SQL Types
  export interface SQLResult {
    rows: any[];
    rowCount: number;
    fields?: Array<{ name: string; dataType: string }>;
  }

  // Vector Search Types
  export interface VectorSearchOptions {
    embedding: number[];
    limit?: number;
    threshold?: number;
    metadata?: Record<string, any>;
    collectionName?: string;
  }

  export interface VectorResult {
    id: string;
    similarity: number;
    metadata?: Record<string, any>;
    embedding?: number[];
  }

  // Graph Types
  export interface GraphResult {
    nodes: GraphNode[];
    relationships: GraphRelationship[];
  }

  export interface GraphNode {
    id: string | number;
    label: string;
    properties: Record<string, any>;
  }

  export interface GraphRelationship {
    id: string | number;
    type: string;
    from: string | number;
    to: string | number;
    properties?: Record<string, any>;
  }

  // Blockchain Types
  export interface AttestationOptions {
    action: string;
    data: Record<string, any>;
  }

  export interface AttestationResult {
    attestationId: string;
    transactionHash?: string;
    timestamp: number;
    verified: boolean;
  }

  // RAG Types
  export interface IndexOptions {
    content: string;
    metadata?: Record<string, any>;
    chunkSize?: number;
    chunkingStrategy?: 'fixed' | 'sentence' | 'paragraph' | 'semantic';
  }

  export interface IndexResult {
    documentId: string;
    chunks: number;
    embeddings: number;
  }

  export interface RAGQueryOptions {
    query: string;
    limit?: number;
    threshold?: number;
    context?: boolean;
  }

  export interface RAGResult {
    answer?: string;
    sources: Array<{
      documentId: string;
      content: string;
      similarity: number;
      metadata?: Record<string, any>;
    }>;
    confidence?: 'low' | 'medium' | 'high';
  }

  // Unified Entity Types
  export interface UnifiedEntity {
    id: string;
    type: string;
    sql?: {
      tableName: string;
      data: Record<string, any>;
    };
    vector?: {
      collectionName: string;
      embedding: number[];
      metadata?: Record<string, any>;
    };
    graph?: {
      nodeLabel: string;
      properties: Record<string, any>;
      relationships?: Array<{
        type: string;
        target: string;
        direction: 'incoming' | 'outgoing';
        properties?: Record<string, any>;
      }>;
    };
    blockchain?: {
      action: string;
      data: Record<string, any>;
    };
  }

  // Main SymbioseDB Client
  export class SymbioseDB {
    /**
     * Connect to SymbioseDB
     * @param options Connection configuration
     * @returns Connection result
     */
    connect(options: ConnectionOptions): Promise<ConnectionResult>;

    /**
     * Disconnect from SymbioseDB
     */
    disconnect(): Promise<void>;

    /**
     * Execute a unified query
     * @param options Query options
     * @returns Query result
     */
    query(options: QueryOptions): Promise<QueryResult>;

    /**
     * Execute a SQL query on PostgreSQL
     * @param query SQL query string
     * @param params Optional query parameters
     * @returns SQL result
     */
    sql(query: string, params?: any[]): Promise<SQLResult>;

    /**
     * Perform vector similarity search
     * @param options Search options
     * @returns Array of similar vectors
     */
    vectorSearch(options: VectorSearchOptions): Promise<VectorResult[]>;

    /**
     * Execute a Cypher query on Apache AGE
     * @param query Cypher query string
     * @param params Optional named parameters
     * @returns Graph result
     */
    cypher(query: string, params?: Record<string, any>): Promise<GraphResult>;

    /**
     * Create a blockchain attestation
     * @param options Attestation options
     * @returns Attestation result
     */
    attest(options: AttestationOptions): Promise<AttestationResult>;

    /**
     * Verify a blockchain attestation
     * @param attestationId Attestation ID to verify
     * @returns Verification result
     */
    verify(attestationId: string): Promise<AttestationResult>;

    /**
     * RAG operations
     */
    rag: {
      /**
       * Index a document for RAG
       * @param options Index options
       * @returns Index result
       */
      indexDocument(options: IndexOptions): Promise<IndexResult>;

      /**
       * Query the RAG system
       * @param query Question or search query
       * @param options Optional query options
       * @returns RAG result with answer and sources
       */
      query(query: string, options?: RAGQueryOptions): Promise<RAGResult>;

      /**
       * List indexed documents
       * @returns Array of document metadata
       */
      listDocuments(): Promise<Array<{ id: string; metadata: Record<string, any> }>>;

      /**
       * Delete a document
       * @param documentId Document ID to delete
       */
      deleteDocument(documentId: string): Promise<void>;
    };

    /**
     * Unified entity operations
     */
    entities: {
      /**
       * Create a unified entity across multiple databases
       * @param entity Entity data
       * @returns Created entity
       */
      create(entity: UnifiedEntity): Promise<UnifiedEntity>;

      /**
       * Get a unified entity by ID
       * @param entityId Entity ID
       * @returns Entity or null
       */
      get(entityId: string): Promise<UnifiedEntity | null>;

      /**
       * Update a unified entity
       * @param entityId Entity ID
       * @param updates Partial entity updates
       * @returns Updated entity
       */
      update(entityId: string, updates: Partial<UnifiedEntity>): Promise<UnifiedEntity>;

      /**
       * Delete a unified entity
       * @param entityId Entity ID
       */
      delete(entityId: string): Promise<void>;
    };
  }

  // Default export
  const symbiosedb: SymbioseDB;
  export default symbiosedb;
}
