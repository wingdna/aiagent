import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Agent } from '../../types';
import { mapToRegistry } from '../../utils/mapper';
import { extractYoutubeId } from '../../utils/videoUtils';
import { supabase } from '../../lib/supabase';
import { dataService } from '../../services/dataService';
import { m, AnimatePresence } from 'framer-motion';

export const NeuralLinks: React.FC<{ agent: AgentRegistryEntity }> = ({ agent }) => {
    const [linkedEntities, setLinkedEntities] = useState<any[]>([]);
    const [semanticLinks, setSemanticLinks] = useState<AgentRegistryEntity[]>([]);
    const [isLoadingLinks, setIsLoadingLinks] = useState(false);
    const [isScanningNeural, setIsScanningNeural] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLinks = async () => {
            if (!agent?.id || !supabase) return;
            setIsLoadingLinks(true);
            
            let rpcName = 'get_agents_by_base_model'; // Default
            let paramName = 'p_model_id';

            // If this is an AI Agent (like Cursor), we want to see its Base Model (GPT-4)
            if (agent.entity_type === 'ai_agent') {
                rpcName = 'get_base_models_for_agent';
                paramName = 'p_agent_id';
            }

            try {
                const { data, error } = await supabase.rpc(rpcName, { [paramName]: agent.id });
                
                if (data) {
                    setLinkedEntities(data);
                }
            } catch (err) {
                console.error("[YouAgent] Failed to fetch neural links:", err);
            } finally {
                setIsLoadingLinks(false);
            }
        };
        
        const fetchSemanticLinks = async () => {
            setIsScanningNeural(true);
            try {
                const matches = await dataService.findSimilarAgents(agent);
                // Filter out self and map to registry
                const mapped = matches
                    .filter(a => a.id !== agent.id)
                    .slice(0, 4)
                    .map(a => {
                        const entity = mapToRegistry(a);
                        // Preserve similarity for display
                        return { ...entity, similarity: (a as any).similarity };
                    });
                setSemanticLinks(mapped as AgentRegistryEntity[]);
            } catch (e) {
                console.error("Semantic Scan Failed", e);
            } finally {
                setIsScanningNeural(false);
            }
        };

        fetchLinks();
        fetchSemanticLinks();
    }, [agent.id, agent.entity_type]);

    const hasLinked = linkedEntities && linkedEntities.length > 0;
    const hasSemantic = isScanningNeural || (semanticLinks && semanticLinks.length > 0);

    return (
        <AnimatePresence mode="popLayout">
            {(hasLinked || hasSemantic) && (
                <m.div 
                    key="neural-links-container"
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                    className="w-full mt-10 pt-6 border-t border-slate-800/50 mb-20"
                >
                    {/* RENDER LINKS */}
                    {hasLinked && (
                        <div className="mb-6">
                            <h3 className="text-sm font-mono text-slate-400 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                                {agent.entity_type === 'ai_agent' ? '[_POWERED_BY_BASE_MODELS]' : '[_ECOSYSTEM_APPLICATIONS]'}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {linkedEntities.map(entity => (
                                <div 
                                    key={entity.id} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const identifier = entity.slug || entity.id;
                                        navigate(`/agent/${identifier}/lounge`, { viewTransition: true });
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="px-3 py-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 transition-all rounded flex flex-col gap-1 cursor-pointer active:scale-95"
                                >
                                    <span className="text-cyan-400 font-bold text-xs truncate">{entity.name}</span>
                                    <span className="text-slate-600 text-[10px] uppercase">{entity.entity_type}</span>
                                </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SEMANTIC LINKS */}
                    {hasSemantic && (
                        <div>
                            <h3 className="text-sm font-mono text-slate-400 mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                                [_SYNAPTIC_RESONANCE]
                            </h3>
                            
                            {isScanningNeural ? (
                                <div className="text-slate-500 font-mono text-xs">CALCULATING VECTOR SIMILARITY...</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {semanticLinks.map(link => (
                                        <div 
                                            key={link.id} 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const identifier = link.slug || link.id;
                                                navigate(`/agent/${identifier}/lounge`, { viewTransition: true });
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className="flex items-center gap-3 p-2 bg-black/40 border border-purple-900/30 hover:border-purple-500/50 rounded transition-all cursor-pointer group"
                                        >
                                            {(() => {
                                                const videoId = extractYoutubeId(link.assets.video_url);
                                                const thumb = videoId ? `https://i.ytimg.com/vi_webp/${videoId}/mqdefault.webp` : null;
                                                const imgSrc = link.assets.cover_url || thumb;
                                                
                                                return imgSrc ? (
                                                    <img src={imgSrc} className="w-8 h-8 rounded object-cover opacity-70 group-hover:opacity-100" alt={link.name} />
                                                ) : (
                                                    <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-900/50 to-black flex items-center justify-center border border-purple-500/20">
                                                        <span className="text-[10px] font-bold text-purple-400">{link.name.substring(0, 2).toUpperCase()}</span>
                                                    </div>
                                                );
                                            })()}
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-xs font-bold text-purple-300 truncate group-hover:text-purple-100">{link.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1 bg-gray-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-purple-500" style={{ width: `${((link as any).similarity || 0) * 100}%` }}></div>
                                                    </div>
                                                    <span className="text-[9px] font-mono text-gray-500">{(((link as any).similarity || 0) * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </m.div>
            )}
        </AnimatePresence>
    );
};
