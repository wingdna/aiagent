import React, { useState, useEffect, Suspense } from 'react';
import { m } from 'framer-motion';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Activity, Check, AlertTriangle, Layout, Globe, Server, HardDrive, Database } from 'lucide-react';
import { IntelPreview } from '../shared/IntelPreview';
import { TacticalSpecs } from '../shared/TacticalSpecs';
import { PromptTerminal } from '../shared/PromptTerminal';
import { supabase } from '../../lib/supabase';
import { UIState, useUIStore } from '../../stores/useUIStore';
import { PricingMatrix } from './PricingMatrix';
import { NeuralLinks } from './NeuralLinks';

// --- SUB-COMPONENTS (Locally Scoped) ---

const ComparisonRadar: React.FC<{ agent: AgentRegistryEntity }> = ({ agent }) => {
    return null;
};

const SpecCard: React.FC<{ agent: AgentRegistryEntity, accentColor: string }> = ({ agent, accentColor }) => {
    // Helper to extract pricing string safely
    const getPricingDisplay = () => {
        const pricingDetails = agent.pricing?.details;
        if (!pricingDetails) return 'UNKNOWN';
        if (typeof pricingDetails === 'string') return pricingDetails;
        return pricingDetails.type || pricingDetails.price || 'CUSTOM';
    };
    
    const pricingDisplay = getPricingDisplay();
    const isFree = String(pricingDisplay).toLowerCase().includes('free') || String(pricingDisplay).toLowerCase().includes('open');
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
                        ? 'text-cyan-400 border border-cyan-500/30 bg-cyan-500/10' 
                        : 'text-yellow-500 border border-yellow-500/30 bg-yellow-500/10'
                    }`}>
                        {String(pricingDisplay).toUpperCase()}
                    </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[10px] text-gray-400 font-mono">ARCHITECTURE</span>
                    <span className="text-[10px] text-white font-mono">{String(architecture)}</span>
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

import { useInView } from 'react-intersection-observer';
import { useNavigate } from 'react-router';

// ... MAIN MODULE ...

interface DataDeckProps {
    agent: AgentRegistryEntity;
    accentColor: string;
}

export const DataDeck: React.FC<DataDeckProps> = ({ agent, accentColor }) => {
    const { ref: bottomRef, inView: bottomInView } = useInView({
        triggerOnce: true,
        rootMargin: '200px', // Load slightly before it comes into view
    });

    return (
        <m.div 
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

            {/* 5. Prompt Terminal - REMOVED due to missing data */}
            {/* <div className="hidden md:block">
                <PromptTerminal prompts={agent.system_prompts} color={accentColor} />
            </div> */}
            
            {/* Intersection Observer Trigger Point */}
            <div ref={bottomRef} className="h-1 w-full" />

            {/* 6. Pricing Matrix (Economic Reality) */}
            {bottomInView && (
                <PricingMatrix agent={agent} />
            )}

            {/* --- FORCE INJECTION: SYNAPTIC ECOSYSTEM LINKS --- */}
            {bottomInView && (
                <NeuralLinks agent={agent} />
            )}
            {/* ----------------------------------------- */}

        </m.div>
    );
};
