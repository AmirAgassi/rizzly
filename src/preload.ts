// see the electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onboardingComplete: () => ipcRenderer.send('onboarding-complete'),
  navigateTo: (url: string) => ipcRenderer.send('navigate-to', url),
  logCurrentImageUrl: () => ipcRenderer.send('log-current-image-url'),
  clickNextPhoto: (selector: string) => ipcRenderer.send('click-next-photo', selector),
  debugTextarea: () => ipcRenderer.send('debug-textarea'),
  checkMonitoring: () => ipcRenderer.send('check-monitoring'),
  downloadAllImages: () => ipcRenderer.send('download-all-images'),
  resizeWindow: (width: number, height: number) => ipcRenderer.send('resize-window', { width, height }),
  // ai service methods
  aiInitialize: (apiKey: string) => ipcRenderer.invoke('ai:initialize', apiKey),
  aiChat: (userMessage: string, conversationHistory: any[], onboardingData?: any) => ipcRenderer.invoke('ai:chat', userMessage, conversationHistory, onboardingData),
  aiStatus: () => ipcRenderer.invoke('ai:status'),
  aiAnalyzeProfile: (images: string[], userMessage: string, onboardingData: any, conversationHistory: any[]) => ipcRenderer.invoke('ai:analyze-profile', images, userMessage, onboardingData, conversationHistory),
  aiImproveMessage: (userRequest: string, onboardingData: any, conversationHistory: any[]) => ipcRenderer.invoke('ai:improve-message', userRequest, onboardingData, conversationHistory),
  aiWriteMessage: (userRequest: string, onboardingData: any, conversationHistory: any[]) => ipcRenderer.invoke('ai:write-message', userRequest, onboardingData, conversationHistory),
  aiEmergencyCheck: (currentMessage: string, onboardingData: any, conversationHistory: any[]) => ipcRenderer.invoke('ai:emergency-check', currentMessage, onboardingData, conversationHistory),
  sendEmergencyAlert: (response: any) => ipcRenderer.send('emergency-alert', response),
  typeMessage: (message: string) => ipcRenderer.invoke('type-message', message),
  onEmergencyAlert: (callback: (response: any) => void) => {
    ipcRenderer.on('emergency-alert', (event: any, response: any) => callback(response));
    return () => ipcRenderer.removeAllListeners('emergency-alert');
  },
  // profile image download
  downloadProfileImages: () => ipcRenderer.invoke('download-profile-images'),
  onDownloadProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('download-progress', (event: any, data: any) => callback(data));
    return () => ipcRenderer.removeAllListeners('download-progress');
  },

});
