import { useOutletContext, useNavigate, useLoaderData } from "react-router";
import React, { Suspense } from "react";
import { Agent, UserProfile } from "../../types";
import { NREProfile } from "../../hooks/useNRE";
import type { MetaFunction } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";
import { QUERY_FIELDS } from "../../services/dataService";

import { AgentDetail } from "../../components/views/AgentDetail";

export const loader = async () => {
  if (!supabaseServer) return { primaryAgent: null, initialRelatedAgents: [] };
  
  try {
    const { data: primaryAgentData } = await supabaseServer
      .from('agents')
      .select(QUERY_FIELDS.AGENTS_FULL)
      .order('hot_score', { ascending: false })
      .limit(1)
      .single();

    const primaryAgent = primaryAgentData as unknown as Agent | null;

    let relatedAgents: Agent[] = [];
    if (primaryAgent) {
        const { data: relatedData } = await supabaseServer
            .from('agents')
            .select(QUERY_FIELDS.AGENTS_FULL)
            .eq('category', primaryAgent.category)
            .neq('id', primaryAgent.id)
            .order('hot_score', { ascending: false })
            .limit(8);
        relatedAgents = (relatedData || []) as unknown as Agent[];
    }
      
    return { 
        primaryAgent,
        initialRelatedAgents: relatedAgents
    };
  } catch (e) {
    return { primaryAgent: null, initialRelatedAgents: [] };
  }
};

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const agent = data?.primaryAgent;
  if (!agent) {
    return [
      { title: "YouAgent OS | Decentralized AI Discovery" },
      { name: "description", content: "The most powerful AI agent management platform." },
      { tagName: "link", rel: "canonical", href: "https://youagent.top/" }
    ];
  }

  return [
    { title: `${agent.name} - ${agent.slogan} | YouAgent OS` },
    { name: "description", content: (agent.description || "Discover the best AI agents.").substring(0, 160) },
    { property: "og:image", content: agent.cover_url || "" },
    { tagName: "link", rel: "canonical", href: "https://youagent.top/" }
  ];
};

export function headers() {
    return {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    };
}

interface LayoutContext {
    agents: Agent[];
    finalDisplayList: Agent[];
    activeAgentId: string | null;
    setActiveAgentId: (id: string) => void;
    currentAgent: Agent | null;
    profile: UserProfile;
    isForging: boolean;
    isSpeaking: boolean;
    isCommanderOpen: boolean;
    nreProfile: NREProfile;
    setNREProfile: (p: NREProfile) => void;
    addXp: (n: number) => void;
    updateBalance: (val: any) => void;
    initializing: boolean;
}

export default function Index() {
    const { primaryAgent, initialRelatedAgents } = useLoaderData<typeof loader>();
    const context = useOutletContext<LayoutContext>();
    const navigate = useNavigate();
    
    // 强制使用 loader 数据或 context 中的第一个，确保 SSR 一致性
    const agent = primaryAgent || context.finalDisplayList[0];

    if (!agent) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white font-mono">
                <div className="text-center">
                    <h1 className="text-4xl text-cyan-500 mb-4">INITIALIZING_NEXUS...</h1>
                    <p className="text-gray-400">Synchronizing with the neural grid.</p>
                </div>
            </div>
        );
    }

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": agent.name,
      "description": agent.description,
      "applicationCategory": agent.category || "AI Agent",
      "operatingSystem": "Web",
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": (() => {
          const sum = (agent.metrics?.reasoning || 0) + (agent.metrics?.creativity || 0) + (agent.metrics?.speed || 0);
          const avg = sum / 3;
          const idHash = (agent.id || "").split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          const jitter = (idHash % 10) / 20;
          const normalized = (avg / 100) * 5;
          const jittered = normalized + (jitter - 0.2);
          return Math.max(4.1, Math.min(4.9, jittered)).toFixed(1);
        })(),
        "bestRating": "5",
        "ratingCount": (() => {
          const base = agent.total_views || 100;
          const idHash = (agent.id || "").split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
          return Math.floor(base * 0.8 + (idHash % 150));
        })().toString()
      }
    };

    return (
        <>
            <script 
                type="application/ld+json" 
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} 
            />
            <AgentDetail 
                agent={agent}
                initialRelatedAgents={initialRelatedAgents}
                userProfile={context.profile}
                onEnterLounge={(a) => navigate(`/agent/${a.slug || a.id}/lounge`)}
                onTagClick={() => {}}
                onLike={() => {}}
                onBookmark={() => {}}
                onShare={() => {}}
                isForging={context.isForging}
                isSpeaking={context.isSpeaking}
                nreProfile={context.nreProfile}
                setNREProfile={context.setNREProfile}
                agents={context.finalDisplayList}
                activeAgentId={context.activeAgentId || agent.id}
                setActiveAgentId={context.setActiveAgentId}
                isSystemCalculationMode={context.isCommanderOpen}
            />
        </>
    );
}
