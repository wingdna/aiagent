
import { useState, useCallback, useMemo } from 'react';
import { Agent } from '../types';
import { UserKeys } from '../types';
import { useExecutionProxy } from '../hooks/useExecutionProxy';
import { OpenAIStrategy } from '../lib/execution/OpenAIStrategy';

export type RouterMode = 'AUTO_DETECTING' | 'LOCAL_RESULTS' | 'AWAITING_UPLINK' | 'COGNITIVE_CHAT' | 'TACTICAL_FLOW' | 'SYSTEM_ERROR';

interface RankedAgent extends Agent {
    searchScore: number;
}

export const useNeuralRouter = (
    keys: UserKeys, 
    agents: Agent[],
    actions: {
        onFilter: (tag: string) => void;
        onFlow: (ids: string[]) => void;
        onChat: (text: string) => void;
    }
) => {
    const [mode, setMode] = useState<RouterMode>('AUTO_DETECTING');
    const [isProcessing, setIsProcessing] = useState(false);
    const [missingProvider, setMissingProvider] = useState<string | null>(null);
    const [localResults, setLocalResults] = useState<Agent[]>([]);
    const [pendingQuery, setPendingQuery] = useState<string>('');

    const strategy = useMemo(() => new OpenAIStrategy(), []);
    const { executePrompt, connect } = useExecutionProxy(strategy, { model: 'gpt-4o-mini' });

    const resetState = useCallback(() => {
        setMode('AUTO_DETECTING');
        setMissingProvider(null);
        setLocalResults([]);
        setPendingQuery('');
    }, []);

    const processInput = async (input: string) => {
        setIsProcessing(true);
        setLocalResults([]);
        setMissingProvider(null);

        const query = input.toLowerCase().trim();
        if (!query) {
            setIsProcessing(false);
            setMode('AUTO_DETECTING');
            return;
        }

        // --- LAYER 1: NEURAL WEIGHTED SEARCH ---
        const scoredMatches: RankedAgent[] = agents.map(agent => {
            let score = 0;
            const name = (agent.name || '').toLowerCase();
            const id = (agent.id || '').toLowerCase();
            const tags = (agent.tags || []).map(t => (typeof t === 'string' ? t : '').toLowerCase());
            const category = (agent.category || '').toLowerCase();
            const slogan = (agent.slogan || '').toLowerCase();

            // 1. Exact Match (The Apex Match)
            if (name === query || id === query) score += 200;
            
            // 2. Prefix Match
            else if (name.startsWith(query) || id.startsWith(query)) score += 120;

            // 3. Tag Match
            if (tags.includes(query)) score += 100;
            else if (tags.some(t => t.includes(query))) score += 60;

            // 4. Fuzzy Description/Slogan Match
            if (name.includes(query)) score += 40;
            if (category.includes(query)) score += 30;
            if (slogan.includes(query)) score += 20;

            return { ...agent, searchScore: score };
        }).filter(a => a.searchScore > 0);

        // Sort by relevance weight
        const sortedResults = scoredMatches.sort((a, b) => b.searchScore - a.searchScore);

        if (sortedResults.length > 0) {
            setLocalResults(sortedResults);
            setMode('LOCAL_RESULTS');
            setIsProcessing(false);
            return;
        }

        // --- LAYER 2: WORKFLOW DETECTION ---
        if (query.includes('chain') || query.includes('flow') || query.includes('link')) {
            setMode('TACTICAL_FLOW');
            setIsProcessing(false);
            return;
        }

        // --- LAYER 3: UPLINK OPTION ---
        setPendingQuery(input);
        setMode('AWAITING_UPLINK');
        setIsProcessing(false);
    };

    const executeUplink = async () => {
        setIsProcessing(true);
        if (!keys.openai) {
            setMode('SYSTEM_ERROR');
            setMissingProvider('openai');
            setIsProcessing(false);
            return;
        }

        connect(keys.openai, strategy.providerId);

        setMode('COGNITIVE_CHAT');
        try {
            const systemPrompt = `You are Synapse Router. Context: ${agents.length} AI Agents indexed. Analyze query: "${pendingQuery}". Suggest the best agent ID from our index.`;
            let buffer = "";
            await executePrompt(pendingQuery, { systemPrompt, model: 'gpt-4o-mini' }, (chunk) => {
                buffer += chunk;
            });
            actions.onChat(buffer.trim());
            setIsProcessing(false);
        } catch (e: any) {
            setMode('SYSTEM_ERROR');
            setIsProcessing(false);
        }
    };

    return { mode, isProcessing, processInput, executeUplink, missingProvider, localResults, resetState };
};
