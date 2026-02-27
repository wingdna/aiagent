-- 🛑 IRON SHIELD PROTOCOL: TITANIUM TYPINGS 🛑
-- This migration enforces strict JSONB schemas on the `agents` table.
-- Any payload failing this schema will be rejected at the Database Core.

-- 1. Enable pg_jsonschema extension
CREATE EXTENSION IF NOT EXISTS pg_jsonschema;

-- 1.5 Ensure required columns exist
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS pricing_model JSONB DEFAULT '{"type": "Unknown"}'::jsonb;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS metrics JSONB DEFAULT '{"reasoning": 50, "creativity": 50, "speed": 50}'::jsonb;

-- 2. Data Normalization (Clean up existing dirty data)
-- Normalize pricing_model
UPDATE public.agents
SET pricing_model = 
  CASE 
    WHEN jsonb_typeof(pricing_model::jsonb) = 'string' THEN 
      jsonb_build_object('type', 
        CASE 
          WHEN pricing_model::text ILIKE '%closed%' OR pricing_model::text ILIKE '%saas%' THEN 'Closed-SaaS'
          WHEN pricing_model::text ILIKE '%open%' OR pricing_model::text ILIKE '%weights%' THEN 'Open-Weights'
          WHEN pricing_model::text ILIKE '%local%' THEN 'Local-Only'
          ELSE 'Unknown'
        END
      )
    WHEN jsonb_typeof(pricing_model::jsonb) = 'object' THEN
      CASE 
        WHEN pricing_model::jsonb ? 'type' AND (pricing_model::jsonb ->> 'type') IN ('Closed-SaaS', 'Open-Weights', 'Local-Only', 'Unknown') THEN pricing_model::jsonb
        ELSE jsonb_set(pricing_model::jsonb, '{type}', '"Unknown"'::jsonb)
      END
    ELSE '{"type": "Unknown"}'::jsonb
  END
WHERE pricing_model IS NOT NULL;

-- Normalize metrics
UPDATE public.agents
SET metrics = 
  CASE 
    WHEN jsonb_typeof(metrics::jsonb) = 'object' THEN
      jsonb_build_object(
        'reasoning', COALESCE((metrics::jsonb ->> 'reasoning')::numeric, 50),
        'creativity', COALESCE((metrics::jsonb ->> 'creativity')::numeric, 50),
        'speed', COALESCE((metrics::jsonb ->> 'speed')::numeric, 50)
      )
    ELSE '{"reasoning": 50, "creativity": 50, "speed": 50}'::jsonb
  END
WHERE metrics IS NOT NULL;

-- Normalize specs
UPDATE public.agents
SET specs = '{}'::jsonb
WHERE specs IS NOT NULL AND jsonb_typeof(specs::jsonb) != 'object';

-- 3. Add Check Constraints to agents table for pricing_model
ALTER TABLE public.agents
DROP CONSTRAINT IF EXISTS agents_pricing_model_check;

ALTER TABLE public.agents
ADD CONSTRAINT agents_pricing_model_check 
CHECK (
  jsonb_matches_schema(
    '{
      "type": "object",
      "properties": {
        "type": { "type": "string", "enum": ["Closed-SaaS", "Open-Weights", "Local-Only", "Unknown"] },
        "price": { "type": "number" },
        "currency": { "type": "string" },
        "subscription_tier": { "type": "string" }
      },
      "required": ["type"]
    }'::json,
    pricing_model::jsonb
  )
  OR pricing_model IS NULL
);

-- 4. Add Check Constraints to agents table for specs
ALTER TABLE public.agents
DROP CONSTRAINT IF EXISTS agents_specs_check;

ALTER TABLE public.agents
ADD CONSTRAINT agents_specs_check
CHECK (
  jsonb_matches_schema(
    '{
      "type": "object",
      "properties": {
        "model_params": { "type": "string" },
        "context_window": { "type": "number" },
        "hardware_req": { "type": "string" },
        "architecture": { "type": "string" }
      }
    }'::json,
    specs::jsonb
  )
  OR specs IS NULL
);

-- 5. Add Check Constraints to agents table for metrics
ALTER TABLE public.agents
DROP CONSTRAINT IF EXISTS agents_metrics_check;

ALTER TABLE public.agents
ADD CONSTRAINT agents_metrics_check
CHECK (
  jsonb_matches_schema(
    '{
      "type": "object",
      "properties": {
        "reasoning": { "type": "number", "minimum": 0, "maximum": 100 },
        "creativity": { "type": "number", "minimum": 0, "maximum": 100 },
        "speed": { "type": "number", "minimum": 0, "maximum": 100 }
      },
      "required": ["reasoning", "creativity", "speed"]
    }'::json,
    metrics::jsonb
  )
  OR metrics IS NULL
);
