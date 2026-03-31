/**
 * agentQueryService.ts
 * Core agent data-access domain: listing, detail, pagination, personalization.
 * Extracted from DataService to reduce god-class size.
 */
import { Agent, AgentRow, UserProfile } from '../types';
import { SEMANTIC_GROUPS } from '../app/constants/categories';
import { AGENTS_DB } from '../agents';
import { CONFIG } from '../config';
import { supabase } from '../lib/supabase';
import { isUUID } from '../utils';
import { QUERY_FIELDS } from './dataService';

const PAGE_SIZE_DEFAULT = 20;

class AgentQueryService {
    private useDB: boolean = CONFIG.USE_DATABASE;
    private localCache: Agent[] = [...AGENTS_DB];

    constructor() {
        if (!supabase) this.useDB = false;
    }

    private _getLocalAgents(page: number, limit: number, category: string, sortBy: string, order: string): Agent[] {
        let filtered = [...this.localCache];
        if (category !== 'ALL') filtered = filtered.filter(a => a.category === category);
        filtered.sort((a, b) => {
            let valA: any = 0, valB: any = 0;
            if (sortBy === 'hot') { valA = a.metrics?.hot_score || 0; valB = b.metrics?.hot_score || 0; }
            else if (sortBy === 'top') { valA = a.metrics?.nri_score || 0; valB = b.metrics?.nri_score || 0; }
            else if (sortBy === 'new') { valA = a.id; valB = b.id; }
            if (valA < valB) return order === 'asc' ? -1 : 1;
            if (valA > valB) return order === 'asc' ? 1 : -1;
            return 0;
        });
        return filtered.slice(page * limit, page * limit + limit);
    }

    private _mapAgentRowToAgent(row: AgentRow): Agent {
        return {
            id: row.id,
            name: row.name,
            description: row.description || '',
            slogan: row.slogan || undefined,
            metrics: row.metrics as any,
            stats: row.stats as any,
            connectivity: row.connectivity as any,
            tags: row.tags || [],
            category: row.category || undefined,
            video_poster: row.video_poster || undefined,
            persona_img: row.persona_img || undefined,
            voice_config: row.voice_config as any,
            created_at: row.created_at || undefined,
            content_hash: row.content_hash || undefined,
            last_verified_at: row.last_verified_at || undefined,
            tactical_badges: row.tactical_badges || undefined,
            external_stats: row.external_stats as any,
            // 修复：确保 nri_score 被正确提取，优先使用物理列，如果为 0 则尝试从 metrics 获取
            nri_score: row.nri_score && row.nri_score > 0 ? row.nri_score : ((row.metrics as any)?.nri_score || 0),
            full_description: row.full_description || undefined,
            market_analysis: row.market_analysis as any,
            intel_feed: row.intel_feed as any,
            capabilities: row.capabilities || undefined,
            api_base_url: row.api_base_url || undefined,
            api_model_name: row.api_model_name || undefined,
            provider_id: row.provider_id || undefined,
            seo_metadata: row.seo_metadata as any,
            technical_specs: row.technical_specs as any,
            social_proof: row.social_proof as any,
            execution_config: row.execution_config as any,
            related_agents: row.related_agents || undefined,
            updated_at: row.updated_at || undefined,
            status: row.status as any,
            last_checked_at: row.last_checked_at || undefined,
            official_url: row.official_url || undefined,
            benchmarks: row.benchmarks as any,
            pricing: row.pricing as any,
            faq_content: row.faq_content as any,
            framework_stack: row.framework_stack || undefined,
            developer_socials: row.developer_socials as any,
            slug: row.slug || '',
            version: row.version || undefined,
            embedding: row.embedding as any,
            total_views: row.total_views || undefined,
            execution_count: row.execution_count || undefined,
            vendor_id: row.vendor_id || undefined,
            vendor_slug: row.vendor_slug || undefined,
            specs: row.specs as any,
            entity_type: row.entity_type as any,
            hot_score: row.hot_score || undefined,
            video_url: row.video_url || undefined,
            gif_url: row.gif_url || undefined,
            cover_url: row.cover_url || undefined,
            media_gallery: row.media_gallery as any,
            audio_sample_url: row.audio_sample_url || undefined,
            demo_interaction: row.demo_interaction as any,
            display_mode: row.display_mode || undefined,
            capability_tags: row.capability_tags as any,
            is_active: row.is_active || undefined,
            discovery_source: row.discovery_source || undefined,
            health_check_failures: row.health_check_failures || undefined,
        };
    }

    public async getUniqueCategories(): Promise<string[]> {
        const isClient = typeof window !== 'undefined';
        if (isClient) {
            try {
                const response = await fetch('/api/categories?_t=' + Date.now());
                if (response.ok) {
                    return await response.json();
                }
            } catch (e) {
                // fallback
            }
        }

        if (!this.useDB || !supabase) {
            return Array.from(new Set(this.localCache.map(a => a.category).filter(Boolean) as string[]));
        }
        try {
            const { data, error } = await supabase
                .from('agents')
                .select('category')
                .not('category', 'is', null);
            if (error) throw error;
            return Array.from(new Set((data || []).map(r => r.category)));
        } catch (e) {
            console.warn('[AgentQueryService] getUniqueCategories failed:', e);
            return Array.from(new Set(this.localCache.map(a => a.category).filter(Boolean) as string[]));
        }
    }

    public async getAgents(page: number = 0, limit: number = 20, category: string = 'ALL', sortBy: string = 'hot', order: string = 'desc', q: string | null = null): Promise<Agent[]> {
        const isClient = typeof window !== 'undefined';
        
        // 🛡️ Protocol V5.0: Client-side Proxy Layer
        if (isClient) {
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: limit.toString(),
                    category,
                    sortBy,
                    order
                });
                if (q) params.set('q', q);
                params.set('_t', Date.now().toString());
                const response = await fetch(`/api/agents?${params.toString()}`);
                if (response.ok) {
                    const result = await response.json() as any;
                    // Note: /api/agents returns { data: Agent[] }, but getAgents expects Agent[]
                    return result.data || [];
                }
            } catch (e) {
                // Silent fallback
            }
            return this._getLocalAgents(page, limit, category, sortBy, order);
        }

        if (!this.useDB || !supabase) return this._getLocalAgents(page, limit, category, sortBy, order);
        try {
            // 🛡️ SQL 引擎回归：物理单维度查询协议 (Strict Single-Dimension Query)
            let query = supabase.from('agents').select('id, name, slogan, category, cover_url, video_url, nri_score, metrics, pricing, faq_content, tags, capability_tags, hot_score');
            
            if (category !== 'ALL') {
                // 强制单维度：仅匹配主分类
                query = query.eq('category', (category || '').trim());
            } else if (q) {
                // 强制单维度：仅匹配名称
                const searchTerm = `%${q}%`;
                query = query.ilike('name', searchTerm);
            }

            if (sortBy === 'hot') query = query.order('hot_score', { ascending: order === 'asc' });
            else if (sortBy === 'new') query = query.order('created_at', { ascending: order === 'asc' });
            else if (sortBy === 'top') query = query.order('nri_score', { ascending: order === 'asc' });
            
            const from = page * limit;
            const to = (page + 1) * limit - 1;
            const { data, error } = await query.range(from, to);
            
            if (error) throw error;
            return ((data as unknown as AgentRow[]) || [])
                .filter((a: any) => a && a.id)
                .map((a: AgentRow) => this._mapAgentRowToAgent(a));
        } catch (e) {
            console.warn('[AgentQueryService] getAgents DB failed, local fallback.', e);
            return this._getLocalAgents(page, limit, category, sortBy, order);
        }
    }

    public async getAgentById(id: string): Promise<Agent | null> {
        const isClient = typeof window !== 'undefined';
        
        // 🛡️ Protocol V5.0: Client-side Proxy Layer
        // If on client, fetch from our own API to avoid CORS/Failed to fetch issues
        if (isClient) {
            try {
                const response = await fetch(`/api/agent/${id}?_t=${Date.now()}`);
                if (response.ok) {
                    return await response.json();
                }
                // If API fails, fallback to local cache
                console.warn('[AgentQueryService] Client-side API fetch failed, falling back to local cache.');
            } catch (e) {
                // Network error or blocked, fallback silently to local cache
            }
            const localAgent = this.localCache.find(a => a.id === id || a.slug === id);
            return localAgent || null;
        }

        if (!this.useDB || !supabase) {
            const localAgent = this.localCache.find(a => a.id === id || a.slug === id);
            return localAgent || null;
        }

        try {
            // Step 1: Query base agent data
            let q = supabase.from('agents').select(QUERY_FIELDS.AGENTS_DETAIL);
            q = isUUID(id) ? q.eq('id', id) : q.eq('slug', id);
            const { data: agentData, error: agentError } = await q.single();
            
            if (agentError) { 
                // Only log if it's not a "not found" error
                if (agentError.code !== 'PGRST116') {
                    console.error('[AgentQueryService] getAgentById base error:', agentError.message); 
                }
                const localAgent = this.localCache.find(a => a.id === id || a.slug === id);
                return localAgent || null;
            }

            if (!agentData) return null;

            const agentRow = agentData as unknown as AgentRow;
            const agent = this._mapAgentRowToAgent(agentRow);

            // Step 2: Query linked models separately to avoid join ambiguity
            try {
                const agentId = agentRow.id;
                const { data: modelsData, error: modelsError } = await supabase
                    .from('agent_model_links')
                    .select('model_id')
                    .eq('agent_id', agentId);
                
                if (!modelsError && modelsData) {
                    // Merge in memory
                    (agent as any).linked_models = modelsData.map(m => m.model_id);
                }
            } catch (linkErr) {
                console.warn('[AgentQueryService] Linked models fetch failed (non-fatal):', linkErr);
            }

            return agent;
        } catch (e: any) { 
            // Suppress "Failed to fetch" fatal logs as they are common network issues
            if (!e.message?.includes('Failed to fetch')) {
                console.error('[AgentQueryService] getAgentById fatal:', e.message); 
            }
            const localAgent = this.localCache.find(a => a.id === id || a.slug === id);
            return localAgent || null;
        }
    }

    public async getAllAgents(): Promise<Agent[]> {
        if (!supabase) return [];
        let allAgents: Agent[] = [], page = 0, hasMore = true;
        const pageSize = 1000;
        while (hasMore) {
            const { data, error } = await supabase.from('agents').select(QUERY_FIELDS.AGENTS_FULL).range(page * pageSize, (page + 1) * pageSize - 1);
            if (error) { console.error('[AgentQueryService] getAllAgents error:', error); break; }
            if (data && data.length > 0) { 
                allAgents = [...allAgents, ...(data as unknown as AgentRow[]).map(a => this._mapAgentRowToAgent(a))]; 
                if (data.length < pageSize) hasMore = false; 
                page++; 
            }
            else hasMore = false;
        }
        return allAgents;
    }

    public async incrementAgentStat(agentId: string, statType: 'like' | 'win' | 'loss'): Promise<void> {
        if (!this.useDB || !supabase) return;
        try { await supabase.rpc('increment_stat', { row_id: agentId, stat_type: statType }); } catch (_) { }
    }

    public async getActiveAgentsForSitemap(limit: number = 5000): Promise<Agent[]> {
        if (!this.useDB || !supabase) return this.localCache.filter(a => a.is_active !== false).slice(0, limit);
        try {
            const { data, error } = await supabase
                .from('agents')
                .select('slug, id, updated_at')
                .eq('is_active', true)
                .order('updated_at', { ascending: false })
                .limit(limit);
            if (error) throw error;
            return (data as unknown as Agent[]);
        } catch (e) {
            console.warn('[AgentQueryService] getActiveAgentsForSitemap failed, local fallback.', e);
            return this.localCache.filter(a => a.is_active !== false).slice(0, limit);
        }
    }

    public async getPersonalizedAgents(getUserProfile: (id: string) => Promise<UserProfile | null>): Promise<Agent[]> {
        let queryText = '';
        // Context gathering
        const { data: sessionData } = supabase ? await (supabase.auth as any).getSession() : { data: null };
        if (sessionData?.session?.user) {
            const profile = await getUserProfile(sessionData.session.user.id);
            if (profile) {
                const parts = [];
                if (profile.role) parts.push(`Role: ${profile.role}`);
                if (profile.interests?.length) parts.push(`Interests: ${profile.interests.join(', ')}`);
                if (profile.skills?.length) parts.push(`Skills: ${profile.skills.join(', ')}`);
                queryText = parts.join('. ');
            }
        } else {
            try {
                const recent = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('recently_viewed_agents') || '[]') : [];
                if (recent.length > 0) {
                    queryText = `User recently viewed: ${recent.slice(0, 3).map((a: any) => `${a.name}: ${a.tags?.join(', ')} ${a.description}`).join('. ')}`;
                }
            } catch (_) { }
        }

        if (queryText && queryText.length > 10 && typeof window !== 'undefined') {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(`${window.location.origin}/api/hybrid`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: queryText, match_count: 12, match_threshold: 0.4 }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                // 强制的防御性 Fetch 规范
                if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
                    console.warn('[AgentQueryService] Hybrid API 离线或返回非 JSON，切回本地兜底逻辑');
                    throw new Error('Invalid API response');
                }

                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) return data as unknown as Agent[];
            } catch (e) { 
                console.warn('[AgentQueryService] Personalized vector resonance failed, using SQL fallback.', e); 
            }
        }

        if (this.useDB && supabase) {
            try {
                const { data, error } = await supabase.from('agents').select(QUERY_FIELDS.AGENTS_FULL).order('nri_score', { ascending: false }).order('hot_score', { ascending: false }).limit(12);
                if (!error && data) return (data as unknown as AgentRow[]).map(a => this._mapAgentRowToAgent(a));
            } catch (_) { }
        }

        return [...this.localCache]
            .sort((a, b) => ((b.metrics?.nri_score || 0) * 0.7 + (b.metrics?.hot_score || 0) * 0.3) - ((a.metrics?.nri_score || 0) * 0.7 + (a.metrics?.hot_score || 0) * 0.3))
            .slice(0, 12);
    }
}

export const agentQueryService = new AgentQueryService();
