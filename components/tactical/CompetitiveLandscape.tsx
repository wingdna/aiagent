import React from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Link } from 'react-router';
import { Swords, Zap, ChevronRight, Activity } from 'lucide-react';
import { getCategoryColor } from '../../utils';

interface CompetitiveLandscapeProps {
    agent: AgentRegistryEntity;
    competitors?: AgentRegistryEntity[];
}

export const CompetitiveLandscape: React.FC<CompetitiveLandscapeProps> = ({ agent, competitors = [] }) => {
    if (!competitors || competitors.length === 0) return null;

    return (
        <div className="mt-8 bg-black/20 border border-white/5 rounded-xl p-6 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2 text-[10px] font-mono text-amber-500 uppercase tracking-widest">
                    <Swords size={14} className="text-amber-500" />
                    <h3>COMPETITIVE_LANDSCAPE</h3>
                </div>
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    Sector: {agent.category || 'GENERAL'}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitors.map((competitor) => {
                    const competitorColor = getCategoryColor(competitor.category || 'TEXT_GEN');
                    const nriScore = competitor.metrics?.nri_score || 0;
                    
                    return (
                        <Link
                            key={competitor.id}
                            to={`/agent/${competitor.slug || competitor.id}`}
                            className="group relative flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all duration-300"
                        >
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <img
                                    src={competitor.assets?.cover_url || `https://picsum.photos/seed/${competitor.id}/100/100`}
                                    alt={competitor.name}
                                    className="w-full h-full object-cover rounded-md grayscale group-hover:grayscale-0 transition-all duration-500"
                                    referrerPolicy="no-referrer"
                                    loading="lazy"
                                    decoding="async"
                                />
                                <div 
                                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-black flex items-center justify-center"
                                    style={{ backgroundColor: competitorColor }}
                                >
                                    <Zap size={8} className="text-black fill-current" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                                        {competitor.name}
                                    </h4>
                                    <div className="flex items-center gap-1 text-[10px] font-mono text-gray-500">
                                        <Activity size={10} />
                                        <span>{nriScore}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-mono text-gray-500 uppercase tracking-tighter truncate">
                                        {competitor.slogan || competitor.category}
                                    </span>
                                </div>
                                
                                {/* Threat Level Bar */}
                                <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-amber-500/50 group-hover:bg-amber-500 transition-all duration-500"
                                        style={{ width: `${Math.min(100, (nriScore / 1000) * 100)}%` }}
                                    />
                                </div>
                            </div>

                            <ChevronRight size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                        </Link>
                    );
                })}
            </div>

            <div className="mt-6 flex items-center justify-center">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="px-4 text-[8px] font-mono text-gray-600 uppercase tracking-[0.3em]">
                    End of Sector Analysis
                </span>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
        </div>
    );
};
