
import React, { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Terminal, X, ArrowRight, Activity, Search, CornerDownLeft, Zap, Star, Upload } from 'lucide-react';
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
            case 'LOCAL_RESULTS': return 'text-cyan-400 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.4)]';
            case 'TACTICAL_FLOW': return 'text-blue-500 border-blue-500';
            case 'COGNITIVE_CHAT': return 'text-amber-500 border-amber-500';
            case 'SYSTEM_ERROR': return 'text-red-500 border-red-500 animate-pulse';
            default: return 'text-gray-500 border-gray-800';
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <m.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] bg-black/70 backdrop-blur-sm"
                >
                    {/* 🚀 Command Center Content */}
                    <m.div 
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden shrink-0 max-h-[80vh] flex flex-col"
                    >
                        {/* Header: Status & Control */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-gradient-to-r from-black/40 to-transparent shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className={`flex items-center gap-3 px-4 py-2 rounded-full border bg-black/80 transition-all duration-500 ${getModeColor(mode)}`}>
                                        <Terminal size={14} className="animate-pulse" />
                                        <span className="text-[10px] font-mono font-black tracking-[0.2em] uppercase">
                                            NEURAL_LINK: {mode}
                                        </span>
                                    </div>
                                    {isProcessing && (
                                        <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-mono animate-pulse">
                                            <Activity size={12} className="animate-spin" />
                                            SYNCING...
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={onClose} 
                                    className="group p-3 hover:bg-red-500/10 rounded-xl text-gray-500 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                                >
                                    <X size={20} className="group-hover:rotate-90 transition-transform" />
                                </button>
                            </div>

                            {/* Main Display: History & Results */}
                            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar font-mono text-sm space-y-8">
                                {history.length === 0 && !isProcessing && localResults.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-700 space-y-4 opacity-40">
                                        <Search size={48} strokeWidth={1} />
                                        <p className="text-xs tracking-[0.3em] uppercase">Awaiting Command Input</p>
                                    </div>
                                )}

                                {history.map((msg, i) => (
                                    <m.div 
                                        key={i} 
                                        initial={{ opacity: 0, x: msg.type === 'user' ? 20 : -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] p-5 rounded-2xl border ${
                                            msg.type === 'user' 
                                                ? 'bg-zinc-900 border-zinc-800 text-zinc-100 rounded-tr-none' 
                                                : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400 rounded-tl-none shadow-[0_0_30px_rgba(34,211,238,0.05)]'
                                        }`}>
                                            {msg.type === 'system' && (
                                                <div className="text-[10px] font-black mb-2 opacity-40 flex items-center gap-2">
                                                    <Activity size={10} />
                                                    SYSTEM_RESPONSE
                                                </div>
                                            )}
                                            <div className="leading-relaxed">{msg.text}</div>
                                        </div>
                                    </m.div>
                                ))}
                                
                                {mode === 'LOCAL_RESULTS' && localResults.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                        {localResults.map((agent, idx) => (
                                            <m.button 
                                                key={agent.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => handleResultClick(agent.id)}
                                                className="group relative flex items-center gap-4 p-4 border border-white/5 bg-white/[0.02] hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-2xl text-left transition-all overflow-hidden"
                                            >
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <img 
                                                    src={agent.video_poster} 
                                                    className="w-14 h-14 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all border border-white/10" 
                                                    referrerPolicy="no-referrer"
                                                />
                                                <div className="flex-1 min-w-0 z-10">
                                                    <div className="text-[11px] font-black text-white group-hover:text-cyan-400 truncate uppercase tracking-tight">{agent.name}</div>
                                                    <div className="text-[9px] text-gray-500 font-mono mt-1.5 flex items-center gap-2">
                                                        <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                                        {agent.category}
                                                    </div>
                                                </div>
                                                <ArrowRight size={16} className="text-gray-800 group-hover:text-cyan-400 transform group-hover:translate-x-1 transition-all" />
                                            </m.button>
                                        ))}
                                    </div>
                                )}

                                {mode === 'AWAITING_UPLINK' && (
                                    <m.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center pt-8">
                                        <button 
                                            onClick={executeUplink} 
                                            className="group px-10 py-5 bg-cyan-500/10 border border-cyan-400 text-cyan-400 font-black font-mono text-xs rounded-full hover:bg-cyan-400 hover:text-black transition-all shadow-[0_0_50px_rgba(34,211,238,0.2)] flex items-center gap-4 tracking-[0.3em] uppercase"
                                        >
                                            <Zap size={18} className="group-hover:animate-bounce" /> 
                                            INITIALIZE_NEURAL_UPLINK
                                        </button>
                                    </m.div>
                                )}

                                <div ref={scrollRef} />
                            </div>

                            {/* Footer: Input & Controls */}
                            <div className="p-6 bg-black/40 border-t border-white/5 flex items-center gap-4 sm:gap-8 shrink-0">
                                <div className="text-cyan-400 font-black text-2xl animate-pulse tracking-tighter underline decoration-2 shrink-0 hidden sm:block">CMD_</div>
                                
                                <div className="flex flex-1 shrink-0 min-w-0">
                                    <input 
                                        ref={inputRef}
                                        type="text" 
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                                        placeholder="Search Agents or Execute Protocols..."
                                        className="w-full bg-transparent border-none outline-none font-mono text-xl sm:text-3xl text-white placeholder-white/5 shrink-0"
                                        disabled={isProcessing}
                                    />
                                </div>

                                {/* 🛡️ Responsive Control Group */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <button className="hidden md:flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-gray-400 transition-all text-[10px] font-black tracking-widest uppercase">
                                            <Upload size={14} />
                                            <span>UPLINK_FILE</span>
                                        </button>
                                        <button className="md:hidden p-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-white transition-colors">
                                            <Upload size={18} />
                                        </button>
                                    </div>

                                    <button 
                                        onClick={handleSubmit}
                                        disabled={!input || isProcessing}
                                        className={`p-4 sm:p-5 rounded-2xl transition-all duration-500 ${
                                            input && !isProcessing 
                                                ? 'bg-cyan-400 text-black shadow-[0_0_30px_rgba(34,211,238,0.4)] scale-105' 
                                                : 'bg-white/5 text-gray-800'
                                        }`}
                                    >
                                        <CornerDownLeft size={24} />
                                    </button>
                                </div>
                            </div>
                    </m.div>
                </m.div>
            )}
        </AnimatePresence>
    );
};
