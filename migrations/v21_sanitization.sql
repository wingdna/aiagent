
-- Protocol V21.0: Data Sanitization (The Purge)
-- Objective: Remove 'LOCAL' and '1-CLK' tags from SaaS providers to prevent misleading capability flags.

-- 1. Remove 'LOCAL' and '1-CLK' tags from known SaaS providers
-- Logic: If provider is Google, OpenAI, Anthropic, or Midjourney, it CANNOT be LOCAL.
-- Note: 'provider' field logic assumes partial match on name or description if provider column doesn't exist, 
-- but ideally we filter by ID or metadata. Using broad ILIKE for safety on the description/name if provider column is missing.
-- Adjusted for 'agents' table schema: filtering by name/description patterns usually associated with these providers.

UPDATE agents
SET tags = array_remove(array_remove(tags, 'LOCAL'), '1-CLK')
WHERE 
   name ILIKE ANY (ARRAY['%GPT%', '%Claude%', '%Gemini%', '%Midjourney%', '%Perplexity%']) 
   OR 
   description ILIKE ANY (ARRAY['%OpenAI%', '%Anthropic%', '%Google%', '%Midjourney%']);

-- 2. Force reset 'version' meta in specs to trigger re-sync later
-- We act on the 'specs' jsonb column.
UPDATE agents
SET specs = jsonb_set(specs, '{version}', '"Unknown"')
WHERE name ILIKE '%Gemini%';

-- 3. Log the purge (Optional, if system_logs exists)
-- INSERT INTO system_logs (event, message) VALUES ('DATA_PURGE', 'Sanitized SaaS agent tags per Protocol V21.0');
