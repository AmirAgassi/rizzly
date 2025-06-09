import { useCallback, useEffect } from 'react';
import { useAIStore, useChatStore, useBufoStore } from '../stores';
import { bufoManager } from '../../shared/services/BufoManager';

export const useAIConnection = () => {
  const { isConnected, apiKey, setConnection, updateApiKey, initialize } = useAIStore();
  const { addMessage } = useChatStore();
  const { setBufoImage } = useBufoStore();

  // initialize ai connection on mount if api key exists
  useEffect(() => {
    // add a small delay to ensure store is hydrated
    const timer = setTimeout(async () => {
      if (apiKey && !isConnected) {
        console.log('checking ai connection on mount with api key length:', apiKey.length);
        await initialize(apiKey);
        console.log('ai initialization completed on mount');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [apiKey, isConnected, initialize]);

  const handleUpdateApiKey = useCallback(async (newKey: string) => {
    console.log('updating api key, length:', newKey.length);
    updateApiKey(newKey);
    
    if (newKey) {
      const success = await initialize(newKey);
      console.log('ai initialization result:', success);
      
      const createTimestamp = () => new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      if (success) {
        const successMessage = {
          type: 'mascot' as const,
          message: 'ai is connected! lets get this bread',
          timestamp: createTimestamp(),
          bufoFace: 'excited'
        };
        addMessage(successMessage);
        
        if (bufoManager.isLoaded()) {
          const excitedBufo = bufoManager.getBufoByEmotion('excited');
          if (excitedBufo) setBufoImage(excitedBufo);
        }
      } else {
        const failMessage = {
          type: 'mascot' as const,
          message: 'hmm, that api key doesn\'t look right. make sure it\'s valid! 🔧',
          timestamp: createTimestamp(),
          bufoFace: 'confused'
        };
        addMessage(failMessage);
      }
    } else {
      setConnection(false);
    }
  }, [updateApiKey, initialize, addMessage, setBufoImage, setConnection]);

  return {
    isConnected,
    apiKey,
    updateApiKey: handleUpdateApiKey
  };
}; 