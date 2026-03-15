import React from 'react';
import { Link } from 'react-router';
import { Heart, Bookmark, Share2, ExternalLink, ChevronUp, ChevronDown, MessageSquare, Users } from 'lucide-react';
import { m } from 'framer-motion';

interface ActionMatrixProps {
    onLike: () => void;
    onBookmark: () => void;
    onShare: () => void;
    onVisit: () => void;
    onEnterLounge: () => void;
    onOpenComments: () => void;
    isLiked: boolean;
    isBookmarked: boolean;
    prevAgentId?: string;
    nextAgentId?: string;
}

export const ActionMatrix: React.FC<ActionMatrixProps> = ({
    onLike, onBookmark, onShare, onVisit, onEnterLounge, onOpenComments, isLiked, isBookmarked, prevAgentId, nextAgentId
}) => {
    return (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-4">
            {/* Action Bar */}
            <div className="flex flex-col gap-3 bg-black/60 backdrop-blur-md border border-white/10 p-2 rounded-full">
                <button onClick={onLike} className={`p-3 rounded-full transition-all ${isLiked ? 'text-red-500' : 'text-white/70 hover:text-white'}`}>
                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                </button>
                <button onClick={onBookmark} className={`p-3 rounded-full transition-all ${isBookmarked ? 'text-yellow-500' : 'text-white/70 hover:text-white'}`}>
                    <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                </button>
                <button onClick={onOpenComments} className="p-3 rounded-full text-white/70 hover:text-white transition-all">
                    <MessageSquare size={20} />
                </button>
                <button onClick={onEnterLounge} className="p-3 rounded-full text-cyan-400 hover:text-cyan-300 transition-all">
                    <Users size={20} />
                </button>
                <button onClick={onShare} className="p-3 rounded-full text-white/70 hover:text-white transition-all">
                    <Share2 size={20} />
                </button>
                <button onClick={onVisit} className="p-3 rounded-full text-white/70 hover:text-white transition-all">
                    <ExternalLink size={20} />
                </button>
            </div>

            {/* Navigation Arrows */}
            <div className="flex flex-col gap-2">
                {prevAgentId && (
                    <Link to={`/agent/${prevAgentId}`} className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/70 hover:text-cyan-400 hover:border-cyan-400 transition-all">
                        <ChevronUp size={20} />
                    </Link>
                )}
                {nextAgentId && (
                    <Link to={`/agent/${nextAgentId}`} className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/70 hover:text-cyan-400 hover:border-cyan-400 transition-all">
                        <ChevronDown size={20} />
                    </Link>
                )}
            </div>
        </div>
    );
};
