import { useState, useEffect, useRef, useCallback, useDeferredValue, useTransition, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useSemanticSearch } from './useSemanticSearch';
import { siliconFlowService } from '../services/siliconFlowService';
import { useNeuralSwitch } from './useNeuralSwitch';
import { useCommandRouter } from './useCommandRouter';
import { Agent, SwarmPlan, SwarmAgentRole } from '../types';
import { AgentRegistryEntity } from '../app/types/registry';
import { mapToRegistry } from '../utils/mapper';
import { useUserKeys } from './useUserKeys';
import { executeCommand as executeCliCommand, CommandAction, calculateMatchScore } from '../app/utils/cli-engine';
import { AGENTS_DB } from '../agents';

export interface TacticalLog {
    id: string;
    query: string;
    reasoning: string;
    content: string;
    isReasoning: boolean;
}

export interface SearchEngineHook {
    inputValue: string;
    setInputValue: React.Dispatch<React.SetStateAction<string>>;
    searchResults: any[];
    isSearching: boolean;
    tacticalLogs: TacticalLog[];
    executeCommand: (cmd: string) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    clearLogs: () => void;
    mode: 'SEARCH' | 'CHAT';
    setMode: (mode: 'SEARCH' | 'CHAT') => void;
    isFocused: boolean;
    setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
    isDrawerOpen: boolean;
    setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isSearchActive: boolean;
    setIsSearchActive: React.Dispatch<React.SetStateAction<boolean>>;
    inputRef: React.RefObject<HTMLInputElement>;
    error: string | null;
    isSystemOffline: boolean;
    tacticalVerdict: string | null;
    isVerdictProcessing: boolean;
    swarmPlan: SwarmPlan | null;
    cliResult: { type: 'intel' | 'find', data: any } | null;
    setCliResult: React.Dispatch<React.SetStateAction<{ type: 'intel' | 'find', data: any } | null>>;
    triggerSearch: (query?: string) => void;
    suggestions: any[];
    selectedIndex: number;
}

export const useSearchEngine = (
    initialValue: string = '',
    searchManifest: any[] = []
): SearchEngineHook => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState(initialValue);
    // [ZERO-LATENCY] Defer high-frequency input state to prevent render storms
    const deferredInputValue = useDeferredValue(inputValue);
    const [isPending, startTransition] = useTransition();

    const [tacticalLogs, setTacticalLogs] = useState<TacticalLog[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [swarmPlan, setSwarmPlan] = useState<SwarmPlan | null>(null);
    const [fatalError, setFatalError] = useState<Error | null>(null); // [BEAUTIFUL-DEATH] State to trigger ErrorBoundary
    const [cliResult, setCliResult] = useState<{ type: 'intel' | 'find', data: any } | null>(null);
    const { keys } = useUserKeys();

    // [BEAUTIFUL-DEATH] Trigger ErrorBoundary if fatal error exists
    if (fatalError) throw fatalError;

    const inputRef = useRef<HTMLInputElement>(null);
    
    // AbortController for cancelling pending requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // Semantic Search Hook
    const { results: rawResults, loading: isSearching, search, error, clearResults } = useSemanticSearch();
    const isSystemOffline = error === "SYSTEM_OFFLINE";
    
    // Command Router Hook
    const { 
        executeCommand: executeRouterCommand, 
        tacticalVerdict, 
        isAnalyzing: isVerdictProcessing, 
        filteredResults,
        analyzeAgents,
        clearVerdict
    } = useCommandRouter(rawResults, setTacticalLogs);

    // [ZERO-LATENCY] Use deferred value for expensive filtering
    const searchResults = filteredResults;

    // Neural Switch Hook
    const { response, mode, setMode, executeNeuralQuery } = useNeuralSwitch();
    
    // Use the provided searchManifest or fallback to AGENTS_DB
    const agentIndex = useMemo(() => {
        if (searchManifest && searchManifest.length > 0) {
            return searchManifest.map(a => ({
                id: a.i,
                name: a.nm,
                slug: a.s,
                nri_score: a.n,
                category: a.c
            }));
        }
        return AGENTS_DB.map(a => ({
            id: a.id,
            name: a.name,
            slug: a.slug || a.id,
            nri_score: a.metrics?.nri_score || a.nri_score || 0,
            category: a.category
        }));
    }, [searchManifest]);

    // [UNIFIED_SEARCH_MODAL_V5] Clear results and verdict on input change
    useEffect(() => {
        setIsSearchActive(false);
        clearResults();
        clearVerdict();
        setCliResult(null);
    }, [inputValue, clearResults, clearVerdict]);

    // Focus Persistence: Ensure input stays focused when isDrawerOpen changes to true
    useEffect(() => {
        if (isDrawerOpen && inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus();
        }
    }, [isDrawerOpen]);

    // [GLOBAL_CLI_TRIGGER] Listen for '/' or 'Alt+K' key to focus search
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const isAltK = e.altKey && e.code === 'KeyK';
            const isSlash = e.key === '/';
            
            // Only trigger if NOT already focused on our input
            if ((isSlash || isAltK) && document.activeElement !== inputRef.current) {
                // If it's a slash, and we are in some other input/textarea, don't intercept
                if (isSlash && (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA')) {
                    return;
                }

                e.preventDefault();
                setIsFocused(true);
                setInputValue('/');
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    // [SWARM_COMPOSITION] Logic
    const analyzeSwarmPotential = useCallback((agents: AgentRegistryEntity[], query: string) => {
        // 1. Detect Intent Complexity
        const isComplex = (query || '').length > 15 || ['create', 'make', 'build', 'generate', 'video', 'app'].some(k => (query || '').toLowerCase().includes(k));
        if (!isComplex || agents.length < 3) {
            setSwarmPlan(null);
            return;
        }

        // 2. Scan for Complementary Capabilities
        const roles: Record<string, AgentRegistryEntity[]> = {
            'BRAIN': agents.filter(a => a.capabilities?.some(t => ['llm', 'text', 'chat', 'reasoning'].includes((t || '').toLowerCase()))),
            'VISION': agents.filter(a => a.capabilities?.some(t => ['image', 'video', 'vision', 'diffusion'].includes((t || '').toLowerCase()))),
            'VOICE': agents.filter(a => a.capabilities?.some(t => ['audio', 'tts', 'music', 'speech'].includes((t || '').toLowerCase()))),
            'CODE': agents.filter(a => a.capabilities?.some(t => ['code', 'dev', 'programming'].includes((t || '').toLowerCase())))
        };

        // 3. Formulate Swarm
        // Scenario A: Multimedia Content (Brain + Vision + Voice)
        if (roles['BRAIN'].length > 0 && roles['VISION'].length > 0 && roles['VOICE'].length > 0) {
            const plan: SwarmPlan = {
                id: `swarm-${Date.now()}`,
                title: 'MULTIMEDIA_SYNTHESIS_CLUSTER',
                description: 'Detected intent for rich media generation. Deploying full-stack creative swarm.',
                complexity_score: 0.85,
                estimated_budget: '$0.05 / run',
                agents: [
                    { agent: roles['BRAIN'][0], role: 'DIRECTOR (Script/Prompt)', reason: 'High reasoning capability for orchestration.' },
                    { agent: roles['VISION'][0], role: 'VISUALIZER (Scene Gen)', reason: 'Top-tier diffusion model.' },
                    { agent: roles['VOICE'][0], role: 'NARRATOR (Audio)', reason: 'Low-latency TTS engine.' }
                ]
            };
            setSwarmPlan(plan);
            return;
        }

        // Scenario B: App Development (Brain + Code)
        if (roles['BRAIN'].length > 0 && roles['CODE'].length > 0) {
             const plan: SwarmPlan = {
                id: `swarm-${Date.now()}`,
                title: 'DEV_OPS_CLUSTER',
                description: 'Detected coding intent. Deploying pair-programming swarm.',
                complexity_score: 0.7,
                estimated_budget: '$0.02 / run',
                agents: [
                    { agent: roles['BRAIN'][0], role: 'ARCHITECT (Planning)', reason: 'Strong logic and planning skills.' },
                    { agent: roles['CODE'][0], role: 'ENGINEER (Implementation)', reason: 'Specialized coding model.' }
                ]
            };
            setSwarmPlan(plan);
            return;
        }

        setSwarmPlan(null);
    }, []);

    const executeCommand = useCallback(async (cmd: string) => {
        // 1. Try Router First (Legacy/Internal)
        const handled = executeRouterCommand(cmd);
        if (handled) return;

        // 2. Try CLI Engine (New)
        const action = await executeCliCommand(cmd);
        const newLogId = Date.now().toString();

        switch (action.type) {
            case 'redirect':
                setTacticalLogs(prev => [...prev, { 
                    id: newLogId, query: cmd, reasoning: `> Navigating to: ${action.payload}`, content: `> [REDIRECT] Executing neural jump.`, isReasoning: false 
                }].slice(-3));
                navigate(action.payload);
                setIsFocused(false);
                setIsDrawerOpen(false);
                break;
            case 'search':
                setInputValue(action.payload);
                break;
            case 'data':
                setTacticalLogs(prev => [...prev, { 
                    id: newLogId, query: cmd, reasoning: `> Fetching metrics...`, content: `> [DATA] ${JSON.stringify(action.payload, null, 2)}`, isReasoning: false 
                }].slice(-3));
                break;
            case 'help':
                setTacticalLogs(prev => [...prev, { 
                    id: newLogId, query: cmd, reasoning: `> Manual retrieved.`, content: `> [HELP]\n${action.payload}`, isReasoning: false 
                }].slice(-3));
                break;
            case 'error':
                setTacticalLogs(prev => [...prev, { 
                    id: newLogId, query: cmd, reasoning: `> [ERROR] Command failed.`, content: `> ${action.payload}`, isReasoning: false 
                }].slice(-3));
                break;
            case 'intel':
                setCliResult({ type: 'intel', data: action.payload });
                setTacticalLogs(prev => [...prev, { 
                    id: newLogId, query: cmd, reasoning: `> Fetching intel...`, content: `> [INTEL] Loaded intel for ${action.payload.name}`, isReasoning: false 
                }].slice(-3));
                break;
            case 'find':
                setCliResult({ type: 'find', data: action.payload });
                setTacticalLogs(prev => [...prev, { 
                    id: newLogId, query: cmd, reasoning: `> Executing parameterized filter...`, content: `> [FIND] Found ${action.payload.length} matching agents`, isReasoning: false 
                }].slice(-3));
                break;
        }
    }, [executeRouterCommand, navigate]);

    const triggerSearch = useCallback(async (query?: string) => {
        const activeQuery = query || inputValue;
        if (!activeQuery) return;
        setIsSearchActive(true);
        setIsDrawerOpen(true);
        
        if (activeQuery.startsWith('/')) {
            executeCommand(activeQuery);
            return;
        }

        if (mode === 'CHAT') {
            executeNeuralQuery(activeQuery, searchResults);
            return;
        }

        // 1. Run Semantic Search
        let results: AgentRegistryEntity[] = [];
        try {
            results = await search(activeQuery);
        } catch (e) {
            console.error("Search failed", e);
        }

        // [ANTI-HALLUCINATION GUARD]
        if (!results || results.length === 0) {
            setTacticalLogs(prev => {
                const newLogs = [...prev, { 
                    id: Date.now().toString(), 
                    query: activeQuery, 
                    reasoning: '> [SYSTEM_WARNING] Neural Scan Complete.\n> No matching nodes found in the current sector.',
                    content: '> Tactical Verdict: Search yielded zero results. R1 analysis aborted to prevent hallucination.',
                    isReasoning: false 
                }];
                return newLogs.slice(-3);
            });
            return; 
        }

        // If results found, proceed with Swarm Analysis
        if (!isVerdictProcessing) {
            analyzeAgents(results.slice(0, 3), "Based on the user's search, recommend the best agent among these top 3 options.");
        }
        
        // [MAIN_THREAD_LOCKDOWN] Offload expensive swarm calculation
        startTransition(() => {
            analyzeSwarmPotential(results, activeQuery);
        });
    }, [inputValue, mode, search, executeNeuralQuery, searchResults, isVerdictProcessing, analyzeAgents, analyzeSwarmPotential, executeCommand]);

    const [selectedIndex, setSelectedIndex] = useState(-1);

    const suggestions = useMemo(() => {
        if (!inputValue) return [];
        let query = inputValue.toLowerCase();
        let isGoCommand = false;
        let isIntelCommand = false;

        if (query.startsWith('/go ')) {
            query = query.replace('/go ', '').trim();
            isGoCommand = true;
        } else if (query.startsWith('/intel ')) {
            query = query.replace('/intel ', '').trim();
            isIntelCommand = true;
        } else if (query.startsWith('/')) {
            // Show command suggestions
            const commands = [
                { id: '/go', name: '/go [agent_id]', desc: 'Navigate to Agent' },
                { id: '/search', name: '/search [query]', desc: 'Force Web Search' },
                { id: '/data', name: '/data [query]', desc: 'Query Database' },
                { id: '/help', name: '/help', desc: 'Show Commands' },
                { id: '/intel', name: '/intel [query]', desc: 'Gather Intelligence' },
                { id: '/find', name: '/find [query]', desc: 'Find Agents' },
            ];
            return commands.filter(c => c.id.startsWith(query) || c.name.toLowerCase().includes(query)).map(c => ({
                id: c.id,
                name: c.name,
                desc: c.desc,
                isCommand: true
            }));
        }

        if (isGoCommand || isIntelCommand) {
            // Step 2: Weighted fuzzy filtering on local manifest index
            const scored = agentIndex.map(a => ({
                item: a,
                score: calculateMatchScore(a, query)
            })).filter(x => x.score > 0);

            return scored
                .sort((a, b) => b.score - a.score)
                .slice(0, 8)
                .map(x => {
                    const a = x.item;
                    return {
                        id: a.slug,
                        name: a.name,
                        category: a.category,
                        nri_score: a.nri_score,
                        isGoCommand,
                        isIntelCommand,
                        type: 'agent_suggestion',
                        // Step 3 format: >_ [Category] Name (nri: score)
                        displayLabel: `>_ [${a.category?.toUpperCase() || 'AGENT'}] ${a.name} (nri: ${(a.nri_score * 100).toFixed(1)})`
                    };
                });
        }

        const allItems: any[] = [];
        
        agentIndex.forEach(a => {
            allItems.push({ ...a, type: 'agent', isGoCommand });
        });

        if (!isGoCommand) {
            const categories = new Set<string>();
            const tags = new Set<string>();
            const badges = new Set<string>();

            agentIndex.forEach(a => {
                if (a.category) categories.add(a.category);
            });
            AGENTS_DB.forEach(a => {
                if (a.tags) a.tags.forEach(t => tags.add(t));
                if (a.tactical_badges) a.tactical_badges.forEach(b => badges.add(b));
            });

            categories.forEach(c => allItems.push({ id: `cat_${c}`, name: c, type: 'category', desc: 'Category' }));
            tags.forEach(t => allItems.push({ id: `tag_${t}`, name: t, type: 'tag', desc: 'Tag' }));
            badges.forEach(b => allItems.push({ id: `badge_${b}`, name: b, type: 'badge', desc: 'Badge' }));
        }

        if (!query) return allItems.slice(0, 5);

        const scoredItems = allItems.map(item => {
            let score = 0;
            const name = (item.name || '').toLowerCase();
            const id = (item.id || '').toLowerCase();
            
            // Exact match
            if (name === query || id === query) {
                score = 100;
            } 
            // Starts with
            else if (name.startsWith(query) || id.startsWith(query)) {
                score = 50;
            } 
            // Includes
            else if (name.includes(query) || id.includes(query)) {
                score = 10;
            }

            if (score > 0) {
                if (item.type === 'agent') {
                    if (item.nri_score) {
                        score += (item.nri_score * 10);
                    }
                    // Boost shorter names if they match to prioritize base models
                    score += (20 - Math.min(name.length, 20));
                }
            }

            return { item, score };
        }).filter(x => x.score > 0);

        scoredItems.sort((a, b) => b.score - a.score);

        return scoredItems.map(x => x.item).slice(0, 5);
    }, [inputValue]);

    useEffect(() => {
        setSelectedIndex(-1);
    }, [inputValue]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter' && inputValue) {
            e.preventDefault();
            
            let targetIndex = selectedIndex;
            if (targetIndex === -1 && suggestions.length > 0 && (inputValue.startsWith('/go ') || inputValue.startsWith('/intel '))) {
                targetIndex = 0;
            }

            if (targetIndex >= 0 && targetIndex < suggestions.length) {
                const item = suggestions[targetIndex] as any;
                const text = item.isCommand 
                    ? `${item.id} ` 
                    : (item.isGoCommand ? `/go ${item.id}` : (item.isIntelCommand ? `/intel ${item.id}` : item.name));
                
                setInputValue(text);
                if (!item.isCommand) {
                    if (item.isGoCommand) {
                        executeCommand(`/go ${item.id}`);
                    } else if (item.isIntelCommand) {
                        executeCommand(`/intel ${item.id}`);
                    } else {
                        triggerSearch(text);
                    }
                }
            } else {
                triggerSearch();
            }
        }
        if (e.key === 'Escape') {
            setIsFocused(false);
            setIsDrawerOpen(false);
            setIsSearchActive(false);
            setCliResult(null);
        }
    }, [inputValue, triggerSearch, suggestions, selectedIndex, executeCommand]);

    const clearLogs = useCallback(() => {
        setTacticalLogs([]);
        executeRouterCommand('/clear');
    }, [executeRouterCommand]);

    return {
        inputValue,
        setInputValue,
        searchResults,
        isSearching,
        tacticalLogs,
        executeCommand,
        handleKeyDown,
        clearLogs,
        mode,
        setMode,
        isFocused,
        setIsFocused,
        isDrawerOpen,
        setIsDrawerOpen,
        isSearchActive,
        setIsSearchActive,
        inputRef,
        error,
        isSystemOffline,
        tacticalVerdict,
        isVerdictProcessing,
        swarmPlan,
        cliResult,
        setCliResult,
        triggerSearch,
        suggestions,
        selectedIndex
    };
};
