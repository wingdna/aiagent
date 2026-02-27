
import { Agent } from '../types';

/**
 * YOUAGENT API PROTOCOL V5.1 (RESTORED)
 * Implementation: Native Fetch Core
 * Role: Senior Protocol Bridge
 *
 * @deprecated Legacy API bridge. Execution must route via Titanium Relay `/api/v1/proxy/execute` using `src/hooks/useExecutionProxy`.
 */

// 1. Safe Environment Variable Access
const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "";

console.log("[YouAgent] System Link:", API_BASE); // Debug log

export const synapseApi = {
  /**
   * Core Fetch Wrapper
   * Handles 404s, Network Errors, and JSON parsing safely.
   */
  async get(endpoint: string, params: Record<string, any> = {}) {
    try {
      // Construct URL safely
      const url = new URL(`${API_BASE}${endpoint}`);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });

      // Execute Native Fetch
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP_ERROR_${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.message === 'Failed to fetch') {
        console.warn(`[YOUAGENT_OFFLINE] ${endpoint} - Network error or worker unreachable.`);
      } else {
        console.error(`[YOUAGENT_BRIDGE_FAIL] ${endpoint}`, error);
      }
      throw error; // Re-throw to let UI handle the fallback
    }
  },

  /**
   * AI Gateway Stream (POST)
   * Restored to maintain system continuity with components depending on streaming results.
   */
  async sendChatMessage(payload: {
    prompt: string;
    provider: string;
    model: string;
    turnstileToken?: string;
  }, onChunk: (text: string) => void) {
    try {
      const url = `${API_BASE}/api/chat`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Agent-Provider': payload.provider,
          'X-Model': payload.model,
          'cf-turnstile-response': payload.turnstileToken || ''
        },
        body: JSON.stringify({ prompt: payload.prompt })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(errorData.message || `AI_GATEWAY_REJECTION_${response.status}`);
      }

      if (!response.body) throw new Error("NEURAL_LINK_EMPTY");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) onChunk(chunk);
      }
    } catch (error: any) {
      console.error(`[YOUAGENT_API_FAIL] POST /api/chat`, error.message);
      throw error;
    }
  },

  // --- API Methods ---

  async fetchAgents(page = 0, limit = 12, category = 'ALL', sortBy?: string, order?: string): Promise<Agent[]> {
    // Uses the robust .get() method defined above
    return this.get('/api/agents', { page, limit, category, sortBy, order }) as Promise<Agent[]>;
  },

  async fetchAgentDetails(id: string): Promise<Agent> {
    return this.get(`/api/agent/${id}`) as Promise<Agent>;
  },

  async fetchIntel(id: string) {
    return this.get(`/api/agent/${id}/intel`);
  }
};
