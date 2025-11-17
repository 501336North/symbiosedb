/**
 * MultiChainManager - Manages connections across multiple blockchain networks
 * (TDD Implementation)
 */

import { ethers } from 'ethers';
import { ChainRegistry } from './chain-registry';
import type { ChainName, ChainConfig, MultiChainConfig } from './types';

export class MultiChainManager {
  private registry: ChainRegistry;
  private activeChains: Set<ChainName>;
  private defaultChain: ChainName;
  private providers: Map<ChainName, ethers.JsonRpcProvider>;
  private customRpcUrls: Partial<Record<ChainName, string>>;

  constructor(config: MultiChainConfig) {
    this.registry = new ChainRegistry();
    this.activeChains = new Set();
    this.providers = new Map();
    this.customRpcUrls = config.customRpcUrls || {};

    // Validate and initialize chains
    for (const chain of config.chains) {
      if (!this.registry.isSupported(chain)) {
        throw new Error(`Unsupported chain: ${chain}`);
      }
      this.activeChains.add(chain);
      this.initializeProvider(chain);
    }

    // Set default chain
    if (config.defaultChain) {
      if (!this.activeChains.has(config.defaultChain)) {
        throw new Error(`Default chain ${config.defaultChain} is not in active chains`);
      }
      this.defaultChain = config.defaultChain;
    } else {
      // Use first chain as default
      this.defaultChain = config.chains[0];
    }
  }

  /**
   * Initialize provider for a chain
   */
  private initializeProvider(chain: ChainName): void {
    const config = this.registry.getChain(chain)!;
    const rpcUrl = this.customRpcUrls[chain] || config.rpcUrl;

    const provider = new ethers.JsonRpcProvider(rpcUrl, {
      chainId: config.chainId,
      name: config.name,
    });

    this.providers.set(chain, provider);
  }

  /**
   * Get list of active chains
   */
  getActiveChains(): ChainName[] {
    return Array.from(this.activeChains);
  }

  /**
   * Get default chain
   */
  getDefaultChain(): ChainName {
    return this.defaultChain;
  }

  /**
   * Add a new chain
   */
  addChain(chain: ChainName): void {
    if (!this.registry.isSupported(chain)) {
      throw new Error(`Unsupported chain: ${chain}`);
    }

    if (this.activeChains.has(chain)) {
      return; // Already active
    }

    this.activeChains.add(chain);
    this.initializeProvider(chain);
  }

  /**
   * Remove a chain
   */
  removeChain(chain: ChainName): void {
    if (chain === this.defaultChain) {
      throw new Error('Cannot remove default chain');
    }

    this.activeChains.delete(chain);
    this.providers.delete(chain);
  }

  /**
   * Set default chain
   */
  setDefaultChain(chain: ChainName): void {
    if (!this.activeChains.has(chain)) {
      throw new Error(`Chain ${chain} is not active`);
    }

    this.defaultChain = chain;
  }

  /**
   * Check if chain is active
   */
  isChainActive(chain: ChainName): boolean {
    return this.activeChains.has(chain);
  }

  /**
   * Get chain config for active chain
   */
  getChainConfig(chain: ChainName): ChainConfig | undefined {
    if (!this.activeChains.has(chain)) {
      return undefined;
    }

    return this.registry.getChain(chain);
  }

  /**
   * Get all active chain configs
   */
  getAllChainConfigs(): ChainConfig[] {
    return this.getActiveChains()
      .map(chain => this.registry.getChain(chain)!)
      .filter(config => config !== undefined);
  }

  /**
   * Get provider for a specific chain
   */
  getProvider(chain: ChainName): ethers.JsonRpcProvider {
    if (!this.activeChains.has(chain)) {
      throw new Error(`Chain ${chain} is not active`);
    }

    return this.providers.get(chain)!;
  }

  /**
   * Get provider for default chain
   */
  getDefaultProvider(): ethers.JsonRpcProvider {
    return this.getProvider(this.defaultChain);
  }

  /**
   * Get all active providers
   */
  getAllProviders(): Record<ChainName, ethers.JsonRpcProvider> {
    const providers: Record<string, ethers.JsonRpcProvider> = {};

    for (const chain of this.activeChains) {
      providers[chain] = this.providers.get(chain)!;
    }

    return providers as Record<ChainName, ethers.JsonRpcProvider>;
  }

  /**
   * Execute operation on specific chain
   */
  async executeOnChain<T>(
    chain: ChainName,
    operation: (provider: ethers.JsonRpcProvider) => Promise<T>
  ): Promise<T> {
    const provider = this.getProvider(chain);
    return await operation(provider);
  }

  /**
   * Execute operation on default chain
   */
  async executeOnDefaultChain<T>(
    operation: (provider: ethers.JsonRpcProvider) => Promise<T>
  ): Promise<T> {
    return await this.executeOnChain(this.defaultChain, operation);
  }

  /**
   * Execute operation on all active chains
   */
  async executeOnAllChains<T>(
    operation: (provider: ethers.JsonRpcProvider, chain: ChainName) => Promise<T>,
    options?: { continueOnError?: boolean }
  ): Promise<T[]> {
    const results: T[] = [];

    for (const chain of this.activeChains) {
      try {
        const provider = this.providers.get(chain)!;
        const result = await operation(provider, chain);
        results.push(result);
      } catch (error) {
        if (!options?.continueOnError) {
          throw error;
        }
        // Continue to next chain on error
      }
    }

    return results;
  }

  /**
   * Check connection health for specific chain
   */
  async checkChainHealth(chain: ChainName): Promise<boolean> {
    try {
      const provider = this.getProvider(chain);
      await provider.getBlockNumber();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check health of all active chains
   */
  async checkAllChainsHealth(): Promise<Record<ChainName, boolean>> {
    const healthStatus: Record<string, boolean> = {};

    for (const chain of this.activeChains) {
      healthStatus[chain] = await this.checkChainHealth(chain);
    }

    return healthStatus as Record<ChainName, boolean>;
  }

  /**
   * Get network information for a chain
   */
  async getNetworkInfo(chain: ChainName): Promise<ethers.Network> {
    const provider = this.getProvider(chain);
    return await provider.getNetwork();
  }
}
