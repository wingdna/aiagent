
// 🛑 CORE ENGINE LOGIC - DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED. PURE LOGIC ONLY.
import { Agent } from '../types';

export class CombatEngine {
    /**
     * Calculates payout odds for a specific agent in a lineup.
     */
    static calculateOdds(agentId: string, participants: Agent[], ghostIndex: number | null = null): number {
        if (participants.length < 2) return 1.0;
        
        // Elo to probability (Sigmoid-like relative strength)
        const strengths = participants.map(a => Math.pow(10, (a.stats?.elo || 1200) / 400));
        const totalStrength = strengths.reduce((sum, s) => sum + s, 0);
        
        const agentIndex = participants.findIndex(a => a.id === agentId);
        if (agentIndex === -1) return 1.0;
        
        const probability = strengths[agentIndex] / totalStrength;
        
        // Base Payout with 10% House Edge
        let payout = (1 / probability) * 0.9; 
        
        // Ghost Slot Mystery Bonus
        if (ghostIndex !== null && agentIndex === ghostIndex) {
            payout *= 2;
        }
        
        return parseFloat(payout.toFixed(2));
    }

    /**
     * Simulates a winner based on stats + entropy.
     */
    static simulateBattle(agents: Agent[], mutatorImpact: (agent: Agent) => number = () => 0): string {
        let winnerId = agents[0].id;
        let maxScore = -999;

        agents.forEach(agent => {
            // Base Score from Elo (Scaled)
            let score = (agent.stats?.elo || 1200) / 20; 
            
            // External Impact (Mutators, Sabotage)
            score += mutatorImpact(agent);

            // Random Variance (The Chaos Factor)
            score += Math.random() * 20;

            if (score > maxScore) {
                maxScore = score;
                winnerId = agent.id;
            }
        });

        return winnerId;
    }
    
    /**
     * Calculates the final Architect Score for Bounty Challenges.
     * V17 Algorithm: (Accuracy * 10) - (TimePenalty)
     */
    static calculateArchitectScore(accuracy: number, timeMs: number): number {
        // Time Penalty: 10 points per second
        const timePenalty = (timeMs / 1000) * 10;
        // Accuracy base: 0-100 -> 0-1000 points roughly
        return Math.floor((accuracy * 10) - timePenalty);
    }
}
