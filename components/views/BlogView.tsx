import React, { useEffect, useState, Suspense, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { AgentPost } from '../../types';
import { dataService } from '../../services/dataService';
import { Calendar, Eye, User, Tag, ChevronRight, BookOpen } from 'lucide-react';
import { optimizeImage } from '../../utils';
import { useParams, useNavigate } from 'react-router';

interface BlogViewProps {
    initialPosts?: AgentPost[];
    initialSelectedPost?: AgentPost | null;
}

const BlogView: React.FC<BlogViewProps> = ({ initialPosts = [], initialSelectedPost = null }) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<AgentPost[]>(initialPosts);
    const [loading, setLoading] = useState(initialPosts.length === 0);
    const [selectedPost, setSelectedPost] = useState<AgentPost | null>(initialSelectedPost);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(initialPosts.length >= 10);
    const observerRef = useRef<IntersectionObserver | null>(null);
    const lastPostRef = useRef<HTMLDivElement | null>(null);

    const fetchPosts = async (pageNum: number) => {
        if (pageNum === 0 && initialPosts.length > 0) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const [postsData, intelData] = await Promise.all([
            dataService.getAgentPosts(pageNum, 10),
            dataService.getRecentIntel(pageNum, 10)
        ]);
        
        // Normalize Intel to Post format
        const normalizedIntel = intelData.map((intel: any) => ({
            id: intel.id,
            agent_id_link: intel.agent_id_link,
            title: intel.title,
            slug: `intel-${intel.id}`, // Virtual slug
            content: (intel.content || intel.summary),
            source_url: intel.source_url,
            published_at: intel.published_at,
            tags: [intel.intel_type || 'INTEL'],
            cover_url: intel.image_url, // Use image_url from DB
            views_count: 0
        } as AgentPost));

        const combined = [...postsData, ...normalizedIntel].sort((a, b) => 
            new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
        );

        setPosts(prev => pageNum === 0 ? combined : [...prev, ...combined]);
        setHasMore(postsData.length === 10 || intelData.length === 10);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts(0);
    }, []);

    useEffect(() => {
        if (loading || !hasMore) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setPage(prev => prev + 1);
            }
        });

        if (lastPostRef.current) observerRef.current.observe(lastPostRef.current);
    }, [loading, hasMore, posts]);

    useEffect(() => {
        if (page > 0) fetchPosts(page);
    }, [page]);



    useEffect(() => {
        if (slug) {
            if (initialSelectedPost && initialSelectedPost.slug === slug) {
                setSelectedPost(initialSelectedPost);
                return;
            }
            const fetchPost = async () => {
                if (slug.startsWith('intel-')) {
                    // Handle Intel
                    const id = slug.replace('intel-', '');
                    const intel = await dataService.getAgentIntelById(id);
                    if (intel) {
                         setSelectedPost({
                            id: intel.id,
                            agent_id_link: intel.agent_id_link,
                            title: intel.title,
                            slug: `intel-${intel.id}`,
                            content: (intel.content || intel.summary),
                            source_url: intel.source_url,
                            published_at: intel.published_at,
                            tags: [intel.intel_type || 'INTEL'],
                            cover_url: undefined
                        } as AgentPost);
                    }
                } else {
                    const post = await dataService.getAgentPostBySlug(slug);
                    if (post) setSelectedPost(post);
                }
            };
            fetchPost();
        } else {
            setSelectedPost(null);
        }
    }, [slug, initialSelectedPost]);

    const handlePostClick = (post: AgentPost) => {
        navigate(`/blog/${post.slug}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        navigate('/blog');
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 pt-24 pb-20 px-4 md:px-12 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 border-b border-white/10 pb-8">
                    <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-4 tracking-tight">
                        NEURAL <span className="text-cyan-400">CHRONICLES</span>
                    </h1>
                    <p className="text-gray-500 font-mono text-sm md:text-base max-w-2xl">
                        [SYSTEM_LOGS]: DECRYPTING_AGENT_NARRATIVES_AND_TACTICAL_REPORTS...
                    </p>
                </header>

                <div className="space-y-12">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-64 bg-white/5 rounded-xl animate-pulse" />
                        ))
                    ) : (
                        posts.map((post, index) => (
                            <m.article
                                key={post.id}
                                ref={index === posts.length - 1 ? lastPostRef : null}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-black/20 border border-white/10 rounded-2xl p-6 md:p-10 backdrop-blur-sm relative overflow-hidden"
                            >
                                {/* Cover Image */}
                                {post.cover_url && (
                                    <div className="w-full h-64 md:h-80 rounded-xl overflow-hidden mb-8 relative group">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                                        <img 
                                            src={optimizeImage(post.cover_url, 1200)} 
                                            alt={post.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                if (target.parentElement) {
                                                    target.parentElement.style.display = 'none';
                                                }
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="flex items-center gap-4 mb-6 text-sm text-gray-400 font-mono border-b border-white/5 pb-4">
                                    <span className="flex items-center gap-2">
                                        <Calendar size={14} className="text-cyan-400" />
                                        {new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    </span>
                                    {post.author_id && (
                                        <span className="flex items-center gap-2">
                                            <User size={14} className="text-cyan-400" />
                                            OP_ID: {post.author_id.substring(0, 8)}
                                        </span>
                                    )}
                                </div>

                                <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-8 leading-tight">
                                    {post.title}
                                </h1>

                                <div className="prose prose-invert prose-cyan max-w-none font-sans prose-headings:font-display prose-headings:font-bold prose-p:text-gray-300 prose-a:text-cyan-400 hover:prose-a:text-cyan-300 prose-code:text-cyan-200 prose-code:bg-cyan-950/30 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                                    <ReactMarkdown 
                                        rehypePlugins={[rehypeRaw]} 
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            img: ({node, ...props}) => {
                                                const src = props.src || '';
                                                const isVideo = src.match(/(youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm)/);
                                                
                                                if (isVideo) {
                                                    return (
                                                        <div className="my-8 rounded-xl overflow-hidden border border-white/10 aspect-video">
                                                            <iframe 
                                                                src={src.replace('watch?v=', 'embed/')} 
                                                                className="w-full h-full" 
                                                                allowFullScreen 
                                                                title="Embedded Video"
                                                            />
                                                        </div>
                                                    );
                                                }
                                                
                                                return (
                                                    <div className="my-8 rounded-xl overflow-hidden border border-white/10">
                                                        <img {...props} className="w-full h-auto" loading="lazy" />
                                                    </div>
                                                );
                                            },
                                            blockquote: ({node, ...props}) => (
                                                <blockquote className="border-l-4 border-cyan-500/50 bg-cyan-950/10 pl-4 py-2 italic text-gray-400 rounded-r-lg" {...props} />
                                            )
                                        }}
                                    >
                                        {post.content}
                                    </ReactMarkdown>
                                </div>
                                
                                {post.source_url && (
                                    <div className="mt-8 flex items-center justify-end border-t border-white/5 pt-4">
                                        <a 
                                            href={post.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer nofollow"
                                            className="text-xs text-cyan-500/50 hover:text-cyan-400 flex items-center gap-2 transition-colors uppercase tracking-wider font-mono"
                                        >
                                            [SOURCE_TRANSMISSION] <ChevronRight size={12} />
                                        </a>
                                    </div>
                                )}
                                
                                <div className="mt-12 pt-8 border-t border-white/10 flex justify-end items-center">
                                    <div className="flex gap-2">
                                        {post.tags?.map(tag => (
                                            <span key={tag} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </m.article>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogView;
