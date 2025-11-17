/**
 * RealtimeServer - WebSocket server with pub/sub, presence, and live queries
 * (In-memory implementation for testing - production would use actual WebSocket server)
 */

import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import type {
  IRealtimeServer,
  RealtimeConfig,
  SubscriptionCallback,
  PresenceData,
  QuerySubscription,
  ChannelStats,
  ClientInfo,
  AuthResult,
  ApiKeyConfig,
} from './types';

export class RealtimeServer implements IRealtimeServer {
  private config: RealtimeConfig;
  private isRunning: boolean = false;

  // Pub/Sub
  private subscriptions: Map<string, Map<string, SubscriptionCallback>>; // channel -> subscriptionId -> callback

  // Presence
  private presence: Map<string, Map<string, PresenceData>>; // channel -> clientId -> presence

  // Query subscriptions
  private querySubscriptions: Map<string, QuerySubscription>; // subscriptionId -> subscription

  // Stats
  private channelStats: Map<string, ChannelStats>; // channel -> stats
  private clients: Map<string, ClientInfo>; // clientId -> info

  // Security
  private apiKeys: Map<string, ApiKeyConfig> = new Map();
  private connectionsByIp: Map<string, Set<string>> = new Map(); // ip -> Set<clientId>
  private messageRateLimits: Map<string, { count: number; resetAt: number }> = new Map();

  constructor(config: RealtimeConfig = {}) {
    this.config = {
      port: config.port || 8080,
      host: config.host || '0.0.0.0',
      pingInterval: config.pingInterval || 30000,
      presenceTimeout: config.presenceTimeout || 60000,
      requireAuth: config.requireAuth !== undefined ? config.requireAuth : false,
      jwtSecret: config.jwtSecret,
      rateLimit: config.rateLimit,
    };

    this.subscriptions = new Map();
    this.presence = new Map();
    this.querySubscriptions = new Map();
    this.channelStats = new Map();
    this.clients = new Map();
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      return; // Already running
    }

    // In production, this would start a WebSocket server
    // For testing, we just mark as running
    this.isRunning = true;
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return; // Already stopped
    }

    // Clear all data
    this.subscriptions.clear();
    this.presence.clear();
    this.querySubscriptions.clear();
    this.channelStats.clear();
    this.clients.clear();

    this.isRunning = false;
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, data: any): Promise<number> {
    const channelSubs = this.subscriptions.get(channel);

    if (!channelSubs || channelSubs.size === 0) {
      return 0;
    }

    // Update channel stats
    this.updateChannelStats(channel, channelSubs.size);
    this.incrementMessageCount(channel);

    // Call all subscribers
    const promises: Promise<void>[] = [];

    for (const callback of channelSubs.values()) {
      const result = callback(data, undefined);
      if (result instanceof Promise) {
        promises.push(result);
      }
    }

    // Wait for all async callbacks
    await Promise.all(promises);

    return channelSubs.size;
  }

  /**
   * Subscribe to channel
   */
  subscribe(channel: string, callback: SubscriptionCallback): () => void {
    const subscriptionId = uuidv4();

    // Get or create channel subscriptions
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Map());
      this.initializeChannelStats(channel);
    }

    const channelSubs = this.subscriptions.get(channel)!;
    channelSubs.set(subscriptionId, callback);

    // Update stats
    this.updateChannelStats(channel, channelSubs.size);

    // Return unsubscribe function
    return () => {
      const channelSubs = this.subscriptions.get(channel);
      if (channelSubs) {
        channelSubs.delete(subscriptionId);

        // Update stats
        this.updateChannelStats(channel, channelSubs.size);

        // Clean up empty channel
        if (channelSubs.size === 0) {
          this.subscriptions.delete(channel);
        }
      }
    };
  }

  /**
   * Update presence for client in channel
   */
  updatePresence(clientId: string, channel: string, data: any): void {
    // Get or create channel presence
    if (!this.presence.has(channel)) {
      this.presence.set(channel, new Map());
    }

    const channelPresence = this.presence.get(channel)!;
    const existing = channelPresence.get(clientId);

    const presenceData: PresenceData = {
      clientId,
      data,
      joinedAt: existing?.joinedAt || Date.now(),
      lastSeenAt: Date.now(),
    };

    channelPresence.set(clientId, presenceData);
  }

  /**
   * Get presence for channel
   */
  getPresence(channel: string): PresenceData[] {
    const channelPresence = this.presence.get(channel);

    if (!channelPresence) {
      return [];
    }

    return Array.from(channelPresence.values());
  }

  /**
   * Subscribe to query
   */
  subscribeToQuery(clientId: string, query: string, params?: any[]): string {
    const subscriptionId = uuidv4();

    const subscription: QuerySubscription = {
      id: subscriptionId,
      query,
      params,
      clientId,
    };

    this.querySubscriptions.set(subscriptionId, subscription);

    return subscriptionId;
  }

  /**
   * Unsubscribe from query
   */
  unsubscribeFromQuery(subscriptionId: string): void {
    this.querySubscriptions.delete(subscriptionId);
  }

  /**
   * Notify query update
   */
  async notifyQueryUpdate(query: string, result: any): Promise<void> {
    // Find all subscriptions matching this query
    const matchingSubs: QuerySubscription[] = [];

    for (const sub of this.querySubscriptions.values()) {
      if (sub.query === query) {
        matchingSubs.push(sub);
      }
    }

    // Publish to query_update channel for each matching subscription
    for (const sub of matchingSubs) {
      await this.publish('query_update', {
        subscriptionId: sub.id,
        query: sub.query,
        result,
      });
    }
  }

  /**
   * Get channel statistics
   */
  getChannelStats(channel?: string): ChannelStats[] {
    if (channel) {
      const stats = this.channelStats.get(channel);
      return stats ? [stats] : [];
    }

    return Array.from(this.channelStats.values());
  }

  /**
   * Get client information
   */
  getClientInfo(clientId?: string): ClientInfo[] {
    if (clientId) {
      const client = this.clients.get(clientId);
      return client ? [client] : [];
    }

    return Array.from(this.clients.values());
  }

  /**
   * Get number of active connections
   */
  getActiveConnections(): number {
    return this.clients.size;
  }

  /**
   * Initialize channel stats
   */
  private initializeChannelStats(channel: string): void {
    if (!this.channelStats.has(channel)) {
      this.channelStats.set(channel, {
        channel,
        subscriberCount: 0,
        messageCount: 0,
        createdAt: Date.now(),
      });
    }
  }

  /**
   * Update channel stats
   */
  private updateChannelStats(channel: string, subscriberCount: number): void {
    const stats = this.channelStats.get(channel);

    if (stats) {
      stats.subscriberCount = subscriberCount;
    }
  }

  /**
   * Increment message count for channel
   */
  private incrementMessageCount(channel: string): void {
    const stats = this.channelStats.get(channel);

    if (stats) {
      stats.messageCount++;
      stats.lastMessageAt = Date.now();
    }
  }

  // ==========================================
  // Security Methods
  // ==========================================

  /**
   * Authenticate a connection
   */
  async authenticateConnection(token: string): Promise<AuthResult> {
    if (!this.config.jwtSecret) {
      return {
        success: false,
        error: 'JWT secret not configured',
      };
    }

    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as any;

      // Check if token is expired
      if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
        return {
          success: false,
          error: 'Authentication token expired',
        };
      }

      return {
        success: true,
        userId: decoded.id,
        permissions: decoded.permissions || [],
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid authentication token',
      };
    }
  }

  /**
   * Handle new connection
   */
  async handleConnection(client: { id: string; auth?: string; apiKey?: string; ip?: string }): Promise<boolean> {
    if (this.config.requireAuth) {
      // Try JWT authentication first
      if (client.auth) {
        const authResult = await this.authenticateConnection(client.auth);
        if (!authResult.success) {
          throw new Error(authResult.error || 'Authentication failed');
        }

        // Check rate limit for IP
        if (client.ip && this.config.rateLimit) {
          const connectionsForIp = this.connectionsByIp.get(client.ip) || new Set();
          if (connectionsForIp.size >= this.config.rateLimit.maxConnections) {
            throw new Error('Rate limit exceeded: Too many connections from this IP');
          }
          connectionsForIp.add(client.id);
          this.connectionsByIp.set(client.ip, connectionsForIp);
        }

        // Store client info with permissions
        const clientInfo: ClientInfo = {
          id: client.id,
          connectedAt: Date.now(),
          lastMessageAt: Date.now(),
          subscriptions: [],
          permissions: authResult.permissions,
          ip: client.ip,
        };
        this.clients.set(client.id, clientInfo);

        return true;
      }

      // Try API key authentication
      if (client.apiKey) {
        const apiKeyConfig = this.apiKeys.get(client.apiKey);
        if (!apiKeyConfig) {
          throw new Error('Invalid API key');
        }

        // Store client info with permissions from API key
        const clientInfo: ClientInfo = {
          id: client.id,
          connectedAt: Date.now(),
          lastMessageAt: Date.now(),
          subscriptions: [],
          permissions: apiKeyConfig.permissions,
          ip: client.ip,
        };
        this.clients.set(client.id, clientInfo);

        return true;
      }

      throw new Error('Authentication required for WebSocket connection');
    }

    return true;
  }

  /**
   * Add API key
   */
  addApiKey(key: string, config: ApiKeyConfig): void {
    this.apiKeys.set(key, config);
  }

  /**
   * Check channel permission
   */
  checkChannelPermission(clientId: string, channel: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false;
    }

    // Validate channel name format
    if (channel.includes('..') || channel.includes('/')) {
      throw new Error('Invalid channel name format');
    }

    // Check system channels require admin permission
    if (channel.startsWith('system:')) {
      if (!client.permissions?.includes('admin')) {
        throw new Error('System channels require admin permission');
      }
    }

    // Check permission format: operation:scope
    // e.g., read:public, write:user
    const channelParts = channel.split(':');
    const scope = channelParts[0];

    // Check if client has permission for this scope
    const hasPermission = client.permissions?.some(
      perm => perm === scope || perm.endsWith(`:${scope}`)
    );

    return hasPermission || false;
  }

  /**
   * Enforce rate limit for operations
   */
  enforceRateLimit(clientId: string, operation: string): boolean {
    if (!this.config.rateLimit) {
      return true; // No rate limiting configured
    }

    const now = Date.now();
    const key = `${clientId}:${operation}`;
    const limit = this.messageRateLimits.get(key);

    if (!limit || limit.resetAt < now) {
      // Reset window
      this.messageRateLimits.set(key, {
        count: 1,
        resetAt: now + this.config.rateLimit.windowMs,
      });
      return true;
    }

    if (limit.count >= this.config.rateLimit.maxMessagesPerMinute) {
      return false;
    }

    limit.count++;
    return true;
  }

  /**
   * Validate message data
   */
  validateMessage(message: any): boolean {
    // Check message size (prevent DoS)
    const messageStr = JSON.stringify(message);
    if (messageStr.length > 1024 * 1024) { // 1MB limit
      throw new Error('Message too large');
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(messageStr)) {
        throw new Error('Message contains invalid content');
      }
    }

    return true;
  }

  /**
   * Subscribe client to channel (with permission check)
   */
  async subscribeClient(clientId: string, channel: string): Promise<boolean> {
    // Validate channel name
    if (channel.includes('..') || channel.includes('/')) {
      throw new Error('Invalid channel name format');
    }

    // Check if client exists
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Check system channels
    if (channel.startsWith('system:') && !client.permissions?.includes('admin')) {
      throw new Error('System channels require admin permission');
    }

    // Check read permission
    const channelScope = channel.split(':')[0];
    const hasReadPermission = client.permissions?.some(
      perm => perm === `read:${channelScope}` || perm === channelScope
    );

    if (!hasReadPermission) {
      throw new Error(`Insufficient permissions for channel: ${channel}`);
    }

    // Subscribe
    this.subscribe(channel, () => {});

    return true;
  }

  /**
   * Publish from client (with permission check and sanitization)
   */
  async publishFromClient(clientId: string, channel: string, data: any): Promise<any> {
    // Check rate limit
    if (!this.enforceRateLimit(clientId, 'publish')) {
      throw new Error('Rate limit exceeded: Too many messages sent');
    }

    // Validate message
    this.validateMessage(data);

    // Check if client exists
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error('Client not found');
    }

    // Check write permission
    const channelScope = channel.split(':')[0];
    const hasWritePermission = client.permissions?.some(
      perm => perm === `write:${channelScope}` || perm === `write`
    );

    if (!hasWritePermission) {
      throw new Error(`Insufficient permissions to publish to channel: ${channel}`);
    }

    // Sanitize data before publishing
    const sanitized = this.sanitizeData(data);

    // Publish sanitized data
    await this.publish(channel, sanitized);

    // Return sanitized data
    return sanitized;
  }

  /**
   * Sanitize data to remove malicious content
   */
  private sanitizeData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized: any = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      // Remove event handler properties
      if (key.startsWith('on')) {
        continue; // Skip this property
      }

      // Sanitize string values (remove script tags)
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/<script[^>]*>.*?<\/script>/gi, '');
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Get backoff time for a client (exponential backoff for reconnections)
   */
  getBackoffTime(clientId: string): number {
    const client = this.clients.get(clientId);
    if (!client) {
      return 0;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const attemptCount = client.metadata?.reconnectAttempts || 0;
    const backoffMs = Math.min(1000 * Math.pow(2, attemptCount), 30000);
    return backoffMs;
  }

  /**
   * Get current server configuration
   */
  getConfig(): RealtimeConfig {
    return { ...this.config };
  }

  /**
   * Add an allowed origin to CORS configuration
   */
  addAllowedOrigin(origin: string): void {
    if (!this.config.security) {
      this.config.security = {};
    }
    if (!this.config.security.allowedOrigins) {
      this.config.security.allowedOrigins = [];
    }
    if (!this.config.security.allowedOrigins.includes(origin)) {
      this.config.security.allowedOrigins.push(origin);
    }
  }

  /**
   * Check if a client is connected
   */
  isConnected(clientId: string): boolean {
    return this.clients.has(clientId);
  }

  /**
   * Set maximum number of connections allowed
   */
  setMaxConnections(max: number): void {
    if (!this.config.security) {
      this.config.security = {};
    }
    this.config.security.maxConnectionsPerIp = max;
  }
}
