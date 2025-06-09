import React, { useState } from 'react';
import { useMessageHandler } from '../hooks';

export const MessageInput = () => {
  const [chatMessage, setChatMessage] = useState('');
  const { handleSendMessage } = useMessageHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const messageToSend = chatMessage;
    setChatMessage(''); // clear input immediately
    await handleSendMessage(messageToSend);
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      <input
        type="text"
        value={chatMessage}
        onChange={(e) => setChatMessage(e.target.value)}
        placeholder="ask bufo..."
        className="chat-input"
      />
      <button type="submit" className="chat-send">
        <span>→</span>
      </button>
    </form>
  );
}; 