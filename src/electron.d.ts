export interface IElectronAPI {
  onboardingComplete: () => void;
  navigateTo: (url: string) => void;
  logCurrentImageUrl: () => void;
  clickNextPhoto: (selector: string) => void;
  debugTextarea: () => void;
  checkMonitoring: () => void;
  downloadAllImages: () => void;
  resizeWindow: (width: number, height: number) => void;
  // ai service methods
  aiInitialize: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  aiChat: (userMessage: string, conversationHistory: any[], onboardingData?: any) => Promise<{ success: boolean; response?: any; error?: string; fallback?: any }>;
  aiStatus: () => Promise<{ isConnected: boolean }>;
  aiAnalyzeProfile: (images: string[], userMessage: string, onboardingData: any, conversationHistory: any[]) => Promise<{ success: boolean; response?: any; error?: string }>;
  aiImproveMessage: (userRequest: string, onboardingData: any, conversationHistory: any[]) => Promise<{ success: boolean; response?: any; originalMessage?: string; error?: string }>;
  aiWriteMessage: (userRequest: string, onboardingData: any, conversationHistory: any[]) => Promise<{ success: boolean; response?: any; error?: string }>;
  aiEmergencyCheck: (currentMessage: string, onboardingData: any, conversationHistory: any[]) => Promise<{ success: boolean; isEmergency: boolean; response?: any }>;
  sendEmergencyAlert: (response: any) => void;
  typeMessage: (message: string) => Promise<{ success: boolean; error?: string }>;
  onEmergencyAlert: (callback: (response: any) => void) => () => void;
  // profile image download
  downloadProfileImages: () => Promise<{ success: boolean; images?: string[]; count?: number; error?: string }>;
  onDownloadProgress: (callback: (data: { imageCount: number; imageUrl?: string; imageBase64?: string; isComplete: boolean }) => void) => () => void;
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