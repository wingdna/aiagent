import React from 'react';
import { Agent } from '../../types';
import { Activity, AlertTriangle, Zap, Target, Shield } from 'lucide-react';

interface CompetitiveLandscapeProps {
    agent: Agent;
}

export const CompetitiveLandscape: React.FC<CompetitiveLandscapeProps> = ({ agent }) => {
    const analysis = agent.market_analysis;
    
    // Strict Null Check: If no analysis data, do not render
    if (!analysis || (!analysis.verdict && (!analysis.competitors || analysis.competitors.length === 0))) {
        return null;
    }

    return (
        <div className="bg-black/20 border border-white/5 rounded-xl p-5 backdrop-blur-sm mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-2 mb-4 text-[10px] font-mono text-red-400 uppercase tracking-widest border-b border-red-900/30 pb-2">
                <Target size={12} /> COMPETITIVE_LANDSCAPE
            </div>

            <div className="space-y-4">
                {/* VERDICT */}
                {analysis.verdict && (
                    <div className="bg-red-950/10 border border-red-500/10 rounded-lg p-3">
                        <h4 className="text-[10px] text-red-400 font-mono mb-1 flex items-center gap-2">
                            <Activity size={10} /> TACTICAL_VERDICT
                        </h4>
                        <p className="text-xs text-gray-300 leading-relaxed font-sans">
                            {analysis.verdict}
                        </p>
                    </div>
                )}

                {/* COMPETITORS */}
                {analysis.competitors && analysis.competitors.length > 0 && (
                    <div>
                        <h4 className="text-[10px] text-gray-500 font-mono mb-2 flex items-center gap-2 uppercase tracking-wider">
                            <AlertTriangle size={10} /> KNOWN_ADVERSARIES
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {analysis.competitors.map((comp: string, idx: number) => (
                                <div key={idx} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-xs font-mono text-gray-300 flex items-center gap-2 hover:bg-white/10 hover:text-white transition-colors cursor-default">
                                    <Zap size={10} className="text-yellow-500/50" />
                                    {comp}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DIFFERENTIATORS (If available in future schema) */}
                {/* Placeholder for future expansion */}
            </div>
        </div>
    );
};
