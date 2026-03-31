import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import MainLayout from "../layouts/MainLayout";
import { supabaseServer, initSupabaseWithEnv } from "../../lib/supabase.server";
import { Agent } from "../../types";
import { QUERY_FIELDS } from "../../services/dataService";

export async function loader({ context }: LoaderFunctionArgs) {
  // 🛡️ Protocol V10: Cloudflare Environment Injection
  const env = (context as any)?.env;
  const client = initSupabaseWithEnv(env);

  if (!client) {
    console.error("❌ Layout Loader: Supabase initialization failed.");
    return { initialAgents: [], searchManifest: [] };
  }

  try {
    const [agentsResult, manifestResult] = await Promise.all([
      client
        .from('agents')
        .select(QUERY_FIELDS.AGENTS_FULL)
        .order('hot_score', { ascending: false })
        .limit(12),
      client
        .from('agents')
        .select('id, name, slug, nri_score, category')
    ]);

    if (agentsResult.error) {
      console.error("Layout loader error:", agentsResult.error);
    }

    const searchManifest = (manifestResult.data || []).map((a: any) => ({
      i: a.id,
      nm: a.name,
      s: a.slug || a.id,
      n: a.nri_score || 0,
      c: a.category
    }));

    return { 
      initialAgents: (agentsResult.data || []) as unknown as Agent[],
      searchManifest
    };
  } catch (e) {
    console.error("Layout loader exception:", e);
    return { initialAgents: [], searchManifest: [] };
  }
}

export default function LayoutRoute() {
  const { initialAgents, searchManifest } = useLoaderData<typeof loader>();
  return <MainLayout initialAgents={initialAgents} searchManifest={searchManifest} />;
}
