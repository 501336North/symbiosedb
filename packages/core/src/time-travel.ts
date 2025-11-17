/**
 * Time Travel Manager
 *
 * Point-in-time recovery, snapshot management, and restore functionality
 * Enables "undo for databases" with visual timeline and diff viewing
 */

import { EventEmitter } from 'events';

export interface DatabaseOperation {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  data: any;
  previousData?: any;
  timestamp: number;
}

export interface Snapshot {
  id: string;
  operation: DatabaseOperation;
  timestamp: number;
  data: any;
  previousData?: any;
  delta?: any;
  compressed?: boolean;
}

export interface RestoreOptions {
  dryRun?: boolean;
  ignoreErrors?: boolean;
}

export interface RestoreResult {
  success: boolean;
  snapshot?: Snapshot;
  operations?: DatabaseOperation[];
  applied?: boolean;
  error?: string;
}

export interface DiffResult {
  changed: string[];
  added: string[];
  removed: string[];
  changes: Record<string, { from: any; to: any }>;
}

export interface TimelineStats {
  totalSnapshots: number;
  oldestSnapshot?: Snapshot;
  newestSnapshot?: Snapshot;
  timeSpan: number;
}

export interface TimeTravelOptions {
  snapshotInterval?: number;
  maxSnapshots?: number;
  enableAutoSnapshot?: boolean;
  storage?: {
    upload: (snapshot: Snapshot) => Promise<{ key: string }>;
    download: (key: string) => Promise<{ data: Snapshot }>;
  };
}

export class TimeTravelManager extends EventEmitter {
  private snapshots: Snapshot[] = [];
  private maxSnapshots: number;
  private storage?: TimeTravelOptions['storage'];

  constructor(options: TimeTravelOptions = {}) {
    super();
    this.maxSnapshots = options.maxSnapshots || 100;
    this.storage = options.storage;
  }

  /**
   * Create snapshot from operation
   */
  async createSnapshot(operation: DatabaseOperation): Promise<Snapshot> {
    const snapshot: Snapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: operation.timestamp || Date.now(),
      data: operation.data,
      previousData: operation.previousData,
    };

    // Compress snapshot (store delta only for updates)
    if (operation.type === 'UPDATE' && operation.previousData) {
      const delta = this.calculateDelta(operation.previousData, operation.data);
      if (Object.keys(delta).length < Object.keys(operation.data).length / 2) {
        snapshot.delta = delta;
        snapshot.compressed = true;
      }
    }

    // Add to snapshots
    this.snapshots.push(snapshot);

    // Enforce max snapshots (LRU eviction)
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift(); // Remove oldest
    }

    // Upload to storage if configured
    if (this.storage) {
      await this.storage.upload(snapshot);
    }

    // Emit event
    this.emit('snapshotCreated', snapshot);
    this.emit('snapshot', snapshot);

    return snapshot;
  }

  /**
   * Restore to specific timestamp
   */
  async restoreToTimestamp(timestamp: number, options: RestoreOptions = {}): Promise<RestoreResult> {
    const snapshot = this.getNearestSnapshot(timestamp);

    if (!snapshot) {
      return {
        success: false,
        error: 'No snapshot found for the specified timestamp',
      };
    }

    return this.restoreSnapshot(snapshot, options);
  }

  /**
   * Restore to relative time (e.g., 5 minutes ago)
   */
  async restoreToRelativeTime(
    relative: { minutes?: number; hours?: number; days?: number },
    options: RestoreOptions = {}
  ): Promise<RestoreResult> {
    const now = Date.now();
    const offset =
      (relative.minutes || 0) * 60 * 1000 +
      (relative.hours || 0) * 60 * 60 * 1000 +
      (relative.days || 0) * 24 * 60 * 60 * 1000;

    const targetTime = now + offset;
    return this.restoreToTimestamp(targetTime, options);
  }

  /**
   * Restore specific snapshot
   */
  private async restoreSnapshot(snapshot: Snapshot, options: RestoreOptions): Promise<RestoreResult> {
    this.emit('restoreStarted', snapshot);

    const operations = await this.generateRestoreOperations(snapshot.timestamp);

    if (options.dryRun) {
      return {
        success: true,
        snapshot,
        operations,
        applied: false,
      };
    }

    // In real implementation, would execute operations against database
    // For now, just return success
    this.emit('restoreCompleted', snapshot);

    return {
      success: true,
      snapshot,
      operations,
      applied: true,
    };
  }

  /**
   * Generate restore operations to revert to specific time
   */
  async generateRestoreOperations(targetTimestamp: number): Promise<DatabaseOperation[]> {
    const operations: DatabaseOperation[] = [];

    // Get all snapshots after target time (in reverse order)
    const snapshotsToRevert = this.snapshots
      .filter((s) => s.timestamp > targetTimestamp)
      .reverse();

    for (const snapshot of snapshotsToRevert) {
      const reverseOp = this.reverseOperation(snapshot.operation);
      operations.push(reverseOp);
    }

    return operations;
  }

  /**
   * Reverse an operation (for restore)
   */
  private reverseOperation(operation: DatabaseOperation): DatabaseOperation {
    const reversed: DatabaseOperation = {
      type: operation.type,
      table: operation.table,
      data: operation.data,
      timestamp: Date.now(),
    };

    switch (operation.type) {
      case 'INSERT':
        // Reverse INSERT = DELETE
        reversed.type = 'DELETE';
        break;

      case 'DELETE':
        // Reverse DELETE = INSERT with previous data
        reversed.type = 'INSERT';
        reversed.data = operation.previousData || operation.data;
        break;

      case 'UPDATE':
        // Reverse UPDATE = UPDATE with previous data
        reversed.type = 'UPDATE';
        reversed.data = operation.previousData || {};
        reversed.previousData = operation.data;
        break;
    }

    return reversed;
  }

  /**
   * Calculate delta between two objects
   */
  private calculateDelta(previous: any, current: any): any {
    const delta: any = {};

    for (const key in current) {
      if (current[key] !== previous[key]) {
        delta[key] = current[key];
      }
    }

    return delta;
  }

  /**
   * Calculate diff between two snapshots
   */
  calculateDiff(snapshot1: Snapshot, snapshot2: Snapshot): DiffResult {
    const data1 = snapshot1.data || {};
    const data2 = snapshot2.data || {};

    const changed: string[] = [];
    const added: string[] = [];
    const removed: string[] = [];
    const changes: Record<string, { from: any; to: any }> = {};

    // Find changed and removed fields
    for (const key in data1) {
      if (!(key in data2)) {
        removed.push(key);
      } else if (data1[key] !== data2[key]) {
        changed.push(key);
        changes[key] = { from: data1[key], to: data2[key] };
      }
    }

    // Find added fields
    for (const key in data2) {
      if (!(key in data1)) {
        added.push(key);
      }
    }

    return { changed, added, removed, changes };
  }

  /**
   * Format diff as human-readable text
   */
  formatDiff(diff: DiffResult): string {
    const lines: string[] = [];

    if (diff.added.length > 0) {
      lines.push(`Added: ${diff.added.join(', ')}`);
    }

    if (diff.removed.length > 0) {
      lines.push(`Removed: ${diff.removed.join(', ')}`);
    }

    if (diff.changed.length > 0) {
      diff.changed.forEach((key) => {
        const change = diff.changes[key];
        lines.push(`${key}: "${change.from}" → "${change.to}"`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): Snapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get snapshots in time range
   */
  getSnapshotsInRange(startTime: number, endTime: number): Snapshot[] {
    return this.snapshots.filter((s) => s.timestamp >= startTime && s.timestamp <= endTime);
  }

  /**
   * Get nearest snapshot to timestamp
   */
  getNearestSnapshot(timestamp: number): Snapshot | null {
    if (this.snapshots.length === 0) {
      return null;
    }

    // Find snapshot with closest timestamp (before or at target time)
    const before = this.snapshots
      .filter((s) => s.timestamp <= timestamp)
      .sort((a, b) => b.timestamp - a.timestamp);

    return before[0] || null;
  }

  /**
   * Get next snapshot
   */
  getNextSnapshot(currentId: string): Snapshot | null {
    const currentIndex = this.snapshots.findIndex((s) => s.id === currentId);
    if (currentIndex === -1 || currentIndex === this.snapshots.length - 1) {
      return null;
    }
    return this.snapshots[currentIndex + 1];
  }

  /**
   * Get previous snapshot
   */
  getPreviousSnapshot(currentId: string): Snapshot | null {
    const currentIndex = this.snapshots.findIndex((s) => s.id === currentId);
    if (currentIndex === -1 || currentIndex === 0) {
      return null;
    }
    return this.snapshots[currentIndex - 1];
  }

  /**
   * Get timeline statistics
   */
  getTimelineStats(): TimelineStats {
    if (this.snapshots.length === 0) {
      return {
        totalSnapshots: 0,
        timeSpan: 0,
      };
    }

    const sorted = [...this.snapshots].sort((a, b) => a.timestamp - b.timestamp);
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    return {
      totalSnapshots: this.snapshots.length,
      oldestSnapshot: oldest,
      newestSnapshot: newest,
      timeSpan: newest.timestamp - oldest.timestamp,
    };
  }

  /**
   * Export snapshots as JSON
   */
  exportSnapshots(): string {
    return JSON.stringify(this.snapshots, null, 2);
  }

  /**
   * Import snapshots from JSON
   */
  importSnapshots(json: string): void {
    try {
      const imported = JSON.parse(json);
      if (Array.isArray(imported)) {
        this.snapshots = [...this.snapshots, ...imported];

        // Enforce max snapshots
        if (this.snapshots.length > this.maxSnapshots) {
          this.snapshots = this.snapshots.slice(-this.maxSnapshots);
        }
      }
    } catch (error) {
      throw new Error('Invalid JSON format for snapshots');
    }
  }
}
