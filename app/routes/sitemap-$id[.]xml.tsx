import { LoaderFunctionArgs } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const baseUrl = new URL(request.url).origin;
  const idStr = params.id;
  const page = parseInt(idStr || "1", 10);

  if (isNaN(page) || page < 1) {
    return new Response("Invalid sitemap index", { status: 400 });
  }

  if (!supabaseServer) {
    return new Response("Supabase client not initialized", { status: 500 });
  }

  const CHUNK_SIZE = 100;
  const from = (page - 1) * CHUNK_SIZE;
  const to = from + CHUNK_SIZE - 1;

  const { data: agents, error } = await supabaseServer
    .from("agents")
    .select("slug, id, updated_at")
    .order("hot_score", { ascending: false, nullsFirst: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching agents for sitemap chunk:", error);
    return new Response("Error fetching agents", { status: 500 });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${
    agents
      ? agents
          .map(
            (agent: any) => `
  <url>
    <loc>${baseUrl}/agent/${agent.slug || agent.id}</loc>
    <lastmod>${new Date(agent.updated_at || new Date()).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
          )
          .join("")
      : ""
  }
</urlset>`;

  return new Response(xml.trim(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
