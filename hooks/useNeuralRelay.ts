import React, { useState } from 'react';
import { Agent, Bounty } from '../types';
import { CombatEngine } from '../engine/combat';
import { relayService } from '../services/relayService';
import { synapseApi } from '../services/synapseApi';

/**
 * @deprecated Legacy execution hook. Migrate to `src/hooks/useExecutionProxy` + execution strategies.
 */

export interface UserKeys {
    google?: string;
    openai?: string;
    anthropic?: string;
    deepseek?: string; 
}

export interface RaceState {
    status: 'IDLE' | 'RACING' | 'CALCULATING' | 'FINISHED';
    userLogs: string[];
    ghostLogs: string[];
    userProgress: number; 
    ghostProgress: number; 
    userScore: number;
    ghostScore: number;
    finalTime: number;
    winner: 'USER' | 'GHOST' | null;
}

export interface ChainState {
    status: 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ERROR';
    step: number;
    logs: string[];
    finalOutput: string | null;
}

export const useNeuralRelay = (balance: number, setBalance: React.Dispatch<React.SetStateAction<number>>) => {
    const [keys, setKeys] = useState<UserKeys>({});

    React.useEffect(() => {
        try {
            const saved = sessionStorage.getItem('YOUAGENT_KEYS');
            if (saved) {
                setKeys(JSON.parse(saved));
            }
        } catch (e) {
            console.warn("Storage access failed", e);
        }
    }, []);

    const saveKey = (provider: keyof UserKeys, key: string) => {
        const newKeys = { ...keys, [provider]: key };
        setKeys(newKeys);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('YOUAGENT_KEYS', JSON.stringify(newKeys));
        }
    };

    const [chainState, setChainState] = useState<ChainState>({
        status: 'IDLE',
        step: 0,
        logs: [],
        finalOutput: null
    });

    // --- EXECUTION CORE (Protocol V4.2 Edge Proxy) ---
    const executeRequest = async (
        agentId: string, 
        systemPrompt: string, 
        userPrompt: string, 
        onChunk: (text: string) => void
    ) => {
        const provider = relayService.resolveProvider(agentId);
        
        // Use SynapseApi to tunnel through Cloudflare Edge
        try {
            await synapseApi.sendChatMessage({
                prompt: `${systemPrompt}\n\nUser: ${userPrompt}`,
                provider,
                model: agentId,
                // Turnstile could be integrated here if the UI provides a token
            }, onChunk);
        } catch (err: any) {
            onChunk(`\n[EDGE_GATEWAY_FAILURE] ${err.message}\n`);
            console.error(err);
        }
    };

    const tuneAgent = async (agent: Agent, prompt: string, onStream: (text: string) => void) => {
        const systemPrompt = `You are ${agent.name}. Style: ${agent.slogan}.`;
        await executeRequest(agent.id, systemPrompt, prompt, onStream);
    };

    const executeChain = async (agents: Agent[], initialInput: string) => {
        setChainState({ status: 'RUNNING', step: 0, logs: [], finalOutput: null });
        
        let currentInput = initialInput;
        
        try {
            for (let i = 0; i < agents.length; i++) {
                const agent = agents[i];
                setChainState(prev => ({ 
                    ...prev, 
                    step: i + 1, 
                    logs: [...prev.logs, `[STEP ${i+1}] Invoking ${agent.name}...`] 
                }));

                let agentOutput = "";
                const systemPrompt = `You are part of a workflow chain. Role: ${agent.category}. Process the input.`;
                
                await executeRequest(agent.id, systemPrompt, currentInput, (chunk) => {
                    agentOutput += chunk;
                });
                
                setChainState(prev => ({ 
                    ...prev, 
                    logs: [...prev.logs, `[STEP ${i+1}] Output generated (${agentOutput.length} chars).`] 
                }));
                
                currentInput = agentOutput; 
            }

            setChainState(prev => ({ 
                ...prev, 
                status: 'COMPLETED', 
                finalOutput: currentInput,
                logs: [...prev.logs, `[SUCCESS] Chain execution complete.`]
            }));

        } catch (error) {
             setChainState(prev => ({ 
                ...prev, 
                status: 'ERROR', 
                logs: [...prev.logs, `[ERROR] Workflow failed.`] 
            }));
        }
    };

    return {
        keys,
        saveKey,
        chainState,
        tuneAgent,
        executeChain,
        executeRequest
    };
};
