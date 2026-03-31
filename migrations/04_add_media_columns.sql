-- Add media columns to agents table
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS video_url TEXT, -- YouTube/MP4 link
ADD COLUMN IF NOT EXISTS gif_url TEXT,   -- Animated preview
ADD COLUMN IF NOT EXISTS cover_url TEXT; -- High-res static fallback

-- Create an index for faster media querying
CREATE INDEX IF NOT EXISTS idx_agents_video_url ON public.agents(video_url);
