
// 🛑 CORE ENGINE LOGIC - DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED. PURE LOGIC ONLY.
import { Agent } from '../../types';
import { ContextBus } from './ContextBus';
import { AdapterFactory } from '../adapters/Factory';

export interface WorkflowNode {
    id: string; // Unique ID (e.g., 'NODE_1')
    agent: Agent;
    customPrompt?: string; // Optional override
}

export interface KeyMap {
    [key: string]: string | undefined;
}

export type WorkflowEventType = 'START' | 'NODE_START' | 'NODE_COMPLETE' | 'WORKFLOW_COMPLETE' | 'ERROR';

export interface WorkflowEvent {
    type: WorkflowEventType;
    nodeId?: string;
    data?: any;
    step?: number;
    meta?: any;
}

export class WorkflowExecutor {
    /**
     * Executes a linear workflow of agents.
     * @param nodes Array of WorkflowNode objects in execution order.
     * @param initialInput The user's starting prompt/data.
     * @param keys User API keys map.
     * @param onProgress Callback for UI updates.
     */
    static async runWorkflow(
        nodes: WorkflowNode[], 
        initialInput: string, 
        keys: KeyMap,
        onProgress: (event: WorkflowEvent) => void
    ) {
        const bus = new ContextBus(initialInput);
        
        onProgress({ type: 'START', data: { nodeCount: nodes.length } });

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const stepNum = i + 1;
            
            onProgress({ type: 'NODE_START', nodeId: node.id, step: stepNum });

            try {
                // 1. Resolve Prompt
                // If customPrompt exists, use it. Otherwise default to chaining previous output.
                let template = node.customPrompt;
                
                if (!template) {
                    if (i === 0) template = "{{INPUT}}";
                    else template = `{{${nodes[i-1].id}}}`;
                }

                // Auto-fix: if template doesn't contain variables but we are deep in chain, append context
                if (i > 0 && !template.includes('{{') && !template.includes('}}')) {
                    template = `${template}\n\nContext: {{${nodes[i-1].id}}}`;
                }

                const actualPrompt = bus.resolvePrompt(template);

                // 2. Get Adapter
                const adapter = AdapterFactory.getAdapter(node.agent.category);

                // 3. Resolve Key (Heuristic Mapping)
                let apiKey = keys['google']; // Default fallback (often mapped to Gemini)
                const agentId = node.agent.id.toLowerCase();
                
                if (agentId.includes('gpt')) apiKey = keys['openai'];
                else if (agentId.includes('claude')) apiKey = keys['anthropic'];
                else if (agentId.includes('deepseek')) apiKey = keys['deepseek'];

                if (!apiKey) {
                    // Try generic fallback if specific key missing
                    apiKey = keys['openai'] || keys['anthropic'] || keys['google']; 
                }

                if (!apiKey || apiKey.length < 5) {
                    throw new Error(`Missing API Key for provider: ${node.agent.category}`);
                }

                // 4. Execute
                const result = await adapter.execute(node.agent.id, actualPrompt, { apiKey });

                if (!result.success) {
                    throw new Error(result.error || 'Unknown execution failure');
                }

                // 5. Store & Report
                bus.set(node.id, result.data);
                
                onProgress({ 
                    type: 'NODE_COMPLETE', 
                    nodeId: node.id, 
                    data: result.data, 
                    step: stepNum,
                    meta: result.meta 
                });

                // Optional: Artificial delay for UI pacing
                await new Promise(r => setTimeout(r, 500));

            } catch (error: any) {
                console.error(`[WORKFLOW_FAIL] Node ${node.id}:`, error);
                onProgress({ 
                    type: 'ERROR', 
                    nodeId: node.id, 
                    data: error.message,
                    step: stepNum
                });
                
                // Stop execution on error
                throw new Error(`Workflow halted at ${node.id}: ${error.message}`);
            }
        }

        onProgress({ type: 'WORKFLOW_COMPLETE', data: bus.snapshot() });
        return bus.snapshot();
    }
}
