# @symbiosedb/auth

**Complete authentication system for SymbioseDB supporting Email/Password, Web3 Wallets, and OAuth providers.**

Secure your SymbioseDB applications with multiple authentication methods, role-based access control, and session management. Works seamlessly with @symbiosedb/api for protected endpoints.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://www.npmjs.com/package/@symbiosedb/auth)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

---

## Why @symbiosedb/auth?

**Authentication in 5 Lines.**

```typescript
import { AuthManager } from '@symbiosedb/auth';

const auth = new AuthManager({ jwtSecret: process.env.JWT_SECRET });

const session = await auth.login({ email: 'user@example.com', password: 'secret' });
console.log(session.token); // JWT token valid for 24 hours
```

No complex setup. No third-party dependencies. Just secure, production-ready authentication.

---

## ✨ Features

### Authentication Methods
- 📧 **Email/Password** - Traditional auth with bcrypt hashing (10 rounds)
- 🦊 **Web3 Wallets** - MetaMask, WalletConnect, Coinbase Wallet
- 🔐 **OAuth 2.0** - Google, GitHub, Twitter integration
- 🔑 **API Keys** - For server-to-server authentication
- 🎫 **JWT Tokens** - Stateless authentication with expiration

### Security Features
- 🔒 **Bcrypt Hashing** - Industry-standard password security
- 🕐 **Token Expiration** - Configurable JWT TTL (default: 24h)
- 🔄 **Refresh Tokens** - Long-lived tokens for token renewal
- 🛡️ **RBAC** - Role-based access control (admin, user, guest)
- 📱 **MFA Support** - Multi-factor authentication ready
- 🚫 **Brute Force Protection** - Rate limiting built-in

### Session Management
- 👤 **User Profiles** - Store user metadata
- 📊 **Session Tracking** - Track active sessions
- 🔓 **Logout** - Invalidate tokens
- 🔍 **Permission Checking** - Granular permission system
- 📝 **Audit Logging** - Track auth events

### Developer Experience
- 🎨 **Type-Safe** - Full TypeScript support
- 📖 **Well Documented** - Comprehensive JSDoc
- 🐛 **Error Handling** - Clear error messages
- 🧪 **Test Friendly** - Easy to mock
- 🔧 **Flexible** - Bring your own database

---

## 📦 Installation

```bash
# npm
npm install @symbiosedb/auth

# yarn
yarn add @symbiosedb/auth

# pnpm
pnpm add @symbiosedb/auth
```

**Dependencies:**
- bcryptjs >= 2.4.3
- jsonwebtoken >= 9.0.2
- ethers >= 6.9.0 (for Web3 auth)
- uuid >= 9.0.1

---

## 🚀 Quick Start

### 1. Email/Password Authentication

```typescript
import { AuthManager } from '@symbiosedb/auth';

// Initialize auth manager
const auth = new AuthManager({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: '24h',
  bcryptRounds: 10
});

// Register new user
const user = await auth.register({
  email: 'alice@example.com',
  password: 'SecurePassword123!',
  name: 'Alice'
});

// Login
const session = await auth.login({
  email: 'alice@example.com',
  password: 'SecurePassword123!'
});

console.log(session.token); // JWT token
console.log(session.user);  // User object
console.log(session.expiresAt); // Expiration timestamp

// Verify token
const decoded = await auth.verifyToken(session.token);
console.log(decoded.userId); // 'alice-id'
console.log(decoded.email);  // 'alice@example.com'
```

### 2. Web3 Wallet Authentication

```typescript
import { Web3AuthProvider } from '@symbiosedb/auth';

const web3Auth = new Web3AuthProvider();

// User signs message with MetaMask
const message = web3Auth.generateMessage('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
// "Sign this message to authenticate: <timestamp>"

const signature = await ethereum.request({
  method: 'personal_sign',
  params: [message, '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb']
});

// Verify signature
const credentials = await web3Auth.authenticate({
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  signature,
  message
});

// Create session
const session = await auth.createSession(credentials);
```

### 3. OAuth Authentication

```typescript
import { OAuthProvider } from '@symbiosedb/auth';

const oauth = new OAuthProvider({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: 'https://myapp.com/auth/google/callback'
  }
});

// Redirect user to Google
const authUrl = oauth.getAuthorizationUrl('google');
res.redirect(authUrl);

// Handle callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  const credentials = await oauth.authenticate('google', { code });
  const session = await auth.createSession(credentials);

  res.json({ token: session.token });
});
```

---

## 🔧 Configuration

### AuthConfig

```typescript
interface AuthConfig {
  jwtSecret: string;              // Required: Secret for JWT signing
  jwtExpiration?: string;         // Optional: Token TTL (default: '24h')
  bcryptRounds?: number;          // Optional: Bcrypt rounds (default: 10)
  refreshTokenExpiration?: string; // Optional: Refresh token TTL (default: '7d')
  sessionTimeout?: number;        // Optional: Session timeout in ms
}
```

### OAuthConfig

```typescript
interface OAuthConfig {
  google?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  github?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  twitter?: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}
```

### Example: Production Configuration

```typescript
const auth = new AuthManager({
  jwtSecret: process.env.JWT_SECRET,  // ⚠️ Keep secret!
  jwtExpiration: '12h',               // Shorter expiration for security
  bcryptRounds: 12,                   // Higher rounds for production
  refreshTokenExpiration: '30d',      // Longer refresh token
  sessionTimeout: 3600000             // 1 hour session timeout
});
```

---

## 💡 Examples

### Example 1: Complete Registration Flow

```typescript
import { AuthManager, EmailAuthProvider } from '@symbiosedb/auth';

const auth = new AuthManager({ jwtSecret: process.env.JWT_SECRET });
const emailAuth = new EmailAuthProvider();

async function registerUser(data: {
  email: string;
  password: string;
  name: string;
}) {
  // Validate email format
  if (!emailAuth.validateEmail(data.email)) {
    throw new Error('Invalid email format');
  }

  // Validate password strength
  if (data.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if user exists
  const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [data.email]);
  if (existingUser.rows.length > 0) {
    throw new Error('Email already registered');
  }

  // Hash password
  const passwordHash = await emailAuth.hashPassword(data.password);

  // Create user in database
  const user = await db.query(`
    INSERT INTO users (email, password_hash, name, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING id, email, name
  `, [data.email, passwordHash, data.name]);

  // Create session
  const session = await auth.createSession({
    userId: user.rows[0].id,
    email: user.rows[0].email,
    provider: 'email'
  });

  // Send welcome email
  await sendWelcomeEmail(data.email);

  return {
    user: user.rows[0],
    token: session.token,
    expiresAt: session.expiresAt
  };
}
```

### Example 2: Protected API Endpoint

```typescript
import { AuthManager } from '@symbiosedb/auth';
import express from 'express';

const auth = new AuthManager({ jwtSecret: process.env.JWT_SECRET });
const app = express();

// Authentication middleware
async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = await auth.verifyToken(token);
    req.user = decoded; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Protected route
app.get('/api/profile', authenticate, async (req, res) => {
  const user = await db.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
  res.json(user.rows[0]);
});

// Admin-only route
app.delete('/api/users/:id', authenticate, async (req, res) => {
  if (!req.user.roles?.includes('admin')) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});
```

### Example 3: Web3 Wallet Integration

```typescript
import { Web3AuthProvider } from '@symbiosedb/auth';
import { ethers } from 'ethers';

const web3Auth = new Web3AuthProvider();

// Frontend: Connect wallet
async function connectWallet() {
  // Request account access
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  const address = accounts[0];

  // Generate message to sign
  const message = web3Auth.generateMessage(address);

  // Sign message
  const signature = await ethereum.request({
    method: 'personal_sign',
    params: [message, address]
  });

  // Send to backend
  const response = await fetch('/auth/web3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature, message })
  });

  const { token } = await response.json();
  localStorage.setItem('authToken', token);
}

// Backend: Verify signature
app.post('/auth/web3', async (req, res) => {
  const { address, signature, message } = req.body;

  try {
    const credentials = await web3Auth.authenticate({ address, signature, message });

    // Get or create user
    let user = await db.query('SELECT * FROM users WHERE wallet_address = $1', [address]);

    if (user.rows.length === 0) {
      // Create new user
      user = await db.query(`
        INSERT INTO users (wallet_address, auth_provider, created_at)
        VALUES ($1, 'web3', NOW())
        RETURNING *
      `, [address]);
    }

    // Create session
    const session = await auth.createSession({
      userId: user.rows[0].id,
      walletAddress: address,
      provider: 'web3'
    });

    res.json({ token: session.token });
  } catch (error) {
    res.status(401).json({ error: 'Invalid signature' });
  }
});
```

### Example 4: Refresh Token Flow

```typescript
import { AuthManager } from '@symbiosedb/auth';

const auth = new AuthManager({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: '15m',         // Short-lived access token
  refreshTokenExpiration: '7d'  // Long-lived refresh token
});

// Login returns both tokens
async function login(email: string, password: string) {
  const session = await auth.login({ email, password });

  return {
    accessToken: session.token,
    refreshToken: session.refreshToken, // Store securely (HttpOnly cookie)
    expiresAt: session.expiresAt
  };
}

// Refresh access token
app.post('/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  try {
    // Verify refresh token
    const decoded = await auth.verifyRefreshToken(refreshToken);

    // Generate new access token
    const newSession = await auth.createSession({
      userId: decoded.userId,
      email: decoded.email,
      provider: decoded.provider
    });

    res.json({
      accessToken: newSession.token,
      expiresAt: newSession.expiresAt
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### Example 5: Role-Based Access Control

```typescript
import { AuthManager } from '@symbiosedb/auth';

const auth = new AuthManager({ jwtSecret: process.env.JWT_SECRET });

// Define permissions
const permissions = {
  admin: ['read:all', 'write:all', 'delete:all'],
  user: ['read:own', 'write:own'],
  guest: ['read:public']
};

// Permission middleware
function requirePermission(permission: string) {
  return async (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');

    try {
      const decoded = await auth.verifyToken(token);
      const userPermissions = permissions[decoded.role] || [];

      if (!userPermissions.includes(permission)) {
        return res.status(403).json({ error: 'Permission denied' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}

// Protected routes with permissions
app.get('/api/users', requirePermission('read:all'), async (req, res) => {
  const users = await db.query('SELECT * FROM users');
  res.json(users.rows);
});

app.delete('/api/users/:id', requirePermission('delete:all'), async (req, res) => {
  await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});
```

---

## 📚 API Reference

### AuthManager

Main authentication manager class.

#### Constructor

```typescript
new AuthManager(config: AuthConfig)
```

#### Methods

##### `register(data: EmailCredentials & { name?: string }): Promise<User>`
Register new user with email/password.

##### `login(credentials: EmailCredentials): Promise<Session>`
Login with email/password. Returns session with JWT token.

##### `logout(token: string): Promise<void>`
Invalidate session token.

##### `verifyToken(token: string): Promise<DecodedToken>`
Verify JWT token and return decoded payload.

##### `verifyRefreshToken(token: string): Promise<DecodedToken>`
Verify refresh token.

##### `createSession(data: { userId, email?, provider }): Promise<Session>`
Create new session with JWT token.

##### `getUser(userId: string): Promise<User | null>`
Get user by ID.

##### `updateUser(userId: string, updates: Partial<User>): Promise<User>`
Update user profile.

### EmailAuthProvider

Email/password authentication provider.

#### Methods

##### `hashPassword(password: string): Promise<string>`
Hash password with bcrypt.

##### `verifyPassword(password: string, hash: string): Promise<boolean>`
Verify password against hash.

##### `validateEmail(email: string): boolean`
Validate email format.

### Web3AuthProvider

Web3 wallet authentication provider.

#### Methods

##### `generateMessage(address: string): string`
Generate message for user to sign.

##### `authenticate(credentials: Web3Credentials): Promise<AuthResult>`
Verify signature and return credentials.

##### `verifySignature(address: string, message: string, signature: string): Promise<boolean>`
Verify Ethereum signature.

### OAuthProvider

OAuth 2.0 authentication provider.

#### Methods

##### `getAuthorizationUrl(provider: 'google' | 'github' | 'twitter'): string`
Get OAuth authorization URL.

##### `authenticate(provider: string, { code }): Promise<AuthResult>`
Exchange authorization code for credentials.

---

## 🐛 Troubleshooting

### Issue 1: "JWT Secret Required" Error

**Problem:**
```
Error: JWT secret is required
```

**Solution:**
Set JWT_SECRET environment variable:

```bash
export JWT_SECRET="your-super-secret-key-min-32-characters"
```

### Issue 2: "Invalid Password" Error

**Problem:**
Login fails with correct password.

**Solution:**
Ensure password is hashed during registration:

```typescript
// ❌ Wrong - storing plain password
await db.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, password]);

// ✅ Correct - storing hashed password
const passwordHash = await emailAuth.hashPassword(password);
await db.query('INSERT INTO users (email, password_hash) VALUES ($1, $2)', [email, passwordHash]);
```

### Issue 3: "Token Expired" Error

**Problem:**
```
Error: jwt expired
```

**Solution:**
Implement refresh token flow:

```typescript
try {
  const decoded = await auth.verifyToken(accessToken);
} catch (error) {
  if (error.message === 'jwt expired') {
    // Refresh token
    const newToken = await auth.refreshToken(refreshToken);
    return newToken;
  }
  throw error;
}
```

### Issue 4: Web3 Signature Verification Fails

**Problem:**
Signature verification always fails.

**Solution:**
Ensure message matches exactly:

```typescript
// Frontend and backend must use same message
const message = web3Auth.generateMessage(address);

// ❌ Wrong - different messages
const frontendMessage = "Sign this: " + Date.now();
const backendMessage = "Sign this: " + savedTimestamp;

// ✅ Correct - same message
const message = web3Auth.generateMessage(address);
// Send message to backend for verification
```

---

## 🔗 Related Packages

- **[@symbiosedb/api](../api)** - REST API with built-in authentication
- **[@symbiosedb/sdk](../sdk)** - Client SDK
- **[@symbiosedb/core](../core)** - Core database connectors

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

## 📄 License

MIT © [SymbioseDB](https://github.com/symbiosedb/symbiosedb)

---

**Built with ❤️ by the SymbioseDB team**
