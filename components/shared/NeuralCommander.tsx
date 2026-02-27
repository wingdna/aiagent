
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, ArrowRight, Activity, Search, CornerDownLeft, Zap, Star } from 'lucide-react';
import { useNeuralRouter, RouterMode } from '../../hooks/useNeuralRouter';
import { Agent } from '../../types';
import { UserKeys } from '../../types';

interface NeuralCommanderProps {
    isOpen: boolean;
    onClose: () => void;
    keys: UserKeys;
    saveKey: (provider: keyof UserKeys, key: string) => void;
    agents: Agent[];
    actions: {
        onFilter: (tag: string) => void;
        onFlow: (ids: string[]) => void;
    };
}

export const NeuralCommander: React.FC<NeuralCommanderProps> = ({ isOpen, onClose, keys, saveKey, agents, actions }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<{ type: 'user' | 'system', text: string }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { mode, isProcessing, processInput, executeUplink, missingProvider, localResults, resetState } = useNeuralRouter(keys, agents, {
        onFilter: (tag) => {
            actions.onFilter(tag);
            onClose(); 
        },
        onFlow: (ids) => {
            actions.onFlow(ids);
            onClose();
        },
        onChat: (text) => {
            setHistory(prev => [...prev, { type: 'system', text }]);
        }
    });

    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setHistory([]);
            setInput('');
            resetState();
        }
    }, [isOpen, resetState]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isProcessing, localResults]);

    const handleSubmit = async () => {
        if (!input.trim() || isProcessing) return;
        const userText = input;
        setInput('');
        setHistory(prev => [...prev, { type: 'user', text: userText }]);
        await processInput(userText);
    };

    const handleResultClick = (agentId: string) => {
        actions.onFilter(agentId);
        onClose();
    };

    const getModeColor = (m: RouterMode) => {
        switch (m) {
            case 'LOCAL_RESULTS': return 'text-matrix-green border-matrix-green shadow-[0_0_20px_rgba(0,255,65,0.4)]';
            case 'TACTICAL_FLOW': return 'text-blue-500 border-blue-500';
            case 'COGNITIVE_CHAT': return 'text-amber-500 border-amber-500';
            case 'SYSTEM_ERROR': return 'text-red-500 border-red-500 animate-pulse';
            default: return 'text-gray-500 border-gray-800';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[90]"
                    />

                    <motion.div 
                        initial={{ y: -400, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -400, opacity: 0 }}
                        className="fixed top-0 left-0 right-0 z-[100] bg-black/60 backdrop-blur-3xl border-b border-white/10 shadow-2xl overflow-hidden"
                    >
                        <div className="max-w-4xl mx-auto flex flex-col min-h-[300px] max-h-[85vh]">
                            
                            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
                                <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full border bg-black/60 transition-all duration-500 ${getModeColor(mode)}`}>
                                    <Terminal size={14} />
                                    <span className="text-[10px] font-mono font-black tracking-widest uppercase">
                                        ROUTING_TARGET: {mode}
                                    </span>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-red-500/20 rounded-full text-gray-500 hover:text-red-500 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar font-mono text-sm space-y-6">
                                {history.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[90%] p-4 rounded-xl border ${
                                            msg.type === 'user' 
                                                ? 'bg-gray-900 border-gray-700 text-gray-100 rounded-tr-none' 
                                                : 'bg-matrix-green/5 border-matrix-green/20 text-matrix-green rounded-tl-none shadow-[0_0_15px_rgba(0,255,65,0.1)]'
                                        }`}>
                                            {msg.type === 'system' && <span className="mr-2 opacity-60">SYSTEM_LOG {" >> "}</span>}
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                
                                {mode === 'LOCAL_RESULTS' && localResults.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        {localResults.map(agent => (
                                            <button 
                                                key={agent.id}
                                                onClick={() => handleResultClick(agent.id)}
                                                className="group relative flex items-center gap-4 p-4 border border-white/5 bg-black/40 hover:border-matrix-green/50 hover:bg-matrix-green/5 rounded-xl text-left transition-all overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-16 h-16 bg-matrix-green/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <img src={agent.video_poster} className="w-12 h-12 rounded-lg object-cover grayscale group-hover:grayscale-0 transition-all border border-white/10" />
                                                <div className="flex-1 min-w-0 z-10">
                                                    <div className="text-xs font-black text-white group-hover:text-matrix-green truncate uppercase tracking-tighter">{agent.name}</div>
                                                    <div className="text-[9px] text-gray-500 font-mono mt-1 flex items-center gap-2">
                                                        <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                                        {agent.category}
                                                    </div>
                                                </div>
                                                <ArrowRight size={14} className="text-gray-800 group-hover:text-matrix-green transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {mode === 'AWAITING_UPLINK' && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center pt-8">
                                        <button onClick={executeUplink} className="px-8 py-4 bg-matrix-green/10 border border-matrix-green text-matrix-green font-black font-display text-xs rounded-full hover:bg-matrix-green hover:text-black transition-all shadow-[0_0_30px_rgba(0,255,65,0.3)] flex items-center gap-3 tracking-widest uppercase">
                                            <Zap size={16} /> INITIALIZE_NEURAL_UPLINK
                                        </button>
                                    </motion.div>
                                )}

                                {isProcessing && (
                                    <div className="flex items-center justify-center gap-3 text-matrix-green/60 text-xs py-10 animate-pulse">
                                        <Activity size={20} className="animate-spin" />
                                        <span className="font-mono tracking-widest">SCANNING_NEURAL_LATICE...</span>
                                    </div>
                                )}
                                <div ref={scrollRef} />
                            </div>

                            <div className="p-6 bg-black/60 border-t border-white/10 flex items-center gap-6">
                                <div className="text-matrix-green font-black text-xl animate-pulse tracking-tighter underline decoration-2">CMD_</div>
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                    placeholder="Enter Agent Name, Protocol, or Keyword..."
                                    className="flex-1 bg-transparent border-none outline-none font-mono text-2xl text-white placeholder-gray-800"
                                    disabled={isProcessing}
                                />
                                <button 
                                    onClick={handleSubmit}
                                    disabled={!input || isProcessing}
                                    className={`p-4 rounded-2xl transition-all duration-300 ${
                                        input && !isProcessing 
                                            ? 'bg-matrix-green text-black shadow-[0_0_20px_rgba(0,255,65,0.5)]' 
                                            : 'bg-white/5 text-gray-700'
                                    }`}
                                >
                                    <CornerDownLeft size={24} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
