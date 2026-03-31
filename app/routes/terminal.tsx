import React, { useState, useEffect, useRef } from 'react';
import { m } from 'framer-motion';
import { Terminal as TerminalIcon, ChevronRight, Activity, Home } from 'lucide-react';
import { executeCommand } from '../utils/cli-engine';
import { useNavigate } from 'react-router';

export default function TerminalPage() {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<{ type: string; content: string; timestamp: string }[]>([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Initial greeting
        setHistory([
            { type: 'system', content: 'YOUAGENT_OS [VERSION 2.0.0]', timestamp: new Date().toLocaleTimeString() },
            { type: 'system', content: 'CONNECTED TO NEURAL_CORE_V4', timestamp: new Date().toLocaleTimeString() },
            { type: 'system', content: 'TYPE /help FOR COMMAND LIST', timestamp: new Date().toLocaleTimeString() },
        ]);
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && input.trim()) {
            const cmd = input.trim();
            setHistory(prev => [...prev, { type: 'user', content: cmd, timestamp: new Date().toLocaleTimeString() }]);
            setInput('');
            setIsExecuting(true);

            try {
                const action = await executeCommand(cmd);
                
                switch (action.type) {
                    case 'redirect':
                        setHistory(prev => [...prev, { type: 'system', content: `REDIRECTING TO: ${action.payload}`, timestamp: new Date().toLocaleTimeString() }]);
                        setTimeout(() => navigate(action.payload, { viewTransition: true }), 1000);
                        break;
                    case 'search':
                        setHistory(prev => [...prev, { type: 'system', content: `INITIATING NEURAL SEARCH: ${action.payload}`, timestamp: new Date().toLocaleTimeString() }]);
                        setTimeout(() => navigate(`/?q=${encodeURIComponent(action.payload)}`, { viewTransition: true }), 1000);
                        break;
                    case 'data':
                        setHistory(prev => [...prev, { type: 'data', content: JSON.stringify(action.payload, null, 2), timestamp: new Date().toLocaleTimeString() }]);
                        break;
                    case 'help':
                        setHistory(prev => [...prev, { type: 'system', content: action.payload, timestamp: new Date().toLocaleTimeString() }]);
                        break;
                    case 'error':
                        setHistory(prev => [...prev, { type: 'error', content: action.payload, timestamp: new Date().toLocaleTimeString() }]);
                        break;
                    default:
                        setHistory(prev => [...prev, { type: 'error', content: 'UNKNOWN COMMAND ACTION', timestamp: new Date().toLocaleTimeString() }]);
                }
            } catch (err) {
                setHistory(prev => [...prev, { type: 'error', content: 'EXECUTION_FAILURE: CORE_SYNC_LOST', timestamp: new Date().toLocaleTimeString() }]);
            } finally {
                setIsExecuting(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-black text-emerald-500 font-mono p-4 md:p-8 selection:bg-emerald-500 selection:text-black">
            <div className="max-w-4xl mx-auto flex flex-col h-[90vh]">
                {/* Header */}
                <div className="flex items-center gap-3 border-b border-emerald-900/50 pb-4 mb-4">
                    <TerminalIcon className="w-6 h-6 animate-pulse" />
                    <div>
                        <h1 className="text-xl font-bold tracking-widest uppercase">YouAgent Terminal</h1>
                        <p className="text-[10px] opacity-50">HEADLESS_MODE_ACTIVE // ENCRYPTED_LINK_ESTABLISHED</p>
                    </div>
                    <div className="ml-auto flex gap-4 text-[10px] opacity-50 uppercase">
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> System: Stable</span>
                        <span className="flex items-center gap-1"><Home className="w-3 h-3" /> Node: Asia-NE1</span>
                    </div>
                </div>

                {/* Output Area */}
                <div 
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-hide"
                >
                    {history.map((item, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                            <span className="opacity-30 shrink-0">[{item.timestamp}]</span>
                            <div className="flex-1 whitespace-pre-wrap break-all">
                                {item.type === 'user' && <span className="text-cyan-400 mr-2">$</span>}
                                {item.type === 'error' && <span className="text-red-500 mr-2">[ERR]</span>}
                                {item.type === 'data' ? (
                                    <pre className="bg-emerald-950/20 p-2 rounded border border-emerald-900/30 text-xs text-emerald-400 overflow-x-auto">
                                        {item.content}
                                    </pre>
                                ) : (
                                    <span className={item.type === 'system' ? 'text-emerald-300' : ''}>
                                        {item.content}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                    {isExecuting && (
                        <div className="flex gap-3 text-sm animate-pulse">
                            <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                            <span className="text-emerald-300">EXECUTING_COMMAND...</span>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="relative flex items-center gap-2 border-t border-emerald-900/50 pt-4">
                    <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" />
                    <input 
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isExecuting}
                        className="w-full bg-transparent outline-none text-emerald-400 placeholder-emerald-900/50"
                        placeholder="ENTER_COMMAND_HERE..."
                        autoFocus
                    />
                    <div className="absolute right-0 bottom-[-20px] text-[8px] opacity-30 uppercase">
                        Press ESC to return to GUI
                    </div>
                </div>
            </div>

            {/* Background Grid Effect */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }} />
            </div>

            {/* Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
            </div>
        </div>
    );
}
