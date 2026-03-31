import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams, useNavigate, useLoaderData, Link } from 'react-router';
import * as pkg from 'react-helmet-async';
import { ChevronDown, ChevronUp } from 'lucide-react';

const Helmet = (pkg as any).Helmet || (pkg as any).default?.Helmet || (pkg as any).default || pkg;
import { AgentRegistryEntity } from '../../app/types/registry';
import { Agent, UserProfile } from '../../types';
import { dataService } from '../../services/dataService';
import { TacticalHUD } from '../shared/TacticalHUD';
import { SkeletonTacticalHUD } from '../skeletons/SkeletonTacticalHUD';
import { NREProfile } from '../../hooks/useNRE';

interface AgentDetailProps {
    agent?: AgentRegistryEntity; // Optional, can be fetched via slug
    initialRelatedAgents?: AgentRegistryEntity[];
    intelFeed?: any[];
    userProfile: UserProfile;
    onEnterLounge: (agent: AgentRegistryEntity) => void;
    onTagClick: (tag: string) => void;
    onLike: (id: string) => void;
    onBookmark: (id: string) => void;
    onShare: (agent: AgentRegistryEntity) => void;
    isForging: boolean;
    isSpeaking: boolean;
    nreProfile?: NREProfile;
    setNREProfile?: (p: NREProfile) => void;
    
    // Legacy props from DiscoverView compatibility
    agents?: AgentRegistryEntity[];
    activeAgentId?: string | null;
    direction?: 1 | -1;
    navWarning?: 'NEXT' | 'PREV' | 'BOUNCE_NEXT' | 'BOUNCE_PREV' | null;
    setActiveAgentId?: (id: string) => void;
    isSystemCalculationMode?: boolean;
    isTransitioning?: boolean;
    prevAgentId?: string;
    nextAgentId?: string;
    onNext?: () => void;
    onPrev?: () => void;
}

export const AgentDetail: React.FC<AgentDetailProps> = (props) => {
    const navigate = useNavigate();

    // [BOUNDARY_BREAK] Scroll Logic State
    const [showNextIndicator, setShowNextIndicator] = useState(false);
    const [showPrevIndicator, setShowPrevIndicator] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // [TACTICAL FIX 1] KINETIC RESET (动能归零)
    // 使用 useEffect 确保在浏览器绘制后完成滚动，避免 SSR 警告
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [props.agent?.id]); // 监听 ID 变化，一旦切换 Agent，立即置顶

    const navWarning = props.navWarning || null;

    // [BOUNDARY_BREAK] Scroll Interaction Protocol
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        let lastTouchY = 0;

        const handleWheel = (e: WheelEvent) => {
            if (props.isTransitioning) return;
            
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
            const isAtTop = container.scrollTop <= 10;

            if (isAtBottom && e.deltaY > 50) {
                props.onNext?.();
            } else if (isAtTop && e.deltaY < -50) {
                props.onPrev?.();
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            lastTouchY = e.touches[0].clientY;
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (props.isTransitioning) return;
            
            const touchY = e.touches[0].clientY;
            const deltaY = lastTouchY - touchY;
            
            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;
            const isAtTop = container.scrollTop <= 10;

            if (isAtBottom && deltaY > 70) {
                props.onNext?.();
            } else if (isAtTop && deltaY < -70) {
                props.onPrev?.();
            }
            
            lastTouchY = touchY;
        };

        container.addEventListener('wheel', handleWheel, { passive: true });
        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: true });

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, [props.isTransitioning, props.onNext, props.onPrev, props.navWarning]);

    // [ZERO-LATENCY] IntersectionObserver for Boundary Detection
    const bottomSentinelRef = useRef<HTMLDivElement>(null);
    const topSentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const bottomObserver = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !props.isTransitioning) {
                    setShowNextIndicator(true);
                } else {
                    setShowNextIndicator(false);
                }
            },
            { 
                threshold: 0.1,
                root: scrollContainerRef.current,
                rootMargin: '0px 0px 50px 0px' 
            }
        );

        const topObserver = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !props.isTransitioning) {
                    setShowPrevIndicator(true);
                } else {
                    setShowPrevIndicator(false);
                }
            },
            { 
                threshold: 0.1,
                root: scrollContainerRef.current,
                rootMargin: '50px 0px 0px 0px' 
            }
        );

        if (bottomSentinelRef.current) bottomObserver.observe(bottomSentinelRef.current);
        if (topSentinelRef.current) topObserver.observe(topSentinelRef.current);

        return () => {
            bottomObserver.disconnect();
            topObserver.disconnect();
        };
    }, [props.isTransitioning, props.agent]); 

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
    const coverUrl = props.agent ? sanitizeValue(props.agent.assets.cover_url || fallbackImage) : fallbackImage;
    const proxiedCover = `/api/v1/img-proxy?url=${encodeURIComponent(coverUrl)}&w=800&q=80`;

    return (
        <div 
            className="relative h-full w-full bg-black"
        >
            <div 
                ref={scrollContainerRef}
                className={`relative h-full w-full bg-black overflow-y-auto scrollbar-hide pb-20 transition-all duration-400 ease-out ${
                    props.isTransitioning ? '-translate-y-[50px] opacity-50 scale-95' : 
                    props.navWarning === 'BOUNCE_NEXT' ? '-translate-y-[30px]' :
                    props.navWarning === 'BOUNCE_PREV' ? 'translate-y-[30px]' :
                    'translate-y-0 opacity-100 scale-100'
                }`}
            >
                {/* [ZERO-LATENCY] Sentinel for Top Detection */}
                <div ref={topSentinelRef} className="h-4 w-full pointer-events-none opacity-0" />

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
                        href={props.agent.assets.video_poster || proxiedCover}
                        {...({ fetchpriority: "high" } as any)}
                    />
                )}

                {/* Main HUD Area */}
                <div className="w-full">
                    {props.agent && props.agent.id ? (
                        <>
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
                                <nav aria-label="Breadcrumb" className="text-xs text-white/50 mb-4 font-mono">
                                    <ol className="flex items-center gap-2">
                                        <li><Link to="/" className="hover:text-cyan-400">Home</Link></li>
                                        <li><span className="text-white/30">/</span></li>
                                        <li><Link to={`/?category=${encodeURIComponent(props.agent.category || 'ALL')}`} className="hover:text-cyan-400">{props.agent.category || 'ALL'}</Link></li>
                                        <li><span className="text-white/30">/</span></li>
                                        <li className="text-cyan-400 truncate" aria-current="page">{props.agent.name}</li>
                                    </ol>
                                </nav>
                            </div>
                            <TacticalHUD 
                                key={props.agent.id}
                                agent={props.agent}
                                intelFeed={props.intelFeed}
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
                                onPrev={props.onPrev}
                                onNext={props.onNext}
                                prevAgentId={props.prevAgentId}
                                nextAgentId={props.nextAgentId}
                                relatedAgents={props.initialRelatedAgents || []}
                                isScanning={false}
                            />
                        </>
                    ) : (
                        <div className="p-8 text-center text-slate-500 font-mono">
                            [ SYSTEM_ERROR: AGENT_DATA_UNAVAILABLE ]
                        </div>
                    )}
                </div>

                {/* [ZERO-LATENCY] Sentinel for IntersectionObserver */}
                <div ref={bottomSentinelRef} className="h-4 w-full pointer-events-none opacity-0" />

                {/* [BOUNDARY_BREAK] Visual Feedback */}
                {showPrevIndicator && !props.isTransitioning && props.navWarning !== 'BOUNCE_PREV' && (
                    <div 
                        key="prev-indicator"
                        className="fixed top-8 left-0 right-0 flex justify-center pointer-events-none z-50 animate-in fade-in slide-in-from-top-5 duration-300"
                    >
                        <div className="bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" aria-hidden="true" />
                            <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase">
                                [ SCROLL UP TO PREVIOUS AGENT ]
                            </span>
                        </div>
                    </div>
                )}
                {showNextIndicator && !props.isTransitioning && props.navWarning !== 'BOUNCE_NEXT' && (
                    <div 
                        key="next-indicator"
                        className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
                    >
                        <div className="bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" aria-hidden="true" />
                            <span className="text-cyan-400 font-mono text-[10px] tracking-widest uppercase">
                                [ SCROLL DOWN TO NEXT AGENT ]
                            </span>
                        </div>
                    </div>
                )}
                {props.navWarning === 'BOUNCE_NEXT' && (
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
                {props.navWarning === 'BOUNCE_PREV' && (
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
        </div>
    );
};
