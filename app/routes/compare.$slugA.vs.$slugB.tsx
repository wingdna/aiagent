import { useLoaderData, type MetaFunction } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";
import { Agent } from "../../types";
import { mapToRegistry } from "../../utils/mapper";

// 极致并发 Loader 设计：使用 Promise.all 并发获取两个 Agent 的数据
export async function loader({ params }: { params: { slugA: string; slugB: string } }) {
  let { slugA, slugB } = params;

  // Strip .data suffix if present (React Router v7 data requests)
  if (slugA && slugA.endsWith('.data')) slugA = slugA.replace(/\.data$/, '');
  if (slugB && slugB.endsWith('.data')) slugB = slugB.replace(/\.data$/, '');

  if (!slugA || !slugB) {
    throw new Response("Invalid Comparison URL", { status: 400 });
  }

  if (!supabaseServer) {
    throw new Response("Supabase client not initialized", { status: 500 });
  }

  const [resA, resB] = await Promise.all([
    supabaseServer.from('agents').select('id, name, slug, category, slogan, assets, cover_url, video_url, video_poster, capability_tags, tags, is_open_source, nri_score, tactical_badges, metrics, specs, pricing, faq_content').eq('slug', slugA).single(),
    supabaseServer.from('agents').select('id, name, slug, category, slogan, assets, cover_url, video_url, video_poster, capability_tags, tags, is_open_source, nri_score, tactical_badges, metrics, specs, pricing, faq_content').eq('slug', slugB).single()
  ]);

  if (resA.error || resB.error || !resA.data || !resB.data) {
    throw new Response("One or both agents not found", { status: 404 });
  }

  return { 
    agentA: mapToRegistry(resA.data) as unknown as Agent, 
    agentB: mapToRegistry(resB.data) as unknown as Agent 
  };
}

// SEO 动态霸权：动态组合搜索标题和描述
export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const typedData = data as { agentA: Agent; agentB: Agent } | undefined;
  if (!typedData || !typedData.agentA || !typedData.agentB) return [{ title: "Comparison Not Found" }];
  const { agentA, agentB } = typedData;
  const description = `A deep dive comparison between ${agentA.name} and ${agentB.name}. Compare features, pricing, reasoning capabilities, and context windows to decide which AI agent suits your workflow.`;
  
  return [
    { title: `${agentA.name} vs ${agentB.name}: Which AI Agent is Better in 2026?` },
    { name: "description", content: description.substring(0, 160) }
  ];
};

// 注入 Edge Cache 引擎 (防数据库击穿)
export function headers() {
  return {
    // 允许 CDN 缓存 24 小时，过期后后台静默刷新
    "Cache-Control": "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800",
  };
}

// Aero-Obsidian 风格对比网格
export default function ComparisonPage() {
  const { agentA, agentB } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 animate-in fade-in">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-12 text-center">
          <span className="text-cyan-400">{agentA.name}</span> vs <span className="text-cyan-400">{agentB.name}</span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左侧 Agent A 卡片 */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-xl">
            <img src={agentA.assets?.cover_url || ''} alt={agentA.name} className="w-full h-48 object-cover mb-4 rounded-lg" loading="lazy" decoding="async" />
            <h2 className="text-2xl font-bold mb-2">{agentA.name}</h2>
            <p className="text-gray-400 text-sm">{agentA.slogan}</p>
            
            {/* --- 战术面板 (Agent A) --- */}
            <div className="mt-6 space-y-4 border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">PRICING</span>
                <span className="text-cyan-400 font-mono text-sm">{agentA.pricing?.model || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">CATEGORY</span>
                <span className="text-gray-200 text-sm uppercase">{agentA.category || "General"}</span>
              </div>
              <div className="pt-2">
                 <span className="text-gray-500 text-xs block mb-2">METRICS (Logic / Velocity)</span>
                 <div className="flex gap-4 font-mono text-sm text-cyan-400 bg-black/50 p-2 rounded border border-white/5">
                    <span>L: {agentA.metrics?.logic_unit || '--'}</span>
                    <span>V: {agentA.metrics?.velocity || '--'}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* 右侧 Agent B 卡片 */}
          <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-xl">
            <img src={agentB.assets?.cover_url || ''} alt={agentB.name} className="w-full h-48 object-cover mb-4 rounded-lg" loading="lazy" decoding="async" />
            <h2 className="text-2xl font-bold mb-2">{agentB.name}</h2>
            <p className="text-gray-400 text-sm">{agentB.slogan}</p>

            {/* --- 战术面板 (Agent B) --- */}
            <div className="mt-6 space-y-4 border-t border-white/5 pt-4">
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">PRICING</span>
                <span className="text-cyan-400 font-mono text-sm">{agentB.pricing?.model || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs">CATEGORY</span>
                <span className="text-gray-200 text-sm uppercase">{agentB.category || "General"}</span>
              </div>
              <div className="pt-2">
                 <span className="text-gray-500 text-xs block mb-2">METRICS (Logic / Velocity)</span>
                 <div className="flex gap-4 font-mono text-sm text-cyan-400 bg-black/50 p-2 rounded border border-white/5">
                    <span>L: {agentB.metrics?.logic_unit || '--'}</span>
                    <span>V: {agentB.metrics?.velocity || '--'}</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
