import React, { useState, useRef, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Link, useNavigate } from 'react-router';
import { useArsenal } from '../../hooks/useArsenal';
import { Plus, Check } from 'lucide-react';
import { AgentMedia } from './AgentMedia';
import { AgentIntel } from './AgentIntel';

interface AgentCardProps {
    agent: AgentRegistryEntity;
    onClick?: () => void;
    priority?: boolean;
    validCategories?: string[];
}

export const AgentCard = React.memo(({ agent, onClick, priority, validCategories }: AgentCardProps) => {
    const { ref, inView } = useInView({ rootMargin: '200% 0px', triggerOnce: false });
    
    // Return a hollow shell if not in view and not priority
    if (!inView && !priority) {
        return <div ref={ref} className="w-full aspect-[4/3] sm:aspect-video bg-[#050505] rounded-xl border border-white/5" />;
    }

    return (
        <div ref={ref} className="h-full">
            <AgentCardContent agent={agent} onClick={onClick} priority={priority} validCategories={validCategories} />
        </div>
    );
});

const AgentCardContent = React.memo(({ agent, onClick, priority, validCategories }: AgentCardProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isYouTubeLoaded, setIsYouTubeLoaded] = useState(false);
    const [videoError, setVideoError] = useState(false);
    const navigate = useNavigate();
    const { isInArsenal, toggleArsenal } = useArsenal();
    const isIn = isMounted ? isInArsenal(agent.id) : false;

    const [isNavigating, setIsNavigating] = useState(false);

    useEffect(() => { setIsMounted(true); }, []);

    const handleNavigate = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        setIsNavigating(true);
        if (onClick) onClick();
        
        // Use viewTransition for zero-latency feel
        navigate(`/agent/${agent.slug || agent.id}`, { viewTransition: true });
    };

    const pricing = agent.pricing;
    const isOSS = pricing?.isOSS;
    
    let pricingTiers = pricing?.tiers || [];
    let pricingLabel = pricing?.model || null;
    let pricingDisplay = null;

    const displayUnits: string[] = [];

    if (isOSS) {
        displayUnits.push('Open Source');
    }

    if (pricingTiers.length > 0) {
        const hasFree = pricingTiers.some((t: any) => {
            const p = String(t.price || '').replace(/\$+/g, '$').toUpperCase();
            return p === '0' || p === 'FREE' || p === '$0';
        });
        
        if (hasFree) {
            displayUnits.push('Free');
        }

        pricingTiers.forEach((t: any) => {
            const priceStr = String(t.price || '').replace(/\$+/g, '$');
            const isFree = (priceStr === '0' || priceStr.toUpperCase() === 'FREE' || priceStr === '$0');
            if (!isFree) {
                let finalPrice = priceStr;
                if (!finalPrice.startsWith('$') && /^\d/.test(finalPrice)) {
                    finalPrice = '$' + finalPrice;
                }
                
                if (t.unit) {
                    finalPrice += `/${t.unit}`;
                }
                
                displayUnits.push(finalPrice);
            }
        });
    }

    if (displayUnits.length === 0 && pricingLabel) {
        displayUnits.push(pricingLabel);
    }

    if (displayUnits.length === 0) {
        pricingLabel = 'TBD';
        displayUnits.push('TBD');
    }

    if (displayUnits.length > 3) {
        pricingDisplay = displayUnits.slice(0, 3).join('   ') + '   ...';
    } else {
        pricingDisplay = displayUnits.join('   ');
    }

    // Defensive mapping for specs if not directly in AgentRegistryEntity
    // Assuming name might contain context info as a fallback
    const contextLabel = ((agent.name || '').match(/\d+[KkMm]/)?.[0] || '').toUpperCase() || null;
    const architectureLabel = (agent.name || '').toLowerCase().includes('moe') ? 'MoE' : ((agent.name || '').toLowerCase().includes('transformer') ? 'Transformer' : null);

    const videoUrl = agent.assets?.video_url || (agent as any).video_url;
    const hasVideo = !!videoUrl && !videoError;
    const isYouTube = !!videoUrl?.includes('youtube.com') || !!videoUrl?.includes('youtu.be');

    return (
        <div 
            className={`gpu-card gpu-accelerated group relative bg-[#050505] rounded-xl border border-white/5 overflow-hidden transition-[transform,opacity,border-color,box-shadow] duration-500 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col h-full cursor-pointer ${isNavigating ? 'opacity-50' : ''}`}
            onClick={() => handleNavigate()}
        >
            {/* Skeleton Flash Overlay */}
            {isNavigating && (
                <div className="absolute inset-0 z-[100] bg-cyan-500/10 animate-pulse flex items-center justify-center">
                    <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Tactical corner accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/0 group-hover:border-cyan-500/50 transition-colors duration-500 z-20"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/0 group-hover:border-cyan-500/50 transition-colors duration-500 z-20"></div>
            
            <div className="relative w-full aspect-video overflow-hidden" 
                onMouseEnter={() => {
                    if (hasVideo) {
                        setIsHovered(true);
                    }
                }} 
                onMouseLeave={() => {
                    if (hasVideo) {
                        setIsHovered(false);
                        setIsPlaying(false);
                        if (isYouTube) {
                            setIsYouTubeLoaded(false);
                        }
                    }
                }} 
            >
                <AgentMedia agent={agent} priority={priority} hasVideo={hasVideo} isYouTube={isYouTube} isHovered={isHovered} isYouTubeLoaded={isYouTubeLoaded} setIsYouTubeLoaded={setIsYouTubeLoaded} isPlaying={isPlaying} setIsPlaying={setIsPlaying} setVideoError={setVideoError} videoRef={videoRef} />
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleArsenal(agent.id); }} className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center border transition-colors duration-300 z-50 ${isIn ? 'bg-cyan-500 border-cyan-400 text-black' : 'bg-black/50 border-white/10 text-gray-400'}`}>
                    {isIn ? <Check size={14} /> : <Plus size={14} />}
                </button>
            </div>
            <div className="block p-4">
                <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-400 transition-colors truncate">
                    <Link 
                        to={`/agent/${agent.slug || agent.id}`} 
                        onClick={(e) => handleNavigate(e)} 
                        className="hover:underline" 
                        prefetch="intent"
                        viewTransition
                    >
                        {agent.name}
                    </Link>
                </h3>
                {agent.slogan && <p className="text-xs text-gray-300 line-clamp-1 mt-1">{agent.slogan}</p>}
                <AgentIntel 
                    agent={agent} 
                    pricingLabel={pricingLabel} 
                    pricingDisplay={pricingDisplay} 
                    contextLabel={contextLabel} 
                    architectureLabel={architectureLabel} 
                    validCategories={validCategories}
                />
            </div>
        </div>
    );
});
