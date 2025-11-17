# @symbiosedb/blockchain

**Multi-chain blockchain support for SymbioseDB with unified interface across 16+ EVM networks.**

Build cross-chain applications with a single API that works across Ethereum, Arbitrum, Optimism, Base, Polygon, and 12 more networks. Store immutable attestations, verify data integrity, and create tamper-proof audit trails.

[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://www.npmjs.com/package/@symbiosedb/blockchain)
[![License](https://img.shields.io/badge/license-MIT-green)](../../LICENSE)

---

## Why @symbiosedb/blockchain?

**One API. 16 Blockchains. Zero Complexity.**

```typescript
import { MultiChainManager } from '@symbiosedb/blockchain';

// Initialize with multiple chains
const manager = new MultiChainManager({
  chains: ['arbitrum', 'optimism', 'base'],
  defaultChain: 'arbitrum'
});

// Execute on Arbitrum (default)
const blockNumber = await manager.executeOnDefaultChain(
  async (provider) => await provider.getBlockNumber()
);

// Execute on all chains
const results = await manager.executeOnAllChains(
  async (provider, chain) => await provider.getBlockNumber()
);
```

No need to manage separate providers for each chain. Just configure once and execute anywhere.

---

## ✨ Features

### Multi-Chain Support
- ⛓️ **16+ EVM Networks** - Ethereum, Arbitrum, Optimism, Base, Polygon, BNB, Avalanche, and more
- 🔄 **Unified Interface** - Same API across all chains
- 🎯 **Dynamic Chain Switching** - Add/remove chains at runtime
- 🌐 **Multi-Region** - Mainnet and testnet support for all chains
- 🔌 **Custom RPC URLs** - Use your own Infura/Alchemy endpoints

### Chain Management
- 📋 **Chain Registry** - Pre-configured settings for all supported chains
- ⚙️ **Default Chain** - Set preferred chain for operations
- 🔍 **Chain Discovery** - Query chain configs and capabilities
- 💡 **Active Chains** - Track which chains are currently active
- 🛡️ **Validation** - Automatic chain ID and name validation

### Operations
- 🔄 **Execute on Specific Chain** - Run operations on any active chain
- 🌍 **Execute on All Chains** - Broadcast operations across chains
- 🏥 **Health Checks** - Monitor connection status for each chain
- 📊 **Network Info** - Get chain metadata and network details
- ⚡ **Gas Optimization** - L2-optimized for low fees

### Developer Experience
- 🎨 **Type-Safe** - Full TypeScript definitions
- 📖 **Well Documented** - Comprehensive JSDoc comments
- 🐛 **Error Handling** - Clear error messages with context
- 🧪 **Test Friendly** - Easy to mock for unit tests
- 🔧 **Flexible** - Works with ethers.js ecosystem

---

## 📦 Installation

```bash
# npm
npm install @symbiosedb/blockchain

# yarn
yarn add @symbiosedb/blockchain

# pnpm
pnpm add @symbiosedb/blockchain
```

**Dependencies:**
- ethers >= 6.9.0

---

## 🚀 Quick Start

### 1. Basic Setup

```typescript
import { MultiChainManager, ChainRegistry } from '@symbiosedb/blockchain';

// Check supported chains
const registry = new ChainRegistry();
console.log(registry.getAllChains()); // ['ethereum', 'arbitrum', 'optimism', ...]

// Initialize manager with chains
const manager = new MultiChainManager({
  chains: ['arbitrum', 'optimism', 'base'],
  defaultChain: 'arbitrum'
});

// Get active chains
console.log(manager.getActiveChains()); // ['arbitrum', 'optimism', 'base']
console.log(manager.getDefaultChain()); // 'arbitrum'
```

### 2. Execute Operations

```typescript
// Execute on default chain (Arbitrum)
const arbBlockNumber = await manager.executeOnDefaultChain(
  async (provider) => await provider.getBlockNumber()
);

// Execute on specific chain
const opBlockNumber = await manager.executeOnChain('optimism',
  async (provider) => await provider.getBlockNumber()
);

// Execute on all active chains
const allBlocks = await manager.executeOnAllChains(
  async (provider, chain) => {
    const blockNumber = await provider.getBlockNumber();
    return { chain, blockNumber };
  }
);
// [{ chain: 'arbitrum', blockNumber: 12345 }, { chain: 'optimism', blockNumber: 67890 }, ...]
```

### 3. Chain Management

```typescript
// Add new chain
manager.addChain('polygon');
console.log(manager.isChainActive('polygon')); // true

// Set default chain
manager.setDefaultChain('polygon');

// Remove chain (cannot remove default)
manager.removeChain('optimism');

// Get chain config
const arbConfig = manager.getChainConfig('arbitrum');
console.log(arbConfig?.chainId); // 42161
console.log(arbConfig?.name); // 'Arbitrum One'
```

---

## 🔧 Configuration

### MultiChainConfig

```typescript
interface MultiChainConfig {
  chains: ChainName[];                    // Required: Array of chain names to activate
  defaultChain?: ChainName;              // Optional: Default chain (uses first if not set)
  customRpcUrls?: Partial<Record<ChainName, string>>;  // Optional: Custom RPC endpoints
}
```

### Example: Production Configuration

```typescript
const manager = new MultiChainManager({
  // Enable multiple chains
  chains: ['arbitrum', 'optimism', 'base', 'polygon'],

  // Set default
  defaultChain: 'arbitrum',

  // Use custom RPC URLs (Infura/Alchemy)
  customRpcUrls: {
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    optimism: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    base: `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
    polygon: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`,
  }
});
```

---

## 🌐 Supported Chains

### Mainnets (16 chains)

| Chain | Name | Chain ID | Native Token |
|-------|------|----------|--------------|
| `ethereum` | Ethereum Mainnet | 1 | ETH |
| `arbitrum` | Arbitrum One | 42161 | ETH |
| `optimism` | Optimism | 10 | ETH |
| `base` | Base | 8453 | ETH |
| `polygon` | Polygon PoS | 137 | MATIC |
| `bsc` | BNB Smart Chain | 56 | BNB |
| `avalanche` | Avalanche C-Chain | 43114 | AVAX |
| `fantom` | Fantom Opera | 250 | FTM |
| `gnosis` | Gnosis Chain | 100 | xDAI |
| `celo` | Celo | 42220 | CELO |
| `moonbeam` | Moonbeam | 1284 | GLMR |
| `moonriver` | Moonriver | 1285 | MOVR |
| `aurora` | Aurora | 1313161554 | ETH |
| `harmony` | Harmony One | 1666600000 | ONE |
| `cronos` | Cronos | 25 | CRO |
| `boba` | Boba Network | 288 | ETH |

### Testnets (16 chains)

| Chain | Name | Chain ID | Native Token |
|-------|------|----------|--------------|
| `sepolia` | Ethereum Sepolia | 11155111 | ETH |
| `arbitrum-sepolia` | Arbitrum Sepolia | 421614 | ETH |
| `optimism-sepolia` | Optimism Sepolia | 11155420 | ETH |
| `base-sepolia` | Base Sepolia | 84532 | ETH |
| `polygon-mumbai` | Polygon Mumbai | 80001 | MATIC |
| `bsc-testnet` | BNB Testnet | 97 | BNB |
| `avalanche-fuji` | Avalanche Fuji | 43113 | AVAX |
| `fantom-testnet` | Fantom Testnet | 4002 | FTM |
| `gnosis-chiado` | Gnosis Chiado | 10200 | xDAI |
| `celo-alfajores` | Celo Alfajores | 44787 | CELO |
| `moonbase-alpha` | Moonbase Alpha | 1287 | GLMR |
| `aurora-testnet` | Aurora Testnet | 1313161555 | ETH |
| `harmony-testnet` | Harmony Testnet | 1666700000 | ONE |
| `cronos-testnet` | Cronos Testnet | 338 | CRO |
| `boba-testnet` | Boba Testnet | 2888 | ETH |

**Total: 32 networks (16 mainnets + 16 testnets)**

---

## 💡 Examples

### Example 1: Cross-Chain Balance Checker

```typescript
import { MultiChainManager } from '@symbiosedb/blockchain';

const manager = new MultiChainManager({
  chains: ['ethereum', 'arbitrum', 'optimism', 'polygon']
});

async function getBalances(address: string) {
  const balances = await manager.executeOnAllChains(
    async (provider, chain) => {
      const balance = await provider.getBalance(address);
      return {
        chain,
        balance: ethers.formatEther(balance),
        usd: await convertToUSD(balance, chain)
      };
    },
    { continueOnError: true } // Don't stop if one chain fails
  );

  return balances;
}

// Usage
const balances = await getBalances('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
balances.forEach(({ chain, balance, usd }) => {
  console.log(`${chain}: ${balance} ETH ($${usd})`);
});
```

### Example 2: Cross-Chain Attestation

```typescript
async function attestOnMultipleChains(data: {
  action: string;
  userId: string;
  timestamp: number;
}) {
  const manager = new MultiChainManager({
    chains: ['arbitrum', 'optimism', 'base']
  });

  // Store attestation on all L2s for redundancy
  const attestations = await manager.executeOnAllChains(
    async (provider, chain) => {
      const signer = new ethers.Wallet(privateKey, provider);
      const contract = new ethers.Contract(attestationContract, abi, signer);

      const tx = await contract.attest(
        data.action,
        data.userId,
        data.timestamp
      );

      const receipt = await tx.wait();

      return {
        chain,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    },
    { continueOnError: true }
  );

  return attestations;
}

// Usage
const result = await attestOnMultipleChains({
  action: 'USER_LOGIN',
  userId: '123',
  timestamp: Date.now()
});
```

### Example 3: Health Monitoring

```typescript
async function monitorChainHealth() {
  const manager = new MultiChainManager({
    chains: ['arbitrum', 'optimism', 'base', 'polygon']
  });

  // Check all chains
  const health = await manager.checkAllChainsHealth();

  // Get detailed info for unhealthy chains
  for (const [chain, isHealthy] of Object.entries(health)) {
    if (!isHealthy) {
      console.error(`⚠️  ${chain} is unhealthy`);

      try {
        const networkInfo = await manager.getNetworkInfo(chain);
        console.log(`Chain ID: ${networkInfo.chainId}`);
        console.log(`Name: ${networkInfo.name}`);
      } catch (error) {
        console.error(`Cannot get network info: ${error.message}`);
      }
    } else {
      console.log(`✅ ${chain} is healthy`);
    }
  }

  return health;
}

// Run every minute
setInterval(monitorChainHealth, 60000);
```

### Example 4: Dynamic Chain Switching

```typescript
async function executWithFallback(
  preferredChain: ChainName,
  fallbackChains: ChainName[],
  operation: (provider: ethers.JsonRpcProvider) => Promise<any>
) {
  const manager = new MultiChainManager({
    chains: [preferredChain, ...fallbackChains],
    defaultChain: preferredChain
  });

  // Try preferred chain first
  try {
    return await manager.executeOnChain(preferredChain, operation);
  } catch (error) {
    console.warn(`${preferredChain} failed, trying fallbacks...`);

    // Try fallback chains
    for (const chain of fallbackChains) {
      try {
        const result = await manager.executeOnChain(chain, operation);
        console.log(`✅ Succeeded on ${chain}`);
        return result;
      } catch (fallbackError) {
        console.warn(`${chain} also failed`);
        continue;
      }
    }

    throw new Error('All chains failed');
  }
}

// Usage
const result = await executWithFallback(
  'arbitrum',
  ['optimism', 'base'],
  async (provider) => await provider.getBlockNumber()
);
```

### Example 5: Gas Price Comparison

```typescript
async function findCheapestChain() {
  const manager = new MultiChainManager({
    chains: ['arbitrum', 'optimism', 'base', 'polygon']
  });

  const gasPrices = await manager.executeOnAllChains(
    async (provider, chain) => {
      const feeData = await provider.getFeeData();
      const gasPriceGwei = ethers.formatUnits(feeData.gasPrice || 0, 'gwei');

      return {
        chain,
        gasPrice: gasPriceGwei,
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null
      };
    }
  );

  // Sort by gas price
  gasPrices.sort((a, b) => parseFloat(a.gasPrice) - parseFloat(b.gasPrice));

  console.log('Gas prices (cheapest first):');
  gasPrices.forEach(({ chain, gasPrice }) => {
    console.log(`${chain}: ${gasPrice} gwei`);
  });

  return gasPrices[0].chain; // Return cheapest
}
```

---

## 📚 API Reference

### MultiChainManager

Main class for multi-chain operations.

#### Constructor

```typescript
new MultiChainManager(config: MultiChainConfig)
```

#### Chain Management Methods

##### `getActiveChains(): ChainName[]`
Get list of all active chains.

##### `getDefaultChain(): ChainName`
Get current default chain.

##### `addChain(chain: ChainName): void`
Add a new chain to active chains.

##### `removeChain(chain: ChainName): void`
Remove chain from active chains (cannot remove default chain).

##### `setDefaultChain(chain: ChainName): void`
Set default chain for operations.

##### `isChainActive(chain: ChainName): boolean`
Check if chain is currently active.

##### `getChainConfig(chain: ChainName): ChainConfig | undefined`
Get configuration for specific chain.

##### `getAllChainConfigs(): ChainConfig[]`
Get configurations for all active chains.

#### Provider Methods

##### `getProvider(chain: ChainName): ethers.JsonRpcProvider`
Get ethers.js provider for specific chain.

##### `getDefaultProvider(): ethers.JsonRpcProvider`
Get provider for default chain.

##### `getAllProviders(): Record<ChainName, ethers.JsonRpcProvider>`
Get providers for all active chains.

#### Execution Methods

##### `executeOnChain<T>(chain: ChainName, operation: (provider) => Promise<T>): Promise<T>`
Execute operation on specific chain.

##### `executeOnDefaultChain<T>(operation: (provider) => Promise<T>): Promise<T>`
Execute operation on default chain.

##### `executeOnAllChains<T>(operation: (provider, chain) => Promise<T>, options?): Promise<T[]>`
Execute operation on all active chains.

**Options:**
- `continueOnError` (boolean) - Continue if one chain fails (default: false)

#### Health Methods

##### `checkChainHealth(chain: ChainName): Promise<boolean>`
Check if chain connection is healthy.

##### `checkAllChainsHealth(): Promise<Record<ChainName, boolean>>`
Check health of all active chains.

##### `getNetworkInfo(chain: ChainName): Promise<ethers.Network>`
Get network information for chain.

### ChainRegistry

Registry of supported chains with pre-configured settings.

#### Methods

##### `isSupported(chain: ChainName): boolean`
Check if chain is supported.

##### `getChain(chain: ChainName): ChainConfig | undefined`
Get configuration for chain.

##### `getAllChains(): ChainName[]`
Get list of all supported chains.

##### `getMainnets(): ChainName[]`
Get list of mainnet chains only.

##### `getTestnets(): ChainName[]`
Get list of testnet chains only.

---

## 🐛 Troubleshooting

### Issue 1: "Unsupported chain" Error

**Problem:**
```
Error: Unsupported chain: mychain
```

**Solution:**
Use a supported chain from the list:

```typescript
import { ChainRegistry } from '@symbiosedb/blockchain';

const registry = new ChainRegistry();
console.log(registry.getAllChains()); // See all supported chains

// Use valid chain
const manager = new MultiChainManager({
  chains: ['arbitrum', 'optimism'] // ✅ Valid
});
```

### Issue 2: "Cannot remove default chain" Error

**Problem:**
```
Error: Cannot remove default chain
```

**Solution:**
Set a different default chain before removing:

```typescript
// ❌ Wrong
manager.setDefaultChain('arbitrum');
manager.removeChain('arbitrum'); // Error!

// ✅ Correct
manager.setDefaultChain('optimism');
manager.removeChain('arbitrum'); // Now OK
```

### Issue 3: RPC Connection Failures

**Problem:**
Health checks fail or operations timeout.

**Solution:**
Use custom RPC URLs with your own Infura/Alchemy keys:

```typescript
const manager = new MultiChainManager({
  chains: ['arbitrum'],
  customRpcUrls: {
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_KEY}`
  }
});
```

### Issue 4: "Chain is not active" Error

**Problem:**
```
Error: Chain polygon is not active
```

**Solution:**
Add chain before using it:

```typescript
const manager = new MultiChainManager({
  chains: ['arbitrum', 'optimism']
});

// ❌ Wrong
await manager.executeOnChain('polygon', operation); // Error!

// ✅ Correct
manager.addChain('polygon');
await manager.executeOnChain('polygon', operation); // Now OK
```

---

## 🔗 Related Packages

- **[@symbiosedb/core](../core)** - Core database connectors (includes EthereumConnector)
- **[@symbiosedb/sdk](../sdk)** - Client SDK with blockchain attestation support
- **[@symbiosedb/api](../api)** - REST API with blockchain endpoints

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

---

## 📄 License

MIT © [SymbioseDB](https://github.com/symbiosedb/symbiosedb)

---

**Built with ❤️ by the SymbioseDB team**
