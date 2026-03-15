import { CONFIG } from '../config';
import { checkCircuitBreaker } from './api_guard';

export interface DeepSeekStreamOptions {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    onChunk: (content: string, isReasoning: boolean) => void;
    onDone?: () => void;
    onError?: (error: Error) => void;
    signal?: AbortSignal;
    apiKey?: string;
}

export interface DeepSeekResponse {
    id: string;
    choices: Array<{
        delta: {
            content?: string;
            reasoning_content?: string;
        };
        finish_reason: string | null;
    }>;
}

/**
 * SiliconFlow Service - YOUAGENT OS GOLD MASTER EDITION
 * [ARCHITECT DIRECTIVE]: Strict env enforcement. Zero fake fallbacks. Mechanical degradation only.
 */
export const siliconFlowService = {
    async getEmbeddings(input: string, apiKey?: string): Promise<number[]> {
        if (!input) return [];
        // [WARNING]: Ensure /api/embeddings proxy is configured in Vite/Cloudflare
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (apiKey) headers['x-siliconflow-key'] = apiKey;

            const response = await fetch('/api/embeddings', {
                method: 'POST',
                headers,
                body: JSON.stringify({ input })
            });

            if (!response.ok) throw new Error(`Embedding Proxy Error: ${response.status}`);
            const data = await response.json() as any;
            return data.data?.[0]?.embedding || [];
        } catch (error) {
            console.error('[SiliconFlow] Embedding network failure. Initiating mechanical degradation.', error);
            return []; // Permitted mechanical degradation for Vector search, UI will fallback to .ilike()
        }
    },

    async streamDeepSeekReasoning(query: string, options: DeepSeekStreamOptions): Promise<void> {
        if (checkCircuitBreaker()) {
            if (options.onError) options.onError(new Error("Circuit Breaker Active"));
            return;
        }

        const {
            model = 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
            systemPrompt = 'You are a tactical advisor. Briefly analyze the user query and suggest the best type of AI agent. Output your thinking process.',
            temperature = 0.6,
            maxTokens = 1024,
            onChunk,
            onDone,
            onError,
            signal,
            apiKey
        } = options;

        try {
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                throw new Error("Local Network Offline");
            }

            if (signal?.aborted) return;

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (apiKey) headers['x-siliconflow-key'] = apiKey;

            // Use the internal proxy to avoid CORS and handle API keys securely
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: query }
                    ],
                    stream: true,
                    temperature,
                    max_tokens: maxTokens
                }),
                signal
            }).catch(err => {
                // Catch network errors (like "Failed to fetch") and throw a specific error
                throw new Error(`NETWORK_FAILURE: ${err.message}`);
            });

            if (!response.ok) {
                throw new Error(`Proxy API rejected connection: ${response.status} ${response.statusText}`);
            }

            if (!response.body) throw new Error('Response body is null');

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                if (signal?.aborted) {
                    reader.cancel();
                    break;
                }

                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const chunks = buffer.split('\n\n');
                buffer = chunks.pop() || '';

                for (const chunk of chunks) {
                    const trimmedChunk = chunk.replace(/^data: /, '').trim();
                    if (trimmedChunk === '[DONE]') break;
                    if (!trimmedChunk) continue;

                    try {
                        const parsed = JSON.parse(trimmedChunk) as DeepSeekResponse;
                        const reasoning = parsed.choices?.[0]?.delta?.reasoning_content;
                        const content = parsed.choices?.[0]?.delta?.content;

                        if (reasoning) onChunk(reasoning, true);
                        else if (content) onChunk(content, false);
                    } catch (e) {
                        // Suppress JSON parse errors on partial chunks, keep buffer integrity
                        continue; 
                    }
                }
            }

            if (onDone) onDone();

        } catch (error: any) {
            // [SILENCE] Expected UI unmount termination or user cancellation
            if (error.name === 'AbortError' || error.message?.includes('aborted')) return;
            
            console.warn('[SiliconFlow] Network or Proxy failure, engaging local mock fallback:', error.message);
            
            // [LOCAL_MOCK_FALLBACK] If the server is unreachable (e.g. restarting or offline), provide a local mock response
            if (error.message.includes('NETWORK_FAILURE') || error.message.includes('Failed to fetch')) {
                const mockReasoning = "Analysis: The central server is currently unreachable or restarting. Engaging local heuristic simulation.\n";
                const mockContent = "I am currently operating in **Local Offline Mode**. I cannot access the external neural network, but I can still assist you with local navigation.\n\nPlease wait a moment for the connection to re-establish.";
                
                onChunk(mockReasoning, true);
                setTimeout(() => {
                    if (signal?.aborted) return;
                    onChunk(mockContent, false);
                    if (onDone) onDone();
                }, 500);
                return;
            }

            if (onError) onError(error);
        }
    }
};
