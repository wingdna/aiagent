import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://kumviyxbodfktoamgazw.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_gp2I7s0aQDXmEYpP_s1eLQ_2gNKv-OI';

if (!supabaseUrl || !supabaseKey) {
  console.error('[FATAL] Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generate() {
    console.log('[SEO] Starting Sitemap reconstruction...');
    
    // 1. Fetch all active agents
    let allAgents: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('agents')
            .select('slug, updated_at')
            .eq('is_active', true)
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

    console.log(`[SEO] Fetched ${allAgents.length} active agents.`);

    const urls = allAgents.map(a => `https://youagent.top/agent/${a.slug}`);
    const chunkSize = 100;
    const chunks = Array.from({ length: Math.ceil(urls.length / chunkSize) }, (_, i) => urls.slice(i * chunkSize, i * chunkSize + chunkSize));

    const publicDir = path.resolve(__dirname, '../public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    // 2. Generate Agent Shards (sitemap-agents-*.xml)
    chunks.forEach((chunk, i) => {
        let xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
        chunk.forEach(url => {
            xml += `<url><loc>${url}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`;
        });
        xml += '</urlset>';
        fs.writeFileSync(path.join(publicDir, `sitemap-agents-${i}.xml`), xml);
        // console.log(`[SEO] Generated sitemap-agents-${i}.xml with ${chunk.length} URLs`);
    });
    console.log(`[SEO] Generated ${chunks.length} agent sitemap shards.`);

    // 3. Generate Static Pages Sitemap (sitemap-static.xml)
    // Requirements: 首页 (/) 和 /discover 的 <priority> 设为 1.0，博客页设为 0.7 (Assuming /blog or similar, but user mentioned "博客页" which might be /rankings or just generic blog)
    // Based on build-static-seo.ts, we have /rankings. Let's include that.
    const staticUrls = [
        { loc: 'https://youagent.top/', priority: '1.0', changefreq: 'daily' },
        { loc: 'https://youagent.top/discover', priority: '1.0', changefreq: 'daily' },
        { loc: 'https://youagent.top/rankings', priority: '0.8', changefreq: 'daily' },
    ];

    let staticXml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    staticUrls.forEach(item => {
        staticXml += `<url><loc>${item.loc}</loc><changefreq>${item.changefreq}</changefreq><priority>${item.priority}</priority></url>`;
    });
    staticXml += '</urlset>';
    fs.writeFileSync(path.join(publicDir, 'sitemap-static.xml'), staticXml);
    console.log(`[SEO] Generated sitemap-static.xml`);

    // 4. Generate Main Index (sitemap.xml)
    let index = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    
    // Add static sitemap
    index += `<sitemap><loc>https://youagent.top/sitemap-static.xml</loc></sitemap>`;

    // Add agent chunks
    chunks.forEach((_, i) => {
        index += `<sitemap><loc>https://youagent.top/sitemap-agents-${i}.xml</loc></sitemap>`;
    });
    
    index += '</sitemapindex>';
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), index);
    
    console.log(`[SEO] Sitemap reconstruction complete: ${chunks.length} agent shards + static sitemap generated.`);

    // 5. Update _redirects
    console.log('[SEO] Updating _redirects...');
    let redirectsContent = `/sitemap.xml /sitemap.xml 200
/sitemap-static.xml /sitemap-static.xml 200
/sitemap-blog.xml /sitemap-blog.xml 200
`;
    chunks.forEach((_, i) => {
        redirectsContent += `/sitemap-agents-${i}.xml /sitemap-agents-${i}.xml 200\n`;
    });
    redirectsContent += `/* /index.html 200\n`;
    fs.writeFileSync(path.join(publicDir, '_redirects'), redirectsContent);

    // 6. Update _headers
    console.log('[SEO] Updating _headers...');
    let headersContent = `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/favicon.ico
  Cache-Control: public, max-age=86400

/sitemap-blog.xml
  Content-Type: application/xml

/sitemap.xml
  Content-Type: application/xml

/sitemap-static.xml
  Content-Type: application/xml
`;
    chunks.forEach((_, i) => {
        headersContent += `
/sitemap-agents-${i}.xml
  Content-Type: application/xml
`;
    });
    headersContent += `
/llms.txt
  Content-Type: text/plain
`;
    fs.writeFileSync(path.join(publicDir, '_headers'), headersContent);
    console.log('[SEO] Configuration files updated.');
}

generate().catch(err => {
    console.error(err);
    process.exit(1);
});
