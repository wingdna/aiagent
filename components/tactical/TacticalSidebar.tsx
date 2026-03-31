import React, { useState } from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Shield, Cpu, Zap, Tag, Check, ChevronDown, ChevronUp, Activity, FileText, Database, Info, Terminal } from 'lucide-react';
import { Link } from 'react-router';

interface TacticalSidebarProps {
    agent: AgentRegistryEntity;
}

export const TacticalSidebar: React.FC<TacticalSidebarProps> = ({ agent }) => {
    const [expandedTier, setExpandedTier] = useState<number | null>(0);
    const specs = agent.specs || {};
    const techSpecs = agent.technical_specs || {};
    
    // Fallbacks for specs
    const architecture = techSpecs.architecture || techSpecs.model_architecture || 'UNKNOWN';
    const contextWindow = specs.context_window || 'UNKNOWN';
    const precision = techSpecs.precision || techSpecs.format || 'UNKNOWN';
    const frameworks = Array.isArray(agent.framework_stack) ? agent.framework_stack : [];
    
    const maxOutput = techSpecs.max_output_tokens || specs.max_output_tokens || 'UNKNOWN';
    const deployment = (agent as any).deployment_type || specs.deployment_type || 'UNKNOWN';
    
    const pricingTiers = agent.pricing?.tiers || [];

    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Module A: [ AUTHORIZATION ] */}
            <div className="bg-black/40 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-cyan-400 uppercase tracking-widest border-b border-cyan-500/20 pb-1.5">
                    <Shield size={12} /> AUTHORIZATION
                </div>
                
                <div className="flex flex-col gap-2.5">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] text-white/50 font-mono">STATUS</span>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"></span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">ACTIVE</span>
                        </div>
                    </div>
                    
                    {(agent.official_url || agent.connectivity?.try_url) && (
                        <a 
                            href={agent.official_url || agent.connectivity?.try_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 rounded text-cyan-400 font-mono text-[10px] font-bold text-center transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.2)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] uppercase tracking-wider"
                        >
                            LAUNCH_TERMINAL
                        </a>
                    )}
                </div>
            </div>

            {/* Module B: [ SYSTEM_SPECS ] */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1.5">
                    <Cpu size={12} /> SYSTEM_SPECS
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-3">
                    {specs.license && specs.license !== 'UNKNOWN' && (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-white/50 font-mono">LICENSE</span>
                            <Link to={`/directory?q=${encodeURIComponent(specs.license)}`} className={`text-[11px] font-mono font-bold hover:underline ${specs.license === 'Proprietary' ? 'text-yellow-500' : 'text-emerald-400'}`}>
                                {specs.license.toUpperCase()}
                            </Link>
                        </div>
                    )}
                    {specs.last_verified && specs.last_verified !== 'UNKNOWN' && (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-white/50 font-mono">LAST_VERIFIED</span>
                            <span className="text-[11px] font-mono font-bold text-white">
                                {specs.last_verified}
                            </span>
                        </div>
                    )}
                    {architecture && architecture !== 'UNKNOWN' && (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-white/50 font-mono">ARCHITECTURE</span>
                            <Link to={`/directory?q=${encodeURIComponent(architecture)}`} className="text-[11px] font-mono font-bold text-white hover:text-cyan-400 hover:underline transition-colors">
                                {architecture.toUpperCase()}
                            </Link>
                        </div>
                    )}
                    {contextWindow && contextWindow !== 'UNKNOWN' && (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-white/50 font-mono">CONTEXT_WINDOW</span>
                            <span className="text-[11px] font-mono font-bold text-cyan-400">
                                {contextWindow}
                            </span>
                        </div>
                    )}
                    {precision && precision !== 'UNKNOWN' && (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-white/50 font-mono">PRECISION/FORMAT</span>
                            <span className="text-[11px] font-mono font-bold text-white">
                                {precision.toUpperCase()}
                            </span>
                        </div>
                    )}
                    {frameworks.length > 0 && (
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] text-white/50 font-mono">FRAMEWORKS</span>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                                {frameworks.map((fw: string, i: number) => (
                                    <Link key={i} to={`/directory?q=${encodeURIComponent(fw)}`} className="text-[8px] px-1 py-0.5 bg-white/5 border border-white/10 rounded text-white/70 font-mono hover:bg-cyan-500/20 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors">
                                        {fw.toUpperCase()}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Module C: [ PRICING_INTEL_DECK ] */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex-1">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1.5">
                    <Zap size={12} /> PRICING_INTEL_DECK
                </div>
                <div className="space-y-1">
                    {pricingTiers.length > 0 ? (
                        pricingTiers.map((tier: any, index: number) => {
                            const isExpanded = expandedTier === index;
                            const cleanPrice = String(tier.price || '').replace(/\$+/g, '').trim();
                            let priceStr = tier.price === 0 || tier.price === '0' || cleanPrice.toLowerCase() === 'free' || cleanPrice === ''
                                ? 'FREE' 
                                : `$${cleanPrice}`;
                            if (priceStr !== 'FREE' && tier.unit) {
                                priceStr += `/${tier.unit}`;
                            }
                            
                            return (
                                <div key={index} className="flex flex-col border border-white/5 bg-black/40 rounded-xl overflow-hidden mb-3">
                                    {/* 头部：始终可见，点击切换展开状态 */}
                                    <button 
                                        onClick={() => setExpandedTier(isExpanded ? null : index)}
                                        className="flex justify-between items-center p-3 hover:bg-white/5 transition-colors"
                                    >
                                        <span className="text-lg font-bold text-cyan-400">{priceStr}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] bg-white/10 px-1.5 rounded text-white/50">{tier.name || `TIER ${index + 1}`}</span>
                                            {isExpanded ? <ChevronUp size={14} className="text-cyan-400"/> : <ChevronDown size={14} className="text-white/30"/>}
                                        </div>
                                    </button>

                                    {/* 内容区：折叠显示 */}
                                    {isExpanded && tier.features && (
                                        <div className="p-3 pt-0 border-t border-white/5 bg-black/60">
                                            <ul className="flex flex-col gap-2 mt-3 mb-4">
                                                {tier.features.map((feature: string, fIndex: number) => (
                                                    <li key={fIndex} className="flex items-start gap-2 text-[11px] text-white/70 font-mono">
                                                        <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                                                        <span>{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <button className="w-full py-1.5 text-[10px] font-bold text-cyan-400 border border-cyan-400/30 rounded hover:bg-cyan-400/10 transition-colors">
                                                SELECT_NODE
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex justify-between items-baseline py-1.5">
                            <span className="text-[10px] text-white/50 font-mono">STANDARD ACCESS</span>
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                                {agent.pricing?.model || (specs.license === 'Open Source' || specs.license === 'Apache 2.0' || specs.license === 'MIT' ? 'FREE' : 'UNKNOWN')}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Module D: [ FAQ_BRIEF // SYSTEM_INTEL ] */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-white uppercase tracking-widest">
                        <Terminal size={12} className="text-cyan-400" /> FAQ_BRIEF // SYSTEM_INTEL
                    </div>
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/50"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/30"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500/10"></span>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    {agent.faq && agent.faq.length > 0 ? (
                        agent.faq.slice(0, 2).map((item: any, i: number) => (
                            <div key={i} className="flex flex-col gap-1">
                                <div className="text-[10px] text-cyan-400 font-mono font-bold truncate">
                                    {'>_'} {item.question || item.q}
                                </div>
                                <div className="text-[9px] text-white/50 font-mono line-clamp-2">
                                    {item.answer || item.a}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-[10px] text-white/30 font-mono italic">
                            NO_INTEL_ARCHIVED_YET
                        </div>
                    )}
                </div>
                <div className="mt-4 text-center">
                    <Link 
                        to={`/agent/${agent.slug || agent.id}/lounge`} 
                        className="text-[9px] text-cyan-500/60 font-mono hover:text-cyan-400 cursor-pointer transition-colors uppercase tracking-tighter"
                    >
                        ACCESS_FULL_INTEL_LOUNGE &gt;&gt;
                    </Link>
                </div>
            </div>

            {/* Module E: [ TECHNICAL_DEEP_DIVE ] */}
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-gray-400 uppercase tracking-widest border-b border-white/10 pb-1.5">
                    <Database size={12} /> TECHNICAL_DEEP_DIVE
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1 border border-white/5 rounded p-2 bg-white/5">
                        <span className="text-[9px] text-white/50 font-mono">&gt;_ DEPLOYMENT</span>
                        <div className="flex items-center gap-1">
                            <Link to={`/directory?q=${encodeURIComponent(deployment)}`} className="text-[11px] font-mono font-bold text-white truncate hover:text-cyan-400 hover:underline transition-colors">
                                {deployment}
                            </Link>
                            <Info size={10} className="text-white/30 shrink-0" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 border border-white/5 rounded p-2 bg-white/5">
                        <span className="text-[9px] text-white/50 font-mono">&gt;_ MAX OUTPUT</span>
                        <span className="text-[11px] font-mono font-bold text-white truncate">{maxOutput}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
