import { z } from 'zod';

// 🛑 IRON SHIELD PROTOCOL: TITANIUM TYPINGS 🛑
// This schema defines the absolute truth for the Agent data model.
// Any payload failing this schema will be rejected at the Edge Mesh.

export const PricingModelEnum = z.enum(['Closed-SaaS', 'Open-Weights', 'Local-Only', 'Unknown']);
export type PricingModelType = z.infer<typeof PricingModelEnum>;

export const AgentPricingSchema = z.object({
  type: PricingModelEnum,
  price: z.number().optional(),
  currency: z.string().optional(),
  subscription_tier: z.string().optional(),
}).catchall(z.any());

export const AgentSpecsSchema = z.object({
  model_params: z.string().optional(),
  context_window: z.number().optional(),
  hardware_req: z.string().optional(),
  architecture: z.string().optional(),
}).catchall(z.any());

export const AgentMetricsSchema = z.object({
  reasoning: z.number().min(0).max(100),
  creativity: z.number().min(0).max(100),
  speed: z.number().min(0).max(100),
}).catchall(z.any());

export const AgentStatsSchema = z.object({
  wins: z.number().default(0),
  losses: z.number().default(0),
  elo: z.number().default(1200),
}).catchall(z.any());

export const AgentConnectivitySchema = z.object({
  try_url: z.string().url().optional(),
  api_base_url: z.string().url().optional(),
  iframe_safe: z.boolean().default(false),
}).catchall(z.any());

export const AgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slogan: z.string().optional(),
  description: z.string().optional(),
  category: z.string().default('ANALYSIS'),
  
  pricing_model: z.union([z.string(), AgentPricingSchema]).transform(val => {
    if (typeof val === 'string') {
      // Attempt to map legacy string to strict enum
      const lower = val.toLowerCase();
      if (lower.includes('closed') || lower.includes('saas')) return { type: 'Closed-SaaS' };
      if (lower.includes('open') || lower.includes('weights')) return { type: 'Open-Weights' };
      if (lower.includes('local')) return { type: 'Local-Only' };
      return { type: 'Unknown' };
    }
    return val;
  }),
  
  specs: AgentSpecsSchema.optional().nullable(),
  metrics: AgentMetricsSchema.optional().nullable(),
  stats: AgentStatsSchema.optional().nullable(),
  connectivity: AgentConnectivitySchema.optional().nullable(),
  
  tags: z.array(z.string()).default([]),
  tactical_badges: z.array(z.string()).default([]),
  
  nri_score: z.number().optional().nullable(),
  hot_score: z.number().optional().nullable(),
  entity_type: z.enum(['foundation_model', 'ai_agent']).optional().nullable(),
  
  persona_img: z.string().optional().nullable(),
  video_poster: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  slug: z.string().optional().nullable(),
  theme_color: z.string().optional().nullable(),
  official_url: z.string().url().optional().nullable(),
  
  external_stats: z.any().optional().nullable(),
  benchmarks: z.any().optional().nullable(),
  market_analysis: z.any().optional().nullable(),
  
  voice_config: z.any().optional().nullable(),
  slogan_audio_url: z.string().optional().nullable(),
  neuralBreakdown: z.any().optional().nullable(),
  system_prompts: z.any().optional().nullable(),
}).catchall(z.any());

export type TitaniumAgent = z.infer<typeof AgentSchema>;
