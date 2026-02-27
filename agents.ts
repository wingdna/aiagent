
import { Agent, AgentCategory } from './types';

// --- Cyberpunk Persona Database (Simulated Holograms) ---
const PERSONAS = {
  AI_GOD: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=800&auto=format&fit=crop',
  SCHOLAR: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop',
  HACKER: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=800&auto=format&fit=crop',
  ARTIST: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
  SENTINEL: 'https://images.unsplash.com/photo-1592609931095-54a2168ae893?q=80&w=800&auto=format&fit=crop',
  NAVIGATOR: 'https://images.unsplash.com/photo-1515524738708-327f6b0033a7?q=80&w=800&auto=format&fit=crop'
};

export const AGENTS_DB: Agent[] = [
  {
    id: 'gemini-pro-vision',
    name: 'GEMINI_PRO_VISION',
    slogan: 'MULTIMODAL_REASONING_ENGINE',
    description: 'Advanced multimodal model capable of understanding images, video, and text with high reasoning capabilities.',
    metrics: { reasoning: 95, creativity: 90, speed: 85 },
    video_poster: PERSONAS.AI_GOD,
    category: AgentCategory.ANALYSIS,
    connectivity: { try_url: 'https://deepmind.google/technologies/gemini/', iframe_safe: true },
    stats: { wins: 120, losses: 5, elo: 2400, likes: 342 },
    tags: ['MULTIMODAL', 'VISION', 'REASONING'],
    tactical_badges: ['VISIONARY', 'APEX'],
    neuralBreakdown: { bio: 10, intent: 40, tech: 50, total: 100 },
    pricing_model: 'Free / Paid',
    benchmarks: { 'MMLU': '90.0%', 'Math': '85%' },
    market_analysis: { verdict: 'Top Tier', score: 9.5 }
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT_4_TURBO',
    slogan: 'GENERATIVE_PRETRAINED_TRANSFORMER',
    description: 'High-intelligence model with broad general knowledge and advanced coding capabilities.',
    metrics: { reasoning: 94, creativity: 88, speed: 80 },
    video_poster: PERSONAS.SCHOLAR,
    category: AgentCategory.TEXT,
    connectivity: { try_url: 'https://openai.com/gpt-4', iframe_safe: true },
    stats: { wins: 115, losses: 10, elo: 2350, likes: 289 },
    tags: ['TEXT', 'CODING', 'REASONING'],
    tactical_badges: ['VETERAN', 'CODE_WIZARD'],
    neuralBreakdown: { bio: 5, intent: 45, tech: 50, total: 100 },
    pricing_model: 'Paid',
    benchmarks: { 'MMLU': '86.4%', 'HumanEval': '67%' },
    market_analysis: { verdict: 'Industry Standard', score: 9.2 }
  },
  {
    id: 'claude-3-opus',
    name: 'CLAUDE_3_OPUS',
    slogan: 'CONSTITUTIONAL_AI_SYSTEM',
    description: 'Most powerful model for highly complex tasks, fluency, and nuance.',
    metrics: { reasoning: 96, creativity: 92, speed: 70 },
    video_poster: PERSONAS.NAVIGATOR,
    category: AgentCategory.TEXT,
    connectivity: { try_url: 'https://www.anthropic.com/news/claude-3-family', iframe_safe: true },
    stats: { wins: 118, losses: 7, elo: 2380, likes: 310 },
    tags: ['TEXT', 'NUANCE', 'LONG_CONTEXT'],
    tactical_badges: ['STRATEGIST', 'ELOQUENT'],
    neuralBreakdown: { bio: 15, intent: 50, tech: 35, total: 100 },
    pricing_model: 'Paid',
    benchmarks: { 'MMLU': '86.8%', 'GPQA': '50.4%' },
    market_analysis: { verdict: 'Premium Choice', score: 9.4 }
  },
  {
    id: 'mistral-large',
    name: 'MISTRAL_LARGE',
    slogan: 'OPEN_WEIGHTS_CHAMPION',
    description: 'Top-tier reasoning capabilities with efficient performance.',
    metrics: { reasoning: 89, creativity: 85, speed: 90 },
    video_poster: PERSONAS.HACKER,
    category: AgentCategory.TEXT,
    connectivity: { try_url: 'https://mistral.ai/', iframe_safe: true },
    stats: { wins: 90, losses: 20, elo: 2100, likes: 150 },
    tags: ['OPEN_SOURCE', 'EFFICIENT'],
    tactical_badges: ['ROGUE', 'SPEEDSTER'],
    neuralBreakdown: { bio: 20, intent: 30, tech: 50, total: 100 },
    pricing_model: 'Paid / Open Weights',
    benchmarks: { 'MMLU': '81%', 'GSM8K': '78%' },
    market_analysis: { verdict: 'Strong Contender', score: 8.8 }
  },
  {
    id: 'stable-diffusion-3',
    name: 'STABLE_DIFFUSION_3',
    slogan: 'LATENT_DIFFUSION_MATRIX',
    description: 'Next generation image synthesis model with improved typography and prompt adherence.',
    metrics: { reasoning: 70, creativity: 98, speed: 75 },
    video_poster: PERSONAS.ARTIST,
    category: AgentCategory.IMAGE,
    connectivity: { try_url: 'https://stability.ai/', iframe_safe: true },
    stats: { wins: 85, losses: 25, elo: 2050, likes: 400 },
    tags: ['IMAGE', 'CREATIVE', 'ART'],
    tactical_badges: ['VISIONARY', 'ARTISAN'],
    neuralBreakdown: { bio: 60, intent: 20, tech: 20, total: 100 },
    pricing_model: 'Paid / Open Weights',
    benchmarks: { 'FID': 'Low', 'CLIP': 'High' },
    market_analysis: { verdict: 'Creative Powerhouse', score: 9.0 }
  },
  {
    id: 'codellama-70b',
    name: 'CODE_LLAMA_70B',
    slogan: 'SYNTAX_OPTIMIZED_CORE',
    description: 'Specialized model for code generation and debugging.',
    metrics: { reasoning: 85, creativity: 60, speed: 88 },
    video_poster: PERSONAS.SENTINEL,
    category: AgentCategory.CODING,
    connectivity: { try_url: 'https://ai.meta.com/llama/', iframe_safe: true },
    stats: { wins: 80, losses: 30, elo: 2000, likes: 180 },
    tags: ['CODING', 'DEV', 'OPEN_SOURCE'],
    tactical_badges: ['ENGINEER', 'DEBUGGER'],
    neuralBreakdown: { bio: 0, intent: 10, tech: 90, total: 100 },
    pricing_model: 'Open Source',
    benchmarks: { 'HumanEval': '53%', 'MBPP': '55%' },
    market_analysis: { verdict: 'Dev Essential', score: 8.5 }
  }
];

export const CATEGORIES = [
  { id: AgentCategory.ALL, label: 'ALL SYSTEMS' },
  { id: AgentCategory.TEXT, label: 'TEXT GEN' },
  { id: AgentCategory.IMAGE, label: 'VISUALS' },
  { id: AgentCategory.VIDEO, label: 'MOTION' },
  { id: AgentCategory.CODING, label: 'DEV OPS' },
  { id: AgentCategory.SECURITY, label: 'NET SEC' },
  { id: AgentCategory.ANALYSIS, label: 'DATA' },
];
