import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

// Security: Validate JWT_SECRET with enhanced security
const JWT_SECRET = process.env.JWT_SECRET;

// Production requires JWT_SECRET with no fallback
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Enhanced minimum length requirement (64 chars)
if (JWT_SECRET && JWT_SECRET.length < 64) {
  throw new Error('JWT_SECRET must be at least 64 characters long for production security');
}

// Check for sufficient entropy (prevent weak secrets)
if (JWT_SECRET) {
  // Check for repeated characters
  const uniqueChars = new Set(JWT_SECRET).size;
  if (uniqueChars < JWT_SECRET.length / 3) {
    throw new Error('JWT_SECRET has insufficient entropy. Use a cryptographically secure random value.');
  }

  // Check for common patterns
  const commonPatterns = [
    /^a+$/,
    /^(abc)+$/,
    /^(123)+$/,
    /^qwerty/,
    /^asdfgh/,
    /^password/,
    /^secret/
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(JWT_SECRET.toLowerCase())) {
      throw new Error('JWT_SECRET has insufficient entropy. Use a cryptographically secure random value.');
    }
  }
}

// For development/test only, generate a secure random secret
const SECURE_JWT_SECRET = JWT_SECRET ||
  (process.env.NODE_ENV !== 'production'
    ? crypto.randomBytes(32).toString('hex') + crypto.randomBytes(32).toString('hex')
    : '');

if (!SECURE_JWT_SECRET) {
  throw new Error('Failed to initialize JWT secret');
}

// Security: API Keys stored in memory (loaded from environment only)
const API_KEYS = new Map<string, { name: string; permissions: string[] }>();

// Load API keys from environment variable only (no hardcoded keys)
// Format: API_KEY_1=key1:name1:read,write|API_KEY_2=key2:name2:admin
if (process.env.API_KEYS) {
  const keys = process.env.API_KEYS.split('|');
  keys.forEach(keyConfig => {
    const [key, name, perms] = keyConfig.split(':');
    if (key && name && perms) {
      API_KEYS.set(key, {
        name,
        permissions: perms.split(','),
      });
    }
  });
}

// Log warning in development if no API keys are configured
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && API_KEYS.size === 0) {
  console.warn('WARNING: No API keys configured. Set API_KEYS environment variable.');
}

export interface AuthUser {
  id: string;
  email: string;
  permissions: string[];
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  apiKey?: string;
}

/**
 * JWT Authentication Middleware
 * Validates JWT tokens from Authorization header
 */
export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'No authorization header' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Security Fix (CVSS 5.3): Explicitly specify algorithm to prevent confusion attacks
    const decoded = jwt.verify(token, SECURE_JWT_SECRET, { algorithms: ['HS256'] }) as AuthUser;

    // Validate required claims are present
    if (!decoded.id || !decoded.email || !decoded.permissions) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    // Validate permissions is an array
    if (!Array.isArray(decoded.permissions)) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }

    // Create defensive copy to prevent permission array mutation
    (req as AuthRequest).user = {
      ...decoded,
      permissions: [...decoded.permissions]
    };
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * API Key Authentication Middleware
 * Validates API keys from X-API-Key header
 */
export const authenticateAPIKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    res.status(401).json({ error: 'No API key provided' });
    return;
  }

  const keyData = API_KEYS.get(apiKey);

  if (!keyData) {
    res.status(403).json({ error: 'Invalid API key' });
    return;
  }

  (req as AuthRequest).apiKey = apiKey;
  (req as AuthRequest).user = {
    id: apiKey,
    email: keyData.name,
    permissions: keyData.permissions,
  };

  next();
};

/**
 * Flexible Authentication Middleware
 * Tries API key first, then JWT, then fails if neither is valid
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;

  // Try API key first
  if (apiKey) {
    const keyData = API_KEYS.get(apiKey);
    if (keyData) {
      (req as AuthRequest).apiKey = apiKey;
      (req as AuthRequest).user = {
        id: apiKey,
        email: keyData.name,
        permissions: keyData.permissions,
      };
      next();
      return;
    } else {
      res.status(403).json({ error: 'Invalid API key' });
      return;
    }
  }

  // Then try JWT
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      // Security Fix (CVSS 5.3): Explicitly specify algorithm to prevent confusion attacks
      const decoded = jwt.verify(token, SECURE_JWT_SECRET, { algorithms: ['HS256'] }) as AuthUser;
      (req as AuthRequest).user = decoded;
      next();
      return;
    } catch (error) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
  }

  // No valid authentication
  res.status(401).json({ error: 'No authorization header' });
};

/**
 * Optional Authentication Middleware
 * Tries JWT first, then API key, then allows through without auth
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'] as string;

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      // Security Fix (CVSS 5.3): Explicitly specify algorithm to prevent confusion attacks
      const decoded = jwt.verify(token, SECURE_JWT_SECRET, { algorithms: ['HS256'] }) as AuthUser;
      (req as AuthRequest).user = decoded;
    } catch (error) {
      // Invalid token, but continue anyway (optional auth)
    }
  } else if (apiKey) {
    const keyData = API_KEYS.get(apiKey);
    if (keyData) {
      (req as AuthRequest).apiKey = apiKey;
      (req as AuthRequest).user = {
        id: apiKey,
        email: keyData.name,
        permissions: keyData.permissions,
      };
    }
  }

  next();
};

/**
 * Permission Check Middleware Factory
 * Creates middleware that checks if user has specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!authReq.user.permissions.includes(permission) &&
        !authReq.user.permissions.includes('admin')) {
      res.status(403).json({ error: `Permission '${permission}' required` });
      return;
    }

    next();
  };
};

/**
 * Generate JWT Token
 */
export const generateToken = (user: AuthUser): string => {
  // Security Fix (CVSS 5.3): Explicitly specify algorithm to prevent confusion attacks
  return jwt.sign(user, SECURE_JWT_SECRET, {
    expiresIn: '24h',
    algorithm: 'HS256',
  });
};

// Security Fix: Increased bcrypt rounds from 10 to 12
const BCRYPT_ROUNDS = 12;

/**
 * Hash Password with enhanced security
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

/**
 * Verify Password
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Add API Key (for admin use)
 */
export const addAPIKey = (
  key: string,
  name: string,
  permissions: string[]
): void => {
  API_KEYS.set(key, { name, permissions });
};

/**
 * Remove API Key (for admin use)
 */
export const removeAPIKey = (key: string): boolean => {
  return API_KEYS.delete(key);
};

/**
 * List API Keys (for admin use)
 */
export const listAPIKeys = (): Array<{
  key: string;
  name: string;
  permissions: string[];
}> => {
  return Array.from(API_KEYS.entries()).map(([key, data]) => ({
    key,
    ...data,
  }));
};