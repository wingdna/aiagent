import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { OverlayAgentCard } from '../ui/OverlayAgentCard';
import { dataService } from '../../services/dataService';
import { mapToRegistry } from '../../utils/mapper';
import { Agent } from '../../types';

interface ComplementarySynapsesProps {
    agents: AgentRegistryEntity[];
    loading: boolean;
    agentContext?: AgentRegistryEntity;
}

export const ComplementarySynapses: React.FC<ComplementarySynapsesProps> = ({ agents: initialAgents, loading: initialLoading, agentContext }) => {
    const [localAgents, setLocalAgents] = useState<AgentRegistryEntity[]>(initialAgents);
    const [isLoading, setIsLoading] = useState(initialLoading);

    const handleLoadSimilar = async () => {
        if (!agentContext || isLoading) return;
        setIsLoading(true);
        try {
            const similar = await dataService.findSimilarAgents(agentContext, 6);
            const mapped = (similar || []).map(a => mapToRegistry(a));
            setLocalAgents(mapped);
        } catch (e) {
            console.error('[SYNERGY] Failed to fetch similar agents:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const agents = localAgents.length > 0 ? localAgents : initialAgents;
    const loading = isLoading;

    const Content = (
        <div className="w-full relative bg-black/20 border border-white/5 rounded-xl p-3 backdrop-blur-sm mt-4">
            <div className="w-full relative group/track">
                {/* [SLIM_SYNERGY_PROTOCOL] Minimal Header */}
                <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2 text-[10px] font-mono text-cyan-500/70 tracking-widest uppercase">
                        <Zap size={12} /> SYNERGY_MATRIX
                    </h4>
                </div>

                {/* [RESPONSIVE_GRID] Adaptive Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {agents.map((agent) => (
                        <OverlayAgentCard key={agent.id} agent={agent} className="w-full h-24 sm:h-28" />
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="hidden md:block">
                <AnimatePresence>
                    {(!loading && agents && agents.length > 0) && (
                        <m.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.5 }}
                        >
                            {Content}
                        </m.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="block md:hidden">
                {Content}
            </div>
        </>
    );
};

