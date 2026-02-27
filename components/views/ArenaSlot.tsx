
import React, { useState, useEffect, useRef } from 'react';
import { Agent } from '../../types';
import { TerminalStream } from '../shared/TerminalStream';
import { getCategoryColor } from '../../utils';
import { AlertTriangle, Key, ShieldCheck, Lock, Activity, Plus } from 'lucide-react';
import { UserKeys } from '../../types';

interface ArenaSlotProps {
    index: number;
    agent: Agent | null;
    role?: string;
    label: string;
    keys: UserKeys;
    logs: string[];
    isProcessing: boolean;
    onSelect: () => void;
    onRemove: () => void;
    onSaveKey: (provider: keyof UserKeys, key: string) => void;
    getAgentPool: () => Agent[];
    onAgentSelect: (agent: Agent) => void;
}

export const ArenaSlot: React.FC<ArenaSlotProps> = ({ 
    index, agent, role, label, keys, logs, isProcessing, 
    onSelect, onRemove, onSaveKey, getAgentPool, onAgentSelect 
}) => {
    const [isSelecting, setIsSelecting] = useState(false);
    const [keyInput, setKeyInput] = useState('');
    const terminalRef = useRef<HTMLDivElement>(null);

    // Auto-scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [logs]);

    // Provider Detection
    const getProvider = (id: string): keyof UserKeys => {
        if (id.includes('gpt')) return 'openai';
        if (id.includes('claude')) return 'anthropic';
        if (id.includes('deepseek')) return 'deepseek';
        return 'google';
    };

    const provider = agent ? getProvider(agent.id) : null;
    const hasKey = provider ? !!keys[provider] : false;
    const color = agent ? getCategoryColor(agent.category) : '#333';

    // Handler for Key Input
    const handleKeySubmit = () => {
        if (provider && keyInput.length > 5) {
            onSaveKey(provider, keyInput);
            setKeyInput('');
        }
    };

    // Selecting Agent Wrapper
    const handleSlotClick = () => {
        if (!agent) setIsSelecting(true);
    };

    const handleAgentChoice = (a: Agent) => {
        onAgentSelect(a);
        setIsSelecting(false);
    };

    return (
        <div 
            className={`relative h-full border rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${
                agent 
                    ? (hasKey ? 'bg-gray-900/40 border-gray-700' : 'bg-red-900/10 border-red-500/50 animate-pulse') 
                    : 'bg-black/40 border-gray-800 border-dashed hover:border-gray-600'
            }`} 
            style={{ borderColor: agent && hasKey ? color : undefined }}
        >
            {/* --- SELECTION OVERLAY --- */}
            {isSelecting && (
                <div className="absolute inset-0 bg-black/95 z-50 p-4 overflow-y-auto custom-scrollbar flex flex-col">
                    <div className="text-[10px] font-mono text-gray-500 mb-2 sticky top-0 bg-black pb-2 border-b border-gray-800 flex justify-between items-center">
                        <span>SELECT_OPERATIVE</span>
                        <button onClick={() => setIsSelecting(false)} className="text-red-500 hover:text-red-400">CLOSE</button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {getAgentPool().map(a => (
                            <div 
                                key={a.id} 
                                onClick={() => handleAgentChoice(a)}
                                className="flex items-center gap-3 p-2 border border-gray-800 hover:border-matrix-green hover:bg-matrix-green/10 cursor-pointer rounded transition-all group"
                            >
                                <img src={a.video_poster} className="w-8 h-8 rounded object-cover grayscale group-hover:grayscale-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-gray-300 group-hover:text-white truncate">{a.name}</div>
                                    <div className="text-[9px] text-gray-600 truncate">{a.category}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- AGENT ACTIVE STATE --- */}
            {agent ? (
                <>
                    {/* Background Visual */}
                    {hasKey && (
                        <>
                            <img src={agent.video_poster} className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-screen grayscale" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                        </>
                    )}

                    {/* Content Layer */}
                    <div className="relative z-10 flex flex-col h-full p-4">
                        
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <div className="text-[10px] font-mono font-bold bg-black/60 px-2 py-1 rounded backdrop-blur inline-flex items-center gap-2" style={{ color: hasKey ? color : '#ef4444' }}>
                                    {label}
                                    {hasKey ? <ShieldCheck size={10} /> : <AlertTriangle size={10} />}
                                </div>
                                {role && <div className="text-[9px] font-mono text-gray-500 mt-1 uppercase tracking-widest">[{role}]</div>}
                            </div>
                            
                            <button onClick={onRemove} className="text-gray-600 hover:text-red-500 bg-black/50 rounded-full p-1 transition-colors">
                                <Activity size={12} />
                            </button>
                        </div>

                        {/* Center Stage: Key Input or Status */}
                        <div className="flex-1 flex flex-col justify-center my-2">
                            {!hasKey ? (
                                <div className="bg-black/80 border border-red-500/30 p-3 rounded backdrop-blur animate-in fade-in zoom-in duration-300">
                                    <div className="text-red-500 text-[10px] font-mono font-bold mb-2 flex items-center gap-2">
                                        <Lock size={12} />
                                        MISSING_{provider?.toUpperCase()}_KEY
                                    </div>
                                    <input 
                                        type="password" 
                                        value={keyInput}
                                        onChange={(e) => setKeyInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleKeySubmit()}
                                        onBlur={handleKeySubmit}
                                        placeholder={`ENTER ${provider?.toUpperCase()} KEY`}
                                        className="w-full bg-red-950/20 border border-red-900 rounded px-2 py-1 text-red-100 text-xs font-mono focus:border-red-500 focus:outline-none placeholder-red-900/50"
                                        autoFocus
                                    />
                                </div>
                            ) : (
                                <div className="text-center">
                                    <h3 className="text-lg font-display font-bold text-white leading-none mb-1 drop-shadow-md">{agent.name}</h3>
                                    <div className="flex justify-center gap-3 text-[9px] font-mono text-gray-400">
                                        <span>ELO: {agent.stats?.elo}</span>
                                        <span>SPD: {agent.metrics.speed}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer: Mini-Terminal */}
                        {hasKey && (
                            <div className={`mt-auto transition-all duration-500 ${logs.length > 0 || isProcessing ? 'h-24 opacity-100' : 'h-0 opacity-0'} overflow-hidden`}>
                                <div 
                                    ref={terminalRef}
                                    className="h-full bg-black/80 border border-gray-800 rounded p-2 font-mono text-[9px] overflow-y-auto custom-scrollbar shadow-inner"
                                >
                                    {logs.map((log, i) => (
                                        <div key={i} className="mb-1 break-words">
                                            <span className="text-gray-600 mr-1">{'>'}</span>
                                            <span className={log.includes('OUTPUT') ? 'text-matrix-green' : 'text-yellow-500/80'}>{log}</span>
                                        </div>
                                    ))}
                                    {isProcessing && <span className="text-matrix-green animate-pulse">_</span>}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                /* Empty Slot State */
                <div onClick={handleSlotClick} className="flex-1 flex flex-col items-center justify-center cursor-pointer group">
                    <Plus className="text-gray-600 group-hover:text-white transition-colors mb-2" />
                    <span className="text-[10px] font-mono text-gray-600 group-hover:text-matrix-green">{label}</span>
                    {role && <span className="text-[8px] text-gray-700 mt-1 uppercase">[{role}]</span>}
                </div>
            )}
        </div>
    );
};
