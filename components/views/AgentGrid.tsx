
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import { Agent } from '../../types';
import { fetchAgentsPipeline } from '../../services/dataService';
import { getCategoryColor, optimizeImage } from '../../utils';
import { ErrorBoundary } from '../shared/ErrorBoundary';

// Inline SVGs for performance
const FlameIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>;
const TrophyIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const StarIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const ActivityIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const ZapIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const CpuIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="16" height="16" x="4" y="4" rx="2" ry="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>;
const ArrowLeftIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const RefreshCwIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;

interface AgentGridProps {
    filterTag: string;
    onClose: () => void;
    onSelectAgent: (agent: Agent) => void;
}

type SortKey = 'hot' | 'rank' | 'score' | 'speed' | 'creative' | 'logic';

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ElementType }[] = [
    { key: 'hot', label: 'HOT', icon: FlameIcon },
    { key: 'rank', label: 'RANK', icon: TrophyIcon },
    { key: 'score', label: 'SCORE', icon: StarIcon },
    { key: 'speed', label: 'VELOCITY', icon: ActivityIcon },
    { key: 'creative', label: 'INNOVATION', icon: ZapIcon },
    { key: 'logic', label: 'LOGIC', icon: CpuIcon },
];

export const AgentGrid: React.FC<AgentGridProps> = ({ filterTag, onClose, onSelectAgent }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<SortKey>('hot');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [scrollTop, setScrollTop] = useState(0);
    const [numCols, setNumCols] = useState(1);
    const [isMounted, setIsMounted] = useState(false);
    
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '400px',
    });

    useEffect(() => {
        const updateCols = () => {
            if (window.innerWidth >= 1280) setNumCols(4);
            else if (window.innerWidth >= 1024) setNumCols(3);
            else if (window.innerWidth >= 640) setNumCols(2);
            else setNumCols(1);
        };
        updateCols();
        setIsMounted(true);
        window.addEventListener('resize', updateCols);
        return () => window.removeEventListener('resize', updateCols);
    }, []);

    const agentsRef = useRef<Agent[]>([]);
    const loadingRef = useRef(false);
    const isFetchingMoreRef = useRef(false);
    const pageRef = useRef(0);
    const hasMoreRef = useRef(true);

    // Sync refs with state for internal logic
    useEffect(() => { agentsRef.current = agents; }, [agents]);
    useEffect(() => { loadingRef.current = loading; }, [loading]);
    useEffect(() => { isFetchingMoreRef.current = isFetchingMore; }, [isFetchingMore]);
    useEffect(() => { pageRef.current = page; }, [page]);
    useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

    const fetchAgents = useCallback(async (isRefresh = false, overridePage?: number) => {
        if (loadingRef.current && isRefresh) return;
        if (isFetchingMoreRef.current && !isRefresh) return;
        if (!hasMoreRef.current && !isRefresh) return;

        try {
            if (isRefresh) setLoading(true);
            else setIsFetchingMore(true);

            const currentPage = overridePage !== undefined ? overridePage : pageRef.current;
            const result = await fetchAgentsPipeline(
                isRefresh ? [] : agentsRef.current, 
                currentPage, 
                isRefresh, 
                filterTag, 
                sortBy
            );

            if (!result.error) {
                setAgents(result.agents as Agent[]);
                if (result.nextPage !== undefined) setPage(result.nextPage);
                if (result.hasMore !== undefined) setHasMore(result.hasMore);
            }
        } catch (err) {
            console.error('[AgentGrid] fetchAgents failed:', err);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    }, [filterTag, sortBy]); // ONLY depend on filterTag and sortBy
    
    useEffect(() => {
        setPage(0);
        setHasMore(true);
        fetchAgents(true, 0);
    }, [filterTag, sortBy]);

    useEffect(() => {
        if (inView && hasMore && !loading && !isFetchingMore) {
            fetchAgents(false);
        }
    }, [inView, hasMore, loading, isFetchingMore, fetchAgents]);

    const containerRef = useRef<HTMLDivElement>(null);

    // [ZERO-LATENCY] Throttled Scroll Handler (100ms)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        let throttleTimer: NodeJS.Timeout | null = null;

        const onScroll = () => {
            if (!throttleTimer) {
                throttleTimer = setTimeout(() => {
                    if (el) setScrollTop(el.scrollTop);
                    throttleTimer = null;
                }, 100);
            }
        };

        // Passive listener for main thread freedom
        el.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            el.removeEventListener('scroll', onScroll);
            if (throttleTimer) clearTimeout(throttleTimer);
        };
    }, []);

    const itemHeight = 260; // Approximate height + gap
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) * numCols);
    const endIndex = Math.min(agents.length, startIndex + 15); // Strict limit
    const visibleAgents = agents.slice(startIndex, endIndex);

    const totalHeight = Math.ceil(agents.length / numCols) * itemHeight;
    const paddingTop = Math.floor(startIndex / numCols) * itemHeight;

    return (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col pt-20">
            <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
            
            <div className="relative z-10 px-6 py-4 border-b border-gray-900 bg-[#050505e6] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                        <ArrowLeftIcon size={20} />
                    </button>
                    <div>
                        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
                            {filterTag === 'PERSONALIZED' ? (
                                <span className="text-cyan-400 tracking-widest">SYNAPTIC ECHO</span>
                            ) : (
                                <><span className="text-cyan-400">#</span>{filterTag}</>
                            )}
                        </h2>
                        <div className="text-[10px] font-mono text-gray-500">
                            {loading ? 'SYNCING_NEURAL_NODES...' : `${agents.length} ENTITIES FOUND`}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {SORT_OPTIONS.map((opt) => (
                        <button
                            key={opt.key}
                            onClick={() => setSortBy(opt.key)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded border text-[10px] font-mono font-bold transition-all uppercase ${
                                sortBy === opt.key 
                                    ? 'bg-cyan-400 text-black border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]' 
                                    : 'bg-black border-gray-800 text-gray-500 hover:text-white hover:border-gray-600'
                            }`}
                        >
                            <opt.icon size={12} />
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            <div 
                ref={containerRef}
                className="flex-1 overflow-y-auto p-6 custom-scrollbar relative" 
                // onScroll removed - handled by passive listener
            >
                {loading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <RefreshCwIcon size={32} className="text-cyan-400 animate-spin mb-4" />
                        <span className="text-xs font-mono text-cyan-400 animate-pulse">ESTABLISHING_UPLINK...</span>
                    </div>
                ) : (
                    <>
                        {filterTag === 'PERSONALIZED' && (
                             <div className="text-cyan-400 font-mono text-xs mb-4 animate-pulse">[NEURAL_SYNC_ESTABLISHED]: DISPLAYING_TAILORED_ASSETS_BASED_ON_YOUR_TELEMETRY</div>
                        )}
                        <div style={isMounted ? { height: totalHeight, paddingTop } : {}}>
                            <div 
                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20 animate-in fade-in duration-500"
                            >
                                {isMounted && visibleAgents.map((agent, i) => (
                                    <ErrorBoundary key={agent.id} fallback={<div className="h-32 bg-red-900/20 border border-red-500 rounded-xl flex items-center justify-center text-red-500 font-mono text-xs">RENDER_FAIL</div>}>
                                        <a
                                            href={`/agent/${agent.slug || agent.id}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onSelectAgent(agent);
                                            }}
                                            className="group relative bg-gray-900/40 border border-gray-800 rounded-xl overflow-hidden hover:border-cyan-500/50 hover:bg-gray-900/60 transition-all cursor-pointer h-full flex flex-col block"
                                            style={{ willChange: 'transform, opacity', contentVisibility: 'auto', containIntrinsicSize: '320px' }}
                                            aria-label={`View details for ${agent.name}`}
                                        >
                                            <div className="relative h-32 overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/90 z-10"></div>
                                                <img 
                                                    src={optimizeImage(agent.video_poster || agent.cover_url || '', 400)} 
                                                    alt={String(agent.name || 'Unknown Entity')} 
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100"
                                                    loading={i < 4 ? "eager" : "lazy"}
                                                    decoding={i < 4 ? "sync" : "async"}
                                                />
                                                <div className="absolute top-2 right-2 z-20">
                                                    <span className="px-2 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] font-mono text-cyan-400 font-bold">
                                                        {agent.metrics?.nri_score ? `NRI: ${Number(agent.metrics.nri_score).toFixed(1)}` : 'NRI: 0.0'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 flex flex-col flex-1">
                                                <div className="mb-auto">
                                                    <h3 className="text-sm font-display font-bold text-white group-hover:text-cyan-400 transition-colors mb-1 truncate">{String(agent.name || 'Unknown Entity')}</h3>
                                                    <p className="text-[10px] text-gray-500 line-clamp-2 font-mono h-8 leading-tight">
                                                        {String(agent.slogan || '')}
                                                    </p>
                                                </div>
                                                
                                                <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                                    <span className="text-[9px] font-mono text-gray-400 uppercase" style={{ color: getCategoryColor(String(agent.category || '')) }}>
                                                        {String(agent.category || 'UNKNOWN')}
                                                    </span>
                                                    <div className="flex gap-2 text-gray-600">
                                                        <span className="flex items-center gap-1 text-[9px]"><CpuIcon size={10} /> {agent?.metrics?.reasoning || 0}</span>
                                                        <span className="flex items-center gap-1 text-[9px]"><ActivityIcon size={10} /> {agent?.metrics?.speed || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="absolute inset-0 bg-white/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none z-0"></div>
                                        </a>
                                    </ErrorBoundary>
                                ))}
                            </div>
                        </div>
                    </>
                )}
                
                {hasMore && !loading && agents.length > 0 && (
                    <div ref={ref} className="w-full h-20 flex items-center justify-center mt-4 pb-10 shrink-0">
                        {isFetchingMore && (
                            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono">
                                <RefreshCwIcon size={14} className="animate-spin" />
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
