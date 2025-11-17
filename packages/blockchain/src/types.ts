/**
 * Blockchain Types for Multi-Chain Support
 */

/**
 * Supported blockchain networks
 */
export type ChainName =
  | 'ethereum'
  | 'arbitrum'
  | 'optimism'
  | 'base'
  | 'polygon'
  | 'avalanche'
  | 'bsc'
  | 'fantom'
  | 'gnosis'
  | 'celo'
  | 'moonbeam'
  | 'aurora'
  | 'harmony'
  | 'cronos'
  | 'evmos'
  | 'klaytn';

/**
 * Chain configuration
 */
export interface ChainConfig {
  chainId: number;
  name: ChainName;
  displayName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  testnet?: boolean;
}

/**
 * Attestation data stored on blockchain
 */
export interface Attestation {
  id: string;
  chain: ChainName;
  action: string;
  data: Record<string, any>;
  timestamp: number;
  transactionHash?: string;
  blockNumber?: number;
}

/**
 * Attestation verification result
 */
export interface VerificationResult {
  valid: boolean;
  attestation?: Attestation;
  error?: string;
}

/**
 * Multi-chain manager configuration
 */
export interface MultiChainConfig {
  chains: ChainName[];
  defaultChain?: ChainName;
  customRpcUrls?: Partial<Record<ChainName, string>>;
}
