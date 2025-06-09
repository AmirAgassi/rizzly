import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// mock electron api for testing
const mockElectronAPI = {
  onboardingComplete: vi.fn(),
  navigateTo: vi.fn(),
  logCurrentImageUrl: vi.fn(),
  clickNextPhoto: vi.fn(),
  debugTextarea: vi.fn(),
  checkMonitoring: vi.fn(),
  downloadAllImages: vi.fn(),
  resizeWindow: vi.fn(),
  aiInitialize: vi.fn().mockResolvedValue({ success: true }),
  aiChat: vi.fn().mockResolvedValue({ success: true, response: { message: 'test', emotion: 'casual', confidence: 0.8 } }),
  aiStatus: vi.fn().mockResolvedValue({ isConnected: true }),
  aiAnalyzeProfile: vi.fn().mockResolvedValue({ success: true, response: { message: 'test analysis', emotion: 'analyzing', confidence: 0.9 } }),
  aiImproveMessage: vi.fn().mockResolvedValue({ success: true, response: { message: 'improved message', emotion: 'confident', confidence: 0.9 } }),
  aiWriteMessage: vi.fn().mockResolvedValue({ success: true, response: { message: 'written message', emotion: 'flirty', confidence: 0.9 } }),
  aiGenerateCompletion: vi.fn().mockResolvedValue({ success: true, response: { message: 'completed!', emotion: 'excited', confidence: 0.9 } }),
  aiEmergencyCheck: vi.fn().mockResolvedValue({ success: true, isEmergency: false }),
  sendEmergencyAlert: vi.fn(),
  typeMessage: vi.fn().mockResolvedValue({ success: true }),
  onEmergencyAlert: vi.fn().mockReturnValue(() => {}),
  downloadProfileImages: vi.fn().mockResolvedValue({ success: true, images: [], count: 0 }),
  onDownloadProgress: vi.fn().mockReturnValue(() => {}),
};

// mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
}); 