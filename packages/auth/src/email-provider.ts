/**
 * Email/Password Authentication Provider (TDD Implementation)
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import type { User, EmailCredentials, AuthConfig } from './types';

export class EmailAuthProvider {
  private users: Map<string, { user: User; passwordHash: string }> = new Map();
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = {
      bcryptRounds: 10,
      jwtExpiresIn: '24h',
      ...config,
    };
  }

  /**
   * Register a new user
   */
  async register(email: string, password: string, name?: string): Promise<User> {
    // Check if user exists
    const existing = Array.from(this.users.values()).find(u => u.user.email === email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.config.bcryptRounds!);

    // Create user
    const user: User = {
      id: uuidv4(),
      email,
      name,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };

    // Store
    this.users.set(user.id, { user, passwordHash });

    return user;
  }

  /**
   * Authenticate user
   */
  async authenticate(credentials: EmailCredentials): Promise<User> {
    // Find user
    const entry = Array.from(this.users.values()).find(
      u => u.user.email === credentials.email
    );

    if (!entry) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const valid = await bcrypt.compare(credentials.password, entry.passwordHash);

    if (!valid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    entry.user.lastLoginAt = new Date();

    return entry.user;
  }

  /**
   * Validate JWT token
   */
  async validate(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as { userId: string };
      const entry = this.users.get(decoded.userId);
      return entry?.user || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Update password
   */
  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const entry = this.users.get(userId);

    if (!entry) {
      throw new Error('User not found');
    }

    // Verify old password
    const valid = await bcrypt.compare(oldPassword, entry.passwordHash);

    if (!valid) {
      throw new Error('Invalid old password');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, this.config.bcryptRounds!);

    // Update
    entry.passwordHash = newPasswordHash;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | undefined {
    const entry = Array.from(this.users.values()).find(u => u.user.email === email);
    return entry?.user;
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | undefined {
    return this.users.get(userId)?.user;
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): boolean {
    return this.users.delete(userId);
  }
}
