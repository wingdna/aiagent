-- 1. Restore the hot_score column with a safe baseline
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS hot_score NUMERIC DEFAULT 0;

-- 2. Create a B-Tree index for high-speed descending sorts (Crucial for Infinite Scroll speed)
CREATE INDEX IF NOT EXISTS idx_agents_hot_score ON public.agents(hot_score DESC);

-- 3. (Optional but Recommended) Data Normalization for existing records
UPDATE public.agents 
SET hot_score = nri_score * 0.1 
WHERE hot_score = 0 OR hot_score IS NULL;
