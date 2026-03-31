
// 🛑 CORE ENGINE LOGIC - DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED. PURE LOGIC ONLY.

export class ContextBus {
    private memory: Map<string, string> = new Map();

    constructor(initialInput: string) {
        this.memory.set('INPUT', initialInput);
    }

    /**
     * Stores output from a node execution.
     */
    set(nodeId: string, output: string) {
        this.memory.set(nodeId, output);
    }

    /**
     * Retrieves stored data.
     */
    get(nodeId: string): string | undefined {
        return this.memory.get(nodeId);
    }

    /**
     * Resolves variables in a prompt template.
     * Replaces {{NODE_ID}} or {{INPUT}} with actual values.
     */
    resolvePrompt(template: string): string {
        if (!template) return "";
        
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const cleanKey = key.trim();
            const val = this.memory.get(cleanKey);
            
            // If variable found, return it. Else keep the tag for debugging.
            return val !== undefined ? val : match;
        });
    }
    
    /**
     * Exports full context for debugging or history.
     */
    snapshot(): Record<string, string> {
        return Object.fromEntries(this.memory);
    }
}
