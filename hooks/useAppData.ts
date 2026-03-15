import { useState, useEffect, useCallback, startTransition } from 'react';
import { Agent } from '../types';
import { dataService } from '../services/dataService';
import { useUIStore, UIState } from '../stores/useUIStore';

const BATCH_SIZE = 12;

export interface AppDataState {
    agents: Agent[];
    setAgents: React.Dispatch<React.SetStateAction<Agent[]>>;
    initializing: boolean;
    page: number;
    hasMore: boolean;
    isFetchingMore: boolean;
    loadNextBatch: () => Promise<void>;
}

/**
 * Centralizes all agent data-loading logic previously scattered across App.tsx.
 * Handles: localStorage time-travel cache, network hydration, pagination,
 * URL-based agent routing, and the Golden Gate failsafe unlock.
 */
export const useAppData = (initialAgents: Agent[] = []): AppDataState => {
    const [agents, setAgents] = useState<Agent[]>(initialAgents);
    const [initializing, setInitializing] = useState(initialAgents.length === 0);
    const [page, setPage] = useState(initialAgents.length > 0 ? 1 : 0);
    const [hasMore, setHasMore] = useState(initialAgents.length >= BATCH_SIZE);
    const [isFetchingMore, setIsFetchingMore] = useState(false);

    const setActiveAgentId = useUIStore((s: UIState) => s.setActiveAgentId);

    // ─── Pagination: Load Next Batch ─────────────────────────────────────────
    const loadNextBatch = useCallback(async () => {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);
        try {
            const nextBatch = await dataService.getAgents(page, BATCH_SIZE);
            if (nextBatch.length === 0) {
                setHasMore(false);
            } else {
                setAgents(prev => {
                    const merged = [...prev, ...nextBatch];
                    return Array.from(
                        new Map(merged.filter(a => a && a.id).map(item => [item.id, item])).values()
                    );
                });
                setPage(prev => prev + 1);
                if (nextBatch.length < BATCH_SIZE) setHasMore(false);
            }
        } catch (e) {
            console.error('[useAppData] Batch load failed:', e);
        } finally {
            setIsFetchingMore(false);
        }
    }, [isFetchingMore, hasMore, page]);

    // ─── Initial Hydration ────────────────────────────────────────────────────
    useEffect(() => {
        const initData = async () => {
            if (initialAgents.length > 0) {
                // If we have SSR data, we just need to handle URL routing for activeAgentId
                const pathParts = window.location.pathname.split('/');
                if (pathParts[1] === 'agent' && pathParts[2]) {
                    const slug = pathParts[2];
                    let targetAgent = initialAgents.find(a => a.id === slug || a.slug === slug);
                    if (!targetAgent) {
                        try {
                            const specificAgent = await dataService.getAgentById(slug);
                            if (specificAgent && specificAgent.id) {
                                targetAgent = specificAgent;
                                setAgents(prev => {
                                    const newAgents = [specificAgent, ...prev];
                                    return Array.from(new Map(newAgents.map(a => [a.id, a])).values());
                                });
                            }
                        } catch (e) {
                            console.warn('[useAppData] Failed to fetch specific agent from URL', e);
                        }
                    }
                    if (targetAgent) startTransition(() => setActiveAgentId(targetAgent.id));
                }
                setInitializing(false);
                return;
            }

            startTransition(() => setPage(0));
            let fetchedAgents: Agent[] = [];

            // 1. TIME TRAVEL: Instant render from localStorage
            try {
                const localCache = localStorage.getItem('sys_agent_cache');
                if (localCache) {
                    const parsed = JSON.parse(localCache);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log('[useAppData] Hydrating from cache:', parsed.length);
                        startTransition(() => {
                            setAgents(parsed);
                            setInitializing(false);
                        });
                    }
                }
            } catch (e) {
                console.warn('[useAppData] Cache corrupted, clearing.', e);
                try { localStorage.removeItem('sys_agent_cache'); } catch (_) { }
            }

            try {
                console.log('[useAppData] Starting network sync...');
                // 2. NETWORK SYNC: Edge preload → fallback to service
                if ((window as any).__INITIAL_DATA__) {
                    try {
                        const preloadPromise = (window as any).__INITIAL_DATA__;
                        console.log('[useAppData] Found preload data promise');
                        (window as any).__INITIAL_DATA__ = null;
                        fetchedAgents = await preloadPromise;
                        console.log('[useAppData] Preload data resolved:', fetchedAgents?.length);
                        if (!fetchedAgents || fetchedAgents.length === 0) throw new Error('Empty Preload');
                    } catch (e) {
                        console.warn('[useAppData] Preload miss or error, falling back to service:', e);
                        fetchedAgents = await dataService.getAgents(0, BATCH_SIZE);
                    }
                } else {
                    console.log('[useAppData] No preload data, fetching from service...');
                    fetchedAgents = await dataService.getAgents(0, BATCH_SIZE);
                }

                // 3. UPDATE STATE & PERSIST
                if (fetchedAgents && fetchedAgents.length > 0) {
                    console.log('[useAppData] Fetched agents:', fetchedAgents.length);
                    const safeAgents = fetchedAgents.filter(a => a && a.id);
                    const uniqueAgents = Array.from(new Map(safeAgents.map(a => [a.id, a])).values());

                    // ROUTING RESCUE: handle direct /agent/:slug URL navigation
                    const pathParts = window.location.pathname.split('/');
                    if (pathParts[1] === 'agent' && pathParts[2]) {
                        const slug = pathParts[2];
                        let targetAgent = uniqueAgents.find(a => a.id === slug || a.slug === slug);
                        if (!targetAgent) {
                            try {
                                const specificAgent = await dataService.getAgentById(slug);
                                if (specificAgent && specificAgent.id) {
                                    targetAgent = specificAgent;
                                    uniqueAgents.unshift(specificAgent);
                                }
                            } catch (e) {
                                console.warn('[useAppData] Failed to fetch specific agent from URL', e);
                            }
                        }
                        if (targetAgent) startTransition(() => setActiveAgentId(targetAgent.id));
                    }

                    startTransition(() => {
                        setAgents(uniqueAgents);
                        setPage(1);
                        if (fetchedAgents.length < BATCH_SIZE) setHasMore(false);
                    });
                    try {
                        // Store only top 10 to prevent QuotaExceededError
                        localStorage.setItem('sys_agent_cache', JSON.stringify(uniqueAgents.slice(0, 10)));
                    } catch (e) {
                        try { localStorage.removeItem('sys_agent_cache'); } catch (_) { }
                    }
                }

            } catch (e: any) {
                // ⛑️ GOLDEN GATE FAILSAFE: always release the loading lock
                console.error('[useAppData] Critical load failure — forcing UI unlock:', e?.message || e);
            } finally {
                console.log('[useAppData] Initialization complete, setting initializing to false');
                setInitializing(false);
            }
        };

        initData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { agents, setAgents, initializing, page, hasMore, isFetchingMore, loadNextBatch };
};
