import React, { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Package, X, ExternalLink, Activity, Terminal } from 'lucide-react';
import { useNavigate, Link } from 'react-router';
import { UserProfile, UserRank, Agent } from '../../../types';
import { getRankInfo } from '../../../services/rankService';
import { dataService } from '../../../services/dataService';
import { YouAgentLogo } from '../../ui/YouAgentLogo';
import { HoloProjector } from '../../ui/HoloProjector';
import { AgentCard } from '../../ui/AgentCard';
import { useSearchEngine } from '../../../hooks/useSearchEngine';
import { useMultimodalIngestion } from '../../../hooks/useMultimodalIngestion';
import { useVoiceCommand } from '../../../hooks/useVoiceCommand';
import { useNeuralSwitch } from '../../../hooks/useNeuralSwitch';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { useArsenal } from '../../../hooks/useArsenal';
import { SearchOmnibox } from './SearchOmnibox';

import { TacticalVerdict } from '../../tactical/TacticalVerdict';
import { SwarmPreview } from '../../shared/SwarmPreview';

export interface TopBarProps {
    userProfile: UserProfile;
    onToggleCommander: () => void; 
    alertMessage?: string | null; 
    onLogoClick?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ 
    userProfile,
    onToggleCommander,
    alertMessage,
    onLogoClick
}) => {
    const navigate = useNavigate();
    const [popularAgents, setPopularAgents] = useState<Agent[]>([]);
    const { isMobile } = useDeviceType();
    const { arsenalAgents, arsenalIds, removeFromArsenal } = useArsenal();
    const [isArsenalOpen, setIsArsenalOpen] = useState(false);
    const [isLogoPulsing, setIsLogoPulsing] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Custom Hooks
    const { 
        inputValue, setInputValue, searchResults, isSearching, tacticalLogs, 
        executeCommand, handleKeyDown, clearLogs, mode, setMode, 
        isFocused, setIsFocused, inputRef, isSystemOffline,
        tacticalVerdict, isVerdictProcessing, swarmPlan
    } = useSearchEngine();

    const { 
        fileInputRef, isDragging, triggerIngestion, handleFileChange, dropzoneProps 
    } = useMultimodalIngestion((files) => {
        setInputValue(prev => prev + files.map(f => ` [FILE: ${f.name}] `).join(''));
    });

    const { 
        isListening, voiceFeedback, toggleVoiceInput, transcript 
    } = useVoiceCommand((text) => setInputValue(text));

    const { response, thinking, isThinking, executeNeuralQuery } = useNeuralSwitch();

    useEffect(() => {
        dataService.getPopularAgents().then(setPopularAgents);
    }, []);

    const rank: UserRank = getRankInfo(userProfile.xp);
    const progress = Math.min(100, (userProfile.xp / rank.nextLevelXp) * 100);

    const handleEnter = () => {
        if (inputValue.startsWith('/')) {
            executeCommand(inputValue);
            setTimeout(() => setInputValue(''), 1000);
        } else if (mode === 'CHAT') {
            executeNeuralQuery(inputValue, searchResults);
        } else {
            // Default search behavior handled by useSearchEngine debounce
        }
    };

    const handleLogoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsLogoPulsing(true);
        setTimeout(() => setIsLogoPulsing(false), 300);
        if (onLogoClick) {
            onLogoClick();
        } else {
            navigate('/');
        }
    };

    return (
        <>
            <div className="absolute top-0 left-0 w-full h-[2px] z-[60] bg-gray-900 pointer-events-none">
                <div 
                    className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]" 
                    style={{ width: `${progress}%`, backgroundColor: rank.color, color: rank.color }}
                ></div>
            </div>

            {/* HOLO PROJECTOR OVERLAY FOR CHAT */}
            <AnimatePresence>
                {mode === 'CHAT' && (response || isThinking) && (
                    <m.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-24 left-0 right-0 z-50 flex justify-center pointer-events-none"
                    >
                        <div className="w-full max-w-4xl pointer-events-auto px-4">
                            <HoloProjector 
                                thinking={thinking} 
                                content={response} 
                                isThinking={isThinking}
                                onClose={() => setMode('SEARCH')}
                            />
                        </div>
                    </m.div>
                )}
            </AnimatePresence>


            <header className="w-full z-[100] h-20 bg-black/40 backdrop-blur-xl border-b border-white/10 flex items-center px-4 md:px-6">
                <div className="w-full flex items-center gap-4">
                    {/* BRAND LOGO */}
                    <div 
                        className="flex items-center gap-3 mr-2 md:mr-4 shrink-0 cursor-pointer group"
                        onClick={handleLogoClick}
                    >
                        <m.div
                            animate={isLogoPulsing ? { 
                                scale: [1, 0.9, 1.1, 1],
                                filter: ["drop-shadow(0 0 0px rgba(34,211,238,0))", "drop-shadow(0 0 15px rgba(34,211,238,0.8))", "drop-shadow(0 0 0px rgba(34,211,238,0))"]
                            } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            <YouAgentLogo className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                        </m.div>
                        <span className="hidden md:block font-display font-bold text-lg tracking-widest text-white select-none group-hover:text-cyan-100 transition-colors">
                            YOU<span className="text-cyan-400">AGENT</span>
                        </span>
                    </div>

                    {/* MODE INDICATOR */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                         <button 
                            onClick={() => inputRef.current?.focus()}
                            className={`relative px-2 py-1 rounded border transition-all duration-300 hover:bg-white/5 ${mode === 'CHAT' ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500' : 'border-transparent text-gray-500 hover:text-cyan-400'}`}
                         >
                            {mode === 'CHAT' ? <MessageSquare size={16} /> : <Search size={20} />}
                         </button>
                    </div>

                    {/* OMNIBOX (Input Hub) */}
                    <SearchOmnibox 
                        inputValue={inputValue}
                        setInputValue={setInputValue}
                        handleKeyDown={handleKeyDown}
                        isFocused={isFocused}
                        setIsFocused={setIsFocused}
                        isDragging={isDragging}
                        dropzoneProps={dropzoneProps}
                        fileInputRef={fileInputRef}
                        handleFileChange={handleFileChange}
                        triggerIngestion={triggerIngestion}
                        isMobile={isMobile}
                        inputRef={inputRef}
                        isListening={isListening}
                        toggleVoiceInput={toggleVoiceInput}
                        voiceFeedback={voiceFeedback}
                        onEnter={handleEnter}
                        popularAgents={popularAgents}
                    />

                    {/* ARSENAL DROPDOWN */}
                    <div className="relative ml-2">
                        <button 
                            onClick={() => setIsArsenalOpen(!isArsenalOpen)}
                            className={`p-2 rounded-lg border transition-all duration-300 relative group ${
                                isArsenalOpen 
                                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                                    : 'bg-black/40 border-white/10 text-gray-400 hover:text-cyan-400 hover:border-cyan-500/50'
                            }`}
                        >
                            <Package size={20} />
                            {isMounted && arsenalIds.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-black">
                                    {arsenalIds.length}
                                </span>
                            )}
                        </button>

                        <AnimatePresence>
                            {isArsenalOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-40" 
                                        onClick={() => setIsArsenalOpen(false)} 
                                    />
                                    <m.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 top-full mt-2 w-80 bg-black/95 border border-cyan-500/30 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-xl z-50 overflow-hidden"
                                    >
                                        <div className="p-3 border-b border-white/10 flex justify-between items-center bg-cyan-950/20">
                                            <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider">TACTICAL ARSENAL</span>
                                            <span className="text-[10px] font-mono text-gray-500">{arsenalIds.length} UNITS</span>
                                        </div>
                                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-2">
                                            {arsenalAgents.length > 0 ? (
                                                arsenalAgents.map(agent => (
                                                    <Link 
                                                        key={agent.id} 
                                                        to={`/agent/${agent.slug || agent.id}`}
                                                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 block"
                                                        onClick={() => setIsArsenalOpen(false)}
                                                    >
                                                        <div 
                                                            className="w-10 h-10 rounded bg-gray-800 bg-cover bg-center shrink-0"
                                                            style={{ backgroundImage: `url(${agent.cover_url})` }}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-bold text-gray-200 truncate group-hover:text-cyan-400 transition-colors">{agent.name}</div>
                                                            <div className="text-[10px] text-gray-500 truncate font-mono">{agent.category}</div>
                                                        </div>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.preventDefault(); // Prevent Link navigation
                                                                e.stopPropagation();
                                                                removeFromArsenal(agent.id);
                                                            }}
                                                            className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </Link>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center flex flex-col items-center gap-2 text-gray-600">
                                                    <Package size={24} className="opacity-20" />
                                                    <span className="text-xs font-mono">ARSENAL EMPTY</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {arsenalAgents.length > 0 && (
                                            <div className="p-2 border-t border-white/10 bg-black/40">
                                                <button 
                                                    onClick={() => {
                                                        // In a real app, this would export JSON or sync
                                                        alert("ARSENAL SYNCED TO CLOUD");
                                                    }}
                                                    className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-mono rounded border border-cyan-500/30 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <ExternalLink size={12} />
                                                    SYNC TO CLOUD
                                                </button>
                                            </div>
                                        )}
                                    </m.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* TACTICAL DRAWER (Search Panel) */}
            <AnimatePresence>
                {isFocused && (
                    <>
                        {/* Backdrop - Covers everything except the header area */}
                        <m.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed top-20 inset-0 z-[80] bg-black/60 backdrop-blur-md"
                            onClick={() => setIsFocused(false)}
                        />

                        {/* Drawer Container - Centered tactical window */}
                        {(inputValue || searchResults.length > 0 || isSearching || tacticalLogs.length > 0) && (
                            <m.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed top-20 inset-0 z-[90] flex justify-center items-start p-4 md:p-8 pointer-events-auto"
                                onClick={() => setIsFocused(false)}
                            >
                                {/* Tactical Frame - The actual bordered box */}
                                <m.div 
                                    initial={{ y: -20, scale: 0.98, opacity: 0 }}
                                    animate={{ y: 0, scale: 1, opacity: 1 }}
                                    exit={{ y: -20, scale: 0.98, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="relative w-full max-w-5xl flex flex-col bg-black/95 border-2 border-cyan-400 shadow-[0_0_50px_rgba(6,182,212,0.4)] rounded-2xl overflow-hidden pointer-events-auto h-[80vh] min-h-[400px] mt-[-1rem] md:mt-[-2rem]"
                                >
                                    {/* Close Button */}
                                    <button 
                                        onClick={() => setIsFocused(false)}
                                        className="absolute top-4 right-4 flex items-center justify-center w-10 h-10 text-cyan-400/70 hover:text-cyan-400 bg-cyan-400/5 hover:bg-cyan-400/10 border border-cyan-400/20 rounded-lg transition-all z-20 group"
                                        title="CLOSE_TACTICAL_DRAWER"
                                    >
                                        <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                                    </button>

                                    {/* Results Header/Status */}
                                    <div className="px-6 py-4 border-b border-cyan-400/30 bg-cyan-400/5 flex items-center justify-between shrink-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.8)]" />
                                            <span className="text-xs font-mono text-cyan-400 font-bold tracking-[0.3em]">NEURAL_SEARCH_RESULTS</span>
                                        </div>
                                        {isSearching && (
                                            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 animate-pulse mr-24">
                                                <Activity size={12} className="animate-spin" />
                                                ANALYZING_DATA_STREAM...
                                            </div>
                                        )}
                                    </div>

                                    {/* Scrollable Results List */}
                                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-black/40">
                                        {isSystemOffline ? (
                                            <div className="flex flex-col items-center justify-center p-12 border border-red-500/30 bg-red-900/10 rounded-xl gap-3">
                                                <div className="text-red-500 font-mono font-bold animate-pulse text-sm">
                                                    [SYSTEM_OFFLINE_RETRY_LATER]
                                                </div>
                                                <div className="text-red-400/50 text-[10px] font-mono">
                                                    NEURAL_UPLINK_SEVERED_BY_EXTERNAL_INTERFERENCE
                                                </div>
                                            </div>
                                        ) : (inputValue || searchResults.length > 0) ? (
                                            <div className="flex flex-col lg:flex-row gap-6 h-full">
                                                <div className="w-full lg:w-1/2 shrink-0">
                                                    <TacticalVerdict verdict={tacticalVerdict} isAnalyzing={isVerdictProcessing} />
                                                    {swarmPlan && <SwarmPreview plan={swarmPlan} />}
                                                </div>
                                                
                                                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2 lg:w-1/2">
                                                    {searchResults.length > 0 ? (
                                                        searchResults.map(agent => (
                                                            <AgentCard 
                                                                key={agent.id} 
                                                                agent={agent} 
                                                                onClick={() => {
                                                                    setIsFocused(false);
                                                                }}
                                                            />
                                                        ))
                                                    ) : (
                                                        !isSearching && !inputValue.startsWith('/') && inputValue.length > 2 && (
                                                            <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-4">
                                                                <Search size={48} className="opacity-20 text-cyan-400" />
                                                                <div className="text-sm font-mono italic tracking-widest text-cyan-400/40">NO_NEURAL_MATCHES_FOUND_IN_THIS_SECTOR</div>
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-24 text-gray-700 gap-6">
                                                <Terminal size={48} className="opacity-10 text-cyan-400" />
                                                <div className="text-xs font-mono tracking-[0.4em] uppercase opacity-40 text-cyan-400">Awaiting Neural Input...</div>
                                            </div>
                                        )}
                                    </div>
                                </m.div>
                            </m.div>
                        )}
                    </>
                )}
            </AnimatePresence>
            <style>{`
                @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
                .animate-scan { animation: scan 2s linear infinite; }
                /* Custom Scrollbar */
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(0, 0, 0, 0.3);
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(34, 211, 238, 0.2);
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(34, 211, 238, 0.4);
                }
            `}</style>
        </>
    );
};
