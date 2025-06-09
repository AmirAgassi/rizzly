import React from 'react';
import { useBufoStore } from '../../../stores';

export const TypingIndicator = React.memo(() => {
  const { bufoImage } = useBufoStore();

  return (
    <div className="message mascot">
      <img src={bufoImage} alt="Bufo" className="message-avatar" />
      <div className="message-content">
        <span className="message-text typing-indicator">
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
          <span className="typing-dot"></span>
        </span>
      </div>
    </div>
  );
});

TypingIndicator.displayName = 'TypingIndicator'; 