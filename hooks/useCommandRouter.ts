import { useState, useCallback, useRef } from 'react';
import { Agent } from '../types';
import { siliconFlowService } from '../services/siliconFlowService';

export const useCommandRouter = (
    rawResults: Agent[],
    setTacticalLogs?: React.Dispatch<React.SetStateAction<any[]>>
) => {
    const [tacticalVerdict, setTacticalVerdict] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [isFreeOnly, setIsFreeOnly] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const analyzeAgents = useCallback((agents: Agent[], promptPrefix: string) => {
        if (agents.length === 0) return;
        
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        setIsAnalyzing(true);
        setTacticalVerdict(null);
        
        const context = agents.map(a => 
            `- ${a.name}: Score ${a.metrics?.nri_score || 0}, Price: ${(a.pricing_model as any)?.type || 'Unknown'}, Tags: ${(a.tags || []).join(',')}`
        ).join('\n');

        const prompt = `${promptPrefix}\n\nContext:\n${context}\n\nProvide a concise, tactical verdict (max 2 sentences) on which one to choose and why, focusing on cost-effectiveness and capabilities.`;

        let currentVerdict = '';
        siliconFlowService.streamDeepSeekReasoning(prompt, {
            onChunk: (chunk, isReasoning) => {
                if (!isReasoning) {
                    currentVerdict += chunk;
                    setTacticalVerdict(currentVerdict);
                }
            },
            onDone: () => setIsAnalyzing(false),
            onError: () => {
                setTacticalVerdict("Error analyzing agents.");
                setIsAnalyzing(false);
            },
            signal: abortControllerRef.current.signal
        });
    }, []);

    const executeCommand = useCallback((cmd: string) => {
        const trimmedCmd = cmd.trim();
        if (trimmedCmd === '/clear') {
            if (setTacticalLogs) setTacticalLogs([]);
            setTacticalVerdict(null);
            setActiveFilter(null);
            setIsFreeOnly(false);
            if (abortControllerRef.current) abortControllerRef.current.abort();
            return true;
        }

        if (trimmedCmd === '/free') {
            setIsFreeOnly(true);
            return true;
        }

        if (trimmedCmd.startsWith('/filter ')) {
            const tag = trimmedCmd.replace('/filter ', '').trim();
            setActiveFilter(tag);
            return true;
        }

        if (trimmedCmd === '/compare') {
            const top2 = rawResults.slice(0, 2);
            if (top2.length < 2) {
                setTacticalVerdict("Not enough agents to compare.");
                return true;
            }
            analyzeAgents(top2, "Compare these two AI agents based on their metadata and determine the superior choice.");
            return true;
        }

        return false; // Not a handled command
    }, [rawResults, setTacticalLogs, analyzeAgents]);

    const filteredResults = rawResults.filter(agent => {
        if (isFreeOnly) {
            const pricing = (agent.pricing_model_json || agent.pricing_model) as any;
            const isOSS = pricing?.type === 'Open Source' || pricing?.type === 'open_weights';
            const minPrice = pricing?.tiers ? Math.min(...pricing.tiers.map((t: any) => t.price || 0)) : null;
            if (!isOSS && minPrice !== 0 && pricing?.type !== 'Free') return false;
        }
        if (activeFilter) {
            const tags = agent.tags || agent.capability_tags || [];
            if (!tags.some((t: string) => t.toLowerCase().includes(activeFilter.toLowerCase()))) {
                return false;
            }
        }
        return true;
    });

    return {
        executeCommand,
        tacticalVerdict,
        isAnalyzing,
        filteredResults,
        analyzeAgents
    };
};
