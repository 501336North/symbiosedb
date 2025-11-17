/**
 * Document API Types
 * MongoDB-style API on PostgreSQL JSONB
 */

/**
 * Document - flexible JSON document
 */
export interface Document {
  _id: string;
  [key: string]: any;
}

/**
 * Query operators for filtering
 */
export interface QueryOperators {
  $eq?: any;
  $ne?: any;
  $gt?: number | string | Date;
  $gte?: number | string | Date;
  $lt?: number | string | Date;
  $lte?: number | string | Date;
  $in?: any[];
  $nin?: any[];
  $exists?: boolean;
  $regex?: string;
  $contains?: any;
}

/**
 * Query filter
 */
export type QueryFilter = {
  [key: string]: any | QueryOperators;
};

/**
 * Sort direction
 */
export type SortDirection = 1 | -1 | 'asc' | 'desc';

/**
 * Sort specification
 */
export type SortSpec = {
  [key: string]: SortDirection;
};

/**
 * Find options
 */
export interface FindOptions {
  sort?: SortSpec;
  limit?: number;
  skip?: number;
  projection?: string[]; // Fields to include
}

/**
 * Insert result
 */
export interface InsertResult {
  insertedId: string;
  acknowledged: boolean;
}

/**
 * Update result
 */
export interface UpdateResult {
  modifiedCount: number;
  matchedCount: number;
  acknowledged: boolean;
}

/**
 * Delete result
 */
export interface DeleteResult {
  deletedCount: number;
  acknowledged: boolean;
}

/**
 * Collection options
 */
export interface CollectionOptions {
  indexes?: string[]; // Fields to create GIN indexes on
  timestamps?: boolean; // Auto-add createdAt/updatedAt
}

/**
 * Document collection interface
 */
export interface IDocumentCollection {
  name: string;

  // Insert operations
  insertOne(document: Omit<Document, '_id'>): Promise<InsertResult>;
  insertMany(documents: Omit<Document, '_id'>[]): Promise<InsertResult[]>;

  // Find operations
  findOne(filter: QueryFilter): Promise<Document | null>;
  find(filter: QueryFilter, options?: FindOptions): Promise<Document[]>;
  findById(id: string): Promise<Document | null>;

  // Update operations
  updateOne(filter: QueryFilter, update: Partial<Document>): Promise<UpdateResult>;
  updateMany(filter: QueryFilter, update: Partial<Document>): Promise<UpdateResult>;
  updateById(id: string, update: Partial<Document>): Promise<UpdateResult>;

  // Delete operations
  deleteOne(filter: QueryFilter): Promise<DeleteResult>;
  deleteMany(filter: QueryFilter): Promise<DeleteResult>;
  deleteById(id: string): Promise<DeleteResult>;

  // Utility
  count(filter?: QueryFilter): Promise<number>;
  exists(filter: QueryFilter): Promise<boolean>;
}

/**
 * Document API manager
 */
export interface IDocumentAPI {
  collection(name: string, options?: CollectionOptions): IDocumentCollection;
  listCollections(): Promise<string[]>;
  dropCollection(name: string): Promise<boolean>;
}
