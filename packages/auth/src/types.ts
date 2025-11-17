/**
 * Authentication Types
 */

export interface User {
  id: string;
  email?: string;
  walletAddress?: string;
  name?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  metadata?: Record<string, any>;
}

export interface EmailCredentials {
  email: string;
  password: string;
}

export interface Web3Credentials {
  walletAddress: string;
  signature: string;
  message: string;
}

export interface OAuthCredentials {
  provider: 'google' | 'github';
  code: string;
  redirectUri?: string;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn?: string;
  bcryptRounds?: number;
}

export interface OAuthConfig extends AuthConfig {
  sessionDuration?: number; // Session duration in milliseconds
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
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface AuthResult {
  user: User;
  session: Session;
  token: string;
}
