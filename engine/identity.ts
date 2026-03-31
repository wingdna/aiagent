
// 🛑 CORE ENGINE LOGIC - DO NOT MODIFY UNLESS EXPLICITLY INSTRUCTED. PURE LOGIC ONLY.
import { UserRank } from '../types';

export const LEVELS = [
    { threshold: 0, title: 'SCRIPT_KIDDIE', color: '#6b7280' },       // Gray
    { threshold: 101, title: 'NETRUNNER', color: '#22c55e' },         // Green
    { threshold: 501, title: 'SYSOP', color: '#3b82f6' },             // Blue
    { threshold: 1501, title: 'CYBER_DEALER', color: '#a855f7' },     // Purple
    { threshold: 5001, title: 'NEURAL_ARCHITECT', color: '#f59e0b' }  // Amber (Gold)
];

export class IdentitySystem {
    /**
     * Calculates user rank based on XP.
     */
    static calculateRank(xp: number): UserRank {
        let current = LEVELS[0];
        let nextThreshold = LEVELS[1].threshold;
        let level = 1;

        for (let i = 0; i < LEVELS.length; i++) {
            if (xp >= LEVELS[i].threshold) {
                current = LEVELS[i];
                nextThreshold = LEVELS[i + 1]?.threshold || xp * 2; 
                level = Math.floor(xp / 100) + 1; 
            }
        }

        return {
            title: current.title as any,
            color: current.color,
            level,
            nextLevelXp: nextThreshold
        };
    }

    /**
     * Calculates social influence multiplier based on reputation.
     */
    static calculateInfluence(reputation: number): number {
        const bonus = Math.min(1.0, Math.floor(reputation / 100) * 0.1);
        return 1.0 + bonus;
    }
}
