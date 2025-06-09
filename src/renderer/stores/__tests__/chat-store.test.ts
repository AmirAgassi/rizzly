import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../chat-store';

describe('ChatStore', () => {
  beforeEach(() => {
    // reset the store before each test
    useChatStore.setState({
      messages: [
        {
          id: 'test-1',
          type: 'mascot',
          message: 'heyo',
          timestamp: '12:00',
          bufoFace: 'casual'
        }
      ],
      isTyping: false,
      downloadingPhotos: false,
      currentPhotos: [],
    });
  });

  it('should add a new message', () => {
    const { addMessage } = useChatStore.getState();
    
    addMessage({
      type: 'user',
      message: 'test message',
      timestamp: '12:01',
    });

    const { messages } = useChatStore.getState();
    expect(messages).toHaveLength(2);
    expect(messages[1].message).toBe('test message');
    expect(messages[1].type).toBe('user');
    expect(messages[1].id).toBeTruthy(); // should have generated id
  });

  it('should set typing state', () => {
    const { setTyping } = useChatStore.getState();
    
    setTyping(true);
    expect(useChatStore.getState().isTyping).toBe(true);
    
    setTyping(false);
    expect(useChatStore.getState().isTyping).toBe(false);
  });

  it('should clear chat history', () => {
    const { addMessage, clearHistory } = useChatStore.getState();
    
    // add some messages
    addMessage({ type: 'user', message: 'test 1', timestamp: '12:01' });
    addMessage({ type: 'user', message: 'test 2', timestamp: '12:02' });
    
    expect(useChatStore.getState().messages).toHaveLength(3);
    
    // clear history
    clearHistory();
    
    const { messages } = useChatStore.getState();
    expect(messages).toHaveLength(1); // should have default mascot message
    expect(messages[0].type).toBe('mascot');
    expect(messages[0].message).toBe('heyo');
  });

  it('should set downloading photos state', () => {
    const { setDownloadingPhotos } = useChatStore.getState();
    
    setDownloadingPhotos(true);
    expect(useChatStore.getState().downloadingPhotos).toBe(true);
    
    setDownloadingPhotos(false);
    expect(useChatStore.getState().downloadingPhotos).toBe(false);
  });
}); 