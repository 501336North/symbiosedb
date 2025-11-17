/**
 * React Component Types for SymbioseDB
 */

import type { ChainName } from '@symbiosedb/blockchain';

/**
 * DAO Configuration
 */
export interface DAOConfig {
  address: string;
  chain: ChainName;
  name: string;
  description?: string;
  tokenAddress?: string;
  governanceType: 'token-weighted' | 'one-person-one-vote' | 'quadratic';
}

/**
 * Proposal data structure
 */
export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'pending' | 'active' | 'succeeded' | 'defeated' | 'executed';
  votesFor: string;
  votesAgainst: string;
  votesAbstain: string;
  startBlock: number;
  endBlock: number;
  createdAt: number;
  actions?: ProposalAction[];
}

/**
 * Proposal action (e.g., transfer funds, call function)
 */
export interface ProposalAction {
  target: string;
  value: string;
  signature: string;
  calldata: string;
}

/**
 * Vote record
 */
export interface Vote {
  proposalId: string;
  voter: string;
  support: 'for' | 'against' | 'abstain';
  weight: string;
  reason?: string;
  timestamp: number;
}

/**
 * Token gate configuration
 */
export interface TokenGateConfig {
  tokenAddress: string;
  chain: ChainName;
  minBalance: string;
  tokenType: 'erc20' | 'erc721' | 'erc1155';
  tokenId?: string; // For ERC-1155
}

/**
 * Hook return type for useDAO
 */
export interface UseDAOReturn {
  dao: DAOConfig | null;
  proposals: Proposal[];
  loading: boolean;
  error: Error | null;
  createProposal: (proposal: Omit<Proposal, 'id' | 'proposer' | 'status' | 'votesFor' | 'votesAgainst' | 'votesAbstain' | 'createdAt'>) => Promise<string>;
  vote: (proposalId: string, support: 'for' | 'against' | 'abstain') => Promise<void>;
  execute: (proposalId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook return type for useProposal
 */
export interface UseProposalReturn {
  proposal: Proposal | null;
  votes: Vote[];
  loading: boolean;
  error: Error | null;
  vote: (support: 'for' | 'against' | 'abstain', reason?: string) => Promise<void>;
  execute: () => Promise<void>;
  refetch: () => Promise<void>;
}

/**
 * Hook return type for useTokenGate
 */
export interface UseTokenGateReturn {
  hasAccess: boolean;
  balance: string;
  loading: boolean;
  error: Error | null;
  checkAccess: (address: string) => Promise<boolean>;
  refetch: () => Promise<void>;
}
