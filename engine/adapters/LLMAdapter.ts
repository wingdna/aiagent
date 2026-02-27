
// 🛑 CORE ENGINE LOGIC - DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED. PURE LOGIC ONLY.
import { AgentAdapter, AdapterConfig, ExecutionResult } from './types';

const WORKER_URL = 'https://synapse-relay.roforhy.workers.dev/';

export class LLMAdapter implements AgentAdapter {
    async execute(agentId: string, input: string, config: AdapterConfig): Promise<ExecutionResult> {
        try {
            // 1. Provider Resolution (Heuristic)
            let provider = 'google';
            const id = agentId.toLowerCase();
            if (id.includes('gpt')) provider = 'openai';
            else if (id.includes('claude')) provider = 'anthropic';
            else if (id.includes('deepseek')) provider = 'deepseek';
            else if (id.includes('mistral')) provider = 'mistral';

            // 2. Network Request
            const response = await fetch(WORKER_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Agent-Provider': provider,
                    'X-User-Key': config.apiKey
                },
                body: JSON.stringify({
                    model: agentId,
                    messages: [
                        { role: 'system', content: 'You are a Node in an autonomous workflow. Output precise data.' },
                        { role: 'user', content: input }
                    ],
                    stream: false // Workflow steps are typically atomic, though streaming is possible
                })
            });

            // 3. Error Handling
            if (!response.ok) {
                return { 
                    success: false, 
                    data: '', 
                    error: `[HTTP_${response.status}] ${response.statusText}` 
                };
            }

            // 4. Response Parsing (Handle Stream-like body if Worker forces it)
            if (!response.body) throw new Error("Empty Response Body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let resultText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                resultText += decoder.decode(value, { stream: true });
            }

            return { success: true, data: resultText.trim() };

        } catch (e: any) {
            return { 
                success: false, 
                data: '', 
                error: `[ADAPTER_FAIL] ${e.message}` 
            };
        }
    }
}
