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

// create the main application window
const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    height: 680,
    width: 540,
    titleBarStyle: 'hidden',
    frame: false,
    transparent: true,
    backgroundColor: 'rgba(0,0,0,0)',
    resizable: false,
    trafficLightPosition: { x: -100, y: -100 },
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      nodeIntegration: false,
      contextIsolation: true,
      experimentalFeatures: false,
      offscreen: false,
      enableBlinkFeatures: '',
      disableBlinkFeatures: 'Accelerated2dCanvas,AcceleratedSmallCanvases',
    },
  });

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);
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

// handle onboarding completion and setup browser view
ipcMain.on('onboarding-complete', () => {
  console.log('onboarding done, creating browser view');
  if (!mainWindow) return;

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
    const debuggerPanelWidth = 420;
    if (view) {
      view.setBounds({ x: 0, y: 0, width: width - debuggerPanelWidth, height });
    }
  };

  resizeView();
  mainWindow.on('resize', resizeView);

  view.webContents.loadURL('https://tinder.com/app/recs');

  // monitor for emergency message intervention
  view.webContents.on('did-finish-load', () => {
    console.log('browser view finished loading, setting up monitoring');
    let interventionInProgress = false;

    // periodically check for emergency messages
    const startMonitoring = () => {
      setInterval(async () => {
        if (interventionInProgress) {
          console.log('skipping check - intervention in progress');
          return;
        }
        try {
          const currentUrl = view.webContents.getURL();
          if (!currentUrl.includes('tinder.com/app/messages/')) {
            return;
          }
          const result = await view.webContents.executeJavaScript(`
            (() => {
              const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
              if (textarea && textarea.value && textarea.value.trim().length >= 3) {
                return {
                  found: true,
                  content: textarea.value.trim(),
                  lastCheck: Date.now()
                };
              }
              return { found: false };
            })();
          `);

          if (result.found && result.content) {
            const cacheKey = 'emergency-' + result.content.substring(0, 10);
            const lastCheck = (global as any).emergencyCache?.[cacheKey] || 0;
            const now = Date.now();

            if (now - lastCheck > 1000) {
              if (!(global as any).emergencyCache) (global as any).emergencyCache = {};
              (global as any).emergencyCache[cacheKey] = now;

              console.log('periodic check found message:', result.content);

              const onboardingData = await mainWindow.webContents.executeJavaScript(
                `JSON.parse(localStorage.getItem('rizzly-preferences') || 'null')`
              );
              const chatHistory = await mainWindow.webContents.executeJavaScript(
                `JSON.parse(localStorage.getItem('rizzly-chat-history') || '[]')`
              );

              if (aiService) {
                const emergencyResult = await aiService.detectEmergency(result.content, onboardingData, chatHistory);

                if (emergencyResult.isEmergency) {
                  console.log('emergency intervention: deleting message');
                  interventionInProgress = true;
                  console.log('intervention lock set - blocking new checks');

                  if (mainWindow) {
                    mainWindow.webContents.send('emergency-alert', {
                      ...emergencyResult,
                      message: emergencyResult.message
                    });
                  }

                  await view.webContents.executeJavaScript(`
                    (() => {
                      const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
                      if (textarea) {
                        textarea.disabled = true;
                        textarea.style.opacity = '0.5';
                        textarea.style.cursor = 'not-allowed';
                        console.log('textarea disabled for emergency deletion');
                      }
                    })();
                  `);

                  console.log('starting character-by-character deletion');

                  let deletionAttempts = 0;
                  const maxAttempts = 200;

                  while (deletionAttempts < maxAttempts) {
                    const remainingLength = await view.webContents.executeJavaScript(`
                      (() => {
                        const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
                        if (textarea && textarea.value.length > 0) {
                          textarea.value = textarea.value.slice(0, -1);
                          console.log('deleted character, remaining:', textarea.value.length);
                          return textarea.value.length;
                        }
                        return 0;
                      })();
                    `);

                    if (remainingLength === 0) {
                      console.log('textarea completely cleared');
                      break;
                    }

                    await new Promise(resolve => setTimeout(resolve, 40));
                    deletionAttempts++;
                  }

                  console.log('message deletion complete');

                  await view.webContents.executeJavaScript(`
                    (() => {
                      const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
                      if (textarea) {
                        textarea.disabled = false;
                        textarea.style.opacity = '1';
                        textarea.style.cursor = 'text';
                        console.log('textarea re-enabled');
                      }
                    })();
                  `);

                  if (mainWindow && aiService) {
                    try {
                      const followUpResult = await aiService.generateFollowUpReaction(result.content);

                      mainWindow.webContents.send('emergency-alert', {
                        message: followUpResult.message,
                        emotion: followUpResult.emotion
                      });
                    } catch (followUpError) {
                      console.error('follow-up generation failed:', followUpError);
                      mainWindow.webContents.send('emergency-alert', {
                        message: `crisis averted! that message was genuinely unhinged`,
                        emotion: 'shocked'
                      });
                    }
                  }

                  (global as any).emergencyCache[cacheKey] = now + 60000;

                  setTimeout(() => {
                    interventionInProgress = false;
                    console.log('intervention lock released');
                  }, 2000);
                }
              }
            }
          }
        } catch (error) {
          // ignore errors to avoid log spam
        }
      }, 100);
    };

    setTimeout(startMonitoring, 3000);
  });

  // handle file downloads for browser view
  view.webContents.session.on('will-download', (event: any, item: any, webContents: any) => {
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
            console.log(`progress: ${Math.round((received / total) * 100)}%`);
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

// handle navigation requests from renderer
ipcMain.on('navigate-to', (event, url) => {
  if (view && url) {
    console.log(`navigating to: ${url}`);
    view.webContents.loadURL(url);
  }
});

// log the current image url in the profile carousel
ipcMain.on('log-current-image-url', (event) => {
  if (view) {
    console.log('logging current image url');
    const script = `
      (() => {
        const logs = [];
        logs.push('finding profile and image');
    
        const profileContainers = document.querySelectorAll('section[aria-roledescription="carousel"]');
        logs.push(\`found \${profileContainers.length} profile containers\`);
    
        let candidateContainers = [];
        for (const container of profileContainers) {
            const hasActiveTab = container.querySelector('button[role="tab"][aria-selected="true"]');
            const rect = container.getBoundingClientRect();
            if (hasActiveTab && rect.top >= 0) {
                candidateContainers.push(container);
            }
        }
    
        logs.push(\`found \${candidateContainers.length} candidates (on-screen w/ active tab)\`);
    
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
      .catch(err => console.error('script execution failed:', err));
  }
});

// click the next photo button in the profile carousel
ipcMain.on('click-next-photo', (event, selector) => {
  if (view && selector) {
    console.log('clicking next photo');
    const script = `
      (() => {
        const logs = [];
        logs.push('finding and clicking next photo');

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
      .catch(err => console.error('script execution failed:', err));
  }
});

// check the status of emergency monitoring
ipcMain.on('check-monitoring', (event) => {
  if (view) {
    console.log('checking emergency monitoring status');
    const script = `
      (() => {
        const hasRizzlyMonitoring = !!document.querySelector('textarea[data-rizzly-monitored]');
        const currentUrl = window.location.href;
        const isMessagesPage = currentUrl.includes('tinder.com/app/messages/');
        const hasTextarea = !!document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
        
        return {
          hasRizzlyMonitoring,
          currentUrl,
          isMessagesPage,
          hasTextarea,
          localStorage: {
            hasPreferences: !!localStorage.getItem('rizzly-preferences'),
            hasChatHistory: !!localStorage.getItem('rizzly-chat-history')
          }
        };
      })();
    `;
    view.webContents.executeJavaScript(script)
      .then(result => {
        console.log('monitoring status:', result);
        console.log('end monitoring check');
      })
      .catch(err => console.error('monitoring check failed:', err));
  }
});

// debug the message textarea in the browser view
ipcMain.on('debug-textarea', (event) => {
  if (view) {
    console.log('debugging textarea content');
    const script = `
      (() => {
        const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
        if (textarea) {
          return {
            found: true,
            content: textarea.value,
            placeholder: textarea.placeholder,
            maxLength: textarea.maxLength,
            id: textarea.id,
            classes: textarea.className
          };
        } else {
          return {
            found: false,
            message: 'no message textarea found on current page'
          };
        }
      })();
    `;
    view.webContents.executeJavaScript(script)
      .then(result => {
        if (result.found) {
          console.log('textarea found');
          console.log('current content:', result.content || '(empty)');
          console.log('placeholder:', result.placeholder);
          console.log('max length:', result.maxLength);
          console.log('id:', result.id);
          console.log('classes:', result.classes);
        } else {
          console.log(result.message);
        }
        console.log('end debug');
      })
      .catch(err => console.error('debug script execution failed:', err));
  }
});

// download all images for the current profile
ipcMain.on('download-all-images', async () => {
  if (!view) return;

  console.log('starting download of all images for this profile');

  const downloadedUrls = new Set<string>();
  const MAX_IMAGES_PER_PROFILE = 20;

  for (let i = 0; i < MAX_IMAGES_PER_PROFILE; i++) {
    console.log(`iteration ${i + 1}`);
    try {
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

      if (stateResult.url && !downloadedUrls.has(stateResult.url)) {
        console.log('found new image, downloading');
        downloadedUrls.add(stateResult.url);
        view.webContents.downloadURL(stateResult.url);
      } else if (stateResult.url) {
        console.log('image already downloaded, skipping');
      } else {
        console.log('could not find image url for this slide');
      }

      if (stateResult.isEnd) {
        console.log('next button disabled, must be the last image');
        break;
      }

      console.log('clicking next photo');
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

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (err) {
      console.error('error in download loop:', err);
      break;
    }
  }

  console.log('finished profile. total unique images:', downloadedUrls.size);
});

// ai service ipc handlers

// handle ai initialization
ipcMain.handle('ai:initialize', async (event, apiKey: string) => {
  try {
    console.log('main process: initializing ai with key:', apiKey ? `${apiKey.substring(0, 8)}` : 'empty');
    if (AIService.isValidApiKey(apiKey)) {
      aiService = new AIService(apiKey.trim());
      console.log('main process: ai service initialized successfully');
      return { success: true };
    } else {
      console.log('main process: api key validation failed');
      return { success: false, error: 'Invalid API key format' };
    }
  } catch (error) {
    console.error('main process: ai initialization error:', error);
    return { success: false, error: (error as Error).message || 'Unknown error' };
  }
});

// handle ai chat requests
ipcMain.handle('ai:chat', async (event, userMessage: string, conversationHistory: any[], onboardingData?: any) => {
  try {
    if (!aiService) {
      return { 
        success: false, 
        error: 'AI service not initialized',
        fallback: { 
          message: "ai isn't connected yet! add your api key in the debug panel", 
          emotion: "casual",
          confidence: 0.3
        }
      };
    }

    console.log('main process: getting ai response for:', userMessage.substring(0, 50));
    const response = await aiService.getChatResponse(userMessage, conversationHistory, onboardingData);
    console.log('main process: ai responded with emotion:', response.emotion);
    
    return { success: true, response };
  } catch (error) {
    console.error('main process: ai chat error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error',
      fallback: {
        message: "oops, my brain hiccupped! try asking again?",
        emotion: "confused",
        confidence: 0.3
      }
    };
  }
});

// handle ai connection status check
ipcMain.handle('ai:status', async (event) => {
  return { isConnected: !!aiService };
});

// handle ai profile analysis
ipcMain.handle('ai:analyze-profile', async (event, images: string[], userMessage: string, onboardingData: any, conversationHistory: any[]) => {
  try {
    if (!aiService) {
      return { 
        success: false, 
        error: 'AI service not initialized' 
      };
    }

    console.log('main process: analyzing profile with', images.length, 'images and', conversationHistory?.length || 0, 'chat messages');
    const response = await aiService.analyzeProfile({
      images,
      userMessage,
      onboardingData,
      conversationHistory
    });
    
    console.log('main process: analysis complete, response length:', response.message.length);
    return { success: true, response };
  } catch (error) {
    console.error('main process: profile analysis error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error' 
    };
  }
});

// handle ai message improvement
ipcMain.handle('ai:improve-message', async (event, userRequest: string, onboardingData: any, conversationHistory: any[]) => {
  try {
    if (!aiService) {
      return { 
        success: false, 
        error: 'AI service not initialized' 
      };
    }

    if (!view) {
      return { 
        success: false, 
        error: 'No browser view available' 
      };
    }

    const currentUrl: string = await view.webContents.executeJavaScript('window.location.href');
    if (!currentUrl.includes('tinder.com/app/messages')) {
      return {
        success: false,
        error: 'Message assistance only available on Tinder messages page'
      };
    }

    const textareaContent: { found: boolean; content?: string; error?: string } = await view.webContents.executeJavaScript(`
      (() => {
        const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
        if (textarea) {
          return {
            found: true,
            content: textarea.value || ''
          };
        } else {
          return {
            found: false,
            error: 'No message textarea found'
          };
        }
      })();
    `);

    if (!textareaContent.found) {
      return {
        success: false,
        error: 'Could not find message textarea on current page'
      };
    }

    console.log('main process: improving message:', textareaContent.content?.substring(0, 50));
    const response = await aiService.improveMessage(
      textareaContent.content || '',
      userRequest,
      onboardingData,
      conversationHistory
    );
    
    console.log('main process: message improvement complete');
    return { success: true, response, originalMessage: textareaContent.content };
  } catch (error) {
    console.error('main process: message assistance error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error' 
    };
  }
});

// handle ai emergency check
ipcMain.handle('ai:emergency-check', async (event, currentMessage: string, onboardingData: any, conversationHistory: any[]) => {
  try {
    if (!aiService) {
      return { success: false, isEmergency: false };
    }

    if (!view) {
      return { success: false, isEmergency: false };
    }

    const currentUrl: string = await view.webContents.executeJavaScript('window.location.href');
    if (!currentUrl.includes('tinder.com/app/messages/')) {
      return { success: false, isEmergency: false };
    }

    if (!currentMessage || currentMessage.trim().length < 5) {
      return { success: true, isEmergency: false };
    }

    console.log('emergency check for:', currentMessage.substring(0, 30));
    const result = await aiService.detectEmergency(currentMessage, onboardingData, conversationHistory);
    
    if (result.isEmergency) {
      console.log('emergency detected:', currentMessage);
    }
    
    return { 
      success: true, 
      isEmergency: result.isEmergency,
      response: result.isEmergency ? result : undefined
    };
  } catch (error) {
    console.error('emergency check error:', error);
    return { success: false, isEmergency: false };
  }
});

// forward emergency alert to main window
ipcMain.on('emergency-alert', (event, response) => {
  console.log('emergency alert received:', response);
  if (mainWindow) {
    mainWindow.webContents.send('emergency-alert', response);
  }
});

// handle ai message writing
ipcMain.handle('ai:write-message', async (event, userRequest: string, onboardingData: any, conversationHistory: any[]) => {
  try {
    if (!aiService) {
      return { 
        success: false, 
        error: 'AI service not initialized' 
      };
    }

    if (!view) {
      return { 
        success: false, 
        error: 'No browser view available' 
      };
    }

    const currentUrl: string = await view.webContents.executeJavaScript('window.location.href');
    if (!currentUrl.includes('tinder.com/app/messages')) {
      return {
        success: false,
        error: 'Message writing only available on Tinder messages page'
      };
    }

    console.log('main process: writing message for user request:', userRequest);
    const response = await aiService.writeMessage(
      userRequest,
      onboardingData,
      conversationHistory
    );
    
    console.log('main process: message writing complete');
    return { success: true, response };
  } catch (error) {
    console.error('main process: message writing error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error' 
    };
  }
});

// handle ai completion message generation
ipcMain.handle('ai:generate-completion', async (event, writtenMessage: string, userRequest: string, onboardingData: any) => {
  try {
    if (!aiService) {
      return { 
        success: false, 
        error: 'AI service not initialized' 
      };
    }

    console.log('main process: generating completion message for:', writtenMessage.substring(0, 30));
    const response = await aiService.generateCompletionMessage(
      writtenMessage,
      userRequest,
      onboardingData
    );
    
    console.log('main process: completion message generated');
    return { success: true, response };
  } catch (error) {
    console.error('main process: completion generation error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error' 
    };
  }
});

// type a message in the browser view
ipcMain.handle('type-message', async (event, message: string) => {
  try {
    if (!view) {
      return { 
        success: false, 
        error: 'No browser view available' 
      };
    }

    const currentUrl: string = await view.webContents.executeJavaScript('window.location.href');
    if (!currentUrl.includes('tinder.com/app/messages')) {
      return {
        success: false,
        error: 'Message typing only available on Tinder messages page'
      };
    }

    console.log('main process: starting to type message:', message.substring(0, 30));
    
    await view.webContents.executeJavaScript(`
      (() => {
        const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
        if (textarea) {
          textarea.focus();
          textarea.value = '';
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      })();
    `);

    for (let i = 0; i < message.length; i++) {
      const char = message[i];
      
      await view.webContents.executeJavaScript(`
        (() => {
          const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
          if (textarea) {
            textarea.value += '${char.replace(/'/g, "\\'")}';
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        })();
      `);
      
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
    }
    
    console.log('main process: message typing complete');
    return { success: true };
  } catch (error) {
    console.error('main process: message typing error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error' 
    };
  }
});

// download profile images with progress tracking
ipcMain.handle('download-profile-images', async (event) => {
  if (!view) return { success: false, error: 'No view available' };

  console.log('starting profile image download with progress tracking');
  
  const images: string[] = [];
  const MAX_IMAGES = 10;

  try {
    for (let i = 0; i < MAX_IMAGES; i++) {
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

      try {
        const imageResponse = await fetch(result.url);
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        images.push(base64Image);
        
        event.sender.send('download-progress', { 
          imageCount: images.length, 
          imageUrl: result.url,
          imageBase64: base64Image,
          isComplete: false 
        });
        
        console.log(`downloaded image ${images.length}: ${result.url}`);
      } catch (downloadError) {
        console.error('failed to download image:', downloadError);
      }

      if (result.isEnd) break;

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
            console.log('clicking next photo button');
            const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
            const mousedownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
            nextButton.dispatchEvent(mousedownEvent);
            nextButton.dispatchEvent(clickEvent);
          } else {
            console.log('next button not found or disabled');
          }
        })();
      `);

      await new Promise(resolve => setTimeout(resolve, 600));
    }

    event.sender.send('download-progress', { 
      imageCount: images.length, 
      isComplete: true 
    });

    console.log(`profile download complete: ${images.length} images`);
    return { success: true, images, count: images.length };

  } catch (error) {
    console.error('profile download error:', error);
    return { success: false, error: (error as Error).message || 'Unknown error' };
  }
});
