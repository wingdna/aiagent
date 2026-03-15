import { useState, useCallback } from 'react';
import { Agent } from '../types';
import { dataService } from '../services/dataService';
import { safeFetch } from '../services/api_guard';
import { useUserKeys } from './useUserKeys';

export const useSemanticSearch = () => {
  const [results, setResults] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { keys } = useUserKeys();

  const search = useCallback(async (query: string, options?: { threshold?: number, count?: number }): Promise<Agent[]> => {
    if (!query) {
      setResults([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      let agents: Agent[] = [];

      // Text Search
      if (!query.trim()) {
          setResults([]);
          setLoading(false);
          return [];
      }

      // 0. Intent Parsing (Fast heuristic for pricing)
      const isCheapOrFree = /免费|便宜|free|cheap/i.test(query);

      // 1. Server-Side Hybrid Search
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (keys.siliconflow) {
          headers['x-siliconflow-key'] = keys.siliconflow;
      }

      const data = await safeFetch('/api/hybrid', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query })
      }) as any;

      if (data.offline) {
          setError("SYSTEM_OFFLINE");
          setLoading(false);
          return [];
      }

      agents = data.results || [];

      // 2. Apply Pricing Filter (Client-Side)
      if (isCheapOrFree) {
          agents = agents.filter(agent => {
          const pricingType = (agent.pricing_model?.type || agent.pricing_model_json?.type || '').toLowerCase();
          return pricingType.includes('free') || pricingType.includes('open-weights') || pricingType.includes('open source');
          });
      }

      // 3. Fallback to Popular Agents if absolutely empty
      if (agents.length === 0) {
        agents = await dataService.getPopularAgents();
      }

      setResults(agents);
      return agents;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [keys.siliconflow]);

  return { results, loading, error, search };
};
