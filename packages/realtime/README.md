# @symbiosedb/realtime

**Real-time features for SymbioseDB with WebSocket pub/sub, presence tracking, and live query subscriptions.**

Transform your database into a real-time collaborative platform with automatic live updates, presence awareness, and reactive data streams.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://www.npmjs.com/package/@symbiosedb/realtime)
[![Tests](https://img.shields.io/badge/tests-32%20passing-brightgreen)](#)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

---

## Why @symbiosedb/realtime?

**Build Real-Time Apps in Minutes.**

```typescript
import { RealtimeServer } from '@symbiosedb/realtime';

const server = new RealtimeServer({ port: 8080 });
await server.start();

// Subscribe to channel
server.subscribe('chat', (message) => {
  console.log('New message:', message);
});

// Publish to channel
await server.publish('chat', { user: 'Alice', text: 'Hello!' });
// → All subscribers receive message instantly
```

No complex WebSocket setup. No Redis configuration. Just real-time pub/sub that works out of the box.

---

## ✨ Features

### Core Features
- 🔌 **WebSocket Server** - Production-ready WebSocket infrastructure
- 📡 **Pub/Sub Messaging** - Channel-based publish/subscribe patterns
- 👥 **Presence Tracking** - Know who's online in each channel
- 🔄 **Live Query Subscriptions** - Auto-refresh when database changes
- 📊 **Channel Statistics** - Track subscribers, messages, and activity
- 🎯 **Client Tracking** - Monitor connections and subscriptions

### Security & Performance
- 🔐 **JWT Authentication** - Secure WebSocket connections
- 🔑 **API Key Support** - Alternative authentication method
- 🛡️ **Permission System** - Channel-level access control (read/write)
- 🚦 **Rate Limiting** - Per-client, per-operation limits
- 📏 **Message Validation** - XSS prevention and size limits
- ⚡ **Async Callbacks** - Non-blocking message handling

### Developer Experience
- 🎨 **Simple API** - Intuitive subscribe/publish methods
- 📖 **TypeScript First** - Full type safety with interfaces
- 🐛 **Error Handling** - Clear error messages with context
- 🧪 **Test Friendly** - In-memory implementation for testing
- 📈 **Observable** - Event-driven architecture

---

## 📦 Installation

```bash
# npm
npm install @symbiosedb/realtime

# yarn
yarn add @symbiosedb/realtime

# pnpm
pnpm add @symbiosedb/realtime
```

**Dependencies:**
- Node.js >= 18.0.0
- `ws` >= 8.14.0 (WebSocket library)
- `jsonwebtoken` >= 9.0.2 (JWT auth)

---

## 🚀 Quick Start

### 1. Basic Pub/Sub

```typescript
import { RealtimeServer } from '@symbiosedb/realtime';

// Create server
const server = new RealtimeServer({
  port: 8080,
  host: '0.0.0.0'
});

// Start server
await server.start();
console.log('Realtime server running on port 8080');

// Subscribe to channel
const unsubscribe = server.subscribe('notifications', (message) => {
  console.log('Notification:', message);
});

// Publish message
await server.publish('notifications', {
  title: 'New Order',
  message: 'Order #123 placed',
  timestamp: Date.now()
});

// Unsubscribe when done
unsubscribe();
```

### 2. Presence Tracking

```typescript
// Update presence
server.updatePresence('client-123', 'lobby', {
  name: 'Alice',
  status: 'online',
  avatar: 'https://example.com/avatar.png'
});

// Get all users in channel
const users = server.getPresence('lobby');
users.forEach(user => {
  console.log(`${user.data.name} - ${user.data.status}`);
  console.log(`Joined: ${new Date(user.joinedAt).toISOString()}`);
});
```

### 3. Live Query Subscriptions

```typescript
// Subscribe to query updates
const subscriptionId = server.subscribeToQuery(
  'client-123',
  'SELECT * FROM orders WHERE status = $1',
  ['pending']
);

// When data changes, notify subscribers
await server.notifyQueryUpdate(
  'SELECT * FROM orders WHERE status = $1',
  [{ id: 1, status: 'pending', total: 99.99 }]
);

// Unsubscribe
server.unsubscribeFromQuery(subscriptionId);
```

---

## 🔧 Configuration

### Server Options

```typescript
interface RealtimeConfig {
  port?: number;                    // WebSocket port (default: 8080)
  host?: string;                    // Host address (default: '0.0.0.0')
  pingInterval?: number;            // Keep-alive ping interval (default: 30000ms)
  presenceTimeout?: number;         // Presence TTL (default: 60000ms)
  requireAuth?: boolean;            // Require authentication (default: false)
  jwtSecret?: string;               // JWT secret for authentication
  rateLimit?: {
    maxConnections: number;         // Max connections per IP
    maxMessagesPerMinute: number;   // Max messages per client
    windowMs: number;               // Rate limit window
  };
}
```

### Example: Production Configuration

```typescript
const server = new RealtimeServer({
  port: parseInt(process.env.REALTIME_PORT || '8080'),
  host: '0.0.0.0',

  // Security
  requireAuth: true,
  jwtSecret: process.env.JWT_SECRET,

  // Rate limiting
  rateLimit: {
    maxConnections: 10,              // 10 connections per IP
    maxMessagesPerMinute: 60,        // 60 messages per minute per client
    windowMs: 60000                  // 1-minute window
  },

  // Keep-alive
  pingInterval: 30000,               // Ping every 30 seconds
  presenceTimeout: 60000             // Remove after 60s inactivity
});
```

---

## 💡 Examples

### Example 1: Chat Application

```typescript
import { RealtimeServer } from '@symbiosedb/realtime';

const server = new RealtimeServer({ port: 8080 });
await server.start();

// User joins chat
server.updatePresence('alice', 'chat-room-1', {
  name: 'Alice',
  avatar: 'https://example.com/alice.png',
  status: 'online'
});

// Subscribe to chat messages
server.subscribe('chat-room-1', (message) => {
  console.log(`${message.user}: ${message.text}`);

  // Store message in database
  await db.query(`
    INSERT INTO messages (room_id, user_id, text, created_at)
    VALUES ($1, $2, $3, NOW())
  `, ['chat-room-1', message.userId, message.text]);
});

// Send message
await server.publish('chat-room-1', {
  userId: 'alice',
  user: 'Alice',
  text: 'Hello everyone!',
  timestamp: Date.now()
});

// Get online users
const onlineUsers = server.getPresence('chat-room-1');
console.log(`${onlineUsers.length} users online`);
```

### Example 2: Collaborative Document Editing

```typescript
// Track document editors
server.updatePresence('user-123', 'document:abc', {
  name: 'Bob',
  cursor: { line: 10, column: 5 },
  color: '#3b82f6'
});

// Subscribe to document changes
server.subscribe('document:abc', async (change) => {
  console.log(`Change by ${change.userId}:`, change.delta);

  // Apply change to database
  await db.query(`
    UPDATE documents
    SET content = $1, updated_at = NOW()
    WHERE id = $2
  `, [change.content, 'abc']);

  // Notify query subscribers
  const updatedDoc = await db.query('SELECT * FROM documents WHERE id = $1', ['abc']);
  await server.notifyQueryUpdate(
    'SELECT * FROM documents WHERE id = $1',
    updatedDoc.rows
  );
});

// Publish document change
await server.publish('document:abc', {
  userId: 'user-123',
  delta: { ops: [{ insert: 'Hello' }] },
  content: 'Hello',
  timestamp: Date.now()
});
```

### Example 3: Live Dashboard with Authentication

```typescript
import jwt from 'jsonwebtoken';

const server = new RealtimeServer({
  port: 8080,
  requireAuth: true,
  jwtSecret: process.env.JWT_SECRET
});

await server.start();

// Authenticate connection
async function connectClient(token: string, clientId: string) {
  const authResult = await server.authenticateConnection(token);

  if (!authResult.success) {
    throw new Error(authResult.error || 'Authentication failed');
  }

  // Handle connection with permissions
  await server.handleConnection({
    id: clientId,
    auth: token,
    ip: '192.168.1.1'
  });

  console.log(`Client ${clientId} connected with permissions:`, authResult.permissions);
}

// Add API key for server-to-server communication
server.addApiKey('secret-api-key-123', {
  name: 'Dashboard Server',
  permissions: ['read:metrics', 'write:metrics']
});

// Subscribe with permission check
await server.subscribeClient('client-123', 'metrics');

// Publish metrics
await server.publishFromClient('client-123', 'metrics', {
  cpu: 45.2,
  memory: 62.1,
  requests: 1234,
  timestamp: Date.now()
});
```

### Example 4: Notification System

```typescript
// Subscribe to user-specific notifications
server.subscribe('user:alice:notifications', (notification) => {
  console.log('Notification:', notification);

  // Display notification in UI
  showToast({
    title: notification.title,
    message: notification.message,
    type: notification.type
  });
});

// Send notification to specific user
async function notifyUser(userId: string, notification: {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}) {
  await server.publish(`user:${userId}:notifications`, {
    ...notification,
    id: generateId(),
    timestamp: Date.now(),
    read: false
  });
}

// Send notification to all users
async function broadcastNotification(notification: any) {
  await server.publish('global:notifications', notification);
}

// Usage
await notifyUser('alice', {
  title: 'New Message',
  message: 'You have a new message from Bob',
  type: 'info'
});
```

### Example 5: Live Data Sync

```typescript
// Subscribe to database table changes
server.subscribe('table:users', async (event) => {
  console.log(`Table event: ${event.type}`);

  switch (event.type) {
    case 'INSERT':
      console.log('New user:', event.data);
      break;
    case 'UPDATE':
      console.log('Updated user:', event.data);
      break;
    case 'DELETE':
      console.log('Deleted user:', event.userId);
      break;
  }
});

// Trigger on database operations
async function createUser(user: { email: string; name: string }) {
  // Insert into database
  const result = await db.query(`
    INSERT INTO users (email, name, created_at)
    VALUES ($1, $2, NOW())
    RETURNING *
  `, [user.email, user.name]);

  // Notify subscribers
  await server.publish('table:users', {
    type: 'INSERT',
    data: result.rows[0]
  });

  return result.rows[0];
}
```

---

## 📚 API Reference

### RealtimeServer

Main server class for real-time features.

#### Constructor

```typescript
new RealtimeServer(config?: RealtimeConfig)
```

#### Methods

##### `start(): Promise<void>`

Start the WebSocket server.

##### `stop(): Promise<void>`

Stop the server and clear all data.

##### `publish(channel: string, data: any): Promise<number>`

Publish message to channel. Returns number of subscribers who received it.

##### `subscribe(channel: string, callback: SubscriptionCallback): () => void`

Subscribe to channel. Returns unsubscribe function.

**Callback signature:** `(data: any, metadata?: any) => void | Promise<void>`

##### `updatePresence(clientId: string, channel: string, data: any): void`

Update client presence in channel.

##### `getPresence(channel: string): PresenceData[]`

Get all presence data for channel.

##### `subscribeToQuery(clientId: string, query: string, params?: any[]): string`

Subscribe to query updates. Returns subscription ID.

##### `unsubscribeFromQuery(subscriptionId: string): void`

Unsubscribe from query.

##### `notifyQueryUpdate(query: string, result: any): Promise<void>`

Notify all subscribers of query with new data.

##### `getChannelStats(channel?: string): ChannelStats[]`

Get statistics for specific channel or all channels.

##### `getClientInfo(clientId?: string): ClientInfo[]`

Get information about specific client or all clients.

##### `getActiveConnections(): number`

Get count of active connections.

#### Security Methods

##### `authenticateConnection(token: string): Promise<AuthResult>`

Authenticate JWT token. Returns `{ success, userId?, permissions?, error? }`.

##### `handleConnection(client: { id, auth?, apiKey?, ip? }): Promise<boolean>`

Handle new connection with authentication.

##### `addApiKey(key: string, config: ApiKeyConfig): void`

Add API key for authentication.

##### `checkChannelPermission(clientId: string, channel: string): boolean`

Check if client has permission for channel.

##### `enforceRateLimit(clientId: string, operation: string): boolean`

Check if client is within rate limit.

##### `validateMessage(message: any): boolean`

Validate message for size and XSS.

##### `subscribeClient(clientId: string, channel: string): Promise<boolean>`

Subscribe client to channel with permission check.

##### `publishFromClient(clientId: string, channel: string, data: any): Promise<number>`

Publish from client with permission and rate limit checks.

---

## 🐛 Troubleshooting

### Issue 1: "Authentication required" Error

**Problem:**
```
Error: Authentication required for WebSocket connection
```

**Solution:**
Either disable auth for development or provide JWT token:

```typescript
// Development: Disable auth
const server = new RealtimeServer({ requireAuth: false });

// Production: Provide JWT
const token = jwt.sign({ id: 'user-123', permissions: ['read:*', 'write:*'] }, secret);
await server.handleConnection({ id: 'client-123', auth: token });
```

### Issue 2: "Rate limit exceeded" Error

**Problem:**
```
Error: Rate limit exceeded: Too many messages sent
```

**Solution:**
Increase rate limits or implement client-side throttling:

```typescript
const server = new RealtimeServer({
  rateLimit: {
    maxConnections: 50,           // Increase connection limit
    maxMessagesPerMinute: 120,    // Increase message limit
    windowMs: 60000
  }
});
```

### Issue 3: Messages Not Received

**Problem:**
Published messages don't reach subscribers.

**Solution:**
Ensure channel names match exactly:

```typescript
// ❌ Wrong - channel names don't match
server.subscribe('notifications', callback);
await server.publish('notification', data); // Missing 's'

// ✅ Correct
server.subscribe('notifications', callback);
await server.publish('notifications', data);
```

### Issue 4: "Invalid channel name format" Error

**Problem:**
```
Error: Invalid channel name format
```

**Solution:**
Avoid path traversal characters in channel names:

```typescript
// ❌ Wrong
server.subscribe('../admin/secrets', callback);

// ✅ Correct
server.subscribe('admin:secrets', callback);
```

### Issue 5: Memory Leak with Subscriptions

**Problem:**
Server memory grows over time.

**Solution:**
Always unsubscribe when done:

```typescript
// Store unsubscribe function
const unsubscribe = server.subscribe('channel', callback);

// Clean up when component unmounts or no longer needed
useEffect(() => {
  return () => unsubscribe(); // Cleanup
}, []);
```

---

## 🔗 Related Packages

- **[@symbiosedb/sdk](../sdk)** - Client SDK for calling SymbioseDB
- **[@symbiosedb/core](../core)** - Core database connectors
- **[@symbiosedb/api](../api)** - REST/GraphQL API server

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

**Test Coverage:** 32/32 tests passing (100%)

---

## 📄 License

MIT © [SymbioseDB](https://github.com/symbiosedb/symbiosedb)

---

**Built with ❤️ by the SymbioseDB team**
