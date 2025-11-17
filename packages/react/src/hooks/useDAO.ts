/**
 * useDAO Hook - DAO management with proposals and voting
 * (TDD Implementation)
 */

import { useState, useEffect, useCallback } from 'react';
import type { DAOConfig, Proposal, UseDAOReturn } from '../types';

/**
 * Mock in-memory storage for testing
 * In production, this would interact with smart contracts
 */
const proposalsStore = new Map<string, Proposal[]>();
let proposalIdCounter = 0;

export function useDAO(daoConfig: DAOConfig): UseDAOReturn {
  const [dao, setDao] = useState<DAOConfig | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize DAO
  useEffect(() => {
    const initializeDAO = async () => {
      setLoading(true);
      setError(null);

      try {
        // Validate DAO address
        if (daoConfig.address === 'invalid' || daoConfig.address.length < 42) {
          throw new Error('Invalid DAO address');
        }

        // Load DAO configuration
        setDao(daoConfig);

        // Load existing proposals
        const existingProposals = proposalsStore.get(daoConfig.address) || [];
        setProposals(existingProposals);

        setLoading(false);
      } catch (err) {
        setError(err as Error);
        setLoading(false);
      }
    };

    initializeDAO();
  }, [daoConfig.address]);

  /**
   * Create a new proposal
   */
  const createProposal = useCallback(
    async (
      proposalData: Omit<
        Proposal,
        'id' | 'proposer' | 'status' | 'votesFor' | 'votesAgainst' | 'votesAbstain' | 'createdAt'
      >
    ): Promise<string> => {
      // Validate proposal
      if (!proposalData.title || proposalData.title.trim() === '') {
        throw new Error('Proposal title is required');
      }

      if (proposalData.endBlock <= proposalData.startBlock) {
        throw new Error('End block must be after start block');
      }

      // Create proposal
      const proposalId = `proposal-${++proposalIdCounter}`;
      const newProposal: Proposal = {
        id: proposalId,
        title: proposalData.title,
        description: proposalData.description,
        proposer: '0x0000000000000000000000000000000000000001', // Mock proposer
        status: 'active',
        votesFor: '0',
        votesAgainst: '0',
        votesAbstain: '0',
        startBlock: proposalData.startBlock,
        endBlock: proposalData.endBlock,
        createdAt: Date.now(),
        actions: proposalData.actions,
      };

      // Store proposal
      const daoProposals = proposalsStore.get(daoConfig.address) || [];
      daoProposals.unshift(newProposal); // Add to beginning
      proposalsStore.set(daoConfig.address, daoProposals);

      // Update state
      setProposals([...daoProposals]);

      return proposalId;
    },
    [daoConfig.address]
  );

  /**
   * Vote on a proposal
   */
  const vote = useCallback(
    async (proposalId: string, support: 'for' | 'against' | 'abstain'): Promise<void> => {
      const daoProposals = proposalsStore.get(daoConfig.address) || [];
      const proposalIndex = daoProposals.findIndex((p) => p.id === proposalId);

      if (proposalIndex === -1) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      const proposal = daoProposals[proposalIndex];

      // Mock vote weight (would come from token balance in production)
      const voteWeight = '1000000000000000000'; // 1 token in wei

      // Update vote counts
      if (support === 'for') {
        proposal.votesFor = (BigInt(proposal.votesFor) + BigInt(voteWeight)).toString();
      } else if (support === 'against') {
        proposal.votesAgainst = (BigInt(proposal.votesAgainst) + BigInt(voteWeight)).toString();
      } else if (support === 'abstain') {
        proposal.votesAbstain = (BigInt(proposal.votesAbstain) + BigInt(voteWeight)).toString();
      }

      // Update proposal status based on votes
      const totalVotes = BigInt(proposal.votesFor) + BigInt(proposal.votesAgainst) + BigInt(proposal.votesAbstain);
      if (totalVotes > 0n) {
        if (BigInt(proposal.votesFor) > BigInt(proposal.votesAgainst)) {
          proposal.status = 'succeeded';
        } else if (BigInt(proposal.votesAgainst) > BigInt(proposal.votesFor)) {
          proposal.status = 'defeated';
        }
      }

      proposalsStore.set(daoConfig.address, daoProposals);
      setProposals([...daoProposals]);
    },
    [daoConfig.address]
  );

  /**
   * Execute a proposal
   */
  const execute = useCallback(
    async (proposalId: string): Promise<void> => {
      const daoProposals = proposalsStore.get(daoConfig.address) || [];
      const proposalIndex = daoProposals.findIndex((p) => p.id === proposalId);

      if (proposalIndex === -1) {
        throw new Error(`Proposal ${proposalId} not found`);
      }

      const proposal = daoProposals[proposalIndex];

      // Check if proposal succeeded
      if (proposal.status !== 'succeeded') {
        throw new Error(`Proposal has not succeeded (current status: ${proposal.status})`);
      }

      // Execute proposal
      proposal.status = 'executed';

      proposalsStore.set(daoConfig.address, daoProposals);
      setProposals([...daoProposals]);
    },
    [daoConfig.address]
  );

  /**
   * Refetch DAO data
   */
  const refetch = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Reload proposals
      const daoProposals = proposalsStore.get(daoConfig.address) || [];
      setProposals([...daoProposals]);

      setLoading(false);
    } catch (err) {
      setError(err as Error);
      setLoading(false);
    }
  }, [daoConfig.address]);

  return {
    dao,
    proposals,
    loading,
    error,
    createProposal,
    vote,
    execute,
    refetch,
  };
}
