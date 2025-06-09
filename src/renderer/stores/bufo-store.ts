import { create } from 'zustand';
import type { BufoStore, AIEmotion } from '../../shared/types';
import { bufoManager } from '../../shared/services/BufoManager';

export const useBufoStore = create<BufoStore>((set, get) => ({
  currentBufo: 'bufo-tea',
  bufoImage: '',
  isLoaded: false,

  // actions
  setCurrentBufo: (bufo: string) => {
    set({ currentBufo: bufo });
  },

  setBufoImage: (image: string) => {
    set({ bufoImage: image });
  },

  setLoaded: (loaded: boolean) => {
    set({ isLoaded: loaded });
  },

  updateBufoEmotion: (emotion: AIEmotion) => {
    const state = get();
    if (state.isLoaded) {
      const newBufoImage = bufoManager.getBufoByEmotion(emotion);
      if (newBufoImage) {
        set({ 
          bufoImage: newBufoImage,
          currentBufo: emotion
        });
      }
    }
  },
}));

// selector hooks
export const useCurrentBufo = () => useBufoStore((state) => state.currentBufo);
export const useBufoImage = () => useBufoStore((state) => state.bufoImage);
export const useBufoLoaded = () => useBufoStore((state) => state.isLoaded);
export const useBufoActions = () => useBufoStore((state) => ({
  setCurrentBufo: state.setCurrentBufo,
  setBufoImage: state.setBufoImage,
  setLoaded: state.setLoaded,
  updateBufoEmotion: state.updateBufoEmotion,
})); 