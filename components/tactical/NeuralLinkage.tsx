import React, { useEffect, useState } from 'react';
import { Agent } from '../../types';
import { Network, Cpu } from 'lucide-react';
import { OverlayAgentCard } from '../ui/OverlayAgentCard';
import { supabase } from '../../lib/supabase';

interface NeuralLinkageProps {
    agent: Agent;
}

export const NeuralLinkage: React.FC<NeuralLinkageProps> = ({ agent }) => {
    const [linkedAgents, setLinkedAgents] = useState<Agent[]>([]);
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
                    .select('id, slug, name, description, entity_type, nri_score, hot_score, video_url, cover_url, display_mode, specs, pricing_model, pricing_model_json, metrics, capability_tags, media_gallery, vendor_id, vendor_slug, slogan, technical_specs, social_proof, external_stats, framework_stack, developer_socials')
                    .in('id', targetIds)
                    //.eq('is_active', true); // Removed is_active check as column might not exist or be named differently

                if (error) throw error;

                // Force update UI State
                console.log('[ECOSYSTEM_SYNC] Successfully loaded:', relatedAssets);
                setLinkedAgents(relatedAssets as Agent[]);

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
            ) : linkedAgents.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                    {linkedAgents.map(item => (
                        <OverlayAgentCard key={item.id} agent={item} className="w-full h-24 sm:h-28" />
                    ))}
                </div>
            ) : (
                <div className="p-4 border border-dashed border-white/20 rounded-lg text-white/30 text-xs font-mono flex items-center justify-center h-24">
                    AWAITING_NEURAL_LINK_DATA...
                </div>
            )}
        </div>
    );
};
