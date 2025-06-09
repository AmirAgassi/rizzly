// core shared types for the rizzly application

export type Result<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
};

export type AIEmotion = 
  | 'happy' 
  | 'excited' 
  | 'confident' 
  | 'thinking' 
  | 'analyzing' 
  | 'surprised' 
  | 'confused' 
  | 'disappointed' 
  | 'supportive' 
  | 'encouraging' 
  | 'flirty' 
  | 'romantic' 
  | 'chill' 
  | 'casual';

export interface ToolCall {
  name: 'analyze_profile' | 'message_assistance' | 'message_writing';
  reason: string;
}

export interface AIResponse {
  message: string;
  emotion: AIEmotion;
  confidence: number;
  toolCall?: ToolCall;
}

export interface ChatMessage {
  id?: string; // optional for now, will be required after Phase 2 refactor
  type: string; // will be 'user' | 'mascot' after Phase 2 refactor
  message: string;
  timestamp: string;
  bufoFace?: string; // will be AIEmotion after Phase 2 refactor
  hasPhotoStack?: boolean;
  photoStackId?: number;
  photos?: string[];
}

export interface OnboardingData {
  primaryGoal: string;
  assistanceLevel: string;
  communicationStyle: string[];
  conversationTopics: string[];
  openerStyle: string;
  name: string;
}

export interface ProfileAnalysisRequest {
  images: string[];
  userMessage: string;
  onboardingData: OnboardingData;
  conversationHistory: ChatMessage[];
}

export interface EmergencyResponse extends AIResponse {
  isEmergency: boolean;
}

export interface DownloadProgress {
  imageCount: number;
  imageUrl?: string;
  imageBase64?: string;
  isComplete: boolean;
}

export interface BufoFace {
  name: string;
  path: string;
  emotion?: AIEmotion;
  context?: string;
}

// api response wrappers
export interface APIResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AIServiceResult<T = AIResponse> extends APIResult<T> {
  response?: T;
  fallback?: T;
}

// electron api types
export interface ElectronAPI {
  onboardingComplete: () => void;
  navigateTo: (url: string) => void;
  logCurrentImageUrl: () => void;
  clickNextPhoto: (selector: string) => void;
  debugTextarea: () => void;
  checkMonitoring: () => void;
  downloadAllImages: () => void;
  resizeWindow: (width: number, height: number) => void;
  
  // ai service methods
  aiInitialize: (apiKey: string) => Promise<APIResult>;
  aiChat: (userMessage: string, conversationHistory: ChatMessage[], onboardingData?: OnboardingData) => Promise<AIServiceResult>;
  aiStatus: () => Promise<{ isConnected: boolean }>;
  aiAnalyzeProfile: (images: string[], userMessage: string, onboardingData: OnboardingData, conversationHistory: ChatMessage[]) => Promise<AIServiceResult>;
  aiImproveMessage: (userRequest: string, onboardingData: OnboardingData, conversationHistory: ChatMessage[]) => Promise<AIServiceResult>;
  aiWriteMessage: (userRequest: string, onboardingData: OnboardingData, conversationHistory: ChatMessage[]) => Promise<AIServiceResult>;
  aiGenerateCompletion: (writtenMessage: string, userRequest: string, onboardingData: OnboardingData) => Promise<AIServiceResult>;
  aiEmergencyCheck: (currentMessage: string, onboardingData: OnboardingData, conversationHistory: ChatMessage[]) => Promise<{ success: boolean; isEmergency: boolean; response?: AIResponse }>;
  
  // messaging
  sendEmergencyAlert: (response: AIResponse) => void;
  typeMessage: (message: string) => Promise<APIResult>;
  onEmergencyAlert: (callback: (response: AIResponse) => void) => () => void;
  
  // profile image download
  downloadProfileImages: () => Promise<{ success: boolean; images?: string[]; count?: number; error?: string }>;
  onDownloadProgress: (callback: (data: DownloadProgress) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// store types
export interface ChatStore {
  messages: ChatMessage[];
  isTyping: boolean;
  downloadingPhotos: boolean;
  currentPhotos: string[];
  
  // actions
  addMessage: (message: Omit<ChatMessage, 'id'>) => void;
  setTyping: (typing: boolean) => void;
  setDownloadingPhotos: (downloading: boolean) => void;
  setCurrentPhotos: (photos: string[]) => void;
  clearHistory: () => void;
  updateLatestPhotoStack: (photos: string[]) => void;
  addPhotoToLatestStack: (photoBase64: string) => void;
}

export interface AIStore {
  isConnected: boolean;
  apiKey: string;
  
  // actions
  setConnection: (connected: boolean) => void;
  updateApiKey: (key: string) => void;
  initialize: (key: string) => Promise<boolean>;
}

export interface OnboardingStore {
  data: OnboardingData | null;
  isComplete: boolean;
  
  // actions
  updateData: (updates: Partial<OnboardingData>) => void;
  setComplete: (complete: boolean) => void;
  reset: () => void;
}

export interface BufoStore {
  currentBufo: string;
  bufoImage: string;
  isLoaded: boolean;
  
  // actions
  setCurrentBufo: (bufo: string) => void;
  setBufoImage: (image: string) => void;
  setLoaded: (loaded: boolean) => void;
  updateBufoEmotion: (emotion: AIEmotion) => void;
}

// utility types
export type Timestamp = string;
export type Base64Image = string;
export type APIKey = string; 