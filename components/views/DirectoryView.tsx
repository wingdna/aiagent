import React, { useState, useEffect } from 'react';
import { Agent } from '../../types';
import { dataService } from '../../services/dataService';
import { useUIStore } from '../../src/stores/useUIStore';

interface DirectoryViewProps {
    setActiveAgentId?: (id: string) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({ setActiveAgentId }) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const setCurrentView = useUIStore(state => state.setCurrentView);
    const BATCH_SIZE = 500;

    const fetchBatch = async (pageNum: number) => {
        try {
            if (pageNum === 0) setLoading(true);
            else setIsFetchingMore(true);

            const data = await dataService.getAgents(pageNum, BATCH_SIZE, 'ALL', 'name', 'asc');
            
            if (data.length < BATCH_SIZE) {
                setHasMore(false);
            }

            setAgents(prev => {
                const combined = pageNum === 0 ? data : [...prev, ...data];
                // Deduplicate by ID
                const unique = Array.from(new Map(combined.map(a => [a.id, a])).values());
                // Sort alphabetically
                return unique.sort((a, b) => {
                    const nameA = a.name || a.id;
                    const nameB = b.name || b.id;
                    return nameA.localeCompare(nameB);
                });
            });
        } catch (e) {
            console.error("Directory Fetch Error:", e);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        fetchBatch(0);
    }, []);

    const loadMore = () => {
        if (!isFetchingMore && hasMore) {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchBatch(nextPage);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-matrix-green p-8 font-mono">
                Loading Directory...
            </div>
        );
    }

    // Group by first letter
    const grouped = agents.reduce((acc, agent) => {
        const firstLetter = (agent.name || agent.id).charAt(0).toUpperCase();
        const key = /[A-Z]/.test(firstLetter) ? firstLetter : '#';
        if (!acc[key]) acc[key] = [];
        acc[key].push(agent);
        return acc;
    }, {} as Record<string, Agent[]>);

    const sortedKeys = Object.keys(grouped).sort((a, b) => {
        if (a === '#') return 1;
        if (b === '#') return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-16 font-mono">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-display font-bold text-matrix-green mb-4">YouAgent // Agent Directory</h1>
                <p className="text-gray-400 mb-8">
                    Complete index of all registered AI agents. 
                    <button onClick={() => setCurrentView('discover')} className="text-matrix-green hover:underline ml-4">Return to HUD</button>
                </p>

                <div className="space-y-12">
                    {sortedKeys.map(letter => (
                        <div key={letter} className="border-t border-gray-800 pt-6">
                            <h2 className="text-2xl font-bold text-matrix-green mb-4">{letter}</h2>
                            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {grouped[letter].map(agent => (
                                    <li key={agent.id}>
                                        <a 
                                            href={`/agent/${encodeURIComponent(agent.id)}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (setActiveAgentId) {
                                                    setActiveAgentId(agent.id);
                                                }
                                                setCurrentView('discover');
                                            }}
                                            className="text-gray-300 hover:text-white hover:underline block truncate"
                                            title={agent.description || agent.slogan}
                                        >
                                            {agent.name || agent.id}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {hasMore && (
                    <div className="mt-12 flex justify-center pb-20">
                        <button 
                            onClick={loadMore}
                            disabled={isFetchingMore}
                            className="px-6 py-3 border border-matrix-green text-matrix-green rounded hover:bg-matrix-green/10 transition-colors disabled:opacity-50"
                        >
                            {isFetchingMore ? 'LOADING...' : 'LOAD MORE AGENTS'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
