import { supabaseServer as supabase } from "../../lib/supabase.server";
import { AGENTS_DB } from "../../agents";

export async function loader() {
  try {
    if (!supabase) throw new Error("Database Disconnected");

    let allAgents: any[] = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('agents')
        .select('id, name, slug, nri_score, category')
        .range(from, from + limit - 1);

      if (error) throw error;
      if (data && data.length > 0) {
        allAgents = [...allAgents, ...data];
        from += limit;
        if (data.length < limit) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    // Compress keys: i=id, nm=name, s=slug, n=nri_score, c=category
    const compressed = allAgents.map(a => ({
      i: a.id,
      nm: a.name,
      s: a.slug,
      n: a.nri_score,
      c: a.category
    }));

    return new Response(JSON.stringify(compressed), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: any) {
    console.warn("[api.search-manifest] DB failed, local fallback.", err);
    // Fallback to local AGENTS_DB with compressed keys
    const fallbackData = AGENTS_DB.map(a => ({
      i: a.id,
      nm: a.name,
      s: a.slug || a.id,
      n: a.metrics?.nri_score || a.nri_score || 0,
      c: a.category
    }));
    return new Response(JSON.stringify(fallbackData), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
