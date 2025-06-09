import React from 'react';
import { useChatStore } from '../../../stores';
import { useChatScroll } from '../hooks';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';

export const ChatContainer = () => {
  const { messages, isTyping } = useChatStore();
  const { chatMessagesRef } = useChatScroll(messages);

  return (
    <div className="chat-container">
      <ChatHeader />
      
      <div className="chat-messages" ref={chatMessagesRef}>
        <MessageList messages={messages} />
        {isTyping && <TypingIndicator />}
      </div>

      <MessageInput />
    </div>
  );
}; 