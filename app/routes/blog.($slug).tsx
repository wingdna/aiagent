import { useLoaderData, MetaFunction } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";
import { AgentPost } from "../../types";
import BlogView from "../../components/views/BlogView";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.initialSelectedPost?.title 
    ? `${data.initialSelectedPost.title} | Neural News`
    : "Neural News | YouAgent OS";
  const desc = data?.initialSelectedPost?.content?.substring(0, 160) 
    || `Latest AI Agent News: ${data?.initialPosts?.[0]?.title || "Neural News"}...`;

  return [
    { title },
    { name: "description", content: desc },
    { tagName: "link", rel: "canonical", href: `https://youagent.top/blog${data?.initialSelectedPost?.slug ? '/' + data.initialSelectedPost.slug : ''}` }
  ];
};

export async function loader({ params }: { params: { slug?: string } }) {
  if (!supabaseServer) {
    throw new Response("Supabase client not initialized", { status: 500 });
  }

  const { slug } = params;
  let initialSelectedPost: AgentPost | null = null;
  let fullAgentData: any = null;
  let relatedAgents: any[] = [];

  if (slug) {
    if (slug.startsWith('intel-')) {
      const id = slug.replace('intel-', '');
      const { data: intel } = await supabaseServer
        .from('agent_intel')
        .select('id, agent_id_link, intel_type, title, summary, content, source_url, published_at, image_url, agents!agent_intel_agent_id_link_fkey(name, slug)')
        .eq('id', id)
        .single();
      
      if (intel) {
        initialSelectedPost = {
          id: intel.id,
          agent_id_link: intel.agent_id_link,
          title: intel.title,
          slug: `intel-${intel.id}`,
          content: (intel.content || intel.summary),
          source_url: intel.source_url,
          published_at: intel.published_at,
          tags: [intel.intel_type || 'INTEL'],
          cover_url: intel.image_url,
          views_count: 0,
          agents: Array.isArray(intel.agents) ? intel.agents[0] : intel.agents
        } as AgentPost;
      }
    } else {
      const { data: post } = await supabaseServer
        .from('agent_posts')
        .select('id, agent_id_link, content, created_at, post_type, status, agents(name, slug)')
        .eq('id', slug)
        .single();
      
      if (post) {
        initialSelectedPost = {
          id: post.id,
          agent_id_link: post.agent_id_link,
          title: post.content?.split('\n')[0].replace(/^#\s*/, '') || 'Untitled Post',
          slug: post.id,
          content: post.content,
          published_at: post.created_at,
          tags: [post.post_type || 'POST'],
          status: post.status,
          agents: Array.isArray(post.agents) ? post.agents[0] : post.agents
        } as AgentPost;
      }
    }

    if (initialSelectedPost?.agent_id_link) {
        let agentData = null;
        
        // Try to fetch by ID first
        const { data: agentById } = await supabaseServer
            .from('agents')
            .select('id, name, slug, category, pricing, technical_specs, specs, status, framework_stack, entity_type')
            .eq('id', initialSelectedPost.agent_id_link)
            .single();
            
        if (agentById) {
            agentData = agentById;
        } else {
            // Fallback to fetch by slug if agent_id_link is actually a slug
            const { data: agentBySlug } = await supabaseServer
                .from('agents')
                .select('id, name, slug, category, pricing, technical_specs, specs, status, framework_stack, entity_type')
                .eq('slug', initialSelectedPost.agent_id_link)
                .single();
            if (agentBySlug) {
                agentData = agentBySlug;
            }
        }
        
        if (agentData) {
            fullAgentData = agentData;
            
            let related: any[] | null = null;
            if (agentData.category) {
                const { data } = await supabaseServer
                    .from('agents')
                    .select('id, name, slug, category, slogan, cover_url')
                    .eq('category', agentData.category)
                    .neq('id', agentData.id)
                    .limit(3);
                related = data;
            }
            
            if (!related || related.length === 0) {
                // Fallback to latest agents
                const { data } = await supabaseServer
                    .from('agents')
                    .select('id, name, slug, category, slogan, cover_url')
                    .neq('id', agentData.id)
                    .order('created_at', { ascending: false })
                    .limit(3);
                related = data;
            }

            if (related) {
                relatedAgents = related;
            }
        }
    }
    
    // If we still don't have related agents (e.g., no agent_id_link), fetch some defaults
    if (!relatedAgents || relatedAgents.length === 0) {
        const { data } = await supabaseServer
            .from('agents')
            .select('id, name, slug, category, slogan, cover_url')
            .order('created_at', { ascending: false })
            .limit(3);
        if (data) {
            relatedAgents = data;
        }
    }
  }

  const [postsRes, intelRes] = await Promise.all([
    supabaseServer
      .from('agent_posts')
      .select('id, agent_id_link, content, created_at, post_type, status, agents(name, slug)')
      .order('created_at', { ascending: false })
      .range(0, 9),
    supabaseServer
      .from('agent_intel')
      .select('id, agent_id_link, intel_type, title, summary, source_url, published_at, created_at, image_url, agents!agent_intel_agent_id_link_fkey(name, slug)')
      .order('published_at', { ascending: false })
      .range(0, 9)
  ]);

  const postsData = postsRes.data || [];
  const intelData = intelRes.data || [];

  const mappedPosts = postsData.map((row: any) => ({
    id: row.id,
    agent_id_link: row.agent_id_link,
    title: row.content?.split('\n')[0].replace(/^#\s*/, '') || 'Untitled Post',
    slug: row.id,
    content: row.content,
    published_at: row.created_at,
    tags: [row.post_type || 'POST'],
    status: row.status,
    agents: Array.isArray(row.agents) ? row.agents[0] : row.agents
  } as AgentPost));

  const normalizedIntel = intelData.map((intel: any) => ({
    id: intel.id,
    agent_id_link: intel.agent_id_link,
    title: intel.title,
    slug: `intel-${intel.id}`,
    content: (intel.content || intel.summary),
    source_url: intel.source_url,
    published_at: intel.published_at,
    tags: [intel.intel_type || 'INTEL'],
    cover_url: intel.image_url,
    views_count: 0,
    agents: Array.isArray(intel.agents) ? intel.agents[0] : intel.agents
  } as AgentPost));

  const combined = [...mappedPosts, ...normalizedIntel].sort((a, b) => {
    const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
    const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });

  return { initialPosts: combined, initialSelectedPost, fullAgentData, relatedAgents };
}

export default function BlogRoute() {
    const { initialPosts, initialSelectedPost, fullAgentData, relatedAgents } = useLoaderData<typeof loader>();

    let jsonLd = null;
    if (initialSelectedPost) {
        const markers = [
            '🔗 Original Sources',
            '🔗 Original Source',
            '*Editorial Note:',
            'Editorial Note:',
            '**Editorial Note:**',
            'Sources:',
            'Source:',
            'Original Sources:',
            'Original Source:'
        ];
        let splitIndex = -1;
        for (const marker of markers) {
            const index = initialSelectedPost.content?.lastIndexOf(marker) ?? -1;
            if (index !== -1 && index > (initialSelectedPost.content?.length ?? 0) * 0.5) {
                if (splitIndex === -1 || index < splitIndex) {
                    splitIndex = index;
                }
            }
        }
        if (splitIndex === -1) {
            const endLinkRegex = /(?:\[(?:source|via|link|原文)\]\([^)]+\)|(?:source|via|link|原文):\s*https?:\/\/[^\s]+)\s*$/i;
            const match = initialSelectedPost.content?.match(endLinkRegex);
            if (match && match.index !== undefined) {
                splitIndex = match.index;
            }
        }
        
        const sourcesText = splitIndex !== -1 ? initialSelectedPost.content?.substring(splitIndex).trim() : '';
        const links: string[] = [];
        if (initialSelectedPost.source_url) links.push(initialSelectedPost.source_url);
        
        if (sourcesText) {
            const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
            let match;
            while ((match = mdRegex.exec(sourcesText)) !== null) {
                links.push(match[2]);
            }
            const rawRegex = /(https?:\/\/[^\s)]+)/g;
            while ((match = rawRegex.exec(sourcesText)) !== null) {
                links.push(match[1]);
            }
        }
        
        const uniqueLinks = Array.from(new Set(links));

        jsonLd = {
            "@context": "https://schema.org",
            "@type": initialSelectedPost.slug.startsWith('intel-') ? "NewsArticle" : "Article",
            "headline": initialSelectedPost.title,
            "image": initialSelectedPost.cover_url ? [initialSelectedPost.cover_url] : [],
            "datePublished": initialSelectedPost.published_at,
            "dateModified": initialSelectedPost.published_at,
            "author": [{
                "@type": "Organization",
                "name": "YouAgent OS",
                "url": "https://youagent.top"
            }],
            "citation": uniqueLinks
        };
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <BlogView 
                initialPosts={initialPosts} 
                initialSelectedPost={initialSelectedPost} 
                fullAgentData={fullAgentData}
                relatedAgents={relatedAgents}
            />
        </>
    );
}
