
import { SupabaseClient } from '@supabase/supabase-js';
import { Agent, UserProfile } from '../types';
import { AGENTS_DB } from '../agents';
import { CONFIG } from '../config';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 24; // Tactical batch size

export const fetchAgentsPipeline = async (
  currentStateAgents: any[], 
  currentPage: number, 
  isRefresh: boolean = false,
  filterTag: string = 'ALL',
  sortBy: string = 'hot'
) => {
  const pageToFetch = isRefresh ? 0 : currentPage;
  const from = pageToFetch * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    if (!supabase) throw new Error("Database Disconnected");

    let query = supabase.from('agents').select('*');

    if (filterTag !== 'ALL') {
      query = query.eq('category', filterTag);
    }

    // 1. Database Query with Deterministic Sorting (Crucial for Pagination)
    if (sortBy === 'hot') {
      query = query.order('hot_score', { ascending: false, nullsFirst: false }) // Primary Sort: Kinetic Heat
                   .order('nri_score', { ascending: false }) // Secondary Sort: Authority
                   .order('id', { ascending: true }); // Tie-breaker for absolute deterministic pagination
    } else if (sortBy === 'rank' || sortBy === 'score') {
      query = query.order('nri_score', { ascending: false, nullsFirst: false })
                   .order('hot_score', { ascending: false })
                   .order('id', { ascending: true });
    } else if (sortBy === 'speed') {
      query = query.order('metrics->speed', { ascending: false, nullsFirst: false })
                   .order('id', { ascending: true });
    } else if (sortBy === 'creative') {
      query = query.order('metrics->creativity', { ascending: false, nullsFirst: false })
                   .order('id', { ascending: true });
    } else if (sortBy === 'logic') {
      query = query.order('metrics->reasoning', { ascending: false, nullsFirst: false })
                   .order('id', { ascending: true });
    } else {
      query = query.order('hot_score', { ascending: false, nullsFirst: false })
                   .order('nri_score', { ascending: false })
                   .order('id', { ascending: true });
    }

    const { data, error } = await query.range(from, to);

    if (error) throw error;

    // 2. Data Combination
    const rawList = isRefresh ? (data || []) : [...currentStateAgents, ...(data || [])];
    
    // 3. ID-Based Deduplication (Physical safety net against UI duplicate keys)
    const uniqueAgents = Array.from(
      new Map(rawList.map(item => [item.id, item])).values()
    );

    // 4. Determine Pagination State
    const isEndReached = (data || []).length < PAGE_SIZE;

    return {
      agents: uniqueAgents,
      nextPage: pageToFetch + 1,
      hasMore: !isEndReached,
      error: null
    };
  } catch (err) {
    console.error("[YouAgent Data Core] Pipeline Fracture:", err);
    return { error: err };
  }
};

// Defined for OAuth providers used in LoginModal
export type Provider = 'google' | 'github' | 'apple';

class DataService {
  private useDB: boolean = CONFIG.USE_DATABASE;
  private localCache: Agent[] = [...AGENTS_DB];
  public supabase: SupabaseClient | null = supabase;

  constructor() {
    if (!this.supabase) {
      this.useDB = false;
    }
  }

  public async getSession() {
    if (!this.supabase) return null;
    const { data } = await (this.supabase.auth as any).getSession();
    return data.session;
  }

  // --- AGENTS (Protocol V4.2 Redirected to Edge Gateway) ---

  public async getAgents(page: number = 0, limit: number = 20, category: string = 'ALL', sortBy: string = 'hot', order: string = 'desc'): Promise<Agent[]> {
    if (!this.useDB || !this.supabase) return this.localCache.slice(page * limit, (page + 1) * limit);

    try {
      let query = this.supabase.from('agents').select('*');
      
      if (category !== 'ALL') {
        query = query.eq('category', category);
      }
      
      // Apply sorting
      if (sortBy === 'hot') {
        query = query.order('hot_score', { ascending: order === 'asc' });
      } else if (sortBy === 'new') {
        query = query.order('created_at', { ascending: order === 'asc' });
      } else if (sortBy === 'top') {
        query = query.order('nri_score', { ascending: order === 'asc' });
      }

      const { data, error } = await query.range(page * limit, (page + 1) * limit - 1);
      
      if (error) throw error;
      
      let agents = (data as Agent[]) || [];
      
      // V-GOLDEN-GATE: Sanitize Data
      agents = agents
        .filter((a: any) => a && a.id)
        .map((a: any) => ({
            ...a,
            pricing_model: a.pricing_model || 'Unknown',
            benchmarks: a.benchmarks || {},
            market_analysis: a.market_analysis || {}
        }));

      return agents;
    } catch (dbError) {
      console.error("[DB] Direct fetch failed:", dbError);
      return [];
    }
  }

  public async getAgentById(id: string): Promise<Agent | null> {
    try {
      const response = await fetch(`/api/agent/${encodeURIComponent(id)}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) throw new Error(`HTTP_ERROR_${response.status}`);
      return await response.json() as Agent;
    } catch (e) {
      if (this.supabase) {
        try {
          const { data, error } = await this.supabase
            .from('agents')
            .select('*')
            .eq('id', id)
            .single();
          
          if (error) throw error;
          return data as Agent;
        } catch (dbError) {
          return null;
        }
      }
      return null;
    }
  }

  public async incrementAgentStat(agentId: string, statType: 'like' | 'win' | 'loss'): Promise<void> {
    if (!this.useDB || !this.supabase) return;
    try {
      await this.supabase.rpc('increment_stat', { row_id: agentId, stat_type: statType });
    } catch (e) {
      console.error("[STATS] Update failed:", e);
    }
  }

  // --- USER PROFILE (Direct to Supabase - Private Data) ---

  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!this.useDB || !this.supabase) return null;
    try {
      const { data, error } = await this.supabase.from('profiles').select('*').eq('id', userId).single();
      if (error) return null;
      return data as UserProfile;
    } catch (e) { return null; }
  }

  public async updateUserProfile(profile: UserProfile): Promise<void> {
    if (!this.useDB || !this.supabase) return;
    try { await this.supabase.from('profiles').upsert(profile); } catch (e) { }
  }

  public async signOut() {
    if (!this.supabase) return;
    return await this.supabase.auth.signOut();
  }

  public async signInWithOAuth(provider: Provider) {
    if (!this.supabase) return { error: new Error("No database connection") };
    return await this.supabase.auth.signInWithOAuth({ provider });
  }

  public subscribeToProfile(userId: string, callback: (payload: any) => void) {
    if (!this.supabase) return null;
    return this.supabase
      .channel(`profile:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, (payload) => {
        callback(payload.new);
      })
      .subscribe();
  }

  public isUsingDB(): boolean { return this.useDB; }
}

export const dataService = new DataService();
