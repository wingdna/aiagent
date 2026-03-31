
-- Create agent_reviews table if not exists
CREATE TABLE IF NOT EXISTS agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id_link TEXT REFERENCES agents(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT, -- The full markdown content
  scores JSONB DEFAULT '{}'::jsonB,
  elo INTEGER DEFAULT 1200,
  tags TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create agent_intel table if not exists
CREATE TABLE IF NOT EXISTS agent_intel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id_link TEXT REFERENCES agents(id) ON DELETE CASCADE,
  agent_slug TEXT,
  intel_type TEXT NOT NULL, -- 'NEWS', 'UPDATE', 'LEAK', 'BENCHMARK'
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  source_url TEXT,
  image_url TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_intel ENABLE ROW LEVEL SECURITY;

-- Create public read policies
CREATE POLICY "Allow public read on agents" ON agents FOR SELECT USING (true);
CREATE POLICY "Allow public read on agent_reviews" ON agent_reviews FOR SELECT USING (true);
CREATE POLICY "Allow public read on agent_intel" ON agent_intel FOR SELECT USING (true);

-- Seed Agents (if not exists)
INSERT INTO agents (id, name, slogan, description, metrics, stats, connectivity, tags, category, video_poster)
VALUES 
('gemini-pro-vision', 'GEMINI_PRO_VISION', 'MULTIMODAL_REASONING_ENGINE', 'Advanced multimodal model capable of understanding images, video, and text with high reasoning capabilities.', '{"reasoning": 95, "creativity": 90, "speed": 85}', '{"wins": 120, "losses": 5, "elo": 2400, "likes": 342}', '{"try_url": "https://deepmind.google/technologies/gemini/", "iframe_safe": true}', ARRAY['MULTIMODAL', 'VISION', 'REASONING'], 'ANALYSIS', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop'),
('gpt-4-turbo', 'GPT_4_TURBO', 'GENERATIVE_PRETRAINED_TRANSFORMER', 'High-intelligence model with broad general knowledge and advanced coding capabilities.', '{"reasoning": 94, "creativity": 88, "speed": 80}', '{"wins": 115, "losses": 10, "elo": 2350, "likes": 289}', '{"try_url": "https://openai.com/gpt-4", "iframe_safe": true}', ARRAY['TEXT', 'CODING', 'REASONING'], 'TEXT_GEN', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop'),
('claude-3-opus', 'CLAUDE_3_OPUS', 'CONSTITUTIONAL_AI_SYSTEM', 'Most powerful model for highly complex tasks, fluency, and nuance.', '{"reasoning": 96, "creativity": 92, "speed": 70}', '{"wins": 118, "losses": 7, "elo": 2380, "likes": 310}', '{"try_url": "https://www.anthropic.com/news/claude-3-family", "iframe_safe": true}', ARRAY['TEXT', 'NUANCE', 'LONG_CONTEXT'], 'TEXT_GEN', 'https://images.unsplash.com/photo-1515524738708-327f6b0033a7?q=80&w=800&auto=format&fit=crop')
ON CONFLICT (id) DO NOTHING;

-- Seed some reviews
INSERT INTO agent_reviews (agent_id_link, title, summary, content, scores, elo, tags, updated_at)
VALUES 
(
  'gemini-pro-vision', 
  'Gemini 1.5 Pro: The Multimodal King?', 
  'An in-depth look at Google''s latest multimodal powerhouse and its massive context window.',
  '# Gemini 1.5 Pro Review\n\nGoogle has recently unveiled **Gemini 1.5 Pro**, and it is a significant leap forward in multimodal reasoning. The most striking feature is its **1 million token context window**, which allows it to process entire codebases, long videos, and massive documents in a single prompt.\n\n## Performance Benchmarks\nIn our testing, Gemini 1.5 Pro showed exceptional performance in:\n- **Video Analysis**: Identifying specific frames and actions in a 1-hour video.\n- **Code Understanding**: Navigating complex repositories with ease.\n- **Reasoning**: Solving multi-step logic puzzles that stumped previous models.\n\n## Conclusion\nGemini 1.5 Pro is currently the most versatile model on the market for developers and researchers dealing with large-scale data.',
  '{"reasoning": 98, "multimodal": 99, "speed": 85, "accuracy": 92}',
  2450,
  'Google, Multimodal, 1M Context',
  NOW()
),
(
  'gpt-4-turbo', 
  'GPT-4 Turbo: Still the Industry Standard', 
  'OpenAI''s flagship model continues to lead in general intelligence and coding tasks.',
  '# GPT-4 Turbo Analysis\n\nDespite increasing competition, **GPT-4 Turbo** remains the benchmark against which all other models are measured. Its balance of speed, intelligence, and reliability makes it the go-to choice for most production applications.\n\n## Key Strengths\n- **Instruction Following**: Extremely precise in following complex system prompts.\n- **Coding**: Still one of the most reliable models for generating functional, bug-free code.\n- **Ecosystem**: Integration with OpenAI''s API and tools like DALL-E 3 and Browsing.\n\n## Verdict\nWhile others are catching up in specific areas, GPT-4 Turbo''s general-purpose utility is unmatched.',
  '{"reasoning": 95, "coding": 96, "speed": 88, "reliability": 94}',
  2380,
  'OpenAI, Coding, General Purpose',
  NOW() - INTERVAL '1 day'
),
(
  'claude-3-opus', 
  'Claude 3 Opus: The Nuance Specialist', 
  'Anthropic''s most powerful model excels in creative writing and complex reasoning with a human-like touch.',
  '# Claude 3 Opus Deep Dive\n\n**Claude 3 Opus** has surprised the AI community with its incredible "human-like" quality of writing and its ability to handle extremely complex, nuanced instructions without the "robotic" feel often associated with other models.\n\n## Highlights\n- **Creativity**: Exceptional at creative writing, poetry, and empathetic communication.\n- **Complex Reasoning**: Outperforms almost every other model on the GPQA benchmark.\n- **Safety**: Built with Anthropic''s Constitutional AI principles, making it highly reliable for sensitive tasks.\n\n## Final Thoughts\nIf you need a model that understands subtext and writes with flair, Opus is the clear winner.',
  '{"reasoning": 97, "creativity": 98, "fluency": 99, "safety": 95}',
  2410,
  'Anthropic, Nuance, Complex Reasoning',
  NOW() - INTERVAL '2 days'
);

-- Seed some intel
INSERT INTO agent_intel (agent_id_link, agent_slug, intel_type, title, summary, source_url, image_url)
VALUES
(
  'gemini-pro-vision',
  'gemini-pro-vision',
  'UPDATE',
  'Gemini 1.5 Flash Released',
  'Google announces a faster, more efficient version of Gemini 1.5 for high-volume tasks.',
  'https://blog.google/technology/ai/google-gemini-update-may-2024/',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop'
),
(
  'gpt-4-turbo',
  'gpt-4-turbo',
  'NEWS',
  'OpenAI Announces GPT-4o',
  'A new flagship model that can reason across audio, vision, and text in real time.',
  'https://openai.com/index/hello-gpt-4o/',
  'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=800&auto=format&fit=crop'
);
