
// 🛑 CORE ENGINE LOGIC - DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED. PURE LOGIC ONLY.
import { Agent } from '../types';

export class WorkflowOrchestrator {
    /**
     * Validates if a sequence of agents forms a viable chain.
     */
    static validateChain(nodes: Agent[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        if (nodes.length === 0) errors.push("Chain empty: No agents selected.");
        if (nodes.length > 5) errors.push("Chain overload: Max 5 nodes supported.");
        
        return { valid: errors.length === 0, errors };
    }

    /**
     * Estimates the processing efficiency of a workflow.
     * Used for UI forecasting.
     */
    static calculateProjectedEfficiency(nodes: Agent[]): number {
        if (nodes.length === 0) return 0;
        const totalSpeed = nodes.reduce((sum, a) => sum + (a.metrics?.speed || 0), 0);
        return Math.floor(totalSpeed / nodes.length);
    }
}
