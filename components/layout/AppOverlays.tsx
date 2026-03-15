/**
 * components/layout/AppOverlays.tsx
 * Global overlay/modal layer extracted from App.tsx.
 * Manages: loading gate, transit animation, admin console, modals,
 * achievement toast, filtered agent grid.
 */
import React, { Suspense } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Agent, Achievement, UserKeys } from '../../types';
import { LoadingScreen, TransitLayer, GlitchTransition } from '../shared/LoadingScreens';

// Lazy overlays
const LoginModal = React.lazy(() => import('../auth/LoginModal').then(m => ({ default: m.LoginModal })));
const AchievementToast = React.lazy(() => import('../shared/AchievementToast').then(m => ({ default: m.AchievementToast })));
const AscensionOverlay = React.lazy(() => import('../shared/AscensionOverlay').then(m => ({ default: m.AscensionOverlay })));
const KeyVaultModal = React.lazy(() => import('../modals/KeyVaultModal').then(m => ({ default: m.KeyVaultModal })));
const AdminConsole = React.lazy(() => import('../admin/AdminConsole').then(m => ({ default: m.AdminConsole })));
const AgentGrid = React.lazy(() => import('../views/AgentGrid').then(m => ({ default: m.AgentGrid })));
const NeuralCommander = React.lazy(() => import('../shared/NeuralCommander').then(m => ({ default: m.NeuralCommander })));

import { ClientOnly } from '../shared/ClientOnly';

export interface AppOverlaysProps {
    // Loading gate
    initializing: boolean;
    // Navigation fx
    isTransit: boolean;
    showGlitch: boolean;
    // Auth
    showLogin: boolean;
    setShowLogin: (v: boolean) => void;
    // Key vault
    showKeyVault: boolean;
    setShowKeyVault: (v: boolean) => void;
    keys: UserKeys;
    saveKey: (provider: keyof UserKeys, key: string) => void;
    rememberInSession: boolean;
    setRememberInSession: (v: boolean) => void;
    // Ascension
    showAscension: boolean;
    setShowAscension: (v: boolean) => void;
    // Admin
    isAdminVisible: boolean;
    setIsAdminVisible: (v: boolean) => void;
    // Toast
    activeToast: Achievement | null;
    setActiveToast: (t: Achievement | null) => void;
    // Filtered grid
    showGrid: boolean;
    filterTag: string | null;
    setShowGrid: (v: boolean) => void;
    setFilterTag: (t: string | null) => void;
    onSelectAgent: (agent: Agent) => void;
    // Neural Commander
    isCommanderOpen: boolean;
    setIsCommanderOpen: (v: boolean) => void;
    agents: Agent[];
}

const AppOverlaysInner: React.FC<AppOverlaysProps> = (p) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile) {
        return (
            <>
                {p.isTransit && <TransitLayer key="transit" />}
                {p.showGlitch && <GlitchTransition key="glitch" />}
                {p.showAscension && (
                    <Suspense fallback={null}>
                        <AscensionOverlay key="ascension" onComplete={() => p.setShowAscension(false)} />
                    </Suspense>
                )}
                {p.showLogin && (
                    <Suspense fallback={null}>
                        <LoginModal key="login" onClose={() => p.setShowLogin(false)} />
                    </Suspense>
                )}
                {p.showKeyVault && (
                    <Suspense fallback={null}>
                        <KeyVaultModal
                            key="keyvault"
                            onClose={() => p.setShowKeyVault(false)}
                            keys={p.keys}
                            saveKey={p.saveKey}
                            rememberInSession={p.rememberInSession}
                            setRememberInSession={p.setRememberInSession}
                        />
                    </Suspense>
                )}
                {p.isAdminVisible && (
                    <Suspense key="admin" fallback={null}>
                        <AdminConsole onClose={() => p.setIsAdminVisible(false)} />
                    </Suspense>
                )}
                {p.showGrid && p.filterTag && (
                    <div className="fixed inset-0 z-[150]">
                        <Suspense fallback={
                            <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-[200]">
                                <div className="w-8 h-8 border-2 border-cyan-500 rounded-full animate-spin" />
                            </div>
                        }>
                            <AgentGrid
                                filterTag={p.filterTag}
                                onClose={() => { p.setShowGrid(false); p.setFilterTag(null); }}
                                onSelectAgent={p.onSelectAgent}
                            />
                        </Suspense>
                    </div>
                )}
                {p.activeToast && (
                    <Suspense fallback={null}>
                        <AchievementToast
                            key="toast"
                            title={p.activeToast.title}
                            description={p.activeToast.description}
                            onClose={() => p.setActiveToast(null)}
                        />
                    </Suspense>
                )}
                {p.isCommanderOpen && (
                    <Suspense fallback={null}>
                        <NeuralCommander
                            isOpen={p.isCommanderOpen}
                            onClose={() => p.setIsCommanderOpen(false)}
                            keys={p.keys}
                            saveKey={p.saveKey}
                            agents={p.agents}
                            actions={{
                                onFilter: (tag) => {
                                    p.setFilterTag(tag);
                                    p.setShowGrid(true);
                                },
                                onFlow: (ids) => {
                                    console.log('Flow initiated:', ids);
                                }
                            }}
                        />
                    </Suspense>
                )}
            </>
        );
    }

    return (
        <AnimatePresence>
            {/* ── Boot loading gate (Removed to allow skeleton rendering and improve TBT) ── */}
            {/* p.initializing && (
                <m.div
                    key="init-loader"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[9999] bg-black"
                >
                    <LoadingScreen />
                </m.div>
            ) */}

            {/* ── Navigation fx ── */}
            {p.isTransit && <TransitLayer key="transit" />}
            {p.showGlitch && <GlitchTransition key="glitch" />}

            {/* ── Rank ascension ── */}
            {p.showAscension && (
                <Suspense fallback={null}>
                    <AscensionOverlay key="ascension" onComplete={() => p.setShowAscension(false)} />
                </Suspense>
            )}

            {/* ── Auth ── */}
            {p.showLogin && (
                <Suspense fallback={null}>
                    <LoginModal key="login" onClose={() => p.setShowLogin(false)} />
                </Suspense>
            )}

            {/* ── Key vault ── */}
            {p.showKeyVault && (
                <Suspense fallback={null}>
                    <KeyVaultModal
                        key="keyvault"
                        onClose={() => p.setShowKeyVault(false)}
                        keys={p.keys}
                        saveKey={p.saveKey}
                        rememberInSession={p.rememberInSession}
                        setRememberInSession={p.setRememberInSession}
                    />
                </Suspense>
            )}

            {/* ── Admin console ── */}
            {p.isAdminVisible && (
                <Suspense key="admin" fallback={null}>
                    <AdminConsole onClose={() => p.setIsAdminVisible(false)} />
                </Suspense>
            )}

            {/* ── Filtered agent grid ── */}
            {p.showGrid && p.filterTag && (
                <m.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[150]"
                >
                    <Suspense fallback={
                        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-[200]">
                            <div className="w-8 h-8 border-2 border-cyan-500 rounded-full animate-spin" />
                        </div>
                    }>
                        <AgentGrid
                            filterTag={p.filterTag}
                            onClose={() => { p.setShowGrid(false); p.setFilterTag(null); }}
                            onSelectAgent={p.onSelectAgent}
                        />
                    </Suspense>
                </m.div>
            )}

            {/* ── Achievement toast ── */}
            {p.activeToast && (
                <Suspense fallback={null}>
                    <AchievementToast
                        key="toast"
                        title={p.activeToast.title}
                        description={p.activeToast.description}
                        onClose={() => p.setActiveToast(null)}
                    />
                </Suspense>
            )}

            {/* ── Neural Commander ── */}
            {p.isCommanderOpen && (
                <Suspense fallback={null}>
                    <NeuralCommander
                        isOpen={p.isCommanderOpen}
                        onClose={() => p.setIsCommanderOpen(false)}
                        keys={p.keys}
                        saveKey={p.saveKey}
                        agents={p.agents}
                        actions={{
                            onFilter: (tag) => {
                                p.setFilterTag(tag);
                                p.setShowGrid(true);
                            },
                            onFlow: (ids) => {
                                console.log('Flow initiated:', ids);
                            }
                        }}
                    />
                </Suspense>
            )}
        </AnimatePresence>
    );
};

export const AppOverlays: React.FC<AppOverlaysProps> = (props) => {
    return (
        <ClientOnly>
            <AppOverlaysInner {...props} />
        </ClientOnly>
    );
};
