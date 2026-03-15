import React from 'react';
import { Agent } from '../../types';
import { Layout, Globe, Server, HardDrive, Database } from 'lucide-react';
import { IntelPreview } from '../shared/IntelPreview';
import { TacticalSpecs } from '../shared/TacticalSpecs';
import { PromptTerminal } from '../shared/PromptTerminal';

// --- SUB-COMPONENTS (Locally Scoped) ---

const SpecCard: React.FC<{ agent: Agent, accentColor: string }> = ({ agent, accentColor }) => {
    // Helper to extract pricing string safely
    const getPricingDisplay = () => {
        if (!agent.pricing_model) return null; // Don't show if missing
        if (typeof agent.pricing_model === 'string') return agent.pricing_model;
        return (agent.pricing_model as any).type || (agent.pricing_model as any).price || 'CUSTOM';
    };
    
    const pricingDisplay = getPricingDisplay();
    const isFree = String(pricingDisplay).toLowerCase().includes('free') || String(pricingDisplay).toLowerCase().includes('open');
    
    // Dynamic Specs Extraction
    const specs = agent.technical_specs || {};
    const architecture = specs.architecture || specs.model_architecture;
    const version = agent.version || specs.version;
    const license = specs.license || specs.open_source ? 'OPEN SOURCE' : null;

    return (
        <div className="bg-black/40 border border-white/10 p-3 rounded-xl mb-4 backdrop-blur-md pointer-events-auto hover:border-white/20 transition-colors">
            <h4 className="text-[10px] text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Layout size={12} /> SYSTEM_SPECS
            </h4>
            <div className="space-y-3">
                {/* PRICING TIER */}
                {pricingDisplay && (
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
                )}

                {/* VERSION */}
                {version && (
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] text-gray-400 font-mono">VERSION</span>
                        <span className="text-[10px] text-white font-mono">v{String(version)}</span>
                    </div>
                )}

                {/* ARCHITECTURE */}
                {architecture && (
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] text-gray-400 font-mono">ARCHITECTURE</span>
                        <span className="text-[10px] text-white font-mono">{String(architecture)}</span>
                    </div>
                )}

                {/* LICENSE / DEPLOYMENT */}
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-mono">DEPLOYMENT</span>
                    <div className="flex gap-1.5">
                        {/* CLOUD */}
                        <span className={`w-5 h-5 border rounded flex items-center justify-center text-[10px] transition-colors cursor-help ${!license ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-500'}`} title="Cloud / API">
                            <Globe size={10} />
                        </span>
                        {/* LOCAL */}
                        <span className={`w-5 h-5 border rounded flex items-center justify-center text-[10px] transition-colors cursor-help ${license ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-500'}`} title="Local / On-Prem">
                            <HardDrive size={10} />
                        </span>
                        {/* EDGE */}
                        <span className="w-5 h-5 bg-white/5 border border-white/10 rounded flex items-center justify-center text-[10px] text-gray-500 hover:bg-white/10 transition-colors cursor-help" title="Edge Ready">
                            <Server size={10} />
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ... MAIN MODULE ...

interface TileIntelProps {
    agent: Agent;
    accentColor: string;
}

export const TileIntel: React.FC<TileIntelProps> = ({ agent, accentColor }) => {
    return (
        <div className="space-y-4 h-full flex flex-col">
            {/* 1. Spec Card (Decision Data) */}
            <SpecCard agent={agent} accentColor={accentColor} />

            {/* 2. Intel Feed */}
            <IntelPreview agent={agent} accentColor={accentColor} />

            {/* 3. Detailed Technical Specs */}
            <div className="bg-black/20 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-colors flex-1">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <Database size={12} /> TECHNICAL_DEEP_DIVE
                </div>
                <TacticalSpecs agent={agent} color={accentColor} />
            </div>
        </div>
    );
};
