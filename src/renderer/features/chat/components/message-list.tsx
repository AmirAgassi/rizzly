import React from 'react';
import { UIChatMessage } from '../types';
import { useBufoStore, useChatStore } from '../../../stores';
import { bufoManager } from '../../../../shared/services/BufoManager';
import PhotoStack from './PhotoStack';

interface MessageListProps {
  messages: UIChatMessage[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  const { bufoImage } = useBufoStore();
  const { downloadingPhotos } = useChatStore();

  return (
    <>
      {messages.map((msg, index) => {
        // pick the right bufo image for each message
        const messageBufoImage = msg.type === 'mascot' && msg.bufoFace 
          ? (bufoManager.isLoaded() ? bufoManager.getBufoByEmotion(msg.bufoFace) : bufoImage)
          : bufoImage;
          
        return (
          <div key={msg.id || index} className={`message ${msg.type}`}>
            {msg.type === 'mascot' && (
              <img src={messageBufoImage || bufoImage} alt="Bufo" className="message-avatar" />
            )}
            <div className="message-content">
              <span className="message-text">{msg.message}</span>
              {msg.hasPhotoStack && (
                <PhotoStack 
                  photos={msg.photos || []} 
                  isDownloading={downloadingPhotos}
                  totalExpected={10}
                />
              )}
              <span className="message-time">{msg.timestamp}</span>
            </div>
          </div>
        );
      })}
    </>
  );
}; 