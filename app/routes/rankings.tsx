import { useLoaderData, MetaFunction } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";
import { Agent } from "../../types";
import { LeaderboardView } from "../../components/views/LeaderboardView";

export const meta: MetaFunction = () => {
  const description = "Global AI Agent Rankings. Discover the top-performing AI agents across various categories based on NRI score, reasoning, and creativity.";
  return [
    { title: "Global AI Agent Rankings | YouAgent OS" },
    { name: "description", content: description.substring(0, 160) },
    { tagName: "link", rel: "canonical", href: "https://youagent.top/rankings" }
  ];
};

export async function loader() {
  if (!supabaseServer) {
    throw new Response("Supabase client not initialized", { status: 500 });
  }

  // 1. Fetch Agents sorted by hot_score (Limit 100)
  const { data: agents, error: agentsError } = await supabaseServer
    .from('agents')
    .select('id, name, slug, category, nri_score, hot_score, video_poster, external_stats, stats, metrics')
    .eq('status', 'active')
    .order('hot_score', { ascending: false })
    .limit(100);

  if (agentsError) {
    console.error("Rankings loader error:", agentsError);
    throw new Response("Failed to load rankings", { status: 500 });
  }

  // 2. Fetch History for Trends
  const { data: snapshotData } = await supabaseServer
    .from('rankings_snapshot')
    .select('data')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const prevRanks: Record<string, number> = {};
  if (snapshotData && snapshotData.data) {
    (snapshotData.data as any[]).forEach((item, index) => {
      prevRanks[item.id] = index + 1;
    });
  }

  const mappedAgents = (agents || []).map(a => ({
    ...a,
    metrics: { ...a.metrics, hot_score: a.hot_score, nri_score: a.nri_score }
  })) as Agent[];

  return { initialAgents: mappedAgents, initialPrevRanks: prevRanks };
}

export default function RankingsRoute() {
    const { initialAgents, initialPrevRanks } = useLoaderData<typeof loader>();

    return (
        <div className="h-full w-full overflow-y-auto z-[200] bg-black">
            <LeaderboardView initialAgents={initialAgents} initialPrevRanks={initialPrevRanks} />
        </div>
    );
}
