import React from 'react';
import { m } from 'framer-motion';
import { X, ExternalLink, Terminal, Activity, Shield, Cpu, Zap, Globe, DollarSign, Star, Search } from 'lucide-react';
import { AgentCard } from './AgentCard';
import { mapToRegistry } from '../../utils/mapper';

interface TerminalRendererProps {
    cliResult: any;
    onClose: () => void;
}

export const TerminalRenderer: React.FC<TerminalRendererProps> = ({ cliResult, onClose }) => {
    if (!cliResult) return null;

    if (cliResult.type === 'intel') {
        const agent = cliResult.data;
        if (!agent) {
            return (
                <div className="flex flex-col items-center justify-center py-20 text-red-500 font-mono">
                    <Terminal size={48} className="mb-4 opacity-50" />
                    <div>[ERROR] AGENT_DATA_NOT_FOUND</div>
                </div>
            );
        }

        const pricing = agent.pricing || {};
        const specs = agent.specs || {};
        const intelLinks = agent.seo_metadata?.intel || [];

        return (
            <m.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full h-full flex flex-col font-mono text-cyan-400 bg-black/60 backdrop-blur-xl border border-cyan-500/30 rounded-xl overflow-hidden relative"
            >
                {/* Scanline effect */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
                    <div className="w-full h-[2px] bg-cyan-400 animate-scan" />
                </div>

                {/* Header */}
                <div className="p-4 border-b border-cyan-500/30 bg-cyan-950/30 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <Terminal size={18} />
                        <span className="font-bold tracking-widest uppercase">INTEL_REPORT :: {agent.slug || agent.id}</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-cyan-500/20 rounded text-cyan-400/70 hover:text-cyan-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto cyber-scroll p-6 space-y-8">
                    {/* Row 1: Name & NRI */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cyan-500/20 pb-4">
                        <div>
                            <div className="text-xs text-cyan-400/50 mb-1">ENTITY_DESIGNATION</div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider uppercase">{agent.name}</h1>
                            <div className="text-sm text-cyan-400/70 mt-2">{agent.description}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-cyan-400/50 mb-1">NRI_SCORE</div>
                            <div className="text-4xl font-bold text-cyan-300 flex items-center justify-end gap-2">
                                <Activity size={24} className="text-cyan-500" />
                                {agent.metrics?.nri_score?.toFixed(1) || 'N/A'}
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Pricing */}
                    <div>
                        <div className="text-xs text-cyan-400/50 mb-3 flex items-center gap-2">
                            <DollarSign size={14} />
                            FINANCIAL_REQUIREMENTS
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-cyan-950/20 border border-cyan-500/20 p-3 rounded">
                                <div className="text-[10px] text-cyan-400/50 mb-1">MODEL</div>
                                <div className="text-sm text-white uppercase">{pricing.model || 'UNKNOWN'}</div>
                            </div>
                            <div className="bg-cyan-950/20 border border-cyan-500/20 p-3 rounded">
                                <div className="text-[10px] text-cyan-400/50 mb-1">OSS_STATUS</div>
                                <div className="text-sm text-white uppercase">{pricing.isOSS ? 'OPEN_SOURCE' : 'PROPRIETARY'}</div>
                            </div>
                            <div className="bg-cyan-950/20 border border-cyan-500/20 p-3 rounded">
                                <div className="text-[10px] text-cyan-400/50 mb-1">TIERS</div>
                                <div className="text-sm text-white">
                                    {pricing.tiers && pricing.tiers.length > 0 ? (
                                        pricing.tiers.map((t: any, i: number) => (
                                            <div key={i} className="flex justify-between">
                                                <span>{t.name || 'BASE'}:</span>
                                                <span>{t.price || 'FREE'} {t.unit ? `/${t.unit}` : ''}</span>
                                            </div>
                                        ))
                                    ) : (
                                        'NO_DATA'
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Specs */}
                    <div>
                        <div className="text-xs text-cyan-400/50 mb-3 flex items-center gap-2">
                            <Cpu size={14} />
                            TECHNICAL_SPECIFICATIONS
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {Object.entries(specs).map(([key, value]) => {
                                if (typeof value === 'object' || value === null || value === undefined) return null;
                                return (
                                    <div key={key} className="bg-black/40 border border-cyan-500/10 p-2 rounded flex flex-col justify-center">
                                        <div className="text-[9px] text-cyan-400/40 uppercase truncate" title={key}>{key.replace(/_/g, ' ')}</div>
                                        <div className="text-xs text-cyan-100 truncate" title={String(value)}>{String(value)}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Row 4: Intel Links */}
                    {intelLinks && intelLinks.length > 0 && (
                        <div>
                            <div className="text-xs text-cyan-400/50 mb-3 flex items-center gap-2">
                                <Globe size={14} />
                                EXTERNAL_INTELLIGENCE
                            </div>
                            <div className="space-y-2">
                                {intelLinks.map((link: any, index: number) => (
                                    <a 
                                        key={index} 
                                        href={link.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-3 bg-cyan-950/10 border border-cyan-500/20 rounded hover:bg-cyan-900/30 hover:border-cyan-400 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <ExternalLink size={14} className="text-cyan-500 group-hover:text-cyan-300" />
                                            <span className="text-sm text-cyan-100 group-hover:text-white">{link.title || link.url}</span>
                                        </div>
                                        <span className="text-[10px] text-cyan-400/40 group-hover:text-cyan-400/70">ACCESS_LINK</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </m.div>
        );
    }

    if (cliResult.type === 'find') {
        const agents = cliResult.data || [];
        return (
            <m.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full h-full flex flex-col font-mono text-cyan-400"
            >
                <div className="flex items-center justify-between mb-6 pb-2 border-b border-cyan-500/30">
                    <div className="flex items-center gap-3">
                        <Search size={18} />
                        <span className="font-bold tracking-widest uppercase">QUERY_RESULTS :: {agents.length} ENTITIES FOUND</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-cyan-500/20 rounded text-cyan-400/70 hover:text-cyan-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {agents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto cyber-scroll pr-2 pb-4">
                        {agents.map((agent: any) => (
                            <AgentCard 
                                key={agent.id} 
                                agent={mapToRegistry(agent)} 
                                onClick={onClose}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-cyan-400/50">
                        <Shield size={48} className="mb-4 opacity-20" />
                        <div>NO_ENTITIES_MATCH_PARAMETERS</div>
                    </div>
                )}
            </m.div>
        );
    }

    return null;
};
