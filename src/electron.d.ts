export interface IElectronAPI {
  onboardingComplete: () => void;
  navigateTo: (url: string) => void;
  logCurrentImageUrl: () => void;
  clickNextPhoto: (selector: string) => void;
  downloadAllImages: () => void;
  resizeWindow: (width: number, height: number) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 