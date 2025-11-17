# @symbiosedb/sdk

**The official JavaScript/TypeScript SDK for SymbioseDB.**

Build applications on SymbioseDB with a type-safe, promise-based async API. Connect to all four database types (SQL, Vector, Graph, Blockchain) through a single unified client with automatic connection pooling, retries, and error handling.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://www.npmjs.com/package/@symbiosedb/sdk)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

---

## Why @symbiosedb/sdk?

**From API Key to Query in 3 Lines.**

```typescript
import { SymbioseDBClient } from '@symbiosedb/sdk';

const db = new SymbioseDBClient({ apiKey: process.env.SYMBIOSEDB_API_KEY });
const users = await db.query('SELECT * FROM users WHERE active = true');
```

No complex setup. No manual HTTP requests. Just a clean API that feels natural in JavaScript/TypeScript.

---

## ✨ Features

### Client Features
- 🔑 **API Key Authentication** - Simple authentication with automatic header injection
- 🔄 **Automatic Retries** - Exponential backoff for transient failures
- 💾 **Connection Pooling** - Efficient HTTP connection reuse
- 🎯 **Type-Safe** - Full TypeScript definitions for all methods
- ⚡ **Promise-Based** - Modern async/await API
- 🛡️ **Error Handling** - Custom error types with detailed messages
- 📦 **Zero Dependencies** - Uses native fetch API (Node 18+)

### Database Operations
- 📊 **SQL Queries** - Execute PostgreSQL queries with parameters
- 🔍 **Vector Search** - Semantic similarity search with embeddings
- ⛓️ **Blockchain Attestations** - Store and verify immutable records
- 🕸️ **Graph Queries** - Cypher queries for relationship traversal (via SQL query endpoint)
- 📈 **Health Checks** - Monitor API and database status

### Developer Experience
- 🎨 **Clean API** - Intuitive method names and arguments
- 📖 **IntelliSense** - Full autocomplete in VS Code
- 🐛 **Debug Friendly** - Clear error messages with context
- 🧪 **Test Ready** - Easy to mock for unit tests
- 🌐 **Environment Variables** - Supports `.env` configuration

---

## 📦 Installation

```bash
# npm
npm install @symbiosedb/sdk

# yarn
yarn add @symbiosedb/sdk

# pnpm
pnpm add @symbiosedb/sdk
```

**Requirements:**
- Node.js >= 18.0.0 (for native fetch API)
- A SymbioseDB API key ([get one free](https://symbiosedb.com))

---

## 🚀 Quick Start

### 1. Basic Setup

```typescript
import { SymbioseDBClient } from '@symbiosedb/sdk';

// Initialize client
const db = new SymbioseDBClient({
  apiKey: process.env.SYMBIOSEDB_API_KEY,
  baseURL: 'https://api.symbiosedb.com' // Optional, defaults to production
});

// Execute SQL query
const result = await db.query('SELECT * FROM users WHERE age > $1', [21]);
console.log(result.rows); // [{ id: 1, name: 'Alice', age: 30 }, ...]
```

### 2. Vector Search

```typescript
// Search for similar documents
const results = await db.vectorSearch({
  collection: 'documents',
  embedding: [0.1, 0.2, 0.3, ...], // 1536-dim vector from OpenAI
  limit: 10
});

results.forEach(result => {
  console.log(`${result.similarity.toFixed(2)} - ${result.metadata.title}`);
});
```

### 3. Blockchain Attestations

```typescript
// Store immutable record
const attestation = await db.attest({
  action: 'USER_LOGIN',
  data: { userId: '123', timestamp: Date.now() }
});

console.log(`Attestation ID: ${attestation.attestationId}`);
console.log(`Transaction Hash: ${attestation.txHash}`);

// Verify attestation later
const verification = await db.verifyAttestation(attestation.attestationId);
console.log(`Valid: ${verification.valid}`);
```

---

## 🔧 Configuration

### Client Options

```typescript
interface ClientConfig {
  apiKey: string;              // Required: Your SymbioseDB API key
  baseURL?: string;            // Optional: API endpoint (default: https://api.symbiosedb.com)
}
```

### Example: Development vs Production

```typescript
// Development (local API)
const devDB = new SymbioseDBClient({
  apiKey: 'dev-api-key',
  baseURL: 'http://localhost:3000'
});

// Production
const prodDB = new SymbioseDBClient({
  apiKey: process.env.SYMBIOSEDB_API_KEY,
  // baseURL defaults to https://api.symbiosedb.com
});
```

---

## 💡 Examples

### Example 1: User Authentication

```typescript
import { SymbioseDBClient } from '@symbiosedb/sdk';

const db = new SymbioseDBClient({ apiKey: process.env.SYMBIOSEDB_API_KEY });

async function login(email: string, password: string) {
  // Query user by email
  const result = await db.query(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  // Verify password (in production, use bcrypt)
  const validPassword = await verifyPassword(password, user.password_hash);

  if (!validPassword) {
    throw new Error('Invalid password');
  }

  // Store login event on blockchain
  await db.attest({
    action: 'USER_LOGIN',
    data: {
      userId: user.id,
      email: user.email,
      timestamp: Date.now(),
      ip: request.ip
    }
  });

  return { userId: user.id, email: user.email };
}
```

### Example 2: Semantic Document Search

```typescript
import { SymbioseDBClient } from '@symbiosedb/sdk';
import OpenAI from 'openai';

const db = new SymbioseDBClient({ apiKey: process.env.SYMBIOSEDB_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function searchDocuments(query: string) {
  // Generate embedding for query
  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query
  });

  const queryEmbedding = embedding.data[0].embedding;

  // Search for similar documents
  const results = await db.vectorSearch({
    collection: 'documentation',
    embedding: queryEmbedding,
    limit: 5
  });

  return results.map(result => ({
    title: result.metadata.title,
    content: result.metadata.content,
    score: result.similarity,
    url: result.metadata.url
  }));
}

// Usage
const docs = await searchDocuments('How do I authenticate users?');
docs.forEach(doc => {
  console.log(`${doc.score.toFixed(2)} - ${doc.title}`);
  console.log(doc.content.substring(0, 200) + '...');
  console.log(doc.url);
  console.log('---');
});
```

### Example 3: Transaction History with Blockchain Proof

```typescript
async function recordTransaction(transaction: {
  userId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  currency: string;
}) {
  // Store in SQL database
  const sqlResult = await db.query(`
    INSERT INTO transactions (user_id, type, amount, currency, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING id
  `, [transaction.userId, transaction.type, transaction.amount, transaction.currency]);

  const transactionId = sqlResult.rows[0].id;

  // Create immutable blockchain proof
  const attestation = await db.attest({
    action: 'TRANSACTION_RECORDED',
    data: {
      transactionId,
      userId: transaction.userId,
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      timestamp: Date.now()
    }
  });

  return {
    transactionId,
    attestationId: attestation.attestationId,
    txHash: attestation.txHash
  };
}
```

### Example 4: Real-Time Monitoring Dashboard

```typescript
async function getDashboardStats() {
  // Check API health
  const health = await db.health();

  // Get user statistics
  const userStats = await db.query(`
    SELECT
      COUNT(*) as total_users,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_users_today,
      COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '1 hour') as active_users
    FROM users
  `);

  // Get transaction statistics
  const txStats = await db.query(`
    SELECT
      COUNT(*) as total_transactions,
      SUM(amount) as total_volume,
      AVG(amount) as avg_transaction
    FROM transactions
    WHERE created_at > NOW() - INTERVAL '24 hours'
  `);

  return {
    health: {
      status: health.status,
      uptime: health.uptime,
      version: health.version
    },
    users: userStats.rows[0],
    transactions: txStats.rows[0]
  };
}
```

### Example 5: Error Handling

```typescript
import { SymbioseDBClient } from '@symbiosedb/sdk';

const db = new SymbioseDBClient({ apiKey: process.env.SYMBIOSEDB_API_KEY });

async function safeQuery(sql: string, params?: any[]) {
  try {
    const result = await db.query(sql, params);
    return { success: true, data: result.rows };
  } catch (error) {
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('syntax error')) {
        console.error('SQL syntax error:', sql);
        return { success: false, error: 'Invalid SQL query' };
      }

      if (error.message.includes('authentication')) {
        console.error('Authentication failed - check API key');
        return { success: false, error: 'Authentication error' };
      }

      if (error.message.includes('rate limit')) {
        console.error('Rate limit exceeded - retry later');
        return { success: false, error: 'Too many requests' };
      }

      // Generic error
      console.error('Query failed:', error.message);
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Unknown error' };
  }
}
```

---

## 📚 API Reference

### SymbioseDBClient

Main client class for interacting with SymbioseDB.

#### Constructor

```typescript
new SymbioseDBClient(config: ClientConfig)
```

**Parameters:**
- `config.apiKey` (string) - Your SymbioseDB API key (**required**)
- `config.baseURL` (string) - API endpoint URL (optional, default: `https://api.symbiosedb.com`)

#### Methods

##### `query(sql: string, params?: any[]): Promise<QueryResult>`

Execute a SQL query with optional parameters.

**Parameters:**
- `sql` - SQL query string (supports `$1`, `$2`, etc. for parameters)
- `params` - Array of parameter values (optional)

**Returns:** Promise resolving to `{ rows: any[] }`

**Example:**
```typescript
const result = await db.query('SELECT * FROM users WHERE id = $1', ['123']);
```

##### `vectorSearch(options: VectorSearchOptions): Promise<VectorSearchResult[]>`

Perform vector similarity search.

**Parameters:**
- `options.collection` (string) - Collection name to search
- `options.embedding` (number[]) - Query embedding vector
- `options.limit` (number) - Max results to return (optional, default: 10)

**Returns:** Promise resolving to array of results with `id`, `similarity`, and `metadata`

**Example:**
```typescript
const results = await db.vectorSearch({
  collection: 'products',
  embedding: [0.1, 0.2, 0.3, ...],
  limit: 5
});
```

##### `attest(options: AttestationOptions): Promise<AttestationResult>`

Store an immutable attestation on the blockchain.

**Parameters:**
- `options.action` (string) - Action identifier (e.g., 'USER_LOGIN', 'TRANSACTION')
- `options.data` (any) - Attestation data (will be hashed)

**Returns:** Promise resolving to `{ attestationId: string, txHash: string }`

**Example:**
```typescript
const attestation = await db.attest({
  action: 'ORDER_PLACED',
  data: { orderId: '789', userId: '123', total: 99.99 }
});
```

##### `verifyAttestation(attestationId: string): Promise<AttestationVerification>`

Verify a blockchain attestation.

**Parameters:**
- `attestationId` (string) - Attestation ID to verify

**Returns:** Promise resolving to `{ valid: boolean, attestation: { action: string, timestamp: number } }`

**Example:**
```typescript
const verification = await db.verifyAttestation('attest-123');
if (verification.valid) {
  console.log('Attestation verified at:', verification.attestation.timestamp);
}
```

##### `health(): Promise<HealthStatus>`

Check API and database health.

**Returns:** Promise resolving to `{ status: string, uptime: number, version: string }`

**Example:**
```typescript
const health = await db.health();
console.log(`Status: ${health.status}, Uptime: ${health.uptime}s`);
```

##### `getBaseURL(): string`

Get the current API base URL.

**Returns:** Base URL string

---

## 🐛 Troubleshooting

### Issue 1: "API key is required" Error

**Problem:**
```typescript
const db = new SymbioseDBClient({});
// Error: API key is required
```

**Solution:**
```typescript
// Set API key in environment variable
process.env.SYMBIOSEDB_API_KEY = 'your-api-key';

const db = new SymbioseDBClient({
  apiKey: process.env.SYMBIOSEDB_API_KEY
});
```

### Issue 2: "fetch is not defined" (Node < 18)

**Problem:**
```
ReferenceError: fetch is not defined
```

**Solution:**
Upgrade to Node.js 18+ or install a fetch polyfill:

```bash
npm install node-fetch
```

```typescript
// At top of file
import fetch from 'node-fetch';
globalThis.fetch = fetch as any;
```

### Issue 3: Connection Timeout

**Problem:**
Queries timeout or hang indefinitely.

**Solution:**
Check your network connection and API endpoint:

```typescript
// Test health endpoint first
try {
  const health = await db.health();
  console.log('API is reachable:', health.status);
} catch (error) {
  console.error('Cannot reach API:', error);
  // Check firewall, VPN, or baseURL configuration
}
```

### Issue 4: "Invalid embedding" Error

**Problem:**
```
Error: Embedding cannot be empty
```

**Solution:**
Ensure embedding vector is not empty:

```typescript
// ❌ Wrong
await db.vectorSearch({ collection: 'docs', embedding: [] });

// ✅ Correct
const embedding = await generateEmbedding('query text');
await db.vectorSearch({ collection: 'docs', embedding });
```

### Issue 5: Rate Limit Exceeded

**Problem:**
```
Error: Too many requests, please try again later
```

**Solution:**
Implement exponential backoff:

```typescript
async function queryWithRetry(sql: string, params?: any[], maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await db.query(sql, params);
    } catch (error) {
      if (error.message.includes('rate limit') && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

---

## 🔗 Related Packages

- **[@symbiosedb/core](../core)** - Core query routing and database connectors
- **[@symbiosedb/api](../api)** - REST/GraphQL API server
- **[@symbiosedb/cli](../cli)** - Command-line interface for migrations
- **[@symbiosedb/realtime](../realtime)** - WebSocket server for live updates

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

---

## 📖 Additional Resources

- **[Getting Started Guide](../../docs/QUICK-START.md)**
- **[API Documentation](https://docs.symbiosedb.com)**
- **[Examples Repository](../../examples)**
- **[Discord Community](https://discord.gg/symbiosedb)**

---

## 📄 License

MIT © [SymbioseDB](https://github.com/symbiosedb/symbiosedb)

---

**Built with ❤️ by the SymbioseDB team**
