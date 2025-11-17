/**
 * SymbioseDB Types
 */

export interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer: string;
  status: 'pending' | 'active' | 'passed' | 'failed' | 'executed';
  votesYes: number;
  votesNo: number;
  createdAt: Date;
  votingEnds: Date;
  executable?: () => Promise<void>;
  blockchainProof?: string;
}

export interface Vote {
  proposalId: string;
  voter: string;
  vote: 'yes' | 'no';
  tokens: number;
  timestamp: Date;
  blockchainProof?: string;
}

export interface AIDecision {
  id: string;
  prompt: string;
  response: string;
  model: string;
  timestamp: Date;
  verifiable: boolean;
  blockchainProof?: string;
  daoApproved?: boolean;
}

export interface DAOConfig {
  name: string;
  description: string;
  token: string;
  governance: {
    votingPeriod: number;
    quorum: number;
    proposalThreshold: number;
  };
}

export interface Member {
  address: string;
  tokens: number;
  joinedAt: Date;
  role?: string;
}
