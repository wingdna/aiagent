/**
 * contentService.ts
 * Content domain: agent intel feed and agent blog posts.
 * Extracted from DataService to reduce god-class size.
 */
import { AgentPost } from '../types';
import { supabase } from '../lib/supabase';
import { QUERY_FIELDS } from './dataService';

class ContentService {
    /** Fetch intel items linked to a specific agent */
    public async getAgentIntel(agentId: string): Promise<any[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('agent_intel')
            .select(QUERY_FIELDS.INTEL)
            .eq('agent_id_link', agentId)
            .order('published_at', { ascending: false })
            .limit(5);
        if (error) { console.error('[ContentService] getAgentIntel error:', error); return []; }
        return data || [];
    }

    /** Fetch recent intel feed (paginated) */
    public async getRecentIntel(page: number = 0, pageSize: number = 10): Promise<any[]> {
        if (!supabase) return [];
        const from = page * pageSize;
        const { data, error } = await supabase
            .from('agent_intel')
            .select(QUERY_FIELDS.INTEL)
            .order('published_at', { ascending: false })
            .range(from, from + pageSize - 1);
        if (error) { console.error('[ContentService] getRecentIntel error:', error); return []; }
        return data || [];
    }

    /** Fetch single intel item by ID */
    public async getAgentIntelById(id: string): Promise<any | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('agent_intel')
            .select(QUERY_FIELDS.INTEL)
            .eq('id', id)
            .single();
        if (error) { console.error('[ContentService] getAgentIntelById error:', error); return null; }
        return data;
    }

    /** Fetch paginated agent blog posts */
    public async getAgentPosts(page: number = 0, pageSize: number = 10): Promise<AgentPost[]> {
        if (!supabase) return [];
        const from = page * pageSize;
        const { data, error } = await supabase
            .from('agent_posts')
            .select(QUERY_FIELDS.POSTS)
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);
        if (error) { console.error('[ContentService] getAgentPosts error:', error); return []; }
        
        return (data || []).map((row: any) => ({
            id: row.id,
            agent_id_link: row.agent_id_link,
            title: row.content?.split('\n')[0].replace(/^#\s*/, '') || 'Untitled Post',
            slug: row.id,
            content: row.content,
            published_at: row.created_at,
            tags: [row.post_type || 'POST'],
            status: row.status
        } as unknown as AgentPost));
    }

    /** Fetch a single blog post by slug (using ID as slug) */
    public async getAgentPostBySlug(slug: string): Promise<AgentPost | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('agent_posts')
            .select(QUERY_FIELDS.POSTS)
            .eq('id', slug)
            .single();
        if (error) { console.error('[ContentService] getAgentPostBySlug error:', error); return null; }
        
        const row = data as any;
        return {
            id: row.id,
            agent_id_link: row.agent_id_link,
            title: row.content?.split('\n')[0].replace(/^#\s*/, '') || 'Untitled Post',
            slug: row.id,
            content: row.content,
            published_at: row.created_at,
            tags: [row.post_type || 'POST'],
            status: row.status
        } as unknown as AgentPost;
    }

    /** Fetch expert review for an agent */
    public async getExpertReview(agentId: string): Promise<any | null> {
        if (!supabase) return null;
        const { data, error } = await supabase
            .from('agent_reviews')
            .select('*')
            .eq('agent_id_link', agentId)
            .maybeSingle();
        if (error) {
            console.error('[ContentService] getExpertReview error:', error);
            return null;
        }
        return data;
    }
}

export const contentService = new ContentService();
