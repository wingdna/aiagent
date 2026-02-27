
export interface AgentMetrics {
  reasoning: number;
  creativity: number;
  speed: number;
}

export interface UserKeys {
  google?: string;
  openai?: string;
  anthropic?: string;
  deepseek?: string;
}

export interface AgentConnectivity {
  try_url: string;
  iframe_safe: boolean;
}

export interface AgentStats {
  wins: number;
  losses: number;
  elo: number;
  likes?: number;
}

// V31.0: Neural Census Stats
export interface ExternalStats {
  github_stars?: number;
  web_mentions?: number;
  last_crawled?: string;
}

export interface NeuralBreakdown {
  bio: number;
  intent: number;
  tech: number;
  total: number;
}

export interface VoiceConfig {
  id: string;
  pitch: number;
  rate: number;
  style: string;
}

// V8.1: Data Contract - Technical Specifications
export interface AgentSpecs {
  context_window?: string;
  model_params?: string;
  license?: string;
  release_date?: string;
}

// V8.1: Data Contract - System Prompts
export interface SystemPrompt {
  title: string;
  content: string;
  tags?: string[];
}

export interface Agent {
  id: string;
  name: string;
  slogan: string;
  description: string;
  metrics: AgentMetrics;
  video_poster: string;
  video_url?: string; // Protocol V11.5: Direct Video Source
  persona_img?: string;
  voice_config?: VoiceConfig;
  slogan_audio_url?: string;
  category: string;
  connectivity: AgentConnectivity;
  stats?: AgentStats;
  tags?: string[];
  tactical_badges?: string[];
  neuralBreakdown?: NeuralBreakdown;
  theme_color?: string;
  capability_tags?: string[];
  hot_score?: number;
  nri_score?: number;
  external_stats?: ExternalStats;

  // Protocol V8.1: Real Data Fields
  specs?: AgentSpecs;
  system_prompts?: SystemPrompt[];
  hardware_req?: string;
  pricing_model?: string | { type: string; price: string };
  slug?: string; // URL-friendly identifier
  entity_type?: 'foundation_model' | 'ai_agent';

  // V-GOLDEN-GATE: New Supabase schema fields — ALL optional for null-safety
  full_description?: string;       // Detail modal only — NEVER fetch in list view
  // embedding is INTENTIONALLY OMITTED from this type (vector-only, never rendered)
  benchmarks?: Record<string, any>;    // Benchmark results object
  market_analysis?: {
    verdict?: string;
    score?: number;
    summary?: string;
    competitors?: string[];
    [key: string]: any;
  };
  intel_feed?: any[];
  developer_socials?: {
    github?: string;
    twitter?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  technical_specs?: {
    architecture?: string;
    open_source?: boolean;
    [key: string]: any;
  };
}

// --- V35.0 AGENT INTEL TYPES ---
export type IntelType = 'news' | 'tutorial';
export type DifficultyLevel = 'novice' | 'adept' | 'elite';

export interface AgentIntel {
  id: string;
  agent_id: string;
  type: IntelType;
  title: string;
  summary: string;
  original_url: string;
  source_domain: string;
  published_at: Date;
  tags: string[];
  difficulty_level: DifficultyLevel;
}

export enum AgentCategory {
  ALL = 'ALL',
  TEXT = 'TEXT_GEN',
  IMAGE = 'IMAGE_GEN',
  VIDEO = 'VIDEO_GEN',
  CODING = 'CODING',
  SECURITY = 'SECURITY',
  ANALYSIS = 'ANALYSIS'
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

// --- V11.2 SOCIAL TYPES ---
export type RankTitle = 'SCRIPT_KIDDIE' | 'GLITCH_HUNTER' | 'NETRUNNER' | 'CYPHER_PUNK' | 'NEURAL_ARCHITECT' | 'THE_ORACLE';

export interface UserRank {
  title: RankTitle;
  color: string;
  level: number;
  nextLevelXp: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon?: string;
  unlockedAt?: Date;
  xp?: number;
}

export interface UserProfile {
  id?: string;
  username: string;
  xp: number;
  balance: number;
  reputation: number;
  achievements: string[];
  badges: string[];
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  stake: number;
  benchmarkScore: number;
  benchmarkTime: number;
  creator: string;
  ghostLog: string[];
  difficulty: 'LOW' | 'MED' | 'HIGH' | 'NIGHTMARE';
}

export interface Challenge {
  id: string;
  title: string;
  creator: string;
  stake: number;
  scheduledFor: Date;
  status: 'OPEN' | 'LOCKED' | 'LIVE' | 'RESOLVED';
  participants: string[];
  maxParticipants: number;
  description: string;
  poolTotal: number;
}
