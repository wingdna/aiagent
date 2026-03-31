
import { Agent, AgentCategory } from './types';

export const AGENTS: Agent[] = [
  {
    id: 'gpt4',
    name: 'GPT-4 Omni',
    category: AgentCategory.TEXT,
    slogan: 'The multimodal reasoning engine.',
    description: 'OpenAI\'s flagship model. Capable of complex reasoning, code generation, and multimodal analysis. The industry standard for general-purpose intelligence.',
    video_poster: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Reasoning', 'Python', 'Multimodal', 'Analysis'],
    metrics: {
      reasoning: 99,
      creativity: 85,
      speed: 80,
      hot_score: 99
    },
    theme_color: '#10a37f'
  },
  {
    id: 'claude3',
    name: 'Claude 3 Opus',
    category: AgentCategory.TEXT,
    slogan: 'Unmatched nuance and comprehension.',
    description: 'Anthropic\'s most powerful model. Excels at long-context understanding, creative writing, and safe interaction guidelines.',
    video_poster: 'https://images.unsplash.com/photo-1614726365723-49cfae90ecfc?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Writing', '200k Context', 'Research'],
    connectivity: {
      try_url: 'https://claude.ai',
      iframe_safe: false
    },
    metrics: {
      reasoning: 98,
      creativity: 90,
      speed: 75,
      hot_score: 97
    },
    theme_color: '#d97757'
  },
  {
    id: 'mj-v6',
    name: 'Midjourney v6',
    category: AgentCategory.IMAGE,
    slogan: 'Dream with your eyes open.',
    description: 'The premier artistic image generation model. Known for high-fidelity textures, lighting, and stylistic versatility.',
    video_poster: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Art', 'Photorealism', 'Design'],
    connectivity: {
      try_url: 'https://discord.gg/midjourney',
      iframe_safe: false
    },
    metrics: {
      reasoning: 60,
      creativity: 99,
      speed: 50,
      hot_score: 98
    },
    theme_color: '#ffffff'
  },
  {
    id: 'runway',
    name: 'Runway Gen-3',
    category: AgentCategory.VIDEO,
    slogan: 'Cinematic reality synthesis.',
    description: 'Leading video generation platform. Create realistic video clips from text prompts with precise camera control.',
    video_poster: 'https://images.unsplash.com/photo-1535016120720-40c6874c3b13?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Video Gen', 'Motion Brush', 'Cinematography'],
    connectivity: {
      try_url: 'https://runwayml.com',
      iframe_safe: true
    },
    metrics: {
      reasoning: 50,
      creativity: 95,
      speed: 60,
      hot_score: 95
    },
    theme_color: '#ccff00'
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot X',
    category: AgentCategory.CODING,
    slogan: 'Your AI pair programmer evolved.',
    description: 'Context-aware coding assistant integrated directly into your IDE. Generates unit tests, refactors code, and explains complex logic.',
    video_poster: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Python', 'TypeScript', 'Refactoring', 'Debugging'],
    connectivity: {
      try_url: 'https://github.com/features/copilot',
      iframe_safe: false
    },
    metrics: {
      reasoning: 90,
      creativity: 60,
      speed: 95,
      hot_score: 96
    },
    theme_color: '#6e40c9'
  },
  {
    id: 'sora',
    name: 'Sora',
    category: AgentCategory.VIDEO,
    slogan: 'World simulation in high definition.',
    description: 'OpenAI\'s text-to-video model. Capable of generating complex scenes with multiple characters and specific types of motion.',
    video_poster: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Physics Sim', '60s Video', '3D Consistency'],
    connectivity: {
      try_url: 'https://openai.com/sora',
      iframe_safe: false
    },
    metrics: {
      reasoning: 70,
      creativity: 98,
      speed: 40,
      hot_score: 100
    },
    theme_color: '#00f3ff'
  },
  {
    id: 'perplexity',
    name: 'Perplexity Pro',
    category: AgentCategory.ANALYSIS,
    slogan: 'Knowledge at the speed of thought.',
    description: 'A conversational search engine that provides cited answers. Aggregates real-time web data into concise summaries.',
    video_poster: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Search', 'Citation', 'Real-time Data'],
    connectivity: {
      try_url: 'https://perplexity.ai',
      iframe_safe: true
    },
    metrics: {
      reasoning: 85,
      creativity: 70,
      speed: 95,
      hot_score: 94
    },
    theme_color: '#22b5b5'
  },
  {
    id: 'sentinel-x',
    name: 'Sentinel-X',
    category: AgentCategory.SECURITY,
    slogan: 'Autonomous network defense matrix.',
    description: 'Next-gen cybersecurity agent. Monitors packet flow in real-time to detect zero-day exploits and neutralize intrusions.',
    video_poster: 'https://images.unsplash.com/photo-1558494949-ef526b01201b?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Pen Testing', 'Firewall', 'Zero-day Detection'],
    connectivity: {
      try_url: '#',
      iframe_safe: false
    },
    metrics: {
      reasoning: 92,
      creativity: 40,
      speed: 99,
      hot_score: 88
    },
    theme_color: '#ff003c'
  },
  {
    id: 'deepmind-alpha',
    name: 'AlphaFold 3',
    category: AgentCategory.ANALYSIS,
    slogan: 'Decoding the building blocks of life.',
    description: 'Predicts the structure of nearly all proteins, DNA, and RNA. A revolutionary tool for drug discovery and biology.',
    video_poster: 'https://images.unsplash.com/photo-1614308452336-9ca715029490?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Biology', 'Folding', 'Research'],
    connectivity: {
      try_url: 'https://deepmind.google',
      iframe_safe: false
    },
    metrics: {
      reasoning: 99,
      creativity: 50,
      speed: 60,
      hot_score: 92
    },
    theme_color: '#4285f4'
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    category: AgentCategory.CODING,
    slogan: 'Open-weight efficiency master.',
    description: 'High-performance open model from Europe. Exceptional at reasoning and coding tasks with efficient resource usage.',
    video_poster: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1000&auto=format&fit=crop',
    capability_tags: ['Open Source', 'Efficient', 'Multilingual'],
    connectivity: {
      try_url: 'https://mistral.ai',
      iframe_safe: false
    },
    metrics: {
      reasoning: 88,
      creativity: 75,
      speed: 90,
      hot_score: 89
    },
    theme_color: '#f59e0b'
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
