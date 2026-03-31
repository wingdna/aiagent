
import React, { useEffect, useState } from 'react';
import * as pkg from 'react-helmet-async';
import { TacticalHUD } from '../shared/TacticalHUD';

const Helmet = (pkg as any).Helmet || (pkg as any).default?.Helmet || (pkg as any).default || pkg;
import { SkeletonTacticalHUD } from '../skeletons/SkeletonTacticalHUD';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { ActionBar } from '../layout/ActionBar';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Agent, UserProfile } from '../../types';
import { NREProfile } from '../../hooks/useNRE';
import { getYouTubeThumbnail, optimizeImage } from '../../utils';
import { dataService } from '../../services/dataService';

interface DiscoverViewProps {
    agents: AgentRegistryEntity[];
    activeAgentId: string | null;
    direction: 1 | -1;
    setActiveAgentId: (id: string) => void;
    onEnterLounge: (agent: AgentRegistryEntity) => void;
    onTagClick: (tag: string) => void;
    onLike: (id: string) => void;
    onBookmark: (id: string) => void;
    onShare: (agent: AgentRegistryEntity) => void;
    userProfile: UserProfile;
    isForging: boolean;
    isSpeaking: boolean;
    isSystemCalculationMode?: boolean;
    nreProfile?: NREProfile;
    setNREProfile?: (p: NREProfile) => void;
    isLoading?: boolean;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
    agents,
    activeAgentId,
    direction,
    setActiveAgentId,
    onEnterLounge,
    onTagClick,
    onLike,
    onBookmark,
    onShare,
    userProfile,
    isForging,
    isSpeaking,
    isSystemCalculationMode = false,
    nreProfile,
    setNREProfile,
    isLoading
}) => {
    const [isScanning, setIsScanning] = useState(false);

    // ⚡ Protocol V21.0: Predictive Asset Prefetching
    useEffect(() => {
        if (!agents || agents.length === 0 || !activeAgentId) return;
        const currentIndex = agents.findIndex(a => a.id === activeAgentId);
        if (currentIndex === -1) return;

        // Calculate indices for next and previous agents (circular)
        const nextIndex = (currentIndex + 1) % agents.length;
        const prevIndex = (currentIndex - 1 + agents.length) % agents.length;

        const targets = [agents[nextIndex], agents[prevIndex]];

        targets.forEach(agent => {
            if (!agent) return;

            // 1. Prefetch Video Poster / Persona
            const posterUrl = agent.assets.video_poster || agent.persona_img;
            if (posterUrl) {
                const img = new Image();
                img.src = optimizeImage(posterUrl, 1920);
                // Low priority for prefetch to not block main thread
                // @ts-ignore
                img.fetchpriority = 'low';
            }

            // 2. Prefetch YouTube Thumbnail if applicable
            if (agent.assets.video_url && (agent.assets.video_url.includes('youtube') || agent.assets.video_url.includes('youtu.be'))) {
                const thumb = getYouTubeThumbnail(agent.assets.video_url, 'max');
                if (thumb) {
                    const img = new Image();
                    img.src = thumb;
                    // @ts-ignore
                    img.fetchpriority = 'low';
                }
            }
        });
    }, [activeAgentId, agents]);

    // [GPU_OFFLOAD_PROTOCOL] Detect Mobile for Static Blur
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia('(hover: none)').matches);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Helper to get background image URL
    const getBgImage = (url: string | undefined) => {
        if (!url) return '';
        return url;
    };

    // V17.0: Skeleton Loading State
    // If no agents are loaded yet or actively fetching, show skeleton
    if (isLoading && (!agents || agents.length === 0)) {
        return (
            <div className="relative h-full w-full overflow-hidden bg-black">
                <SkeletonTacticalHUD />
                <div className="absolute bottom-10 left-0 right-0 text-center">
                    <span className="text-xs font-mono text-cyan-400 animate-pulse">[ INITIALIZING_YOUAGENT_LINK... ]</span>
                </div>
            </div>
        );
    }

    const currentAgent = agents.find(a => a.id === activeAgentId) || agents[0];
    const currentIndex = agents.findIndex(a => a.id === activeAgentId);
    const prevIndex = (currentIndex - 1 + agents.length) % agents.length;
    const nextIndex = (currentIndex + 1) % agents.length;
    const prevAgentId = agents[prevIndex]?.id;
    const nextAgentId = agents[nextIndex]?.id;

    // --- NAVIGATION HANDLERS ---
    const handlePrev = () => {
        React.startTransition(() => {
            setActiveAgentId(prevAgentId);
        });
    };

    const handleNext = () => {
        React.startTransition(() => {
            setActiveAgentId(nextAgentId);
        });
    };

    const handleNeuralRadar = async () => {
        if (!currentAgent) return;

        setIsScanning(true);
        try {
            // 1. Fetch Semantic Matches
            const matches = await dataService.findSimilarAgents(currentAgent);

            // 2. Filter out current agent
            const validMatches = matches.filter(a => a.id !== currentAgent.id);

            if (validMatches.length > 0) {
                // 3. Navigate to top match
                const topMatch = validMatches[0];
                setActiveAgentId(topMatch.id);
            } else {
                handleNext();
            }
        } catch (e) {
            console.error("[NEURAL_RADAR] Scan Failed", e);
            handleNext();
        } finally {
            setTimeout(() => setIsScanning(false), 800); // Minimum scan time for UX
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

    const pageTitle = currentAgent ? `${sanitizeValue(currentAgent.name)} - ${sanitizeValue(currentAgent.slogan)} | YouAgent` : 'YouAgent OS | Discover';
    const pageDesc = currentAgent ? sanitizeValue(currentAgent.description || currentAgent.slogan) : 'Discover the best AI agents.';
    const fallbackImage = "https://youagent.top/assets/default_og.png";
    const coverUrl = currentAgent ? sanitizeValue(currentAgent.assets.cover_url || fallbackImage) : fallbackImage;
    const proxiedCover = `/api/v1/img-proxy?url=${encodeURIComponent(coverUrl)}&w=800&q=80`;

    return (
        <div className="relative h-full w-full bg-black scroll-container">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDesc} />
                <link rel="canonical" href="https://youagent.top/discover" />
                <meta property="og:title" content={currentAgent ? `${sanitizeValue(currentAgent.name)} | YouAgent` : 'YouAgent OS'} />
                <meta property="og:description" content={pageDesc} />
                <meta property="og:image" content={proxiedCover} />
                <meta name="twitter:card" content="summary_large_image" />
            </Helmet>

            <div className={`absolute inset-0 z-0 transition-all duration-1000 ${isSystemCalculationMode ? 'grayscale brightness-50' : ''}`}>
                {currentAgent && (
                    <div
                        key={`bg-${currentAgent.id}`}
                        className="absolute inset-0 opacity-50 transition-opacity duration-1000"
                    >
                        <img
                            src={getBgImage(currentAgent.assets.video_poster)}
                            alt="bg"
                            className={`w-full h-full object-cover ${isMobile ? '' : 'blur-[2px]'}`}
                            loading={currentIndex > 3 ? "lazy" : "eager"}
                            decoding={currentIndex > 3 ? "async" : "sync"}
                            width="1920"
                            height="1080"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    </div>
                )}
            </div>

            <div className="absolute inset-0 z-10">
                {currentAgent && (
                    <div
                        key={`content-${currentAgent.id}`}
                        className="h-full w-full overflow-y-auto scrollbar-hide pb-20"
                    >
                        <ActionBar
                            agent={currentAgent}
                            onLike={() => onLike(currentAgent.id)}
                            onBookmark={() => onBookmark(currentAgent.id)}
                            onShare={() => onShare(currentAgent)}
                            onOpenComments={() => onEnterLounge(currentAgent)}
                            isLiked={userProfile.achievements.includes(`liked:${currentAgent.id}`)}
                            isBookmarked={userProfile.badges.includes(currentAgent.id)}
                        />
                        <ErrorBoundary fallback={<div className="h-full w-full flex items-center justify-center bg-black text-red-500 font-mono text-xs">CRITICAL_RENDER_FAILURE: {currentAgent.id}</div>}>
                            <TacticalHUD
                                agent={currentAgent}
                                onConnect={() => {
                                    if (currentAgent.connectivity?.try_url) {
                                        window.open(currentAgent.connectivity.try_url, '_blank');
                                    }
                                }}
                                onEnterLounge={() => onEnterLounge(currentAgent)}
                                onTagClick={onTagClick}
                                onLike={() => onLike(currentAgent.id)}
                                onBookmark={() => onBookmark(currentAgent.id)}
                                onShare={() => onShare(currentAgent)}
                                isLiked={userProfile.achievements.includes(`liked:${currentAgent.id}`)}
                                isBookmarked={userProfile.badges.includes(currentAgent.id)}
                                isForging={isForging}
                                isSpeaking={isSpeaking}
                                hideBackground={true}
                                nreProfile={nreProfile}
                                setNREProfile={setNREProfile}
                                onPrev={handlePrev}
                                onNext={handleNext}
                                prevAgentId={prevAgentId}
                                nextAgentId={nextAgentId}
                                onNeuralRadar={handleNeuralRadar}
                                isScanning={isScanning}
                            />
                        </ErrorBoundary>
                    </div>
                )}
            </div>
        </div>
    );
};
