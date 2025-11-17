/**
 * Real-time Types for SymbioseDB
 * WebSocket server, pub/sub, and live queries
 */

/**
 * WebSocket message types
 */
export type MessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'publish'
  | 'broadcast'
  | 'presence_join'
  | 'presence_leave'
  | 'presence_update'
  | 'query_subscribe'
  | 'query_unsubscribe'
  | 'query_update'
  | 'ping'
  | 'pong'
  | 'error';

/**
 * WebSocket message
 */
export interface RealtimeMessage {
  type: MessageType;
  channel?: string;
  data?: any;
  timestamp: number;
  clientId?: string;
}

/**
 * Subscription callback
 */
export type SubscriptionCallback = (data: any, clientId?: string) => void | Promise<void>;

/**
 * Presence data
 */
export interface PresenceData {
  clientId: string;
  data: any;
  joinedAt: number;
  lastSeenAt: number;
}

/**
 * Query subscription
 */
export interface QuerySubscription {
  id: string;
  query: string;
  params?: any[];
  clientId: string;
  lastResult?: any;
}

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;
  maxConnections: number;
  maxMessagesPerMinute: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  allowedOrigins?: string[];
  maxConnectionsPerIp?: number;
}

/**
 * Realtime server configuration
 */
export interface RealtimeConfig {
  port?: number;
  host?: string;
  pingInterval?: number;
  presenceTimeout?: number;
  requireAuth?: boolean;
  jwtSecret?: string;
  rateLimit?: RateLimitConfig;
  security?: SecurityConfig;
}

/**
 * Channel statistics
 */
export interface ChannelStats {
  channel: string;
  subscriberCount: number;
  messageCount: number;
  createdAt: number;
  lastMessageAt?: number;
}

/**
 * Client information
 */
export interface ClientInfo {
  id: string;
  connectedAt: number;
  lastMessageAt: number;
  subscriptions: string[];
  presence?: Record<string, any>;
  permissions?: string[];
  ip?: string;
  metadata?: {
    reconnectAttempts?: number;
    [key: string]: any;
  };
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
}

/**
 * API Key configuration
 */
export interface ApiKeyConfig {
  name: string;
  permissions: string[];
}

/**
 * Realtime server interface
 */
export interface IRealtimeServer {
  // Lifecycle
  start(): Promise<void>;
  stop(): Promise<void>;

  // Pub/Sub
  publish(channel: string, data: any): Promise<number>;
  subscribe(channel: string, callback: SubscriptionCallback): () => void;

  // Presence
  updatePresence(clientId: string, channel: string, data: any): void;
  getPresence(channel: string): PresenceData[];

  // Query subscriptions
  subscribeToQuery(clientId: string, query: string, params?: any[]): string;
  unsubscribeFromQuery(subscriptionId: string): void;
  notifyQueryUpdate(query: string, result: any): Promise<void>;

  // Stats
  getChannelStats(channel?: string): ChannelStats[];
  getClientInfo(clientId?: string): ClientInfo[];
  getActiveConnections(): number;
}
