
import React from 'react';
import { Agent } from '../types';
import { Zap, Activity } from 'lucide-react';
import { optimizeImage } from '../utils';

interface AgentCardProps {
  agent: Agent;
  onClick: (agent: Agent) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onClick }) => {
  // ⚡ Protocol V20.0: Optimize Asset Delivery
  const posterUrl = optimizeImage(agent.video_poster, 600);

  return (
    <div 
      onClick={() => onClick(agent)}
      className="group relative bg-cyber-panel border border-cyber-dim rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full flex flex-col"
      style={{
        '--agent-color': agent.theme_color
      } as React.CSSProperties}
    >
      {/* Dynamic Hover Border */}
      <div className="absolute inset-0 border border-transparent group-hover:border-[var(--agent-color)] rounded-xl transition-colors duration-300 pointer-events-none z-10 opacity-50"></div>
      
      {/* Background/Poster Image */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-panel to-transparent z-10"></div>
        <img 
          src={posterUrl} 
          alt={agent.name} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute top-2 right-2 z-20 bg-cyber-black/80 backdrop-blur px-2 py-1 rounded text-[10px] font-mono border border-cyber-dim flex items-center gap-1 text-[var(--agent-color)]">
          <Activity className="w-3 h-3" />
          {agent.hot_score}% HOT
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1 relative z-20">
        <div className="mb-auto">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-display font-bold text-xl text-white group-hover:text-[var(--agent-color)] transition-colors">
              {agent.name}
            </h3>
          </div>
          <p className="text-sm font-mono text-gray-400 mb-4 h-10 line-clamp-2">
            "{agent.slogan}"
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(agent.capability_tags || []).slice(0, 3).map((cap, idx) => (
            <span 
              key={idx} 
              className="px-2 py-1 bg-cyber-dim border border-white/5 rounded text-[10px] text-gray-300 font-mono uppercase"
            >
              {cap}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-cyber-dim flex items-center justify-between mt-2">
           <span className="text-xs text-gray-500 font-mono uppercase">{agent.category.replace('_', ' ')}</span>
           <div className="opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
             <Zap className="w-4 h-4 text-[var(--agent-color)]" />
           </div>
        </div>
      </div>
    </div>
  );
};
