/**
 * hooks/useUrlAgentSync.ts
 * Keeps activeAgentId in sync with the URL path (/agent/:slug).
 * Also handles slug→new agent injection when the agent isn't in the local list.
 * Extracted from App.tsx to isolate URL-driven side-effects.
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { Agent } from '../types';
import { dataService } from '../services/dataService';

interface UseUrlAgentSyncOptions {
    agents: Agent[];
    initializing: boolean;
    activeAgentId: string | null;
    setActiveAgentId: (id: string) => void;
    setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
}

export function useUrlAgentSync({
    agents, initializing, activeAgentId, setActiveAgentId, setAgents,
}: UseUrlAgentSyncOptions) {
    const location = useLocation();

    useEffect(() => {
        const path = location.pathname;
        if (!path.startsWith('/agent/')) return;

        const slug = path.split('/')[2];
        if (!slug || slug === activeAgentId) return;

        const agent = agents.find(a => a.id === slug || a.slug === slug);
        if (agent) {
            setActiveAgentId(agent.id);
            dataService.saveRecentlyViewed(agent);
        } else if (!initializing) {
            dataService.getAgentById(slug).then(fetched => {
                if (!fetched) return;
                setAgents(prev => {
                    if (prev.find((existing: Agent) => existing.id === fetched.id)) return prev;
                    return [fetched, ...prev];
                });
                setActiveAgentId(fetched.id);
                dataService.saveRecentlyViewed(fetched);
            });
        }
    }, [location.pathname, agents, initializing]);
}
