
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CornerDownLeft, Cpu, Activity, Zap, History, Sliders, MessageSquare, AlertTriangle, Mic, MicOff, Terminal as TerminalIcon } from 'lucide-react';
import { CONFIG } from '../../config';
import { UserProfile, UserRank } from '../../types';
import { getRankInfo } from '../../services/rankService';
import { YouAgentLogo } from '../ui/YouAgentLogo';

interface TopBarProps {
    userProfile: UserProfile;
    onToggleCommander: () => void; 
    alertMessage?: string | null; 
}

const QUICK_FILTERS = [
    { label: 'LOGIC', icon: Cpu, color: 'text-cyan-400' },
    { label: 'CREATIVE', icon: Zap, color: 'text-yellow-400' },
    { label: 'VELOCITY', icon: Activity, color: 'text-matrix-green' }
];

export const TopBar: React.FC<TopBarProps> = ({ 
    userProfile,
    onToggleCommander,
    alertMessage
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);
    
    const rank: UserRank = getRankInfo(userProfile.xp);
    const progress = Math.min(100, (userProfile.xp / rank.nextLevelXp) * 100);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'zh-CN'; 

            recognitionRef.current.onstart = () => {
                setIsListening(true);
                setVoiceFeedback("LISTENING...");
            };

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0])
                    .map((result: any) => result.transcript)
                    .join('');
                setInputValue(transcript);
                setVoiceFeedback("CAPTURING_STREAM...");
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
                setVoiceFeedback(null);
            };

            recognitionRef.current.onerror = (event: any) => {
                if (event.error === 'no-speech') {
                    setVoiceFeedback("NO_SIGNAL_DETECTED");
                    setTimeout(() => setVoiceFeedback(null), 2000);
                }
                setIsListening(false);
            };
        }
    }, []);

    const toggleVoiceInput = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            try {
                setIsFocused(true);
                setInputValue('');
                recognitionRef.current.start();
            } catch (err) {
                recognitionRef.current.stop();
            }
        }
    }, [isListening]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('.command-bar-container')) {
                setIsFocused(false);
                if (isListening) recognitionRef.current?.stop();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isListening]);

    return (
        <>
            <div className="fixed top-0 left-0 w-full h-[2px] z-[60] bg-gray-900 pointer-events-none">
                <div 
                    className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]" 
                    style={{ width: `${progress}%`, backgroundColor: rank.color, color: rank.color }}
                ></div>
            </div>

            <AnimatePresence>
                {isFocused && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-md z-30 pointer-events-auto"
                        onClick={() => setIsFocused(false)}
                    />
                )}
            </AnimatePresence>

            {/* FROSTED GLASS HEADER */}
            <header 
                className={`fixed top-0 left-0 md:left-20 right-0 z-40 transition-all duration-500 ease-in-out border-b border-white/10 overflow-hidden command-bar-container ${
                    isFocused 
                        ? 'h-80 bg-black/60 backdrop-blur-2xl' 
                        : 'h-20 bg-black/40 backdrop-blur-xl'
                }`}
            >
                <div className="max-w-5xl mx-auto h-full px-6 flex flex-col">
                    
                    <div className="flex items-center gap-4 h-20 shrink-0">
                        {/* BRAND LOGO */}
                        <div className="flex items-center gap-3 mr-4">
                            <YouAgentLogo className="w-8 h-8 text-matrix-green" />
                            <span className="hidden md:block font-display font-bold text-lg tracking-widest text-white select-none">
                                YOU<span className="text-matrix-green">AGENT</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search size={20} className={`${isFocused ? 'text-matrix-green' : 'text-gray-500'} transition-colors duration-300`} />
                            </div>
                        </div>

                        <div className="flex-1 relative flex items-center">
                            {!isFocused && !inputValue && (
                                <div className="absolute left-0 pointer-events-none flex items-center gap-2 font-mono text-sm text-gray-500 uppercase tracking-widest">
                                    <span className="text-matrix-green animate-pulse">{'>'}</span>
                                    YOUAGENT_COMMAND_LINK...
                                </div>
                            )}
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onFocus={() => setIsFocused(true)}
                                rows={isFocused ? 3 : 1}
                                className={`w-full bg-transparent border-none focus:ring-0 font-mono text-white placeholder-transparent resize-none transition-all duration-300 ${
                                    isFocused ? 'text-xl mt-6' : 'text-sm mt-0'
                                }`}
                                placeholder="Search..."
                            />
                            
                            <AnimatePresence>
                                {voiceFeedback && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute bottom-[-25px] left-0 text-[10px] font-mono text-matrix-green tracking-tighter"
                                    >
                                        [ {voiceFeedback} ]
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={toggleVoiceInput}
                                className={`relative p-3 rounded-xl transition-all duration-300 border ${
                                    isListening 
                                    ? 'bg-matrix-green/20 border-matrix-green text-matrix-green shadow-[0_0_25px_rgba(0,255,65,0.4)] scale-110' 
                                    : 'bg-white/5 border-transparent text-gray-500 hover:text-matrix-green'
                                }`}
                            >
                                <Mic size={20} className={isListening ? 'animate-pulse' : ''} />
                            </button>

                            <button 
                                className={`p-3 rounded-xl transition-all duration-300 ${
                                    inputValue 
                                        ? 'bg-matrix-green text-black shadow-[0_0_25px_rgba(0,255,65,0.5)] scale-105 active:scale-95' 
                                        : 'bg-white/5 text-gray-600'
                                }`}
                                onClick={onToggleCommander}
                            >
                                <CornerDownLeft size={20} />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {isFocused && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className="flex-1 flex flex-col pb-8 gap-8"
                            >
                                <div className="flex flex-col gap-3">
                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Sliders size={12} /> GLOBAL_TACTICAL_FILTERS
                                    </span>
                                    <div className="flex gap-4">
                                        {QUICK_FILTERS.map((f) => (
                                            <button 
                                                key={f.label}
                                                className="px-5 py-2.5 bg-black/40 hover:bg-matrix-green/10 border border-white/10 hover:border-matrix-green/50 rounded-lg flex items-center gap-3 transition-all group"
                                            >
                                                <f.icon size={16} className={`${f.color} group-hover:scale-110 transition-transform`} />
                                                <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-white uppercase">{f.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex-1 flex gap-12 border-t border-white/5 pt-6">
                                    <div className="flex-1">
                                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-3 block">RECENT_QUERIES</span>
                                        <div className="flex flex-wrap gap-2">
                                            {['DEEPSEEK', 'DATA_VISUALS', 'CYBER_SEC'].map(h => (
                                                <div key={h} className="text-[10px] font-mono px-3 py-1.5 bg-white/5 border border-white/5 rounded-md text-gray-500 hover:text-matrix-green hover:border-matrix-green/30 cursor-pointer transition-all">
                                                    #{h}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-matrix-green/5 border border-matrix-green/10 p-4 rounded-xl flex items-center gap-4">
                                            <Activity size={20} className="text-matrix-green animate-pulse" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-matrix-green font-bold uppercase tracking-wider">Neural_Lattice_Active</span>
                                                <span className="text-[9px] text-gray-600 font-mono">LATENCY: 14MS // SECTOR_V: {CONFIG.VERSION}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </header>

            <style>{`
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                .no-scrollbar::-webkit-scrollbar { display: none; }
            `}</style>
        </>
    );
};
