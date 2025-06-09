import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatStore, ChatMessage } from '../../shared/types';

// generate unique id for messages
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [
        {
          id: generateId(),
          type: 'mascot',
          message: 'heyo',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          bufoFace: 'casual'
        }
      ],
      isTyping: false,
      downloadingPhotos: false,
      currentPhotos: [],

      // actions
      addMessage: (message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: generateId(),
        };
        
        set((state) => ({
          messages: [...state.messages, newMessage]
        }));
      },

      setTyping: (typing) => {
        set({ isTyping: typing });
      },

      setDownloadingPhotos: (downloading) => {
        set({ downloadingPhotos: downloading });
      },

      setCurrentPhotos: (photos) => {
        set({ currentPhotos: photos });
      },

      clearHistory: () => {
        set({
          messages: [
            {
              id: generateId(),
              type: 'mascot',
              message: 'heyo',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              bufoFace: 'casual'
            }
          ]
        });
      },

      // helper method to update the most recent photo stack
      updateLatestPhotoStack: (photos: string[]) => {
        set((state) => {
          const updated = [...state.messages];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].hasPhotoStack) {
              updated[i] = {
                ...updated[i],
                photos: photos
              };
              break;
            }
          }
          return { messages: updated };
        });
      },

      // helper method to add a single photo to the most recent photo stack
      addPhotoToLatestStack: (photoBase64: string) => {
        set((state) => {
          const updated = [...state.messages];
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].hasPhotoStack) {
              const currentPhotos = updated[i].photos || [];
              if (!currentPhotos.includes(photoBase64)) {
                updated[i] = {
                  ...updated[i],
                  photos: [...currentPhotos, photoBase64]
                };
                console.log(`renderer: stack now has ${updated[i].photos?.length} images`);
              }
              break;
            }
          }
          return { messages: updated };
        });
      },

    }),
    {
      name: 'rizzly-chat-history',
      // only persist messages, not temporary state like typing
      partialize: (state) => ({ 
        messages: state.messages 
      }),
    }
  )
);

// selector hooks for better performance
export const useChatMessages = () => useChatStore((state) => state.messages);
export const useIsTyping = () => useChatStore((state) => state.isTyping);
export const useDownloadingPhotos = () => useChatStore((state) => state.downloadingPhotos);
export const useChatActions = () => useChatStore((state) => ({
  addMessage: state.addMessage,
  setTyping: state.setTyping,
  setDownloadingPhotos: state.setDownloadingPhotos,
  clearHistory: state.clearHistory,
  updateLatestPhotoStack: state.updateLatestPhotoStack,
  addPhotoToLatestStack: state.addPhotoToLatestStack,
})); 