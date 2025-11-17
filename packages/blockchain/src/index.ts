/**
 * @symbiosedb/blockchain - Multi-chain blockchain support
 * Supports 16+ EVM networks with unified interface
 */

export { ChainRegistry } from './chain-registry';
export { MultiChainManager } from './multi-chain-manager';

export type {
  ChainName,
  ChainConfig,
  Attestation,
  VerificationResult,
  MultiChainConfig,
} from './types';
