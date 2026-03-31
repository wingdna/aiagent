import React, { useEffect, useRef, useState } from 'react';
import { TacticalLog } from '../../../hooks/useSearchEngine';

interface DeepSeekPanelProps {
    logs: TacticalLog[];
    isMobile: boolean;
    inputValue: string;
}

export const DeepSeekPanel: React.FC<DeepSeekPanelProps> = ({ logs, isMobile, inputValue }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [bufferedLogs, setBufferedLogs] = useState<TacticalLog[]>([]);

    // 50ms Stream Governor
    useEffect(() => {
        const interval = setInterval(() => {
            setBufferedLogs(logs);
        }, 50);
        return () => clearInterval(interval);
    }, [logs]);

    // Auto-scroll to bottom when logs change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [bufferedLogs]);

    if (!inputValue) return null;

    if (isMobile) {
        return (
            <div className="shrink-0 bg-[#030303] border border-white/5 rounded p-3 font-mono text-[10px] text-green-400/80 max-h-24 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed relative flex flex-col gap-2">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/5 to-transparent animate-scan pointer-events-none" style={{ willChange: 'transform' }} />
                {bufferedLogs.slice(-1).map((log) => (
                    <div key={log.id} className="flex flex-col gap-1">
                        <div className="text-cyan-400/70 font-bold">[{new Date(parseInt(log.id)).toLocaleTimeString()}] QUERY: {log.query}</div>
                        {log.reasoning && (
                            <div className="opacity-50 italic border-l-2 border-green-500/20 pl-2 mb-1 line-clamp-2">
                                {log.reasoning}
                            </div>
                        )}
                        <div className="line-clamp-2">{log.content}</div>
                        {log.isReasoning && <span className="animate-pulse">_</span>}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div 
            className="w-full md:w-1/3 h-[25vh] md:h-auto min-h-[150px] min-w-[250px] border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-4 flex flex-col shrink-0 relative overflow-hidden transition-all duration-300 ease-in-out opacity-100 translate-x-0"
        >
            <div className="text-[10px] text-cyan-400 font-mono mb-2 flex items-center gap-2 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                [DEEPSEEK_R1_ADVISOR]
            </div>
            
            <div 
                ref={scrollRef}
                className="flex-1 bg-[#030303] border border-white/5 rounded p-3 font-mono text-[10px] text-green-400/80 overflow-y-auto custom-scrollbar whitespace-pre-wrap leading-relaxed relative flex flex-col gap-4"
            >
                {/* Stream Scan Animation - Disabled for Stability */}
                {/* <div className="absolute top-0 right-0 w-[1px] h-full bg-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse" /> */}
                {/* <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-400/5 to-transparent animate-scan pointer-events-none" style={{ willChange: 'transform' }} /> */}
                
                {bufferedLogs.map((log, index) => (
                    <div key={log.id} className={`flex flex-col gap-2 ${index < bufferedLogs.length - 1 ? 'opacity-50 border-b border-green-400/10 pb-4' : ''}`}>
                        <div className="text-cyan-400/70 font-bold">[{new Date(parseInt(log.id)).toLocaleTimeString()}] QUERY: {log.query}</div>
                        
                        {/* Reasoning Container */}
                        {log.reasoning && (
                            <div className="max-h-[150px] overflow-y-auto custom-scrollbar opacity-50 border-l-2 border-green-500/20 pl-2 bg-green-900/5 p-2 rounded text-[9px]">
                                {log.reasoning}
                                {log.isReasoning && <span className="ml-1">_</span>}
                            </div>
                        )}
                        
                        {/* Final Content */}
                        {log.content && (
                            <div className="text-green-300 font-semibold border-l-2 border-cyan-500/50 pl-2">
                                {log.content}
                            </div>
                        )}
                    </div>
                ))}
                
                {bufferedLogs.length === 0 && (
                    <div className="opacity-50">
                        &gt; Initializing neural pathways...<br/>
                        &gt; Awaiting query input...
                    </div>
                )}
            </div>
        </div>
    );
};
