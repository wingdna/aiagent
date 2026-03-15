import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Agent } from '../types';
import { dataService } from '../services/dataService';

interface ArsenalState {
  arsenalIds: string[];
  arsenalAgents: Agent[];
  isLoading: boolean;
  addToArsenal: (agentId: string) => void;
  removeFromArsenal: (agentId: string) => void;
  toggleArsenal: (agentId: string) => void;
  isInArsenal: (agentId: string) => boolean;
  syncAgents: () => Promise<void>;
}

export const useArsenal = create<ArsenalState>()(
  persist(
    (set, get) => ({
      arsenalIds: [],
      arsenalAgents: [],
      isLoading: false,

      addToArsenal: (agentId: string) => {
        const { arsenalIds } = get();
        if (!arsenalIds.includes(agentId)) {
          set({ arsenalIds: [...arsenalIds, agentId] });
          get().syncAgents();
        }
      },

      removeFromArsenal: (agentId: string) => {
        const { arsenalIds } = get();
        set({ arsenalIds: arsenalIds.filter((id) => id !== agentId) });
        get().syncAgents();
      },

      toggleArsenal: (agentId: string) => {
        const { arsenalIds } = get();
        if (arsenalIds.includes(agentId)) {
          get().removeFromArsenal(agentId);
        } else {
          get().addToArsenal(agentId);
        }
      },

      isInArsenal: (agentId: string) => {
        return get().arsenalIds.includes(agentId);
      },

      syncAgents: async () => {
        const { arsenalIds } = get();
        if (arsenalIds.length === 0) {
          set({ arsenalAgents: [] });
          return;
        }

        set({ isLoading: true });
        try {
          // In a real app, we'd have a bulk fetch endpoint.
          // For now, we'll fetch individually or filter from cache if available.
          const agents: Agent[] = [];
          for (const id of arsenalIds) {
            // Check if we already have it in the current state to avoid refetching if possible,
            // but dataService might have fresher data.
            const agent = await dataService.getAgentById(id);
            if (agent) agents.push(agent);
          }
          set({ arsenalAgents: agents });
        } catch (error) {
          console.error('Failed to sync arsenal agents', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'commander_arsenal_v1', // unique name
      storage: createJSONStorage(() => typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {}
      } as any),
      partialize: (state) => ({ arsenalIds: state.arsenalIds }), // Only persist IDs
      onRehydrateStorage: () => (state) => {
        state?.syncAgents();
      }
    }
  )
);
