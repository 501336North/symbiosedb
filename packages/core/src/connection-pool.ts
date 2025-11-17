/**
 * Phase 6: Advanced Connection Pooling
 *
 * Generic connection pool manager with statistics, health monitoring, and optimization
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface PoolConfig {
  min: number; // Minimum connections to maintain
  max: number; // Maximum connections allowed
  acquireTimeoutMillis: number; // Timeout for acquiring connection
  idleTimeoutMillis: number; // Timeout for idle connections
  connectionTimeoutMillis?: number; // Timeout for creating connections
  enableHealthCheck?: boolean; // Enable periodic health checks
  healthCheckIntervalMs?: number; // Health check interval
}

export interface PoolConnection {
  id: string;
  state: 'active' | 'idle' | 'unhealthy';
  createdAt: Date;
  lastUsed: Date;
  usageCount: number;
}

export interface PoolStats {
  active: number; // Currently in-use connections
  idle: number; // Available connections
  waiting: number; // Requests waiting for connection
  size: number; // Total connections (active + idle)
  totalConnections: number; // Total created over lifetime
  totalAcquired: number; // Total acquisitions
  totalReleased: number; // Total releases
  averageAcquisitionTimeMs: number; // Average time to acquire
  peakUsage: number; // Peak simultaneous connections
}

export interface HealthStatus {
  healthy: boolean;
  unhealthyCount: number;
  lastCheckTime: Date;
}

/**
 * Generic connection pool manager with advanced features
 */
export class ConnectionPoolManager extends EventEmitter {
  private config: PoolConfig;
  private connections: Map<string, PoolConnection> = new Map();
  private idleConnections: Set<string> = new Set();
  private waitingQueue: Array<{
    resolve: (conn: PoolConnection) => void;
    reject: (error: Error) => void;
    startTime: number;
  }> = [];

  // Statistics
  private stats = {
    totalCreated: 0,
    totalAcquired: 0,
    totalReleased: 0,
    acquisitionTimes: [] as number[],
    peakUsage: 0,
  };

  private draining = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: PoolConfig) {
    super();
    this.config = config;
    // Initialize in background (don't await in constructor)
    this.initialize().catch((error) => {
      this.emit('error', error);
    });
  }

  /**
   * Initialize pool with minimum connections (parallel warmup)
   */
  private async initialize(): Promise<void> {
    // Create minimum connections in parallel for faster warmup
    const createPromises = [];
    for (let i = 0; i < this.config.min; i++) {
      createPromises.push(this.createConnection());
    }
    await Promise.all(createPromises);

    // Start health checks if enabled
    if (this.config.enableHealthCheck) {
      this.startHealthChecks();
    }

    // Start idle connection cleanup
    this.startIdleCleanup();
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<PoolConnection> {
    if (this.draining) {
      throw new Error('Pool is draining');
    }

    const startTime = Date.now();

    // Try to get idle connection
    const idleId = this.idleConnections.values().next().value;
    if (idleId) {
      this.idleConnections.delete(idleId);
      const conn = this.connections.get(idleId)!;
      conn.state = 'active';
      conn.lastUsed = new Date();
      conn.usageCount++;

      this.stats.totalAcquired++;
      this.stats.acquisitionTimes.push(Date.now() - startTime);
      this.updatePeakUsage();

      return conn;
    }

    // Create new connection if below max
    if (this.connections.size < this.config.max) {
      const conn = await this.createConnection();
      // Remove from idle since we're acquiring it immediately
      this.idleConnections.delete(conn.id);
      conn.state = 'active';
      conn.lastUsed = new Date();
      conn.usageCount++;

      this.stats.totalAcquired++;
      this.stats.acquisitionTimes.push(Date.now() - startTime);
      this.updatePeakUsage();

      return conn;
    }

    // Wait for available connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex((w) => w.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error('Connection acquisition timeout'));
      }, this.config.acquireTimeoutMillis);

      this.waitingQueue.push({
        resolve: (conn) => {
          clearTimeout(timeout);
          this.stats.totalAcquired++;
          this.stats.acquisitionTimes.push(Date.now() - startTime);
          resolve(conn);
        },
        reject,
        startTime,
      });
    });
  }

  /**
   * Release a connection back to the pool
   */
  async release(connection: PoolConnection): Promise<void> {
    if (!this.connections.has(connection.id)) {
      return;
    }

    // Check if anyone is waiting
    if (this.waitingQueue.length > 0) {
      const waiter = this.waitingQueue.shift()!;
      connection.state = 'active';
      connection.lastUsed = new Date();
      connection.usageCount++;
      waiter.resolve(connection);
      return;
    }

    // Return to idle pool
    connection.state = 'idle';
    connection.lastUsed = new Date();
    this.idleConnections.add(connection.id);
    this.stats.totalReleased++;
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    const active = Array.from(this.connections.values()).filter(
      (c) => c.state === 'active'
    ).length;
    const idle = this.idleConnections.size;

    const avgAcquisition =
      this.stats.acquisitionTimes.length > 0
        ? this.stats.acquisitionTimes.reduce((a, b) => a + b, 0) /
          this.stats.acquisitionTimes.length
        : 0;

    return {
      active,
      idle,
      waiting: this.waitingQueue.length,
      size: this.connections.size,
      totalConnections: this.stats.totalCreated,
      totalAcquired: this.stats.totalAcquired,
      totalReleased: this.stats.totalReleased,
      averageAcquisitionTimeMs: avgAcquisition,
      peakUsage: this.stats.peakUsage,
    };
  }

  /**
   * Check health of all connections
   */
  async checkHealth(): Promise<HealthStatus> {
    let unhealthyCount = 0;

    for (const [id, conn] of this.connections.entries()) {
      if (conn.state === 'unhealthy') {
        unhealthyCount++;
      }
    }

    return {
      healthy: unhealthyCount === 0,
      unhealthyCount,
      lastCheckTime: new Date(),
    };
  }

  /**
   * Perform health check and remove unhealthy connections
   */
  async performHealthCheck(): Promise<void> {
    const unhealthy: string[] = [];

    for (const [id, conn] of this.connections.entries()) {
      // Simple health check: check if connection is too old or idle too long
      const age = Date.now() - conn.createdAt.getTime();
      const idleTime = Date.now() - conn.lastUsed.getTime();

      if (age > 3600000 || (conn.state === 'idle' && idleTime > this.config.idleTimeoutMillis * 2)) {
        unhealthy.push(id);
      }
    }

    // Remove unhealthy connections
    for (const id of unhealthy) {
      await this.destroyConnection(id);
    }
  }

  /**
   * Drain the pool (wait for all active connections to be released, then clear)
   */
  async drain(): Promise<void> {
    this.draining = true;

    // Wait for all active connections to be released with timeout
    const timeout = 5000; // 5 seconds max
    const startTime = Date.now();

    while (this.getStats().active > 0) {
      if (Date.now() - startTime > timeout) {
        break; // Timeout - give up waiting
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Clear all remaining connections
    await this.clear();
  }

  /**
   * Clear all connections from the pool
   */
  async clear(): Promise<void> {
    // Stop health checks
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    // Destroy all connections
    const ids = Array.from(this.connections.keys());
    for (const id of ids) {
      await this.destroyConnection(id);
    }

    this.draining = false;
  }

  /**
   * Private: Create a new connection
   */
  private async createConnection(): Promise<PoolConnection> {
    const conn: PoolConnection = {
      id: uuidv4(),
      state: 'idle',
      createdAt: new Date(),
      lastUsed: new Date(),
      usageCount: 0,
    };

    this.connections.set(conn.id, conn);
    this.idleConnections.add(conn.id);
    this.stats.totalCreated++;

    return conn;
  }

  /**
   * Private: Destroy a connection
   */
  private async destroyConnection(id: string): Promise<void> {
    this.connections.delete(id);
    this.idleConnections.delete(id);
  }

  /**
   * Private: Update peak usage statistic
   */
  private updatePeakUsage(): void {
    const active = Array.from(this.connections.values()).filter(
      (c) => c.state === 'active'
    ).length;

    if (active > this.stats.peakUsage) {
      this.stats.peakUsage = active;
    }
  }

  /**
   * Private: Start periodic health checks
   */
  private startHealthChecks(): void {
    const interval = this.config.healthCheckIntervalMs || 30000;

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck().catch((error) => {
        this.emit('error', error);
      });
    }, interval);

    // Don't keep process alive
    this.healthCheckInterval.unref();
  }

  /**
   * Private: Start idle connection cleanup
   */
  private startIdleCleanup(): void {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();

      // Find idle connections that exceeded timeout
      const toRemove: string[] = [];

      for (const id of this.idleConnections) {
        const conn = this.connections.get(id);
        if (!conn) continue;

        const idleTime = now - conn.lastUsed.getTime();

        // Keep minimum connections, remove extras that are idle too long
        // Check size dynamically to ensure we maintain min connections
        if (
          this.connections.size - toRemove.length > this.config.min &&
          idleTime > this.config.idleTimeoutMillis
        ) {
          toRemove.push(id);
        }
      }

      // Remove idle connections
      for (const id of toRemove) {
        this.destroyConnection(id);
      }
    }, this.config.idleTimeoutMillis / 2);

    // Don't keep process alive
    cleanupInterval.unref();
  }
}
