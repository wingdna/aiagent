
// 🛑 CORE ENGINE LOGIC - DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED. PURE LOGIC ONLY.

export interface AdapterConfig {
    apiKey: string;
    endpoint?: string;
    stream?: boolean;
}

export interface ExecutionResult {
    success: boolean;
    data: string;
    meta?: Record<string, any>;
    error?: string;
}

export interface AgentAdapter {
    /**
     * Executes a task on a remote agent via the Relay Worker.
     * @param agentId The ID of the agent (e.g., 'gpt-4-omni').
     * @param input The resolved prompt string.
     * @param config Configuration containing API keys.
     */
    execute(agentId: string, input: string, config: AdapterConfig): Promise<ExecutionResult>;
}
