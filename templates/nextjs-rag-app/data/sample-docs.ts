/**
 * Sample Documents for RAG Demo
 *
 * These documents are automatically indexed when the app starts
 */

export const sampleDocuments = [
  {
    id: 'getting-started',
    content: `Getting Started with SymbioseDB

SymbioseDB is a unified database platform that combines PostgreSQL, Vector embeddings, Blockchain, and Graph databases into one intelligent system. Getting started is simple:

1. Install SymbioseDB: npm install @symbiosedb/core
2. Initialize your RAG pipeline
3. Index your documents
4. Start querying with natural language

The auto-embedding system handles vectorization automatically, so you can focus on building your application.`,
    metadata: {
      category: 'tutorial',
      title: 'Getting Started',
      tags: ['quickstart', 'setup'],
    },
  },
  {
    id: 'rag-features',
    content: `RAG (Retrieval-Augmented Generation) Features

SymbioseDB provides production-ready RAG capabilities:

- Automatic document chunking with multiple strategies
- Auto-embedding generation with caching
- Semantic search with cosine similarity
- Multi-query fusion for better recall
- Query rewriting and optimization
- Citation verification to prevent hallucination
- Context window management for LLMs
- Conversation tracking for multi-turn Q&A

All features are built directly into the database layer, no external tools needed.`,
    metadata: {
      category: 'features',
      title: 'RAG Features',
      tags: ['rag', 'ai', 'embeddings'],
    },
  },
  {
    id: 'advanced-rag',
    content: `Advanced RAG Capabilities

SymbioseDB offers enterprise-grade advanced RAG features:

1. Reciprocal Rank Fusion (RRF): Combines results from multiple query variations for improved accuracy
2. Query Routing: Intelligent source selection based on query type
3. Result Caching: Fast repeated queries with TTL-based invalidation
4. Performance Metrics: Track query latency and optimize performance
5. Advanced Filtering: Multi-criteria filtering with operators like $contains, $gte
6. Batch Processing: Execute multiple queries efficiently

These features make SymbioseDB suitable for production AI applications at scale.`,
    metadata: {
      category: 'advanced',
      title: 'Advanced RAG',
      tags: ['advanced', 'rrf', 'fusion'],
    },
  },
  {
    id: 'architecture',
    content: `SymbioseDB Architecture

The platform integrates four database types:

1. PostgreSQL: Traditional relational data with ACID guarantees
2. Vector Database (pgvector): AI embeddings for semantic search
3. Graph Database (Apache AGE): Relationship modeling and traversal
4. Blockchain (Ethereum L2): Immutable audit trails and attestations

The intelligent query router automatically selects the optimal database for each query. The RAG pipeline coordinates across all databases for unified entity management with SAGA pattern for distributed transactions.`,
    metadata: {
      category: 'architecture',
      title: 'Platform Architecture',
      tags: ['architecture', 'databases', 'multi-db'],
    },
  },
  {
    id: 'use-cases',
    content: `SymbioseDB Use Cases

Perfect for AI-powered applications:

- Chatbots and Q&A Systems: Build conversational AI with context-aware responses
- Documentation Search: Semantic search across technical docs
- Customer Support: Auto-suggest answers from knowledge base
- Research Tools: Find relevant papers and citations
- Content Discovery: Recommend related articles and resources
- Enterprise Knowledge Management: Search across company documents
- Legal Document Analysis: Find relevant case law and precedents

The RAG system ensures accurate, source-backed answers with citation verification.`,
    metadata: {
      category: 'use-cases',
      title: 'Use Cases',
      tags: ['applications', 'ai', 'chatbots'],
    },
  },
  {
    id: 'performance',
    content: `Performance and Scalability

SymbioseDB is built for production:

- Sub-millisecond cache lookups with LRU eviction
- 75%+ cache hit rate for repeated queries
- <10ms average connection acquisition time
- Automatic query optimization and rewriting
- Efficient batch processing for multiple queries
- Connection pooling with health checks
- Horizontal scaling support

The caching layer and query optimization ensure fast responses even with large document collections. Performance metrics help you track and optimize your application.`,
    metadata: {
      category: 'performance',
      title: 'Performance',
      tags: ['performance', 'scalability', 'caching'],
    },
  },
];
