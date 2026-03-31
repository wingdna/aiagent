import { AgentRegistryEntity } from "../types/registry";

export function mapToRegistry(row: any): AgentRegistryEntity {
  if (!row) {
    throw new Error("Cannot map null row to AgentRegistryEntity");
  }

  // Safely parse metrics
  const metrics = row.metrics || {};
  const speed = typeof metrics.speed === 'number' ? metrics.speed : 0;
  const reasoning = typeof metrics.reasoning === 'number' ? metrics.reasoning : 0;
  const creativity = typeof metrics.creativity === 'number' ? metrics.creativity : 0;

  // Safely parse pricing
  const pricingData = row.pricing || {};
  let isOss = false;
  if (pricingData.isOSS === true || pricingData.is_open_source === true) {
    isOss = true;
  }

  const specsData = row.specs && Object.keys(row.specs).length > 0 ? row.specs : (row.technical_specs || {});

  return {
    id: row.id || "",
    slug: row.slug || row.id || "",
    name: row.name || "Unknown Agent",
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
      nri_score: typeof row.nri_score === 'number' ? row.nri_score : 0,
      logic_unit: reasoning,
      velocity: speed,
      hot_score: row.hot_score ?? row.metrics?.hot_score ?? 0,
    },
    capabilities: row.capability_tags || row.tags || [],
    pricing: {
      model: pricingData.model || "unknown",
      tiers: pricingData.tiers || [],
      isOSS: isOss,
      details: pricingData,
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
    social_proof: row.social_proof || {},
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
