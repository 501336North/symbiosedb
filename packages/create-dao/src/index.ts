#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import ora from 'ora';
import * as fs from 'fs-extra';
import * as path from 'path';

const program = new Command();

interface CreateDAOOptions {
  template?: string;
  typescript?: boolean;
  skipInstall?: boolean;
}

const TEMPLATES = {
  'governance': {
    name: 'DAO Governance',
    description: 'Standard DAO with proposals, voting, and execution',
    features: ['Proposals', 'Voting', 'Execution', 'Treasury', 'Blockchain attestations']
  },
  'ai-governance': {
    name: 'AI-Governed DAO',
    description: 'DAO that governs AI agents with verifiable decisions',
    features: ['AI Agents', 'Verifiable queries', 'DAO voting on AI', 'Blockchain proofs', 'Audit trails']
  },
  'investment': {
    name: 'Investment DAO',
    description: 'Investment DAO with fund pooling and distribution',
    features: ['Fund pooling', 'Investment proposals', 'Voting', 'Distribution', 'Treasury management']
  },
  'social': {
    name: 'Social DAO',
    description: 'Community DAO with members, roles, and reputation',
    features: ['Member registry', 'Roles & permissions', 'Reputation system', 'Token-gating', 'Social features']
  }
};

program
  .name('create-symbiosedb-dao')
  .description('Create a DAO + AI app with SymbioseDB in 30 minutes')
  .version('0.1.0')
  .argument('[project-name]', 'Name of your DAO project')
  .option('-t, --template <template>', 'Template to use (governance, ai-governance, investment, social)')
  .option('--typescript', 'Use TypeScript (default: true)', true)
  .option('--skip-install', 'Skip npm install')
  .action(async (projectName: string | undefined, options: CreateDAOOptions) => {
    console.log(chalk.blue.bold('\n🚀 Welcome to SymbioseDB DAO Creator\n'));

    // Get project name if not provided
    if (!projectName) {
      const response = await prompts({
        type: 'text',
        name: 'projectName',
        message: 'What is your DAO project name?',
        initial: 'my-dao'
      });
      projectName = response.projectName;
    }

    if (!projectName) {
      console.log(chalk.red('❌ Project name is required'));
      process.exit(1);
    }

    // Get template if not provided
    let template = options.template;
    if (!template) {
      const response = await prompts({
        type: 'select',
        name: 'template',
        message: 'Which template would you like to use?',
        choices: Object.entries(TEMPLATES).map(([key, value]) => ({
          title: `${value.name} - ${value.description}`,
          value: key,
          description: value.features.join(', ')
        }))
      });
      template = response.template;
    }

    if (!template || !TEMPLATES[template as keyof typeof TEMPLATES]) {
      console.log(chalk.red(`❌ Invalid template: ${template}`));
      console.log(chalk.yellow('Available templates:'), Object.keys(TEMPLATES).join(', '));
      process.exit(1);
    }

    const projectPath = path.join(process.cwd(), projectName);

    // Check if directory exists
    if (await fs.pathExists(projectPath)) {
      console.log(chalk.red(`❌ Directory ${projectName} already exists`));
      process.exit(1);
    }

    // Create project
    const spinner = ora('Creating your DAO project...').start();

    try {
      await fs.ensureDir(projectPath);

      // Generate project based on template
      await generateProject(projectPath, template as keyof typeof TEMPLATES, options);

      spinner.succeed(chalk.green('✅ Project created successfully!'));

      // Install dependencies
      if (!options.skipInstall) {
        const installSpinner = ora('Installing dependencies...').start();
        const { execSync } = require('child_process');
        try {
          execSync('npm install', { cwd: projectPath, stdio: 'ignore' });
          installSpinner.succeed(chalk.green('✅ Dependencies installed!'));
        } catch (error) {
          installSpinner.fail(chalk.yellow('⚠️  Failed to install dependencies. Run npm install manually.'));
        }
      }

      // Show next steps
      console.log(chalk.green.bold('\n✨ Your DAO is ready!\n'));
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.white(`  cd ${projectName}`));
      if (options.skipInstall) {
        console.log(chalk.white('  npm install'));
      }
      console.log(chalk.white('  npm run dev\n'));
      console.log(chalk.gray('📖 Read the README.md for more information'));
      console.log(chalk.gray('🌐 Deploy with: npm run deploy\n'));

    } catch (error) {
      spinner.fail(chalk.red('❌ Failed to create project'));
      console.error(error);
      process.exit(1);
    }
  });

async function generateProject(
  projectPath: string,
  template: keyof typeof TEMPLATES,
  options: CreateDAOOptions
) {
  const projectName = path.basename(projectPath);

  // Create package.json
  await fs.writeJSON(path.join(projectPath, 'package.json'), {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      deploy: 'vercel'
    },
    dependencies: {
      '@symbiosedb/sdk': '^0.1.0',
      '@symbiosedb/dao': '^0.1.0',
      '@symbiosedb/ai': '^0.1.0',
      next: '^14.0.0',
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      ethers: '^6.9.0',
      openai: '^4.20.0'
    },
    devDependencies: options.typescript ? {
      '@types/node': '^20.0.0',
      '@types/react': '^18.2.0',
      typescript: '^5.0.0'
    } : {}
  }, { spaces: 2 });

  // Create README
  await createREADME(projectPath, template, projectName);

  // Create config file
  await createConfig(projectPath, template);

  // Create template-specific files
  switch (template) {
    case 'ai-governance':
      await createAIGovernanceTemplate(projectPath, options);
      break;
    case 'governance':
      await createGovernanceTemplate(projectPath, options);
      break;
    case 'investment':
      await createInvestmentTemplate(projectPath, options);
      break;
    case 'social':
      await createSocialTemplate(projectPath, options);
      break;
  }

  // Create .env.example
  await createEnvExample(projectPath);

  // Create .gitignore
  await fs.writeFile(path.join(projectPath, '.gitignore'), `
node_modules
.next
.env.local
.vercel
dist
*.log
  `.trim());
}

async function createREADME(projectPath: string, template: keyof typeof TEMPLATES, projectName: string) {
  const templateInfo = TEMPLATES[template];

  const readme = `# ${projectName}

${templateInfo.description}

## Features

${templateInfo.features.map(f => `- ✅ ${f}`).join('\n')}

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see your DAO dashboard.

## What You Get

### DAO Governance
- Create proposals
- Vote on proposals (token-weighted)
- Execute approved proposals
- View blockchain attestations

### AI Integration (if enabled)
- AI agents with verifiable queries
- Every AI decision has blockchain proof
- DAO can govern AI behavior
- Audit trail of all AI decisions

### Token-Gating
- Access control based on token ownership
- Automatic wallet verification
- Blockchain-backed permissions

### Admin Dashboard
- Manage proposals
- View members
- Monitor AI agents
- Check blockchain proofs

## Architecture

\`\`\`
${projectName}/
├── app/              # Next.js app (pages)
├── components/       # React components
├── lib/              # SymbioseDB SDK usage
├── public/           # Static files
└── config.ts         # DAO configuration
\`\`\`

## Deploy

\`\`\`bash
npm run deploy
\`\`\`

Deploys to Vercel with one command.

## Learn More

- [SymbioseDB Documentation](https://symbiosedb.com/docs)
- [DAO Templates](https://github.com/symbiosedb/templates)
- [Discord Community](https://discord.gg/symbiosedb)

## License

MIT
`;

  await fs.writeFile(path.join(projectPath, 'README.md'), readme);
}

async function createConfig(projectPath: string, template: keyof typeof TEMPLATES) {
  const config = `// DAO Configuration
export const config = {
  dao: {
    name: 'My DAO',
    description: '${TEMPLATES[template].description}',
    token: {
      address: process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '',
      minVotingTokens: 1,
    },
    governance: {
      votingPeriod: 7 * 24 * 60 * 60, // 7 days in seconds
      quorum: 0.1, // 10% of total tokens
      proposalThreshold: 100, // Min tokens to create proposal
    },
  },
  blockchain: {
    network: process.env.NEXT_PUBLIC_NETWORK || 'arbitrum',
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || '',
  },
  ai: {
    model: 'gpt-4',
    verifiable: true, // All AI queries get blockchain attestations
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
};
`;

  await fs.writeFile(path.join(projectPath, 'config.ts'), config);
}

async function createEnvExample(projectPath: string) {
  const env = `# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mydb

# Blockchain
NEXT_PUBLIC_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_NETWORK=arbitrum
NEXT_PUBLIC_RPC_URL=https://arb1.arbitrum.io/rpc

# AI (Optional)
OPENAI_API_KEY=sk-...

# SymbioseDB
SYMBIOSEDB_API_KEY=your-api-key
`;

  await fs.writeFile(path.join(projectPath, '.env.example'), env);
}

async function createAIGovernanceTemplate(projectPath: string, options: CreateDAOOptions) {
  // Create app directory structure
  await fs.ensureDir(path.join(projectPath, 'app'));
  await fs.ensureDir(path.join(projectPath, 'components'));
  await fs.ensureDir(path.join(projectPath, 'lib'));

  // Create main page
  const mainPage = `import { DAODashboard } from '../components/DAODashboard';
import { AIAgentPanel } from '../components/AIAgentPanel';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">AI-Governed DAO</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <DAODashboard />
        <AIAgentPanel />
      </div>
    </main>
  );
}
`;

  await fs.writeFile(path.join(projectPath, 'app', 'page.tsx'), mainPage);

  // Create lib/symbiose.ts with SDK usage
  const symbioseLib = `import { SymbioseDB } from '@symbiosedb/sdk';
import { config } from '../config';

// Initialize SymbioseDB
export const symbiose = new SymbioseDB({
  apiKey: process.env.SYMBIOSEDB_API_KEY!,
  database: config.database.url,
});

// DAO helpers
export const dao = {
  async createProposal(title: string, description: string, executable: () => Promise<void>) {
    return await symbiose.dao.createProposal({
      title,
      description,
      executable,
      votingPeriod: config.dao.governance.votingPeriod,
    });
  },

  async vote(proposalId: string, vote: 'yes' | 'no', tokens: number) {
    return await symbiose.dao.vote({
      proposalId,
      vote,
      tokens,
    });
  },

  async execute(proposalId: string) {
    return await symbiose.dao.execute(proposalId);
  },

  async getProposals() {
    return await symbiose.dao.getProposals();
  },
};

// AI helpers with blockchain verification
export const ai = {
  async query(prompt: string, context?: any) {
    return await symbiose.ai.verifiableQuery({
      prompt,
      context,
      model: config.ai.model,
      verifiable: config.ai.verifiable, // Blockchain attestation created
    });
  },

  async getDecisions() {
    return await symbiose.ai.getDecisions();
  },

  async verifyDecision(decisionId: string) {
    return await symbiose.ai.verifyOnBlockchain(decisionId);
  },
};

// Token-gating helper
export function tokenGate(minTokens: number) {
  return symbiose.tokenGate({
    token: config.dao.token.address,
    minAmount: minTokens,
  });
}
`;

  await fs.writeFile(path.join(projectPath, 'lib', 'symbiose.ts'), symbioseLib);

  // Create DAO Dashboard component
  const daoDashboard = `'use client';

import { useState, useEffect } from 'react';
import { dao } from '../lib/symbiose';

export function DAODashboard() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProposals();
  }, []);

  async function loadProposals() {
    const data = await dao.getProposals();
    setProposals(data);
    setLoading(false);
  }

  async function handleVote(proposalId: string, vote: 'yes' | 'no') {
    await dao.vote(proposalId, vote, 100); // 100 tokens
    await loadProposals();
  }

  if (loading) return <div>Loading proposals...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Governance Proposals</h2>

      {proposals.length === 0 ? (
        <p className="text-gray-500">No proposals yet</p>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal: any) => (
            <div key={proposal.id} className="border rounded p-4">
              <h3 className="font-semibold">{proposal.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{proposal.description}</p>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleVote(proposal.id, 'yes')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Vote Yes ({proposal.votesYes})
                </button>
                <button
                  onClick={() => handleVote(proposal.id, 'no')}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Vote No ({proposal.votesNo})
                </button>
              </div>

              {proposal.blockchainProof && (
                <div className="mt-2 text-xs text-gray-500">
                  ✅ Verified on blockchain: {proposal.blockchainProof.slice(0, 10)}...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
`;

  await fs.writeFile(path.join(projectPath, 'components', 'DAODashboard.tsx'), daoDashboard);

  // Create AI Agent Panel component
  const aiAgentPanel = `'use client';

import { useState, useEffect } from 'react';
import { ai } from '../lib/symbiose';

export function AIAgentPanel() {
  const [query, setQuery] = useState('');
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDecisions();
  }, []);

  async function loadDecisions() {
    const data = await ai.getDecisions();
    setDecisions(data);
  }

  async function handleQuery() {
    setLoading(true);
    try {
      const result = await ai.query(query);
      await loadDecisions();
      setQuery('');
    } finally {
      setLoading(false);
    }
  }

  async function verifyDecision(decisionId: string) {
    const proof = await ai.verifyDecision(decisionId);
    alert(\`Verified on blockchain: \${proof.transactionHash}\`);
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">AI Agent</h2>

      <div className="mb-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask the AI agent a question..."
          className="w-full p-3 border rounded"
          rows={3}
        />
        <button
          onClick={handleQuery}
          disabled={loading || !query}
          className="mt-2 px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          {loading ? 'Querying...' : 'Submit Query'}
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Recent AI Decisions</h3>
        {decisions.length === 0 ? (
          <p className="text-gray-500 text-sm">No decisions yet</p>
        ) : (
          decisions.map((decision: any) => (
            <div key={decision.id} className="border rounded p-3 text-sm">
              <p className="font-medium">{decision.prompt}</p>
              <p className="text-gray-600 mt-1">{decision.response}</p>

              {decision.blockchainProof && (
                <button
                  onClick={() => verifyDecision(decision.id)}
                  className="mt-2 text-blue-500 hover:text-blue-700 text-xs"
                >
                  🔗 Verify on blockchain
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
`;

  await fs.writeFile(path.join(projectPath, 'components', 'AIAgentPanel.tsx'), aiAgentPanel);

  // Create global CSS
  const globalCSS = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;

  await fs.ensureDir(path.join(projectPath, 'app'));
  await fs.writeFile(path.join(projectPath, 'app', 'globals.css'), globalCSS);

  // Create layout
  const layout = `import './globals.css';

export const metadata = {
  title: 'AI-Governed DAO',
  description: 'DAO that governs AI agents with verifiable decisions',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`;

  await fs.writeFile(path.join(projectPath, 'app', 'layout.tsx'), layout);

  // Create Tailwind config
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;

  await fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfig);

  // Create PostCSS config
  const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  await fs.writeFile(path.join(projectPath, 'postcss.config.js'), postcssConfig);

  // Create next.config
  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {};

module.exports = nextConfig;
`;

  await fs.writeFile(path.join(projectPath, 'next.config.js'), nextConfig);

  // Create tsconfig if TypeScript
  if (options.typescript) {
    const tsconfig = `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

    await fs.writeFile(path.join(projectPath, 'tsconfig.json'), tsconfig);
  }
}

async function createGovernanceTemplate(projectPath: string, options: CreateDAOOptions) {
  // Similar to AI governance but without AI components
  // Simplified version for pure DAO governance
  await createAIGovernanceTemplate(projectPath, options);

  // Remove AI-specific files
  await fs.remove(path.join(projectPath, 'components', 'AIAgentPanel.tsx'));

  // Update main page to only show DAO dashboard
  const mainPage = `import { DAODashboard } from '../components/DAODashboard';

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-8">DAO Governance</h1>
      <DAODashboard />
    </main>
  );
}
`;

  await fs.writeFile(path.join(projectPath, 'app', 'page.tsx'), mainPage);
}

async function createInvestmentTemplate(projectPath: string, options: CreateDAOOptions) {
  // Use governance template as base
  await createGovernanceTemplate(projectPath, options);

  // Add investment-specific components
  const treasuryComponent = `'use client';

export function TreasuryPanel() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4">Treasury</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Total Funds</p>
          <p className="text-2xl font-bold">$1,000,000</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Investments</p>
          <p className="text-2xl font-bold">5</p>
        </div>
        <div className="border rounded p-4">
          <p className="text-sm text-gray-600">Returns</p>
          <p className="text-2xl font-bold text-green-600">+15%</p>
        </div>
      </div>
    </div>
  );
}
`;

  await fs.writeFile(path.join(projectPath, 'components', 'TreasuryPanel.tsx'), treasuryComponent);
}

async function createSocialTemplate(projectPath: string, options: CreateDAOOptions) {
  // Use governance template as base
  await createGovernanceTemplate(projectPath, options);

  // Add social-specific components
  const membersComponent = `'use client';

export function MembersPanel() {
  return (
    <div className="bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-2xl font-bold mb-4">Members</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div>
            <p className="font-medium">0x1234...5678</p>
            <p className="text-sm text-gray-600">Role: Core Member</p>
          </div>
          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
            1,000 tokens
          </span>
        </div>
      </div>
    </div>
  );
}
`;

  await fs.writeFile(path.join(projectPath, 'components', 'MembersPanel.tsx'), membersComponent);
}

program.parse();
