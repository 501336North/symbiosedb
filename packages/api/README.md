# @symbiosedb/api

**Production-ready REST and GraphQL API server for SymbioseDB with enterprise security, monitoring, and documentation.**

Transform your SymbioseDB databases into a fully-featured API in minutes with built-in authentication, rate limiting, metrics, logging, and interactive documentation.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://www.npmjs.com/package/@symbiosedb/api)
[![Tests](https://img.shields.io/badge/tests-79%20passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

---

## Why @symbiosedb/api?

**From Database to API in 3 Lines of Code.**

```typescript
import { SymbioseDBAPI } from '@symbiosedb/api';

const api = new SymbioseDBAPI();
await api.start(3000);
// ✅ REST API running at http://localhost:3000
// ✅ GraphQL playground at http://localhost:3000/graphql
// ✅ Swagger UI at http://localhost:3000/docs
// ✅ Prometheus metrics at http://localhost:3000/metrics
```

No complex configuration. No boilerplate. Just your database, instantly available as a secure, scalable API.

---

## ✨ Features

### API Types
- 🔄 **REST API** - Full CRUD operations with OpenAPI 3.0 spec
- 📊 **GraphQL API** - Auto-generated schema with subscriptions
- 🔌 **WebSocket Support** - Real-time updates and live queries
- 📡 **Server-Sent Events** - Streaming responses for long-running queries

### Security & Authentication
- 🔐 **JWT Authentication** - Secure token-based auth with 24h expiration
- 🔑 **API Key Management** - Generate, revoke, and manage API keys
- 🛡️ **Rate Limiting** - Per-endpoint limits (100 req/15min general, 5 req/15min auth)
- 🚦 **Permission-Based Authorization** - Role-based access control (RBAC)
- 🔒 **Security Headers** - Helmet + custom headers (CSP, HSTS, XSS protection)
- 🌐 **CORS Configuration** - Configurable allowed origins
- 🛡️ **Input Validation** - SQL injection & XSS prevention
- 📏 **Body Size Limits** - 10MB default with configurable max

### Monitoring & Observability
- 📊 **Prometheus Metrics** - HTTP requests, query latency, connection pool stats
- 📝 **Winston Logging** - Structured JSON logs with file + console transports
- 🏥 **Health Checks** - Component status (API, Database, Vector, Blockchain)
- 📈 **Query Performance Tracking** - Latency histograms and slow query detection
- 🔍 **Request/Response Logging** - Full audit trail with timestamps
- ⚠️ **Error Logging** - Stack traces with contextual information

### Documentation
- 📖 **Swagger UI** - Interactive API documentation at `/docs`
- 📜 **OpenAPI 3.0 Spec** - Complete schema definition at `/api-spec`
- 🔍 **Example Requests** - Try-it-out functionality with real responses
- 🏷️ **Tagged Endpoints** - Organized by Health, Queries, Vector, Blockchain

### Performance
- ⚡ **Response Compression** - Gzip compression for responses >1KB
- 🏊 **Connection Pooling** - Efficient database connection management
- 💾 **Query Caching** - Optional caching layer with Redis support
- 🚀 **Async Processing** - Non-blocking I/O for high throughput
- 📦 **Batch Operations** - Bulk inserts, updates, deletes

---

## 📦 Installation

```bash
# npm
npm install @symbiosedb/api

# yarn
yarn add @symbiosedb/api

# pnpm
pnpm add @symbiosedb/api
```

**Dependencies:**
- Node.js >= 18.0.0
- Express 4.x
- @symbiosedb/core >= 1.0.0

---

## 🚀 Quick Start

### 1. Basic Server Setup

```typescript
import { SymbioseDBAPI } from '@symbiosedb/api';
import { PostgreSQLConnector, PgVectorConnector, EthereumConnector } from '@symbiosedb/core';

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

// Create and start API server
const api = new SymbioseDBAPI({ port: 3000 });
await api.initialize({ postgresql, vector, blockchain });
await api.start();

console.log('✅ API running at http://localhost:3000');
console.log('📖 Swagger UI at http://localhost:3000/docs');
console.log('📊 Metrics at http://localhost:3000/metrics');
```

### 2. Making Requests

**REST API:**

```bash
# Health check
curl http://localhost:3000/health

# Query endpoint (requires authentication)
curl -X POST http://localhost:3000/query \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT * FROM users WHERE active = true"}'

# Vector search
curl -X POST http://localhost:3000/vector/search \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "collectionName": "documents",
    "embedding": [0.1, 0.2, 0.3, ...],
    "limit": 10,
    "threshold": 0.8
  }'

# Store blockchain attestation
curl -X POST http://localhost:3000/attestation/store \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "USER_LOGIN",
    "data": {"userId": "123", "timestamp": 1699564800000}
  }'
```

**GraphQL API:**

```graphql
# Query (http://localhost:3000/graphql)
query {
  users(where: { active: { eq: true } }, limit: 10) {
    id
    email
    name
    createdAt
  }
}

# Mutation
mutation {
  createUser(input: {
    email: "alice@example.com",
    name: "Alice",
    active: true
  }) {
    id
    email
    createdAt
  }
}

# Subscription (WebSocket)
subscription {
  userCreated {
    id
    email
    name
  }
}
```

### 3. Authentication

**JWT (Recommended for frontend applications):**

```typescript
import axios from 'axios';

// Login to get JWT token
const { data } = await axios.post('http://localhost:3000/auth/login', {
  email: 'user@example.com',
  password: 'secure_password'
});

const token = data.token;  // Valid for 24 hours

// Use token in subsequent requests
const users = await axios.post('http://localhost:3000/query',
  { sql: 'SELECT * FROM users' },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

**API Key (Recommended for backend services):**

```typescript
// Generate API key (requires admin permission)
const { data } = await axios.post('http://localhost:3000/auth/api-keys', {}, {
  headers: { Authorization: `Bearer ${adminToken}` }
});

const apiKey = data.apiKey;

// Use API key in requests
const users = await axios.post('http://localhost:3000/query',
  { sql: 'SELECT * FROM users' },
  { headers: { 'X-API-Key': apiKey } }
);
```

---

## 🔧 Configuration

### Server Options

```typescript
interface APIConfig {
  // Server
  port?: number;                    // Default: 3000
  host?: string;                    // Default: '0.0.0.0'

  // Security
  jwtSecret?: string;               // Default: process.env.JWT_SECRET
  jwtExpiration?: string;           // Default: '24h'
  bcryptRounds?: number;            // Default: 10
  corsOrigins?: string[];           // Default: ['*'] (dev only)
  maxBodySize?: string;             // Default: '10mb'

  // Rate Limiting
  rateLimits?: {
    general?: { window: number; max: number };      // Default: 15min, 100 req
    query?: { window: number; max: number };        // Default: 15min, 50 req
    auth?: { window: number; max: number };         // Default: 15min, 5 req
    blockchain?: { window: number; max: number };   // Default: 1hr, 10 req
  };

  // Monitoring
  enableMetrics?: boolean;          // Default: true
  enableLogging?: boolean;          // Default: true
  logLevel?: 'error' | 'warn' | 'info' | 'debug';  // Default: 'info'
  logDir?: string;                  // Default: './logs'

  // Documentation
  enableSwagger?: boolean;          // Default: true
  swaggerPath?: string;             // Default: '/docs'

  // Performance
  enableCompression?: boolean;      // Default: true
  compressionLevel?: number;        // Default: 6 (0-9)
  compressionThreshold?: number;    // Default: 1024 (bytes)

  // Database
  enableCaching?: boolean;          // Default: false
  cacheProvider?: 'memory' | 'redis';  // Default: 'memory'
  redisUrl?: string;               // Required if cacheProvider === 'redis'
}
```

### Example: Production Configuration

```typescript
const api = new SymbioseDBAPI({
  // Server
  port: parseInt(process.env.PORT || '3000'),
  host: '0.0.0.0',

  // Security
  jwtSecret: process.env.JWT_SECRET,  // ⚠️ REQUIRED in production
  jwtExpiration: '12h',
  bcryptRounds: 12,  // Higher rounds for better security
  corsOrigins: [
    'https://app.example.com',
    'https://admin.example.com'
  ],
  maxBodySize: '5mb',  // Stricter limit

  // Aggressive rate limiting for production
  rateLimits: {
    general: { window: 15 * 60 * 1000, max: 50 },
    query: { window: 15 * 60 * 1000, max: 30 },
    auth: { window: 15 * 60 * 1000, max: 3 },
    blockchain: { window: 60 * 60 * 1000, max: 5 }
  },

  // Monitoring
  enableMetrics: true,
  enableLogging: true,
  logLevel: 'warn',  // Only warnings and errors in production
  logDir: '/var/log/symbiosedb',

  // Documentation
  enableSwagger: false,  // Disable in production for security

  // Performance
  enableCompression: true,
  compressionLevel: 9,  // Maximum compression
  enableCaching: true,
  cacheProvider: 'redis',
  redisUrl: process.env.REDIS_URL
});
```

---

## 📚 API Endpoints

### Health & Monitoring

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | None | Health check with component status |
| `/metrics` | GET | None | Prometheus metrics (text format) |
| `/docs` | GET | None | Swagger UI documentation |
| `/api-spec` | GET | None | OpenAPI 3.0 spec (JSON) |

### Authentication

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/register` | POST | None | Register new user |
| `/auth/login` | POST | None | Login with email/password |
| `/auth/refresh` | POST | JWT | Refresh access token |
| `/auth/api-keys` | GET | JWT | List API keys |
| `/auth/api-keys` | POST | JWT (admin) | Generate new API key |
| `/auth/api-keys/:id` | DELETE | JWT (admin) | Revoke API key |

### Queries

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/query` | POST | JWT/API Key | 50/15min | Execute SQL/Cypher query |
| `/query/batch` | POST | JWT/API Key | 50/15min | Execute multiple queries |
| `/query/transaction` | POST | JWT/API Key | 50/15min | Execute transactional queries |

### Vector Search

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/vector/search` | POST | JWT/API Key | 50/15min | Semantic similarity search |
| `/vector/insert` | POST | JWT/API Key | 50/15min | Insert vector embedding |
| `/vector/delete` | DELETE | JWT/API Key | 50/15min | Delete vector by ID |

### Blockchain

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/attestation/store` | POST | JWT/API Key | 10/1hr | Store blockchain attestation |
| `/attestation/:id` | GET | JWT/API Key | 50/15min | Verify attestation by ID |

---

## 💡 Examples

### Example 1: Full Authentication Flow

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000';

// 1. Register new user
const registerResponse = await axios.post(`${API_URL}/auth/register`, {
  email: 'alice@example.com',
  password: 'SecurePassword123!',
  name: 'Alice'
});

// 2. Login to get JWT token
const loginResponse = await axios.post(`${API_URL}/auth/login`, {
  email: 'alice@example.com',
  password: 'SecurePassword123!'
});

const token = loginResponse.data.token;

// 3. Make authenticated request
const queryResponse = await axios.post(`${API_URL}/query`,
  { sql: 'SELECT * FROM orders WHERE user_id = $1', params: ['alice-id'] },
  { headers: { Authorization: `Bearer ${token}` } }
);

console.log(queryResponse.data.results);

// 4. Refresh token before expiration (24h)
const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {}, {
  headers: { Authorization: `Bearer ${token}` }
});

const newToken = refreshResponse.data.token;
```

### Example 2: Batch Operations

```typescript
// Execute multiple queries in one request
const batchResponse = await axios.post(`${API_URL}/query/batch`, {
  queries: [
    { sql: 'SELECT COUNT(*) as user_count FROM users' },
    { sql: 'SELECT COUNT(*) as order_count FROM orders' },
    { sql: 'SELECT SUM(total) as revenue FROM orders WHERE status = $1', params: ['completed'] }
  ]
}, {
  headers: { Authorization: `Bearer ${token}` }
});

const [userCount, orderCount, revenue] = batchResponse.data.results;
console.log({ userCount, orderCount, revenue });
```

### Example 3: Real-Time Monitoring

```typescript
import axios from 'axios';

// Fetch Prometheus metrics
const metricsResponse = await axios.get('http://localhost:3000/metrics');
const metrics = metricsResponse.data;

// Parse metrics (example: extract request count)
const requestCountMatch = metrics.match(/symbiosedb_http_requests_total{.*} (\d+)/);
const requestCount = requestCountMatch ? parseInt(requestCountMatch[1]) : 0;

// Fetch health status
const healthResponse = await axios.get('http://localhost:3000/health');
const health = healthResponse.data;

console.log({
  status: health.status,                    // 'healthy' or 'degraded' or 'unhealthy'
  uptime: health.uptime,                    // Seconds since server start
  requestCount,                             // Total requests served
  components: health.components,            // { api: true, database: true, vector: true, blockchain: false }
  metrics: health.metrics                   // { totalRequests, totalQueries, avgResponseTime }
});

// Set up monitoring alert
if (health.status !== 'healthy') {
  console.error('⚠️ API is unhealthy:', health.components);
  // Send alert to Slack/PagerDuty
}
```

### Example 4: Custom Middleware

```typescript
import { SymbioseDBAPI } from '@symbiosedb/api';
import { Request, Response, NextFunction } from 'express';

const api = new SymbioseDBAPI();

// Add custom middleware before routes
api.app.use((req: Request, res: Response, next: NextFunction) => {
  // Add request ID for tracing
  req.headers['x-request-id'] = req.headers['x-request-id'] || generateRequestId();

  // Add custom header to all responses
  res.setHeader('X-Powered-By', 'SymbioseDB');

  next();
});

// Add custom route
api.app.get('/custom/stats', async (req, res) => {
  const stats = await getCustomStats();
  res.json(stats);
});

await api.start();
```

---

## 🐛 Troubleshooting

### Issue 1: "JWT Secret Required" Error

**Problem:**
```
Error: JWT_SECRET environment variable required in production
```

**Solution:**
```bash
# Set JWT_SECRET environment variable
export JWT_SECRET="your-super-secret-key-min-32-chars"

# Or in .env file
echo "JWT_SECRET=your-super-secret-key-min-32-chars" >> .env
```

### Issue 2: CORS Errors in Browser

**Problem:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:**
```typescript
const api = new SymbioseDBAPI({
  corsOrigins: [
    'http://localhost:3000',           // Local development
    'https://your-frontend-domain.com' // Production frontend
  ]
});
```

### Issue 3: Rate Limit Exceeded

**Problem:**
```json
{ "error": "Too many requests, please try again later" }
```

**Solution:**
Option 1: Increase rate limits (development only):
```typescript
const api = new SymbioseDBAPI({
  rateLimits: {
    general: { window: 15 * 60 * 1000, max: 500 }  // 500 requests per 15 minutes
  }
});
```

Option 2: Implement exponential backoff:
```typescript
async function queryWithRetry(query, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios.post('/query', query);
    } catch (error) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        await sleep(Math.pow(2, i) * 1000);  // Exponential backoff: 1s, 2s, 4s
        continue;
      }
      throw error;
    }
  }
}
```

### Issue 4: Metrics Not Appearing in Prometheus

**Problem:**
Prometheus `/metrics` endpoint returns empty or incomplete data.

**Solution:**
```typescript
// Ensure metrics are enabled
const api = new SymbioseDBAPI({
  enableMetrics: true  // ✅ Default is true
});

// Make some requests to generate metrics
await api.initialize(dbConfig);
await api.start();

// Now metrics should be available
const response = await fetch('http://localhost:3000/metrics');
console.log(await response.text());
```

---

## 📖 Additional Documentation

- **[Authentication Guide](../../docs/authentication.md)** - Detailed auth setup
- **[Rate Limiting Best Practices](../../docs/rate-limiting.md)** - Production configs
- **[Monitoring Setup](../../docs/monitoring.md)** - Prometheus + Grafana
- **[API Security Checklist](../../docs/security-checklist.md)** - Production hardening

---

## 🔗 Related Packages

- **[@symbiosedb/core](../core)** - Query routing and database connectors
- **[@symbiosedb/sdk](../sdk)** - Client SDK for calling this API
- **[@symbiosedb/cli](../cli)** - CLI for migrations and management
- **[@symbiosedb/auth](../auth)** - Advanced authentication features

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test auth.test.ts
```

**Test Coverage:** 79/79 tests passing (100%)

---

## 📄 License

MIT © [SymbioseDB](https://github.com/symbiosedb/symbiosedb)

---

**Built with ❤️ by the SymbioseDB team**
