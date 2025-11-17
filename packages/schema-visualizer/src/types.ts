/**
 * Schema Visualizer Types
 * Defines interfaces for interactive schema graph visualization
 */

export interface DatabaseSchema {
  tables: Table[];
  relationships: Relationship[];
}

export interface Table {
  name: string;
  columns: Column[];
  primaryKey?: string[];
  indexes?: Index[];
}

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  unique?: boolean;
  defaultValue?: any;
}

export interface Index {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface Relationship {
  fromTable: string;
  toTable: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  foreignKey: string;
  referencedColumn?: string;
}

// Graph visualization types

export interface GraphNode {
  id: string;
  label: string;
  type: 'table';
  columns: Column[];
  primaryKey?: string[];
  x?: number;  // Position (for layout)
  y?: number;
  width?: number;
  height?: number;
}

export interface GraphEdge {
  id: string;
  source: string;  // Table name
  target: string;  // Table name
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
  label?: string;  // Foreign key name
}

export interface SchemaGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalTables: number;
    totalRelationships: number;
    generatedAt: number;
  };
}

// Layout types

export interface LayoutOptions {
  algorithm: 'force' | 'hierarchical' | 'circular' | 'grid';
  width: number;
  height: number;
  padding: number;
  nodeSpacing: number;
}

export interface LayoutResult {
  nodes: GraphNode[];  // Nodes with x, y positions
  width: number;       // Total graph width
  height: number;      // Total graph height
}

// Export types

export type ExportFormat = 'json' | 'svg' | 'png';

export interface ExportOptions {
  format: ExportFormat;
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeMetadata?: boolean;
}

// Search/filter types

export interface SearchOptions {
  query: string;
  searchIn: ('tables' | 'columns' | 'relationships')[];
  caseSensitive?: boolean;
}

export interface SearchResult {
  tables: string[];     // Matching table names
  columns: {            // Matching columns
    table: string;
    column: string;
  }[];
  relationships: {      // Matching relationships
    from: string;
    to: string;
  }[];
}
