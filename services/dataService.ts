/**
 * dataService.ts — Refactored (god-class decomposed)
 *
 * This file now acts as a thin facade that:
 *  1. Owns user/session management (getUserProfile, updateUserProfile, signOut, etc.)
 *  2. Re-exports domain sub-services to maintain backward-compatible call sites:
 *       dataService.getAgents(...)       → agentQueryService
 *       dataService.findSimilarAgents()  → searchService
 *       dataService.getAgentIntel()      → contentService
 *       dataService.getVendorBySlug()    → vendorService
 *
 * Sub-services can also be imported directly for new code to avoid coupling.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Agent, UserProfile, AgentPost, Vendor } from '../types';
import { AgentRegistryEntity } from '../app/types/registry';
import { AGENTS_DB } from '../agents';
import { CONFIG } from '../config';
import { supabase } from '../lib/supabase';
import { isUUID } from '../utils';

// ── Shared constants (used by sub-services) ───────────────────────────────────
export const QUERY_FIELDS = {
  AGENTS_FULL: 'id, slug, name, description, category, entity_type, nri_score, hot_score, video_url, cover_url, display_mode, specs, pricing, metrics, capability_tags, media_gallery, vendor_id, vendor_slug, slogan, technical_specs, social_proof, external_stats, framework_stack, developer_socials, faq_content',
  AGENTS_DETAIL: 'id, slug, name, description, full_description, category, nri_score, hot_score, entity_type, video_url, cover_url, display_mode, specs, pricing, metrics, capability_tags, tags, media_gallery, vendor_id, vendor_slug, slogan, technical_specs, social_proof, external_stats, framework_stack, developer_socials, connectivity, voice_config, faq_content',
  AGENTS_MINIMAL: 'id, slug, name, description, entity_type, nri_score, hot_score, video_url, cover_url, display_mode, specs, pricing, metrics, capability_tags, media_gallery, vendor_id, vendor_slug, slogan',
  INTEL: 'id, agent_slug, intel_type, title, summary, source_url, published_at, created_at, agent_id_link, image_url, agents!agent_intel_agent_id_link_fkey(name, slug)',
  POSTS: 'id, agent_id_link, content, created_at, post_type, status, agents(name, slug)',
  VENDORS: 'id, slug, name, description, website_url, logo_url, verified, founded_at, socials',
  PROFILES: 'id, username, xp, balance, reputation, achievements, badges, role, interests, skills',
  MODEL_LINKS_MODEL: 'model_id',
  MODEL_LINKS_AGENT: 'agent_id'
};

// ── Domain sub-services (re-exported for direct use in new code) ──────────────
export { agentQueryService } from './agentQueryService';
export { searchService } from './searchService';
export { contentService } from './contentService';
export { vendorService } from './vendorService';

// ── fetchAgentsPipeline (used by AgentGrid — kept here for compatibility) ─────
export type Provider = 'google' | 'github' | 'apple';

const PAGE_SIZE = 20;

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

  const getLocalFallback = () => {
    let filtered = [...AGENTS_DB];
    if (filterTag !== 'ALL') filtered = filtered.filter(a => a.category === filterTag);
    filtered.sort((a, b) => {
      let valA: any = 0, valB: any = 0;
      if (sortBy === 'hot') { valA = a.metrics?.hot_score || 0; valB = b.metrics?.hot_score || 0; }
      else if (sortBy === 'rank' || sortBy === 'score') { valA = a.metrics?.nri_score || 0; valB = b.metrics?.nri_score || 0; }
      else if (sortBy === 'speed') { valA = a.metrics?.speed || 0; valB = b.metrics?.speed || 0; }
      else if (sortBy === 'creative') { valA = a.metrics?.creativity || 0; valB = b.metrics?.creativity || 0; }
      else if (sortBy === 'logic') { valA = a.metrics?.reasoning || 0; valB = b.metrics?.reasoning || 0; }
      else { valA = a.metrics?.hot_score || 0; valB = b.metrics?.hot_score || 0; }
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    });
    const sliced = filtered.slice(from, from + PAGE_SIZE);
    const rawList = isRefresh ? sliced : [...currentStateAgents, ...sliced];
    const uniqueAgents = Array.from(new Map(rawList.map(item => [item.id, item])).values());
    return { agents: uniqueAgents, nextPage: pageToFetch + 1, hasMore: sliced.length >= PAGE_SIZE, error: null };
  };

  try {
    if (!supabase) throw new Error('Database Disconnected');

    if (filterTag === 'PERSONALIZED') {
      if (isRefresh) {
        const personalized = await dataService.getPersonalizedAgents();
        return { agents: personalized, nextPage: 1, hasMore: false, error: null };
      }
      return { agents: currentStateAgents, nextPage: currentPage, hasMore: false, error: null };
    }

    let query: any = supabase.from('agents').select(QUERY_FIELDS.AGENTS_FULL);
    if (filterTag !== 'ALL') query = query.eq('category', filterTag);

    if (sortBy === 'hot') query = query.order('status', { ascending: false, nullsFirst: false }).order('hot_score', { ascending: false, nullsFirst: false }).order('nri_score', { ascending: false }).order('id', { ascending: true });
    else if (sortBy === 'rank' || sortBy === 'score') query = query.order('nri_score', { ascending: false, nullsFirst: false }).order('hot_score', { ascending: false }).order('id', { ascending: true });
    else if (sortBy === 'speed') query = query.order('metrics->speed', { ascending: false, nullsFirst: false }).order('id', { ascending: true });
    else if (sortBy === 'creative') query = query.order('metrics->creativity', { ascending: false, nullsFirst: false }).order('id', { ascending: true });
    else if (sortBy === 'logic') query = query.order('metrics->reasoning', { ascending: false, nullsFirst: false }).order('id', { ascending: true });
    else query = query.order('hot_score', { ascending: false, nullsFirst: false }).order('nri_score', { ascending: false }).order('id', { ascending: true });

    const { data, error } = await query.range(from, to);
    if (error) throw error;

    const rawList = isRefresh ? (data || []) : [...currentStateAgents, ...(data || [])];
    const uniqueAgents = Array.from(new Map(rawList.map((item: any) => [item.id, item])).values());
    return { agents: uniqueAgents, nextPage: pageToFetch + 1, hasMore: (data || []).length >= PAGE_SIZE, error: null };
  } catch (err) {
    console.warn('[fetchAgentsPipeline] DB failed, local fallback.', err);
    return getLocalFallback();
  }
};

// ── DataService facade: user/session + backward-compat delegation ─────────────
class DataService {
  private useDB: boolean = CONFIG.USE_DATABASE;
  private localCache: Agent[] = [...AGENTS_DB];
  public supabase: SupabaseClient | null = supabase;

  constructor() { if (!this.supabase) this.useDB = false; }

  public async getSession() {
    if (!this.supabase) return null;
    const { data } = await (this.supabase.auth as any).getSession();
    return data.session;
  }

  // ── Backward-compat delegation to agentQueryService ─────────────────────
  public async getAgents(page?: number, limit?: number, category?: string, sortBy?: string, order?: string) {
    const { agentQueryService } = await import('./agentQueryService');
    return agentQueryService.getAgents(page, limit, category, sortBy, order);
  }
  public async getAgentById(id: string) {
    const { agentQueryService } = await import('./agentQueryService');
    return agentQueryService.getAgentById(id);
  }
  public async getAllAgents() {
    const { agentQueryService } = await import('./agentQueryService');
    return agentQueryService.getAllAgents();
  }
  public async incrementAgentStat(agentId: string, statType: 'like' | 'win' | 'loss') {
    const { agentQueryService } = await import('./agentQueryService');
    return agentQueryService.incrementAgentStat(agentId, statType);
  }

  public async getActiveAgentsForSitemap(limit?: number) {
    const { agentQueryService } = await import('./agentQueryService');
    return agentQueryService.getActiveAgentsForSitemap(limit);
  }
  public async getPersonalizedAgents() {
    const { agentQueryService } = await import('./agentQueryService');
    return agentQueryService.getPersonalizedAgents(this.getUserProfile.bind(this));
  }

  // ── Backward-compat delegation to searchService ──────────────────────────
  public async findSimilarAgents(agent: Agent | AgentRegistryEntity, count?: number) {
    const { searchService } = await import('./searchService');
    return searchService.findSimilarAgents(agent, count);
  }
  public async searchAgentsByName(query: string) {
    const { searchService } = await import('./searchService');
    return searchService.searchAgentsByName(query);
  }
  public async searchAgentsByTags(tags: string[]) {
    const { searchService } = await import('./searchService');
    return searchService.searchAgentsByTags(tags);
  }
  public async getPopularAgents() {
    const { searchService } = await import('./searchService');
    return searchService.getPopularAgents();
  }

  // ── Backward-compat delegation to contentService ─────────────────────────
  public async getAgentIntel(agentId: string, agentSlug?: string) {
    const { contentService } = await import('./contentService');
    return contentService.getAgentIntel(agentId, agentSlug);
  }
  public async getRecentIntel(page?: number, pageSize?: number) {
    const { contentService } = await import('./contentService');
    return contentService.getRecentIntel(page, pageSize);
  }
  public async getAgentIntelById(id: string) {
    const { contentService } = await import('./contentService');
    return contentService.getAgentIntelById(id);
  }
  public async getAgentPosts(page?: number, pageSize?: number) {
    const { contentService } = await import('./contentService');
    return contentService.getAgentPosts(page, pageSize);
  }
  public async getAgentPostBySlug(slug: string) {
    const { contentService } = await import('./contentService');
    return contentService.getAgentPostBySlug(slug);
  }
  public async getExpertReview(agentId: string, agentSlug?: string) {
    const { contentService } = await import('./contentService');
    return contentService.getExpertReview(agentId, agentSlug);
  }

  // ── Backward-compat delegation to vendorService ──────────────────────────
  public async getVendorBySlug(slug: string) {
    const { vendorService } = await import('./vendorService');
    return vendorService.getVendorBySlug(slug);
  }
  public async getAgentsByVendor(vendorSlug: string, excludeAgentId?: string) {
    const { vendorService } = await import('./vendorService');
    return vendorService.getAgentsByVendor(vendorSlug, excludeAgentId);
  }
  public async getLinkedEntities(agent: Agent) {
    const { vendorService } = await import('./vendorService');
    return vendorService.getLinkedEntities(agent);
  }

  // ── User / session management (owned by DataService) ─────────────────────
  public saveRecentlyViewed(agent: Agent) {
    if (typeof window === 'undefined') return;
    try {
      const existing = JSON.parse(localStorage.getItem('recently_viewed_agents') || '[]');
      const filtered = existing.filter((a: any) => a.id !== agent.id);
      const minimal = { id: agent.id, name: agent.name, description: agent.description, tags: agent.tags || agent.capability_tags };
      localStorage.setItem('recently_viewed_agents', JSON.stringify([minimal, ...filtered].slice(0, 10)));
    } catch (e) { console.warn('[DataService] saveRecentlyViewed failed:', e); }
  }

  public async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!this.useDB || !this.supabase) return null;
    try {
      const { data, error } = await this.supabase.from('profiles').select(QUERY_FIELDS.PROFILES).eq('id', userId).single();
      if (error) return null;
      return data as unknown as UserProfile;
    } catch (_) { return null; }
  }

  public async updateUserProfile(profile: UserProfile): Promise<void> {
    if (!this.useDB || !this.supabase) return;
    try { await this.supabase.from('profiles').upsert(profile); } catch (_) { }
  }

  public async signOut() {
    if (!this.supabase) return;
    return await this.supabase.auth.signOut();
  }

  public async signInWithOAuth(provider: Provider) {
    if (!this.supabase) return { error: new Error('No database connection') };
    
    // 🚨 动态获取当前域名，严禁硬编码 localhost
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback` 
      : undefined;

    return await this.supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        // 1. 确保 redirectTo 严格指向我们配置的 callback 地址
        redirectTo,
        // 2. 🚨 核心修复：强制开启 PKCE 模式，确保返回 ?code= 而不是 #access_token
        flowType: 'pkce',
      } as any
    });
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
