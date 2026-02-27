import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Agent } from '../../types';
import { Activity, Check, AlertTriangle, Layout, Globe, Server, HardDrive, Database } from 'lucide-react';
import { IntelPreview } from '../shared/IntelPreview';
import { TacticalSpecs } from '../shared/TacticalSpecs';
import { PromptTerminal } from '../shared/PromptTerminal';
import { AdFrame } from '../monetization/AdFrame';
import { supabase } from '../../lib/supabase';
import { UIState, useUIStore } from '../../src/stores/useUIStore';

// --- SUB-COMPONENTS (Locally Scoped) ---

const ComparisonRadar: React.FC<{ agent: Agent }> = ({ agent }) => {
    const analysis = agent.market_analysis;
    
    // Fallback if no analysis data
    if (!analysis || (!analysis.verdict && (!analysis.competitors || analysis.competitors.length === 0))) {
        return null;
    }

    return (
        <div className="bg-white/5 border border-white/10 p-3 rounded-xl mb-4 font-mono text-xs backdrop-blur-sm pointer-events-auto hover:bg-white/10 transition-colors">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2 flex items-center gap-2">
                <Activity size={12} /> MARKET_COMPARISON
            </h4>
            <div className="space-y-3">
                {analysis.verdict && (
                    <div className="flex items-start gap-3">
                        <span className="text-green-500 shrink-0 mt-0.5"><Check size={14} /></span>
                        <span className="text-[10px] md:text-xs text-gray-300 leading-relaxed">{analysis.verdict}</span>
                    </div>
                )}
                {analysis.competitors && analysis.competitors.length > 0 && (
                    <div className="flex items-start gap-3">
                        <span className="text-red-500 shrink-0 mt-0.5"><AlertTriangle size={14} /></span>
                        <span className="text-[10px] md:text-xs text-gray-400 leading-relaxed">
                            Competes with: <span className="text-white font-bold">{analysis.competitors.join(', ')}</span>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};

const SpecCard: React.FC<{ agent: Agent, accentColor: string }> = ({ agent, accentColor }) => {
    // Helper to extract pricing string safely
    const getPricingDisplay = () => {
        if (!agent.pricing_model) return 'UNKNOWN';
        if (typeof agent.pricing_model === 'string') return agent.pricing_model;
        return agent.pricing_model.type || agent.pricing_model.price || 'CUSTOM';
    };
    
    const pricingDisplay = getPricingDisplay();
    const isFree = pricingDisplay.toLowerCase().includes('free') || pricingDisplay.toLowerCase().includes('open');
    const architecture = agent.technical_specs?.architecture || 'CLASSIFIED';
    const isOpenSource = agent.technical_specs?.open_source;

    return (
        <div className="bg-black/40 border border-white/10 p-3 rounded-xl mb-4 backdrop-blur-md pointer-events-auto hover:border-white/20 transition-colors">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Layout size={12} /> SYSTEM_SPECS
            </h4>
            <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[10px] text-gray-400 font-mono">PRICING_TIER</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono tracking-wider ${
                        isFree 
                        ? 'text-matrix-green border border-matrix-green/30 bg-matrix-green/10' 
                        : 'text-yellow-500 border border-yellow-500/30 bg-yellow-500/10'
                    }`}>
                        {pricingDisplay.toUpperCase()}
                    </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[10px] text-gray-400 font-mono">ARCHITECTURE</span>
                    <span className="text-[10px] text-white font-mono">{architecture}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-mono">DEPLOYMENT</span>
                    <div className="flex gap-1.5">
                        <span className={`w-5 h-5 border rounded flex items-center justify-center text-[10px] transition-colors cursor-help ${isOpenSource ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-gray-300'}`} title="Open Source">
                            <Globe size={10} />
                        </span>
                        <span className="w-5 h-5 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[10px] text-gray-300 hover:bg-white/20 transition-colors cursor-help" title="API Access">
                            <Server size={10} />
                        </span>
                        <span className="w-5 h-5 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[10px] text-gray-300 hover:bg-white/20 transition-colors cursor-help" title="Local Run">
                            <HardDrive size={10} />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN MODULE ---

interface DataDeckProps {
    agent: Agent;
    accentColor: string;
}

export const DataDeck: React.FC<DataDeckProps> = ({ agent, accentColor }) => {
    const [linkedEntities, setLinkedEntities] = useState<any[]>([]);
    const [isLoadingLinks, setIsLoadingLinks] = useState(false);
    const setActiveAgentId = useUIStore((s: UIState) => s.setActiveAgentId);
    const setCurrentView = useUIStore((s: UIState) => s.setCurrentView);

    useEffect(() => {
        const fetchLinks = async () => {
            if (!agent?.id || !supabase) return;
            console.log('[YouAgent] Scanning Neural Links for:', agent.name); // DEBUG LOG
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
                
                if (error) console.error('[YouAgent] Link Fracture:', error);
                if (data) {
                    console.log('[YouAgent] Links Found:', data.length);
                    setLinkedEntities(data);
                }
            } catch (err) {
                console.error("[YouAgent] Failed to fetch neural links:", err);
            } finally {
                setIsLoadingLinks(false);
            }
        };
        
        fetchLinks();
    }, [agent]);

    return (
        <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-4"
        >
            {/* 1. Spec Card (Decision Data) */}
            <SpecCard agent={agent} accentColor={accentColor} />

            {/* 2. Comparison Radar */}
            <ComparisonRadar agent={agent} />

            {/* 3. Intel Feed */}
            <IntelPreview agent={agent} accentColor={accentColor} />

            {/* 4. Detailed Technical Specs */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-colors">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <Database size={12} /> TECHNICAL_DEEP_DIVE
                </div>
                <TacticalSpecs agent={agent} color={accentColor} />
            </div>

            {/* 5. Prompt Terminal */}
            <div className="hidden md:block">
                <PromptTerminal prompts={agent.system_prompts} color={accentColor} />
            </div>

            {/* V13.0: Sponsored Sidebar Cube */}
            <AdFrame type="CUBE" />

            {/* --- FORCE INJECTION: SYNAPTIC ECOSYSTEM LINKS --- */}
            <div className="w-full mt-10 pt-6 border-t border-slate-800/50 mb-20">
              <h3 className="text-sm font-mono text-slate-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                {agent.entity_type === 'ai_agent' ? '[_POWERED_BY_BASE_MODELS]' : '[_ECOSYSTEM_APPLICATIONS]'}
              </h3>
              
              {/* RENDER LINKS */}
              {linkedEntities && linkedEntities.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {linkedEntities.map(entity => (
                    <div 
                        key={entity.id} 
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveAgentId(entity.id);
                            setCurrentView('lounge'); // Ensure we stay in lounge or reload it
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 transition-all rounded flex flex-col gap-1 cursor-pointer active:scale-95"
                    >
                      <span className="text-cyan-400 font-bold text-xs truncate">{entity.name}</span>
                      <span className="text-slate-600 text-[10px] uppercase">{entity.entity_type}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-600 font-mono text-xs italic p-4 border border-dashed border-slate-800 rounded">
                  // NO NEURAL LINKS DETECTED IN SECTOR
                </div>
              )}
            </div>
            {/* ----------------------------------------- */}

        </motion.div>
    );
};
