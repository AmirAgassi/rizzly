export interface IElectronAPI {
  onboardingComplete: () => void;
  navigateTo: (url: string) => void;
  logCurrentImageUrl: () => void;
  clickNextPhoto: (selector: string) => void;
  downloadAllImages: () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 