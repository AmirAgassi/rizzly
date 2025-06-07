export interface IElectronAPI {
  onboardingComplete: () => void;
  navigateTo: (url: string) => void;
  logCurrentImageUrl: () => void;
  clickNextPhoto: (selector: string) => void;
  downloadAllImages: () => void;
  resizeWindow: (width: number, height: number) => void;
  // ai service methods
  aiInitialize: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  aiChat: (userMessage: string, conversationHistory: any[]) => Promise<{ success: boolean; response?: any; error?: string; fallback?: any }>;
  aiStatus: () => Promise<{ isConnected: boolean }>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

declare module '*.png' {
  const value: string;
  export default value;
} 