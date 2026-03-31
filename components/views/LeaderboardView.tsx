
import React, { useState, useEffect } from 'react';
import { m } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus, Filter, Activity, Star, Globe } from 'lucide-react';
import { Agent, AgentCategory } from '../../types';
import { dataService } from '../../services/dataService';
import { analyticsEngine } from '../../services/AnalyticsEngine';
import { getCategoryColor } from '../../utils';

interface LeaderboardViewProps {
    initialAgents?: Agent[];
    initialPrevRanks?: Record<string, number>;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ initialAgents = [], initialPrevRanks = {} }) => {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [loading, setLoading] = useState(initialAgents.length === 0);
    const [filter, setFilter] = useState<string>('ALL');
    const [prevRanks, setPrevRanks] = useState<Record<string, number>>(initialPrevRanks);

    useEffect(() => {
        if (initialAgents.length > 0) {
            setLoading(false);
            return;
        }
        const loadData = async () => {
            setLoading(true);
            // 1. Fetch Agents sorted by NRI (Limit 100)
            const allAgents = await dataService.getAgents(0, 100);
            const sorted = allAgents.sort((a, b) => (b.metrics?.hot_score || 0) - (a.metrics?.hot_score || 0));
            
            // 2. Fetch History for Trends
            const history = await analyticsEngine.getPreviousSnapshot();
            
            setAgents(sorted);
            setPrevRanks(history);
            setLoading(false);
        };
        loadData();
    }, [initialAgents]);

    const filteredAgents = filter === 'ALL' 
        ? agents 
        : agents.filter(a => a.category === filter);

    const getTrend = (id: string, currentRank: number) => {
        const prev = prevRanks[id];
        if (!prev) return <span className="text-cyan-400 text-[9px] font-bold">NEW</span>;
        const diff = prev - currentRank;
        if (diff > 0) return <div className="flex items-center text-cyan-400 text-[9px] font-bold"><TrendingUp size={10} /> {diff}</div>;
        if (diff < 0) return <div className="flex items-center text-red-500 text-[9px] font-bold"><TrendingDown size={10} /> {Math.abs(diff)}</div>;
        return <div className="flex items-center text-gray-600 text-[9px]"><Minus size={10} /></div>;
    };

    return (
        <div className="h-screen w-full bg-black flex flex-col pt-20 overflow-hidden relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
            
            {/* Header */}
            <div className="px-6 pb-4 border-b border-gray-900 flex justify-between items-end z-20 bg-black/80 backdrop-blur">
                <div>
                    <h2 className="text-3xl font-display font-black text-white flex items-center gap-3">
                        <Trophy className="text-yellow-500" /> GLOBAL_RANKINGS
                    </h2>
                    <div className="text-[10px] font-mono text-gray-500 mt-1 flex items-center gap-2">
                        DATA_SOURCE: MULTI-VECTOR TRIANGULATION (GitHub + Social + Arena)
                    </div>
                </div>
                
                {/* Filters */}
                <div className="flex gap-2">
                    {['ALL', 'TEXT_GEN', 'IMAGE_GEN', 'CODING', 'SECURITY'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-3 py-1.5 rounded border font-mono text-[10px] font-bold transition-all ${filter === cat ? 'bg-white text-black border-white' : 'bg-black border-gray-800 text-gray-500 hover:border-gray-600'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 px-2 md:px-6 py-2 border-b border-gray-800 text-[10px] font-mono text-gray-500 uppercase tracking-widest bg-gray-900/30">
                <div className="col-span-2 md:col-span-1 text-center">RANK</div>
                <div className="hidden md:block md:col-span-1 text-center">TREND</div>
                <div className="col-span-7 md:col-span-4">AGENT_ENTITY</div>
                <div className="hidden md:block md:col-span-2">CATEGORY</div>
                <div className="col-span-3 md:col-span-2 text-right">NRI_SCORE</div>
                <div className="hidden md:block md:col-span-2 text-right">WIN_RATE</div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {loading ? (
                    <div className="p-10 text-center text-cyan-400 font-mono animate-pulse">
                        CALCULATING NEURAL INDEX...
                    </div>
                ) : filteredAgents.map((agent, idx) => {
                    const rank = idx + 1;
                    const isTop3 = rank <= 3;
                    const glow = isTop3 ? (rank === 1 ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : rank === 2 ? 'border-gray-400/50' : 'border-orange-700/50') : 'border-transparent';
                    
                    return (
                        <m.div 
                            key={agent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`grid grid-cols-12 px-2 md:px-6 py-4 border-b border-gray-900 items-center hover:bg-gray-900/30 transition-colors group ${glow} border-l-4`}
                        >
                            <div className="col-span-2 md:col-span-1 text-center font-display font-bold text-lg text-white">
                                {isTop3 && <span className="mr-1 text-yellow-500">#</span>}{rank}
                            </div>
                            <div className="hidden md:flex md:col-span-1 justify-center">
                                {getTrend(agent.id, rank)}
                            </div>
                            <div className="col-span-7 md:col-span-4 flex items-center gap-2 md:gap-4">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded overflow-hidden border border-gray-800 relative group-hover:border-white transition-colors shrink-0">
                                    <img src={agent.video_poster} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors truncate">{agent.name}</div>
                                    <div className="text-[9px] text-gray-500 font-mono flex items-center gap-2 truncate">
                                        <span className="flex items-center gap-1"><Star size={8} /> {agent.external_stats?.github_stars || 0}</span>
                                        <span className="flex items-center gap-1"><Globe size={8} /> {agent.external_stats?.web_mentions || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="hidden md:block md:col-span-2">
                                <span className="text-[9px] px-2 py-1 rounded bg-gray-900 border border-gray-800 font-mono text-[var(--cat-color)]" style={{ '--cat-color': getCategoryColor(agent.category || '') } as any}>
                                    {agent.category}
                                </span>
                            </div>
                            <div className="col-span-3 md:col-span-2 text-right font-mono font-bold text-white text-base md:text-lg">
                                {agent.metrics?.hot_score?.toFixed(1) || '---'}
                            </div>
                            <div className="hidden md:block md:col-span-2 text-right font-mono text-xs text-gray-400">
                                {agent.stats && agent.stats.wins + agent.stats.losses > 0 
                                    ? `${((agent.stats.wins / (agent.stats.wins + agent.stats.losses)) * 100).toFixed(1)}%` 
                                    : 'N/A'}
                            </div>
                        </m.div>
                    );
                })}
            </div>
        </div>
    );
};
