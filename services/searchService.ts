/**
 * searchService.ts
 * Agent search domain: semantic/vector search, name/tag search, popular agents.
 * Extracted from DataService to reduce god-class size.
 */
import { Agent } from '../types';
import { AgentRegistryEntity } from '../app/types/registry';
import { AGENTS_DB } from '../agents';
import { CONFIG } from '../config';
import { supabase } from '../lib/supabase';
import { QUERY_FIELDS } from './dataService';

class SearchService {
    private useDB: boolean = CONFIG.USE_DATABASE;
    private localCache: Agent[] = [...AGENTS_DB];

    constructor() {
        if (!supabase) this.useDB = false;
    }

    /** V35.0: Neural Radar — vector similarity + category fallback */
    public async findSimilarAgents(agent: Agent | AgentRegistryEntity, count: number = 8): Promise<Agent[]> {
        const name = agent.name;
        const category = agent.category;
        const tags = 'capabilities' in agent ? agent.capabilities : (agent as Agent).capability_tags;

        if (this.useDB && supabase) {
            // 1. Hybrid/Vector search via server proxy
            try {
                if (typeof window === 'undefined') throw new Error('SSR');
                const queryText = `${name} ${category || ''} ${tags?.join(' ') || ''}`;
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const response = await fetch(`${window.location.origin}/api/hybrid`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: queryText, match_count: count + 1, match_threshold: 0.35 }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
                    console.warn('[SearchService] Hybrid API offline or returned non-JSON, falling back to SQL.');
                    throw new Error('Invalid API response');
                }

                const data = await response.json() as any;
                if (data.results?.length > 0) return (data.results as Agent[]).filter(a => a.id !== agent.id).slice(0, count);
            } catch (e) { console.warn('[SearchService] Hybrid search failed, mechanical fallback.', e); }

            // 2. Mechanical: category match
            try {
                const { data, error } = await supabase.from('agents').select(QUERY_FIELDS.AGENTS_MINIMAL).eq('category', category).neq('id', agent.id).limit(count);
                if (!error && data) return data as unknown as Agent[];
            } catch (_) { }
        }
        return this.localCache.filter(a => a.category === category && a.id !== agent.id).slice(0, count);
    }

    /** V35.1: SQL LIKE search by name */
    public async searchAgentsByName(query: string): Promise<Agent[]> {
        if (this.useDB && supabase) {
            try {
                const { data, error } = await supabase.from('agents').select(QUERY_FIELDS.AGENTS_FULL).ilike('name', `%${query}%`).limit(8);
                if (!error && data) return data as unknown as Agent[];
            } catch (_) { }
        }
        const lowerQ = (query || '').toLowerCase();
        return this.localCache.filter(a => (a.name || '').toLowerCase().includes(lowerQ)).slice(0, 8);
    }

    /** V35.2: Search by capability tags */
    public async searchAgentsByTags(tags: string[]): Promise<Agent[]> {
        if (tags.length === 0) return [];
        if (this.useDB && supabase) {
            try {
                const { data, error } = await supabase.from('agents').select(QUERY_FIELDS.AGENTS_FULL).contains('capability_tags', tags).limit(8);
                if (!error && data) return data as unknown as Agent[];
            } catch (_) { }
        }
        return this.localCache.filter(a => {
            const aTags = Array.isArray(a.tags) ? a.tags : [];
            return tags.some(t => aTags.includes(t));
        }).slice(0, 8);
    }

    /** V35.3: Popular agents by hot_score */
    public async getPopularAgents(): Promise<Agent[]> {
        if (this.useDB && supabase) {
            try {
                const { data, error } = await supabase.from('agents').select(QUERY_FIELDS.AGENTS_FULL).order('hot_score', { ascending: false }).limit(5);
                if (!error && data) return data as unknown as Agent[];
            } catch (_) { }
        }
        return [...this.localCache].sort((a, b) => (b.metrics?.hot_score || 0) - (a.metrics?.hot_score || 0)).slice(0, 5);
    }
}

export const searchService = new SearchService();
