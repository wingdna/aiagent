
import { Database } from './src/lib/database.types';

export type AgentRow = Database['public']['Tables']['agents']['Row'];

export interface AgentMetrics {
  reasoning: number;
  creativity: number;
  speed: number;
  nri_score?: number;
  hot_score?: number;
}

export interface UserKeys {
  google?: string;
  openai?: string;
  anthropic?: string;
  deepseek?: string;
  siliconflow?: string;
}

export interface AgentConnectivity {
  try_url: string;
  iframe_safe: boolean;
  api_base_url?: string;
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
  product_hunt_votes?: number;
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
// V8.1: Data Contract - System Prompts
export interface SystemPrompt {
  title: string;
  content: string;
  tags?: string[];
}

export interface AgentSpecs {
  context_window?: number;
  model_params?: string;
  [key: string]: any;
}

export interface AgentPricing {
  type: 'Closed-SaaS' | 'Open-Weights' | string;
  price?: number;
  [key: string]: any;
}

export interface Agent {
  id: string;
  name: string;
  slogan?: string;
  description?: string;
  metrics?: AgentMetrics;
  stats?: AgentStats;
  connectivity?: AgentConnectivity;
  tags?: string[];
  category?: string;
  video_poster?: string;
  persona_img?: string;
  voice_config?: VoiceConfig;
  created_at?: string;
  content_hash?: string;
  last_verified_at?: string;
  tactical_badges?: string[];
  external_stats?: ExternalStats;
  nri_score?: number;
  full_description?: string;
  market_analysis?: any;
  intel_feed?: any[];
  capabilities?: string[];
  api_base_url?: string;
  api_model_name?: string;
  provider_id?: string;
  seo_metadata?: any;
  technical_specs?: any;
  social_proof?: any;
  execution_config?: any;
  related_agents?: string[];
  updated_at?: string;
  status?: string;
  last_checked_at?: string;
  official_url?: string;
  benchmarks?: Record<string, any>;
  pricing_model_json?: any;
  framework_stack?: string[];
  developer_socials?: any;
  slug?: string;
  version?: string;
  embedding?: number[];
  total_views?: number;
  execution_count?: number;
  vendor_id?: string;
  vendor_slug?: string;
  specs?: AgentSpecs;
  entity_type?: 'foundation_model' | 'ai_agent' | string;
  hot_score?: number;
  video_url?: string;
  gif_url?: string;
  cover_url?: string;
  media_gallery?: any;
  audio_sample_url?: string;
  demo_interaction?: { prompt: string; response: string };
  display_mode?: 'video' | 'gallery' | 'terminal' | 'none' | string;
  capability_tags?: any;
  pricing_model?: AgentPricing;
  pricing_details?: string;
  is_active?: boolean;
  discovery_source?: string;
  neuralBreakdown?: NeuralBreakdown;
  theme_color?: string;
  similarity?: number;
  vendor?: {
    name: string;
    [key: string]: any;
  };
  health_check_failures?: number;
}

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  verified?: boolean;
  founded_at?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    [key: string]: string | undefined;
  };
}

// --- V35.0 AGENT INTEL TYPES ---
export type IntelType = 'news' | 'tutorial' | 'UPDATE' | 'ALERT' | 'RUMOR';
export type DifficultyLevel = 'novice' | 'adept' | 'elite';

export interface AgentIntel {
  id: string;
  agent_id_link: string; // Updated to match DB
  title: string;
  summary: string;
  intel_type: IntelType; // Updated to match DB
  source_url?: string;
  published_at: string;
  // Legacy fields (optional)
  agent_id?: string;
  type?: IntelType;
  original_url?: string;
  source_domain?: string;
  tags?: string[];
  difficulty_level?: DifficultyLevel;
}

export interface AgentPost {
    id: string;
    agent_id_link: string;
    title: string;
    slug: string;
    content: string; // Markdown
    cover_url?: string;
    tags?: string[];
    published_at: string;
    author_id?: string;
    views_count?: number;
    likes_count?: number;
    source_url?: string;
    status?: string;
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
  role?: string;
  interests?: string[];
  skills?: string[];
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

export interface SwarmAgentRole {
    agent: Agent;
    role: string;
    reason: string;
}

export interface SwarmPlan {
    id: string;
    title: string;
    description: string;
    agents: SwarmAgentRole[];
    estimated_budget: string;
    complexity_score: number;
}
