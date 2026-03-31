import { LoaderFunctionArgs } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const baseUrl = new URL(request.url).origin;

  if (!supabaseServer) {
    return new Response("Supabase client not initialized", { status: 500 });
  }

  // 获取 Agent 总数
  const { count, error } = await supabaseServer
    .from("agents")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching agents count for sitemap:", error);
    return new Response("Error fetching agents count", { status: 500 });
  }

  const totalAgents = count || 0;
  const CHUNK_SIZE = 100;
  const totalChunks = Math.ceil(totalAgents / CHUNK_SIZE);

  // 构建 Sitemap Index XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // 静态页面 sitemap
  xml += `  <sitemap>\n    <loc>${baseUrl}/sitemap-others.xml</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </sitemap>\n`;
  xml += `  <sitemap>\n    <loc>${baseUrl}/sitemap-agents.xml</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </sitemap>\n`;

  // Agent 分片 sitemap
  for (let i = 1; i <= totalChunks; i++) {
    xml += `  <sitemap>\n    <loc>${baseUrl}/sitemap-${i}.xml</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </sitemap>\n`;
  }

  xml += `</sitemapindex>`;

  return new Response(xml.trim(), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
};
