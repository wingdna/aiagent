import React from 'react';
import { Link } from 'react-router';
import { AgentRegistryEntity } from '../../app/types/registry';
import { optimizeImage } from '../../utils';

import { extractYoutubeId } from '../../utils/videoUtils';

interface OverlayAgentCardProps {
    agent: AgentRegistryEntity;
    className?: string;
}

export const OverlayAgentCard: React.FC<OverlayAgentCardProps> = ({ agent, className = '' }) => {
    const videoId = extractYoutubeId(agent.assets.video_url);
    const youtubeThumbnail = videoId ? `https://i.ytimg.com/vi_webp/${videoId}/maxresdefault.webp` : null;
    const rawCoverUrl = agent.assets.cover_url || youtubeThumbnail;
    const finalSafeCoverUrl = rawCoverUrl ? (rawCoverUrl.includes('img.youtube.com') || rawCoverUrl.includes('i.ytimg.com') ? rawCoverUrl : optimizeImage(rawCoverUrl, 300)) : null;
    const agentUrl = `/agent/${agent.slug || agent.id}`;

    return (
        <div className={`relative rounded-lg overflow-hidden group border border-white/10 hover:border-cyan-500/50 transition-colors ${className}`}>
            {/* Background Image with Fallback */}
            <Link to={agentUrl} tabIndex={-1} aria-hidden="true" className="absolute inset-0 block bg-[#050505]">
                {finalSafeCoverUrl ? (
                    <img
                        src={finalSafeCoverUrl}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src.includes('maxresdefault.webp') && videoId) {
                                target.src = `https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp`;
                            } else if (target.src.includes('hqdefault.webp') && videoId) {
                                target.src = `https://i.ytimg.com/vi_webp/${videoId}/mqdefault.webp`;
                            } else {
                                target.style.display = 'none';
                            }
                        }}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity grayscale group-hover:grayscale-0"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#0a0a0a] to-[#111] flex flex-col items-center justify-center z-10 p-2 text-center border border-white/5 opacity-60 group-hover:opacity-40 transition-opacity">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1),transparent_70%)] pointer-events-none"></div>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 font-display text-lg font-black tracking-tight leading-tight drop-shadow-[0_0_10px_rgba(34,211,238,0.3)] relative z-20">
                            {agent.name.toUpperCase()}
                        </span>
                    </div>
                )}
            </Link>

            {/* Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            {/* Text Overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex flex-col pointer-events-none">
                <h3 className="text-white text-xs font-bold truncate font-display pointer-events-auto">
                    <Link to={agentUrl} title={agent.name} className="hover:text-cyan-400 transition-colors">
                        {agent.name}
                    </Link>
                </h3>
                <div className="flex justify-between items-center mt-0.5">
                    <Link to={`/?category=${encodeURIComponent(agent.category || 'ALL')}`} className="text-[8px] font-mono text-gray-400 uppercase hover:text-cyan-400 pointer-events-auto">
                        {agent.category || 'UNIT'}
                    </Link>
                    <span className="text-cyan-400 text-[9px] font-mono">NRI: {agent.metrics?.nri_score?.toFixed(0) ?? '--'}</span>
                </div>
                {((agent.tags && agent.tags.length > 0) || (agent.capabilities && agent.capabilities.length > 0)) && (
                    <div className="flex flex-wrap gap-1 mt-1 pointer-events-auto">
                        {Array.from(new Set([...(agent.tags || []), ...(agent.capabilities || [])]))
                            .filter(tag => tag && tag !== 'NEW_DISCOVERY')
                            .slice(0, 3)
                            .map((tag, idx) => (
                                <Link 
                                    key={idx}
                                    to={`/?category=${encodeURIComponent(tag)}`}
                                    className="text-[7px] font-mono font-bold px-1 py-0.2 rounded-full bg-white/[0.05] border border-white/[0.1] text-white/40 hover:text-cyan-400 hover:border-cyan-400/30 transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    #{tag.toUpperCase()}
                                </Link>
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    );
};
