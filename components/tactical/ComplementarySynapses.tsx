import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Zap, RefreshCw } from 'lucide-react';
import { Agent } from '../../types';
import { OverlayAgentCard } from '../ui/OverlayAgentCard';
import { dataService } from '../../services/dataService';

interface ComplementarySynapsesProps {
    agents: Agent[];
    loading: boolean;
    agentContext?: Agent; // Use full Agent type to satisfy dataService.findSimilarAgents
}

export const ComplementarySynapses: React.FC<ComplementarySynapsesProps> = ({ agents: initialAgents, loading: initialLoading, agentContext }) => {
    const [localAgents, setLocalAgents] = useState<Agent[]>(initialAgents);
    const [isLoading, setIsLoading] = useState(initialLoading);
    const [hasInteracted, setHasInteracted] = useState(false);

    const handleLoadSimilar = async () => {
        if (!agentContext || isLoading) return;
        setIsLoading(true);
        setHasInteracted(true);
        try {
            const similar = await dataService.findSimilarAgents(agentContext, 8);
            setLocalAgents(similar || []);
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
                    {!hasInteracted && (
                        <button 
                            onClick={handleLoadSimilar}
                            disabled={loading}
                            className="md:hidden flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded text-[9px] font-mono text-cyan-400 uppercase tracking-tighter hover:bg-cyan-500/20 transition-colors"
                        >
                            {loading ? <RefreshCw size={10} className="animate-spin" /> : <Zap size={10} />}
                            {loading ? 'CALCULATING...' : 'LOAD_SIMILAR'}
                        </button>
                    )}
                </div>

                {/* [RESPONSIVE_GRID] Adaptive Layout */}
                <div className={`${hasInteracted ? 'grid' : 'hidden md:grid'} grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3`}>
                    {agents.map((agent) => (
                        <OverlayAgentCard key={agent.id} agent={agent} className="w-full h-24 sm:h-28" />
                    ))}
                </div>
                
                {!hasInteracted && (
                    <div className="md:hidden h-12 flex items-center justify-center border border-dashed border-white/5 rounded-lg mt-3">
                        <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Interaction required for synergy calculation</span>
                    </div>
                )}
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

