/**
 * Phase 5: Transaction Coordinator
 *
 * Implements SAGA pattern for distributed transactions across multiple databases.
 * Ensures atomicity through compensation logic (rollback).
 */

import {
  TransactionState,
  TransactionStep,
  SagaDefinition,
  TransactionOptions,
  EventStore,
} from './unified-types';
import { v4 as uuidv4 } from 'uuid';

export class TransactionCoordinator {
  private transactions: Map<string, TransactionState> = new Map();
  private eventStore?: EventStore;
  private compensationLocks: Set<string> = new Set(); // Prevent concurrent compensations

  constructor(eventStore?: EventStore) {
    this.eventStore = eventStore;
  }

  /**
   * Begin a new distributed transaction
   */
  async begin(): Promise<TransactionState> {
    const transaction: TransactionState = {
      id: uuidv4(),
      status: 'pending',
      steps: [],
      startedAt: new Date(),
    };

    this.transactions.set(transaction.id, transaction);

    // Log event (best effort - don't fail transaction if logging fails)
    if (this.eventStore) {
      try {
        await this.eventStore.append({
          id: uuidv4(),
          aggregateId: transaction.id,
          aggregateType: 'Transaction',
          eventType: 'TransactionStarted',
          data: {},
          metadata: {
            timestamp: new Date(),
            version: 1,
          },
        });
      } catch (error) {
        // Log error but continue (event store failure shouldn't block transaction)
        console.error('Event store append failed:', error);
      }
    }

    return transaction;
  }

  /**
   * Execute a single step in the transaction
   */
  async executeStep(
    transaction: TransactionState,
    stepDefinition: {
      database: 'sql' | 'vector' | 'graph' | 'blockchain';
      operation: 'create' | 'update' | 'delete';
      execute: () => Promise<any>;
      compensate?: (result: any) => Promise<void>;
      data?: any;
    },
    options?: TransactionOptions
  ): Promise<any> {
    const step: TransactionStep = {
      database: stepDefinition.database,
      operation: stepDefinition.operation,
      status: 'pending',
      data: stepDefinition.data,
    };

    transaction.steps.push(step);
    transaction.status = 'in_progress';

    try {
      // Apply timeout if specified (validate it's positive)
      const timeout = options?.timeout !== undefined ? options.timeout : 30000; // 30s default

      // Validate timeout is positive
      if (timeout <= 0) {
        throw new Error('Transaction timeout');
      }

      const result = await this.withTimeout(
        stepDefinition.execute(),
        timeout
      );

      step.status = 'completed';
      step.result = result;
      step.executedAt = new Date();

      // Store compensation data for potential rollback
      if (stepDefinition.compensate) {
        step.compensationData = { result, compensate: stepDefinition.compensate };
      }

      return result;
    } catch (error: any) {
      step.status = 'failed';
      step.error = error;
      transaction.status = 'failed';

      // Automatically trigger compensation
      await this.compensate(transaction);

      throw error;
    }
  }

  /**
   * Execute a complete SAGA (sequence of steps with compensation logic)
   */
  async executeSaga(
    saga: SagaDefinition,
    data: any,
    options?: { parallel?: boolean }
  ): Promise<any> {
    const transaction = await this.begin();
    const results: any[] = [];

    try {
      if (options?.parallel) {
        // Execute steps in parallel (only safe for independent operations)
        const promises = saga.steps.map((step) =>
          this.executeStep(transaction, {
            database: step.database,
            operation: 'create',
            execute: () => step.execute(data),
            compensate: (result) => step.compensate(data, result),
          })
        );

        const stepResults = await Promise.all(promises);
        results.push(...stepResults);
      } else {
        // Execute steps sequentially (safe for dependent operations)
        for (const step of saga.steps) {
          const result = await this.executeStep(transaction, {
            database: step.database,
            operation: 'create',
            execute: () => step.execute(data),
            compensate: (result) => step.compensate(data, result),
          });

          results.push(result);
        }
      }

      await this.commit(transaction);
      return results;
    } catch (error) {
      // Compensation already triggered by executeStep
      throw error;
    }
  }

  /**
   * Commit the transaction (mark as successful)
   */
  async commit(transaction: TransactionState): Promise<void> {
    transaction.status = 'committed';
    transaction.completedAt = new Date();

    if (this.eventStore) {
      await this.eventStore.append({
        id: uuidv4(),
        aggregateId: transaction.id,
        aggregateType: 'Transaction',
        eventType: 'TransactionCommitted',
        data: { steps: transaction.steps.length },
        metadata: {
          timestamp: new Date(),
          version: transaction.steps.length + 1,
        },
      });
    }
  }

  /**
   * Compensate (rollback) the transaction
   * Executes compensation in reverse order
   */
  async compensate(transaction: TransactionState): Promise<void> {
    // Prevent concurrent compensations on same transaction
    if (this.compensationLocks.has(transaction.id)) {
      return; // Already compensating, skip
    }

    // Don't compensate already committed transactions
    if (transaction.status === 'committed') {
      return;
    }

    // Acquire lock
    this.compensationLocks.add(transaction.id);

    try {
      transaction.status = 'compensating';

      // Compensate in reverse order
      const completedSteps = transaction.steps
        .filter((s) => s.status === 'completed')
        .reverse();

      for (const step of completedSteps) {
        try {
          if (step.compensationData?.compensate) {
            await step.compensationData.compensate(step.compensationData.result);
            step.status = 'compensated';

            if (this.eventStore) {
              await this.eventStore.append({
                id: uuidv4(),
                aggregateId: transaction.id,
                aggregateType: 'Transaction',
                eventType: 'StepCompensated',
                data: { database: step.database, operation: step.operation },
                metadata: {
                  timestamp: new Date(),
                  version: transaction.steps.length + 1,
                },
              });
            }
          }
        } catch (error: any) {
          // Compensation failed - log but continue
          console.error(`Compensation failed for ${step.database}:`, error);
          step.error = error;
        }
      }

      transaction.status = 'compensated';
      transaction.completedAt = new Date();
    } finally {
      // Release lock
      this.compensationLocks.delete(transaction.id);
    }
  }

  /**
   * Get transaction state
   */
  async getTransaction(transactionId: string): Promise<TransactionState | undefined> {
    return this.transactions.get(transactionId);
  }

  /**
   * Get transaction history (events)
   */
  async getHistory(transactionId: string): Promise<any[]> {
    if (!this.eventStore) {
      return [];
    }

    const events = await this.eventStore.getEvents(transactionId);
    return events.map((e: any) => ({
      type: this.eventTypeToHistoryType(e.eventType),
      timestamp: e.metadata.timestamp,
      data: e.data,
    }));
  }

  /**
   * Helper: Add timeout to promise
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Transaction timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Helper: Convert event type to history type
   */
  private eventTypeToHistoryType(eventType: string): string {
    const map: Record<string, string> = {
      TransactionStarted: 'transaction_started',
      TransactionCommitted: 'transaction_committed',
      StepExecuted: 'step_executed',
      StepCompensated: 'step_compensated',
    };

    return map[eventType] || eventType.toLowerCase();
  }
}
