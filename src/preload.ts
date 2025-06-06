// see the electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onboardingComplete: () => ipcRenderer.send('onboarding-complete'),
  navigateTo: (url: string) => ipcRenderer.send('navigate-to', url),
  findAndHighlight: (selector: string) => ipcRenderer.send('find-and-highlight', selector),
});
