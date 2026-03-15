/**
 * vendorService.ts
 * Vendor ecosystem domain: vendor profiles, vendor-linked agents, neural topology.
 * Extracted from DataService to reduce god-class size.
 */
import { Agent, Vendor } from '../types';
import { AGENTS_DB } from '../agents';
import { CONFIG } from '../config';
import { supabase } from '../lib/supabase';
import { QUERY_FIELDS } from './dataService';

class VendorService {
    private useDB: boolean = CONFIG.USE_DATABASE;
    private localCache: Agent[] = [...AGENTS_DB];

    constructor() {
        if (!supabase) this.useDB = false;
    }

    public async getVendorBySlug(slug: string): Promise<Vendor | null> {
        if (!this.useDB || !supabase) return null;
        try {
            const { data, error } = await supabase
                .from('vendors')
                .select(QUERY_FIELDS.VENDORS)
                .eq('slug', slug)
                .single();
            if (error) throw error;
            return data as unknown as Vendor;
        } catch (e) { console.warn('[VendorService] getVendorBySlug failed:', e); return null; }
    }

    public async getAgentsByVendor(vendorSlug: string, excludeAgentId?: string): Promise<Agent[]> {
        if (!this.useDB || !supabase) return [];
        try {
            let query = supabase
                .from('agents')
                .select(QUERY_FIELDS.AGENTS_FULL)
                .eq('vendor_slug', vendorSlug)
                .order('nri_score', { ascending: false });
            if (excludeAgentId) query = query.neq('id', excludeAgentId);
            const { data, error } = await query;
            if (error) throw error;
            return (data as unknown as Agent[]) || [];
        } catch (e) {
            console.warn('[VendorService] getAgentsByVendor DB failed, local fallback.', e);
            return this.localCache
                .filter(a => a.vendor_slug === vendorSlug && a.id !== excludeAgentId)
                .sort((a, b) => (b.metrics?.nri_score || 0) - (a.metrics?.nri_score || 0));
        }
    }

    /** Bi-directional neural topology: agent↔model links */
    public async getLinkedEntities(agent: Agent): Promise<Agent[]> {
        if (!this.useDB || !supabase) return [];
        try {
            let linkedIds: string[] = [];

            if (agent.entity_type === 'ai_agent') {
                const { data, error } = await supabase
                    .from('agent_model_links')
                    .select(QUERY_FIELDS.MODEL_LINKS_MODEL)
                    .eq('agent_id', agent.id);
                if (error) throw error;
                linkedIds = data.map((d: any) => d.model_id);
            } else if (agent.entity_type === 'foundation_model') {
                const { data, error } = await supabase
                    .from('agent_model_links')
                    .select(QUERY_FIELDS.MODEL_LINKS_AGENT)
                    .eq('model_id', agent.id);
                if (error) throw error;
                linkedIds = data.map((d: any) => d.agent_id);
            }

            if (linkedIds.length === 0) return [];

            const { data: agents, error: agentsError } = await supabase
                .from('agents')
                .select(QUERY_FIELDS.AGENTS_MINIMAL)
                .in('id', linkedIds);
            if (agentsError) throw agentsError;
            return (agents as unknown as Agent[]) || [];
        } catch (e) { console.warn('[VendorService] getLinkedEntities failed:', e); return []; }
    }
}

export const vendorService = new VendorService();
