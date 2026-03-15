import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLoaderData } from 'react-router';
import * as pkg from 'react-helmet-async';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Helmet = (pkg as any).Helmet || (pkg as any).default?.Helmet || (pkg as any).default || pkg;
import { Agent, UserProfile } from '../../types';
import { dataService } from '../../services/dataService';
import { TacticalHUD } from '../shared/TacticalHUD';
import { ActionBar } from '../layout/ActionBar';
import { SkeletonTacticalHUD } from '../skeletons/SkeletonTacticalHUD';
import { NREProfile } from '../../hooks/useNRE';

interface AgentDetailProps {
    agent?: Agent; // Optional, can be fetched via slug
    initialRelatedAgents?: Agent[];
    userProfile: UserProfile;
    onEnterLounge: (agent: Agent) => void;
    onTagClick: (tag: string) => void;
    onLike: (id: string) => void;
    onBookmark: (id: string) => void;
    onShare: (agent: Agent) => void;
    isForging: boolean;
    isSpeaking: boolean;
    nreProfile?: NREProfile;
    setNREProfile?: (p: NREProfile) => void;
    
    // Legacy props from DiscoverView compatibility
    agents?: Agent[];
    activeAgentId?: string | null;
    direction?: 1 | -1;
    navWarning?: 'NEXT' | 'PREV' | 'BOUNCE_NEXT' | 'BOUNCE_PREV' | null;
    setActiveAgentId?: (id: string) => void;
    isSystemCalculationMode?: boolean;
}

export const AgentDetail: React.FC<AgentDetailProps> = (props) => {
    const navigate = useNavigate();

    // [BOUNDARY_BREAK] Scroll Logic State
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [showNextIndicator, setShowNextIndicator] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // [TACTICAL FIX 1] KINETIC RESET (动能归零)
    // 使用 useEffect 确保在浏览器绘制后完成滚动，避免 SSR 警告
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [props.agent?.id]); // 监听 ID 变化，一旦切换 Agent，立即置顶

    // [BOUNDARY_BREAK] Scroll Interaction Protocol
    const currentList = props.agents || [];
    const currentIndex = currentList.findIndex(a => a.id === props.agent?.id);
    const prevAgent = currentIndex !== -1 ? currentList[(currentIndex - 1 + currentList.length) % currentList.length] : null;
    const nextAgent = currentIndex !== -1 ? currentList[(currentIndex + 1) % currentList.length] : null;

    const loadNextAgent = useCallback(() => {
        if (isTransitioning) return;
        
        if (nextAgent) {
            setIsTransitioning(true);
            
            setTimeout(() => {
                props.setActiveAgentId?.(nextAgent.id);
                navigate(`/agent/${nextAgent.slug || nextAgent.id}`);
                setIsTransitioning(false);
                // Scroll container to top
                if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
            }, 400);
        }
    }, [isTransitioning, nextAgent, navigate, props.setActiveAgentId]);

    const loadPrevAgent = useCallback(() => {
        if (isTransitioning) return;
        
        if (prevAgent) {
            setIsTransitioning(true);
            setTimeout(() => {
                props.setActiveAgentId?.(prevAgent.id);
                navigate(`/agent/${prevAgent.slug || prevAgent.id}`);
                setIsTransitioning(false);
                if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
            }, 400);
        }
    }, [isTransitioning, prevAgent, navigate, props.setActiveAgentId]);

    const navWarning = props.navWarning || null;

    // [ZERO-LATENCY] IntersectionObserver for Bottom Detection
    const bottomSentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isTransitioning) {
                    setShowNextIndicator(true);
                } else {
                    setShowNextIndicator(false);
                }
            },
            { 
                threshold: 0.1,
                root: scrollContainerRef.current,
                rootMargin: '0px 0px -20px 0px' // Trigger slightly before bottom
            }
        );

        if (bottomSentinelRef.current) {
            observer.observe(bottomSentinelRef.current);
        }

        return () => observer.disconnect();
    }, [isTransitioning, props.agent]); // Re-bind when content changes

    if (!props.agent) return <SkeletonTacticalHUD />;

    const handleConnect = () => {
        if (props.agent?.connectivity?.try_url) {
            window.open(props.agent.connectivity.try_url, '_blank');
        }
    };

    const sanitizeValue = (val: any): string => {
        if (val === undefined || val === null) return "";
        if (Array.isArray(val)) {
            return val.map(v => sanitizeValue(v)).join(', ');
        }
        if (typeof val === 'object') {
            if (val.type) return String(val.type);
            if (val.name) return String(val.name);
            return "";
        }
        return String(val);
    };

    const pageTitle = props.agent ? `${sanitizeValue(props.agent.name)} - ${sanitizeValue(props.agent.slogan)} | YouAgent` : 'YouAgent OS | Discover';
    const pageDesc = props.agent ? sanitizeValue(props.agent.description || props.agent.slogan) : 'Discover the best AI agents.';
    const fallbackImage = "https://youagent.top/assets/default_og.png";
    const coverUrl = props.agent ? sanitizeValue(props.agent.cover_url || fallbackImage) : fallbackImage;
    const proxiedCover = `/api/v1/img-proxy?url=${encodeURIComponent(coverUrl)}&w=800&q=80`;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": sanitizeValue(props.agent.name),
        "description": sanitizeValue(props.agent.full_description || props.agent.description || props.agent.slogan),
        "applicationCategory": sanitizeValue(props.agent.category || "AI Agent"),
        "operatingSystem": "Web",
        "softwareRequirements": props.agent.framework_stack?.join(', '),
        "offers": {
            "@type": "Offer",
            "price": props.agent.pricing_model && typeof props.agent.pricing_model === 'object' ? (props.agent.pricing_model as any).price : "0",
            "priceCurrency": "USD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": props.agent.social_proof?.rating || (props.agent.metrics?.nri_score ? (props.agent.metrics.nri_score / 200).toFixed(1) : "4.5"),
            "reviewCount": props.agent.social_proof?.reviews_count || (props.agent.metrics?.nri_score ? Math.floor(props.agent.metrics.nri_score * 1.2) : 100)
        }
    };

    return (
        <div 
            ref={scrollContainerRef}
            className={`relative h-full w-full bg-black overflow-y-auto scrollbar-hide pb-20 transition-all duration-400 ease-out ${
                isTransitioning ? '-translate-y-[50px] opacity-50 scale-95' : 
                navWarning === 'BOUNCE_NEXT' ? '-translate-y-[30px]' :
                navWarning === 'BOUNCE_PREV' ? 'translate-y-[30px]' :
                'translate-y-0 opacity-100 scale-100'
            }`}
        >
            <ActionBar 
                agent={props.agent}
                prevAgentId={prevAgent?.slug || prevAgent?.id}
                nextAgentId={nextAgent?.slug || nextAgent?.id}
                onLike={() => props.onLike(props.agent!.id)}
                onBookmark={() => props.onBookmark(props.agent!.id)}
                onShare={() => props.onShare(props.agent!)}
                onOpenComments={() => { /* TODO: Implement actual comments modal */ console.log('Open comments'); }}
                isLiked={props.userProfile.achievements.includes(`liked:${props.agent.id}`)}
                isBookmarked={props.userProfile.badges.includes(props.agent.id)}
                onNext={loadNextAgent}
                onPrev={loadPrevAgent}
            />

            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDesc} />
                <link rel="canonical" href={`https://youagent.top/agent/${props.agent.slug || props.agent.id}`} />
                <meta property="og:title" content={`${sanitizeValue(props.agent.name)} | YouAgent`} />
                <meta property="og:description" content={pageDesc} />
                <meta property="og:image" content={proxiedCover} />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>
            {props.agent && (
                <link
                    rel="preload"
                    as="image"
                    href={props.agent.video_poster || proxiedCover}
                    {...({ fetchpriority: "high" } as any)}
                />
            )}

            {/* Main HUD Area */}
            <div className="w-full">
                {props.agent && props.agent.id ? (
                    <TacticalHUD 
                        key={props.agent.id}
                        agent={props.agent}
                        onConnect={handleConnect}
                        onEnterLounge={() => props.onEnterLounge(props.agent!)}
                        onTagClick={props.onTagClick}
                        onLike={() => props.onLike(props.agent!.id)}
                        onBookmark={() => props.onBookmark(props.agent!.id)}
                        onShare={() => props.onShare(props.agent!)}
                        isLiked={props.userProfile.achievements.includes(`liked:${props.agent.id}`)}
                        isBookmarked={props.userProfile.badges.includes(props.agent.id)}
                        isForging={props.isForging}
                        isSpeaking={props.isSpeaking}
                        nreProfile={props.nreProfile}
                        setNREProfile={props.setNREProfile}
                        onPrev={() => {}}
                        onNext={() => {}}
                        prevAgentId={prevAgent?.id}
                        nextAgentId={nextAgent?.id}
                        relatedAgents={props.initialRelatedAgents || []}
                        isScanning={false}
                    />
                ) : (
                    <div className="p-8 text-center text-slate-500 font-mono">
                        [ SYSTEM_ERROR: AGENT_DATA_UNAVAILABLE ]
                    </div>
                )}
            </div>

            {/* [ZERO-LATENCY] Sentinel for IntersectionObserver */}
            <div ref={bottomSentinelRef} className="h-px w-full pointer-events-none opacity-0" />

            {/* [BOUNDARY_BREAK] Visual Feedback */}
            {showNextIndicator && !isTransitioning && navWarning !== 'BOUNCE_NEXT' && (
                <div 
                    key="next-indicator"
                    className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
                >
                    <div className="bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" aria-hidden="true" />
                        <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase">
                            [ NEXT_SECTOR_READY ]
                        </span>
                    </div>
                </div>
            )}
            {navWarning === 'BOUNCE_NEXT' && (
                <div 
                    key="bounce-next"
                    className="fixed bottom-0 left-0 w-full h-24 bg-gradient-to-t from-cyan-900/60 to-transparent flex flex-col justify-end items-center pb-6 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-12 duration-300"
                >
                    <ChevronDown size={32} className="text-cyan-400 animate-bounce mb-2 drop-shadow-[0_0_8px_#22d3ee]" aria-hidden="true" />
                    <span className="text-cyan-400 font-mono text-[10px] tracking-[0.3em] drop-shadow-[0_0_8px_#22d3ee]">
                    SCROLL AGAIN TO SWITCH
                    </span>
                </div>
            )}
            {navWarning === 'BOUNCE_PREV' && (
                <div 
                    key="bounce-prev"
                    className="fixed top-0 left-0 w-full h-24 bg-gradient-to-b from-cyan-900/60 to-transparent flex flex-col justify-start items-center pt-6 z-50 pointer-events-none animate-in fade-in slide-in-from-top-12 duration-300"
                >
                    <ChevronUp size={32} className="text-cyan-400 animate-bounce mt-2 drop-shadow-[0_0_8px_#22d3ee]" aria-hidden="true" />
                    <span className="text-cyan-400 font-mono text-[10px] tracking-[0.3em] drop-shadow-[0_0_8px_#22d3ee]">
                    SCROLL AGAIN TO SWITCH
                    </span>
                </div>
            )}
        </div>
    );
};
