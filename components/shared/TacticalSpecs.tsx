import React from 'react';
import { AgentRegistryEntity } from '../../app/types/registry';
import { Check, X, Terminal, Cpu, Database, Layers, Zap, Globe, Shield, Code, Info } from 'lucide-react';

interface TacticalSpecsProps {
    agent: AgentRegistryEntity;
    color: string;
}

/**
 * COMPONENT: TACTICAL_CONFIG (Dynamic System Specs)
 * Protocol V9.0: Fully Dynamic JSONB Rendering.
 * Behavior: 
 * - Iterates over agent.technical_specs keys.
 * - Renders Booleans as Icons.
 * - Renders Strings/Numbers as High-Contrast Text.
 * - Horizontal Scroll for dense data.
 */
export const TacticalSpecs: React.FC<TacticalSpecsProps> = ({ agent, color }) => {
    const specs = agent.technical_specs || {};
    const entries = Object.entries(specs);

    // Ghost Mode: If no specs, return null
    if (entries.length === 0) return null;

    // Helper to format keys (snake_case to UPPER CASE)
    const formatKey = (key: string) => key.replace(/_/g, ' ').toUpperCase();

    // Helper to determine icon based on key name (Heuristic)
    const getIcon = (key: string) => {
        const k = key.toLowerCase();
        if (k.includes('model') || k.includes('param')) return Cpu;
        if (k.includes('context') || k.includes('window')) return Database;
        if (k.includes('license')) return Shield;
        if (k.includes('source')) return Code;
        if (k.includes('api')) return Globe;
        if (k.includes('speed') || k.includes('latency')) return Zap;
        if (k.includes('layer') || k.includes('arch')) return Layers;
        return Terminal; // Default
    };

    return (
        <div className="w-full mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Technical Specs Horizontal Scroll */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
                {entries.map(([key, value], idx) => {
                    // Skip null/undefined values
                    if (value === null || value === undefined || value === '') return null;

                    const Icon = getIcon(key);
                    const isBoolean = typeof value === 'boolean';
                    const stringValue = String(value);
                    const isLongText = stringValue.length > 20;

                    return (
                        <div key={key} className="flex-shrink-0 w-32 md:w-40 flex flex-col p-3 bg-black/40 border border-white/10 rounded-lg hover:border-white/20 transition-colors group snap-start relative overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center gap-2 text-[9px] font-mono text-gray-500 mb-2 tracking-widest uppercase group-hover:text-cyan-400 transition-colors truncate">
                                <Icon size={10} className="shrink-0" />
                                <span className="truncate">{formatKey(key)}</span>
                            </div>
                            
                            {/* Value */}
                            <div className="text-xs font-mono font-bold text-gray-200 flex items-center gap-2 h-full">
                                {isBoolean ? (
                                    value ? (
                                        <span className="flex items-center gap-1.5 text-emerald-400">
                                            <Check size={14} /> ENABLED
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-red-400">
                                            <X size={14} /> DISABLED
                                        </span>
                                    )
                                ) : (
                                    <div className="relative w-full group/tooltip flex items-center">
                                        <span className={`text-white tracking-tight block ${isLongText ? 'truncate max-w-[80%]' : 'whitespace-normal break-words'}`}>
                                            {stringValue}
                                        </span>
                                        {isLongText && (
                                            <Info size={12} className="text-gray-500 ml-1 shrink-0 group-hover/tooltip:text-cyan-400 transition-colors cursor-help" />
                                        )}
                                        {/* Tooltip for long text */}
                                        {isLongText && (
                                            <div className="absolute bottom-full left-0 mb-2 w-max max-w-[250px] bg-slate-900 border border-slate-700 p-3 rounded-lg text-xs text-slate-200 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-2xl backdrop-blur-xl whitespace-pre-wrap leading-relaxed">
                                                {stringValue}
                                                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-slate-900 border-b border-r border-slate-700 transform rotate-45" />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Decorative Corner */}
                            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 rounded-tr opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};