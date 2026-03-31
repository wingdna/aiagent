import { create } from 'zustand';

export interface UIState {
    showLogin: boolean;
    showKeyVault: boolean;
    audioUnlocked: boolean;
    volume: number;
    activeAgentId: string | null;
    setShowLogin: (show: boolean) => void;
    setShowKeyVault: (show: boolean) => void;
    setAudioUnlocked: (unlocked: boolean) => void;
    setVolume: (volume: number) => void;
    setActiveAgentId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set: (partial: Partial<UIState>) => void) => ({
    showLogin: false,
    showKeyVault: false,
    audioUnlocked: false,
    volume: 0.5,
    activeAgentId: null,
    setShowLogin: (show: boolean) => set({ showLogin: show }),
    setShowKeyVault: (show: boolean) => set({ showKeyVault: show }),
    setAudioUnlocked: (unlocked: boolean) => set({ audioUnlocked: unlocked }),
    setVolume: (volume: number) => set({ volume }),
    setActiveAgentId: (id: string | null) => set({ activeAgentId: id }),
}));
