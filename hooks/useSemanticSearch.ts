import { useState, useCallback } from 'react';
import { AgentRegistryEntity } from '../app/types/registry';
import { mapToRegistry } from '../utils/mapper';
import { Agent } from '../types';
import { dataService } from '../services/dataService';
import { safeFetch } from '../services/api_guard';
import { useUserKeys } from './useUserKeys';
import { supabase } from '../lib/supabase';

export const useSemanticSearch = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { keys } = useUserKeys();

  const search = useCallback(async (query: string, options?: { threshold?: number, count?: number }): Promise<any[]> => {
    if (!query) {
      setResults([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      let agents: Agent[] = [];

      // Text Search
      if (!query.trim()) {
          setResults([]);
          setLoading(false);
          return [];
      }

      // 0. Intent Parsing (Fast heuristic for pricing)
      const isCheapOrFree = /免费|便宜|free|cheap/i.test(query);

      // 1. Server-Side Hybrid Search
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (keys.siliconflow) {
          headers['x-siliconflow-key'] = keys.siliconflow;
      }

      const data = await safeFetch('/api/hybrid', {
          method: 'POST',
          headers,
          body: JSON.stringify({ query })
      }) as any;

      if (data.offline) {
          setError("SYSTEM_OFFLINE");
          setLoading(false);
          return [];
      }

      agents = data.results || [];

      // 2. Apply Pricing Filter (Client-Side)
      if (isCheapOrFree) {
          agents = agents.filter(agent => {
          const pricingType = (agent.pricing?.type || '').toLowerCase();
          return pricingType.includes('free') || pricingType.includes('open-weights') || pricingType.includes('open source');
          });
      }

      // 3. Fallback to Popular Agents if absolutely empty
      if (agents.length === 0) {
        agents = await dataService.getPopularAgents();
      }

      const mappedAgents = agents.map(a => ({ ...mapToRegistry(a), resultType: 'agent' }));
      
      let extraResults: any[] = [];
      if (supabase) {
          const [reviewsRes, postsRes, intelRes, faqsRes] = await Promise.all([
              supabase.from('agent_reviews')
                  .select('id, title, summary, agent_id_link, agents!inner(name, slug, cover_url)')
                  .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
                  .limit(3),
              supabase.from('agent_posts')
                  .select('id, content, agent_id_link, agents!inner(name, slug, cover_url)')
                  .ilike('content', `%${query}%`)
                  .limit(3),
              supabase.from('agent_intel')
                  .select('id, title, summary, agent_id_link, agents!inner(name, slug, cover_url)')
                  .or(`title.ilike.%${query}%,summary.ilike.%${query}%`)
                  .limit(3),
              supabase.from('agents')
                  .select('id, name, slug, cover_url, faq_content')
                  .not('faq_content', 'is', null)
          ]);

          if (reviewsRes.data) {
              extraResults.push(...reviewsRes.data.map((r: any) => ({
                  id: `review_${r.id}`,
                  name: r.title,
                  description: r.summary,
                  slug: r.agents?.slug || r.agent_id_link,
                  cover_url: r.agents?.cover_url,
                  agent_name: r.agents?.name,
                  resultType: 'review'
              })));
          }

          if (postsRes.data) {
              extraResults.push(...postsRes.data.map((p: any) => ({
                  id: `post_${p.id}`,
                  name: p.content?.split('\n')[0].replace(/^#\s*/, '') || 'Untitled Post',
                  description: p.content?.substring(0, 100) + '...',
                  slug: p.id,
                  agent_slug: p.agents?.slug || p.agent_id_link,
                  cover_url: p.agents?.cover_url,
                  agent_name: p.agents?.name,
                  resultType: 'post'
              })));
          }

          if (intelRes.data) {
              extraResults.push(...intelRes.data.map((i: any) => ({
                  id: `intel_${i.id}`,
                  name: i.title,
                  description: i.summary,
                  slug: `intel-${i.id}`,
                  agent_slug: i.agents?.slug || i.agent_id_link,
                  cover_url: i.agents?.cover_url,
                  agent_name: i.agents?.name,
                  resultType: 'post' // Use post type for rendering consistency in TopBar
              })));
          }

          if (faqsRes.data) {
              const matchedFaqs = faqsRes.data.flatMap((a: any) => {
                  const faqs = a.faq_content || [];
                  return faqs
                      .filter((f: any) => (f.q || f.question || '').toLowerCase().includes(query.toLowerCase()) || (f.a || f.answer || '').toLowerCase().includes(query.toLowerCase()))
                      .map((f: any, idx: number) => ({
                          id: `faq_${a.id}_${idx}`,
                          name: `FAQ: ${f.q || f.question}`,
                          description: f.a || f.answer,
                          slug: a.slug || a.id,
                          cover_url: a.cover_url,
                          agent_name: a.name,
                          resultType: 'faq'
                      }));
              }).slice(0, 3);
              extraResults.push(...matchedFaqs);
          }
      }

      const finalResults = [...mappedAgents, ...extraResults];
      setResults(finalResults);
      return finalResults;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [keys.siliconflow]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clearResults };
};
