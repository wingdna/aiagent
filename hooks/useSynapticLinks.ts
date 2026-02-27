import { useState, useEffect } from 'react';
import { Agent } from '../types';
import { createClient } from '@supabase/supabase-js';
import { CONFIG } from '../config';

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

export const useSynapticLinks = (agentId: string | null) => {
  const [baseModels, setBaseModels] = useState<Agent[]>([]);
  const [derivedAgents, setDerivedAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agentId) {
      setBaseModels([]);
      setDerivedAgents([]);
      return;
    }

    const fetchLinks = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch base models for this agent
        const { data: modelsData, error: modelsError } = await supabase.rpc('get_base_models_for_agent', {
          p_agent_id: agentId
        });

        if (modelsError) throw modelsError;

        // Fetch agents built on this model (if this agent is a model)
        const { data: agentsData, error: agentsError } = await supabase.rpc('get_agents_by_base_model', {
          p_model_id: agentId
        });

        if (agentsError) throw agentsError;

        setBaseModels(modelsData || []);
        setDerivedAgents(agentsData || []);
      } catch (err: any) {
        console.error('[SYNAPTIC_LINK] Error fetching relational topology:', err);
        setError(err.message || 'Failed to fetch synaptic links');
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [agentId]);

  return { baseModels, derivedAgents, loading, error };
};