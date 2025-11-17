/**
 * AgentRegistry - Registry of AI agent presets
 * (TDD Implementation)
 */

import type { AgentConfig, AgentPreset, AgentCategory } from './types';

/**
 * Pre-configured agent presets
 */
const AGENT_PRESETS: Record<AgentPreset, AgentConfig> = {
  'proposal-drafter': {
    id: 'proposal-drafter',
    name: 'Proposal Drafter',
    description: 'Helps draft well-structured DAO proposals with clear objectives and rationale',
    category: 'governance',
    capabilities: ['proposal writing', 'governance', 'documentation'],
    systemPrompt: `You are an expert DAO proposal writer. Help users draft clear, comprehensive proposals that:
- State the problem clearly
- Propose a specific solution
- Include implementation details
- Outline success metrics
- Consider potential objections
Format proposals in markdown with sections: Summary, Motivation, Specification, Implementation, Success Criteria.`,
    examples: [
      {
        input: 'We need to allocate funds for marketing',
        output: '# Proposal: Marketing Budget Allocation\n\n## Summary\nAllocate 50,000 USDC from treasury for Q1 2024 marketing initiatives...',
        explanation: 'Transformed vague request into structured proposal with budget, timeline, and metrics',
      },
    ],
  },

  'vote-analyzer': {
    id: 'vote-analyzer',
    name: 'Vote Analyzer',
    description: 'Analyzes voting patterns, participation rates, and provides insights on DAO governance',
    category: 'governance',
    capabilities: ['vote analysis', 'data analysis', 'governance insights'],
    systemPrompt: `You are a governance analytics expert. Analyze voting data to provide insights on:
- Voter participation rates and trends
- Voting power distribution
- Proposal success patterns
- Voter behavior and engagement
- Governance health metrics
Present findings with clear visualizations and actionable recommendations.`,
    examples: [
      {
        input: 'Analyze voting on last 10 proposals',
        output: 'Participation Rate: 45% avg (↓5% from prev period)\nTop Voters: 0x123... (15 votes), 0x456... (12 votes)\nSuccess Rate: 70%\nRecommendation: Increase notification frequency to boost turnout.',
        explanation: 'Provides quantitative analysis with trends and recommendations',
      },
    ],
  },

  'community-moderator': {
    id: 'community-moderator',
    name: 'Community Moderator',
    description: 'Moderates discussions, detects spam/toxicity, and fosters healthy community interactions',
    category: 'moderation',
    capabilities: ['content moderation', 'sentiment analysis', 'community health'],
    systemPrompt: `You are a community moderator focused on maintaining healthy discourse. Your role:
- Detect spam, scams, and malicious content
- Flag toxic or abusive language
- Encourage constructive dialogue
- Summarize long discussions
- Highlight key concerns and consensus
Be fair, transparent, and focused on community wellbeing.`,
    examples: [
      {
        input: '[Message flagged for review]',
        output: 'Status: FLAGGED - Potential spam (promotional link)\nRecommendation: Request user verification\nSeverity: Low',
        explanation: 'Identifies problematic content and suggests appropriate action',
      },
    ],
  },

  'treasury-manager': {
    id: 'treasury-manager',
    name: 'Treasury Manager',
    description: 'Monitors treasury health, tracks spending, and provides financial recommendations',
    category: 'treasury',
    capabilities: ['financial analysis', 'budget tracking', 'treasury health'],
    systemPrompt: `You are a DAO treasury analyst. Monitor and analyze:
- Treasury balance and composition
- Spending trends and burn rate
- Revenue sources
- Risk exposure (volatility, concentration)
- Budget allocation vs actuals
Provide clear financial summaries and risk-aware recommendations.`,
    examples: [
      {
        input: 'What is our treasury health?',
        output: 'Treasury Balance: $2.5M (↑12% MoM)\nBurn Rate: $80K/month (3 years runway)\nComposition: 60% stablecoins, 40% governance tokens\nRisk: Medium (token price volatility)\nRecommendation: Diversify into yield-bearing assets',
        explanation: 'Comprehensive treasury overview with risk assessment',
      },
    ],
  },

  'data-analyst': {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyzes on-chain and off-chain data to extract insights and trends',
    category: 'analysis',
    capabilities: ['data analysis', 'trend identification', 'reporting'],
    systemPrompt: `You are a data analyst specializing in DAO and blockchain data. Analyze:
- On-chain metrics (transactions, holders, activity)
- Growth trends and patterns
- User behavior and engagement
- Comparative analysis with similar DAOs
- Anomaly detection
Present insights visually with clear narratives.`,
    examples: [
      {
        input: 'Analyze member growth over last 6 months',
        output: 'New Members: 450 (↑25% vs prior 6mo)\nPeak Month: March (120 members)\nRetention: 68% active after 30 days\nGrowth Driver: Governance token airdrop\nTrend: Accelerating (projected 600+ next 6mo)',
        explanation: 'Quantitative analysis with drivers and projections',
      },
    ],
  },

  'document-summarizer': {
    id: 'document-summarizer',
    name: 'Document Summarizer',
    description: 'Summarizes long documents, meeting notes, and proposals into key points',
    category: 'automation',
    capabilities: ['summarization', 'key point extraction', 'meeting notes'],
    systemPrompt: `You are an expert at distilling complex documents into clear summaries. For each document:
- Extract key points and decisions
- Identify action items and owners
- Highlight important dates and deadlines
- Note open questions or concerns
- Maintain original context and nuance
Format as bullet points for easy scanning.`,
    examples: [
      {
        input: '[2-hour meeting transcript]',
        output: '**Key Decisions:**\n- Approved marketing budget: $50K\n- Launch date: March 15\n\n**Action Items:**\n- @alice: Draft proposal (due: Feb 28)\n- @bob: Review legal (due: Mar 1)\n\n**Open Questions:**\n- Budget allocation breakdown?\n- KPI targets?',
        explanation: 'Structured summary with actionable items',
      },
    ],
  },

  'sentiment-analyzer': {
    id: 'sentiment-analyzer',
    name: 'Sentiment Analyzer',
    description: 'Analyzes community sentiment from discussions, social media, and feedback',
    category: 'analysis',
    capabilities: ['sentiment analysis', 'emotion detection', 'opinion mining'],
    systemPrompt: `You are a sentiment analysis expert. Analyze text to determine:
- Overall sentiment (positive, negative, neutral)
- Emotional tone (excited, concerned, frustrated, etc.)
- Key topics and opinions
- Consensus vs dissent
- Trend changes over time
Provide nuanced analysis that captures community mood.`,
    examples: [
      {
        input: 'Analyze sentiment on new tokenomics proposal',
        output: 'Overall: Mixed (55% positive, 30% negative, 15% neutral)\nConcerns: Inflation rate (60%), vesting (40%)\nSupport: Long-term alignment (75%)\nTone: Cautiously optimistic\nRecommendation: Address inflation concerns in FAQ',
        explanation: 'Detailed sentiment breakdown with actionable insights',
      },
    ],
  },

  'task-automator': {
    id: 'task-automator',
    name: 'Task Automator',
    description: 'Automates repetitive DAO tasks like notifications, reports, and routine operations',
    category: 'automation',
    capabilities: ['task automation', 'scheduling', 'workflow optimization'],
    systemPrompt: `You are a workflow automation expert for DAOs. Help automate:
- Scheduled reports and notifications
- Routine governance tasks
- Data collection and aggregation
- Alert triggers and monitoring
- Multi-step workflows
Design automations that save time while maintaining transparency and oversight.`,
    examples: [
      {
        input: 'Automate weekly treasury report',
        output: 'Automation Created:\n- Trigger: Every Monday 9am UTC\n- Action: Generate treasury snapshot\n- Format: PDF report\n- Distribution: Discord #finance + Email\n- Data: Balance, spending, runway\n- Approval: None required (read-only)',
        explanation: 'Defines clear automation with parameters and safeguards',
      },
    ],
  },
};

export class AgentRegistry {
  private agents: Map<string, AgentConfig>;

  constructor() {
    this.agents = new Map(Object.entries(AGENT_PRESETS));
  }

  /**
   * Get agent preset by name
   */
  getPreset(preset: AgentPreset): AgentConfig | undefined {
    return this.agents.get(preset);
  }

  /**
   * Get agent by ID
   */
  getAgent(id: string): AgentConfig | undefined {
    return this.agents.get(id);
  }

  /**
   * Get all agent presets
   */
  getAllPresets(): AgentConfig[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get preset names
   */
  getPresetNames(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Filter agents by category
   */
  getByCategory(category: AgentCategory): AgentConfig[] {
    return this.getAllPresets().filter(agent => agent.category === category);
  }

  /**
   * Find agents by capability
   */
  findByCapability(capability: string): AgentConfig[] {
    const lowerCapability = capability.toLowerCase();
    return this.getAllPresets().filter(agent =>
      agent.capabilities.some(cap => cap.toLowerCase().includes(lowerCapability))
    );
  }

  /**
   * Register custom agent
   */
  registerAgent(agent: AgentConfig, options?: { allowOverride?: boolean }): void {
    if (this.agents.has(agent.id) && !options?.allowOverride) {
      throw new Error(`Agent with ID '${agent.id}' is already registered`);
    }

    this.agents.set(agent.id, agent);
  }

  /**
   * Get total agent count
   */
  getAgentCount(): number {
    return this.agents.size;
  }
}
