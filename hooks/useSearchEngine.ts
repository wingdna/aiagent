import { useState, useEffect, useRef, useCallback, useDeferredValue, useTransition } from 'react';
import { useSemanticSearch } from './useSemanticSearch';
import { siliconFlowService } from '../services/siliconFlowService';
import { useNeuralSwitch } from './useNeuralSwitch';
import { useCommandRouter } from './useCommandRouter';
import { Agent, SwarmPlan, SwarmAgentRole } from '../types';
import { useUserKeys } from './useUserKeys';

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
    searchResults: Agent[];
    isSearching: boolean;
    tacticalLogs: TacticalLog[];
    executeCommand: (cmd: string) => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    clearLogs: () => void;
    mode: 'SEARCH' | 'CHAT';
    setMode: (mode: 'SEARCH' | 'CHAT') => void;
    isFocused: boolean;
    setIsFocused: React.Dispatch<React.SetStateAction<boolean>>;
    inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>;
    error: string | null;
    isSystemOffline: boolean;
    tacticalVerdict: string | null;
    isVerdictProcessing: boolean;
    swarmPlan: SwarmPlan | null;
}

export const useSearchEngine = (
    initialValue: string = ''
): SearchEngineHook => {
    const [inputValue, setInputValue] = useState(initialValue);
    // [ZERO-LATENCY] Defer high-frequency input state to prevent render storms
    const deferredInputValue = useDeferredValue(inputValue);
    const [isPending, startTransition] = useTransition();

    const [tacticalLogs, setTacticalLogs] = useState<TacticalLog[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const [swarmPlan, setSwarmPlan] = useState<SwarmPlan | null>(null);
    const [fatalError, setFatalError] = useState<Error | null>(null); // [BEAUTIFUL-DEATH] State to trigger ErrorBoundary
    const { keys } = useUserKeys();

    // [BEAUTIFUL-DEATH] Trigger ErrorBoundary if fatal error exists
    if (fatalError) throw fatalError;

    const inputRef = useRef<HTMLTextAreaElement>(null);
    
    // AbortController for cancelling pending requests
    const abortControllerRef = useRef<AbortController | null>(null);

    // Semantic Search Hook
    const { results: rawResults, loading: isSearching, search, error } = useSemanticSearch();
    const isSystemOffline = error === "SYSTEM_OFFLINE";
    
    // Command Router Hook
    const { 
        executeCommand: executeRouterCommand, 
        tacticalVerdict, 
        isAnalyzing: isVerdictProcessing, 
        filteredResults,
        analyzeAgents
    } = useCommandRouter(rawResults, setTacticalLogs);

    // [ZERO-LATENCY] Use deferred value for expensive filtering
    const searchResults = deferredInputValue.startsWith('/') 
        ? filteredResults.filter(agent => 
            agent.name.toLowerCase().includes(deferredInputValue.slice(1).toLowerCase()) ||
            agent.description?.toLowerCase().includes(deferredInputValue.slice(1).toLowerCase()) ||
            agent.category?.toLowerCase().includes(deferredInputValue.slice(1).toLowerCase())
          )
        : filteredResults;

    // Neural Switch Hook
    const { mode, setMode, executeNeuralQuery } = useNeuralSwitch();

    // [SWARM_COMPOSITION] Logic
    const analyzeSwarmPotential = useCallback((agents: Agent[], query: string) => {
        // 1. Detect Intent Complexity
        const isComplex = query.length > 15 || ['create', 'make', 'build', 'generate', 'video', 'app'].some(k => query.toLowerCase().includes(k));
        if (!isComplex || agents.length < 3) {
            setSwarmPlan(null);
            return;
        }

        // 2. Scan for Complementary Capabilities
        const roles: Record<string, Agent[]> = {
            'BRAIN': agents.filter(a => a.tags?.some(t => ['llm', 'text', 'chat', 'reasoning'].includes(t.toLowerCase()))),
            'VISION': agents.filter(a => a.tags?.some(t => ['image', 'video', 'vision', 'diffusion'].includes(t.toLowerCase()))),
            'VOICE': agents.filter(a => a.tags?.some(t => ['audio', 'tts', 'music', 'speech'].includes(t.toLowerCase()))),
            'CODE': agents.filter(a => a.tags?.some(t => ['code', 'dev', 'programming'].includes(t.toLowerCase())))
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

    // Debounce Logic with Deferred Value
    useEffect(() => {
        if (!deferredInputValue) {
            setMode('SEARCH');
            setSwarmPlan(null);
            return;
        }

        if (deferredInputValue.startsWith('/')) {
            return;
        }
        
        const timeoutId = setTimeout(async () => {
            // 1. Run Semantic Search
            let results: Agent[] = [];
            try {
                results = await search(deferredInputValue);
            } catch (e) {
                console.error("Search failed", e);
            }

            // [ANTI-HALLUCINATION GUARD]
            // If no agents found, strictly forbid requesting R1 analysis!
            if (!results || results.length === 0) {
                setTacticalLogs(prev => {
                    const newLogs = [...prev, { 
                        id: Date.now().toString(), 
                        query: deferredInputValue, 
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
                analyzeSwarmPotential(results, deferredInputValue);
            });

        }, 500); // 500ms debounce

        return () => {
            clearTimeout(timeoutId);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [deferredInputValue, search, setMode, analyzeAgents, analyzeSwarmPotential, keys.siliconflow]);

    const executeCommand = useCallback((cmd: string) => {
        const handled = executeRouterCommand(cmd);
        if (!handled) {
            const newLogId = Date.now().toString();
            setTacticalLogs(prev => {
                const newLogs = [...prev, { 
                    id: newLogId, 
                    query: cmd, 
                    reasoning: `> Executing command: ${cmd}`,
                    content: `> [OK] Command processed.`, 
                    isReasoning: false 
                }];
                return newLogs.slice(-3);
            });
        }
    }, [executeRouterCommand]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && inputValue) {
            e.preventDefault();
            if (inputValue.startsWith('/')) {
                executeCommand(inputValue);
                setTimeout(() => setInputValue(''), 1000);
            } else if (mode === 'CHAT') {
                executeNeuralQuery(inputValue, searchResults);
            }
        }
        if (e.key === 'Escape') {
            setIsFocused(false);
        }
    }, [inputValue, mode, searchResults, executeCommand, executeNeuralQuery]);

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
        inputRef,
        error,
        isSystemOffline,
        tacticalVerdict,
        isVerdictProcessing,
        swarmPlan
    };
};
