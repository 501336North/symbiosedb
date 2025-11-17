/**
 * ChainRegistry - Registry of supported blockchain networks
 * (TDD Implementation)
 */

import type { ChainConfig, ChainName } from './types';

/**
 * Predefined chain configurations for major EVM networks
 */
const CHAIN_CONFIGS: Record<ChainName, ChainConfig> = {
  ethereum: {
    chainId: 1,
    name: 'ethereum',
    displayName: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  arbitrum: {
    chainId: 42161,
    name: 'arbitrum',
    displayName: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  optimism: {
    chainId: 10,
    name: 'optimism',
    displayName: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  base: {
    chainId: 8453,
    name: 'base',
    displayName: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  polygon: {
    chainId: 137,
    name: 'polygon',
    displayName: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  },
  avalanche: {
    chainId: 43114,
    name: 'avalanche',
    displayName: 'Avalanche C-Chain',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
  bsc: {
    chainId: 56,
    name: 'bsc',
    displayName: 'BNB Smart Chain',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  fantom: {
    chainId: 250,
    name: 'fantom',
    displayName: 'Fantom Opera',
    rpcUrl: 'https://rpc.ftm.tools',
    explorerUrl: 'https://ftmscan.com',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
  },
  gnosis: {
    chainId: 100,
    name: 'gnosis',
    displayName: 'Gnosis Chain',
    rpcUrl: 'https://rpc.gnosischain.com',
    explorerUrl: 'https://gnosisscan.io',
    nativeCurrency: { name: 'xDai', symbol: 'XDAI', decimals: 18 },
  },
  celo: {
    chainId: 42220,
    name: 'celo',
    displayName: 'Celo',
    rpcUrl: 'https://forno.celo.org',
    explorerUrl: 'https://celoscan.io',
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  },
  moonbeam: {
    chainId: 1284,
    name: 'moonbeam',
    displayName: 'Moonbeam',
    rpcUrl: 'https://rpc.api.moonbeam.network',
    explorerUrl: 'https://moonscan.io',
    nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 },
  },
  aurora: {
    chainId: 1313161554,
    name: 'aurora',
    displayName: 'Aurora',
    rpcUrl: 'https://mainnet.aurora.dev',
    explorerUrl: 'https://aurorascan.dev',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  harmony: {
    chainId: 1666600000,
    name: 'harmony',
    displayName: 'Harmony',
    rpcUrl: 'https://api.harmony.one',
    explorerUrl: 'https://explorer.harmony.one',
    nativeCurrency: { name: 'ONE', symbol: 'ONE', decimals: 18 },
  },
  cronos: {
    chainId: 25,
    name: 'cronos',
    displayName: 'Cronos',
    rpcUrl: 'https://evm.cronos.org',
    explorerUrl: 'https://cronoscan.com',
    nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 },
  },
  evmos: {
    chainId: 9001,
    name: 'evmos',
    displayName: 'Evmos',
    rpcUrl: 'https://eth.bd.evmos.org:8545',
    explorerUrl: 'https://escan.live',
    nativeCurrency: { name: 'Evmos', symbol: 'EVMOS', decimals: 18 },
  },
  klaytn: {
    chainId: 8217,
    name: 'klaytn',
    displayName: 'Klaytn',
    rpcUrl: 'https://public-node-api.klaytnapi.com/v1/cypress',
    explorerUrl: 'https://scope.klaytn.com',
    nativeCurrency: { name: 'KLAY', symbol: 'KLAY', decimals: 18 },
  },
};

/**
 * Layer 2 networks
 */
const LAYER2_CHAINS: Set<ChainName> = new Set(['arbitrum', 'optimism', 'base']);

export class ChainRegistry {
  private chains: Map<ChainName, ChainConfig>;
  private chainIdIndex: Map<number, ChainName>;

  constructor() {
    this.chains = new Map(Object.entries(CHAIN_CONFIGS) as [ChainName, ChainConfig][]);
    this.chainIdIndex = new Map();

    // Build chain ID index
    for (const [name, config] of this.chains.entries()) {
      this.chainIdIndex.set(config.chainId, name);
    }
  }

  /**
   * Get chain configuration by name
   */
  getChain(name: ChainName): ChainConfig | undefined {
    return this.chains.get(name);
  }

  /**
   * Get chain configuration by chain ID
   */
  getChainById(chainId: number): ChainConfig | undefined {
    const name = this.chainIdIndex.get(chainId);
    return name ? this.chains.get(name) : undefined;
  }

  /**
   * Check if chain name is supported
   */
  isSupported(name: ChainName): boolean {
    return this.chains.has(name);
  }

  /**
   * Check if chain ID is supported
   */
  isSupportedChainId(chainId: number): boolean {
    return this.chainIdIndex.has(chainId);
  }

  /**
   * Get all supported chains
   */
  getAllChains(): ChainConfig[] {
    return Array.from(this.chains.values());
  }

  /**
   * Get all chain names
   */
  getChainNames(): ChainName[] {
    return Array.from(this.chains.keys());
  }

  /**
   * Get only mainnet chains (exclude testnets)
   */
  getMainnetChains(): ChainConfig[] {
    return this.getAllChains().filter(chain => !chain.testnet);
  }

  /**
   * Get only testnet chains
   */
  getTestnetChains(): ChainConfig[] {
    return this.getAllChains().filter(chain => chain.testnet === true);
  }

  /**
   * Register a custom chain
   */
  registerChain(config: ChainConfig, options?: { allowOverride?: boolean }): void {
    // Check if chain ID already exists (unless overriding same chain)
    const existingChainName = this.chainIdIndex.get(config.chainId);
    if (existingChainName && existingChainName !== config.name) {
      throw new Error(`Chain ID ${config.chainId} already registered for chain '${existingChainName}'`);
    }

    // If overriding, remove old chain ID index if name changed
    if (options?.allowOverride) {
      const oldConfig = this.chains.get(config.name);
      if (oldConfig && oldConfig.chainId !== config.chainId) {
        this.chainIdIndex.delete(oldConfig.chainId);
      }
    }

    this.chains.set(config.name, config);
    this.chainIdIndex.set(config.chainId, config.name);
  }

  /**
   * Get total number of registered chains
   */
  getChainCount(): number {
    return this.chains.size;
  }

  /**
   * Check if chain is a Layer 2 network
   */
  isLayer2(name: ChainName): boolean {
    return LAYER2_CHAINS.has(name);
  }
}
