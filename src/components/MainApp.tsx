import React, { useState, useEffect, useRef } from 'react';
import './MainApp.css';
import { bufoManager } from './BufoManager';
import PhotoStack from './PhotoStack';
import bufoTea from '../bufopack/bufo-tea.png';

function MainApp() {
  // main state hooks for app logic and ui
  const [activeTab, setActiveTab] = useState('main');
  const [url, setUrl] = useState('https://tinder.com/app/recs');
  const [nextButtonSelector] = useState('button[aria-label="Next Photo"]');
  const [chatMessage, setChatMessage] = useState('');
  const [currentBufo, setCurrentBufo] = useState('bufo-tea');
  const [bufoImage, setBufoImage] = useState(bufoTea);
  const [apiKey, setApiKey] = useState(localStorage.getItem('sambanova-api-key') || '');
  const [isAIConnected, setIsAIConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [downloadingPhotos, setDownloadingPhotos] = useState(false);
  const [currentPhotos, setCurrentPhotos] = useState<string[]>([]);
  const [onboardingData, setOnboardingData] = useState(() => {
    const saved = localStorage.getItem('rizzly-preferences');
    return saved ? JSON.parse(saved) : null;
  });
  const [chatHistory, setChatHistory] = useState([
    {
      type: 'mascot',
      message: 'heyo',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      bufoFace: 'bufo-tea'
    }
  ]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // run on mount: clear old chat, load bufos, and initialize ai if api key exists
  useEffect(() => {
    localStorage.removeItem('rizzly-chat-history');
    
    const initBufos = async () => {
      await bufoManager.loadAllBufos();
      if (bufoManager.isLoaded()) {
        const teaBufo = bufoManager.getBufo('bufo-tea');
        if (teaBufo) setBufoImage(teaBufo);
      }
    };
    initBufos();
    
    if (apiKey) {
      const checkAI = async () => {
        const result = await window.electronAPI.aiInitialize(apiKey);
        setIsAIConnected(result.success);
      };
      checkAI();
    }

    // listen for download progress and update chat photo stack
    const removeProgressListener = window.electronAPI.onDownloadProgress((data) => {
      console.log('renderer: download progress:', { 
        imageCount: data.imageCount, 
        hasImage: !!data.imageBase64,
        isComplete: data.isComplete 
      });
      
      if (data.isComplete) {
        console.log('renderer: download complete');
        setDownloadingPhotos(false);
      } else if (data.imageBase64) {
        console.log('renderer: adding new image to latest stack');
        setChatHistory(prev => {
          const updated = [...prev];
          // find the most recent message with a photo stack and add the new image
          for (let i = updated.length - 1; i >= 0; i--) {
            if ((updated[i] as any).hasPhotoStack) {
              const currentPhotos = (updated[i] as any).photos || [];
              if (!currentPhotos.includes(data.imageBase64)) {
                (updated[i] as any).photos = [...currentPhotos, data.imageBase64];
                console.log(`renderer: stack now has ${(updated[i] as any).photos.length} images`);
              }
              break;
            }
          }
          return updated;
        });
      }
    });

    return () => {
      removeProgressListener();
    };
  }, []);

  // persist chat history to localStorage on every update
  useEffect(() => {
    localStorage.setItem('rizzly-chat-history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // listen for emergency alerts from backend and update chat and bufo
  useEffect(() => {
    const removeEmergencyListener = window.electronAPI.onEmergencyAlert((response) => {
      console.log('🚨 emergency alert received in ui:', response);
      
      const emergencyMessage = {
        type: 'mascot',
        message: response.message,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        bufoFace: response.emotion
      };
      
      setChatHistory(prev => [...prev, emergencyMessage]);
      
      // update bufo to match emergency emotion
      if (bufoManager.isLoaded()) {
        const concernedBufo = bufoManager.getBufoByEmotion(response.emotion);
        if (concernedBufo) setBufoImage(concernedBufo);
      }
    });

    return () => {
      removeEmergencyListener();
    };
  }, []);

  // update api key and re-initialize ai connection
  const handleApiKeyUpdate = async (newKey: string) => {
    console.log('updating api key, length:', newKey.length);
    setApiKey(newKey);
    localStorage.setItem('sambanova-api-key', newKey);
    
    if (newKey) {
      const result = await window.electronAPI.aiInitialize(newKey);
      console.log('ai initialization result:', result.success);
      setIsAIConnected(result.success);
      
      if (result.success) {
        const successMessage = {
          type: 'mascot',
          message: 'ai is connected! lets get this bread',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bufoFace: 'excited'
        };
        setChatHistory(prev => [...prev, successMessage]);
        
        if (bufoManager.isLoaded()) {
          const excitedBufo = bufoManager.getBufoByEmotion('excited');
          if (excitedBufo) setBufoImage(excitedBufo);
        }
      } else {
        const failMessage = {
          type: 'mascot',
          message: 'hmm, that api key doesn\'t look right. make sure it\'s valid! 🔧',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bufoFace: 'confused'
        };
        setChatHistory(prev => [...prev, failMessage]);
      }
    } else {
      setIsAIConnected(false);
    }
  };

  // always scroll chat to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatMessagesRef.current) {
        const container = chatMessagesRef.current;
        container.scrollTop = container.scrollHeight + 1000;
      }
    };

    scrollToBottom();
    
    // do extra scrolls to catch late-rendered content (this is a hack)
    const timeoutId1 = setTimeout(scrollToBottom, 50);
    const timeoutId2 = setTimeout(scrollToBottom, 200);
    const timeoutId3 = setTimeout(scrollToBottom, 500);
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [chatHistory]);
  
  // navigation and debug helpers
  const handleNavigate = () => {
    if (url) window.electronAPI.navigateTo(url);
  };

  const handleLogUrl = () => {
    console.log('ui: getting current image url...');
    window.electronAPI.logCurrentImageUrl();
  };

  const handleClickNext = () => {
    console.log('ui: clicking next photo...');
    window.electronAPI.clickNextPhoto(nextButtonSelector);
  };

  const handleDownloadAll = () => {
    console.log('ui: downloading all images...');
    window.electronAPI.downloadAllImages();
  };

  // handle sending a chat message and ai response logic
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMessage = {
      type: 'user',
      message: chatMessage,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      bufoFace: currentBufo // keep bufo face for user messages for consistency
    };

    setChatHistory(prev => [...prev, userMessage]);
    const originalMessage = chatMessage;
    setChatMessage('');

    setIsTyping(true);
    
    try {
      console.log('chat response - connected:', isAIConnected);
      
      // get ai response from backend
      const result = await window.electronAPI.aiChat(originalMessage, chatHistory, onboardingData);
      
      let responseData;
      if (result.success && result.response) {
        responseData = result.response;
      } else if (result.fallback) {
        responseData = result.fallback;
      } else {
        responseData = {
          message: 'connect your ai api key in the debug panel to unlock smart responses!',
          emotion: 'casual',
          confidence: 0.3
        };
      }
      
      // handle ai tool calls and normal responses
      if (responseData.toolCall && responseData.toolCall.name === 'analyze_profile') {
        console.log('ai requested profile analysis tool');
        
        // show ai's initial response before starting analysis
        const initialResponse = {
          type: 'mascot',
          message: responseData.message,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bufoFace: responseData.emotion
        };
        setChatHistory(prev => [...prev, initialResponse]);
        
        setDownloadingPhotos(true);
        setCurrentPhotos([]);
        
        // add a message to show photo download progress
        const downloadMessageId = Date.now();
        const downloadMessage = {
          type: 'mascot',
          message: 'checking their photos...',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bufoFace: 'thinking',
          hasPhotoStack: true,
          photoStackId: downloadMessageId,
          photos: []
        };
        setChatHistory(prev => [...prev, downloadMessage]);
        
        try {
          const downloadResult = await window.electronAPI.downloadProfileImages();
          
          if (downloadResult.success && downloadResult.images) {
            console.log('downloaded', downloadResult.images.length, 'images for analysis');
            
            setIsTyping(true);
            const analysisResult = await window.electronAPI.aiAnalyzeProfile(
              downloadResult.images,
              originalMessage,
              onboardingData,
              chatHistory
            );
            
            if (analysisResult.success && analysisResult.response) {
              const analysisMessage = {
                type: 'mascot',
                message: analysisResult.response.message,
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                bufoFace: analysisResult.response.emotion
              };
              setChatHistory(prev => [...prev, analysisMessage]);
              
              // update bufo to match analysis result
              if (bufoManager.isLoaded()) {
                const newBufoImage = bufoManager.getBufoByEmotion(analysisResult.response.emotion);
                if (newBufoImage) setBufoImage(newBufoImage);
              }
            } else {
              throw new Error('Analysis failed');
            }
            
          } else {
            throw new Error('Download failed');
          }
          
        } catch (toolError) {
          console.error('tool execution error:', toolError);
          const errorMessage = {
            type: 'mascot',
            message: 'couldn\'t get their photos right now, but based on what i can see, trust your instincts! 😊',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            bufoFace: 'casual'
          };
          setChatHistory(prev => [...prev, errorMessage]);
        } finally {
          setDownloadingPhotos(false);
          setIsTyping(false);
        }
        
      } else if (responseData.toolCall && responseData.toolCall.name === 'message_assistance') {
        console.log('ai requested message assistance tool');
        
        // skip showing initial ai response, go straight to improvement
        setIsTyping(true);
        
        try {
          const assistanceResult = await window.electronAPI.aiImproveMessage(
            originalMessage,
            onboardingData,
            chatHistory
          );
          
          if (assistanceResult.success && assistanceResult.response) {
            const fullMessage = assistanceResult.response.message;
            
            const improvementMessage = {
              type: 'mascot',
              message: fullMessage,
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              bufoFace: assistanceResult.response.emotion
            };
            setChatHistory(prev => [...prev, improvementMessage]);
            
            // update bufo to match improved message
            if (bufoManager.isLoaded()) {
              const newBufoImage = bufoManager.getBufoByEmotion(assistanceResult.response.emotion);
              if (newBufoImage) setBufoImage(newBufoImage);
            }
          } else {
            throw new Error(assistanceResult.error || 'Assistance failed');
          }
          
        } catch (toolError) {
          console.error('message assistance error:', toolError);
          const errorMessage = {
            type: 'mascot',
            message: (toolError as Error)?.message?.includes('messages page') 
              ? 'i can only help with messages when you\'re on the tinder chat page! 💬'
              : 'having trouble analyzing your message right now. try again? 🤔',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            bufoFace: 'confused'
          };
          setChatHistory(prev => [...prev, errorMessage]);
        } finally {
          setIsTyping(false);
        }
        
      } else if (responseData.toolCall && responseData.toolCall.name === 'message_writing') {
        console.log('ai requested message writing tool');
        
        // show ai's acknowledgment before writing the message
        const writingMessage = {
          type: 'mascot',
          message: responseData.message,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bufoFace: responseData.emotion
        };
        setChatHistory(prev => [...prev, writingMessage]);
        
        // update bufo to match ai's emotion
        if (bufoManager.isLoaded()) {
          const bufoImage = bufoManager.getBufoByEmotion(responseData.emotion);
          if (bufoImage) setBufoImage(bufoImage);
        }
        
        setIsTyping(true);
        
        try {
          const writeResult = await window.electronAPI.aiWriteMessage(
            originalMessage,
            onboardingData,
            chatHistory
          );
          
          if (writeResult.success && writeResult.response) {
            const generatedMessage = writeResult.response.message;
            
            // simulate typing the message after a short delay
            setTimeout(async () => {
              try {
                await window.electronAPI.typeMessage(generatedMessage);
                
                // generate a completion message after typing
                const completionResult = await window.electronAPI.aiGenerateCompletion(
                  generatedMessage,
                  originalMessage,
                  onboardingData
                );
                
                if (completionResult.success && completionResult.response) {
                  const completeMessage = {
                    type: 'mascot',
                    message: completionResult.response.message,
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    bufoFace: completionResult.response.emotion
                  };
                  setChatHistory(prev => [...prev, completeMessage]);
                  
                  // update bufo to match completion emotion
                  if (bufoManager.isLoaded()) {
                    const completionBufoImage = bufoManager.getBufoByEmotion(completionResult.response.emotion);
                    if (completionBufoImage) setBufoImage(completionBufoImage);
                  }
                } else {
                  // fallback if completion fails
                  const completeMessage = {
                    type: 'mascot',
                    message: 'done!',
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    bufoFace: 'confident'
                  };
                  setChatHistory(prev => [...prev, completeMessage]);
                }
                
              } catch (typeError) {
                console.error('message typing error:', typeError);
                // show the message for manual copy if typing fails
                const errorMessage = {
                  type: 'mascot',
                  message: `couldn't type it out, but here's what i wrote: "${generatedMessage}" - copy and paste it! 📝`,
                  timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  bufoFace: 'confused'
                };
                setChatHistory(prev => [...prev, errorMessage]);
              }
            }, 1000);
            
          } else {
            throw new Error(writeResult.error || 'Message writing failed');
          }
          
        } catch (toolError) {
          console.error('message writing error:', toolError);
          const errorMessage = {
            type: 'mascot',
            message: (toolError as Error)?.message?.includes('messages page') 
              ? 'i can only write messages when you\'re on the tinder chat page!'
              : 'having trouble writing that message right now. try again?',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            bufoFace: 'confused'
          };
          setChatHistory(prev => [...prev, errorMessage]);
        } finally {
          setIsTyping(false);
        }
        
      } else {
        // handle normal ai responses with no tool call
        const mascotMessage = {
          type: 'mascot',
          message: responseData.message,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bufoFace: responseData.emotion
        };
        
        setChatHistory(prev => [...prev, mascotMessage]);
        
        // update bufo to match ai's emotion
        if (bufoManager.isLoaded()) {
          setCurrentBufo(responseData.emotion);
          const newBufoImage = bufoManager.getBufoByEmotion(responseData.emotion);
          if (newBufoImage) setBufoImage(newBufoImage);
        }
      }
      
    } catch (error) {
      console.error('ai response error:', error);
      
      const errorMessage = {
        type: 'mascot',
        message: 'oops, my brain hiccuped or smth! try asking again?',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        bufoFace: 'confused'
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
      
      if (bufoManager.isLoaded()) {
        const errorBufoImage = bufoManager.getBufoByEmotion('confused');
        if (errorBufoImage) setBufoImage(errorBufoImage);
      }
    } finally {
      setIsTyping(false);
    }
  };

  // render the main chat panel with stats and chat interface
  const renderMainPanel = () => (
    <div className="panel-content">
      {/* (useless, but cool) stats row for quick overview */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">69</span>
          <span className="stat-label">matches</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">idk</span>
          <span className="stat-label">messages</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">0</span>
          <span className="stat-label">huzz</span>
        </div>
      </div>

      {/* chat interface with mascot and messages */}
      <div className="chat-container">
        <div className="chat-header">
          <img src={bufoImage} alt="Bufo" className="mascot-avatar" />
          <div className="mascot-info">
            <span className="mascot-name">bufo</span>
            <span className="mascot-status">your dating copilot</span>
          </div>
        </div>
        
        <div className="chat-messages" ref={chatMessagesRef}>
          {chatHistory.map((msg, index) => {
            // pick the right bufo image for each message
            const messageBufoImage = msg.type === 'mascot' && msg.bufoFace 
              ? (bufoManager.isLoaded() ? bufoManager.getBufoByEmotion(msg.bufoFace) : bufoImage)
              : bufoImage;
              
            return (
              <div key={index} className={`message ${msg.type}`}>
                {msg.type === 'mascot' && (
                  <img src={messageBufoImage || bufoImage} alt="Bufo" className="message-avatar" />
                )}
                <div className="message-content">
                  <span className="message-text">{msg.message}</span>
                  {(msg as any).hasPhotoStack && (
                    <PhotoStack 
                      photos={(msg as any).photos || []} 
                      isDownloading={downloadingPhotos}
                      totalExpected={10}
                    />
                  )}
                  <span className="message-time">{msg.timestamp}</span>
                </div>
              </div>
            );
          })}
          
          {/* show typing indicator when ai is thinking */}
          {isTyping && (
            <div className="message mascot">
              <img src={bufoImage} alt="Bufo" className="message-avatar" />
              <div className="message-content">
                <span className="message-text typing-indicator">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </span>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="ask bufo..."
            className="chat-input"
          />
          <button type="submit" className="chat-send">
            <span>→</span>
          </button>
        </form>
      </div>
    </div>
  );

  // pick a random bufo image for mascot
  const handleRandomBufo = () => {
    if (bufoManager.isLoaded()) {
      const randomBufo = bufoManager.getRandomBufo();
      if (randomBufo) {
        setBufoImage(randomBufo);
        setCurrentBufo('random');
      }
    }
  };

  // render the debug panel with controls and test buttons
  const renderDebugPanel = () => (
    <div className="panel-content">
      <h2>debugger</h2>
      
      {/* api key input and connection status */}
      <div className="form-group">
        <label htmlFor="api-key-input">
          sambanova api key {isAIConnected && <span style={{color: '#48dbfb'}}>✓</span>}:
        </label>
        <div className="input-group">
          <input
            id="api-key-input"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="your sambanova api key"
            style={{fontSize: '0.8rem'}}
          />
          <button onClick={() => handleApiKeyUpdate(apiKey)}>
            {isAIConnected ? 'update' : 'connect'}
          </button>
        </div>
        <small style={{color: '#666', fontSize: '0.75rem'}}>
          {isAIConnected ? '🟢 ai connected and ready' : '🔴 enter api key for smart responses'}
        </small>
      </div>
      
      {/* bufo mascot controls */}
      <div className="form-group">
        <label>bufo controls:</label>
        <div className="button-group">
          <button onClick={handleRandomBufo}>random bufo</button>
          <button onClick={() => {
            const emotions = ['happy', 'thinking', 'surprised', 'flirty', 'confident'];
            const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
            const emotionBufo = bufoManager.getBufoByEmotion(randomEmotion);
            if (emotionBufo) setBufoImage(emotionBufo);
          }}>random emotion</button>
        </div>
        <small style={{color: '#666', fontSize: '0.75rem'}}>
          loaded {bufoManager.isLoaded() ? bufoManager.getAllBufoNames().length : 0} bufos
        </small>
      </div>

      {/* url navigation controls */}
      <form onSubmit={(e) => { e.preventDefault(); handleNavigate(); }} className="form-group">
        <label htmlFor="url-input">url:</label>
        <div className="input-group">
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tinder.com/app/recs"
          />
          <button type="submit">go</button>
        </div>
      </form>
      <div className="button-group">
        <button onClick={handleLogUrl}>get image url</button>
        <button onClick={handleClickNext}>next photo</button>
        <button onClick={handleDownloadAll}>download all</button>
      </div>
      
      {/* textarea and emergency system debug controls */}
      <div className="form-group">
        <label>message textarea debug:</label>
        <div className="button-group">
          <button onClick={() => {
            console.log('debugging textarea content...');
            window.electronAPI.debugTextarea();
          }}>debug textarea</button>
          <button onClick={async () => {
            console.log('testing emergency system...');
            const testMessage = "heyo u look so ugly i feel like youd scare off a group of children";
            const result = await window.electronAPI.aiEmergencyCheck(testMessage, onboardingData, chatHistory);
            console.log('emergency test result:', result);
          }}>test emergency</button>
          <button onClick={() => {
            console.log('checking monitoring status...');
            window.electronAPI.checkMonitoring();
          }}>check monitoring</button>
        </div>
        <small style={{color: '#666', fontSize: '0.75rem'}}>
          check console for textarea content and emergency test results
        </small>
      </div>
      
      {/* test profile photo download and stack display */}
      <div className="form-group">
        <label>profile analysis test:</label>
        <div className="button-group">
          <button onClick={async () => {
            console.log('testing profile download...');
            setDownloadingPhotos(true);
            
            const downloadMessage = {
              type: 'mascot',
              message: 'testing photo download...',
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              bufoFace: 'thinking',
              hasPhotoStack: true,
              photos: []
            };
            setChatHistory(prev => [...prev, downloadMessage]);
            
            try {
              const result = await window.electronAPI.downloadProfileImages();
              console.log('download result:', result);
              
              if (result.success && result.images) {
                setChatHistory(prev => {
                  const updated = [...prev];
                  // update the most recent photo stack message with the downloaded images
                  for (let i = updated.length - 1; i >= 0; i--) {
                    if ((updated[i] as any).hasPhotoStack) {
                      (updated[i] as any).photos = result.images;
                      break;
                    }
                  }
                  return updated;
                });
                
                const successMessage = {
                  type: 'mascot',
                  message: `downloaded ${result.count} photos n stuff`,
                  timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  bufoFace: 'excited'
                };
                setChatHistory(prev => [...prev, successMessage]);
              }
            } catch (error) {
              console.error('download test error:', error);
            } finally {
              setDownloadingPhotos(false);
            }
          }}>test download</button>
        </div>
        <small style={{color: '#666', fontSize: '0.75rem'}}>
          test profile photo downloading and stack display
        </small>
      </div>
    </div>
  );

  // main app layout with left content and right tabbed panel
  return (
    <div className="app-layout">
      {/* left: main content area with placeholder */}
      <div className="main-content">
        <div className="placeholder-content">
          <h1>rizzly</h1>
          <p>your dating copilot is ready to help you succeed</p>
          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>connected to tinder</span>
          </div>
        </div>
      </div>
      
      {/* right: side panel with copilot and debug tabs */}
      <div className="right-panel">
        <div className="tab-header">
          <button 
            className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
          >
            copilot
          </button>
          <button 
            className={`tab-button ${activeTab === 'debug' ? 'active' : ''}`}
            onClick={() => setActiveTab('debug')}
          >
            debug
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'main' ? renderMainPanel() : renderDebugPanel()}
        </div>
      </div>
    </div>
  );
}

export default MainApp; 