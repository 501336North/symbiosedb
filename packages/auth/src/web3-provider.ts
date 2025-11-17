/**
 * Web3 Wallet Authentication Provider (TDD Implementation)
 * Supports MetaMask, WalletConnect, and any EIP-191 compliant wallet
 */

import { ethers } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import type { User, Web3Credentials, AuthConfig } from './types';

export class Web3AuthProvider {
  private users: Map<string, User> = new Map(); // Key: wallet address (lowercase)
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Generate a message to sign
   */
  generateMessage(walletAddress: string, nonce?: string): string {
    const nonceValue = nonce || uuidv4();
    return `Sign this message to authenticate with SymbioseDB\n\nWallet: ${walletAddress}\nNonce: ${nonceValue}\nTimestamp: ${Date.now()}`;
  }

  /**
   * Verify signature and recover signer address
   */
  private verifySignature(message: string, signature: string): string {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase();
    } catch (error) {
      throw new Error('Invalid signature');
    }
  }

  /**
   * Authenticate user with Web3 wallet signature
   */
  async authenticate(credentials: Web3Credentials): Promise<User> {
    const { walletAddress, signature, message } = credentials;

    // Verify signature
    const recoveredAddress = this.verifySignature(message, signature);

    // Check if recovered address matches claimed wallet address
    if (recoveredAddress !== walletAddress.toLowerCase()) {
      throw new Error('Signature verification failed');
    }

    // Check if message is recent (within 5 minutes)
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[1], 10);
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (now - timestamp > fiveMinutes) {
        throw new Error('Message expired. Please sign a new message');
      }
    }

    // Get or create user
    const normalizedAddress = walletAddress.toLowerCase();
    let user = this.users.get(normalizedAddress);

    if (!user) {
      // Create new user
      user = {
        id: uuidv4(),
        walletAddress: normalizedAddress,
        createdAt: new Date(),
        lastLoginAt: new Date(),
      };
      this.users.set(normalizedAddress, user);
    } else {
      // Update last login - create new object to ensure reference changes
      user = {
        ...user,
        lastLoginAt: new Date(),
      };
      this.users.set(normalizedAddress, user);
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
   * Get user by wallet address
   */
  getUserByWallet(walletAddress: string): User | undefined {
    return this.users.get(walletAddress.toLowerCase());
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.id === userId);
  }

  /**
   * Update user profile
   */
  updateUser(walletAddress: string, updates: Partial<User>): User {
    const user = this.users.get(walletAddress.toLowerCase());

    if (!user) {
      throw new Error('User not found');
    }

    // Update user (don't allow changing wallet address or ID)
    const updatedUser: User = {
      ...user,
      ...updates,
      id: user.id,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
    };

    this.users.set(walletAddress.toLowerCase(), updatedUser);

    return updatedUser;
  }

  /**
   * Delete user
   */
  deleteUser(walletAddress: string): boolean {
    return this.users.delete(walletAddress.toLowerCase());
  }

  /**
   * Check if wallet address is valid Ethereum address
   */
  static isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }
}
