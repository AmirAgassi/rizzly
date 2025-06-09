import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { OnboardingStore, OnboardingData } from '../../shared/types';

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      data: null,
      isComplete: false,

      // actions
      updateData: (updates: Partial<OnboardingData>) => {
        set((state) => ({
          data: state.data ? { ...state.data, ...updates } : updates as OnboardingData
        }));
      },

      setComplete: (complete: boolean) => {
        set({ isComplete: complete });
      },

      reset: () => {
        set({ data: null, isComplete: false });
      },
    }),
    {
      name: 'rizzly-preferences',
    }
  )
);

// selector hooks
export const useOnboardingData = () => useOnboardingStore((state) => state.data);
export const useOnboardingComplete = () => useOnboardingStore((state) => state.isComplete);
export const useOnboardingActions = () => useOnboardingStore((state) => ({
  updateData: state.updateData,
  setComplete: state.setComplete,
  reset: state.reset,
})); 