import React, { useEffect, useState, Suspense, useRef, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { AgentPost } from '../../types';
import { dataService } from '../../services/dataService';
import { Calendar, Eye, User, Tag, ChevronRight, BookOpen, Share2 } from 'lucide-react';
import { optimizeImage } from '../../utils';
import { useParams, useNavigate, Link } from 'react-router';

interface BlogViewProps {
    initialPosts?: AgentPost[];
    initialSelectedPost?: AgentPost | null;
    fullAgentData?: any;
    relatedAgents?: any[];
}

const extractSources = (content: string) => {
    if (!content) return { mainContent: '', sourcesText: '' };
    
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
        const index = content.lastIndexOf(marker);
        // Only split if the marker is in the bottom half of the content
        if (index !== -1 && index > content.length * 0.5) {
            if (splitIndex === -1 || index < splitIndex) {
                splitIndex = index;
            }
        }
    }
    
    // Fallback: check for markdown links at the very end that might be sources
    if (splitIndex === -1) {
        const endLinkRegex = /(?:\[(?:source|via|link|原文)\]\([^)]+\)|(?:source|via|link|原文):\s*https?:\/\/[^\s]+)\s*$/i;
        const match = content.match(endLinkRegex);
        if (match && match.index !== undefined) {
            splitIndex = match.index;
        }
    }
    
    if (splitIndex !== -1) {
        return {
            mainContent: content.substring(0, splitIndex).trim(),
            sourcesText: content.substring(splitIndex).trim()
        };
    }
    
    return { mainContent: content, sourcesText: '' };
};

const extractAllLinks = (content: string, primaryUrl?: string) => {
    const links: { url: string, label: string }[] = [];
    const seenUrls = new Set<string>();

    const addLink = (url: string, label: string) => {
        if (!url) return;
        url = url.trim();
        if (!url.startsWith('http')) {
            if (url.startsWith('www.')) url = 'https://' + url;
            else return;
        }
        if (!seenUrls.has(url)) {
            seenUrls.add(url);
            try {
                const hostname = new URL(url).hostname.replace(/^www\./, '');
                links.push({ url, label: label.trim() || hostname });
            } catch (e) {
                links.push({ url, label: label.trim() || 'Source' });
            }
        }
    };

    if (primaryUrl) {
        addLink(primaryUrl, 'PRIMARY SOURCE');
    }

    if (!content) return links;

    // Match markdown links: [label](url)
    const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    let match;
    while ((match = mdRegex.exec(content)) !== null) {
        addLink(match[2], match[1]);
    }

    // Match raw URLs
    const rawRegex = /(https?:\/\/[^\s)]+)/g;
    while ((match = rawRegex.exec(content)) !== null) {
        addLink(match[1], '');
    }

    return links;
};

const MarkdownComponents = {
    h1: ({node, ...props}: any) => <h1 className="text-xl md:text-2xl font-display font-black text-white mt-12 mb-6 tracking-tight" {...props} />,
    h2: ({node, ...props}: any) => <h2 className="text-lg md:text-xl font-display font-black text-white mt-10 mb-5 tracking-tight border-b border-white/5 pb-2" {...props} />,
    h3: ({node, ...props}: any) => <h3 className="text-base md:text-lg font-display font-bold text-white mt-8 mb-4 tracking-tight" {...props} />,
    strong: ({node, ...props}: any) => <strong className="font-bold text-white" {...props} />,
    a: ({node, ...props}: any) => {
        let href = props.href;
        if (href) {
            try {
                const decodedHref = decodeURIComponent(href);
                // If the href contains '/agent/' or looks like a hallucinated link
                if (decodedHref.includes('/agent/') || decodedHref.includes('[agent]')) {
                    const parts = decodedHref.split('/');
                    const lastPart = parts[parts.length - 1];
                    if (lastPart && lastPart.match(/^[a-zA-Z0-9-]+$/)) {
                        href = `/agent/${lastPart}`;
                    } else {
                        const simpleMatch = decodedHref.match(/\/agent\/([a-zA-Z0-9-]+)/);
                        if (simpleMatch) {
                            href = `/agent/${simpleMatch[1]}`;
                        }
                    }
                }
            } catch (e) {
                // ignore decode errors
            }
        }
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://youagent.top';
        const isInternal = href?.startsWith('/') || href?.startsWith(origin);
        if (isInternal && href) {
            const to = href.startsWith('/') ? href : href.replace(origin, '');
            return <Link {...props} to={to} className="!text-cyan-400 font-bold underline decoration-cyan-400/50 hover:!text-cyan-300" />;
        }
        return <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="!text-cyan-400 font-bold underline decoration-cyan-400/50 hover:!text-cyan-300" />;
    },
    blockquote: ({node, ...props}: any) => (
        <blockquote className="border-l-4 border-cyan-500/50 bg-cyan-950/20 pl-6 py-4 italic text-white rounded-r-2xl shadow-inner my-10 font-display text-base leading-relaxed" {...props} />
    ),
    img: ({node, ...props}: any) => {
        const src = props.src || '';
        const isVideo = src.match(/(youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.webm)/);
        
        if (isVideo) {
            return (
                <div className="my-12 rounded-2xl overflow-hidden border border-white/10 aspect-video shadow-2xl group/video relative">
                    <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none group-hover/video:bg-transparent transition-colors" />
                    <iframe 
                        src={src.replace('watch?v=', 'embed/')} 
                        className="w-full h-full" 
                        allowFullScreen 
                        title="Embedded Video"
                        loading="lazy"
                    />
                </div>
            );
        }
        
        return (
            <div className="my-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group/img">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none" />
                <img 
                    {...props} 
                    src={optimizeImage(src, 1200)}
                    className="w-full h-auto transition-transform duration-700 group-hover/img:scale-[1.02]" 
                    loading="lazy" 
                    referrerPolicy="no-referrer"
                    decoding="async"
                />
            </div>
        );
    }
};

const Breadcrumbs = ({ currentPost }: { currentPost?: AgentPost | null }) => {
    const navigate = useNavigate();
    return (
        <nav className="flex items-center gap-2 mb-8 text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-[0.2em]">
            <button 
                onClick={() => navigate('/', { viewTransition: true })} 
                className="hover:text-cyan-400 transition-colors flex items-center gap-1 group"
            >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span>
                HOME
            </button>
            <ChevronRight size={10} className="text-gray-800" />
            <button 
                onClick={() => navigate('/blog', { viewTransition: true })} 
                className={`hover:text-cyan-400 transition-colors group ${!currentPost ? 'text-cyan-400 font-bold' : ''}`}
            >
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">/</span>
                NEWS
            </button>
            {currentPost && (
                <>
                    <ChevronRight size={10} className="text-gray-800" />
                    <span className="text-cyan-400/80 font-bold truncate max-w-[150px] md:max-w-[300px]">
                        {currentPost.title.toUpperCase()}
                    </span>
                </>
            )}
        </nav>
    );
};

const PostCard = ({ 
    post, 
    isLast, 
    observerRef, 
    onClick, 
    isPreview = false,
    fullAgentData,
    relatedAgents
}: { 
    post: AgentPost, 
    isLast?: boolean, 
    observerRef?: any, 
    onClick?: (post: AgentPost) => void, 
    isPreview?: boolean,
    fullAgentData?: any,
    relatedAgents?: any[]
}) => {
    const navigate = useNavigate();
    
    const { mainContent, sourcesText, sourceLinks, displayContent, processedContent, shouldTruncate } = useMemo(() => {
        const { mainContent, sourcesText } = extractSources(post.content);
        const sourceLinks = extractAllLinks(sourcesText, post.source_url);
        
        const words = mainContent.trim() ? mainContent.trim().split(/\s+/) : [];
        const shouldTruncate = isPreview && words.length > 250;
        const displayContent = shouldTruncate ? words.slice(0, 150).join(' ') + '...' : mainContent;

        let processedContent = displayContent;

        // 1. Convert plain text Source references to markdown links
        processedContent = processedContent.replace(/(\(?Source\s+\d+\)?\.?)/gi, (match, p1, offset, string) => {
            const before = string.slice(Math.max(0, offset - 1), offset);
            const after = string.slice(offset + match.length, offset + match.length + 1);
            if (before === '[' || after === ']') {
                return match; // Already a link
            }
            // Extract the number from the match
            const numMatch = match.match(/\d+/);
            const index = numMatch ? parseInt(numMatch[0], 10) - 1 : -1;
            const url = sourceLinks[index]?.url || '#sources';
            return `[${match}](${url})`;
        });
        
        return { mainContent, sourcesText, sourceLinks, displayContent, processedContent, shouldTruncate };
    }, [post.content, post.source_url, isPreview]);

    // Robustly get agent name and slug
    const agentInfo = Array.isArray(post.agents) ? post.agents[0] : post.agents;
    const agentName = agentInfo?.name || (post.agent_id_link && post.agent_id_link.length < 20 ? post.agent_id_link : 'AGENT');
    const agentSlug = agentInfo?.slug || post.agent_id_link;
    
    return (
        <m.article
            ref={isLast ? observerRef : null}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-2xl transition-all hover:border-white/10 group/card ${onClick && isPreview ? 'cursor-pointer' : ''}`}
            onClick={() => onClick && isPreview && onClick(post)}
        >
            {/* Decorative Grid Background */}
            <div className="absolute inset-0 bg-topology opacity-[0.03] pointer-events-none" />
            
            {/* Title Section */}
            <div className="relative z-10 mb-6">
                <h1 
                    className={`${isPreview ? 'text-3xl md:text-5xl' : 'text-4xl md:text-7xl'} font-display font-black text-white leading-[1.1] tracking-tighter ${onClick ? 'cursor-pointer hover:text-cyan-400 transition-colors' : ''}`}
                    onClick={() => onClick && onClick(post)}
                >
                    {post.title}
                </h1>
            </div>

            {/* Meta Section */}
            <div className="flex flex-wrap items-center gap-4 mb-8 text-[10px] md:text-xs text-gray-500 font-mono border-b border-white/5 pb-6 relative z-10">
                <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-colors">
                    <Calendar size={14} className="text-cyan-400" />
                    {post.published_at && !isNaN(new Date(post.published_at).getTime()) 
                        ? new Date(post.published_at).toLocaleDateString(undefined, { dateStyle: 'long' }) 
                        : 'UNKNOWN DATE'}
                </span>
                
                {post.author_id && (
                    <span className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-cyan-500/30 transition-colors">
                        <User size={14} className="text-cyan-400" />
                        OP_ID: {post.author_id.substring(0, 8)}
                    </span>
                )}
                <div className="flex-1" />
                <span className="text-[10px] opacity-40 uppercase tracking-[0.3em] hidden md:block">
                    SECURE_LINK_ESTABLISHED
                </span>
            </div>

            {/* Tags Section */}
            <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                {post.agent_id_link && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/agent/${agentSlug}`, { viewTransition: true });
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[10px] font-mono uppercase tracking-widest font-black shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all"
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        {agentName}
                    </button>
                )}
                {post.tags && post.tags.length > 0 && post.tags.map(tag => {
                    let colorClass = "bg-white/5 text-gray-400 border-white/10";
                    const lowerTag = tag.toLowerCase();
                    if (lowerTag === 'news') colorClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
                    if (lowerTag === 'update') colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]";
                    if (lowerTag === 'alert') colorClass = "bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]";
                    if (lowerTag === 'rumor') colorClass = "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10_rgba(168,85,247,0.1)]";
                    if (lowerTag === 'tutorial') colorClass = "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]";
                    
                    return (
                        <span key={tag} className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg border text-[10px] font-mono uppercase tracking-widest font-bold ${colorClass}`}>
                            {tag}
                        </span>
                    );
                })}
            </div>
            
            {/* Cover Image */}
            {post.cover_url && (
                <div 
                    className={`w-full ${isPreview ? 'h-64 md:h-80' : 'h-64 md:h-[500px]'} rounded-2xl overflow-hidden mb-10 relative group border border-white/10 shadow-2xl ${onClick ? 'cursor-pointer' : ''}`}
                    onClick={() => onClick && onClick(post)}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                    <div className="absolute inset-0 bg-cyan-500/5 mix-blend-overlay z-10" />
                    <img 
                        src={optimizeImage(post.cover_url, 1600)} 
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
                        referrerPolicy="no-referrer"
                        loading={isPreview ? "lazy" : "eager"}
                        decoding={isPreview ? "async" : "sync"}
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
              {/* Fact Box */}
            {!isPreview && (
                <div className="relative z-10 mb-8 p-4 bg-white/5 border border-white/10 rounded-xl font-mono text-xs text-gray-300 flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">STATUS:</span>
                        <span className="uppercase text-emerald-400 font-bold">{fullAgentData?.status || 'ACTIVE'}</span>
                    </div>
                    {fullAgentData?.framework_stack && fullAgentData.framework_stack.length > 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-bold">MAIN TECH:</span>
                            <span className="uppercase text-emerald-400 font-bold">{fullAgentData.framework_stack.join(', ')}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-400 font-bold">MAIN TECH:</span>
                            <span className="uppercase text-emerald-400 font-bold">VARIOUS</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <span className="text-cyan-400 font-bold">OPEN SOURCE:</span>
                        <span className="uppercase text-emerald-400 font-bold">{fullAgentData?.entity_type === 'open_source' ? 'YES' : (fullAgentData ? 'NO' : 'UNKNOWN')}</span>
                    </div>
                </div>
            )}

            {/* Content Section */}
            <div className="relative z-10 mb-8">
                <div className="prose prose-invert max-w-none font-sans prose-headings:font-display prose-headings:text-white prose-a:text-cyan-400 prose-a:font-bold prose-a:underline prose-a:decoration-cyan-400/50 hover:prose-a:text-cyan-300 prose-code:text-cyan-200 prose-code:bg-cyan-950/30 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-img:rounded-2xl prose-img:shadow-2xl prose-p:text-white prose-p:text-base prose-p:leading-relaxed prose-strong:text-white prose-li:text-white">
                    <ReactMarkdown 
                        rehypePlugins={[rehypeRaw]} 
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                    >
                        {processedContent}
                    </ReactMarkdown>
                    
                    {shouldTruncate && (
                        <div className="mt-6 flex justify-start not-prose">
                            <button 
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick && onClick(post); }}
                                className="group relative inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-950/40 border border-cyan-500/30 rounded-xl overflow-hidden transition-all hover:border-cyan-400/80 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="relative text-sm text-cyan-300 font-mono uppercase tracking-widest font-bold">
                                    DECRYPT_FULL_RECORD
                                </span>
                                <ChevronRight size={16} className="relative text-cyan-400 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {(!shouldTruncate) && sourceLinks.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/5 bg-gradient-to-b from-transparent to-cyan-950/20 rounded-b-3xl -mx-6 -mb-6 px-6 pb-6 md:-mx-10 md:-mb-10 md:px-10 md:pb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            <BookOpen size={14} />
                        </div>
                        <span className="text-cyan-400 font-mono text-sm uppercase tracking-widest font-bold">
                            [SOURCE_TRANSMISSION]
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sourceLinks.map((link, idx) => (
                            <a 
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="group relative flex flex-col items-start justify-center gap-1 px-4 py-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl overflow-hidden transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="relative text-xs text-cyan-300 font-mono uppercase tracking-widest font-bold truncate w-full flex items-center justify-between">
                                    <span className="truncate">{link.label}</span>
                                    <ChevronRight size={14} className="shrink-0 text-cyan-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                                </span>
                                <span className="relative text-[10px] text-cyan-500/60 font-mono truncate w-full">
                                    {link.url.replace(/^https?:\/\//, '')}
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Synergy Matrix */}
            {!isPreview && relatedAgents && relatedAgents.length > 0 && (
                <div className="mt-12 pt-8 border-t border-white/5 bg-gradient-to-b from-transparent to-cyan-950/20 rounded-b-3xl -mx-6 -mb-6 px-6 pb-6 md:-mx-10 md:-mb-10 md:px-10 md:pb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            <Share2 size={14} />
                        </div>
                        <span className="text-cyan-400 font-mono text-sm uppercase tracking-widest font-bold">
                            [RELATED_STRATEGIC_AGENTS]
                        </span>
                        <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 to-transparent"></div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {relatedAgents.map((agent, idx) => (
                            <Link 
                                key={idx}
                                to={`/agent/${agent.slug}`}
                                className="group relative flex flex-col items-start justify-center gap-2 px-4 py-4 bg-cyan-950/30 border border-cyan-500/30 rounded-xl overflow-hidden transition-all hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="flex items-center gap-3 w-full">
                                    {agent.avatar_url && (
                                        <img src={agent.avatar_url} alt={agent.name} className="w-8 h-8 rounded-full border border-white/10 object-cover" loading="lazy" decoding="async" />
                                    )}
                                    <span className="relative text-sm text-cyan-300 font-mono uppercase tracking-widest font-bold truncate flex-1">
                                        {agent.name}
                                    </span>
                                    <ChevronRight size={14} className="shrink-0 text-cyan-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                                </div>
                                {agent.one_liner && (
                                    <span className="relative text-[10px] text-cyan-500/60 font-mono line-clamp-2 w-full">
                                        {agent.one_liner}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </m.article>
    );
};

const BlogView: React.FC<BlogViewProps> = ({ initialPosts = [], initialSelectedPost = null, fullAgentData, relatedAgents }) => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [posts, setPosts] = useState<AgentPost[]>(initialPosts);
    const [loading, setLoading] = useState(initialPosts.length === 0);
    const [selectedPost, setSelectedPost] = useState<AgentPost | null>(initialSelectedPost);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(initialPosts.length >= 10);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const lastPostRef = React.useCallback((node: HTMLDivElement | null) => {
        if (loading || !hasMore) return;
        if (observerRef.current) observerRef.current.disconnect();
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        
        if (node) observerRef.current.observe(node);
    }, [loading, hasMore]);

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
            id: `intel-${intel.id}`,
            agent_id_link: intel.agent_id_link,
            title: intel.title,
            slug: `intel-${intel.id}`, // Virtual slug
            content: (intel.content || intel.summary),
            source_url: intel.source_url,
            published_at: intel.published_at,
            tags: [intel.intel_type || 'INTEL'],
            cover_url: intel.image_url, // Use image_url from DB
            views_count: 0,
            agents: Array.isArray(intel.agents) ? intel.agents[0] : intel.agents
        } as AgentPost));

        const combined = [...postsData, ...normalizedIntel].sort((a, b) => {
            const timeA = a.published_at ? new Date(a.published_at).getTime() : 0;
            const timeB = b.published_at ? new Date(b.published_at).getTime() : 0;
            return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
        });

        setPosts(prev => pageNum === 0 ? combined : [...prev, ...combined]);
        setHasMore(postsData.length === 10 || intelData.length === 10);
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts(0);
    }, []);

    useEffect(() => {
        if (page > 0) fetchPosts(page);
    }, [page]);

    const scrollToTop = () => {
        const scrollArea = document.querySelector('.main-scroll-area');
        if (scrollArea) {
            scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (slug) {
            if (initialSelectedPost && initialSelectedPost.slug === slug) {
                setSelectedPost(initialSelectedPost);
                scrollToTop();
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
                            cover_url: undefined,
                            agents: Array.isArray(intel.agents) ? intel.agents[0] : intel.agents
                        } as AgentPost);
                    }
                } else {
                    const post = await dataService.getAgentPostBySlug(slug);
                    if (post) setSelectedPost(post);
                }
                scrollToTop();
            };
            fetchPost();
        } else {
            setSelectedPost(null);
            scrollToTop();
        }
    }, [slug, initialSelectedPost]);

    const handlePostClick = (post: AgentPost) => {
        if (post.slug !== slug) {
            navigate(`/blog/${post.slug}`, { viewTransition: true });
            scrollToTop();
        }
    };

    const handleBack = () => {
        navigate('/blog', { viewTransition: true });
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 pt-24 pb-20 px-4 md:px-12 font-sans">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 border-b border-white/10 pb-8 relative">
                    <Breadcrumbs currentPost={selectedPost} />
                    <h1 
                        className="text-4xl md:text-6xl font-display font-black text-white mb-6 tracking-tighter cursor-pointer hover:text-cyan-400 transition-all duration-500 hover:tracking-tight whitespace-nowrap"
                        onClick={handleBack}
                    >
                        News & Blog
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent" />
                        <p className="text-cyan-500/60 font-mono text-[10px] md:text-xs uppercase tracking-[0.4em] animate-pulse">
                            [SYSTEM_LOGS]: DECRYPTING_AGENT_NARRATIVES_AND_TACTICAL_REPORTS...
                        </p>
                    </div>
                </header>

                <div className="space-y-12">
                    {loading && !selectedPost && posts.length === 0 ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-64 bg-white/5 rounded-2xl animate-pulse" />
                        ))
                    ) : selectedPost ? (
                        <div className="space-y-16">
                            <PostCard post={selectedPost} isPreview={false} fullAgentData={fullAgentData} relatedAgents={relatedAgents} />
                            
                            <div className="pt-12 border-t border-white/10">
                                <h2 className="text-2xl font-display font-bold text-white mb-8 flex items-center gap-3">
                                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                                    LATEST_TRANSMISSIONS
                                </h2>
                                <div className="space-y-12">
                                    {posts.filter(p => p.id !== selectedPost.id).map((post, index, arr) => (
                                        <PostCard 
                                            key={post.id} 
                                            post={post} 
                                            isLast={index === arr.length - 1} 
                                            observerRef={lastPostRef}
                                            onClick={handlePostClick}
                                            isPreview={true}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        posts.map((post, index) => (
                            <PostCard 
                                key={post.id} 
                                post={post} 
                                isLast={index === posts.length - 1} 
                                observerRef={lastPostRef}
                                onClick={handlePostClick}
                                isPreview={true}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogView;
