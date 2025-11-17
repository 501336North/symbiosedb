/**
 * SymbioseDB SDK
 *
 * The stupidly easy way to build DAO + AI apps
 */

// TODO: Re-enable when @symbiosedb/dao and @symbiosedb/ai packages are created
// import { DAOManager } from '@symbiosedb/dao';
// import { AIManager } from '@symbiosedb/ai';
import { ethers } from 'ethers';

export interface SymbioseDBConfig {
  apiKey: string;
  database: string;
  network?: string;
  rpcUrl?: string;
}

export class SymbioseDB {
  // public dao: DAOManager;
  // public ai: AIManager;
  private config: SymbioseDBConfig;
  private provider?: ethers.JsonRpcProvider;

  constructor(config: SymbioseDBConfig) {
    this.config = config;

    // Initialize blockchain provider
    if (config.rpcUrl) {
      this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    }

    // TODO: Re-enable when packages exist
    // // Initialize managers
    // this.dao = new DAOManager({
    //   database: config.database,
    //   provider: this.provider,
    // });

    // this.ai = new AIManager({
    //   database: config.database,
    //   apiKey: config.apiKey,
    //   verifiable: true,
    //   provider: this.provider,
    // });
  }

  /**
   * Token-gate a function
   * Returns middleware that checks token balance before executing
   */
  tokenGate(options: {
    token: string;
    minAmount: number;
  }) {
    return async (wallet: string): Promise<boolean> => {
      if (!this.provider) {
        throw new Error('Blockchain provider not configured');
      }

      // Create ERC20 contract interface
      const abi = [
        'function balanceOf(address owner) view returns (uint256)'
      ];
      const contract = new ethers.Contract(options.token, abi, this.provider);

      // Check balance
      const balance = await contract.balanceOf(wallet);
      return balance >= ethers.parseUnits(options.minAmount.toString(), 18);
    };
  }

  // TODO: Re-enable when packages exist
  // /**
  //  * Quick start: Create a DAO in one function call
  //  */
  // async createDAO(options: {
  //   name: string;
  //   description?: string;
  //   token?: string;
  //   governance?: {
  //     votingPeriod?: number;
  //     quorum?: number;
  //     proposalThreshold?: number;
  //   };
  // }) {
  //   return await this.dao.create({
  //     name: options.name,
  //     description: options.description || '',
  //     token: options.token || '',
  //     governance: {
  //       votingPeriod: options.governance?.votingPeriod || 7 * 24 * 60 * 60,
  //       quorum: options.governance?.quorum || 0.1,
  //       proposalThreshold: options.governance?.proposalThreshold || 100,
  //     },
  //   });
  // }

  // /**
  //  * Quick start: Create an AI agent
  //  */
  // async createAIAgent(options: {
  //   name: string;
  //   model?: string;
  //   verifiable?: boolean;
  //   governedBy?: string; // DAO ID
  // }) {
  //   return await this.ai.createAgent({
  //     name: options.name,
  //     model: options.model || 'gpt-4',
  //     verifiable: options.verifiable !== false,
  //     daoId: options.governedBy,
  //   });
  // }
}

// Export REST API client
export { SymbioseDBClient } from './client';
export type {
  ClientConfig,
  QueryResult,
  VectorSearchOptions,
  VectorSearchResult,
  AttestationOptions,
  AttestationResult,
  AttestationVerification,
  HealthStatus,
} from './client';

// TODO: Re-enable when packages exist
// Export managers for advanced usage
// export { DAOManager } from '@symbiosedb/dao';
// export { AIManager } from '@symbiosedb/ai';

// Export types
export * from './types';
