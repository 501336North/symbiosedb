export interface PerformanceHint {
  type: 'warning' | 'suggestion' | 'info';
  message: string;
  line?: number;
  column?: number;
  fix?: string;
}

export interface AnalysisResult {
  hints: PerformanceHint[];
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTime: 'fast' | 'medium' | 'slow';
}

export interface DatabaseSchema {
  tables: Array<{
    name: string;
    columns: Array<{ name: string; type: string }>;
    indexes: Array<{ columns: string[] }>;
  }>;
}
