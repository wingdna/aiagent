import React from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { CornerDownLeft, Cpu, Activity, Hexagon, Coins } from 'lucide-react';
import { Link, useOutletContext } from 'react-router';

interface AgentIntelProps {
    agent: AgentRegistryEntity;
    pricingLabel: string | null;
    pricingDisplay: string | null;
    contextLabel: string | null;
    architectureLabel: string | null;
    validCategories?: string[];
}

export const AgentIntel: React.FC<AgentIntelProps> = ({ agent, pricingLabel, pricingDisplay, contextLabel, architectureLabel, validCategories: propValidCategories }) => {
    const nriScore = Number(agent.metrics?.nri_score || 0);
    const reasoningScore = agent.metrics?.logic_unit || 0;
    const speedScore = agent.metrics?.velocity || 0;

    // 🛡️ Protocol V12: Category Integrity Check
    let contextValidCategories: string[] = [];
    try {
        const context = useOutletContext<any>();
        if (context && context.validCategories) {
            contextValidCategories = context.validCategories;
        }
    } catch (e) {
        // Ignore if not inside an outlet
    }

    const validCategories = propValidCategories || contextValidCategories;

    // Split pricing display into individual tiers if it contains multiple prices
    const pricingTiers = pricingDisplay ? pricingDisplay.split('   ').filter(Boolean) : [];

    return (
        <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-white/10 relative overflow-hidden group/intel">
            {/* Row 1: Category & Action */}
            <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    <Link to={`/?category=${encodeURIComponent(agent.category || 'ALL')}`} className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-[0.2em] text-cyan-400 hover:text-cyan-300 drop-shadow-[0_0_3px_rgba(34,211,238,0.3)] transition-colors relative z-10" onClick={(e) => e.stopPropagation()}>
                        {agent.category || "ENTITY"}
                    </Link>
                </div>
                <div className="text-cyan-400/30 group-hover/intel:text-cyan-400 transition-colors transition-transform duration-500 transform group-hover/intel:translate-x-0.5 group-hover/intel:-translate-y-0.5">
                    <CornerDownLeft size={14} strokeWidth={2.5} />
                </div>
            </div>

            {/* Row 2: Unified Metrics (NRI, LOGIC, SPEED) - Tactical Matrix Style */}
            <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 shadow-[inset_0_0_25px_rgba(34,211,238,0.03)] overflow-hidden group/matrix">
                {/* Micro-grid background */}
                <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:6px_6px]"></div>
                
                {/* Tactical Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                    <div className="w-full h-[1px] bg-cyan-400/30 absolute top-0 animate-[scanline_4s_linear_infinite]"></div>
                </div>

                <div className="relative flex items-center justify-between gap-2">
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* NRI - The Glowing Core */}
                        <div className="flex items-center gap-2 group/metric cursor-help" title="Neural Resonance Index">
                            <div className="relative">
                                <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full animate-pulse"></div>
                                <Hexagon size={16} className="relative text-cyan-400 fill-cyan-400/20 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] transition-transform duration-700 group-hover/matrix:rotate-90" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping shadow-[0_0_10px_#fff]"></div>
                                </div>
                            </div>
                            <div className="flex flex-col -space-y-1">
                                <span className="text-[8px] sm:text-[10px] text-cyan-500/70 font-mono font-black leading-none tracking-[0.15em] uppercase mb-1">NRI_CORE</span>
                                <span className="text-[14px] sm:text-base font-mono font-black text-white leading-none tracking-tighter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                                    {nriScore.toFixed(1)}
                                </span>
                            </div>
                        </div>

                        {/* Logic (Reasoning) */}
                        <div className="flex items-center gap-2 group/metric cursor-help" title="Logic Reasoning">
                            <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20">
                                <Cpu size={14} className="text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                            </div>
                            <div className="flex flex-col -space-y-1">
                                <span className="text-[8px] sm:text-[10px] text-blue-500/70 font-mono font-black leading-none tracking-[0.15em] uppercase mb-1">LOGIC_UNIT</span>
                                <span className="text-[12px] sm:text-sm font-mono font-black text-white/90 leading-none tracking-tighter">
                                    {reasoningScore}
                                </span>
                            </div>
                        </div>

                        {/* Speed */}
                        <div className="flex items-center gap-2 group/metric cursor-help" title="Processing Speed">
                            <div className="p-1 rounded bg-purple-500/10 border border-purple-500/20">
                                <Activity size={14} className="text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.6)]" />
                            </div>
                            <div className="flex flex-col -space-y-1">
                                <span className="text-[8px] sm:text-[10px] text-purple-500/70 font-mono font-black leading-none tracking-[0.15em] uppercase mb-1">VELOCITY</span>
                                <span className="text-[12px] sm:text-sm font-mono font-black text-white/90 leading-none tracking-tighter">
                                    {speedScore}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 3: Price (Separate Line) - Multi-Box Style */}
            {pricingTiers.length > 0 && (
                <div className="flex items-center gap-2 px-1 py-1">
                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20">
                        <Coins size={12} className="text-amber-400" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {pricingTiers.map((price, idx) => {
                            // Clean up multiple dollar signs
                            const cleanPrice = price.replace(/\$+/g, '$');
                            const isFree = cleanPrice.toUpperCase() === 'FREE';
                            const isOpenSource = cleanPrice.toUpperCase() === 'OPEN SOURCE';
                            const isMore = cleanPrice === '...';
                            
                            // Extract numeric part for highlighting
                            const match = cleanPrice.match(/(\$?\d+(\.\d+)?)/);
                            const numericPart = match ? match[0] : cleanPrice;
                            const restPart = match ? cleanPrice.replace(numericPart, '') : '';

                            return (
                                <div 
                                    key={idx}
                                    className={`flex items-center px-2 py-0.5 rounded border font-mono font-bold text-[10px] sm:text-xs transition-colors
                                        ${(isFree || isOpenSource)
                                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400/60' 
                                            : isMore
                                                ? 'bg-transparent border-transparent text-white/40 px-0'
                                                : 'bg-white/[0.03] border-white/10 text-white/40'
                                        }`}
                                >
                                    <span className={(isFree || isOpenSource) ? 'text-emerald-400' : (isMore ? 'text-white/40 tracking-widest' : 'text-white/90')}>
                                        {isFree || isOpenSource || isMore ? cleanPrice : numericPart}
                                    </span>
                                    {!(isFree || isOpenSource || isMore) && <span className="opacity-60">{restPart}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Row 4: Secondary Specs - Micro-labels */}
            {(contextLabel || architectureLabel) && (
                <div className="flex flex-wrap items-center gap-3 pt-1">
                    {contextLabel && (
                        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-white/[0.03] border border-white/[0.05] text-white/50 hover:text-cyan-400 transition-colors cursor-default">
                            <span className="text-white/20">CTX_WINDOW:</span>
                            <span className="tracking-tighter">{contextLabel}</span>
                        </div>
                    )}
                    {architectureLabel && (
                        <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-white/[0.03] border border-white/[0.05] text-white/50 hover:text-blue-400 transition-colors cursor-default">
                            <span className="text-white/20">ARCH_TYPE:</span>
                            <span className="tracking-tighter">{architectureLabel}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Row 5: Tags - Tactical Cloud */}
            {agent.capabilities && agent.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                    {agent.capabilities
                        .filter(tag => {
                            if (!tag || tag === 'NEW_DISCOVERY') return false;
                            // 🛡️ Only show tags that are valid categories to ensure non-empty results
                            if (validCategories && !validCategories.includes(tag)) return false;
                            return true;
                        })
                        .slice(0, 5)
                        .map((tag, idx) => (
                            <Link 
                                key={idx}
                                to={`/?category=${encodeURIComponent(tag)}`}
                                className="text-[8px] sm:text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-white/[0.02] border border-white/[0.05] text-white/30 hover:text-cyan-400 hover:border-cyan-400/30 hover:bg-cyan-400/5 transition-all relative z-10"
                                onClick={(e) => e.stopPropagation()}
                            >
                                #{tag.toUpperCase()}
                            </Link>
                        ))
                    }
                </div>
            )}
        </div>
    );
};
