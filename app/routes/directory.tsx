import { useLoaderData, MetaFunction } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";
import { Agent } from "../../types";
import { DirectoryView } from "../../components/views/DirectoryView";
import { mapToRegistry } from "../../utils/mapper";

export const meta: MetaFunction = () => {
  const description = "Browse the most comprehensive directory of SOTA AI Agents. Find the perfect neural entity for your workflow.";
  return [
    { title: "AI Agent Directory | YouAgent OS" },
    { name: "description", content: description.substring(0, 160) },
    { tagName: "link", rel: "canonical", href: "https://youagent.top/directory" }
  ];
};

export function headers() {
    return {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    };
}

export async function loader() {
  if (!supabaseServer) {
    throw new Response("Supabase client not initialized", { status: 500 });
  }

  const { data: agents, error } = await supabaseServer
    .from('agents')
    .select('id, name, slug, slogan, description, category, nri_score, tactical_badges, metrics, specs, pricing, faq_content')
    .eq('status', 'active')
    .order('name', { ascending: true })
    .limit(50);

  if (error) {
    console.error("Directory loader error:", error);
    throw new Response("Failed to load directory", { status: 500 });
  }

  // Map the data to match the Agent type expected by DirectoryView
  const mappedAgents = (agents || []).map((a: any) => mapToRegistry(a)) as unknown as Agent[];

  return { initialAgents: mappedAgents };
}

export default function DirectoryRoute() {
    const { initialAgents } = useLoaderData<typeof loader>();

    return (
        <div className="h-full w-full overflow-y-auto z-[200] bg-black">
            <DirectoryView initialData={initialAgents} />
        </div>
    );
}
