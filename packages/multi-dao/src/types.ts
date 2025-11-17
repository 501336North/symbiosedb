/**
 * Multi-DAO Types for SymbioseDB
 */

import type { ChainName } from '@symbiosedb/blockchain';

// Re-export ChainName for convenience
export type { ChainName };

/**
 * DAO configuration
 */
export interface DAO {
  id: string;
  name: string;
  description: string;
  address: string;
  chain: ChainName;
  tokenAddress?: string;
  governanceType: 'token-weighted' | 'one-person-one-vote' | 'quadratic';
  createdAt: number;
  metadata?: Record<string, any>;
}

/**
 * DAO member
 */
export interface DAOMember {
  daoId: string;
  address: string;
  role: MemberRole;
  joinedAt: number;
  votingPower?: string;
  metadata?: Record<string, any>;
}

/**
 * Member roles
 */
export type MemberRole = 'owner' | 'admin' | 'member' | 'observer';

/**
 * Cross-DAO coordination
 */
export interface CrossDAOAction {
  id: string;
  sourceDAO: string;
  targetDAOs: string[];
  action: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected';
  createdAt: number;
  executedAt?: number;
  metadata?: Record<string, any>;
}

/**
 * DAO stats
 */
export interface DAOStats {
  daoId: string;
  memberCount: number;
  proposalCount: number;
  activeProposals: number;
  totalVotes: number;
  treasuryBalance?: string;
  lastActivity: number;
}

/**
 * Multi-DAO manager configuration
 */
export interface MultiDAOConfig {
  maxDAOs?: number;
  allowCrossDAOActions?: boolean;
  defaultChain?: ChainName;
}
