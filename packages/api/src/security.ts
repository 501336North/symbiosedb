import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

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
 * Rate Limiter for Authentication Endpoints
 * 5 requests per 15 minutes (prevent brute force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
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

/**
 * Helmet Security Configuration
 * Configures various security headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * CORS Configuration
 * Configure allowed origins and methods
 * Security: Enforces origin header in production, allows localhost in development
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    // Development mode: Allow localhost origins
    const isProduction = process.env.NODE_ENV === 'production';
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
      'http://localhost:3000',
      'http://localhost:8080',
    ];

    // Production: Require origin header
    if (isProduction && !origin) {
      callback(new Error('Origin header is required in production'), false);
      return;
    }

    // Development: Allow requests without origin (e.g., curl, Postman)
    if (!isProduction && !origin) {
      callback(null, true);
      return;
    }

    // Check if origin is in whitelist
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

/**
 * Input Validation Middleware
 * Validates request body for common attacks
 */
export const validateInput = (
  req: Request,
  res: Response,
  next: Function
): void => {
  const body = JSON.stringify(req.body);

  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b.*(\b(FROM|INTO|WHERE|TABLE|DATABASE)\b))/gi,
    /(;|\-\-|\/\*|\*\/|xp_|sp_)/gi,
  ];

  // Check for XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(body)) {
      res.status(400).json({
        error: 'Invalid input detected',
        message: 'Potential SQL injection attempt blocked',
      });
      return;
    }
  }

  for (const pattern of xssPatterns) {
    if (pattern.test(body)) {
      res.status(400).json({
        error: 'Invalid input detected',
        message: 'Potential XSS attempt blocked',
      });
      return;
    }
  }

  next();
};

/**
 * Request Size Limiter
 * Limits request body size to prevent DoS
 */
export const requestSizeLimit = '10mb'; // Configurable via env

/**
 * Security Headers Middleware
 * Adds additional security headers
 */
export const securityHeaders = (
  req: Request,
  res: Response,
  next: Function
): void => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};

// ===============================
// CSRF Protection Implementation
// ===============================

/**
 * Generate a cryptographically secure CSRF token
 */
export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate CSRF token using constant-time comparison
 */
export const validateCSRFToken = (token1?: string, token2?: string): boolean => {
  if (!token1 || !token2) {
    return false;
  }

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token1),
      Buffer.from(token2)
    );
  } catch {
    // Tokens are different lengths or invalid
    return false;
  }
};

/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern
 */
export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip CSRF check for safe methods
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    // Generate new token for GET requests if not present
    if (!req.cookies?.['csrf-token']) {
      const newToken = generateCSRFToken();
      res.cookie('csrf-token', newToken, {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 4 * 60 * 60 * 1000 // 4 hours
      });
      // Make token available to views (if locals exists)
      if (res.locals) {
        res.locals.csrfToken = newToken;
      }
    }
    return next();
  }

  // For state-changing methods, validate CSRF token
  const cookieToken = req.cookies?.['csrf-token'];
  const headerToken = req.headers['x-csrf-token'] as string;
  const bodyToken = req.body?._csrf;

  // Token must be present in cookie
  if (!cookieToken) {
    res.status(403).json({
      error: 'CSRF validation failed: No CSRF cookie present'
    });
    return;
  }

  // Token must be present in header or body
  const submittedToken = headerToken || bodyToken;
  if (!submittedToken) {
    res.status(403).json({
      error: 'CSRF validation failed: No CSRF token in request'
    });
    return;
  }

  // Validate token matches (double-submit pattern)
  if (!validateCSRFToken(cookieToken, submittedToken)) {
    res.status(403).json({
      error: 'Invalid CSRF token'
    });
    return;
  }

  // Token is valid, proceed
  next();
};

/**
 * CSRF Token Endpoint Middleware
 * Provides CSRF token to client for inclusion in forms/AJAX
 */
export const csrfTokenEndpoint = (
  req: Request,
  res: Response
): void => {
  const token = generateCSRFToken();

  // Set cookie with token
  res.cookie('csrf-token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 4 * 60 * 60 * 1000 // 4 hours
  });

  // Return token for client to include in requests
  res.json({ csrfToken: token });
};
