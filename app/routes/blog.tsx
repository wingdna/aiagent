import { useLoaderData, MetaFunction } from "react-router";
import { supabaseServer } from "../../lib/supabase.server";
import { AgentPost } from "../../types";
import BlogView from "../../components/views/BlogView";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  const title = data?.initialSelectedPost?.title 
    ? `${data.initialSelectedPost.title} | Neural Chronicles`
    : "Neural Chronicles | YouAgent OS";
  const desc = data?.initialSelectedPost?.content?.substring(0, 160) 
    || `Latest AI Agent News: ${data?.initialPosts?.[0]?.title || "Neural Chronicles"}...`;

  return [
    { title },
    { name: "description", content: desc },
    { tagName: "link", rel: "canonical", href: `https://youagent.top/blog/${data?.initialSelectedPost?.slug || ''}` }
  ];
};

export async function loader({ params }: { params: { slug?: string } }) {
  if (!supabaseServer) {
    throw new Response("Supabase client not initialized", { status: 500 });
  }

  const { slug } = params;
  let initialSelectedPost: AgentPost | null = null;

  if (slug) {
    if (slug.startsWith('intel-')) {
      const id = slug.replace('intel-', '');
      const { data: intel } = await supabaseServer
        .from('agent_intel')
        .select('id, agent_id_link, intel_type, title, summary, content, source_url, published_at, image_url')
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
          views_count: 0
        } as AgentPost;
      }
    } else {
      const { data: post } = await supabaseServer
        .from('agent_posts')
        .select('id, agent_id_link, content, created_at, post_type, status')
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
          status: post.status
        } as AgentPost;
      }
    }
  }

  const [postsRes, intelRes] = await Promise.all([
    supabaseServer
      .from('agent_posts')
      .select('id, agent_id_link, content, created_at, post_type, status')
      .order('created_at', { ascending: false })
      .range(0, 9),
    supabaseServer
      .from('agent_intel')
      .select('id, agent_id_link, intel_type, title, summary, source_url, published_at, created_at, image_url')
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
    status: row.status
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
    views_count: 0
  } as AgentPost));

  const combined = [...mappedPosts, ...normalizedIntel].sort((a, b) => 
    new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  return { initialPosts: combined, initialSelectedPost };
}

export default function BlogRoute() {
    const { initialPosts, initialSelectedPost } = useLoaderData<typeof loader>();

    return (
        <BlogView initialPosts={initialPosts} initialSelectedPost={initialSelectedPost} />
    );
}
