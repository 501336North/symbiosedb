import { PerformanceHint, AnalysisResult, DatabaseSchema } from './types';

export class PerformanceAnalyzer {
  private schema: DatabaseSchema;

  constructor(schema: DatabaseSchema) {
    this.schema = schema;
  }

  analyze(query: string): AnalysisResult {
    const hints: PerformanceHint[] = [];
    const upper = query.toUpperCase();

    // Warn about SELECT *
    if (upper.includes('SELECT *')) {
      hints.push({
        type: 'warning',
        message: 'Avoid SELECT * - specify needed columns for better performance',
        fix: 'SELECT id, email FROM users'
      });
    }

    // Check for missing indexes
    const whereMatch = query.match(/WHERE\s+(\w+)\s*=/i);
    if (whereMatch) {
      const column = whereMatch[1];
      const hasIndex = this.schema.tables.some(t =>
        t.indexes.some(idx => idx.columns.includes(column))
      );
      if (!hasIndex) {
        hints.push({
          type: 'warning',
          message: `Consider adding an index on column '${column}'`
        });
      }
    }

    // Estimate complexity
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (upper.includes('JOIN') || upper.includes('GROUP BY')) {
      complexity = 'complex';
    } else if (upper.includes('WHERE') || upper.includes('ORDER BY')) {
      complexity = 'moderate';
    }

    const estimatedTime = complexity === 'complex' ? 'slow' : complexity === 'moderate' ? 'medium' : 'fast';

    return { hints, complexity, estimatedTime };
  }
}
