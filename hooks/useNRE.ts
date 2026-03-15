
import { useMemo } from 'react';
import { Agent } from '../types';
import { NeuralResonanceEngine, NREProfile } from '../engine/nre';

// Re-export for compatibility
export type { NREProfile };
export const DEFAULT_NRE_PROFILE: NREProfile = {
    preferred_categories: ['CODING', 'SECURITY'],
    interaction_depth: 0.8,
    technical_bias: 0.9,
    creative_bias: 0.4
};

export const useNRE = (agents: Agent[], filterTag: string | null, profile: NREProfile = DEFAULT_NRE_PROFILE) => {
    const sortedAgents = useMemo(() => {
        return NeuralResonanceEngine.sortAgents(agents, filterTag, profile);
    }, [agents, filterTag, profile]);

    return sortedAgents;
};
