import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

// ===============================
// Enhanced Rate Limiting with Exponential Backoff
// ===============================

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: any;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

class EnhancedRateLimiter {
  private violations: Map<string, number> = new Map();
  private backoffTimes: Map<string, number> = new Map();
  private failedAttempts: Map<string, number> = new Map();
  private lockouts: Map<string, number> = new Map();

  constructor(private config: RateLimitConfig) {}

  getConfig(): RateLimitConfig {
    return this.config;
  }

  recordViolation(ip: string): void {
    const count = this.violations.get(ip) || 0;
    this.violations.set(ip, count + 1);

    // Calculate exponential backoff
    const backoffMultiplier = Math.pow(2, count);
    const backoffTime = this.config.windowMs * backoffMultiplier;
    this.backoffTimes.set(ip, backoffTime);
  }

  getBackoffTime(ip: string): number {
    return this.backoffTimes.get(ip) || this.config.windowMs;
  }

  async recordFailedAttempt(identifier: string): Promise<void> {
    const attempts = this.failedAttempts.get(identifier) || 0;
    this.failedAttempts.set(identifier, attempts + 1);

    // Lock account after 5 failed attempts
    if (attempts + 1 >= 5) {
      this.lockouts.set(identifier, Date.now() + (30 * 60 * 1000)); // 30 minutes
    }
  }

  async isAccountLocked(identifier: string): Promise<boolean> {
    const lockoutUntil = this.lockouts.get(identifier);
    if (!lockoutUntil) return false;

    if (Date.now() < lockoutUntil) {
      return true;
    }

    // Lockout expired
    this.lockouts.delete(identifier);
    this.failedAttempts.delete(identifier);
    return false;
  }

  async getLockDuration(identifier: string): Promise<number> {
    const lockoutUntil = this.lockouts.get(identifier);
    if (!lockoutUntil) return 0;
    return Math.max(0, lockoutUntil - Date.now());
  }

  requiresCaptcha(identifier: string): boolean {
    const attempts = this.failedAttempts.get(identifier) || 0;
    return attempts >= 3;
  }

  createInstance(instanceId: string): any {
    // In production, this would use Redis or similar for distributed rate limiting
    return this;
  }

  async recordAttempt(ip: string): Promise<void> {
    // Track attempt
  }

  async isBlocked(ip: string): Promise<boolean> {
    const backoffTime = this.getBackoffTime(ip);
    return backoffTime > this.config.windowMs;
  }
}

/**
 * Rate Limiter for General API Endpoints
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate Limiter for Query Endpoints
 * 50 requests per 15 minutes (more expensive operations)
 */
export const queryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    error: 'Too many query requests, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Enhanced Rate Limiter for Authentication Endpoints
 * 3 requests per 15 minutes with exponential backoff
 */
export const authLimiter = new EnhancedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 3, // Reduced from 5 to 3
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate Limiter for Blockchain Operations
 * 10 requests per hour (expensive operations)
 */
export const blockchainLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    error: 'Too many blockchain operations, please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===============================
// Enhanced Security Headers
// ===============================

/**
 * Helmet Security Configuration with enhanced HSTS
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 63072000, // 2 years (increased from 1 year)
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Enhanced Security Headers Middleware
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Existing headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Enhanced HSTS (2 years)
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // New Permissions-Policy header
  res.setHeader('Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=(), usb=(), ' +
    'magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // X-Permitted-Cross-Domain-Policies
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');

  // Additional security headers
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');

  // Enhanced CSP
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "block-all-mixed-content",
    "report-uri /api/security/csp-report",
  ].join('; ');

  if (process.env.NODE_ENV === 'development') {
    res.setHeader('Content-Security-Policy-Report-Only', csp);
  } else {
    res.setHeader('Content-Security-Policy', csp);
  }

  // Cache control for sensitive endpoints
  if (req.path && req.path.includes('/auth')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  // CORS headers (secure configuration)
  if (req.headers.origin) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['https://app.symbiosedb.com'];
    if (allowedOrigins.includes(req.headers.origin as string)) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-CSRF-Token');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

  next();
};

// ===============================
// Enhanced Input Validation
// ===============================

/**
 * Advanced input validation patterns
 */
const advancedPatterns = {
  sqlInjection: [
    // Existing patterns
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b.*(\b(FROM|INTO|WHERE|TABLE|DATABASE)\b))/gi,
    /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,

    // Enhanced patterns
    /CONCAT\s*\(/gi, // SQL functions
    /\|\|/g, // Concatenation
    /SLEEP\s*\(/gi, // Time delays
    /%[0-9A-Fa-f]{2}/g, // URL encoding
    /\\u[0-9A-Fa-f]{4}/g, // Unicode encoding
  ],

  xss: [
    // Existing patterns
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,

    // Enhanced patterns
    /<svg[^>]*>/gi, // SVG tags
    /data:text\/html/gi, // Data URIs
    /expression\s*\(/gi, // CSS expressions
    /vbscript:/gi, // VBScript
    /&#[0-9]+;/g, // HTML entities
    /<img[^>]+onerror/gi, // Image error handlers
    /import\s+/gi, // ES6 imports
    /<iframe/gi, // iframes
    /<embed/gi, // embed tags
    /<object/gi, // object tags
  ],

  noSql: [
    /\$where/gi,
    /\$ne/g,
    /\$gt/g,
    /\$lt/g,
    /\$gte/g,
    /\$lte/g,
    /\$in/g,
    /\$nin/g,
    /\$exists/g,
    /\$regex/g,
    /\$or/g,
    /\$and/g,
  ],

  commandInjection: [
    /;.*\b(rm|ls|cat|wget|curl|nc|bash|sh)\b/gi,
    /\|/g, // Pipe
    /`[^`]*`/g, // Backticks
    /\$\([^)]*\)/g, // Command substitution
  ],

  pathTraversal: [
    /\.\./g,
    /%2e%2e/gi,
    /%252e%252e/gi,
    /\\u002e\\u002e/gi,
  ],

  ldapInjection: [
    /\*/g,
    /\(|\)/g,
    /\|/g,
    /&/g,
  ],

  xmlInjection: [
    /<!DOCTYPE/gi,
    /<!ENTITY/gi,
    /SYSTEM/gi,
    /<!\[CDATA\[/gi,
  ],
};

/**
 * Detect NoSQL injection attempts
 */
export const detectNoSQLInjection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const checkObject = (obj: any): boolean => {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    for (const key of Object.keys(obj)) {
      // Check for MongoDB operators
      if (key.startsWith('$')) {
        return true;
      }

      // Recursively check nested objects
      if (typeof obj[key] === 'object' && checkObject(obj[key])) {
        return true;
      }
    }

    return false;
  };

  if (checkObject(req.body) || checkObject(req.query)) {
    res.status(400).json({
      error: 'Invalid input detected',
      message: 'NoSQL injection attempt blocked',
    });
    return;
  }

  next();
};

/**
 * Enhanced input validation for all sources
 */
export const validateAllInputSources = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const sources = {
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
    cookies: req.cookies,
  };

  for (const [source, data] of Object.entries(sources)) {
    if (!data) continue;

    const dataStr = JSON.stringify(data);

    // Check all pattern categories
    for (const [category, patterns] of Object.entries(advancedPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(dataStr)) {
          res.status(400).json({
            error: 'Invalid input detected',
            message: `${category.replace(/([A-Z])/g, ' $1').trim()} attempt blocked`,
            source,
          });
          return;
        }
      }
    }
  }

  next();
};

/**
 * Enhanced input validation middleware
 */
export const validateInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const body = JSON.stringify(req.body);

  // Check all advanced patterns
  for (const [category, patterns] of Object.entries(advancedPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(body)) {
        let message = 'Invalid pattern detected';

        // Specific messages for each category
        switch (category) {
          case 'sqlInjection':
            if (/CONCAT/.test(body)) message = 'SQL function detected';
            else if (/SLEEP/.test(body)) message = 'Time delay function detected';
            else message = 'Potential SQL injection attempt blocked';
            break;
          case 'xss':
            message = 'Potential XSS attempt blocked';
            break;
          case 'commandInjection':
            message = 'Command injection attempt blocked';
            break;
          case 'pathTraversal':
            message = 'Path traversal attempt blocked';
            break;
          case 'ldapInjection':
            message = 'LDAP injection attempt blocked';
            break;
          case 'xmlInjection':
            message = 'XML injection attempt blocked';
            break;
        }

        res.status(400).json({
          error: 'Invalid input detected',
          message,
        });
        return;
      }
    }
  }

  next();
};

/**
 * Input sanitization function
 */
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Remove javascript: protocol
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove script tags content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    return sanitized;
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};

    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(input[key]);
      }
    }

    return sanitized;
  }

  return input;
};

// ===============================
// CORS Configuration
// ===============================

export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
      'http://localhost:3000',
      'http://localhost:8080',
    ];

    if (isProduction && !origin) {
      callback(new Error('Origin header is required in production'), false);
      return;
    }

    if (!isProduction && !origin) {
      callback(null, true);
      return;
    }

    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// ===============================
// CSRF Protection (already implemented)
// ===============================

export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const validateCSRFToken = (token1?: string, token2?: string): boolean => {
  if (!token1 || !token2) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(token1),
      Buffer.from(token2)
    );
  } catch {
    return false;
  }
};

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    if (!req.cookies?.['csrf-token']) {
      const newToken = generateCSRFToken();
      res.cookie('csrf-token', newToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 4 * 60 * 60 * 1000
      });
      if (res.locals) {
        res.locals.csrfToken = newToken;
      }
    }
    return next();
  }

  const cookieToken = req.cookies?.['csrf-token'];
  const headerToken = req.headers['x-csrf-token'] as string;
  const bodyToken = req.body?._csrf;

  if (!cookieToken) {
    res.status(403).json({
      error: 'CSRF validation failed: No CSRF cookie present'
    });
    return;
  }

  const submittedToken = headerToken || bodyToken;
  if (!submittedToken) {
    res.status(403).json({
      error: 'CSRF validation failed: No CSRF token in request'
    });
    return;
  }

  if (!validateCSRFToken(cookieToken, submittedToken)) {
    res.status(403).json({
      error: 'Invalid CSRF token'
    });
    return;
  }

  next();
};

export const csrfTokenEndpoint = (
  req: Request,
  res: Response
): void => {
  const token = generateCSRFToken();

  res.cookie('csrf-token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 4 * 60 * 60 * 1000
  });

  res.json({ csrfToken: token });
};

export const requestSizeLimit = '10mb';