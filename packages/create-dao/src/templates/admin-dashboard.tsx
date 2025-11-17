/**
 * Admin Dashboard Template
 *
 * Auto-generated admin interface for SymbioseDB
 * Accessible at /admin in the generated app
 */

export const AdminDashboardPage = `'use client';

import { useState, useEffect } from 'react';
import { symbiose } from '../../lib/symbiose';

type Tab = 'overview' | 'database' | 'dao' | 'ai' | 'blockchain' | 'api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">SymbioseDB Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Production</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4 space-y-1">
            <NavItem
              icon="📊"
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <NavItem
              icon="🗄️"
              label="Database"
              active={activeTab === 'database'}
              onClick={() => setActiveTab('database')}
            />
            <NavItem
              icon="🏛️"
              label="DAO Governance"
              active={activeTab === 'dao'}
              onClick={() => setActiveTab('dao')}
            />
            <NavItem
              icon="🤖"
              label="AI Agents"
              active={activeTab === 'ai'}
              onClick={() => setActiveTab('ai')}
            />
            <NavItem
              icon="🔗"
              label="Blockchain"
              active={activeTab === 'blockchain'}
              onClick={() => setActiveTab('blockchain')}
            />
            <NavItem
              icon="⚡"
              label="API"
              active={activeTab === 'api'}
              onClick={() => setActiveTab('api')}
            />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'database' && <DatabaseTab />}
          {activeTab === 'dao' && <DAOTab />}
          {activeTab === 'ai' && <AITab />}
          {activeTab === 'blockchain' && <BlockchainTab />}
          {activeTab === 'api' && <APITab />}
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={\`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors \${
        active
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-50'
      }\`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function OverviewTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard label="Total Proposals" value="12" change="+3 this week" />
        <StatCard label="Active Members" value="48" change="+12 this month" />
        <StatCard label="AI Queries" value="1,234" change="+234 today" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Activity">
          <div className="space-y-3">
            <Activity
              icon="🏛️"
              text="New proposal created: Upgrade AI model"
              time="2 hours ago"
            />
            <Activity
              icon="🤖"
              text="AI agent completed 50 queries"
              time="5 hours ago"
            />
            <Activity
              icon="✅"
              text="Proposal executed: Treasury allocation"
              time="1 day ago"
            />
          </div>
        </Card>

        <Card title="Database Stats">
          <div className="space-y-4">
            <DBStat label="SQL Tables" value="8" />
            <DBStat label="Vector Embeddings" value="10,234" />
            <DBStat label="Graph Nodes" value="1,456" />
            <DBStat label="Blockchain Attestations" value="234" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function DatabaseTab() {
  const [selectedDB, setSelectedDB] = useState<'sql' | 'vector' | 'graph' | 'blockchain'>('sql');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Database Browser</h2>

      <div className="flex gap-2 mb-6">
        <TabButton
          active={selectedDB === 'sql'}
          onClick={() => setSelectedDB('sql')}
          label="SQL"
        />
        <TabButton
          active={selectedDB === 'vector'}
          onClick={() => setSelectedDB('vector')}
          label="Vector"
        />
        <TabButton
          active={selectedDB === 'graph'}
          onClick={() => setSelectedDB('graph')}
          label="Graph"
        />
        <TabButton
          active={selectedDB === 'blockchain'}
          onClick={() => setSelectedDB('blockchain')}
          label="Blockchain"
        />
      </div>

      {selectedDB === 'sql' && <SQLBrowser />}
      {selectedDB === 'vector' && <VectorBrowser />}
      {selectedDB === 'graph' && <GraphBrowser />}
      {selectedDB === 'blockchain' && <BlockchainBrowser />}
    </div>
  );
}

function SQLBrowser() {
  return (
    <Card>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">SQL Query</label>
        <textarea
          className="w-full p-3 border rounded-lg font-mono text-sm"
          rows={4}
          placeholder="SELECT * FROM proposals WHERE status = 'active'"
          defaultValue="SELECT * FROM proposals LIMIT 10;"
        />
        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Run Query
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Title</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Votes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="px-4 py-2 text-sm">1</td>
              <td className="px-4 py-2 text-sm">Upgrade AI Model</td>
              <td className="px-4 py-2 text-sm">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Active</span>
              </td>
              <td className="px-4 py-2 text-sm">24 Yes / 3 No</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function VectorBrowser() {
  return (
    <Card>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Semantic Search</label>
        <input
          type="text"
          className="w-full p-3 border rounded-lg"
          placeholder="Search by meaning..."
        />
        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Search
        </button>
      </div>

      <div className="space-y-3">
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium">AI Model Selection</h4>
            <span className="text-sm text-gray-500">Similarity: 0.94</span>
          </div>
          <p className="text-sm text-gray-600">Discussion about choosing between GPT-4 and Claude...</p>
        </div>
      </div>
    </Card>
  );
}

function GraphBrowser() {
  return (
    <Card>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Cypher Query</label>
        <textarea
          className="w-full p-3 border rounded-lg font-mono text-sm"
          rows={3}
          placeholder="MATCH (n:Member)-[:VOTED_ON]->(p:Proposal) RETURN n, p"
        />
        <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
          Run Query
        </button>
      </div>

      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">Graph visualization would render here</p>
        <p className="text-sm text-gray-400 mt-2">Showing relationships between Members and Proposals</p>
      </div>
    </Card>
  );
}

function BlockchainBrowser() {
  return (
    <Card>
      <h3 className="font-semibold mb-4">Recent Attestations</h3>
      <div className="space-y-3">
        <AttestationItem
          action="PROPOSAL_CREATED"
          hash="0x1234...5678"
          time="2 hours ago"
        />
        <AttestationItem
          action="VOTE_CAST"
          hash="0x8765...4321"
          time="5 hours ago"
        />
        <AttestationItem
          action="AI_DECISION"
          hash="0xabcd...ef12"
          time="1 day ago"
        />
      </div>
    </Card>
  );
}

function DAOTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">DAO Governance</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Active Proposals">
          <div className="space-y-3">
            <ProposalItem
              title="Upgrade AI Model to GPT-4"
              status="active"
              votes={{ yes: 24, no: 3 }}
              timeLeft="5 days"
            />
            <ProposalItem
              title="Allocate Treasury Funds"
              status="active"
              votes={{ yes: 18, no: 8 }}
              timeLeft="3 days"
            />
          </div>
          <button className="mt-4 w-full px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50">
            Create New Proposal
          </button>
        </Card>

        <Card title="Governance Stats">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Proposals</span>
              <span className="font-semibold">48</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Passed</span>
              <span className="font-semibold text-green-600">32</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Failed</span>
              <span className="font-semibold text-red-600">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Voters</span>
              <span className="font-semibold">48</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AITab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">AI Agents</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="AI Query Console">
          <textarea
            className="w-full p-3 border rounded-lg mb-3"
            rows={4}
            placeholder="Ask your AI agent a question..."
          />
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              <span className="text-sm">Verifiable (blockchain proof)</span>
            </label>
          </div>
          <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Submit Query
          </button>
        </Card>

        <Card title="Recent Decisions">
          <div className="space-y-3">
            <AIDecisionItem
              query="Should we invest in Project X?"
              response="Based on analysis, recommend approval..."
              verified={true}
              time="2 hours ago"
            />
            <AIDecisionItem
              query="Summarize latest proposals"
              response="There are 3 active proposals..."
              verified={true}
              time="5 hours ago"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function BlockchainTab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Blockchain Attestations</h2>

      <Card>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Network</span>
            <span className="text-sm text-gray-600">Arbitrum One</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Attestations</span>
            <span className="text-sm text-gray-600">234</span>
          </div>
        </div>

        <h3 className="font-semibold mb-4">Recent Attestations</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="border rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">PROPOSAL_CREATED</span>
                <span className="text-xs text-gray-500">2 hours ago</span>
              </div>
              <div className="text-xs font-mono text-gray-600 mb-2">
                0x1234567890abcdef1234567890abcdef12345678
              </div>
              <a
                href="#"
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                View on Arbiscan →
              </a>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function APITab() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">API Playground</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Request">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-2">Endpoint</label>
            <select className="w-full p-2 border rounded-lg text-sm">
              <option>POST /dao/proposal</option>
              <option>POST /dao/vote</option>
              <option>POST /ai/query</option>
              <option>GET /blockchain/attestations</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-2">Body</label>
            <textarea
              className="w-full p-3 border rounded-lg font-mono text-sm"
              rows={8}
              defaultValue={\`{
  "title": "My Proposal",
  "description": "Description here",
  "votingPeriod": 604800
}\`}
            />
          </div>
          <button className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            Send Request
          </button>
        </Card>

        <Card title="Response">
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto">
            <code>{\`{
  "id": "proposal-123",
  "status": "active",
  "blockchainProof": "0x1234...5678",
  "createdAt": "2025-11-13T16:00:00Z"
}\`}</code>
          </pre>
        </Card>
      </div>

      <Card title="API Documentation" className="mt-6">
        <div className="space-y-3">
          <APIEndpoint
            method="POST"
            path="/dao/proposal"
            description="Create a new DAO proposal"
          />
          <APIEndpoint
            method="POST"
            path="/dao/vote"
            description="Vote on a proposal"
          />
          <APIEndpoint
            method="POST"
            path="/ai/query"
            description="Query AI agent with blockchain verification"
          />
          <APIEndpoint
            method="GET"
            path="/blockchain/attestations"
            description="Get blockchain attestations"
          />
        </div>
      </Card>
    </div>
  );
}

// Helper Components

function Card({ title, children, className = '' }: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={\`bg-white rounded-lg shadow-sm border border-gray-200 p-6 \${className}\`}>
      {title && <h3 className="font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  );
}

function StatCard({ label, value, change }: {
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="text-sm text-gray-600 mb-1">{label}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm text-green-600">{change}</div>
    </div>
  );
}

function Activity({ icon, text, time }: {
  icon: string;
  text: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-xl">{icon}</span>
      <div className="flex-1">
        <p className="text-sm">{text}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}

function DBStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, label }: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={\`px-4 py-2 rounded-lg font-medium transition-colors \${
        active
          ? 'bg-blue-500 text-white'
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
      }\`}
    >
      {label}
    </button>
  );
}

function AttestationItem({ action, hash, time }: {
  action: string;
  hash: string;
  time: string;
}) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex justify-between items-start mb-1">
        <span className="text-sm font-medium">{action}</span>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <div className="text-xs font-mono text-gray-600">{hash}</div>
    </div>
  );
}

function ProposalItem({ title, status, votes, timeLeft }: {
  title: string;
  status: string;
  votes: { yes: number; no: number };
  timeLeft: string;
}) {
  return (
    <div className="border rounded-lg p-3">
      <h4 className="font-medium mb-2">{title}</h4>
      <div className="flex justify-between text-sm text-gray-600">
        <span>{votes.yes} Yes / {votes.no} No</span>
        <span>{timeLeft} left</span>
      </div>
    </div>
  );
}

function AIDecisionItem({ query, response, verified, time }: {
  query: string;
  response: string;
  verified: boolean;
  time: string;
}) {
  return (
    <div className="border rounded-lg p-3">
      <p className="text-sm font-medium mb-1">{query}</p>
      <p className="text-sm text-gray-600 mb-2">{response}</p>
      <div className="flex justify-between items-center">
        {verified && (
          <span className="text-xs text-green-600">✓ Verified on blockchain</span>
        )}
        <span className="text-xs text-gray-500">{time}</span>
      </div>
    </div>
  );
}

function APIEndpoint({ method, path, description }: {
  method: string;
  path: string;
  description: string;
}) {
  const methodColor = method === 'POST' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';

  return (
    <div className="flex items-start gap-3 border-b pb-3 last:border-0">
      <span className={\`px-2 py-1 rounded text-xs font-mono \${methodColor}\`}>
        {method}
      </span>
      <div className="flex-1">
        <div className="font-mono text-sm">{path}</div>
        <div className="text-sm text-gray-600 mt-1">{description}</div>
      </div>
    </div>
  );
}
`;
