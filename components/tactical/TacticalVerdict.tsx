import React from 'react';
import { m, AnimatePresence } from 'framer-motion';

const ActivityIcon = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
);

interface TacticalVerdictProps {
    verdict: string | null;
    isAnalyzing: boolean;
}

export const TacticalVerdict: React.FC<TacticalVerdictProps> = ({ verdict, isAnalyzing }) => {
    if (!verdict && !isAnalyzing) return null;

    const cleanText = (verdict || '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    return (
        <AnimatePresence>
            <m.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="w-full mb-6 relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
            >
                <div className="flex items-stretch min-h-[80px]">
                    {/* Right: Content */}
                    <div className="flex-1 p-4 flex flex-col justify-center">
                        <div className="text-[10px] text-cyan-400 font-mono mb-1 uppercase tracking-widest font-bold flex items-center gap-2">
                            [TACTICAL_VERDICT_ENGINE]
                            {isAnalyzing && <span className="animate-pulse">ANALYZING...</span>}
                        </div>
                        <div className="text-sm font-mono text-cyan-50 leading-relaxed max-h-[200px] overflow-y-auto cyber-scroll pr-2">
                            {cleanText || (
                                <span className="text-cyan-400/50 animate-pulse">
                                    Awaiting DeepSeek-R1 synthesis...
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </m.div>
        </AnimatePresence>
    );
};
