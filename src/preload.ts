// see the electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onboardingComplete: () => ipcRenderer.send('onboarding-complete'),
  navigateTo: (url: string) => ipcRenderer.send('navigate-to', url),
  logCurrentImageUrl: () => ipcRenderer.send('log-current-image-url'),
  clickNextPhoto: (selector: string) => ipcRenderer.send('click-next-photo', selector),
  downloadAllImages: () => ipcRenderer.send('download-all-images'),
  resizeWindow: (width: number, height: number) => ipcRenderer.send('resize-window', { width, height }),
  // ai service methods
  aiInitialize: (apiKey: string) => ipcRenderer.invoke('ai:initialize', apiKey),
  aiChat: (userMessage: string, conversationHistory: any[]) => ipcRenderer.invoke('ai:chat', userMessage, conversationHistory),
  aiStatus: () => ipcRenderer.invoke('ai:status'),
});
