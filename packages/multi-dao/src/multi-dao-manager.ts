/**
 * MultiDAOManager - Manages multiple DAOs
 * (TDD Implementation)
 */

import type { DAO, DAOMember, DAOStats, MultiDAOConfig, MemberRole, ChainName } from './types';

let daoIdCounter = 0;

export class MultiDAOManager {
  private daos: Map<string, DAO>;
  private members: Map<string, DAOMember[]>; // Key: daoId
  private config: MultiDAOConfig;

  constructor(config: MultiDAOConfig = {}) {
    this.daos = new Map();
    this.members = new Map();
    this.config = {
      maxDAOs: config.maxDAOs || 100,
      allowCrossDAOActions: config.allowCrossDAOActions !== false,
      defaultChain: config.defaultChain || 'ethereum',
    };
  }

  /**
   * Create a new DAO
   */
  createDAO(data: Omit<DAO, 'id' | 'createdAt'>): DAO {
    // Check max DAO limit
    if (this.config.maxDAOs && this.daos.size >= this.config.maxDAOs) {
      throw new Error('Maximum DAO limit reached');
    }

    // Check for duplicate address on same chain
    const existing = Array.from(this.daos.values()).find(
      (dao) => dao.address === data.address && dao.chain === data.chain
    );

    if (existing) {
      throw new Error(`DAO with address ${data.address} on ${data.chain} already exists`);
    }

    // Create DAO
    const dao: DAO = {
      id: `dao-${++daoIdCounter}`,
      name: data.name,
      description: data.description,
      address: data.address,
      chain: data.chain,
      tokenAddress: data.tokenAddress,
      governanceType: data.governanceType,
      createdAt: Date.now(),
      metadata: data.metadata,
    };

    this.daos.set(dao.id, dao);
    this.members.set(dao.id, []); // Initialize empty members array

    return dao;
  }

  /**
   * Get DAO by ID
   */
  getDAO(id: string): DAO | undefined {
    return this.daos.get(id);
  }

  /**
   * Get all DAOs
   */
  getAllDAOs(): DAO[] {
    return Array.from(this.daos.values());
  }

  /**
   * Get DAOs by chain
   */
  getDAOsByChain(chain: ChainName): DAO[] {
    return this.getAllDAOs().filter((dao) => dao.chain === chain);
  }

  /**
   * Get DAO count
   */
  getDAOCount(): number {
    return this.daos.size;
  }

  /**
   * Update DAO
   */
  updateDAO(id: string, updates: Partial<Omit<DAO, 'id' | 'address' | 'chain' | 'createdAt'>>): DAO {
    const dao = this.daos.get(id);

    if (!dao) {
      throw new Error('DAO not found');
    }

    // Update DAO (don't allow changing address, chain, or createdAt)
    const updated: DAO = {
      ...dao,
      ...updates,
      id: dao.id,
      address: dao.address,
      chain: dao.chain,
      createdAt: dao.createdAt,
    };

    this.daos.set(id, updated);
    return updated;
  }

  /**
   * Delete DAO
   */
  deleteDAO(id: string): boolean {
    const deleted = this.daos.delete(id);

    if (deleted) {
      // Also delete all members
      this.members.delete(id);
    }

    return deleted;
  }

  /**
   * Add member to DAO
   */
  addMember(daoId: string, memberData: Omit<DAOMember, 'daoId' | 'joinedAt'>): DAOMember {
    const dao = this.daos.get(daoId);

    if (!dao) {
      throw new Error('DAO not found');
    }

    const daoMembers = this.members.get(daoId) || [];

    // Check for duplicate member
    const existing = daoMembers.find((m) => m.address === memberData.address);

    if (existing) {
      throw new Error(`Address ${memberData.address} is already a member of this DAO`);
    }

    // Create member
    const member: DAOMember = {
      daoId,
      address: memberData.address,
      role: memberData.role,
      joinedAt: Date.now(),
      votingPower: memberData.votingPower,
      metadata: memberData.metadata,
    };

    daoMembers.push(member);
    this.members.set(daoId, daoMembers);

    return member;
  }

  /**
   * Get DAO members
   */
  getMembers(daoId: string): DAOMember[] {
    return this.members.get(daoId) || [];
  }

  /**
   * Remove member from DAO
   */
  removeMember(daoId: string, address: string): boolean {
    const daoMembers = this.members.get(daoId);

    if (!daoMembers) {
      return false;
    }

    const index = daoMembers.findIndex((m) => m.address === address);

    if (index === -1) {
      return false;
    }

    daoMembers.splice(index, 1);
    this.members.set(daoId, daoMembers);

    return true;
  }

  /**
   * Update member role
   */
  updateMemberRole(daoId: string, address: string, role: MemberRole): DAOMember {
    const daoMembers = this.members.get(daoId);

    if (!daoMembers) {
      throw new Error('DAO not found');
    }

    const member = daoMembers.find((m) => m.address === address);

    if (!member) {
      throw new Error('Member not found');
    }

    member.role = role;
    this.members.set(daoId, daoMembers);

    return member;
  }

  /**
   * Get member count for DAO
   */
  getMemberCount(daoId: string): number {
    const daoMembers = this.members.get(daoId);
    return daoMembers ? daoMembers.length : 0;
  }

  /**
   * Get DAO statistics
   */
  getDAOStats(daoId: string): DAOStats {
    const dao = this.daos.get(daoId);

    if (!dao) {
      throw new Error('DAO not found');
    }

    const memberCount = this.getMemberCount(daoId);

    return {
      daoId,
      memberCount,
      proposalCount: 0, // Would come from proposal system
      activeProposals: 0,
      totalVotes: 0,
      lastActivity: Date.now(),
    };
  }
}
