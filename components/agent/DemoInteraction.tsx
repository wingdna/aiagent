import React, { useState } from 'react';
import { Play, MessageSquare, Terminal } from 'lucide-react';

interface DemoInteractionProps {
    demo_interaction?: {
        prompt: string;
        response: string;
    };
}

export const DemoInteraction: React.FC<DemoInteractionProps> = ({ demo_interaction }) => {
    const [isInteracting, setIsInteracting] = useState(false);
    const [responseVisible, setResponseVisible] = useState(false);

    if (!demo_interaction || !demo_interaction.prompt || !demo_interaction.response) return null;

    const handleInteract = () => {
        setIsInteracting(true);
        setTimeout(() => {
            setResponseVisible(true);
        }, 1000); // Simulate processing delay
    };

    return (
        <div className="bg-black/20 border border-white/5 rounded-xl p-4 backdrop-blur-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-white/5 pb-2">
                <Terminal size={18} />
                <h3 className="font-mono text-sm uppercase tracking-widest font-bold">Interactive Demo</h3>
            </div>

            <div className="flex flex-col gap-2">
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-3 text-sm font-mono text-gray-300">
                    <span className="text-cyan-500 mr-2">$</span>
                    {demo_interaction.prompt}
                </div>

                {!isInteracting ? (
                    <button 
                        onClick={handleInteract}
                        className="self-start px-4 py-2 bg-cyan-950/30 border border-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-900/50 hover:border-cyan-400/50 transition-all flex items-center gap-2 text-xs font-mono uppercase tracking-wider"
                    >
                        <Play size={14} />
                        Run Simulation
                    </button>
                ) : (
                    <div className="relative min-h-[60px] bg-black/40 border border-cyan-500/20 rounded-lg p-3 text-sm font-mono text-cyan-100">
                        {!responseVisible ? (
                            <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
                                <span className="w-2 h-2 bg-cyan-500 rounded-full" />
                                Processing...
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <span className="text-green-500 mr-2">&gt;</span>
                                {demo_interaction.response}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
