import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate, useRouteLoaderData } from 'react-router';
import { Telemetry } from '../../services/telemetry';
import { CommandRail } from '../../components/layout/CommandRail';
import { TopBar } from '../../components/layout/TopBar';
import { AppOverlays } from '../../components/layout/AppOverlays';
import { useAppData } from '../../hooks/useAppData';
import { useUIStore } from '../../stores/useUIStore';
import { useNRE, DEFAULT_NRE_PROFILE } from '../../hooks/useNRE';
import { useUserKeys } from '../../hooks/useUserKeys';
import { useProfile } from '../../hooks/useProfile';
import { useTelemetryPageTrack } from '../../hooks/useTelemetryPageTrack';
import { Agent, Achievement } from '../../types';

interface MainLayoutProps {
    initialAgents?: Agent[];
    searchManifest?: any[];
}

export default function MainLayout({ initialAgents = [], searchManifest = [] }: MainLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const rootData = useRouteLoaderData("root") as { user: any } | undefined;
    const user = rootData?.user ?? null;

    // ─── Global State & Hooks ────────────────────────────────────────────────
    const { keys, saveKey, rememberInSession, setRememberInSession } = useUserKeys();
    const { profile, addXp, updateBalance, logout, unlockAchievement, syncUserProgress } = useProfile(user);
    const { agents, initializing } = useAppData(initialAgents);
    const { 
        activeAgentId, setActiveAgentId, 
        showLogin, setShowLogin, 
        showKeyVault, setShowKeyVault
    } = useUIStore();
    
    // Local UI states (migrated from App.tsx)
    const [isCommanderOpen, setIsCommanderOpen] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [nreProfile, setNREProfile] = useState(DEFAULT_NRE_PROFILE);
    const [showAscension, setShowAscension] = useState(false);
    const [isAdminVisible, setIsAdminVisible] = useState(false);
    const [activeToast, setActiveToast] = useState<Achievement | null>(null);
    const [isSentinelIntersecting, setIsSentinelIntersecting] = useState(false);

    // Navigation & FX
    const isTransit = false;
    const showGlitch = false;
    
    // NRE Sorting
    const finalDisplayList = useNRE(agents, filterTag, nreProfile);
    const currentAgent = agents.find(a => a.id === activeAgentId) || null;

    // Derive validCategories from searchManifest
    const validCategories = Array.from(new Set(searchManifest.map(a => a.c).filter(Boolean)));

    // Telemetry
    useTelemetryPageTrack();

    // ─── Lifecycle ───────────────────────────────────────────────────────────

    // ─── Handlers ────────────────────────────────────────────────────────────
    const handleAgentSelect = useCallback((agent: Agent) => {
        setActiveAgentId(agent.id);
        setShowGrid(false);
        navigate(`/agent/${agent.slug || agent.id}`);
    }, [setActiveAgentId, navigate]);

    // ─── Context for Outlet ──────────────────────────────────────────────────
    const contextValue = {
        agents,
        finalDisplayList,
        activeAgentId,
        setActiveAgentId,
        currentAgent,
        profile,
        isForging: false, // Placeholder if not used globally
        isSpeaking: false, // Placeholder if not used globally
        isCommanderOpen,
        nreProfile,
        setNREProfile,
        addXp,
        updateBalance,
        unlockAchievement,
        syncUserProgress,
        initializing,
        isSentinelIntersecting,
        validCategories
    };

    return (
        <div className="flex h-screen w-full bg-[#050505] overflow-hidden text-white selection:bg-emerald-500/30">
            {/* Global Overlays */}
            <AppOverlays 
                initializing={initializing}
                isTransit={isTransit}
                showGlitch={showGlitch}
                showLogin={showLogin}
                setShowLogin={setShowLogin}
                showKeyVault={showKeyVault}
                setShowKeyVault={setShowKeyVault}
                keys={keys}
                saveKey={saveKey}
                rememberInSession={rememberInSession}
                setRememberInSession={setRememberInSession}
                showAscension={showAscension}
                setShowAscension={setShowAscension}
                isAdminVisible={isAdminVisible}
                setIsAdminVisible={setIsAdminVisible}
                activeToast={activeToast}
                setActiveToast={setActiveToast}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                filterTag={filterTag}
                setFilterTag={setFilterTag}
                onSelectAgent={handleAgentSelect}
                isCommanderOpen={isCommanderOpen}
                setIsCommanderOpen={setIsCommanderOpen}
                agents={agents}
            />

            {/* 左侧栏：固定宽度，不参与弹性收缩 */}
            <div className="flex-none z-50">
                <CommandRail 
                    userProfile={profile}
                    isLoggedIn={profile.id !== 'guest'}
                    onLogoutClick={logout}
                    onToggleCommander={() => setIsCommanderOpen(!isCommanderOpen)}
                    isCommanderOpen={isCommanderOpen}
                />
            </div>

            {/* 右侧主工作区：占据剩余全部空间 */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                {/* 顶栏：固定高度，占据整行 */}
                <div className="flex-none z-[60] sticky top-0 bg-[#050505]/90 backdrop-blur-md">
                    <TopBar 
                        userProfile={profile}
                        onToggleCommander={() => setIsCommanderOpen(!isCommanderOpen)}
                        searchManifest={searchManifest}
                    />
                </div>

                {/* 动态内容区：子组件自行处理滚动以支持复杂的滚动交互 */}
                <main 
                    className="flex-1 overflow-y-auto relative main-scroll-area"
                >
                    <Outlet context={contextValue} />
                    {/* 占位符以确保滚动到底部 */}
                    <div className="h-20" />
                </main>
            </div>
        </div>
    );
}
