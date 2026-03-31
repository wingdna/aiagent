import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Agent } from '../../types';
import { dataService } from '../../services/dataService';
import { Link } from 'react-router';

interface DirectoryViewProps {
    initialData?: Agent[];
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({ initialData = [] }) => {
    const [agents, setAgents] = useState<Agent[]>(initialData);
    const [loading, setLoading] = useState(initialData.length === 0);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(initialData.length >= 25);
    const observer = useRef<IntersectionObserver | null>(null);
    const loaderRef = useRef<HTMLDivElement | null>(null);

    const fetchAgents = useCallback(async (pageNum: number) => {
        // Skip fetching page 0 if we already have initialData
        if (pageNum === 0 && initialData.length > 0) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await dataService.getAgents(pageNum, 25, 'ALL', 'rank');
            if (data.length < 25) setHasMore(false);
            setAgents(prev => pageNum === 0 ? data : [...prev, ...data]);
        } catch (e) {
            console.error("Directory Fetch Error:", e);
        } finally {
            setLoading(false);
        }
    }, [initialData]);

    useEffect(() => {
        fetchAgents(0);
    }, [fetchAgents]);

    const lastAgentRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        if (page > 0) fetchAgents(page);
    }, [page, fetchAgents]);

    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono">
            <div className="max-w-6xl mx-auto">
                <header className="sticky top-0 bg-[#050505]/90 backdrop-blur-md z-10 p-6 border-b border-white/5">
                    <h1 className="text-3xl font-display font-bold text-cyan-400">YouAgent // Full Index</h1>
                    <p className="text-gray-500 text-sm mt-2">High-density neural agent registry.</p>
                </header>

                <div className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_4fr_1fr] gap-4 p-6 text-xs text-gray-500 uppercase tracking-widest border-b border-white/5 sticky top-[88px] bg-[#050505]/90 backdrop-blur-md z-10" role="row">
                    <div role="columnheader">Agent Entity</div>
                    <div role="columnheader" className="hidden md:block">Intelligence Summary</div>
                    <div className="text-right" role="columnheader">NRI Index</div>
                </div>

                <div className="divide-y divide-white/5" role="rowgroup">
                    {agents.map((agent, index) => (
                        <div 
                            key={agent.id}
                            ref={index === agents.length - 1 ? lastAgentRef : null}
                            className="grid grid-cols-[1fr_auto] md:grid-cols-[2fr_4fr_1fr] gap-4 p-4 items-center hover:bg-white/5 transition-colors"
                            role="row"
                        >
                            <Link to={`/agent/${agent.slug || agent.id}`} className="text-cyan-400 font-bold truncate" aria-label={`View details for ${agent.name}`}>
                                {agent.name}
                            </Link>
                            <div className="hidden md:block text-gray-400 truncate text-sm" title={agent.description || agent.slogan || ''}>
                                {agent.slogan || agent.description || 'No description available'}
                            </div>
                            <div className="text-right font-mono text-cyan-200">
                                {agent.metrics?.nri_score?.toFixed(2) || '0.00'}
                            </div>
                        </div>
                    ))}
                </div>

                {loading && (
                    <div className="p-8 text-center text-cyan-400 font-mono animate-pulse">
                        [ INGESTING_MORE_DATA... ]
                    </div>
                )}
                <div ref={loaderRef} />
            </div>
        </div>
    );
};
