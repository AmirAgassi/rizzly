import { ChatMessage } from '../../../shared/types';

// extended message with ui-specific properties
export interface UIChatMessage extends ChatMessage {
  hasPhotoStack?: boolean;
  photoStackId?: number;
  photos?: string[];
}

// chat ui state
export interface ChatUIState {
  isScrolledToBottom: boolean;
  isAutoScrollEnabled: boolean;
}

// message sending context
export interface MessageContext {
  onboardingData?: any;
  conversationHistory: UIChatMessage[];
}

// photo stack properties
export interface PhotoStackData {
  photos: string[];
  isDownloading: boolean;
  totalExpected?: number;
} 