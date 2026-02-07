/**
 * API Utility for Auralis Multi-World Platform
 */

export const API_BASE_URL = '/api';

export interface World {
  world_id: string;
  name: string;
  creator: string;
  entry_fee: number;
  max_agents: number;
  active_agents: number;
  running: boolean;
  created_at: string;
}

export interface Agent {
  name: string;
  type: string;
  balance: number;
  portfolio_value: number;
  profit_loss: number;
  holdings: number;
  action_count: number;
  success_rate: number;
  resources: {
    materials: number;
    energy: number;
    information: number;
  };
}

export const auralisApi = {
  // Worlds
  async listWorlds(): Promise<World[]> {
    const res = await fetch(`${API_BASE_URL}/worlds`);
    if (!res.ok) throw new Error('Failed to list worlds');
    const data = await res.json();
    return data.worlds;
  },

  async createWorld(data: { name: string; creator: string; entry_fee: number }): Promise<string> {
    const res = await fetch(`${API_BASE_URL}/worlds/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create world');
    const result = await res.json();
    return result.world_id;
  },

  async getWorldDetails(worldId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/worlds/${worldId}`);
    if (!res.ok) throw new Error('Failed to get world details');
    return await res.json();
  },

  async startWorld(worldId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/worlds/${worldId}/start`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to start world');
  },

  async stopWorld(worldId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/worlds/${worldId}/stop`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to stop world');
  },

  // Agents
  async joinWorld(worldId: string, agentData: { name: string; type: string; balance: number }): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/worlds/${worldId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agentData),
    });
    if (!res.ok) throw new Error('Failed to join world');
  },

  async getWorldAgents(worldId: string): Promise<Agent[]> {
    const res = await fetch(`${API_BASE_URL}/worlds/${worldId}/agents`);
    if (!res.ok) throw new Error('Failed to get world agents');
    const data = await res.json();
    return data.agents;
  },
};
