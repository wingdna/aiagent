import { create } from 'zustand';

export interface UIState {
    showLogin: boolean;
    showKeyVault: boolean;
    audioUnlocked: boolean;
    volume: number;
    currentView: 'discover' | 'battle' | 'workflow' | 'lounge' | 'rankings' | 'directory';
    activeAgentId: string | null;
    setShowLogin: (show: boolean) => void;
    setShowKeyVault: (show: boolean) => void;
    setAudioUnlocked: (unlocked: boolean) => void;
    setVolume: (volume: number) => void;
    setCurrentView: (view: 'discover' | 'battle' | 'workflow' | 'lounge' | 'rankings' | 'directory') => void;
    setActiveAgentId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set: (partial: Partial<UIState>) => void) => ({
    showLogin: false,
    showKeyVault: false,
    audioUnlocked: false,
    volume: 0.5,
    currentView: 'discover',
    activeAgentId: null,
    setShowLogin: (show: boolean) => set({ showLogin: show }),
    setShowKeyVault: (show: boolean) => set({ showKeyVault: show }),
    setAudioUnlocked: (unlocked: boolean) => set({ audioUnlocked: unlocked }),
    setVolume: (volume: number) => set({ volume }),
    setCurrentView: (view: UIState['currentView']) => set({ currentView: view }),
    setActiveAgentId: (id: string | null) => set({ activeAgentId: id }),
}));
