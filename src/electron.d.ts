export interface IElectronAPI {
  onboardingComplete: () => void;
  navigateTo: (url: string) => void;
  findAndHighlight: (selector: string) => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
} 