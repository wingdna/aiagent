
import { Agent } from '../types';
import { GoogleGenAI } from "@google/genai";

const WORKER_URL = 'https://synapse-relay.roforhy.workers.dev/';

export type Provider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'groq' | 'siliconflow' | 'huggingface' | 'jina' | 'proxy' | 'browser';

interface StreamOptions {
    model: string;
    provider: Provider;
    apiKey?: string;
    system: string;
    user: string;
    onChunk: (text: string) => void;
    onError: (err: string) => void;
    onFinish?: () => void;
}

class RelayService {
    
    /**
     * Resolves the provider based on Agent ID naming conventions.
     */
    resolveProvider(agentId: string): Provider {
        const id = agentId.toLowerCase();
        if (id.includes('gpt')) return 'openai';
        if (id.includes('claude')) return 'anthropic';
        if (id.includes('gemini')) return 'google';
        if (id === 'deepseek-ai/deepseek-v3' || id.includes('deepseek')) return 'siliconflow'; 
        if (id.includes('llama') || id.includes('mixtral')) return 'groq'; 
        if (id.includes('flux') || id.includes('stable')) return 'huggingface';
        return 'siliconflow'; // New Default Fallback
    }

    /**
     * Generic Call Method (V30.0 Direct Protocol)
     */
    async call(provider: string, payload: any): Promise<any> {
        // --- CLIENT-SIDE DIRECT HARVEST (Jina) ---
        if (provider === 'jina' || provider === 'proxy') {
            try {
                const rawUrl = payload.url || '';
                const cleanUrl = rawUrl.replace(/[\)\],]+$/, "").trim();

                if (!cleanUrl) return { error: 'INVALID_URL', message: 'Target URL missing.' };

                // Enhanced Retry Logic for Direct Fetch
                let attempts = 0;
                let response: Response | null = null;
                
                while(attempts < 3) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

                        response = await fetch(`https://r.jina.ai/${cleanUrl}`, {
                            method: 'GET',
                            headers: {
                                'Accept': 'text/event-stream',
                                'X-Return-Format': 'markdown',
                                'User-Agent': 'Synapse-Cerebro/1.0'
                            },
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        
                        if (response.ok) break;
                        if (response.status === 429) {
                            console.warn(`[JINA] Rate limit hit. Cooling down...`);
                            await new Promise(r => setTimeout(r, 2000 * (attempts + 1))); 
                        }
                    } catch (e) {
                        console.warn(`[JINA] Attempt ${attempts + 1} failed for ${cleanUrl}`);
                    }
                    attempts++;
                    await new Promise(r => setTimeout(r, 1000));
                }

                if (!response || !response.ok) {
                    const status = response ? response.status : 0;
                    const statusText = response ? response.statusText : "Network Timeout";
                    
                    if (status === 429) {
                        return { error: 'RATE_LIMIT', message: '429: Too Many Requests. Cooling down.' };
                    }
                    return { error: 'JINA_FETCH_ERROR', message: `HTTP ${status}: ${statusText}` };
                }

                const text = await response.text();
                return { text };

            } catch (e: any) {
                return { error: 'CLIENT_NETWORK_ERROR', message: e.message || 'Direct Fetch Failed' };
            }
        }

        // --- LEGACY WORKER RELAY (Only for non-Google/non-Jina) ---
        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Agent-Provider': provider
                },
                body: JSON.stringify(payload)
            });
            
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                 const text = await response.text();
                 return { error: 'WORKER_GATEWAY_ERROR', message: text || `HTTP ${response.status}` };
            }

            return await response.json();
        } catch (e: any) {
            return { error: 'CLIENT_NETWORK_ERROR', message: e.message };
        }
    }

    /**
     * Text Generation via Server-Sent Events (SSE) or SDK.
     */
    async chatStream(options: StreamOptions) {
        const { provider, model, onError, onFinish } = options;

        // V30.0: DIRECT GOOGLE SDK ROUTING
        // Bypasses the dead relay worker completely for Gemini models.
        if (provider === 'google') {
            try {
                await this.streamGoogleDirect(options);
                if (onFinish) onFinish();
                return;
            } catch (e: any) {
                console.error(`[RELAY] Direct SDK Failed for ${model}:`, e);
                // Fallthrough to retry logic if needed, but for now we stop here as relay is known dead.
                onError(e.message || "Google SDK Connection Failed");
                if (onFinish) onFinish();
                return;
            }
        }

        // Fallback for other providers (via Relay)
        await this.streamRelayFallback(options);
    }

    /**
     * Direct integration with Google GenAI SDK for Gemini models.
     * Follows strict initialization and data extraction rules.
     */
    private async streamGoogleDirect({ model, system, user, onChunk }: StreamOptions) {
        // ALWAYS use process.env.API_KEY exclusively for Google GenAI initialization.
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Use ai.models.generateContentStream to query GenAI with model name and prompt.
        const response = await ai.models.generateContentStream({
            model: model,
            contents: user, 
            config: {
                systemInstruction: system,
            }
        });

        for await (const chunk of response) {
            // Directly access the .text property on the GenerateContentResponse object.
            const text = chunk.text;
            if (text) {
                onChunk(text);
            }
        }
    }

    // --- LEGACY WORKER IMPLEMENTATION (FALLBACK) ---
    private async streamRelayFallback({ model, provider, apiKey, system, user, onChunk, onError, onFinish }: StreamOptions) {
        // Retry logic for non-google providers via relay
        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Agent-Provider': provider,
                    'X-User-Key': apiKey || '',
                    'X-Model': model
                },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: system },
                        { role: 'user', content: user }
                    ],
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`[RELAY_HTTP_${response.status}] ${response.statusText}`);
            }

            if (!response.body) throw new Error("NEURAL_LINK_SEVERED: Empty response body.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                onChunk(chunk);
            }
            if (onFinish) onFinish();

        } catch (e: any) {
            console.warn(`[RELAY_WARN] ${model} failed via Worker:`, e.message);
            onError(e.message);
            if (onFinish) onFinish();
        }
    }

    async generateImage(prompt: string, apiKey?: string): Promise<string | null> {
        // Keep attempting via Relay for Images (or switch to direct API if available)
        try {
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Agent-Provider': 'huggingface', 
                    'X-User-Key': apiKey || '',
                    'X-Model': 'black-forest-labs/FLUX.1-schnell' 
                },
                body: JSON.stringify({
                    prompt: prompt,
                    mode: 'image'
                })
            });

            if (!response.ok) return null;
            const blob = await response.blob();
            return URL.createObjectURL(blob);

        } catch (e) {
            return null;
        }
    }

    async fetchWithProxy(url: string): Promise<string> {
        try {
            const data = await this.call('proxy', { url, mode: 'scrape' });
            if (data.error) throw new Error(data.message);
            return data.text || ""; 
        } catch (e: any) {
            console.error("[PROXY_FAIL]", e);
            throw new Error(e.message || "Proxy Connection Failed");
        }
    }
}

export const relayService = new RelayService();
