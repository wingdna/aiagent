
// 🛑 CORE ENGINE LOGIC - DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED. PURE LOGIC ONLY.
import { Agent } from '../types';

export interface NREProfile {
    preferred_categories: string[];
    interaction_depth: number;
    technical_bias: number;
    creative_bias: number;
}

export class NeuralResonanceEngine {
    /**
     * Calculates the resonance score between an agent and a user profile.
     * Score range: 0 - 100+
     */
    static calculateScore(agent: Agent, profile: NREProfile): number {
        let score = 0;
        
        // 1. Category Matching
        if (profile.preferred_categories.some(c => agent.category === c)) {
            score += 30;
        }
        
        // 2. Metrics Alignment
        if (agent.metrics) {
            score += agent.metrics.reasoning * profile.technical_bias * 0.4;
            score += agent.metrics.creativity * profile.creative_bias * 0.3;
            score += agent.metrics.speed * 0.2;
        }
        
        // 3. Neural Jitter (Deterministic based on ID for consistency)
        const jitter = (agent.id.charCodeAt(0) % 10); 
        
        return Math.min(100, Math.max(0, score + jitter));
    }

    /**
     * Sorts and filters agents based on the NRE Profile.
     */
    static sortAgents(agents: Agent[], filterTag: string | null, profile: NREProfile): Agent[] {
        if (!agents || agents.length === 0) return [];

        let result = [...agents]; 
        
        if (filterTag) {
            result = result.filter(a => a.tags?.includes(filterTag));
        }
        
        // Enhance agents with NRE Score
        const enhanced = result.map(agent => ({
            ...agent,
            syncStrength: this.calculateScore(agent, profile)
        }));

        // Sort by Sync Strength (Descending) with ABSOLUTE ID TIE-BREAKER for UI stability
        return enhanced.sort((a, b) => {
            const scoreDiff = b.syncStrength - a.syncStrength;
            if (Math.abs(scoreDiff) > 0.01) return scoreDiff;
            return a.id.localeCompare(b.id);
        });
    }
}
