/**
 * OAuth Authentication Provider (TDD Implementation)
 * Supports Google and GitHub OAuth
 */

import { v4 as uuidv4 } from 'uuid';
import type { User, OAuthCredentials, OAuthConfig } from './types';

export class OAuthProvider {
  private users: Map<string, User> = new Map(); // Key: email
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthorizationUrl(provider: 'google' | 'github', state?: string): string {
    const stateParam = state || uuidv4();

    if (provider === 'google') {
      if (!this.config.google) {
        throw new Error('Google OAuth not configured');
      }

      const params = new URLSearchParams({
        client_id: this.config.google.clientId,
        redirect_uri: this.config.google.redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state: stateParam,
      });

      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }

    if (provider === 'github') {
      if (!this.config.github) {
        throw new Error('GitHub OAuth not configured');
      }

      const params = new URLSearchParams({
        client_id: this.config.github.clientId,
        redirect_uri: this.config.github.redirectUri,
        scope: 'read:user user:email',
        state: stateParam,
      });

      return `https://github.com/login/oauth/authorize?${params.toString()}`;
    }

    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  /**
   * Authenticate with OAuth code
   */
  async authenticate(credentials: OAuthCredentials): Promise<User> {
    const { provider, code } = credentials;

    if (provider === 'google') {
      return await this.authenticateGoogle(code);
    }

    if (provider === 'github') {
      return await this.authenticateGitHub(code);
    }

    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  /**
   * Google OAuth authentication
   */
  private async authenticateGoogle(code: string): Promise<User> {
    if (!this.config.google) {
      throw new Error('Google OAuth not configured');
    }

    // Mock implementation for testing
    // In real implementation, exchange code for access token and get user info
    const mockUserInfo = {
      email: 'user@gmail.com',
      name: 'Google User',
      picture: 'https://via.placeholder.com/150',
    };

    // Get or create user
    let user = this.users.get(mockUserInfo.email);

    if (!user) {
      user = {
        id: uuidv4(),
        email: mockUserInfo.email,
        name: mockUserInfo.name,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        metadata: {
          provider: 'google',
          picture: mockUserInfo.picture,
        },
      };
      this.users.set(mockUserInfo.email, user);
    } else {
      // Update last login
      user = {
        ...user,
        lastLoginAt: new Date(),
      };
      this.users.set(mockUserInfo.email, user);
    }

    return user;
  }

  /**
   * GitHub OAuth authentication
   */
  private async authenticateGitHub(code: string): Promise<User> {
    if (!this.config.github) {
      throw new Error('GitHub OAuth not configured');
    }

    // Mock implementation for testing
    // In real implementation, exchange code for access token and get user info
    const mockUserInfo = {
      email: 'user@github.com',
      name: 'GitHub User',
      avatar_url: 'https://via.placeholder.com/150',
      login: 'githubuser',
    };

    // Get or create user
    let user = this.users.get(mockUserInfo.email);

    if (!user) {
      user = {
        id: uuidv4(),
        email: mockUserInfo.email,
        name: mockUserInfo.name,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        metadata: {
          provider: 'github',
          avatar: mockUserInfo.avatar_url,
          username: mockUserInfo.login,
        },
      };
      this.users.set(mockUserInfo.email, user);
    } else {
      // Update last login
      user = {
        ...user,
        lastLoginAt: new Date(),
      };
      this.users.set(mockUserInfo.email, user);
    }

    return user;
  }

  /**
   * Validate JWT token
   */
  async validate(token: string): Promise<User | null> {
    try {
      const jwt = await import('jsonwebtoken');
      const decoded = jwt.verify(token, this.config.jwtSecret) as { userId: string };

      // Find user by ID
      const user = Array.from(this.users.values()).find(u => u.id === decoded.userId);
      return user || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | undefined {
    return this.users.get(email);
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.id === userId);
  }

  /**
   * Delete user
   */
  deleteUser(email: string): boolean {
    return this.users.delete(email);
  }
}
