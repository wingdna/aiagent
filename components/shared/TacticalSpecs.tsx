import React from 'react';
import { Agent } from '../../types';
import { Database, DollarSign, Cpu, Scale } from 'lucide-react';

interface TacticalSpecsProps {
    agent: Agent;
    color: string;
}

/**
 * COMPONENT: TACTICAL_CONFIG
 * Protocol V8.1: Consumes Real Database Fields.
 * Behavior: 
 * - If specs exist: Renders grid.
 * - If specs missing: Renders minimal "Offline" state or hides.
 * - Economic Vector: Defaults to "AWAITING_DATA" if null.
 */
export const TacticalSpecs: React.FC<TacticalSpecsProps> = ({ agent, color }) => {
    // Defensive extraction
    const specs = agent.specs;
    const hardware = agent.hardware_req;
    
    // V9.0: Handle Object-based Pricing Models (Supabase JSONB)
    let pricingDisplay = "AWAITING_DATA";
    if (agent.pricing_model) {
        if (typeof agent.pricing_model === 'string') {
            pricingDisplay = agent.pricing_model;
        } else if (typeof agent.pricing_model === 'object') {
            // Prefer 'type' field, fallback to price or JSON string
            pricingDisplay = agent.pricing_model.type || agent.pricing_model.price || "CUSTOM";
        }
    }

    // Ghost Mode: If absolutely no technical data exists, collapse the module.
    if (!specs && !hardware && !agent.pricing_model) return null;

    const SpecItem = ({ label, value, icon: Icon }: { label: string, value: string | undefined, icon?: any }) => (
        <div className="flex flex-col p-2 bg-white/5 border border-white/10 rounded">
            <div className="flex items-center gap-1.5 text-[8px] font-mono text-gray-500 mb-1 tracking-wider uppercase">
                {Icon && <Icon size={10} />}
                {label}
            </div>
            <div className="text-xs font-mono font-bold text-gray-200 truncate">
                {value || <span className="text-gray-600">N/A</span>}
            </div>
        </div>
    );

    return (
        <div className="w-full space-y-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* 1. TECHNICAL READOUT */}
            {specs && (
                <div className="grid grid-cols-3 gap-2">
                    <SpecItem label="CTX_WINDOW" value={specs.context_window} icon={Database} />
                    <SpecItem label="PARAMS" value={specs.model_params} icon={Cpu} />
                    <SpecItem label="LICENSE" value={specs.license} icon={Scale} />
                </div>
            )}

            {/* 2. ECONOMIC VECTOR */}
            <div className="flex items-center gap-2 text-[9px] font-mono p-2 bg-black/40 border border-white/5 rounded">
                <div className="flex items-center gap-2 flex-1 border-r border-white/5 pr-2">
                    <Cpu size={12} className={hardware ? "text-matrix-green" : "text-gray-600"} />
                    <span className="text-gray-500">HARDWARE:</span>
                    <span className={hardware ? "text-white" : "text-gray-600"}>
                        {hardware || "AWAITING_DATA"}
                    </span>
                </div>
                <div className="flex items-center gap-2 pl-2">
                    <DollarSign size={12} className={agent.pricing_model ? "text-yellow-500" : "text-gray-600"} />
                    <span className="text-gray-500">MODEL:</span>
                    <span className={agent.pricing_model ? "text-white" : "text-gray-600"}>
                        {pricingDisplay}
                    </span>
                </div>
            </div>
        </div>
    );
};