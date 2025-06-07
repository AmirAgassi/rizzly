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
    const debuggerPanelWidth = 420; // match the CSS width from MainApp.css
    if (view) {
      view.setBounds({ x: 0, y: 0, width: width - debuggerPanelWidth, height });
    }
  };

  resizeView();
  mainWindow.on('resize', resizeView);

  view.webContents.loadURL('https://tinder.com/app/recs');
  // view.webContents.openDevTools({ mode: 'detach' });

    // inject real-time message monitoring when page loads
  view.webContents.on('did-finish-load', () => {
    console.log('🔄 Browser view finished loading, setting up monitoring...');
    
         // instead of complex injection, let's use a simpler approach with periodic checking
     let interventionInProgress = false;
     
     const startMonitoring = () => {
       setInterval(async () => {
         // skip if intervention is happening
         if (interventionInProgress) {
           console.log('⏸️ Skipping check - intervention in progress');
           return;
         }
        try {
          const currentUrl = view.webContents.getURL();
          
          // only monitor on messages pages
          if (!currentUrl.includes('tinder.com/app/messages/')) {
            return;
          }
          
                     // get current textarea content
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
             // check if this message has already been checked recently
             const cacheKey = 'emergency-' + result.content.substring(0, 10);
            const lastCheck = (global as any).emergencyCache?.[cacheKey] || 0;
            const now = Date.now();
            
            // only check if it's been more than 1 second since last check of this message  
            if (now - lastCheck > 1000) {
              if (!(global as any).emergencyCache) (global as any).emergencyCache = {};
              (global as any).emergencyCache[cacheKey] = now;
              
              console.log('🔍 Periodic check found message:', result.content + '...');
               
               // get onboarding data and chat history from main window's localStorage
               const onboardingData = await mainWindow.webContents.executeJavaScript(
                 `JSON.parse(localStorage.getItem('rizzly-preferences') || 'null')`
               );
               const chatHistory = await mainWindow.webContents.executeJavaScript(
                 `JSON.parse(localStorage.getItem('rizzly-chat-history') || '[]')`
               );
              
                             // run emergency check
               if (aiService) {
                 const emergencyResult = await aiService.detectEmergency(result.content, onboardingData, chatHistory);
                 
                 if (emergencyResult.isEmergency) {
                   console.log('🚨 EMERGENCY INTERVENTION: DELETING MESSAGE');
                   interventionInProgress = true; // block further checks
                   console.log('🔒 Intervention lock set - blocking new checks');
                   
                   // send the actual LLM's horrified reaction first
                   if (mainWindow) {
                     mainWindow.webContents.send('emergency-alert', {
                       ...emergencyResult,
                       message: emergencyResult.message // use the LLM's actual disgusted/terrified response
                     });
                   }
                   
                   // disable textarea to prevent user from typing during deletion
                   await view.webContents.executeJavaScript(`
                     (() => {
                       const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
                       if (textarea) {
                         textarea.disabled = true;
                         textarea.style.opacity = '0.5';
                         textarea.style.cursor = 'not-allowed';
                         console.log('🚫 Textarea disabled for emergency deletion');
                       }
                     })();
                   `);
                   
                   // start deleting the message character by character
                   console.log(`🗑️ Starting character-by-character deletion...`);
                   
                   // keep deleting until textarea is completely empty
                   let deletionAttempts = 0;
                   const maxAttempts = 200; // safety limit
                   
                   while (deletionAttempts < maxAttempts) {
                     const remainingLength = await view.webContents.executeJavaScript(`
                       (() => {
                         const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
                         if (textarea && textarea.value.length > 0) {
                           textarea.value = textarea.value.slice(0, -1);
                           console.log('🗑️ Deleted character, remaining:', textarea.value.length);
                           return textarea.value.length;
                         }
                         return 0;
                       })();
                     `);
                     
                     if (remainingLength === 0) {
                       console.log('✅ Textarea completely cleared!');
                       break;
                     }
                     
                     await new Promise(resolve => setTimeout(resolve, 40)); // faster deletion
                     deletionAttempts++;
                   }
                   
                   console.log('✅ Message deletion complete');
                   
                   // re-enable textarea
                   await view.webContents.executeJavaScript(`
                     (() => {
                       const textarea = document.querySelector('textarea[placeholder*="Type a message"], textarea[placeholder*="message"]');
                       if (textarea) {
                         textarea.disabled = false;
                         textarea.style.opacity = '1';
                         textarea.style.cursor = 'text';
                         console.log('✅ Textarea re-enabled');
                       }
                     })();
                   `);
                   
                   // generate custom LLM follow-up reaction
                   if (mainWindow && aiService) {
                     try {
                       const followUpResult = await aiService.generateFollowUpReaction(result.content);
                       
                       mainWindow.webContents.send('emergency-alert', {
                         message: followUpResult.message,
                         emotion: followUpResult.emotion
                       });
                     } catch (followUpError) {
                       console.error('Follow-up generation failed:', followUpError);
                       // fallback message
                       mainWindow.webContents.send('emergency-alert', {
                         message: `crisis averted! that message was genuinely unhinged 😰`,
                         emotion: 'shocked'
                       });
                     }
                   }
                   
                   // extend cooldown and clear intervention flag after a delay
                   (global as any).emergencyCache[cacheKey] = now + 60000; // 1 minute cooldown
                   
                   // wait a bit longer before allowing new interventions
                   setTimeout(() => {
                     interventionInProgress = false;
                     console.log('✅ Intervention lock released');
                   }, 2000); // 2 second buffer
                 }
               }
            }
          }
          
                 } catch (error) {
           // silently ignore errors to avoid spam
         }
       }, 100); // check every 100ms for ultra-fast detection
    };
    
    // start monitoring after a short delay
    setTimeout(startMonitoring, 3000);
  });

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

ipcMain.on('check-monitoring', (event) => {
  if (view) {
    console.log('--- checking emergency monitoring status ---');
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
        console.log('Monitoring status:', result);
        console.log('--- end monitoring check ---');
      })
      .catch(err => console.error('Monitoring check failed:', err));
  }
});

ipcMain.on('debug-textarea', (event) => {
  if (view) {
    console.log('--- debugging textarea content ---');
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
            message: 'No message textarea found on current page'
          };
        }
      })();
    `;
    view.webContents.executeJavaScript(script)
      .then(result => {
        if (result.found) {
          console.log('Textarea found!');
          console.log('Current content:', result.content || '(empty)');
          console.log('Placeholder:', result.placeholder);
          console.log('Max length:', result.maxLength);
          console.log('ID:', result.id);
          console.log('Classes:', result.classes);
        } else {
          console.log(result.message);
        }
        console.log('--- end debug ---');
      })
      .catch(err => console.error('Debug script execution failed:', err));
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

    // first check if we're on the messages page
    const currentUrl: string = await view.webContents.executeJavaScript('window.location.href');
    if (!currentUrl.includes('tinder.com/app/messages')) {
      return {
        success: false,
        error: 'Message assistance only available on Tinder messages page'
      };
    }

    // get the current textarea content
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

    console.log('Main process: Improving message:', textareaContent.content?.substring(0, 50) + '...');
    const response = await aiService.improveMessage(
      textareaContent.content || '',
      userRequest,
      onboardingData,
      conversationHistory
    );
    
    console.log('Main process: Message improvement complete');
    return { success: true, response, originalMessage: textareaContent.content };
  } catch (error) {
    console.error('Main process: Message assistance error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error' 
    };
  }
});

ipcMain.handle('ai:emergency-check', async (event, currentMessage: string, onboardingData: any, conversationHistory: any[]) => {
  try {
    if (!aiService) {
      return { success: false, isEmergency: false };
    }

    if (!view) {
      return { success: false, isEmergency: false };
    }

    // check if we're on messages page
    const currentUrl: string = await view.webContents.executeJavaScript('window.location.href');
    if (!currentUrl.includes('tinder.com/app/messages/')) {
      return { success: false, isEmergency: false };
    }

    // skip empty or very short messages
    if (!currentMessage || currentMessage.trim().length < 5) {
      return { success: true, isEmergency: false };
    }

    console.log('Emergency check for:', currentMessage.substring(0, 30) + '...');
    const result = await aiService.detectEmergency(currentMessage, onboardingData, conversationHistory);
    
    if (result.isEmergency) {
      console.log('🚨 EMERGENCY DETECTED:', currentMessage);
    }
    
    return { 
      success: true, 
      isEmergency: result.isEmergency,
      response: result.isEmergency ? result : undefined
    };
  } catch (error) {
    console.error('Emergency check error:', error);
    return { success: false, isEmergency: false };
  }
});

ipcMain.on('emergency-alert', (event, response) => {
  console.log('🚨 Emergency alert received:', response);
  // forward the emergency alert to the main window
  if (mainWindow) {
    mainWindow.webContents.send('emergency-alert', response);
  }
});

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

    // first check if we're on the messages page
    const currentUrl: string = await view.webContents.executeJavaScript('window.location.href');
    if (!currentUrl.includes('tinder.com/app/messages')) {
      return {
        success: false,
        error: 'Message writing only available on Tinder messages page'
      };
    }

    console.log('Main process: Writing message for user request:', userRequest);
    const response = await aiService.writeMessage(
      userRequest,
      onboardingData,
      conversationHistory
    );
    
    console.log('Main process: Message writing complete');
    return { success: true, response };
  } catch (error) {
    console.error('Main process: Message writing error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error' 
    };
  }
});

ipcMain.handle('ai:generate-completion', async (event, writtenMessage: string, userRequest: string, onboardingData: any) => {
  try {
    if (!aiService) {
      return { 
        success: false, 
        error: 'AI service not initialized' 
      };
    }

    console.log('Main process: Generating completion message for:', writtenMessage.substring(0, 30) + '...');
    const response = await aiService.generateCompletionMessage(
      writtenMessage,
      userRequest,
      onboardingData
    );
    
    console.log('Main process: Completion message generated');
    return { success: true, response };
  } catch (error) {
    console.error('Main process: Completion generation error:', error);
    return { 
      success: false, 
      error: (error as Error).message || 'Unknown error' 
    };
  }
});

ipcMain.handle('type-message', async (event, message: string) => {
  try {
    if (!view) {
      return { 
        success: false, 
        error: 'No browser view available' 
      };
    }

    // check if we're on the messages page
    const currentUrl: string = await view.webContents.executeJavaScript('window.location.href');
    if (!currentUrl.includes('tinder.com/app/messages')) {
      return {
        success: false,
        error: 'Message typing only available on Tinder messages page'
      };
    }

    console.log('Main process: Starting to type message:', message.substring(0, 30) + '...');
    
    // first clear the textarea
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

    // type character by character with delays
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
      
      // delay between characters (faster than deletion)
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20));
    }
    
    console.log('Main process: Message typing complete');
    return { success: true };
  } catch (error) {
    console.error('Main process: Message typing error:', error);
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
