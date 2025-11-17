/**
 * SymbioseDB Core - Intelligent Query Routing & Database Connectors
 *
 * The core routing engine for SymbioseDB that intelligently routes queries
 * to the appropriate database (PostgreSQL, Vector, Graph, or Blockchain).
 */

export { QueryRouter } from './query-router';
export { PostgreSQLConnector } from './postgresql-connector';
export { PgVectorConnector } from './vector-connector';
export { EthereumConnector } from './blockchain-connector';
export { Executor } from './executor';
export * from './types';
export * from './unified-types';

// Phase 5: Multi-Database Synchronization
export { InMemoryEventStore, PostgreSQLEventStore } from './event-store';
export { TransactionCoordinator } from './transaction-coordinator';
export { UnifiedEntityManager } from './unified-entity-manager';

// Phase 6: Performance & Scale
export { CacheManager } from './cache';
export * from './cache-types';
export { QueryMemoizer } from './query-memoization';
export type { MemoizationConfig, QueryExecutionOptions, MemoizationStats } from './query-memoization';
export { ConnectionPoolManager } from './connection-pool';
export type { PoolConfig, PoolConnection, PoolStats, HealthStatus } from './connection-pool';

// Phase 8: DevOps & Reliability
export { BackupManager } from './backup-manager';
export type {
  BackupConfig,
  BackupOptions,
  Backup,
  BackupSchedule,
  RestorationResult,
  VerificationResult,
  StorageStats,
  BackupType,
  StorageType,
  BackupStatus,
} from './backup-manager';
export { HealthCheckManager } from './health-check-manager';
export type {
  HealthCheckConfig,
  HealthCheckDefinition,
  DependencyDefinition,
  HealthCheckResult,
  OverallHealth,
  HealingStats,
  HealthMetrics,
  CircuitState,
} from './health-check-manager';
export { InfrastructureValidator } from './infrastructure-validator';
export type {
  ValidatorConfig,
  ValidationResult,
  DatabaseValidationResult,
  PortValidationResult,
  DiskSpaceResult,
  MemoryResult,
  DependencyResult,
  SecretsValidationResult,
  ConfigSchema,
  MigrationResult,
  ComprehensiveValidation,
  DeploymentReadinessResult,
  ValidationReport,
} from './infrastructure-validator';

// Phase 8.5: RAG-Specific APIs
export { EmbeddingManager } from './embedding-manager';
export type {
  EmbeddingConfig,
  EmbedOptions,
  EmbedResult,
  EmbedBatchOptions,
  InsertOptions,
  SearchOptions,
  SearchResult,
  BuildContextOptions,
  TokenStats,
  CacheStats,
  ModelInfo,
} from './embedding-manager';
export { DocumentProcessor } from './document-processor';
export type {
  DocumentProcessorConfig,
  ChunkStrategy,
  ChunkOptions,
  TextChunk,
  ProcessOptions,
  ProcessDocumentOptions,
  ProcessDocumentResult,
  Document,
  BatchProcessOptions,
} from './document-processor';
export { RAGPipeline } from './rag-pipeline';
export type {
  RAGPipelineConfig,
  IndexDocumentOptions,
  IndexResult,
  QueryOptions,
  QueryResult,
  EnhancedSearchResult,
  GenerateContextOptions,
  ContextResult,
  SourceInfo,
  AnswerOptions,
  AnswerResult,
  ConversationMessage,
  PipelineStatistics,
  IndexStatistics,
} from './rag-pipeline';
export { AdvancedRAG } from './advanced-rag';
export type {
  AdvancedRAGConfig,
  QueryRewriteResult,
  MultiQueryOptions,
  FusionQueryOptions,
  FusedResult,
  FusedSearchResult,
  QueryRoute,
  QueryClassification,
  CitationVerification,
  FilterOptions,
  CachedQueryOptions,
  CachedQueryResult,
  CacheStatistics,
  QueryMetrics,
  MetricsQueryResult,
} from './advanced-rag';
