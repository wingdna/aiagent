
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Trophy, Star, Activity, Zap, Cpu, ArrowLeft, RefreshCw } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import { Agent } from '../../types';
import { dataService, fetchAgentsPipeline } from '../../services/dataService';
import { getCategoryColor } from '../../utils';

interface AgentGridProps {
    filterTag: string;
    onClose: () => void;
    onSelectAgent: (agent: Agent) => void;
}

type SortKey = 'hot' | 'rank' | 'score' | 'speed' | 'creative' | 'logic';

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ElementType }[] = [
    { key: 'hot', label: 'HOT', icon: Flame },
    { key: 'rank', label: 'RANK', icon: Trophy },
    { key: 'score', label: 'SCORE', icon: Star },
    { key: 'speed', label: 'VELOCITY', icon: Activity },
    { key: 'creative', label: 'INNOVATION', icon: Zap },
    { key: 'logic', label: 'LOGIC', icon: Cpu },
];

export const AgentGrid: React.FC<AgentGridProps> = ({ filterTag, onClose, onSelectAgent }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortKey>('hot');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px',
    });

    const fetchAgents = useCallback(async (isRefresh = false, overridePage?: number) => {
        if (loading && isRefresh) return;
        if (isFetchingMore && !isRefresh) return;
        if (!hasMore && !isRefresh) return;

        if (isRefresh) setLoading(true);
        else setIsFetchingMore(true);

        const currentPage = overridePage !== undefined ? overridePage : page;
        const result = await fetchAgentsPipeline(isRefresh ? [] : agents, currentPage, isRefresh, filterTag, sortBy);

        if (!result.error) {
            setAgents(result.agents as Agent[]);
            if (result.nextPage !== undefined) setPage(result.nextPage);
            if (result.hasMore !== undefined) setHasMore(result.hasMore);
        }

        setLoading(false);
        setIsFetchingMore(false);
    }, [filterTag, sortBy, agents, page, hasMore, loading, isFetchingMore]);
    
    // Initial fetch when filter or sort changes
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        fetchAgents(true, 0);
    }, [filterTag, sortBy]); // Removed fetchAgents from dependency to prevent loop, or we can use a ref

    // Fetch more when scrolled to bottom
    useEffect(() => {
        if (inView && hasMore && !loading && !isFetchingMore) {
            fetchAgents(false);
        }
    }, [inView, hasMore, loading, isFetchingMore, fetchAgents]);

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col pt-20">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
            
            {/* Header / Toolbar */}
            <div className="relative z-10 px-6 py-4 border-b border-gray-900 bg-black/80 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                            <span className="text-matrix-green">#</span>{filterTag}
                        </h2>
                        <div className="text-[10px] font-mono text-gray-500">
                            {loading ? 'SYNCING_NEURAL_NODES...' : `${agents.length} ENTITIES FOUND`}
                        </div>
                    </div>
                </div>

                {/* The Sorting Matrix */}
                <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setSortBy(opt.key)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] font-mono font-bold transition-all uppercase ${
                                sortBy === opt.key 
                                    ? 'bg-matrix-green text-black border-matrix-green shadow-[0_0_10px_rgba(0,255,65,0.3)]' 
                                    : 'bg-black border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                            }`}
                        >
                            <opt.icon size={12} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <RefreshCw size={32} className="text-matrix-green animate-spin mb-4" />
                        <span className="text-xs font-mono text-matrix-green animate-pulse">ESTABLISHING_UPLINK...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                        <AnimatePresence mode='popLayout'>
                            {agents.map((agent, i) => (
                                <motion.div
                                    key={agent.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2, delay: i * 0.05 }}
                                    onClick={() => onSelectAgent(agent)}
                                    className="group relative bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden hover:border-matrix-green/50 hover:bg-gray-900/60 transition-all cursor-pointer h-full flex flex-col"
                                >
                                    <div className="relative h-32 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/90 z-10"></div>
                                        <img 
                                            src={agent.video_poster} 
                                            alt={agent.name} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                                            // V19.0: LCP Eager Loading for first 4 items
                                            loading={i < 4 ? "eager" : "lazy"}
                                            // @ts-ignore
                                            fetchpriority={i < 4 ? "high" : "auto"} 
                                        />
                                        <div className="absolute top-2 right-2 z-20">
                                            <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] font-mono text-matrix-green font-bold backdrop-blur">
                                                {agent.nri_score ? `NRI: ${agent.nri_score.toFixed(0)}` : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 flex flex-col flex-1">
                                        <div className="mb-auto">
                                            <h3 className="text-sm font-display font-bold text-white group-hover:text-matrix-green transition-colors mb-1 truncate">{agent.name}</h3>
                                            <p className="text-[10px] text-gray-500 line-clamp-2 font-mono h-8 leading-tight">
                                                {agent.slogan}
                                            </p>
                                        </div>
                                        
                                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                            <span className="text-[9px] font-mono text-gray-400 uppercase" style={{ color: getCategoryColor(agent.category) }}>
                                                {agent.category}
                                            </span>
                                            <div className="flex gap-2 text-gray-600">
                                                <span className="flex items-center gap-1 text-[9px]"><Cpu size={10} /> {agent.metrics?.reasoning || 0}</span>
                                                <span className="flex items-center gap-1 text-[9px]"><Activity size={10} /> {agent.metrics?.speed || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Hover Scanline */}
                                    <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none z-0"></div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
                
                {/* Infinite Scroll Trigger */}
                {hasMore && !loading && agents.length > 0 && (
                    <div ref={ref} className="w-full h-20 flex items-center justify-center mt-4 pb-10 shrink-0">
                        {isFetchingMore && (
                            <div className="flex items-center gap-2 text-matrix-green text-xs font-mono">
                                <RefreshCw size={14} className="animate-spin" />
                                <span>LOADING_MORE_NODES...</span>
                            </div>
                        )}
                    </div>
                )}
                
                {!loading && agents.length === 0 && (
                    <div className="h-full flex items-center justify-center text-gray-600 font-mono text-xs">
                        [ NO_AGENTS_DETECTED_IN_SECTOR ]
                    </div>
                )}
            </div>
        </div>
    );
};
