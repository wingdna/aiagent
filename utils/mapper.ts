import { AgentRegistryEntity } from "../app/types/registry";
import { Agent } from "../types";

export function mapToRegistry(row: Agent | any): AgentRegistryEntity {
  
  // [核心修复]：强制类型断言，依次从物理列 -> metrics 内层读取，并转为数字
  const rawScore = row.nri_score ?? row.metrics?.nri_score ?? 0;
  const parsedScore = parseFloat(String(rawScore));
  const finalScore = isNaN(parsedScore) ? 0 : parsedScore;

  // 物理列直接映射
  const pricingData = row.pricing || {};
  const specsData = row.specs && Object.keys(row.specs).length > 0 ? row.specs : (row.technical_specs || {});

  return {
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    category: row.category || "Uncategorized",
    slogan: row.slogan || "",
    description: row.description || "",
    entity_type: row.entity_type || "",
    
    assets: {
      cover_url: row.assets?.cover_url || row.cover_url || "",
      video_url: row.assets?.video_url || row.video_url || "",
      video_poster: row.assets?.video_poster || row.video_poster || "",
      gif_url: row.assets?.gif_url || row.gif_url || "",
      audio_sample_url: row.assets?.audio_sample_url || row.audio_sample_url || "",
      media_gallery: row.assets?.media_gallery || row.media_gallery || [],
    },
    metrics: {
      nri_score: finalScore, 
      logic_unit: row.metrics?.reasoning ?? row.metrics?.logic_unit ?? 0,
      velocity: row.metrics?.speed ?? row.metrics?.velocity ?? 0,
      hot_score: row.hot_score ?? row.metrics?.hot_index ?? 0,
    },
    capabilities: row.capability_tags || row.tags || [],
    pricing: {
      model: pricingData.model || "unknown",
      tiers: pricingData.tiers || [],
      isOSS: pricingData.isOSS || false,
      details: pricingData,
      price_text: pricingData.display_price || pricingData.model || "TBD",
    },
    faq: row.faq_content || [],
    specs: specsData,
    tactical_badges: row.tactical_badges || [],
    connectivity: row.connectivity || {
      try_url: row.try_url || "",
      docs_url: row.docs_url || "",
      api_url: row.api_url || "",
    },
    full_description: row.full_description || "",
    api_model_name: row.api_model_name || "",
    developer_socials: row.developer_socials || {},
    intel_feed: row.intel_feed || [],
    social_proof: row.social_proof || {},
    external_stats: row.external_stats || {},
    demo_interaction: row.demo_interaction || {},
    vendor_slug: row.vendor_slug || "",
    display_mode: row.display_mode || "video",
    version: row.version || "",
    framework_stack: row.framework_stack || [],
    tags: row.tags || [],
    official_url: row.official_url || "",
    persona_img: row.persona_img || "",
    technical_specs: row.technical_specs || {},
    created_at: row.created_at || "",
    updated_at: row.updated_at || "",
    last_verified_at: row.last_verified_at || "",
  };
}
