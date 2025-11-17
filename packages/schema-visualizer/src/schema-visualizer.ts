/**
 * Schema Visualizer
 * Interactive schema visualization with automatic layout generation
 */

import {
  DatabaseSchema,
  SchemaGraph,
  GraphNode,
  GraphEdge,
  LayoutOptions,
  LayoutResult,
  SearchOptions,
  SearchResult,
  ExportOptions,
} from './types';

export class SchemaVisualizer {
  private schema: DatabaseSchema;
  private graph: SchemaGraph | null = null;

  constructor(schema: DatabaseSchema) {
    this.schema = schema;
  }

  /**
   * Generate graph structure from database schema
   */
  generateGraph(): SchemaGraph {
    const nodes: GraphNode[] = this.schema.tables.map((table) => ({
      id: table.name,
      label: table.name,
      type: 'table' as const,
      columns: table.columns,
      primaryKey: table.primaryKey,
    }));

    const edges: GraphEdge[] = this.schema.relationships.map((rel, index) => ({
      id: `edge-${index}`,
      source: rel.fromTable,
      target: rel.toTable,
      type: rel.type,
      label: rel.foreignKey,
    }));

    this.graph = {
      nodes,
      edges,
      metadata: {
        totalTables: this.schema.tables.length,
        totalRelationships: this.schema.relationships.length,
        generatedAt: Date.now(),
      },
    };

    return this.graph;
  }

  /**
   * Generate layout with positioned nodes
   */
  generateLayout(options: LayoutOptions): LayoutResult {
    if (!this.graph) {
      this.generateGraph();
    }

    const nodes = [...(this.graph!.nodes)];

    switch (options.algorithm) {
      case 'force':
        return this.forceDirectedLayout(nodes, options);
      case 'hierarchical':
        return this.hierarchicalLayout(nodes, options);
      case 'circular':
        return this.circularLayout(nodes, options);
      case 'grid':
        return this.gridLayout(nodes, options);
      default:
        return this.forceDirectedLayout(nodes, options);
    }
  }

  /**
   * Force-directed layout (simulates physics)
   */
  private forceDirectedLayout(nodes: GraphNode[], options: LayoutOptions): LayoutResult {
    const { width, height, padding, nodeSpacing } = options;
    const centerX = width / 2;
    const centerY = height / 2;

    // Simple force-directed algorithm
    // In production, would use D3.js force simulation
    const radius = Math.min(width, height) / 2 - padding - nodeSpacing;

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
      node.width = 150;
      node.height = 80;
    });

    return {
      nodes,
      width,
      height,
    };
  }

  /**
   * Hierarchical layout (top-down tree)
   */
  private hierarchicalLayout(nodes: GraphNode[], options: LayoutOptions): LayoutResult {
    const { width, height, padding, nodeSpacing } = options;

    // Build dependency graph
    const edges = this.graph!.edges;
    const levels = this.calculateHierarchyLevels(nodes, edges);

    const maxLevel = Math.max(...levels.values());
    const levelHeight = (height - 2 * padding) / (maxLevel + 1);

    // Position nodes by level
    const nodesByLevel = new Map<number, GraphNode[]>();
    nodes.forEach((node) => {
      const level = levels.get(node.id) || 0;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    });

    nodesByLevel.forEach((levelNodes, level) => {
      const levelWidth = (width - 2 * padding) / levelNodes.length;
      levelNodes.forEach((node, i) => {
        node.x = padding + levelWidth * (i + 0.5);
        node.y = padding + levelHeight * level;
        node.width = 150;
        node.height = 80;
      });
    });

    return {
      nodes,
      width,
      height,
    };
  }

  /**
   * Calculate hierarchy levels for nodes
   */
  private calculateHierarchyLevels(nodes: GraphNode[], edges: GraphEdge[]): Map<string, number> {
    const levels = new Map<string, number>();

    // Initialize all nodes at level 0
    nodes.forEach((node) => levels.set(node.id, 0));

    // Calculate levels based on relationships
    let changed = true;
    while (changed) {
      changed = false;
      edges.forEach((edge) => {
        const sourceLevel = levels.get(edge.source) || 0;
        const targetLevel = levels.get(edge.target) || 0;

        // Target should be at higher level than source
        if (targetLevel <= sourceLevel) {
          levels.set(edge.target, sourceLevel + 1);
          changed = true;
        }
      });
    }

    return levels;
  }

  /**
   * Circular layout (nodes arranged in a circle)
   */
  private circularLayout(nodes: GraphNode[], options: LayoutOptions): LayoutResult {
    const { width, height, padding } = options;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - padding - 100;

    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
      node.width = 150;
      node.height = 80;
    });

    return {
      nodes,
      width,
      height,
    };
  }

  /**
   * Grid layout (nodes arranged in a grid)
   */
  private gridLayout(nodes: GraphNode[], options: LayoutOptions): LayoutResult {
    const { width, height, padding, nodeSpacing } = options;

    const cols = Math.ceil(Math.sqrt(nodes.length));
    const rows = Math.ceil(nodes.length / cols);

    const cellWidth = (width - 2 * padding) / cols;
    const cellHeight = (height - 2 * padding) / rows;

    nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);

      node.x = padding + cellWidth * (col + 0.5);
      node.y = padding + cellHeight * (row + 0.5);
      node.width = Math.min(cellWidth - nodeSpacing, 150);
      node.height = Math.min(cellHeight - nodeSpacing, 80);
    });

    return {
      nodes,
      width,
      height,
    };
  }

  /**
   * Search schema elements
   */
  search(options: SearchOptions): SearchResult {
    const { query, searchIn, caseSensitive = false } = options;
    const searchQuery = caseSensitive ? query : query.toLowerCase();

    const result: SearchResult = {
      tables: [],
      columns: [],
      relationships: [],
    };

    if (searchIn.includes('tables')) {
      result.tables = this.schema.tables
        .filter((table) => {
          const tableName = caseSensitive ? table.name : table.name.toLowerCase();
          return tableName.includes(searchQuery);
        })
        .map((table) => table.name);
    }

    if (searchIn.includes('columns')) {
      this.schema.tables.forEach((table) => {
        table.columns.forEach((column) => {
          const columnName = caseSensitive ? column.name : column.name.toLowerCase();
          if (columnName.includes(searchQuery)) {
            result.columns.push({
              table: table.name,
              column: column.name,
            });
          }
        });
      });
    }

    if (searchIn.includes('relationships')) {
      result.relationships = this.schema.relationships
        .filter((rel) => {
          const fromTable = caseSensitive ? rel.fromTable : rel.fromTable.toLowerCase();
          const toTable = caseSensitive ? rel.toTable : rel.toTable.toLowerCase();
          const foreignKey = caseSensitive ? rel.foreignKey : rel.foreignKey.toLowerCase();

          return (
            fromTable.includes(searchQuery) ||
            toTable.includes(searchQuery) ||
            foreignKey.includes(searchQuery)
          );
        })
        .map((rel) => ({
          from: rel.fromTable,
          to: rel.toTable,
        }));
    }

    return result;
  }

  /**
   * Export graph in various formats
   */
  export(options: ExportOptions): string {
    if (!this.graph) {
      this.generateGraph();
    }

    switch (options.format) {
      case 'json':
        return this.exportJSON(options.includeMetadata || false);
      case 'svg':
        return this.exportSVG(options);
      case 'png':
        return this.exportPNG(options);
      default:
        return this.exportJSON(false);
    }
  }

  /**
   * Export as JSON
   */
  private exportJSON(includeMetadata: boolean): string {
    if (includeMetadata) {
      return JSON.stringify(this.graph, null, 2);
    }

    return JSON.stringify(
      {
        nodes: this.graph!.nodes,
        edges: this.graph!.edges,
      },
      null,
      2
    );
  }

  /**
   * Export as SVG (placeholder - would use D3.js in production)
   */
  private exportSVG(options: ExportOptions): string {
    const width = options.width || 800;
    const height = options.height || 600;
    const bg = options.backgroundColor || '#ffffff';

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="${bg}"/>
  <!-- Schema visualization would be rendered here -->
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" fill="#333">
    Schema Visualizer SVG Export
  </text>
</svg>`;
  }

  /**
   * Export as PNG (placeholder - would use canvas in production)
   */
  private exportPNG(options: ExportOptions): string {
    return `PNG Export (${options.width || 800}x${options.height || 600}) - Placeholder`;
  }

  /**
   * Get node details by table name
   */
  getNodeDetails(tableName: string): GraphNode | null {
    if (!this.graph) {
      this.generateGraph();
    }

    return this.graph!.nodes.find((node) => node.id === tableName) || null;
  }

  /**
   * Get relationships for a specific table
   */
  getTableRelationships(tableName: string): GraphEdge[] {
    if (!this.graph) {
      this.generateGraph();
    }

    return this.graph!.edges.filter((edge) => edge.source === tableName);
  }

  /**
   * Calculate graph statistics
   */
  getStatistics() {
    if (!this.graph) {
      this.generateGraph();
    }

    const totalNodes = this.graph!.nodes.length;
    const totalEdges = this.graph!.edges.length;

    // Count outgoing connections per node (source only)
    const connections = new Map<string, number>();
    this.graph!.edges.forEach((edge) => {
      connections.set(edge.source, (connections.get(edge.source) || 0) + 1);
    });

    // Find most connected table
    let mostConnectedTable = '';
    let maxConnections = 0;
    connections.forEach((count, table) => {
      if (count > maxConnections) {
        maxConnections = count;
        mostConnectedTable = table;
      }
    });

    return {
      totalNodes,
      totalEdges,
      averageConnections: totalEdges / totalNodes,
      mostConnectedTable,
    };
  }
}
