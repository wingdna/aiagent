import React, { useState } from 'react';
import { Agent, SystemPrompt } from '../../types';
import { Terminal, Copy, Check } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

interface PromptTerminalProps {
    prompts?: SystemPrompt[]; // strict optional from Agent type
    color: string;
}

/**
 * COMPONENT: PROMPT_MATRIX
 * Protocol V8.1: Consumes System Prompts JSONB.
 * Behavior:
 * - If prompts null/empty -> Return NULL (Hide section).
 * - Else -> Render Interactive Terminal.
 */
export const PromptTerminal: React.FC<PromptTerminalProps> = ({ prompts, color }) => {
    // 1. Strict Null Check (Ghost Mode)
    if (!prompts || prompts.length === 0) return null;

    const [activeTab, setActiveTab] = useState(0);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = prompts[activeTab]?.content;
        if (!text) return;
        
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full mt-6 border border-white/10 rounded-lg overflow-hidden bg-black/60 backdrop-blur-sm shadow-xl">
            {/* Header / Tabs */}
            <div className="flex items-center border-b border-white/10 bg-white/5">
                <div className="px-3 py-2 border-r border-white/10 flex items-center gap-2 text-[10px] font-mono text-gray-500 bg-black/40">
                    <Terminal size={12} className="text-cyan-400" />
                    SYSTEM_PROMPT_MATRIX
                </div>
                <div className="flex-1 flex overflow-x-auto no-scrollbar">
                    {prompts.map((p, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={`px-4 py-2 text-[10px] font-bold font-mono tracking-wider transition-colors border-r border-white/5 hover:bg-white/5 relative ${
                                activeTab === idx ? 'text-white bg-white/10' : 'text-gray-600'
                            }`}
                        >
                            {String(p.title || '').toUpperCase()}
                            {activeTab === idx && (
                                <m.div 
                                    layoutId="activePromptTab"
                                    className="absolute bottom-0 left-0 right-0 h-[2px]" 
                                    style={{ backgroundColor: color }}
                                />
                            )}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={handleCopy}
                    disabled={!prompts[activeTab]?.content}
                    className="px-3 py-2 hover:bg-white/10 text-gray-500 hover:text-white transition-colors border-l border-white/10"
                    title="COPY_BUFFER"
                >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
            </div>

            {/* Content Area */}
            <div className="relative p-4 font-mono text-xs text-gray-300 h-32 overflow-y-auto custom-scrollbar bg-black/80">
                <AnimatePresence mode='wait'>
                    <m.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="whitespace-pre-wrap leading-relaxed"
                    >
                        {prompts[activeTab]?.content || <span className="text-gray-600 italic">// DATA_CORRUPTED: CONTENT_MISSING</span>}
                    </m.div>
                </AnimatePresence>
                
                {/* Decorative Cursor */}
                <div className="mt-2 inline-block w-2 h-4 bg-cyan-500/50 animate-pulse align-middle"></div>
            </div>
        </div>
    );
};