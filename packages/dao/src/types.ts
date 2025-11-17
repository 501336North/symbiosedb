/**
 * DAO Types
 */

export interface DAO {
  id: string;
  name: string;
  description: string;
  token: string;
  governance: GovernanceConfig;
  createdAt: Date;
  blockchainProof: string;
}

export interface GovernanceConfig {
  votingPeriod: number;
  quorum: number;
  proposalThreshold: number;
}

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'failed' | 'executed';
  votesYes: number;
  votesNo: number;
  createdAt: Date;
  votingEnds: Date;
  blockchainProof: string;
  executable?: () => Promise<void>;
  executedAt?: Date;
  executionProof?: string;
}

export interface Vote {
  proposalId: string;
  voter: string;
  vote: 'yes' | 'no';
  tokens: number;
  timestamp: Date;
  blockchainProof: string;
}
