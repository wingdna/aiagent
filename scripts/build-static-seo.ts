import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://kumviyxbodfktoamgazw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_gp2I7s0aQDXmEYpP_s1eLQ_2gNKv-OI';

if (!supabaseUrl || !supabaseKey) {
  console.error('[FATAL] Missing Supabase environment variables (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function buildStaticSeo() {
  console.log('Fetching agents from Supabase...');
  
  let allAgents: any[] = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('agents')
      .select('id, slug, name, description, category, updated_at')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('[ERROR] Failed to fetch agents:', error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      allAgents = [...allAgents, ...data];
      if (data.length < pageSize) hasMore = false;
      page++;
    } else {
      hasMore = false;
    }
  }

  console.log(`Fetched ${allAgents.length} agents. Generating SEO files...`);

  // Generate sitemap-blog.xml
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://youagent.top/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://youagent.top/discover</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://youagent.top/rankings</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
${allAgents.map(agent => {
  const identifier = agent.slug || agent.id;
  const lastMod = agent.updated_at && !isNaN(new Date(agent.updated_at).getTime()) ? new Date(agent.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  return `  <url>
    <loc>https://youagent.top/agent/${encodeURIComponent(identifier)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
}).join('\n')}
</urlset>`;

  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(path.join(publicDir, 'sitemap-blog.xml'), sitemapContent);
  console.log('Generated public/sitemap-blog.xml');

  // Generate llms.txt
  const llmsContent = `# YouAgent OS - LLM Directory
# This file provides a machine-readable directory of AI agents available on YouAgent OS.

${allAgents.map(agent => {
  const identifier = agent.slug || agent.id;
  const desc = agent.description ? agent.description.replace(/\n/g, ' ') : 'No description available.';
  return `- [${agent.name}](https://youagent.top/agent/${encodeURIComponent(identifier)}): ${desc}`;
}).join('\n')}
`;

  fs.writeFileSync(path.join(publicDir, 'llms.txt'), llmsContent);
  console.log('Generated public/llms.txt');

  console.log('Static SEO files built successfully.');
}

buildStaticSeo().catch(err => {
  console.error('[FATAL] Unhandled error during build:', err);
  process.exit(1);
});
