import React, { useEffect, useState } from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Network, Cpu } from 'lucide-react';
import { OverlayAgentCard } from '../ui/OverlayAgentCard';
import { supabase } from '../../lib/supabase';
import { mapToRegistry } from '../../utils/mapper';
import { Agent } from '../../types';

interface NeuralLinkageProps {
    agent: AgentRegistryEntity;
}

export const NeuralLinkage: React.FC<NeuralLinkageProps> = ({ agent }) => {
    const [linkedAgents, setLinkedAgents] = useState<AgentRegistryEntity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRelatedEcosystem = async () => {
            if (!agent.id || !supabase) return;
            setLoading(true);

            try {
                let targetIds: string[] = [];

                if (agent.entity_type === 'ai_agent') {
                    // Step 1A: Check which models it uses
                    const { data: links } = await supabase
                        .from('agent_model_links')
                        .select('model_id')
                        .eq('agent_id', agent.id);
                    targetIds = links?.map((l: any) => l.model_id) || [];
                } 
                else if (agent.entity_type === 'foundation_model') {
                    // Step 1B: Check which Agents use it
                    const { data: links } = await supabase
                        .from('agent_model_links')
                        .select('agent_id')
                        .eq('model_id', agent.id);
                    targetIds = links?.map((l: any) => l.agent_id) || [];
                }

                // If no links, clear and return
                if (targetIds.length === 0) {
                    setLinkedAgents([]); 
                    setLoading(false);
                    return;
                }

                // Step 2: Fetch full data from agents table using IDs
                const { data: relatedAssets, error } = await supabase
                    .from('agents')
                    .select('id, name, slug, category, slogan, assets, cover_url, video_url, video_poster, capability_tags, tags, is_open_source, nri_score, tactical_badges, metrics, specs, pricing, faq_content')
                    .in('id', targetIds);

                if (error) throw error;

                const mapped = (relatedAssets || []).map(a => mapToRegistry(a as unknown as Agent));
                setLinkedAgents(mapped);

            } catch (err) {
                console.error('[ECOSYSTEM_SYNC] FATAL ERROR:', err);
                setLinkedAgents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRelatedEcosystem();
    }, [agent.id, agent.entity_type]);

    const title = agent.entity_type === 'ai_agent' 
        ? '[POWERED_BY_BASE_MODELS]' 
        : '[EMPOWERED_AGENTS]';
    
    const Icon = agent.entity_type === 'ai_agent' ? Cpu : Network;

    if (!loading && linkedAgents.length === 0) return null;

    return (
        <div className="w-full mt-8 mb-4">
            <h3 className="text-cyan-400 font-mono text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                <Icon size={16} /> {title}
            </h3>
            
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="w-full h-24 sm:h-28 bg-white/5 animate-pulse rounded-lg border border-white/5" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                    {linkedAgents.map(item => (
                        <OverlayAgentCard key={item.id} agent={item} className="w-full h-24 sm:h-28" />
                    ))}
                </div>
            )}
        </div>
    );
};
