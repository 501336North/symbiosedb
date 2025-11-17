/**
 * AI Agent Types for SymbioseDB
 */

/**
 * AI Agent configuration
 */
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  capabilities: string[];
  systemPrompt: string;
  parameters?: Record<string, AgentParameter>;
  examples?: AgentExample[];
}

/**
 * Agent categories
 */
export type AgentCategory =
  | 'governance'
  | 'analysis'
  | 'moderation'
  | 'automation'
  | 'research'
  | 'community'
  | 'treasury'
  | 'development';

/**
 * Agent parameter definition
 */
export interface AgentParameter {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: any[];
  };
}

/**
 * Agent usage example
 */
export interface AgentExample {
  input: string;
  output: string;
  explanation: string;
}

/**
 * Agent execution context
 */
export interface AgentContext {
  daoAddress?: string;
  userAddress?: string;
  chain?: string;
  metadata?: Record<string, any>;
}

/**
 * Agent execution result
 */
export interface AgentResult {
  success: boolean;
  output: string;
  metadata?: Record<string, any>;
  error?: string;
  timestamp: number;
}

/**
 * Pre-configured agent presets
 */
export type AgentPreset =
  | 'proposal-drafter'
  | 'vote-analyzer'
  | 'community-moderator'
  | 'treasury-manager'
  | 'data-analyst'
  | 'document-summarizer'
  | 'sentiment-analyzer'
  | 'task-automator';
