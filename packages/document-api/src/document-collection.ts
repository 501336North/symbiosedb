/**
 * DocumentCollection - In-memory document storage with MongoDB-style API
 * (Production would use PostgreSQL JSONB)
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Document,
  QueryFilter,
  QueryOperators,
  FindOptions,
  InsertResult,
  UpdateResult,
  DeleteResult,
  IDocumentCollection,
  CollectionOptions,
} from './types';

export class DocumentCollection implements IDocumentCollection {
  public name: string;
  private documents: Map<string, Document>;
  private options: CollectionOptions;

  constructor(name: string, options: CollectionOptions = {}) {
    this.name = name;
    this.documents = new Map();
    this.options = {
      indexes: options.indexes || [],
      timestamps: options.timestamps || false,
    };
  }

  /**
   * Insert a single document
   */
  async insertOne(document: Omit<Document, '_id'>): Promise<InsertResult> {
    const id = uuidv4();
    const doc: Document = {
      ...document,
      _id: id,
    };

    // Add timestamps if enabled
    if (this.options.timestamps) {
      doc.createdAt = Date.now();
      doc.updatedAt = Date.now();
    }

    this.documents.set(id, doc);

    return {
      insertedId: id,
      acknowledged: true,
    };
  }

  /**
   * Insert multiple documents
   */
  async insertMany(documents: Omit<Document, '_id'>[]): Promise<InsertResult[]> {
    const results: InsertResult[] = [];

    for (const doc of documents) {
      const result = await this.insertOne(doc);
      results.push(result);
    }

    return results;
  }

  /**
   * Find one document matching filter
   */
  async findOne(filter: QueryFilter): Promise<Document | null> {
    for (const doc of this.documents.values()) {
      if (this.matchesFilter(doc, filter)) {
        return doc;
      }
    }
    return null;
  }

  /**
   * Find all documents matching filter
   */
  async find(filter: QueryFilter, options: FindOptions = {}): Promise<Document[]> {
    let results: Document[] = [];

    // Filter documents
    for (const doc of this.documents.values()) {
      if (this.matchesFilter(doc, filter)) {
        results.push(doc);
      }
    }

    // Apply sort
    if (options.sort) {
      results = this.applySorting(results, options.sort);
    }

    // Apply skip
    if (options.skip && options.skip > 0) {
      results = results.slice(options.skip);
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      results = results.slice(0, options.limit);
    }

    // Apply projection
    if (options.projection) {
      results = results.map((doc) => this.applyProjection(doc, options.projection!));
    }

    return results;
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  /**
   * Update one document
   */
  async updateOne(filter: QueryFilter, update: Partial<Document>): Promise<UpdateResult> {
    for (const [id, doc] of this.documents.entries()) {
      if (this.matchesFilter(doc, filter)) {
        const updated: Document = { ...doc, ...update, _id: id };

        // Update timestamp if enabled
        if (this.options.timestamps) {
          updated.updatedAt = Date.now();
        }

        this.documents.set(id, updated);

        return {
          modifiedCount: 1,
          matchedCount: 1,
          acknowledged: true,
        };
      }
    }

    return {
      modifiedCount: 0,
      matchedCount: 0,
      acknowledged: true,
    };
  }

  /**
   * Update multiple documents
   */
  async updateMany(filter: QueryFilter, update: Partial<Document>): Promise<UpdateResult> {
    let modifiedCount = 0;
    let matchedCount = 0;

    for (const [id, doc] of this.documents.entries()) {
      if (this.matchesFilter(doc, filter)) {
        matchedCount++;

        const updated: Document = { ...doc, ...update, _id: id };

        // Update timestamp if enabled
        if (this.options.timestamps) {
          updated.updatedAt = Date.now();
        }

        this.documents.set(id, updated);
        modifiedCount++;
      }
    }

    return {
      modifiedCount,
      matchedCount,
      acknowledged: true,
    };
  }

  /**
   * Update document by ID
   */
  async updateById(id: string, update: Partial<Document>): Promise<UpdateResult> {
    const doc = this.documents.get(id);

    if (!doc) {
      return {
        modifiedCount: 0,
        matchedCount: 0,
        acknowledged: true,
      };
    }

    const updated: Document = { ...doc, ...update, _id: id };

    // Update timestamp if enabled
    if (this.options.timestamps) {
      updated.updatedAt = Date.now();
    }

    this.documents.set(id, updated);

    return {
      modifiedCount: 1,
      matchedCount: 1,
      acknowledged: true,
    };
  }

  /**
   * Delete one document
   */
  async deleteOne(filter: QueryFilter): Promise<DeleteResult> {
    for (const [id, doc] of this.documents.entries()) {
      if (this.matchesFilter(doc, filter)) {
        this.documents.delete(id);

        return {
          deletedCount: 1,
          acknowledged: true,
        };
      }
    }

    return {
      deletedCount: 0,
      acknowledged: true,
    };
  }

  /**
   * Delete multiple documents
   */
  async deleteMany(filter: QueryFilter): Promise<DeleteResult> {
    let deletedCount = 0;

    const idsToDelete: string[] = [];

    for (const [id, doc] of this.documents.entries()) {
      if (this.matchesFilter(doc, filter)) {
        idsToDelete.push(id);
      }
    }

    for (const id of idsToDelete) {
      this.documents.delete(id);
      deletedCount++;
    }

    return {
      deletedCount,
      acknowledged: true,
    };
  }

  /**
   * Delete document by ID
   */
  async deleteById(id: string): Promise<DeleteResult> {
    const deleted = this.documents.delete(id);

    return {
      deletedCount: deleted ? 1 : 0,
      acknowledged: true,
    };
  }

  /**
   * Count documents matching filter
   */
  async count(filter: QueryFilter = {}): Promise<number> {
    let count = 0;

    for (const doc of this.documents.values()) {
      if (this.matchesFilter(doc, filter)) {
        count++;
      }
    }

    return count;
  }

  /**
   * Check if any document matches filter
   */
  async exists(filter: QueryFilter): Promise<boolean> {
    for (const doc of this.documents.values()) {
      if (this.matchesFilter(doc, filter)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if a document matches the filter
   */
  private matchesFilter(doc: Document, filter: QueryFilter): boolean {
    // Empty filter matches all
    if (Object.keys(filter).length === 0) {
      return true;
    }

    for (const [key, value] of Object.entries(filter)) {
      const docValue = doc[key];

      // Handle query operators
      if (this.isQueryOperator(value)) {
        if (!this.matchesOperator(docValue, value as QueryOperators)) {
          return false;
        }
      } else {
        // Exact match
        if (docValue !== value) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Check if value is a query operator object
   */
  private isQueryOperator(value: any): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const keys = Object.keys(value);
    return keys.length > 0 && keys.every((k) => k.startsWith('$'));
  }

  /**
   * Check if document value matches operator
   */
  private matchesOperator(docValue: any, operators: QueryOperators): boolean {
    for (const [op, operatorValue] of Object.entries(operators)) {
      switch (op) {
        case '$eq':
          if (docValue !== operatorValue) return false;
          break;

        case '$ne':
          if (docValue === operatorValue) return false;
          break;

        case '$gt':
          if (!(docValue > operatorValue)) return false;
          break;

        case '$gte':
          if (!(docValue >= operatorValue)) return false;
          break;

        case '$lt':
          if (!(docValue < operatorValue)) return false;
          break;

        case '$lte':
          if (!(docValue <= operatorValue)) return false;
          break;

        case '$in':
          if (!Array.isArray(operatorValue)) return false;
          if (!operatorValue.includes(docValue)) return false;
          break;

        case '$nin':
          if (!Array.isArray(operatorValue)) return false;
          if (operatorValue.includes(docValue)) return false;
          break;

        case '$exists':
          const exists = docValue !== undefined && docValue !== null;
          if (exists !== operatorValue) return false;
          break;

        case '$contains':
          if (!Array.isArray(docValue)) return false;
          if (!docValue.includes(operatorValue)) return false;
          break;

        case '$regex':
          if (typeof docValue !== 'string') return false;
          const regex = new RegExp(operatorValue as string);
          if (!regex.test(docValue)) return false;
          break;
      }
    }

    return true;
  }

  /**
   * Apply sorting to results
   */
  private applySorting(docs: Document[], sort: FindOptions['sort']): Document[] {
    if (!sort) return docs;

    const sortEntries = Object.entries(sort);
    if (sortEntries.length === 0) return docs;

    return [...docs].sort((a, b) => {
      for (const [field, direction] of sortEntries) {
        const aVal = a[field];
        const bVal = b[field];

        let comparison = 0;

        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;

        if (comparison !== 0) {
          // Handle direction (1 = asc, -1 = desc, 'asc', 'desc')
          if (direction === -1 || direction === 'desc') {
            return -comparison;
          }
          return comparison;
        }
      }

      return 0;
    });
  }

  /**
   * Apply projection to document
   */
  private applyProjection(doc: Document, projection: string[]): Document {
    const projected: Document = { _id: doc._id }; // Always include _id

    for (const field of projection) {
      if (field in doc) {
        projected[field] = doc[field];
      }
    }

    return projected;
  }
}
