import { useOutletContext, useLoaderData, type LoaderFunctionArgs, useSearchParams, Link, useFetcher } from "react-router";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { SEMANTIC_KEYWORDS, SEMANTIC_GROUPS } from "../constants/categories";
import { AgentRegistryEntity } from "../types/registry";
import { Agent, UserProfile } from "../../types";
import { NREProfile } from "../../hooks/useNRE";
import type { MetaFunction } from "react-router";
import { supabaseServer, initSupabaseWithEnv } from "../../lib/supabase.server";
import { QUERY_FIELDS } from "../../services/dataService";
import { useUserPreferences } from "../AppProviders";

import { DiscoveryGrid } from "../../components/views/DiscoveryGrid";

import { agentQueryService } from "../../services/agentQueryService";


export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  // 🛡️ Protocol V10: Cloudflare Environment Injection
  const env = (context as any)?.env;
  const client = initSupabaseWithEnv(env);

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const pageSize = parseInt(url.searchParams.get("pageSize") || "20", 10);
  const categoryParam = url.searchParams.get("category");
  const q = url.searchParams.get("q");
  // 🛡️ Protocol V11: Strict Normalization
  const filterValue = categoryParam ? decodeURIComponent(categoryParam).trim() : null;
  
  try {
    if (!client) throw new Error("Supabase server not initialized");

    // 1. Build Dynamic Category Pool (Top 12 Categories by hot_score)
    // We fetch top 200 agents to derive the hottest active categories
    const { data: hotAgents } = await client
      .from('agents')
      .select('category, hot_score')
      .not('category', 'is', null)
      .order('hot_score', { ascending: false })
      .limit(200);

    const categoryScores: Record<string, number> = {};
    (hotAgents || []).forEach((agent: { category: string | null; hot_score: number | null }) => {
      if (agent.category) {
        categoryScores[agent.category] = (categoryScores[agent.category] || 0) + (agent.hot_score || 1);
      }
    });

    const recommendedTags = Object.entries(categoryScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([id]) => ({ id, label: id }));

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let rawAgents: any[] = [];
    let agentsError = null;
    let validCategories: string[] = [];

    try {
        // 🛡️ Protocol V12: Category Integrity
        // Fetch all unique categories that have at least one agent to ensure tags are clickable
        const { data: catData } = await client
          .from('agents')
          .select('category')
          .not('category', 'is', null);
        validCategories = Array.from(new Set((catData || []).map((r: { category: string }) => r.category)));
        // 🛡️ SQL 引擎回归：物理单维度查询协议 (Strict Single-Dimension Query)
        // 目的：保证生成的 SQL 极其简单，响应时间 < 50ms
        let query = client.from('agents').select(`
            id, name, slug, slogan, category, 
            video_url, video_poster, cover_url, 
            metrics, nri_score,
            capability_tags, 
            tactical_badges, specs, pricing, faq_content
        `);

        if (filterValue) {
            // 强制单维度：仅匹配主分类
            query = query.eq('category', filterValue.trim());
        } else if (q) {
            // 强制单维度：仅匹配名称，严禁 OR 匹配
            const searchTerm = `%${q}%`;
            query = query.ilike('name', searchTerm);
        }

        const result = await query
            .order('hot_score', { ascending: false })
            .range(from, to);
        
        rawAgents = result.data || [];
        agentsError = result.error;
    } catch (queryExecError: any) {
        console.error("⚡ Query execution failed:", queryExecError);
        agentsError = queryExecError;
    }

    if (agentsError) {
        console.error("⚡ Supabase Query Error:", agentsError.message);
        if (agentsError.message.includes('operator does not exist')) {
             const simpleResult = await client.from('agents').select('id, name, slug, slogan, category, video_url, video_poster, cover_url, metrics, nri_score, capability_tags, tactical_badges, specs, pricing, faq_content').limit(pageSize);
             rawAgents = simpleResult.data || [];
        } else {
            throw agentsError;
        }
    }

    const agents: AgentRegistryEntity[] = (rawAgents || []).map(row => {
        const pricing = row.pricing || {};
        const metrics = row.metrics || {};
        const rawCapabilities = Array.isArray(row.capability_tags) ? row.capability_tags : [];
        const filteredCapabilities = rawCapabilities.filter((tag: any) => 
            tag && tag !== 'NEW_DISCOVERY' && (!validCategories || validCategories.includes(tag))
        );

        return {
            id: row.id,
            name: row.name,
            slug: row.slug || '',
            slogan: row.slogan || '',
            category: row.category || 'ENTITY',
            assets: {
                video_url: row.video_url || '',
                video_poster: row.video_poster || '',
                cover_url: row.cover_url || ''
            },
            metrics: {
                nri_score: Number(row.nri_score || metrics.nri_score || 0),
                logic_unit: Number(metrics.logic_unit || metrics.reasoning || 0),
                velocity: Number(metrics.velocity || metrics.speed || 0)
            },
            capabilities: filteredCapabilities.slice(0, 5),
            pricing: {
                model: pricing.model || pricing.type || 'TBD',
                tiers: pricing.tiers || [],
                isOSS: pricing.isOSS || pricing.type === 'Open Source' || pricing.type === 'open_weights' || !!row.is_open_source,
                details: pricing
            },
            faq: row.faq_content || [],
            specs: row.specs || {},
            tactical_badges: row.tactical_badges || []
        };
    });

    return { agents, recommendedTags, validCategories };
  } catch (e: any) {
    console.error("Loader error:", e?.message || e);
    return { agents: [], recommendedTags: [], validCategories: [] };
  }
};

export const meta: MetaFunction = () => {
  return [
    { title: "YouAgent OS | Decentralized AI Discovery" },
    { name: "description", content: "Discover, analyze, and deploy cutting-edge AI agents. The most powerful AI agent management platform." },
    { tagName: "link", rel: "canonical", href: "https://youagent.top" }
  ];
};

export function headers() {
    return {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
    };
}

export default function Index() {
    const { agents: initialAgents, recommendedTags, validCategories } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
    const currentCategory = searchParams.get("category");
    const searchQuery = searchParams.get("q") || "";
    const [searchInput, setSearchInput] = useState(searchQuery);
    const agentsFetcher = useFetcher<{ agents: AgentRegistryEntity[] }>();
    const { preferences, setPreferences } = useUserPreferences();
    
    const [allAgents, setAllAgents] = useState<AgentRegistryEntity[]>(initialAgents || []);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(initialAgents.length >= 20); // 20 is the default pageSize
    const sentinelRef = React.useRef<HTMLDivElement>(null);

    // Filter Hub logic: Combine recommended tags with active category if it's not in the list
    const displayCategories = React.useMemo(() => {
        const base = recommendedTags || [];
        if (currentCategory && !base.find(c => c.id === currentCategory)) {
            return [{ id: currentCategory, label: currentCategory }, ...base];
        }
        return base;
    }, [recommendedTags, currentCategory]);

    // Reset when category changes
    useEffect(() => {
        setAllAgents(initialAgents || []);
        setPage(1);
        setHasMore(initialAgents.length >= 20);
        
        // ⚓ Scroll Anchor Reset Protocol
        const scrollArea = document.querySelector('.main-scroll-area');
        if (scrollArea) {
            scrollArea.scrollTop = 0;
        }
    }, [currentCategory, initialAgents]);

    // Handle infinite loading
    useEffect(() => {
        if (agentsFetcher.data?.agents) {
            const newAgents = agentsFetcher.data.agents;
            if (newAgents.length < 20) {
                setHasMore(false);
            }
            
            setAllAgents((prev: AgentRegistryEntity[]) => {
                const agentMap = new Map<string, AgentRegistryEntity>(prev.map((a: AgentRegistryEntity) => [a.id, a]));
                newAgents.forEach((a: AgentRegistryEntity) => agentMap.set(a.id, a));
                return Array.from(agentMap.values());
            });
        }
    }, [agentsFetcher.data]);

    // Intersection Observer for infinite loading
    useEffect(() => {
        if (!hasMore) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && agentsFetcher.state === "idle") {
                const nextPage = page + 1;
                const params = new URLSearchParams(searchParams);
                params.set("page", nextPage.toString());
                // Add interestTags to fetcher
                preferences.interestTags.forEach(tag => params.append("interestTag", tag));
                
                agentsFetcher.load(`/?index&${params.toString()}`);
                setPage(nextPage);
            }
        });

        if (sentinelRef.current) observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [agentsFetcher.state, page, searchParams, preferences.interestTags, hasMore]);

    const handleCategoryClick = (cat: string) => {
        setPreferences(prev => ({
            ...prev,
            interestTags: Array.from(new Set([...prev.interestTags, cat]))
        }));
    };
    
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "YouAgent OS | Decentralized AI Discovery",
      "description": "Discover, analyze, and deploy cutting-edge AI agents. The most powerful AI agent management platform.",
      "url": "https://youagent.top",
      "mainEntity": {
        "@type": "ItemList",
        "itemListElement": allAgents.map((agent: AgentRegistryEntity, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `https://youagent.top/agent/${agent.slug || agent.id}`,
          "name": agent.name
        }))
      }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchInput) {
            params.set("q", searchInput);
        } else {
            params.delete("q");
        }
        params.set("page", "1");
        setSearchParams(params);
    };

    return (
        <>
            <script 
                type="application/ld+json" 
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} 
            />
            <div className="max-w-[1800px] mx-auto px-4 pt-4">
                {/* Layer 1: Pure Semantic Description (No Links) & Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <p className="text-sm text-gray-400 leading-relaxed flex-1">
                      Explore the most advanced autonomous entities. Discover agents for 
                      {SEMANTIC_KEYWORDS.join(', ')}.
                    </p>
                    
                    <form onSubmit={handleSearch} className="relative w-full md:w-72 lg:w-96">
                        <input 
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="SEARCH_NEURAL_PATH..."
                            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg px-4 py-2 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all placeholder:text-cyan-900/50"
                        />
                        {searchInput && (
                            <button 
                                type="button"
                                onClick={() => { setSearchInput(""); const p = new URLSearchParams(searchParams); p.delete("q"); setSearchParams(p); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-900 hover:text-cyan-400 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </form>
                </div>

                {/* Layer 2: Intelligent Category Filter Hub */}
                <div className={`flex flex-wrap gap-4 mb-6 max-h-[120px] overflow-hidden transition-opacity duration-200 ${agentsFetcher.state !== 'idle' ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Fixed ALL Tag */}
                    <Link 
                        to="/"
                        className={`px-4 py-1.5 border rounded-full text-xs transition-all flex items-center gap-1 gpu-accelerated ${!currentCategory ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-black border-cyan-400/30 text-cyan-400 hover:bg-cyan-900/20'}`}
                    >
                        ALL
                    </Link>

                    {displayCategories.map(cat => {
                        const isActive = currentCategory === cat.label;
                        
                        return (
                            <div key={cat.id} className="relative group">
                                <Link 
                                    to={isActive ? "/" : `/?category=${encodeURIComponent(cat.label)}`}
                                    className={`px-4 py-1.5 border rounded-full text-xs transition-all flex items-center gap-1 gpu-accelerated ${isActive ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]' : 'bg-black border-cyan-400/30 text-cyan-400 hover:bg-cyan-900/20'}`}
                                >
                                    {cat.label.toUpperCase()}
                                    {isActive && <X className="w-3 h-3 ml-1" />}
                                </Link>
                            </div>
                        );
                    })}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 sm:ml-4">
                </div>
            </div>
            <DiscoveryGrid initialAgents={allAgents} validCategories={validCategories} />
            
            {/* 状态驱动的无限加载 Sentinel */}
            <div ref={sentinelRef} className="py-10 flex flex-col items-center justify-center min-h-[100px]">
                {agentsFetcher.state !== 'idle' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full max-w-[1800px] px-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={`skeleton-${i}`} className="animate-pulse">
                                <div className="bg-white/5 rounded-2xl h-[400px]" />
                            </div>
                        ))}
                    </div>
                ) : !hasMore && allAgents.length > 0 ? (
                    <div className="text-xs font-mono text-white/20 tracking-[0.2em] uppercase">
                        — END OF THE NEXUS —
                    </div>
                ) : null}
            </div>
        </>
    );
}
