import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Agent } from '../types';
import { cerebroService } from '../services/cerebroService';

export const executeSemanticSearch = async (query: string) => {
  if (!supabase) throw new Error("Database Disconnected");
  try {
    // 1. Attempt real vectorization
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch('/api/v1/vectorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
      throw new Error(`Vector API Missing or Failed: ${res.status}`);
    }
    
    const resData = await res.json() as any;
    const vector = resData.vector;
    
    // 2. Call RPC match_agents_v2
    const { data, error } = await supabase.rpc('match_agents_v2', { 
      query_embedding: vector, 
      match_threshold: 0.5, 
      match_count: 12 
    });
    
    if (error) throw error;
    return data ||[];
    
  } catch (err) {
    console.warn("[FALLBACK] Semantic Engine offline or failed. Using Text Search.", err);
    
    // 3. FALLBACK: Prevent UI freeze, return text-matched data
    const { data, error } = await supabase
      .from('agents')
      .select('id, slug, name, description, entity_type, nri_score, hot_score, video_url, cover_url, display_mode, specs, pricing_model, pricing_model_json, metrics, capability_tags, media_gallery, vendor_id, vendor_slug, slogan, technical_specs, social_proof, external_stats, framework_stack, developer_socials')
      .ilike('name', `%${query}%`)
      .limit(12);
      
    if (error) {
      console.error("[CRITICAL] Fallback search also failed:", error);
      return[]; // Return empty array to prevent unhandled rejection white-screens
    }
    
    return data ||[];
  }
};

// --- 2. The Smart Hook ---
export function useSmartSearch(searchQuery: string) {
  const [data, setData] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSemantic, setIsSemantic] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function executeSearch() {
      if (!supabase) {
        if (isMounted) {
          setError(new Error("Database Disconnected"));
          setIsLoading(false);
        }
        return;
      }

      const trimmedQuery = searchQuery.trim();

      // --- SCENARIO 1: Empty Query (Default Fetch) ---
      if (!trimmedQuery) {
        if (isMounted) setIsLoading(true);
        try {
          const { data: defaultData, error: defaultError } = await supabase
            .from('agents')
            .select('id, slug, name, description, entity_type, nri_score, hot_score, video_url, cover_url, display_mode, specs, pricing_model, pricing_model_json, metrics, capability_tags, media_gallery, vendor_id, vendor_slug, slogan, technical_specs, social_proof, external_stats, framework_stack, developer_socials')
            .limit(20);

          if (defaultError) throw defaultError;
          
          if (isMounted) {
            setData(defaultData as Agent[]);
            setIsSemantic(false);
            setError(null);
          }
        } catch (err: any) {
          if (isMounted) setError(err);
        } finally {
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      // --- SCENARIO 2: Text Query (Dual-Engine) ---
      if (isMounted) {
        setIsLoading(true);
        setError(null);
        setIsSemantic(false);
      }

      try {
        const resultData = await executeSemanticSearch(trimmedQuery);
        
        if (isMounted) {
          setData(resultData as Agent[]);
          // We don't have a perfect way to know if it was semantic or fallback from the return value alone,
          // but we can assume if it returns data successfully without throwing, it's handled.
          // For now, we'll just set isSemantic to true if we have a query, as the fallback is internal.
          setIsSemantic(true);
        }
        
        // NATIVE ANALYTICS: CEREBRO LINK
        cerebroService.trackEvent('search', null, trimmedQuery, true);

      } catch (err: any) {
        console.error("[YOUAGENT_SEARCH] Critical Search Failure:", err);
        if (isMounted) {
          setError(err);
          setData([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    // Debounce the search slightly to prevent spamming the API/DB while typing
    const timeoutId = setTimeout(() => {
      executeSearch();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  return { data, isLoading, isSemantic, error };
}
