-- Add missing columns to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS social_proof JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS system_prompts JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS neuralBreakdown JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS framework_stack TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS developer_socials JSONB DEFAULT '{}'::jsonb;

-- Update match_agents function to include new columns
CREATE OR REPLACE FUNCTION match_agents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id text,
  slug text,
  name text,
  description text,
  entity_type text,
  nri_score float,
  hot_score float,
  video_url text,
  cover_url text,
  display_mode text,
  specs jsonb,
  pricing_model jsonb,
  pricing_model_json jsonb,
  metrics jsonb,
  capability_tags text[],
  media_gallery text[],
  vendor_id text,
  vendor_slug text,
  slogan text,
  embedding vector(1536),
  technical_specs jsonb,
  social_proof jsonb,
  system_prompts jsonb,
  external_stats jsonb,
  neuralBreakdown jsonb,
  framework_stack text[],
  developer_socials jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    agents.id,
    agents.slug,
    agents.name,
    agents.description,
    agents.entity_type,
    agents.nri_score,
    agents.hot_score,
    agents.video_url,
    agents.cover_url,
    agents.display_mode,
    agents.specs,
    agents.pricing_model,
    agents.pricing_model_json,
    agents.metrics,
    agents.capability_tags,
    agents.media_gallery,
    agents.vendor_id,
    agents.vendor_slug,
    agents.slogan,
    agents.embedding,
    agents.technical_specs,
    agents.social_proof,
    agents.system_prompts,
    agents.external_stats,
    agents.neuralBreakdown,
    agents.framework_stack,
    agents.developer_socials,
    1 - (agents.embedding <=> query_embedding) AS similarity
  FROM agents
  WHERE 1 - (agents.embedding <=> query_embedding) > match_threshold
  ORDER BY agents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
