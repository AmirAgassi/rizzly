import { useCallback } from 'react';
import { useChatStore, useAIStore, useOnboardingStore, useBufoStore } from '../../../stores';
import { UIChatMessage } from '../types';
import { bufoManager } from '../../../../shared/services/BufoManager';

/**
 * custom hook for handling chat message logic and ai interactions
 * 
 * this hook encapsulates all the complex logic for:
 * - sending user messages
 * - processing ai responses  
 * - handling tool calls (profile analysis, message assistance, message writing)
 * - managing ui state during async operations
 * 
 * @returns object with sendMessage function for handling user input
 */
export const useMessageHandler = () => {
  const { messages, addMessage, setTyping, setDownloadingPhotos } = useChatStore();
  const { isConnected } = useAIStore();
  const { data: onboardingData } = useOnboardingStore();
  const { setBufoImage } = useBufoStore();

  const createTimestamp = () => new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  const updateBufoEmotion = useCallback((emotion: string) => {
    if (bufoManager.isLoaded()) {
      const newBufoImage = bufoManager.getBufoByEmotion(emotion);
      if (newBufoImage) setBufoImage(newBufoImage);
    }
  }, [setBufoImage]);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    // add user message
    const userMessage = {
      type: 'user',
      message: messageText,
      timestamp: createTimestamp(),
      bufoFace: 'casual' // default for user messages
    };

    addMessage(userMessage);
    setTyping(true);

    try {
      console.log('chat response - connected:', isConnected);
      
      // get ai response from backend
      const result = await window.electronAPI.aiChat(messageText, messages, onboardingData || undefined);
      
      let responseData;
      if (result.success && result.response) {
        responseData = result.response;
      } else if (result.fallback) {
        responseData = result.fallback;
      } else {
        responseData = {
          message: 'connect your ai api key in the debug panel to unlock smart responses!',
          emotion: 'casual',
          confidence: 0.3
        };
      }

      await handleAIResponse(responseData, messageText);
      
    } catch (error) {
      console.error('ai response error:', error);
      
      const errorMessage = {
        type: 'mascot',
        message: 'oops, my brain hiccuped or smth! try asking again?',
        timestamp: createTimestamp(),
        bufoFace: 'confused'
      };
      
      addMessage(errorMessage);
      updateBufoEmotion('confused');
    } finally {
      setTyping(false);
    }
  }, [messages, onboardingData, isConnected, addMessage, setTyping, updateBufoEmotion]);

  const handleAIResponse = async (responseData: any, originalMessage: string) => {
    // handle ai tool calls and normal responses
    if (responseData.toolCall && responseData.toolCall.name === 'analyze_profile') {
      await handleProfileAnalysis(responseData, originalMessage);
    } else if (responseData.toolCall && responseData.toolCall.name === 'message_assistance') {
      await handleMessageAssistance(originalMessage);
    } else if (responseData.toolCall && responseData.toolCall.name === 'message_writing') {
      await handleMessageWriting(responseData, originalMessage);
    } else {
      // handle normal ai responses with no tool call
      const mascotMessage = {
        type: 'mascot',
        message: responseData.message,
        timestamp: createTimestamp(),
        bufoFace: responseData.emotion
      };
      
      addMessage(mascotMessage);
      updateBufoEmotion(responseData.emotion);
    }
  };

  const handleProfileAnalysis = async (responseData: any, originalMessage: string) => {
    console.log('ai requested profile analysis tool');
    
    // show ai's initial response before starting analysis
    const initialResponse = {
      type: 'mascot',
      message: responseData.message,
      timestamp: createTimestamp(),
      bufoFace: responseData.emotion
    };
    addMessage(initialResponse);
    
    setDownloadingPhotos(true);
    
    // add a message to show photo download progress
    const downloadMessageId = Date.now();
    const downloadMessage = {
      type: 'mascot',
      message: 'checking their photos...',
      timestamp: createTimestamp(),
      bufoFace: 'thinking',
      hasPhotoStack: true,
      photoStackId: downloadMessageId,
      photos: []
    };
    addMessage(downloadMessage);
    
    try {
      const downloadResult = await window.electronAPI.downloadProfileImages();
      
      if (downloadResult.success && downloadResult.images) {
        console.log('downloaded', downloadResult.images.length, 'images for analysis');
        
        setTyping(true);
        const analysisResult = await window.electronAPI.aiAnalyzeProfile(
          downloadResult.images,
          originalMessage,
          onboardingData!,
          messages
        );
        
        if (analysisResult.success && analysisResult.response) {
          const analysisMessage = {
            type: 'mascot',
            message: analysisResult.response.message,
            timestamp: createTimestamp(),
            bufoFace: analysisResult.response.emotion
          };
          addMessage(analysisMessage);
          updateBufoEmotion(analysisResult.response.emotion);
        } else {
          throw new Error('Analysis failed');
        }
        
      } else {
        throw new Error('Download failed');
      }
      
    } catch (toolError) {
      console.error('tool execution error:', toolError);
      const errorMessage = {
        type: 'mascot',
        message: 'couldn\'t get their photos right now, but based on what i can see, trust your instincts! 😊',
        timestamp: createTimestamp(),
        bufoFace: 'casual'
      };
      addMessage(errorMessage);
    } finally {
      setDownloadingPhotos(false);
      setTyping(false);
    }
  };

  const handleMessageAssistance = async (originalMessage: string) => {
    console.log('ai requested message assistance tool');
    
    setTyping(true);
    
    try {
      const assistanceResult = await window.electronAPI.aiImproveMessage(
        originalMessage,
        onboardingData!,
        messages
      );
      
      if (assistanceResult.success && assistanceResult.response) {
        const improvementMessage = {
          type: 'mascot',
          message: assistanceResult.response.message,
          timestamp: createTimestamp(),
          bufoFace: assistanceResult.response.emotion
        };
        addMessage(improvementMessage);
        updateBufoEmotion(assistanceResult.response.emotion);
      } else {
        throw new Error(assistanceResult.error || 'Assistance failed');
      }
      
    } catch (toolError) {
      console.error('message assistance error:', toolError);
      const errorMessage = {
        type: 'mascot',
        message: (toolError as Error)?.message?.includes('messages page') 
          ? 'i can only help with messages when you\'re on the tinder chat page! 💬'
          : 'having trouble analyzing your message right now. try again? 🤔',
        timestamp: createTimestamp(),
        bufoFace: 'confused'
      };
      addMessage(errorMessage);
    } finally {
      setTyping(false);
    }
  };

  const handleMessageWriting = async (responseData: any, originalMessage: string) => {
    console.log('ai requested message writing tool');
    
    // show ai's acknowledgment before writing the message
    const writingMessage = {
      type: 'mascot',
      message: responseData.message,
      timestamp: createTimestamp(),
      bufoFace: responseData.emotion
    };
    addMessage(writingMessage);
    updateBufoEmotion(responseData.emotion);
    
    setTyping(true);
    
    try {
      const writeResult = await window.electronAPI.aiWriteMessage(
        originalMessage,
        onboardingData!,
        messages
      );
      
      if (writeResult.success && writeResult.response) {
        const generatedMessage = writeResult.response.message;
        
        // simulate typing the message after a short delay
        setTimeout(async () => {
          try {
            await window.electronAPI.typeMessage(generatedMessage);
            
            // generate a completion message after typing
            const completionResult = await window.electronAPI.aiGenerateCompletion(
              generatedMessage,
              originalMessage,
              onboardingData!
            );
            
            if (completionResult.success && completionResult.response) {
              const completeMessage = {
                type: 'mascot',
                message: completionResult.response.message,
                timestamp: createTimestamp(),
                bufoFace: completionResult.response.emotion
              };
              addMessage(completeMessage);
              updateBufoEmotion(completionResult.response.emotion);
            } else {
              // fallback if completion fails
              const completeMessage = {
                type: 'mascot',
                message: 'done!',
                timestamp: createTimestamp(),
                bufoFace: 'confident'
              };
              addMessage(completeMessage);
            }
            
          } catch (typeError) {
            console.error('message typing error:', typeError);
            // show the message for manual copy if typing fails
            const errorMessage = {
              type: 'mascot',
              message: `couldn't type it out, but here's what i wrote: "${generatedMessage}" - copy and paste it! 📝`,
              timestamp: createTimestamp(),
              bufoFace: 'confused'
            };
            addMessage(errorMessage);
          }
        }, 1000);
        
      } else {
        throw new Error(writeResult.error || 'Message writing failed');
      }
      
    } catch (toolError) {
      console.error('message writing error:', toolError);
      const errorMessage = {
        type: 'mascot',
        message: (toolError as Error)?.message?.includes('messages page') 
          ? 'i can only write messages when you\'re on the tinder chat page!'
          : 'having trouble writing that message right now. try again?',
        timestamp: createTimestamp(),
        bufoFace: 'confused'
      };
      addMessage(errorMessage);
    } finally {
      setTyping(false);
    }
  };

  return {
    handleSendMessage,
    isTyping: false // will be managed by store
  };
}; 