import { ExternalStats } from '../../types';

export interface AgentRegistryEntity {
    // 基础身份 (Core Identity)
    id: string; 
    name: string; 
    slug: string; 
    slogan: string; 
    description?: string;
    category: string;
    entity_type?: string;
    
    // 多媒体资产 (Assets)
    assets: { 
        video_url: string; 
        video_poster: string; 
        cover_url: string; 
        gif_url?: string;
        audio_sample_url?: string;
        media_gallery?: any[];
    };
    
    // 核心性能面板 (Metrics)
    metrics: { 
        nri_score: number; 
        logic_unit: number; 
        velocity: number; 
        hot_score?: number;
    };
    
    // 标签体系 (Capabilities)
    capabilities: string[]; 
    tags?: string[];
    official_url?: string;
    persona_img?: string;
    
    // 商业化数据 (Pricing)
    pricing: { 
        model: string; 
        tiers: any[]; 
        isOSS: boolean;
        details?: any;
        price_text?: string;
    };
    
    // 扩展内容 (Content)
    faq?: any[];
    specs?: any;
    technical_specs?: any;
    tactical_badges?: string[];
    
    // 连接与交互 (Connectivity)
    connectivity?: {
        try_url?: string;
        docs_url?: string;
        api_url?: string;
        iframe_safe?: boolean;
    };
    
    // 深度数据 (Deep Data)
    full_description?: string;
    api_model_name?: string;
    developer_socials?: any;
    intel_feed?: any[];
    social_proof?: any;
    external_stats?: ExternalStats;
    demo_interaction?: any;
    vendor_slug?: string;
    display_mode?: string;
    version?: string;
    framework_stack?: string[];
    
    // 时间戳 (Timestamps)
    created_at?: string;
    updated_at?: string;
    last_verified_at?: string;
}
