import React from 'react';
import { Heart, Bookmark, Share2, MessageSquare, ExternalLink, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { Link } from 'react-router';
import { Agent } from '../../types';
import { useUIStore } from '../../stores/useUIStore';
import { useProfile } from '../../hooks/useProfile';

interface ActionBarProps {
  agent: Agent;
  prevAgentId?: string;
  nextAgentId?: string;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onOpenComments: () => void;
  isLiked: boolean;
  isBookmarked: boolean;
  onNext?: () => void;
  onPrev?: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({
  agent,
  prevAgentId,
  nextAgentId,
  onLike,
  onBookmark,
  onShare,
  onOpenComments,
  isLiked,
  isBookmarked,
  onNext,
  onPrev
}) => {
  const { isLoggedIn } = useProfile();
  const setShowLogin = useUIStore((s) => s.setShowLogin);

  const handleAuthAction = (action: () => void) => {
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }
    action();
  };

  const handleExternalLink = () => {
    const url = agent.connectivity?.try_url || agent.official_url;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed right-2 md:right-6 top-1/2 -translate-y-1/2 z-[100] scale-75 md:scale-100 origin-right w-[60px]">
      <div className="flex flex-col gap-6 p-4 bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-cyan-900/20 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]">
        {/* 区域 A：社交生态区 */}
        <div className="flex flex-col gap-6">
          <button aria-label={isLiked ? "Unlike agent" : "Like agent"} onClick={() => handleAuthAction(onLike)} className={`transition-colors ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-white'}`}>
            <Heart size={24} fill={isLiked ? "currentColor" : "none"} aria-hidden="true" />
          </button>
          <button aria-label={isBookmarked ? "Remove bookmark" : "Bookmark agent"} onClick={() => handleAuthAction(onBookmark)} className={`transition-colors ${isBookmarked ? 'text-yellow-500' : 'text-slate-400 hover:text-white'}`}>
            <Bookmark size={24} fill={isBookmarked ? "currentColor" : "none"} aria-hidden="true" />
          </button>
          <button aria-label="Share agent" onClick={onShare} className="text-slate-400 hover:text-white transition-colors">
            <Share2 size={24} aria-hidden="true" />
          </button>
          <button aria-label="Open comments" onClick={() => handleAuthAction(onOpenComments)} className="text-slate-400 hover:text-white transition-colors">
            <MessageSquare size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="h-[1px] w-full bg-white/10" aria-hidden="true" />

        {/* 区域 B：导航/行动区 */}
        <div className="flex flex-col gap-6">
          {(agent.connectivity?.try_url || agent.official_url) && (
            <button
              aria-label="Visit official website"
              onClick={handleExternalLink}
              className="text-cyan-400 hover:text-white transition-colors"
            >
              <ExternalLink size={24} aria-hidden="true" />
            </button>
          )}
          <Link to={`/agent/${agent.slug || agent.id}/lounge`} aria-label="Enter agent lounge" className="text-slate-400 hover:text-cyan-400 transition-colors">
            <Users size={24} aria-hidden="true" />
          </Link>
          <div className="flex flex-col gap-4">
            <button 
              aria-label="Previous agent"
              onClick={onPrev} 
              disabled={!prevAgentId}
              className={`transition-colors ${prevAgentId ? 'text-slate-400 hover:text-white' : 'text-slate-800 pointer-events-none'}`}
            >
              <ChevronUp size={24} aria-hidden="true" />
            </button>
            <button 
              aria-label="Next agent"
              onClick={onNext} 
              disabled={!nextAgentId}
              className={`transition-colors ${nextAgentId ? 'text-slate-400 hover:text-white' : 'text-slate-800 pointer-events-none'}`}
            >
              <ChevronDown size={24} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
