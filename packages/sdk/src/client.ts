/**
 * SymbioseDB Client
 *
 * Simple REST API client for SymbioseDB operations
 */

export interface ClientConfig {
  apiKey: string;
  baseURL?: string;
}

export interface QueryResult {
  rows: any[];
}

export interface VectorSearchOptions {
  collection: string;
  embedding: number[];
  limit?: number;
}

export interface VectorSearchResult {
  id: number;
  similarity: number;
  metadata: any;
}

export interface AttestationOptions {
  action: string;
  data: any;
}

export interface AttestationResult {
  attestationId: string;
  txHash: string;
}

export interface AttestationVerification {
  valid: boolean;
  attestation: {
    action: string;
    timestamp: number;
  };
}

export interface HealthStatus {
  status: string;
  uptime: number;
  version: string;
}

export class SymbioseDBClient {
  private apiKey: string;
  private baseURL: string;

  constructor(config: ClientConfig) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.symbiosedb.com';
  }

  /**
   * Get the base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Execute SQL query
   */
  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    const response = await fetch(`${this.baseURL}/api/query`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Query failed');
    }

    return await response.json();
  }

  /**
   * Vector similarity search
   */
  async vectorSearch(options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    if (options.embedding.length === 0) {
      throw new Error('Embedding cannot be empty');
    }

    const response = await fetch(`${this.baseURL}/api/vector/search`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collection: options.collection,
        embedding: options.embedding,
        limit: options.limit || 10,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Vector search failed');
    }

    const result = await response.json();
    return result.results;
  }

  /**
   * Store blockchain attestation
   */
  async attest(options: AttestationOptions): Promise<AttestationResult> {
    const response = await fetch(`${this.baseURL}/api/attestation/store`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: options.action,
        data: options.data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Attestation failed');
    }

    return await response.json();
  }

  /**
   * Verify blockchain attestation
   */
  async verifyAttestation(attestationId: string): Promise<AttestationVerification> {
    const response = await fetch(`${this.baseURL}/api/attestation/${attestationId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Verification failed');
    }

    return await response.json();
  }

  /**
   * Check API health
   */
  async health(): Promise<HealthStatus> {
    const response = await fetch(`${this.baseURL}/health`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return await response.json();
  }
}
