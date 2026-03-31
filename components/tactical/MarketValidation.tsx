import React from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Star, TrendingUp, Github } from 'lucide-react';

interface MarketValidationProps {
    agent: AgentRegistryEntity;
}

export const MarketValidation: React.FC<MarketValidationProps> = ({ agent }) => {
    const social = agent.social_proof || {};
    const external = agent.external_stats || {};
    const socials = agent.developer_socials || {};

    // Zero Null Policy: If no data, remove component
    const hasGithub = (external.github_stars || 0) > 0;
    const hasProductHunt = (external.product_hunt_votes || 0) > 0;
    const hasRating = (social.rating || 0) > 0;
    const hasReviews = (social.reviews_count || 0) > 0;
    
    if (!hasGithub && !hasProductHunt && !hasRating && !hasReviews) return null;

    return (
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 backdrop-blur-sm mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-yellow-500 uppercase tracking-widest border-b border-yellow-900/30 pb-2">
                <TrendingUp size={12} /> MARKET_VALIDATION
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* GITHUB STARS (Core KPI) */}
                {hasGithub && (
                    <a 
                        href={socials.github || '#'} 
                        target={socials.github ? "_blank" : undefined} 
                        rel={socials.github ? "noopener noreferrer" : undefined}
                        className="bg-white/5 border border-white/10 rounded-lg p-3 flex flex-col items-center justify-center hover:bg-white/10 transition-colors group cursor-pointer"
                    >
                        <div className="flex items-center gap-1.5 text-gray-400 mb-1 group-hover:text-white transition-colors">
                            <Github size={14} />
                            <span className="text-[9px] font-mono uppercase">STARS</span>
                        </div>
                        <span className="text-lg font-bold text-white font-mono">
                            {external.github_stars?.toLocaleString()}
                        </span>
                    </a>
                )}

                {/* PRODUCT HUNT */}
                {hasProductHunt && (
                    <div className="bg-[#da552f]/10 border border-[#da552f]/30 rounded-lg p-3 flex flex-col items-center justify-center hover:bg-[#da552f]/20 transition-colors cursor-default">
                        <div className="flex items-center gap-1.5 text-[#da552f] mb-1">
                            <span className="text-[9px] font-mono uppercase">PH VOTES</span>
                        </div>
                        <span className="text-lg font-bold text-white font-mono">
                            {external.product_hunt_votes?.toLocaleString()}
                        </span>
                    </div>
                )}

                {/* RATING */}
                {hasRating && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex flex-col items-center justify-center col-span-2 md:col-span-1">
                        <div className="flex items-center gap-1.5 text-yellow-500 mb-1">
                            <Star size={14} fill="currentColor" />
                            <span className="text-[9px] font-mono uppercase">RATING</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-white font-mono">{social.rating?.toFixed(1)}</span>
                            <span className="text-[10px] text-gray-500">/ 5.0</span>
                        </div>
                        {hasReviews && (
                            <span className="text-[9px] text-gray-500 mt-1">{social.reviews_count} Reviews</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
