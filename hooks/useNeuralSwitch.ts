import { useState, useCallback } from 'react';
import { intelligenceService } from '../services/intelligenceService';
import { AgentRegistryEntity } from '../app/types/registry';

export const useNeuralSwitch = () => {
    const [mode, setMode] = useState<'SEARCH' | 'CHAT'>('SEARCH');
    const [thinking, setThinking] = useState<string>('');
    const [response, setResponse] = useState<string>('');
    const [isThinking, setIsThinking] = useState(false);

    // 1. Intent Detection (Simple Heuristic for now)
    const detectIntent = useCallback((query: string): 'SEARCH' | 'CHAT' => {
        const chatTriggers = ['how', 'why', 'what is', 'explain', 'help', 'code', 'write', 'compare', 'analyze'];
        const isChat = chatTriggers.some(t => (query || '').toLowerCase().startsWith(t));
        return isChat ? 'CHAT' : 'SEARCH';
    }, []);

    // 2. Execute Neural Query
    const executeNeuralQuery = useCallback(async (query: string, contextAgents: AgentRegistryEntity[]) => {
        setMode('CHAT');
        setIsThinking(true);
        setThinking('');
        setResponse('');

        // Prepare Context (RAG)
        const context = contextAgents.slice(0, 3).map(a => 
            `Agent: ${a.name}\nDescription: ${a.description}\nCategory: ${a.category}`
        ).join('\n---\n');

        const fullPrompt = `Context:\n${context}\n\nUser Query: ${query}`;

        try {
            await intelligenceService.chatStream(
                [{ role: 'user', content: fullPrompt }],
                'CHAT',
                {
                    onToken: (token) => {
                        setResponse(prev => prev + token);
                    },
                    onThinking: (content) => {
                        setThinking(prev => prev + content);
                    },
                    onComplete: (fullText) => {
                        setIsThinking(false);
                    },
                    onError: (err) => {
                        setResponse(prev => prev + `\n[SYSTEM_ERROR]: ${err.message}`);
                        setIsThinking(false);
                    }
                }
            );
        } catch (err: any) {
            setResponse(`NEURAL_LINK_FAILED: ${err.message}`);
            setIsThinking(false);
        }
    }, []);

    return {
        mode,
        setMode,
        detectIntent,
        executeNeuralQuery,
        thinking,
        response,
        isThinking
    };
};
