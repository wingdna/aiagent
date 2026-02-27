-- 1. Create taxonomy enum and add to agents
CREATE TYPE public.agent_entity_type AS ENUM ('foundation_model', 'ai_agent');

ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS entity_type public.agent_entity_type DEFAULT 'ai_agent';

-- 2. Create the Synaptic Junction Table (M2M Self-Referencing)
CREATE TABLE IF NOT EXISTS public.agent_model_links (
    agent_id TEXT REFERENCES public.agents(id) ON DELETE CASCADE,
    model_id TEXT REFERENCES public.agents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (agent_id, model_id)
);

-- Add indexes for zero-latency bi-directional lookups
CREATE INDEX IF NOT EXISTS idx_agent_model_links_agent ON public.agent_model_links(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_model_links_model ON public.agent_model_links(model_id);

-- 3. Create RPC: Get base models for a specific agent
CREATE OR REPLACE FUNCTION get_base_models_for_agent(p_agent_id TEXT)
RETURNS SETOF public.agents
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT a.* 
  FROM public.agents a
  JOIN public.agent_model_links l ON a.id = l.model_id
  WHERE l.agent_id = p_agent_id
  AND a.entity_type = 'foundation_model';
$$;

-- 4. Create RPC: Get popular agents built on a specific base model
CREATE OR REPLACE FUNCTION get_agents_by_base_model(p_model_id TEXT)
RETURNS SETOF public.agents
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT a.* 
  FROM public.agents a
  JOIN public.agent_model_links l ON a.id = l.agent_id
  WHERE l.model_id = p_model_id
  AND a.entity_type = 'ai_agent'
  ORDER BY a.created_at DESC -- Add metrics-based sorting later
  LIMIT 10;
$$;
