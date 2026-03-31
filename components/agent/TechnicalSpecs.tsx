import React from 'react';
import { Cpu, Code, Layers, Box } from 'lucide-react';

interface TechnicalSpecsProps {
    technical_specs?: {
        architecture?: string;
        open_source?: boolean;
        [key: string]: any;
    };
    framework_stack?: string[];
}

export const TechnicalSpecs: React.FC<TechnicalSpecsProps> = ({ technical_specs, framework_stack }) => {
    const hasSpecs = technical_specs && Object.keys(technical_specs).length > 0;
    const hasFrameworks = framework_stack && framework_stack.length > 0;

    if (!hasSpecs && !hasFrameworks) return null;

    return (
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-white/5 pb-2">
                <Cpu size={18} />
                <h3 className="font-mono text-sm uppercase tracking-widest font-bold">Technical Dashboard</h3>
            </div>

            {hasSpecs && (
                <div className="grid grid-cols-1 gap-2">
                    {Object.entries(technical_specs!).map(([key, value]) => {
                        if (key === 'open_source') return null; // Handle separately or skip
                        return (
                            <div key={key} className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 font-mono uppercase">{key.replace(/_/g, ' ')}</span>
                                <span className="text-gray-300 font-mono text-right truncate max-w-[60%]">{String(value)}</span>
                            </div>
                        );
                    })}
                    {technical_specs?.open_source !== undefined && (
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-mono uppercase">License</span>
                            <span className={`font-mono ${technical_specs.open_source ? 'text-green-400' : 'text-red-400'}`}>
                                {technical_specs.open_source ? 'OPEN SOURCE' : 'PROPRIETARY'}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {hasFrameworks && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-gray-500 text-xs font-mono uppercase">
                        <Layers size={14} />
                        <span>Stack</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {framework_stack!.map((tech, idx) => (
                            <div key={idx} className="px-2 py-1 bg-cyan-950/30 border border-cyan-500/20 rounded text-[10px] font-mono text-cyan-300 flex items-center gap-1">
                                <Code size={10} />
                                {tech}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
