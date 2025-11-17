# @symbiosedb/core

**The intelligent query routing and database orchestration engine for SymbioseDB.**

`@symbiosedb/core` is the foundational package that powers SymbioseDB's ability to seamlessly work with PostgreSQL, Vector (pgvector), Graph (Apache AGE), and Blockchain (Ethereum L2) databases from a single unified API. Think of it as the brain that decides where each query should go and how databases should work together.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://www.npmjs.com/package/@symbiosedb/core)
[![Tests](https://img.shields.io/badge/tests-85%20passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

---

## Why @symbiosedb/core?

**One API. Four Databases. Zero Complexity.**

Instead of learning separate APIs for PostgreSQL, pgvector, Apache AGE, and Ethereum, you write queries naturally and `@symbiosedb/core` handles the routing automatically:

```typescript
import { QueryRouter } from '@symbiosedb/core';

const router = new QueryRouter({ postgresql, vector, blockchain });

// Automatically routed to PostgreSQL
const users = await router.query('SELECT * FROM users WHERE age > 21');

// Automatically routed to Vector database
const similar = await router.query('VECTOR_SEARCH embeddings WHERE similarity > 0.8');

// Automatically routed to Graph database (Apache AGE)
const friends = await router.query('MATCH (u:User)-[:FOLLOWS]->(f) RETURN f');

// Automatically routed to Blockchain
const attestation = await router.query({ type: 'blockchain', action: 'store', data: {...} });
```

No manual switching. No complex configuration. Just query and go.

---

## ✨ Features

### Query Routing & Intelligence
- 🧠 **Intelligent Query Analysis** - Automatically detects SQL vs Cypher vs Vector vs Blockchain syntax
- 🎯 **Automatic Database Selection** - Routes queries to the optimal database
- ⚡ **Query Optimization** - Rewrites queries for better performance
- 🔄 **Fallback Support** - Automatic retry with fallback strategies
- 📊 **Query Statistics** - Track performance across all databases

### Database Connectors
- 🐘 **PostgreSQL Connector** - Full SQL support with transactions, prepared statements, and connection pooling
- 🔍 **Vector Connector** - Semantic search with pgvector, similarity scoring, hybrid search
- 🕸️ **Graph Connector** - Apache AGE integration with Cypher query language
- ⛓️ **Blockchain Connector** - Ethereum L2 attestations (Arbitrum, Optimism, Base, Polygon)

### Multi-Database Synchronization
- 🔄 **SAGA Pattern** - Distributed transactions across all 4 databases with automatic compensation
- 📝 **Event Sourcing** - Complete audit trail of all database operations
- 🎯 **Unified Entity Manager** - One write → 4 databases atomically
- 🔒 **Optimistic Locking** - Version-based concurrency control
- ⚡ **Strong & Eventual Consistency** - Choose your consistency model

### Performance & Caching
- ⚡ **LRU Cache** - Automatic query result caching with TTL support
- 🎯 **Query Memoization** - Zero-config transparent caching layer
- 🏊 **Connection Pooling** - Efficient connection management with health checks
- 📊 **Cache Statistics** - Hit rates, evictions, performance metrics
- 🏷️ **Tag-Based Invalidation** - Invalidate related queries in one call

### Advanced RAG (Retrieval-Augmented Generation)
- 📄 **Document Processing** - Chunking strategies (fixed, sentence, paragraph, semantic)
- 🧮 **Embedding Management** - Generate, store, and search vector embeddings
- 🔍 **RAG Pipeline** - Index → Query → Context → Answer workflow
- 🚀 **Advanced RAG** - Multi-query fusion, RRF algorithm, citation verification
- 🎯 **Query Rewriting** - Typo correction, expansion, informal language normalization

### DevOps & Reliability
- 💾 **Backup Manager** - Automated backups with retention policies and verification
- 🏥 **Health Check Manager** - Component health monitoring with circuit breakers
- ✅ **Infrastructure Validator** - Pre-deployment validation and readiness checks
- 📊 **Performance Metrics** - Query latency, throughput, error rates
- 🔧 **Auto-Healing** - Automatic recovery from transient failures

---

## 📦 Installation

```bash
# npm
npm install @symbiosedb/core

# yarn
yarn add @symbiosedb/core

# pnpm
pnpm add @symbiosedb/core
```

**Peer Dependencies:**
- Node.js >= 18.0.0
- PostgreSQL >= 14.0 (with pgvector and Apache AGE extensions)
- Ethereum RPC endpoint (for blockchain features)

---

## 🚀 Quick Start

### 1. Basic Query Routing

```typescript
import { QueryRouter, PostgreSQLConnector, PgVectorConnector, EthereumConnector } from '@symbiosedb/core';

// Initialize database connectors
const postgresql = new PostgreSQLConnector({
  host: 'localhost',
  database: 'myapp',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
});

const vector = new PgVectorConnector({
  host: 'localhost',
  database: 'myapp',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
});

const blockchain = new EthereumConnector({
  rpcUrl: process.env.ETHEREUM_RPC_URL,
  privateKey: process.env.PRIVATE_KEY,
});

// Create query router
const router = new QueryRouter({
  postgresql,
  vector,
  blockchain,
});

// Execute queries - routing happens automatically
const users = await router.query('SELECT * FROM users WHERE active = true');
// → Routed to PostgreSQL

const similarDocs = await router.query('VECTOR_SEARCH documents WHERE similarity > 0.8 LIMIT 10');
// → Routed to Vector database

const socialGraph = await router.query('MATCH (u:User)-[:FOLLOWS]->(f) RETURN f.name');
// → Routed to Graph database (Apache AGE on PostgreSQL)

const attestation = await router.query({
  type: 'blockchain',
  action: 'store',
  data: { userId: '123', timestamp: Date.now() }
});
// → Routed to Blockchain
```

### 2. Multi-Database Synchronization

```typescript
import { UnifiedEntityManager } from '@symbiosedb/core';

const entityManager = new UnifiedEntityManager({
  sql: postgresql,
  vector: vectorConnector,
  blockchain: blockchainConnector,
});

// One write → 4 databases atomically
const user = await entityManager.create({
  id: 'user-123',
  type: 'User',

  // SQL data
  sql: {
    tableName: 'users',
    data: { email: 'alice@example.com', name: 'Alice' }
  },

  // Vector embeddings
  vector: {
    collectionName: 'user_embeddings',
    embedding: [0.1, 0.2, 0.3, ...], // 1536-dim vector
    metadata: { name: 'Alice', role: 'developer' }
  },

  // Graph relationships
  graph: {
    nodeLabel: 'User',
    properties: { name: 'Alice', role: 'developer' },
    relationships: [
      { type: 'FOLLOWS', target: 'user-456', direction: 'outgoing' }
    ]
  },

  // Blockchain audit trail
  blockchain: {
    action: 'USER_CREATED',
    data: { userId: 'user-123', timestamp: Date.now() }
  }
});

// If any database fails, all changes are automatically rolled back (SAGA pattern)
```

### 3. Performance & Caching

```typescript
import { CacheManager, QueryMemoizer } from '@symbiosedb/core';

// Create cache with LRU eviction
const cache = new CacheManager({
  ttl: 5000,      // 5 seconds default TTL
  maxSize: 1000,  // Max 1000 entries
  strategy: 'lru'
});

// Set cached value with tags for easy invalidation
await cache.set('user:123', userData, {
  tags: ['users', 'user:123'],
  ttl: 10000  // 10 seconds
});

// Retrieve from cache
const cached = await cache.get('user:123');

// Invalidate all user queries
await cache.invalidateByTag('users');

// Query memoization (automatic caching)
const memoizer = new QueryMemoizer({
  cache,
  defaultTTL: 5000,
  enableMemoization: true
});

// First call: executes query
const result1 = await memoizer.execute(
  'SELECT * FROM users WHERE id = $1',
  ['123'],
  async (sql, params) => await db.query(sql, params),
  { tags: ['users'] }
);

// Second call: returns cached result (sub-millisecond)
const result2 = await memoizer.execute('SELECT * FROM users WHERE id = $1', ['123'], executor);
```

### 4. Advanced RAG Pipeline

```typescript
import { RAGPipeline, DocumentProcessor, EmbeddingManager } from '@symbiosedb/core';

const ragPipeline = new RAGPipeline({
  documentProcessor: new DocumentProcessor({
    chunkStrategy: 'semantic',  // or 'fixed', 'sentence', 'paragraph'
    chunkSize: 512,
    chunkOverlap: 50
  }),
  embeddingManager: new EmbeddingManager({
    cacheSize: 10000,
    cacheTTL: 3600000  // 1 hour
  })
});

// Index a document (automatically chunks + embeds + stores)
const indexResult = await ragPipeline.indexDocument({
  id: 'doc-123',
  text: 'Your long document text here...',
  metadata: { source: 'docs', category: 'api' }
});

// Query with natural language
const queryResult = await ragPipeline.query('How do I authenticate users?', {
  limit: 5,
  threshold: 0.7
});

// Generate context for LLM
const context = await ragPipeline.generateContext('How do I authenticate users?', {
  maxTokens: 2000,
  includeMetadata: true
});

// Generate answer with citations
const answer = await ragPipeline.answer('How do I authenticate users?', {
  maxTokens: 500,
  includeConfidence: true,
  includeSources: true
});

console.log(answer.text);         // AI-generated answer
console.log(answer.confidence);   // 'high', 'medium', or 'low'
console.log(answer.sources);      // Source documents with page numbers
```

---

## 📚 Core Concepts

### Query Routing

The `QueryRouter` analyzes queries to determine the optimal database:

**SQL Queries** → PostgreSQL
- Standard SQL: `SELECT`, `INSERT`, `UPDATE`, `DELETE`
- Joins, transactions, constraints
- Full-text search with `tsvector`

**Vector Queries** → pgvector
- `VECTOR_SEARCH` syntax
- Similarity search with cosine/L2/inner product
- Hybrid search (keyword + semantic)

**Graph Queries** → Apache AGE
- Cypher syntax: `MATCH`, `CREATE`, `MERGE`
- Relationship traversal
- Path finding algorithms

**Blockchain Queries** → Ethereum L2
- Attestation storage
- Verification
- Immutable audit trails

### Database Connectors

Each connector provides a consistent interface:

```typescript
interface DatabaseConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(query: string, params?: any[]): Promise<T[]>;
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  healthCheck(): Promise<boolean>;
}
```

**PostgreSQLConnector:**
- Connection pooling (min/max sizing)
- Prepared statements
- Transaction support (BEGIN, COMMIT, ROLLBACK)
- Query timeout handling
- SSL/TLS support

**PgVectorConnector:**
- Vector embedding storage
- Similarity search (cosine, L2, inner product)
- IVFFlat and HNSW indexing
- Metadata filtering
- Batch operations

**EthereumConnector:**
- Multi-chain support (Arbitrum, Optimism, Base, Polygon)
- Gas optimization
- Transaction signing
- Event listening
- Contract interaction

### Multi-Database Synchronization

**SAGA Pattern:**
- Distributed transactions across 4 databases
- Automatic compensation on failure
- Step-by-step execution with rollback
- Transaction history tracking

**Event Sourcing:**
- Every state change captured as immutable event
- Complete audit trail
- Event replay for debugging
- State reconstruction

**Unified Entity Manager:**
- One logical entity → 4 database writes
- Atomic all-or-nothing operations
- Optimistic locking with version numbers
- Sync status monitoring

### Performance Features

**Caching:**
- LRU eviction strategy
- TTL-based expiration
- Tag-based invalidation (clear related queries)
- Pattern matching (`user:*`)
- Statistics tracking (hit rate, evictions)

**Query Memoization:**
- Transparent automatic caching
- Hash-based cache keys (SQL + params)
- Configurable TTL per query
- Tag-based invalidation
- Cache bypass option

**Connection Pooling:**
- Min/max pool sizing
- Idle connection cleanup
- Health monitoring
- Automatic reconnection
- Peak usage tracking

---

## 🔧 Configuration

### QueryRouter Configuration

```typescript
interface DatabaseConfig {
  postgresql: {
    host: string;
    port?: number;              // Default: 5432
    database: string;
    user: string;
    password: string;
    ssl?: boolean | SSLConfig;
    poolSize?: { min: number; max: number };  // Default: { min: 2, max: 10 }
    timeout?: number;           // Default: 30000 (30 seconds)
    retryAttempts?: number;     // Default: 3
  };

  vector: {
    host: string;
    database: string;
    user: string;
    password: string;
    embeddingDimensions?: number;  // Default: 1536 (OpenAI ada-002)
  };

  blockchain: {
    rpcUrl: string;
    privateKey: string;
    chainId?: number;           // Default: 42161 (Arbitrum)
    gasLimit?: number;          // Default: 500000
    confirmations?: number;     // Default: 1
  };
}
```

### CacheManager Configuration

```typescript
interface CacheConfig {
  ttl?: number;                // Default TTL in milliseconds (default: 60000)
  maxSize?: number;            // Max entries before eviction (default: 1000)
  strategy?: 'lru' | 'lfu';    // Eviction strategy (default: 'lru')
  namespace?: string;          // Cache namespace for multi-tenancy
}
```

### UnifiedEntityManager Configuration

```typescript
interface UnifiedConfig {
  sql: PostgreSQLConnector;
  vector?: PgVectorConnector;     // Optional
  graph?: GraphConnector;         // Optional
  blockchain?: EthereumConnector; // Optional
  consistencyMode?: 'strong' | 'eventual';  // Default: 'strong'
  timeout?: number;               // Transaction timeout (default: 60000)
}
```

---

## 💡 Examples

### Example 1: E-Commerce Product Search (Hybrid SQL + Vector)

```typescript
import { QueryRouter, PostgreSQLConnector, PgVectorConnector } from '@symbiosedb/core';

const router = new QueryRouter({ postgresql, vector });

// Search products by text (SQL full-text search)
const textResults = await router.query(`
  SELECT * FROM products
  WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('wireless headphones')
  LIMIT 10
`);

// Search products by semantic similarity (Vector search)
const semanticResults = await router.query(`
  VECTOR_SEARCH product_embeddings
  WHERE similarity(embedding, $1) > 0.8
  LIMIT 10
`, [queryEmbedding]);

// Hybrid search (combine both)
const hybridResults = await router.query(`
  SELECT p.*,
         1 - (embedding <=> $1) AS similarity_score,
         ts_rank(to_tsvector('english', name || ' ' || description), plainto_tsquery($2)) AS text_score
  FROM products p
  WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery($2)
     OR 1 - (embedding <=> $1) > 0.7
  ORDER BY (similarity_score * 0.6 + text_score * 0.4) DESC
  LIMIT 20
`, [queryEmbedding, 'wireless headphones']);
```

### Example 2: Social Network with Graph Traversal

```typescript
import { QueryRouter } from '@symbiosedb/core';

const router = new QueryRouter({ postgresql, vector, blockchain });

// Find friends of friends (2-hop traversal)
const friendsOfFriends = await router.query(`
  MATCH (me:User {id: $1})-[:FOLLOWS]->(friend)-[:FOLLOWS]->(fof)
  WHERE fof.id <> $1 AND NOT (me)-[:FOLLOWS]->(fof)
  RETURN DISTINCT fof.id, fof.name, COUNT(friend) as mutual_friends
  ORDER BY mutual_friends DESC
  LIMIT 10
`, ['user-123']);

// Find shortest path between two users
const path = await router.query(`
  MATCH path = shortestPath((a:User {id: $1})-[:FOLLOWS*]-(b:User {id: $2}))
  RETURN path
`, ['user-123', 'user-456']);

// Store social interaction on blockchain for audit
await router.query({
  type: 'blockchain',
  action: 'store',
  data: {
    from: 'user-123',
    to: 'user-456',
    action: 'FOLLOWED',
    timestamp: Date.now()
  }
});
```

### Example 3: Document Q&A with RAG

```typescript
import { AdvancedRAG, DocumentProcessor, EmbeddingManager } from '@symbiosedb/core';

const advancedRAG = new AdvancedRAG({
  documentProcessor: new DocumentProcessor({ chunkStrategy: 'semantic' }),
  embeddingManager: new EmbeddingManager({ cacheSize: 10000 }),
  cacheTTL: 300000  // 5 minutes
});

// Index multiple documents
await Promise.all([
  advancedRAG.indexDocument({ id: '1', text: 'Authentication docs...', metadata: { type: 'docs' } }),
  advancedRAG.indexDocument({ id: '2', text: 'API reference...', metadata: { type: 'api' } }),
  advancedRAG.indexDocument({ id: '3', text: 'Tutorial...', metadata: { type: 'tutorial' } })
]);

// Query with multi-query fusion (generates 3-5 variations, fuses results with RRF)
const fusedResults = await advancedRAG.multiQueryFusion('How do I authenticate users?', {
  topK: 10,
  threshold: 0.7,
  numVariations: 5
});

// Verify answer citations (prevent hallucination)
const answer = "Use JWT tokens with bcrypt password hashing.";
const verification = await advancedRAG.verifyCitations(answer, fusedResults.results);

if (verification.verified) {
  console.log('Answer verified:', verification.matchedClaims);
} else {
  console.log('Unverified claims:', verification.unverifiedClaims);
}
```

### Example 4: Distributed Transaction with SAGA

```typescript
import { UnifiedEntityManager, TransactionCoordinator } from '@symbiosedb/core';

const entityManager = new UnifiedEntityManager({ sql, vector, blockchain });

try {
  // Create order with distributed transaction
  const order = await entityManager.create({
    id: 'order-789',
    type: 'Order',

    // Step 1: SQL (store order)
    sql: {
      tableName: 'orders',
      data: { userId: '123', total: 99.99, status: 'pending' }
    },

    // Step 2: Vector (embed for recommendations)
    vector: {
      collectionName: 'order_history',
      embedding: orderEmbedding,
      metadata: { userId: '123', total: 99.99 }
    },

    // Step 3: Blockchain (immutable receipt)
    blockchain: {
      action: 'ORDER_CREATED',
      data: { orderId: 'order-789', userId: '123', total: 99.99, timestamp: Date.now() }
    }
  });

  console.log('Order created successfully:', order);

} catch (error) {
  // If any step fails, ALL changes are automatically rolled back
  console.error('Order creation failed, all changes rolled back:', error);
}
```

### Example 5: Performance Monitoring

```typescript
import { QueryMemoizer, CacheManager } from '@symbiosedb/core';

const cache = new CacheManager({ ttl: 5000, maxSize: 1000 });
const memoizer = new QueryMemoizer({ cache });

// Execute queries
for (let i = 0; i < 1000; i++) {
  await memoizer.execute(
    'SELECT * FROM users WHERE id = $1',
    [i % 100],  // Repeat queries for 100 users
    executor
  );
}

// Get performance statistics
const stats = memoizer.getStats();
console.log(`Cache hit rate: ${stats.hitRate * 100}%`);
console.log(`Total queries: ${stats.totalQueries}`);
console.log(`Cache hits: ${stats.hits}`);
console.log(`Cache misses: ${stats.misses}`);
// Expected: ~90% hit rate with 1000 queries, 100 unique users
```

---

## 🐛 Troubleshooting

### Common Issues

#### Issue 1: "Configuration required" Error

**Problem:**
```typescript
const router = new QueryRouter();
// Error: Configuration required
```

**Solution:**
```typescript
const router = new QueryRouter({
  postgresql: { host: 'localhost', database: 'myapp', user: 'postgres', password: 'secret' },
  vector: { host: 'localhost', database: 'myapp', user: 'postgres', password: 'secret' },
  blockchain: { rpcUrl: 'https://arb1.arbitrum.io/rpc', privateKey: process.env.PRIVATE_KEY }
});
```

#### Issue 2: Connection Pool Exhausted

**Problem:**
```
Error: Connection pool exhausted (max: 10)
```

**Solution:**
Increase pool size or implement connection release:

```typescript
const postgresql = new PostgreSQLConnector({
  // ...
  poolSize: { min: 5, max: 50 }  // Increase max connections
});

// Always release connections in finally blocks
let conn;
try {
  conn = await pool.acquire();
  // Use connection
} finally {
  if (conn) await pool.release(conn);
}
```

#### Issue 3: Vector Search Returns No Results

**Problem:**
```typescript
const results = await router.query('VECTOR_SEARCH docs WHERE similarity > 0.8');
// Returns: []
```

**Solution:**
Check embedding dimensions and lower threshold:

```typescript
// Ensure embeddings are normalized and dimensions match
const results = await router.query('VECTOR_SEARCH docs WHERE similarity > 0.5 LIMIT 20');

// Or use different distance metric
const results = await router.query('VECTOR_SEARCH docs USING L2 WHERE distance < 1.0');
```

#### Issue 4: SAGA Transaction Rollback Too Slow

**Problem:**
Multi-database transactions taking >10 seconds to rollback.

**Solution:**
Optimize compensation logic and reduce timeout:

```typescript
const entityManager = new UnifiedEntityManager({
  sql, vector, blockchain,
  timeout: 30000,  // Reduce from default 60000
  consistencyMode: 'eventual'  // Use eventual consistency if strong not required
});
```

#### Issue 5: Cache Hit Rate Low (<50%)

**Problem:**
```typescript
const stats = cache.getStats();
console.log(stats.hitRate);  // 0.3 (30%)
```

**Solution:**
Increase cache size and TTL:

```typescript
const cache = new CacheManager({
  maxSize: 5000,   // Increase from 1000
  ttl: 30000,      // Increase from 5000 (5s → 30s)
  strategy: 'lru'
});
```

---

## 🔗 Related Packages

- **[@symbiosedb/api](../api)** - REST/GraphQL server built on core
- **[@symbiosedb/sdk](../sdk)** - High-level client SDK
- **[@symbiosedb/cli](../cli)** - Command-line interface for migrations and seeding
- **[@symbiosedb/realtime](../realtime)** - WebSocket server for live updates
- **[@symbiosedb/design-system](../design-system)** - UI components and design tokens

---

## 📖 Documentation

- **[Getting Started Guide](../../docs/QUICK-START.md)**
- **[Architecture Overview](../../docs/ARCHITECTURE.md)**
- **[API Reference](https://docs.symbiosedb.com/api)**
- **[Examples](../../examples)**

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test query-router.test.ts

# Run with coverage
npm test -- --coverage
```

**Test Coverage:** 85/85 tests passing (100%)

---

## 🏗️ Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Clean build artifacts
npm run clean
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](../../CONTRIBUTING.md) for details.

**Before submitting a PR:**
1. Run tests: `npm test`
2. Build successfully: `npm run build`
3. Follow our [Code Style Guide](../../docs/CODE-STYLE.md)
4. Add tests for new features
5. Update documentation

---

## 📄 License

MIT © [SymbioseDB](https://github.com/symbiosedb/symbiosedb)

---

## 🌟 Show Your Support

If you find @symbiosedb/core helpful, please:
- ⭐ Star us on [GitHub](https://github.com/symbiosedb/symbiosedb)
- 🐦 Follow us on [Twitter](https://twitter.com/symbiosedb)
- 💬 Join our [Discord](https://discord.gg/symbiosedb)

---

**Built with ❤️ by the SymbioseDB team**
