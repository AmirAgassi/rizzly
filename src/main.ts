import { app, BrowserWindow, ipcMain, WebContentsView, session } from 'electron';
import { AIService } from './services/AIService';
import path from 'path';

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow;
let view: WebContentsView;
let aiService: AIService | null = null;

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 680,
    width: 540,
    titleBarStyle: 'hidden',
    frame: false,
    transparent: true,
    backgroundColor: 'rgba(0,0,0,0)',
    resizable: false,
    trafficLightPosition: { x: -100, y: -100 }, // Hide traffic lights completely
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
      experimentalFeatures: false,
      offscreen: false,
      enableBlinkFeatures: '', // disable potentially problematic features
      disableBlinkFeatures: 'Accelerated2dCanvas,AcceleratedSmallCanvases', // force software rendering for problematic elements
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // mainWindow.webContents.openDevTools({ mode: 'detach' });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('onboarding-complete', () => {
  console.log('onboarding done, creating browser view');
  if (!mainWindow) return;

  // Resize window for the main app interface
  mainWindow.setSize(1200, 800);
  mainWindow.setResizable(true);
  mainWindow.center();

  view = new WebContentsView({
    webPreferences: {
      partition: 'persist:rizzly-session',
    },
  });
  mainWindow.contentView.addChildView(view);

  const resizeView = () => {
    const [width, height] = mainWindow.getSize();
    const debuggerPanelWidth = 320; // match the CSS width from MainApp.css
    if (view) {
      view.setBounds({ x: 0, y: 0, width: width - debuggerPanelWidth, height });
    }
  };

  resizeView();
  mainWindow.on('resize', resizeView);

  view.webContents.loadURL('https://tinder.com/app/recs');
  // view.webContents.openDevTools({ mode: 'detach' });

  // handle file downloads
  view.webContents.session.on('will-download', (event: any, item: any, webContents: any) => {
    // let's save to the user's downloads folder
    const downloadsPath = app.getPath('downloads');
    const fileName = item.getFilename();
    const savePath = path.join(downloadsPath, fileName);
    item.setSavePath(savePath);

    item.on('updated', (event: any, state: any) => {
      if (state === 'interrupted') {
        console.log('download is interrupted but can be resumed');
      } else if (state === 'progressing') {
        if (item.isPaused()) {
          console.log('download is paused');
        } else {
          const received = item.getReceivedBytes();
          const total = item.getTotalBytes();
          if (total > 0) {
            console.log(`> ${Math.round((received / total) * 100)}%`);
          }
        }
      }
    });

    item.once('done', (event: any, state: any) => {
      if (state === 'completed') {
        console.log(`download finished: ${fileName}`);
      } else {
        console.log(`download failed: ${state}`);
      }
    });
  });
});

ipcMain.on('navigate-to', (event, url) => {
  if (view && url) {
    console.log(`navigating to: ${url}`);
    view.webContents.loadURL(url);
  }
});

ipcMain.on('log-current-image-url', (event) => {
  if (view) {
    console.log('---');
    console.log(`getting current image url...`);
    const script = `
      (() => {
        const logs = [];
        logs.push('--- finding profile and image ---');
    
        const profileContainers = document.querySelectorAll('section[aria-roledescription="carousel"]');
        logs.push(\`found \${profileContainers.length} profile containers\`);
    
        let candidateContainers = [];
        for (const container of profileContainers) {
            const hasActiveTab = container.querySelector('button[role="tab"][aria-selected="true"]');
            const rect = container.getBoundingClientRect();
            // a container is a candidate if it has an active tab and is positioned on-screen.
            if (hasActiveTab && rect.top >= 0) {
                candidateContainers.push(container);
            }
        }
    
        logs.push(\`found \${candidateContainers.length} candidates (on-screen w/ active tab).\`);
    
        // if multiple candidates exist, the last one in the dom is the one on top.
        const currentProfileContainer = candidateContainers.length > 0 ? candidateContainers[candidateContainers.length - 1] : null;
    
        if (currentProfileContainer) {
            logs.push('selected profile: ' + currentProfileContainer.getAttribute('aria-label'));
            const allDots = currentProfileContainer.querySelectorAll('button[role="tab"]');
            const activeDot = currentProfileContainer.querySelector('button[role="tab"][aria-selected="true"]');
            const activeIndex = Array.from(allDots).indexOf(activeDot);
    
            logs.push(\`active photo index: \${activeIndex}\`);
    
            const slides = currentProfileContainer.querySelectorAll('.keen-slider__slide');
            logs.push(\`found \${slides.length} slides in this profile\`);
    
            if (slides.length > activeIndex && activeIndex > -1) {
                const activeSlide = slides[activeIndex];
                const imageDiv = activeSlide.querySelector('div[aria-label^="Profile Photo"]');
                
                if (imageDiv) {
                    const style = window.getComputedStyle(imageDiv);
                    const bgImage = style.backgroundImage;
                    if (bgImage && bgImage.startsWith('url("')) {
                        const url = bgImage.slice(5, -2);
                        logs.push('success: ' + url);
                    } else {
                        logs.push('err: found image div, but no valid bg image url');
                    }
                } else {
                    logs.push('err: couldnt find image div in active slide');
                }
            } else {
                logs.push(\`err: slide index (\${activeIndex}) is out of bounds (\${slides.length} slides found)\`);
            }
    
        } else {
            logs.push('err: couldnt find a suitable profile container');
        }
    
        return logs;
      })();
    `;
    view.webContents.executeJavaScript(script)
      .then(logs => {
        logs.forEach((log: string) => console.log(log));
      })
      .catch(err => console.error('Script execution failed:', err));
  }
});

ipcMain.on('click-next-photo', (event, selector) => {
  if (view && selector) {
    console.log('---');
    console.log(`clicking next photo...`);
    const script = `
      (() => {
        const logs = [];
        logs.push('--- finding and clicking next photo ---');

        const profileContainers = document.querySelectorAll('section[aria-roledescription="carousel"]');
        let candidateContainers = [];
        for (const container of profileContainers) {
            const rect = container.getBoundingClientRect();
            if (rect.top >= 0) {
                candidateContainers.push(container);
            }
        }
        
        const currentProfileContainer = candidateContainers.length > 0 ? candidateContainers[candidateContainers.length - 1] : null;

        if (currentProfileContainer) {
          logs.push('found current profile: ' + currentProfileContainer.getAttribute('aria-label'));
          const targetButton = currentProfileContainer.querySelector('${selector}');
          
          if (targetButton && !targetButton.disabled) {
            logs.push('success: found clickable "next photo" button in current profile');
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
            targetButton.dispatchEvent(mousedownEvent);
            targetButton.dispatchEvent(clickEvent);
            logs.push('dispatched mousedown and click events');
          } else if (targetButton) {
            logs.push('err: button found but disabled');
          } else {
            logs.push('err: couldnt find any button w/ selector in current profile');
          }

        } else {
          logs.push('err: couldnt find current profile container');
        }

        return logs;
      })();
    `;
    view.webContents.executeJavaScript(script)
      .then(logs => {
        logs.forEach((log: string) => console.log(log));
      })
      .catch(err => console.error('Script execution failed:', err));
  }
});

ipcMain.on('download-all-images', async () => {
  if (!view) return;

  console.log('---');
  console.log('starting download of all images for this profile...');

  const downloadedUrls = new Set<string>();
  const MAX_IMAGES_PER_PROFILE = 20; // safe limit to prevent infinite loops

  for (let i = 0; i < MAX_IMAGES_PER_PROFILE; i++) {
    console.log(`\n> iteration ${i + 1}:`);
    try {
      // step 1: get current image url and check if the 'next' button is disabled.
      const stateResult: { url?: string; isEnd?: boolean; error?: string } = await view.webContents.executeJavaScript(`
        (() => {
          const getOnscreenProfile = () => {
            const profileContainers = document.querySelectorAll('section[aria-roledescription="carousel"]');
            const candidates = Array.from(profileContainers).filter(c => c.getBoundingClientRect().top >= 0);
            return candidates.length > 0 ? candidates[candidates.length - 1] : null;
          };

          const container = getOnscreenProfile();
          if (!container) return { error: 'could not find current profile container' };

          const getImageUrl = () => {
            const allDots = container.querySelectorAll('button[role="tab"]');
            const activeDot = container.querySelector('button[role="tab"][aria-selected="true"]');
            if (!activeDot) return null;
            const activeIndex = Array.from(allDots).indexOf(activeDot);

            const slides = container.querySelectorAll('.keen-slider__slide');
            if (slides.length <= activeIndex || activeIndex < 0) return null;

            const activeSlide = slides[activeIndex];
            const imageDiv = activeSlide.querySelector('div[aria-label^="Profile Photo"]');
            if (!imageDiv) return null;

            const style = window.getComputedStyle(imageDiv);
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage.startsWith('url("')) {
                return bgImage.slice(5, -2);
            }
            return null;
          };
          
          const url = getImageUrl();
          const nextButton = container.querySelector('button[aria-label="Next Photo"]');
          const isEnd = !nextButton || nextButton.disabled;

          return { url, isEnd };
        })();
      `);

      if (stateResult.error) {
        console.error('script error:', stateResult.error);
        break;
      }

      // step 2: download the image if it's new.
      if (stateResult.url && !downloadedUrls.has(stateResult.url)) {
        console.log(`found new image, downloading...`);
        downloadedUrls.add(stateResult.url);
        view.webContents.downloadURL(stateResult.url);
      } else if (stateResult.url) {
        console.log('image already downloaded, skipping');
      } else {
        console.log('could not find image url for this slide');
      }

      // step 3: if it's the last image, break the loop.
      if (stateResult.isEnd) {
        console.log('next button disabled, must be the last image');
        break;
      }

      // step 4: click the 'next photo' button.
      console.log('clicking next photo...');
      await view.webContents.executeJavaScript(`
        (() => {
          const getOnscreenProfile = () => {
            const profileContainers = document.querySelectorAll('section[aria-roledescription="carousel"]');
            const candidates = Array.from(profileContainers).filter(c => c.getBoundingClientRect().top >= 0);
            return candidates.length > 0 ? candidates[candidates.length - 1] : null;
          };
          const container = getOnscreenProfile();
          if (!container) return;
          
          const nextButton = container.querySelector('button[aria-label="Next Photo"]');
          if (nextButton && !nextButton.disabled) {
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
            nextButton.dispatchEvent(mousedownEvent);
            nextButton.dispatchEvent(clickEvent);
          }
        })();
      `);

      // step 5: wait for the ui to update.
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error('error in download loop:', err);
      break;
    }
  }

  console.log(`---`);
  console.log(`finished profile. total unique images: ${downloadedUrls.size}`);
});

// ai service ipc handlers
ipcMain.handle('ai:initialize', async (event, apiKey: string) => {
  try {
    console.log('Main process: Initializing AI with key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'empty');
    
    if (AIService.isValidApiKey(apiKey)) {
      aiService = new AIService(apiKey.trim());
      console.log('Main process: AI service initialized successfully');
      return { success: true };
    } else {
      console.log('Main process: API key validation failed');
      return { success: false, error: 'Invalid API key format' };
    }
  } catch (error) {
    console.error('Main process: AI initialization error:', error);
    return { success: false, error: (error as Error).message || 'Unknown error' };
  }
});

ipcMain.handle('ai:chat', async (event, userMessage: string, conversationHistory: any[], onboardingData?: any) => {
  try {
    if (!aiService) {
      return { 
        success: false, 
        error: 'AI service not initialized',
        fallback: { 
          message: "ai isn't connected yet! add your api key in the debug panel 🔑", 
          emotion: "casual",
          confidence: 0.3
        }
      };
    }

    console.log('Main process: Getting AI response for:', userMessage.substring(0, 50) + '...');
    const response = await aiService.getChatResponse(userMessage, conversationHistory, onboardingData);
    console.log('Main process: AI responded with emotion:', response.emotion);
    
    return { success: true, response };
  } catch (error) {
    console.error('Main process: AI chat error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error',
      fallback: {
        message: "oops, my brain hiccupped! 🤖 try asking again?",
        emotion: "confused",
        confidence: 0.3
      }
    };
  }
});

ipcMain.handle('ai:status', async (event) => {
  return { isConnected: !!aiService };
});

ipcMain.handle('ai:analyze-profile', async (event, images: string[], userMessage: string, onboardingData: any, conversationHistory: any[]) => {
  try {
    if (!aiService) {
      return { 
        success: false, 
        error: 'AI service not initialized' 
      };
    }

    console.log('Main process: Analyzing profile with', images.length, 'images and', conversationHistory?.length || 0, 'chat messages');
    const response = await aiService.analyzeProfile({
      images,
      userMessage,
      onboardingData,
      conversationHistory
    });
    
    console.log('Main process: Analysis complete, response length:', response.message.length);
    return { success: true, response };
  } catch (error) {
    console.error('Main process: Profile analysis error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error' 
    };
  }
});

// enhanced download with progress tracking
ipcMain.handle('download-profile-images', async (event) => {
  if (!view) return { success: false, error: 'No view available' };

  console.log('Starting profile image download with progress tracking...');
  
  const images: string[] = [];
  const MAX_IMAGES = 10;

  try {
    for (let i = 0; i < MAX_IMAGES; i++) {
      // get current image url
      const result: { url?: string; isEnd?: boolean; error?: string } = await view.webContents.executeJavaScript(`
        (() => {
          const getOnscreenProfile = () => {
            const profileContainers = document.querySelectorAll('section[aria-roledescription="carousel"]');
            const candidates = Array.from(profileContainers).filter(c => c.getBoundingClientRect().top >= 0);
            return candidates.length > 0 ? candidates[candidates.length - 1] : null;
          };

          const container = getOnscreenProfile();
          if (!container) return { error: 'could not find current profile container' };

          const getImageUrl = () => {
            const allDots = container.querySelectorAll('button[role="tab"]');
            const activeDot = container.querySelector('button[role="tab"][aria-selected="true"]');
            if (!activeDot) return null;
            const activeIndex = Array.from(allDots).indexOf(activeDot);

            const slides = container.querySelectorAll('.keen-slider__slide');
            if (slides.length <= activeIndex || activeIndex < 0) return null;

            const activeSlide = slides[activeIndex];
            const imageDiv = activeSlide.querySelector('div[aria-label^="Profile Photo"]');
            if (!imageDiv) return null;

            const style = window.getComputedStyle(imageDiv);
            const bgImage = style.backgroundImage;
            if (bgImage && bgImage.startsWith('url("')) {
                return bgImage.slice(5, -2);
            }
            return null;
          };
          
          const url = getImageUrl();
          const nextButton = container.querySelector('button[aria-label="Next Photo"]');
          const isEnd = !nextButton || nextButton.disabled;

          return { url, isEnd };
        })();
      `);

      if (result.error || !result.url) {
        if (result.isEnd) break;
        continue;
      }

      // download image as base64
      try {
        const imageResponse = await fetch(result.url);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        images.push(base64Image);
        
        // notify renderer of progress
        event.sender.send('download-progress', { 
          imageCount: images.length, 
          imageUrl: result.url,
          imageBase64: base64Image,
          isComplete: false 
        });
        
        console.log(`Downloaded image ${images.length}: ${result.url}`);
      } catch (downloadError) {
        console.error('Failed to download image:', downloadError);
      }

      if (result.isEnd) break;

      // click next photo
      await view.webContents.executeJavaScript(`
        (() => {
          const getOnscreenProfile = () => {
            const profileContainers = document.querySelectorAll('section[aria-roledescription="carousel"]');
            const candidates = Array.from(profileContainers).filter(c => c.getBoundingClientRect().top >= 0);
            return candidates.length > 0 ? candidates[candidates.length - 1] : null;
          };
          
          const container = getOnscreenProfile();
          if (!container) return;
          
          const nextButton = container.querySelector('button[aria-label="Next Photo"]');
          if (nextButton && !nextButton.disabled) {
            console.log('Clicking next photo button');
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
            nextButton.dispatchEvent(mousedownEvent);
            nextButton.dispatchEvent(clickEvent);
          } else {
            console.log('Next button not found or disabled');
          }
        })();
      `);

      await new Promise(resolve => setTimeout(resolve, 1200));
    }

    // notify completion
    event.sender.send('download-progress', { 
      imageCount: images.length, 
      isComplete: true 
    });

    console.log(`Profile download complete: ${images.length} images`);
    return { success: true, images, count: images.length };

  } catch (error) {
    console.error('Profile download error:', error);
    return { success: false, error: (error as Error).message || 'Unknown error' };
  }
});
