
import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Zap, Key } from 'lucide-react';

import { Agent, Achievement } from './types';
import { dataService } from './services/dataService';
import { cerebroService } from './services/cerebroService';
import { CONFIG } from './config';
import { XP_EVENTS, ACHIEVEMENTS, getRankInfo } from './services/rankService';

// Hooks
import { useNRE, NREProfile, DEFAULT_NRE_PROFILE } from './hooks/useNRE';
import { useNavigation } from './hooks/useNavigation';
import { useTTS } from './hooks/useTTS';
import { useProfile } from './hooks/useProfile';
import { useUserKeys } from './hooks/useUserKeys';
import { UIState, useUIStore } from './src/stores/useUIStore';

// Components (Direct Import for Critical Path)
import { CommandRail } from './components/layout/CommandRail';
import { TopBar } from './components/layout/TopBar';
import { DiscoverView } from './components/views/DiscoverView';
import { LoginModal } from './components/auth/LoginModal';
import { NeuralCommander } from './components/shared/NeuralCommander';
import { AchievementToast } from './components/shared/AchievementToast';
import { AscensionOverlay } from './components/shared/AscensionOverlay';

// Telemetry
import { Telemetry } from './services/telemetry';

// 🧩 Protocol V15.0: Lazy Load Non-Critical Views
const LoungeView = React.lazy(() => import('./components/views/LoungeView').then(module => ({ default: module.LoungeView })));
const ArenaView = React.lazy(() => import('./components/views/ArenaView').then(module => ({ default: module.ArenaView })));
const WorkflowEngine = React.lazy(() => import('./components/views/WorkflowView').then(module => ({ default: module.WorkflowEngine })));
const LeaderboardView = React.lazy(() => import('./components/views/LeaderboardView').then(module => ({ default: module.LeaderboardView })));
const AdminConsole = React.lazy(() => import('./components/admin/AdminConsole').then(module => ({ default: module.AdminConsole })));
const AgentGrid = React.lazy(() => import('./components/views/AgentGrid').then(module => ({ default: module.AgentGrid })));
const DirectoryView = React.lazy(() => import('./components/views/DirectoryView').then(module => ({ default: module.DirectoryView })));

// --- Loading Screen ---
const LoadingScreen = () => (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 animate-pulse"></div>
        <div className="flex flex-col items-center gap-6 relative z-10">
            <div className="w-16 h-16 border-4 border-matrix-green/30 border-t-matrix-green rounded-full animate-spin"></div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-matrix-green font-display font-bold tracking-[0.2em] animate-pulse uppercase">Synchronizing Neural Core</span>
            </div>
        </div>
    </div>
);

const TransitLayer = () => (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-matrix-green/5 animate-pulse"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl md:text-8xl font-display font-black text-white mix-blend-overlay tracking-tighter scale-y-150 animate-pulse opacity-80">NEURAL_JUMP</div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black"></div>
    </div>
);

const GlitchTransition: React.FC = () => (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-black/20 mix-blend-hard-light animate-pulse"></div>
        <div className="w-full h-2 bg-white/50 absolute top-1/2 -translate-y-1/2 blur-sm animate-[glitch_0.2s_ease-in-out_infinite]"></div>
    </div>
);

const KeyVaultModal = ({ onClose, keys, saveKey, rememberInSession, setRememberInSession }: any) => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/90 backdrop-blur">
        <div className="w-full max-w-md bg-gray-900 border border-yellow-500/50 rounded-xl p-6 shadow-2xl">
            <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2"><Key size={20} className="text-yellow-500" /> GLOBAL KEY VAULT</h3>
            <div className="text-[10px] text-gray-400 font-mono mb-4 leading-relaxed">
                Keys are stored only in your browser&apos;s session memory for security. They are never sent to our servers except for proxying.
            </div>
            <label className="flex items-center gap-2 text-[10px] text-gray-300 font-mono mb-4 select-none">
                <input
                    type="checkbox"
                    checked={Boolean(rememberInSession)}
                    onChange={(e) => setRememberInSession(Boolean(e.target.checked))}
                    className="accent-yellow-500"
                />
                REMEMBER FOR THIS SESSION
            </label>
            <div className="space-y-4 mb-6">
                {['google', 'openai', 'anthropic', 'deepseek'].map(p => (
                    <div key={p}>
                        <label className="text-[10px] text-gray-500 font-mono block mb-1 uppercase">{p}_API_KEY</label>
                        <input type="password" value={keys[p] || ''} onChange={(e) => saveKey(p, e.target.value)} className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs font-mono focus:border-yellow-500 focus:outline-none" />
                    </div>
                ))}
            </div>
            <div className="flex justify-end"><button onClick={onClose} className="px-4 py-2 bg-yellow-500 text-black font-bold text-xs rounded hover:bg-yellow-400 transition-colors">SECURE & CLOSE</button></div>
        </div>
    </div>
);

export default function App() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [showGrid, setShowGrid] = useState(false);

    const [initializing, setInitializing] = useState(true);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const BATCH_SIZE = 12;

    const { profile, isLoggedIn, loading: profileLoading, addXp, updateBalance, unlockAchievement, logout, syncUserProgress } = useProfile();
    const [activeToast, setActiveToast] = useState<Achievement | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const { keys, saveKey, rememberInSession, setRememberInSession } = useUserKeys();

    const currentView = useUIStore((s: UIState) => s.currentView);
    const setCurrentView = useUIStore((s: UIState) => s.setCurrentView);
    const showLogin = useUIStore((s: UIState) => s.showLogin);
    const setShowLogin = useUIStore((s: UIState) => s.setShowLogin);
    const showKeyVault = useUIStore((s: UIState) => s.showKeyVault);
    const setShowKeyVault = useUIStore((s: UIState) => s.setShowKeyVault);
    const audioUnlocked = useUIStore((s: UIState) => s.audioUnlocked);
    const setAudioUnlocked = useUIStore((s: UIState) => s.setAudioUnlocked);
    const volume = useUIStore((s: UIState) => s.volume);
    const setVolume = useUIStore((s: UIState) => s.setVolume);

    const [nreProfile, setNREProfile] = useState<NREProfile>(DEFAULT_NRE_PROFILE);
    const [showAscension, setShowAscension] = useState(false);
    const prevRankLevel = useRef(1);

    const activeAgentId = useUIStore((s: UIState) => s.activeAgentId);
    const setActiveAgentId = useUIStore((s: UIState) => s.setActiveAgentId);
    const [filterTag, setFilterTag] = useState<string | null>(null);

    const [isCommanderOpen, setIsCommanderOpen] = useState(false);
    const [preSelectedWorkflowNodes, setPreSelectedWorkflowNodes] = useState<string[]>([]);

    const [isAdminVisible, setIsAdminVisible] = useState(false);
    const [adminClicks, setAdminClicks] = useState(0);
    const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [isForging, setIsForging] = useState(false);

    const handleNavigateXP = () => addXp(XP_EVENTS.NAVIGATE);

    // 📡 Telemetry: Track Page Views
    useEffect(() => {
        Telemetry.trackPage(currentView);
    }, [currentView]);

    // 📡 Telemetry: Identify User
    useEffect(() => {
        if (profile && profile.id && profile.id !== 'guest') {
            Telemetry.identify(profile.id, {
                username: profile.username,
                rank: getRankInfo(profile.xp).title,
                xp: profile.xp
            });
        }
    }, [profile.id]);

    // --- SOCIAL HANDLERS ---
    const handleLike = useCallback(async (agentId: string) => {
        const likeAchievementId = `liked:${agentId}`;
        if (profile.achievements.includes(likeAchievementId)) return;

        Telemetry.track('agent_liked', { agentId }); // Telemetry
        addXp(XP_EVENTS.CHAT_MESSAGE); // Give a small reward
        unlockAchievement(likeAchievementId, 20);
        await dataService.incrementAgentStat(agentId, 'like');
    }, [profile, addXp, unlockAchievement]);

    const handleBookmark = useCallback((agentId: string) => {
        const isBookmarked = profile.badges.includes(agentId);
        let newBadges = [...profile.badges];

        if (isBookmarked) {
            newBadges = newBadges.filter(id => id !== agentId);
        } else {
            newBadges.push(agentId);
            addXp(10);
            Telemetry.track('agent_bookmarked', { agentId }); // Telemetry
        }

        syncUserProgress({ ...profile, badges: newBadges });
    }, [profile, syncUserProgress, addXp]);

    const handleShare = useCallback(async (agent: Agent) => {
        const shareData = {
            title: `YouAgent // ${agent.name}`,
            text: agent.slogan,
            url: window.location.href,
        };

        Telemetry.track('agent_shared', { agentId: agent.id }); // Telemetry

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                addXp(25);
            } else {
                await navigator.clipboard.writeText(window.location.href);
                setAlertMessage("[ SIGNAL_COPIED_TO_CLIPBOARD ]");
                setTimeout(() => setAlertMessage(null), 3000);
            }
        } catch (err) {
            console.warn("[SHARE] System Interrupted");
        }
    }, [addXp]);

    useEffect(() => {
        const rank = getRankInfo(profile.xp);
        if (rank.level > prevRankLevel.current && !profileLoading) {
            setShowAscension(true);
            Telemetry.track('user_ascended', { newLevel: rank.level, title: rank.title }); // Telemetry
            if (audioUnlocked) {
                fetch('https://directorai.vercel.app/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `NEURAL EVOLUTION COMPLETE. ACCESS LEVEL ${rank.title} GRANTED.`,
                        voice: 'en-US-EricNeural'
                    })
                }).then(r => r.blob()).then(blob => {
                    const audio = new Audio(URL.createObjectURL(blob));
                    audio.volume = volume;
                    audio.play().catch(() => { });
                }).catch(e => console.error("TTS Fail", e));
            }
        }
        prevRankLevel.current = rank.level;
    }, [profile.xp, profileLoading, audioUnlocked]);

    useEffect(() => {
        const runSentinel = async () => {
            if (sessionStorage.getItem('SENTINEL_RAN')) return;
            try {
                const superstars = await cerebroService.runSentinelStream((msg) => console.log(msg));
                if (superstars > 0) {
                    setAlertMessage(`[ ALERT: ${superstars} NEW_SUPERSTAR_AGENT${superstars > 1 ? 'S' : ''}_DETECTED ]`);
                }
                sessionStorage.setItem('SENTINEL_RAN', 'true');
            } catch (e) {
                console.error("[SENTINEL] Auto-Scan Failed", e);
            }
        };

        if (!initializing) {
            const timer = setTimeout(runSentinel, 5000);
            return () => clearTimeout(timer);
        }
    }, [initializing]);

    const rankedAgents = useNRE(agents, null, nreProfile);

    // We only use finalDisplayList for the main swipe view if no explicit filter is active causing grid view
    const finalDisplayList = useMemo(() => {
        return rankedAgents;
    }, [rankedAgents]);

    const { isTransit, showGlitch, direction } = useNavigation(
        finalDisplayList,
        activeAgentId,
        setActiveAgentId,
        handleNavigateXP
    );

    const currentAgent = finalDisplayList.find(a => a.id === activeAgentId) || null;
    const { isSpeaking } = useTTS(currentAgent);

    useEffect(() => {
        if (finalDisplayList.length > 0 && (!activeAgentId || !finalDisplayList.find(a => a.id === activeAgentId))) {
            setActiveAgentId(finalDisplayList[0].id);
        }
    }, [finalDisplayList, activeAgentId]);

    const loadNextBatch = async () => {
        if (isFetchingMore || !hasMore) return;
        setIsFetchingMore(true);

        try {
            const nextBatch = await dataService.getAgents(page, BATCH_SIZE);
            if (nextBatch.length === 0) {
                setHasMore(false);
            } else {
                setAgents(prev => {
                    const combined = [...prev, ...nextBatch];
                    const unique = Array.from(new Map(combined.map(a => [a.id, a])).values());
                    return unique;
                });
                setPage(prev => prev + 1);
                if (nextBatch.length < BATCH_SIZE) setHasMore(false);
            }
        } catch (e) {
            console.error("[SPEED_FORCE] Load failed:", e);
        } finally {
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        if (!activeAgentId || !hasMore || isFetchingMore) return;
        const currentIndex = finalDisplayList.findIndex(a => a.id === activeAgentId);
        if (currentIndex >= finalDisplayList.length - 3) {
            loadNextBatch();
        }
    }, [activeAgentId, finalDisplayList, hasMore, isFetchingMore]);

    // 🚀 Protocol V15.0 & V19.0: Fast-Track Data Hydration with Time Travel
    // ⛑️ V-GOLDEN-GATE: Top-level failsafe — any crash MUST release the loading lock
    useEffect(() => {
        const initData = async () => {
            setPage(0);
            let fetchedAgents: Agent[] = [];

            // 1. V19.0: LOCAL STORAGE "TIME TRAVEL" (Instant Render)
            try {
                // FORCE CLEAR CACHE TO FIX THE 7 ITEM LOOP BUG
                localStorage.removeItem('sys_agent_cache');
                
                const localCache = localStorage.getItem('sys_agent_cache');
                if (localCache) {
                    const parsed = JSON.parse(localCache);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log(`[TIME_TRAVEL] Restored ${parsed.length} agents from local persistence.`);
                        setAgents(parsed);
                        setInitializing(false); // Unblock UI immediately
                    }
                }
            } catch (e) {
                console.warn("[TIME_TRAVEL] Cache corrupted, clearing.", e);
                try { localStorage.removeItem('sys_agent_cache'); } catch (_) { }
            }

            try {
                // 2. NETWORK SYNC (Background or Foreground if no cache)
                // Check for Edge Preload first
                if ((window as any).__INITIAL_DATA__) {
                    try {
                        // FORCE CLEAR INITIAL DATA TO FIX THE 7 ITEM LOOP BUG
                        (window as any).__INITIAL_DATA__ = null;
                        
                        fetchedAgents = await (window as any).__INITIAL_DATA__;
                        if (!fetchedAgents || fetchedAgents.length === 0) throw new Error("Empty Preload");
                        console.log(`[FAST_TRACK] Consumed ${fetchedAgents.length} agents from Edge.`);
                    } catch (e) {
                        console.warn("[FAST_TRACK] Preload miss/fail, falling back to Service.");
                        fetchedAgents = await dataService.getAgents(0, BATCH_SIZE);
                    }
                } else {
                    fetchedAgents = await dataService.getAgents(0, BATCH_SIZE);
                }

                // 3. UPDATE STATE & PERSIST
                if (fetchedAgents && fetchedAgents.length > 0) {
                    // Defensive mapping: filter out any null/undefined items
                    const safeAgents = fetchedAgents.filter(a => a && a.id);
                    const uniqueAgents = Array.from(new Map(safeAgents.map(a => [a.id, a])).values());
                    setAgents(uniqueAgents);
                    try {
                        // V19.1: Store only top 10 to prevent QuotaExceededError
                        localStorage.setItem('sys_agent_cache', JSON.stringify(uniqueAgents.slice(0, 10)));
                    } catch (e) {
                        try { localStorage.removeItem('sys_agent_cache'); } catch (_) { }
                    }
                }

                setPage(1);
                if (fetchedAgents.length < BATCH_SIZE) setHasMore(false);

            } catch (e: any) {
                // ⛑️ FAILSAFE: Log the error, then ALWAYS release the loading screen
                console.error("[GOLDEN_GATE] Critical Load Failure — forcing UI unlock:", e?.message || e);
                console.error("[GOLDEN_GATE] Check: 1) Supabase RLS (403/401?), 2) Network, 3) Data mapping crash.");
            } finally {
                // ALWAYS release the loading lock — black screen / infinite loader is unacceptable
                setTimeout(() => setInitializing(false), 200);
            }
        };
        initData();
    }, []);

    // --- ACTIONS ---

    const handleTagClick = (tag: string) => {
        setFilterTag(tag);
        setShowGrid(true); // Trigger Grid Overlay
        Telemetry.track('filter_tag_clicked', { tag }); // Telemetry
    };

    const handleAgentSelectFromGrid = (agent: Agent) => {
        // Step 2: Two-Step Navigation
        setShowGrid(false);
        setFilterTag(null); // Clear filter for main view context (or keep it if you want filtered swipe)
        // Check if agent is in main list, if not add it
        setAgents(prev => {
            if (prev.find(a => a.id === agent.id)) return prev;
            return [agent, ...prev];
        });
        setActiveAgentId(agent.id);
        setCurrentView('discover');
        Telemetry.track('agent_selected_grid', { agentId: agent.id }); // Telemetry
    };

    const handleCommanderActions = {
        onFilter: (tag: string) => {
            handleTagClick(tag);
        },
        onFlow: (ids: string[]) => {
            setPreSelectedWorkflowNodes(ids);
            setCurrentView('workflow');
        }
    };

    const handleSecretClick = () => {
        setAdminClicks(prev => {
            const newVal = prev + 1;
            if (newVal >= 5) {
                setIsAdminVisible(true);
                Telemetry.track('admin_console_accessed'); // Telemetry
                return 0;
            }
            return newVal;
        });
        if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = setTimeout(() => setAdminClicks(0), 3000);
    };

    if (initializing) return <LoadingScreen />;

    const userRank = getRankInfo(profile.xp);

    return (
        <div className="bg-black min-h-screen text-white font-mono selection:bg-matrix-green selection:text-black overflow-hidden relative">

            <CommandRail
                userProfile={profile}
                isLoggedIn={isLoggedIn}
                onLogoutClick={logout}
                onToggleCommander={() => setIsCommanderOpen(!isCommanderOpen)}
                isCommanderOpen={isCommanderOpen}
            />

            <NeuralCommander
                isOpen={isCommanderOpen}
                onClose={() => setIsCommanderOpen(false)}
                keys={keys}
                saveKey={saveKey}
                agents={agents}
                actions={handleCommanderActions}
            />

            <div className="fixed top-0 left-0 w-20 h-20 z-[9999] cursor-default" onClick={handleSecretClick} style={{ pointerEvents: 'auto' }}></div>

            <AnimatePresence>
                {isAdminVisible && (
                    <Suspense key="admin" fallback={null}>
                        <AdminConsole onClose={() => setIsAdminVisible(false)} />
                    </Suspense>
                )}
                {isTransit && <TransitLayer key="transit" />}
                {showGlitch && <GlitchTransition key="glitch" />}
                {showAscension && <AscensionOverlay key="ascension" onComplete={() => setShowAscension(false)} />}
                {showLogin && <LoginModal key="login" onClose={() => setShowLogin(false)} />}
                {showKeyVault && (
                    <KeyVaultModal
                        key="keyvault"
                        onClose={() => setShowKeyVault(false)}
                        keys={keys}
                        saveKey={saveKey}
                        rememberInSession={rememberInSession}
                        setRememberInSession={setRememberInSession}
                    />
                )}

                {/* NEW: Filtered Discovery Overlay (Agent Grid) - Lazy Loaded */}
                {showGrid && filterTag && (
                    <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150]">
                        <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center bg-black/80 z-[200]"><div className="w-8 h-8 border-2 border-matrix-green rounded-full animate-spin" /></div>}>
                            <AgentGrid
                                filterTag={filterTag}
                                onClose={() => { setShowGrid(false); setFilterTag(null); }}
                                onSelectAgent={handleAgentSelectFromGrid}
                            />
                        </Suspense>
                    </motion.div>
                )}

                {/* Removed Floating ArchitectControl, now embedded in TacticalHUD */}

                {activeToast && (
                    <AchievementToast
                        key="toast"
                        title={activeToast.title}
                        description={activeToast.description}
                        onClose={() => setActiveToast(null)}
                    />
                )}
            </AnimatePresence>

            {currentView !== 'lounge' && (
                <TopBar
                    userProfile={profile}
                    onToggleCommander={() => setIsCommanderOpen(!isCommanderOpen)}
                    alertMessage={alertMessage}
                />
            )}

            <main className="md:pl-20 transition-all duration-500">
                <AnimatePresence mode='wait'>
                    {currentView === 'discover' && (
                        // DiscoverView is critical path, kept eager loaded
                        <DiscoverView
                            key="discover"
                            agents={finalDisplayList}
                            activeAgentId={activeAgentId}
                            direction={direction}
                            setActiveAgentId={setActiveAgentId}
                            onEnterLounge={(agent) => { setActiveAgentId(agent.id); setCurrentView('lounge'); }}
                            onTagClick={handleTagClick}
                            onLike={handleLike}
                            onBookmark={handleBookmark}
                            onShare={handleShare}
                            userProfile={profile}
                            isForging={isForging}
                            isSpeaking={isSpeaking}
                            isSystemCalculationMode={isCommanderOpen}
                            nreProfile={nreProfile}
                            setNREProfile={setNREProfile}
                        />
                    )}

                    {currentView === 'battle' && (
                        <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full absolute inset-0">
                            <Suspense fallback={<LoadingScreen />}>
                                <ArenaView
                                    agents={agents}
                                    lastViewedId={activeAgentId}
                                    balance={profile.balance}
                                    onUpdateBalance={(val) => {
                                        if (typeof val === 'number') {
                                            if (val < profile.balance) addXp(XP_EVENTS.BET_PLACED);
                                        } else {
                                            addXp(XP_EVENTS.BET_PLACED);
                                        }
                                        updateBalance(val);
                                    }}
                                />
                            </Suspense>
                        </motion.div>
                    )}

                    {currentView === 'workflow' && (
                        <motion.div key="workflow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full absolute inset-0">
                            <Suspense fallback={<LoadingScreen />}>
                                <WorkflowEngine agents={agents} />
                            </Suspense>
                        </motion.div>
                    )}

                    {currentView === 'rankings' && (
                        <motion.div key="rankings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full absolute inset-0">
                            <Suspense fallback={<LoadingScreen />}>
                                <LeaderboardView />
                            </Suspense>
                        </motion.div>
                    )}

                    {currentView === 'directory' && (
                        <motion.div key="directory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full absolute inset-0 overflow-y-auto z-[200] bg-black">
                            <Suspense fallback={<LoadingScreen />}>
                                <DirectoryView setActiveAgentId={setActiveAgentId} />
                            </Suspense>
                        </motion.div>
                    )}

                    {currentView === 'lounge' && currentAgent && (
                        <div key="lounge" className="fixed inset-0 z-[100] md:left-0 md:pl-20">
                            <Suspense fallback={<LoadingScreen />}>
                                <LoungeView
                                    key="lounge-inner"
                                    agent={currentAgent}
                                    allAgents={agents}
                                    onBack={() => setCurrentView('discover')}
                                    onChangeAgent={(agent) => setActiveAgentId(agent.id)}
                                    userProfile={profile}
                                    onActivity={(type) => {
                                        if (type === 'chat') addXp(XP_EVENTS.CHAT_MESSAGE);
                                    }}
                                />
                            </Suspense>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
