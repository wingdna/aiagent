import { useLoaderData } from "react-router";
import MainLayout from "../layouts/MainLayout";
import { supabaseServer } from "../../lib/supabase.server";
import { Agent } from "../../types";
import { QUERY_FIELDS } from "../../services/dataService";

export async function loader() {
  if (!supabaseServer) {
    return { initialAgents: [] };
  }

  try {
    const { data, error } = await supabaseServer
      .from('agents')
      .select(QUERY_FIELDS.AGENTS_FULL)
      .order('hot_score', { ascending: false })
      .limit(12);

    if (error) {
      console.error("Layout loader error:", error);
      return { initialAgents: [] };
    }

    return { initialAgents: (data || []) as unknown as Agent[] };
  } catch (e) {
    console.error("Layout loader exception:", e);
    return { initialAgents: [] };
  }
}

export default function LayoutRoute() {
  const { initialAgents } = useLoaderData<typeof loader>();
  return <MainLayout initialAgents={initialAgents} />;
}
