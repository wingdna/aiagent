import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, Settings2, Activity, AlertCircle } from 'lucide-react';
import { ExecutionMessage } from '../../lib/execution/ExecutionStrategy';

interface NeuralTerminalProps {
    messages: ExecutionMessage[];
    input: string;
    setInput: (val: string) => void;
    isStreaming: boolean;
    error: string | null;
    apiKey: string;
    onSend: () => void;
    onClose: () => void;
    onConfigureKey: () => void;
    agentName?: string;
}

export const NeuralTerminal: React.FC<NeuralTerminalProps> = ({
    messages,
    input,
    setInput,
    isStreaming,
    error,
    apiKey,
    onSend,
    onClose,
    onConfigureKey,
    agentName = 'ENTITY',
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isStreaming]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        // Only animate opacity and transform (y) to prevent main-thread layout thrashing
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-40 bg-slate-950/90 flex flex-col overflow-hidden pointer-events-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
            style={{
                // Zero-latency ambient light simulation (no backdrop-filter blur here)
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.03) 0%, transparent 70%)',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {/* --- HEADER: Precision instrumentation feel --- */}
            <div className="relative z-10 flex justify-between items-center px-6 py-4 border-b border-white/5 bg-black/20">
                <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center w-5 h-5">
                        <div className="absolute inset-0 border border-cyan-500/30 rounded-full animate-[spin_3s_linear_infinite]" />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-cyan-500/90 font-mono text-[9px] tracking-[0.3em] uppercase">
                            Uplink Established
                        </span>
                        <span className="text-white/80 font-sans text-sm font-light tracking-wider">
                            {agentName} <span className="text-white/30 font-mono">::</span> YouAgent
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-5">
                    <button
                        onClick={onConfigureKey}
                        className="text-slate-500 hover:text-cyan-400 transition-colors duration-300"
                        title="Configure Connection Parameters"
                    >
                        <Settings2 size={16} strokeWidth={1} />
                    </button>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors duration-300 group relative"
                        title="Terminate Link"
                    >
                        <X size={18} strokeWidth={1} />
                    </button>
                </div>
            </div>

            {/* --- MESSAGE STREAM --- */}
            <div className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none z-0" />

                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-xs tracking-widest uppercase relative z-10">
                        <Activity size={20} className="mb-4 opacity-30" strokeWidth={1} />
                        <p className="animate-pulse">Awaiting Intent Transmission</p>
                    </div>
                )}

                <div className="relative z-10 space-y-8">
                    {messages.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        const isLatestAi = !isUser && idx === messages.length - 1;

                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className={`flex flex-col max-w-[88%] ${isUser ? 'ml-auto items-end' : 'mr-auto items-start'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5 opacity-60">
                                    <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
                                        {isUser ? 'Operator' : agentName}
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-600">
                                        {new Date().toISOString().split('T')[1].slice(0, 8)}
                                    </span>
                                </div>

                                <div
                                    className={`text-sm leading-relaxed font-sans font-light selection:bg-cyan-900/50 ${isUser
                                            ? 'text-slate-200 border border-white/5 bg-white/[0.02] px-4 py-2.5 rounded-lg rounded-tr-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                                            : 'text-cyan-50'
                                        }`}
                                >
                                    <span className={!isUser ? 'drop-shadow-[0_0_8px_rgba(236,254,255,0.1)]' : ''}>
                                        {msg.content}
                                    </span>

                                    {/* Active Stream Cursor */}
                                    {isStreaming && isLatestAi && (
                                        <motion.span
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                                            className="inline-block w-1.5 h-3.5 bg-cyan-400 ml-1.5 translate-y-[2px]"
                                        />
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {/* --- ERROR STATE --- */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="relative z-20 mx-6 mb-4 px-4 py-3 bg-red-950/40 border border-red-900/50 rounded-lg backdrop-blur-md"
                    >
                        <div className="flex items-start gap-3 text-red-400">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />
                            <span className="font-mono text-[11px] leading-relaxed uppercase tracking-wider">
                                {error}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- INPUT PARADIGM --- */}
            <div className="relative z-20 p-6 pt-2 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
                <div className="relative flex items-end bg-black/40 border border-white/10 rounded-xl transition-all duration-300 focus-within:border-cyan-500/40 focus-within:bg-black/60 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={apiKey ? 'Enter query paradigm...' : 'Authentication required to transmit.'}
                        disabled={isStreaming || !apiKey}
                        rows={1}
                        className="flex-1 bg-transparent text-slate-200 font-sans text-sm font-light placeholder-slate-600 resize-none focus:outline-none px-4 py-3 disabled:opacity-50 scrollbar-hide"
                        style={{
                            minHeight: '44px',
                            maxHeight: '120px',
                        }}
                    />

                    {/* Interactive Pulsing Block Cursor Decoration */}
                    {input.length === 0 && apiKey && !isStreaming && (
                        <div className="absolute left-[17px] top-[14px] w-1.5 h-4 bg-cyan-500/30 animate-pulse pointer-events-none mix-blend-screen" />
                    )}

                    <button
                        onClick={onSend}
                        disabled={isStreaming || !input.trim() || !apiKey}
                        className="p-3 m-1 text-slate-600 hover:text-cyan-400 hover:bg-cyan-950/30 disabled:hover:text-slate-600 disabled:hover:bg-transparent disabled:opacity-50 transition-all duration-300 rounded-lg flex shrink-0"
                        title="Transmit"
                    >
                        <Send size={16} strokeWidth={1.5} className="translate-x-[1px] translate-y-[1px]" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
