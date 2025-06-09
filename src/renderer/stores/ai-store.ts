import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AIStore } from '../../shared/types';

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      isConnected: false,
      apiKey: '', // will be loaded from persisted state

      // actions
      setConnection: (connected: boolean) => {
        set({ isConnected: connected });
      },

      updateApiKey: (key: string) => {
        set({ apiKey: key });
      },

      initialize: async (key: string) => {
        try {
          set({ apiKey: key });
          
          if (window.electronAPI) {
            const result = await window.electronAPI.aiInitialize(key);
            const isConnected = result.success;
            set({ isConnected });
            return isConnected;
          }
          
          return false;
        } catch (error) {
          console.error('ai initialization failed:', error);
          set({ isConnected: false });
          return false;
        }
      },
    }),
    {
      name: 'rizzly-ai-settings',
      partialize: (state) => ({ 
        apiKey: state.apiKey 
      }),
    }
  )
);

// selector hooks
export const useAIConnection = () => useAIStore((state) => state.isConnected);
export const useAPIKey = () => useAIStore((state) => state.apiKey);
export const useAIActions = () => useAIStore((state) => ({
  setConnection: state.setConnection,
  updateApiKey: state.updateApiKey,
  initialize: state.initialize,
})); 