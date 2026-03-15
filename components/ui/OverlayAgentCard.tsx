import React from 'react';
import { Link } from 'react-router';
import { Agent } from '../../types';
import { optimizeImage } from '../../utils';

interface OverlayAgentCardProps {
    agent: Agent;
    className?: string;
}

export const OverlayAgentCard: React.FC<OverlayAgentCardProps> = ({ agent, className = '' }) => {
    return (
        <Link
            to={`/agent/${agent.slug || agent.id}`}
            title={agent.name}
            className={`relative rounded-lg overflow-hidden group cursor-pointer border border-white/10 hover:border-cyan-500/50 transition-all block ${className}`}
        >
            {/* Background Image with Fallback */}
            <img
                src={optimizeImage(agent.cover_url || agent.video_poster || '', 300)}
                onError={(e) => { e.currentTarget.src = '/assets/default_placeholder.png'; }}
                alt={agent.name}
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity grayscale group-hover:grayscale-0"
            />

            {/* Gradient Mask */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

            {/* Text Overlay */}
            <div className="absolute bottom-2 left-2 right-2 flex flex-col">
                <span className="text-white text-xs font-bold truncate font-display">{agent.name}</span>
                <div className="flex justify-between items-center mt-0.5">
                    <span className="text-[8px] font-mono text-gray-400 uppercase">{agent.category || 'UNIT'}</span>
                    <span className="text-cyan-400 text-[9px] font-mono">NRI: {agent.nri_score?.toFixed(0) ?? agent.metrics?.nri_score?.toFixed(0) ?? '--'}</span>
                </div>
            </div>
        </Link>
    );
};
