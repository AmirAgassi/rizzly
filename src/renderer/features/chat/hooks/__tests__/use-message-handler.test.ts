import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMessageHandler } from '../use-message-handler';

// mock the stores
vi.mock('../../../../stores', () => ({
  useChatStore: () => ({
    messages: [],
    addMessage: vi.fn(),
    setTyping: vi.fn(),
    setDownloadingPhotos: vi.fn(),
  }),
  useAIStore: () => ({
    isConnected: true,
  }),
  useOnboardingStore: () => ({
    data: { name: 'test user' },
  }),
  useBufoStore: () => ({
    setBufoImage: vi.fn(),
  }),
}));

// mock bufo manager
vi.mock('../../../../components/BufoManager', () => ({
  bufoManager: {
    isLoaded: () => true,
    getBufoByEmotion: vi.fn(() => 'mock-bufo-image'),
  },
}));

// mock electron api
const mockElectronAPI = {
  aiChat: vi.fn(),
};

beforeEach(() => {
  global.window = {
    electronAPI: mockElectronAPI,
  } as any;
  vi.clearAllMocks();
});

describe('useMessageHandler', () => {
  it('should handle sending a message', async () => {
    const { result } = renderHook(() => useMessageHandler());

    expect(result.current.handleSendMessage).toBeDefined();
    expect(typeof result.current.handleSendMessage).toBe('function');
  });

  it('should not send empty messages', async () => {
    const { result } = renderHook(() => useMessageHandler());

    await act(async () => {
      await result.current.handleSendMessage('');
    });

    // should not make any API calls for empty messages
    expect(mockElectronAPI.aiChat).not.toHaveBeenCalled();
  });

  it('should trim whitespace from messages', async () => {
    const { result } = renderHook(() => useMessageHandler());

    await act(async () => {
      await result.current.handleSendMessage('   ');
    });

    // should not make API calls for whitespace-only messages
    expect(mockElectronAPI.aiChat).not.toHaveBeenCalled();
  });
}); 