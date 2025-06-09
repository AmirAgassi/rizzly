import React from 'react';
import { useBufoStore } from '../../../stores';

export const ChatHeader = React.memo(() => {
  const { bufoImage } = useBufoStore();

  return (
    <div className="chat-header">
      <img src={bufoImage} alt="Bufo" className="mascot-avatar" />
      <div className="mascot-info">
        <span className="mascot-name">bufo</span>
        <span className="mascot-status">your dating copilot</span>
      </div>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader'; 