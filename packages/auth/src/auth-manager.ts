/**
 * AuthManager - Coordinates all authentication methods
 * (TDD Implementation)
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { EmailAuthProvider } from './email-provider';
import { Web3AuthProvider } from './web3-provider';
import { OAuthProvider } from './oauth-provider';
import type {
  OAuthConfig,
  AuthResult,
  User,
  Session,
  EmailCredentials,
  Web3Credentials,
  OAuthCredentials,
} from './types';

export class AuthManager {
  private config: OAuthConfig;
  private sessions: Map<string, Session> = new Map();

  // Authentication providers
  public readonly email: EmailAuthProvider;
  public readonly web3: Web3AuthProvider;
  public readonly oauth: OAuthProvider;

  constructor(config: OAuthConfig) {
    this.config = {
      jwtExpiresIn: '24h',
      bcryptRounds: 10,
      sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };

    // Initialize providers
    this.email = new EmailAuthProvider(this.config);
    this.web3 = new Web3AuthProvider(this.config);
    this.oauth = new OAuthProvider(this.config);
  }

  /**
   * Register new user with email/password
   */
  async registerWithEmail(email: string, password: string, name?: string): Promise<AuthResult> {
    const user = await this.email.register(email, password, name);
    return await this.createSession(user);
  }

  /**
   * Login with email/password
   */
  async loginWithEmail(credentials: EmailCredentials): Promise<AuthResult> {
    const user = await this.email.authenticate(credentials);
    return await this.createSession(user);
  }

  /**
   * Login with Web3 wallet
   */
  async loginWithWallet(credentials: Web3Credentials): Promise<AuthResult> {
    const user = await this.web3.authenticate(credentials);
    return await this.createSession(user);
  }

  /**
   * Login with OAuth
   */
  async loginWithOAuth(credentials: OAuthCredentials): Promise<AuthResult> {
    const user = await this.oauth.authenticate(credentials);
    return await this.createSession(user);
  }

  /**
   * Create a new session for user
   */
  private async createSession(user: User): Promise<AuthResult> {
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      this.config.jwtSecret,
      { expiresIn: this.config.jwtExpiresIn || '24h' } as jwt.SignOptions
    );

    // Create session
    const session: Session = {
      id: uuidv4(),
      userId: user.id,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (this.config.sessionDuration || 24 * 60 * 60 * 1000)),
    };

    this.sessions.set(session.id, session);

    return {
      user,
      session,
      token,
    };
  }

  /**
   * Validate token and get user
   */
  async validateToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as { userId: string };

      // Try to find user in all providers
      let user: User | undefined;

      // Check email provider
      user = this.email.getUserById(decoded.userId);
      if (user) return user;

      // Check web3 provider
      user = this.web3.getUserById(decoded.userId);
      if (user) return user;

      // Check OAuth provider
      user = this.oauth.getUserById(decoded.userId);
      if (user) return user;

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    const session = this.sessions.get(sessionId);

    // Check if session is expired
    if (session && session.expiresAt < new Date()) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    return session;
  }

  /**
   * Logout user (destroy session)
   */
  logout(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Logout all sessions for a user
   */
  logoutAll(userId: string): number {
    let count = 0;
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }

  /**
   * Get all active sessions for a user
   */
  getUserSessions(userId: string): Session[] {
    const sessions: Session[] = [];
    const now = new Date();

    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.expiresAt > now) {
        sessions.push(session);
      }
    }

    return sessions;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    let count = 0;
    const now = new Date();

    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(sessionId);
        count++;
      }
    }

    return count;
  }

  /**
   * Get OAuth authorization URL
   */
  getOAuthUrl(provider: 'google' | 'github', state?: string): string {
    return this.oauth.getAuthorizationUrl(provider, state);
  }

  /**
   * Generate Web3 sign-in message
   */
  generateWeb3Message(walletAddress: string, nonce?: string): string {
    return this.web3.generateMessage(walletAddress, nonce);
  }
}
