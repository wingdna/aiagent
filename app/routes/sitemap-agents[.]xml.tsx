import { LoaderFunctionArgs } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const baseUrl = new URL(request.url).origin;

  if (!supabaseServer) {
    return new Response("Supabase client not initialized", { status: 500 });
  }

  // 获取所有 Agent 的 slug 和 updated_at
  const { data: agents, error } = await supabaseServer
    .from("agents")
    .select("slug, updated_at");

  if (error) {
    console.error("Error fetching agents for sitemap:", error);
    return new Response("Error fetching agents", { status: 500 });
  }

  // 构建 Sitemap XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  agents?.forEach((agent: any) => {
    const lastMod = agent.updated_at && !isNaN(new Date(agent.updated_at).getTime()) ? new Date(agent.updated_at).toISOString() : new Date().toISOString();
    xml += `  <url>\n    <loc>${baseUrl}/agent/${agent.slug}</loc>\n    <lastmod>${lastMod}</lastmod>\n  </url>\n`;
  });

  xml += `</urlset>`;

  return new Response(xml.trim(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
