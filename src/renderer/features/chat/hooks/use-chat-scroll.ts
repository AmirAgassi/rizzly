import { useEffect, useRef } from 'react';
import { UIChatMessage } from '../types';

export const useChatScroll = (messages: UIChatMessage[]) => {
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // always scroll chat to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatMessagesRef.current) {
        const container = chatMessagesRef.current;
        container.scrollTop = container.scrollHeight + 1000;
      }
    };

    scrollToBottom();
    
    // do extra scrolls to catch late-rendered content (this is a hack)
    const timeoutId1 = setTimeout(scrollToBottom, 50);
    const timeoutId2 = setTimeout(scrollToBottom, 200);
    const timeoutId3 = setTimeout(scrollToBottom, 500);
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [messages]);

  return { chatMessagesRef };
}; 