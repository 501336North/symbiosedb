/**
 * Phase 5: Multi-Database Synchronization Types
 *
 * Unified entities that span across all 4 database types:
 * - SQL (PostgreSQL)
 * - Vector (pgvector)
 * - Graph (Apache AGE)
 * - Blockchain (Ethereum L2)
 */

/**
 * Unified Entity Definition
 * One logical record with data across multiple databases
 */
export interface UnifiedEntity {
  /** Unique identifier across all databases */
  id: string;

  /** Entity type (e.g., 'User', 'Product', 'Order') */
  type: string;

  /** SQL data (structured) */
  sql?: {
    tableName: string;
    data: Record<string, any>;
  };

  /** Vector data (embeddings for AI/ML) */
  vector?: {
    collectionName: string;
    embedding: number[];
    metadata?: Record<string, any>;
  };

  /** Graph data (relationships) */
  graph?: {
    nodeLabel: string;
    properties?: Record<string, any>;
    relationships?: GraphRelationship[];
  };

  /** Blockchain data (immutable audit trail) */
  blockchain?: {
    action: string;
    data?: Record<string, any>;
    timestamp?: number;
  };

  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;

  /** Version for optimistic locking */
  version: number;
}

/**
 * Graph relationship definition
 */
export interface GraphRelationship {
  type: string;
  target: string;
  properties?: Record<string, any>;
  direction?: 'outgoing' | 'incoming' | 'bidirectional';
}

/**
 * Transaction State
 * Tracks multi-database transaction progress
 */
export interface TransactionState {
  id: string;
  status: 'pending' | 'in_progress' | 'committed' | 'failed' | 'compensating' | 'compensated';
  steps: TransactionStep[];
  startedAt: Date;
  completedAt?: Date;
  error?: Error;
}

/**
 * Transaction Step
 * Individual database operation within a transaction
 */
export interface TransactionStep {
  database: 'sql' | 'vector' | 'graph' | 'blockchain';
  operation: 'create' | 'update' | 'delete';
  status: 'pending' | 'completed' | 'failed' | 'compensated';
  data?: any;
  result?: any;
  error?: Error;
  compensationData?: any; // Data needed for rollback
  executedAt?: Date;
}

/**
 * SAGA Configuration
 * Defines compensation logic for each step
 */
export interface SagaDefinition {
  name: string;
  steps: SagaStep[];
}

export interface SagaStep {
  database: 'sql' | 'vector' | 'graph' | 'blockchain';
  execute: (data: any) => Promise<any>;
  compensate: (data: any, result: any) => Promise<void>;
}

/**
 * Event for Event Sourcing
 * Every state change is an event
 */
export interface DomainEvent {
  id: string;
  aggregateId: string; // Entity ID
  aggregateType: string; // Entity type
  eventType: string;
  data: any;
  metadata: {
    userId?: string;
    timestamp: Date;
    version: number;
  };
}

/**
 * Event Store interface
 */
export interface EventStore {
  append(event: DomainEvent): Promise<void>;
  getEvents(aggregateId: string): Promise<DomainEvent[]>;
  getEventsByType(eventType: string): Promise<DomainEvent[]>;
  getEventsSince(timestamp: Date): Promise<DomainEvent[]>;
  replayEvents(aggregateId: string): Promise<any>;
}

/**
 * Conflict Resolution Strategy
 */
export type ConflictStrategy =
  | 'last_write_wins'
  | 'first_write_wins'
  | 'manual'
  | 'merge';

/**
 * Sync Status for monitoring
 */
export interface SyncStatus {
  entityId: string;
  databases: {
    sql: 'synced' | 'pending' | 'failed';
    vector: 'synced' | 'pending' | 'failed';
    graph: 'synced' | 'pending' | 'failed';
    blockchain: 'synced' | 'pending' | 'failed';
  };
  lastSyncAt: Date;
  pendingEvents: number;
}

/**
 * Transaction Options
 */
export interface TransactionOptions {
  /** Timeout in milliseconds */
  timeout?: number;

  /** Conflict resolution strategy */
  conflictStrategy?: ConflictStrategy;

  /** Whether to use strong consistency (slower) or eventual (faster) */
  consistency?: 'strong' | 'eventual';

  /** Retry policy */
  retry?: {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
    initialDelay: number;
  };
}
