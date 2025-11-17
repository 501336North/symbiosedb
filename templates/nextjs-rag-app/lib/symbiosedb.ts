/**
 * SymbioseDB Client Setup
 *
 * Complete RAG system with document processing, embeddings, and advanced query features
 */

import {
  DocumentProcessor,
  EmbeddingManager,
  RAGPipeline,
  AdvancedRAG,
} from '@symbiosedb/core';

// Initialize document processor
const documentProcessor = new DocumentProcessor({
  defaultChunkSize: 300,
  defaultOverlap: 50,
  defaultStrategy: 'sentence',
});

// Initialize embedding manager
const embeddingManager = new EmbeddingManager({
  defaultModel: 'text-embedding-3-small',
  cacheEmbeddings: true,
  maxCacheSize: 10000,
});

// Initialize RAG pipeline
const ragPipeline = new RAGPipeline({
  documentProcessor,
  embeddingManager,
  topK: 5,
  minSimilarity: 0.3,
});

// Initialize advanced RAG with query optimization
const advancedRAG = new AdvancedRAG({
  pipeline: ragPipeline,
  enableQueryRewriting: true,
  enableMultiQuery: true,
  enableFusion: true,
  multiQueryCount: 3,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
});

export { documentProcessor, embeddingManager, ragPipeline, advancedRAG };
export default advancedRAG;
