import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Agent } from '../../types';
import { useNavigate, Link } from 'react-router';
import { useArsenal } from '../../hooks/useArsenal';
import { Plus, Check, ExternalLink } from 'lucide-react';

const NetworkIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect x="16" y="16" width="6" height="6" rx="1" />
        <rect x="2" y="16" width="6" height="6" rx="1" />
        <rect x="9" y="2" width="6" height="6" rx="1" />
        <path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" />
        <path d="M12 12V8" />
    </svg>
);

interface AgentCardProps {
    agent: Agent;
    onClick?: () => void;
    priority?: boolean;
}

export const AgentCard = React.memo(({ agent, onClick, priority = false }: AgentCardProps) => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const imgUrl = agent.video_poster || agent.cover_url;
    const { isInArsenal, toggleArsenal } = useArsenal();
    const isIn = isMounted ? isInArsenal(agent.id) : false;
    
    // Pricing Logic Extraction [PRICING_TAG_INJECTION]
    const pricing = (agent.pricing_model_json || agent.pricing_model) as any;
    const isOSS = pricing?.type === 'Open Source' || (pricing?.type === 'open_weights');
    
    let pricingLabel = 'UNKNOWN';
    if (isOSS) {
        pricingLabel = 'OSS';
    } else if (pricing?.tiers && pricing.tiers.length > 0) {
        const minPrice = Math.min(...pricing.tiers.map((t: any) => t.price || 0));
        pricingLabel = minPrice === 0 ? 'FREE TIER' : `FROM $${minPrice}`;
    } else if (pricing?.type) {
        pricingLabel = pricing.type.toUpperCase().replace('_', ' ');
    }

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) {
            onClick();
        }
        // Link handles navigation
    };

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = setTimeout(() => {
            setIsHovered(true);
        }, 150);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        setIsHovered(false);
    };

    useEffect(() => {
        setIsMounted(true);
        return () => {
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        };
    }, []);

    // [LCP_SURGICAL_STRIKE] Image Optimization
    const getResizedUrl = (url: string, width: number) => 
        `/api/v1/img-proxy?url=${encodeURIComponent(url)}&w=${width}&q=75`;

    const srcSet = imgUrl ? `
        ${getResizedUrl(imgUrl, 300)} 300w,
        ${getResizedUrl(imgUrl, 600)} 600w,
        ${getResizedUrl(imgUrl, 1200)} 1200w
    ` : undefined;

    return (
        <div 
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link
                to={`/agent/${agent.slug || agent.id}`}
                onClick={handleClick}
                className="block"
            >
                <div 
                    className="flex items-center justify-between p-3 rounded-lg bg-[#050505] border border-white/5 hover-card cursor-pointer group transition-all relative overflow-hidden shrink-0 z-10 hover:scale-[1.01] active:scale-[0.99]"
                >
                    {/* Aero-Obsidian Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent opacity-0 group-hover-opacity transition-opacity duration-500 pointer-events-none" />

                    <div className="flex items-center gap-4 relative z-10 overflow-hidden">
                        {/* Avatar / Poster */}
                        <div className="w-12 h-12 rounded-md bg-black/80 overflow-hidden border border-white/10 relative shrink-0 shadow-sm">
                            <div 
                                id={`fallback-${agent.id}`}
                                className="absolute inset-0 flex items-center justify-center bg-cyan-900/20 text-cyan-400 font-bold text-lg" 
                                style={{ display: imgUrl ? 'none' : 'flex' }}
                            >
                                {agent.name.charAt(0).toUpperCase()}
                            </div>
                            {imgUrl && (
                                <img 
                                    src={getResizedUrl(imgUrl, 300)}
                                    srcSet={srcSet}
                                    sizes="(max-width: 768px) 100vw, 300px"
                                    alt={agent.name} 
                                    className="w-full h-full object-cover opacity-90 group-hover-opacity transition-opacity" 
                                    loading={priority ? "eager" : "lazy"}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        const fallback = document.getElementById(`fallback-${agent.id}`);
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                            )}
                            
                            {/* Live Pulse Indicator (Small) */}
                            {agent.status === 'online' && (
                                <div className="absolute top-0.5 right-0.5 w-2 h-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 border border-black"></span>
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex flex-col justify-center min-w-0 flex-1">
                            <div className="text-sm font-bold text-gray-100 group-hover-text transition-colors truncate flex items-center gap-2" title={agent.name}>
                                {agent.name.length > 30 ? `${agent.name.substring(0, 30)}...` : agent.name}
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-0.5 truncate">
                                {agent.category || 'NEURAL_ENTITY'}
                            </div>
                        </div>
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex items-center gap-3 relative z-10 ml-4 shrink-0">
                        {/* URL Button */}
                        {agent.official_url && (
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(agent.official_url!, '_blank', 'noopener,noreferrer');
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center border border-white/10 text-gray-500 hover:border-cyan-400 hover:text-cyan-400 transition-all duration-300"
                            >
                                <ExternalLink size={12} />
                            </button>
                        )}

                        {/* Intel Badge (Pricing) */}
                        <div className="flex flex-col items-end gap-1">
                            <div className={`
                                px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border shadow-[0_0_10px_rgba(0,0,0,0.2)]
                                ${isOSS 
                                    ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_8px_rgba(74,222,128,0.1)]' 
                                    : 'bg-cyan-400/10 text-cyan-300 border-cyan-400/20 shadow-[0_0_8px_rgba(34,211,238,0.1)]'
                                }
                            `}>
                                {pricingLabel}
                            </div>
                            
                            {agent.similarity && (
                                <div className="text-[9px] font-mono text-gray-600 group-hover-text-sub transition-colors">
                                    {(agent.similarity * 100).toFixed(0)}% MATCH
                                </div>
                            )}
                        </div>

                        {/* Arsenal Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault(); // Prevent Link navigation
                                e.stopPropagation();
                                toggleArsenal(agent.id);
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all duration-300 ${
                                isIn 
                                ? 'bg-cyan-500 border-cyan-400 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                                : 'bg-white/5 border-white/10 text-gray-500 hover:border-cyan-400 hover:text-cyan-400'
                            }`}
                        >
                            {isIn ? (
                                <Check size={12} className="animate-in zoom-in duration-300" />
                            ) : (
                                <Plus size={12} className="animate-in zoom-in duration-300" />
                            )}
                        </button>
                    </div>
                </div>
            </Link>

            {/* Synaptic Visualizer - Related Neurons */}
            {isHovered && (
                <div
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-0 pointer-events-none animate-in fade-in duration-200"
                >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-px h-4 bg-gradient-to-b from-cyan-400/50 to-transparent" />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#050505] border border-cyan-400/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]">
                        <NetworkIcon className="w-3 h-3 text-cyan-400/70" />
                        <div className="flex gap-1">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="w-3 h-3 rounded-full bg-cyan-900/40 border border-cyan-400/30 flex items-center justify-center">
                                    <div className="w-1 h-1 rounded-full bg-cyan-400/50 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
