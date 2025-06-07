import React, { useState, useEffect, useRef } from 'react';
import './MainApp.css';
import { bufoManager } from './BufoManager';
import PhotoStack from './PhotoStack';
// fallback mascot
import bufoTea from '../bufopack/bufo-tea.png';

function MainApp() {

  const [activeTab, setActiveTab] = useState('main');
  const [url, setUrl] = useState('https://tinder.com/app/recs');
  const [nextButtonSelector] = useState('button[aria-label="Next Photo"]');
  const [chatMessage, setChatMessage] = useState('');
  const [currentBufo, setCurrentBufo] = useState('bufo-tea');
  const [bufoImage, setBufoImage] = useState(bufoTea); // fallback while loading
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
      message: 'hey there! i\'m your dating copilot. ready to level up your game? ☕',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      bufoFace: 'bufo-tea'
    }
  ]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // initialize bufo manager and ai on component mount
  useEffect(() => {
    // clear any old chat history on startup for fresh session
    localStorage.removeItem('rizzly-chat-history');
    
    const initBufos = async () => {
      await bufoManager.loadAllBufos();
      if (bufoManager.isLoaded()) {
        const teaBufo = bufoManager.getBufo('bufo-tea');
        if (teaBufo) setBufoImage(teaBufo);
      }
    };
    initBufos();
    
    // initialize ai if api key exists
    if (apiKey) {
      const checkAI = async () => {
        const result = await window.electronAPI.aiInitialize(apiKey);
        setIsAIConnected(result.success);
      };
      checkAI();
    }

    // set up download progress listener
    const removeProgressListener = window.electronAPI.onDownloadProgress((data) => {
      console.log('Renderer: Download progress:', { 
        imageCount: data.imageCount, 
        hasImage: !!data.imageBase64,
        isComplete: data.isComplete 
      });
      
      if (data.isComplete) {
        console.log('Renderer: Download complete');
        setDownloadingPhotos(false);
      } else if (data.imageBase64) {
        console.log('Renderer: Adding new image to latest stack');
        // update the latest message with hasPhotoStack
        setChatHistory(prev => {
          const updated = [...prev];
          // find the most recent message with hasPhotoStack
          for (let i = updated.length - 1; i >= 0; i--) {
            if ((updated[i] as any).hasPhotoStack) {
              const currentPhotos = (updated[i] as any).photos || [];
              if (!currentPhotos.includes(data.imageBase64)) {
                (updated[i] as any).photos = [...currentPhotos, data.imageBase64];
                console.log(`Renderer: Stack now has ${(updated[i] as any).photos.length} images`);
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

  // save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('rizzly-chat-history', JSON.stringify(chatHistory));
  }, [chatHistory]);

  // listen for emergency alerts
  useEffect(() => {
    const removeEmergencyListener = window.electronAPI.onEmergencyAlert((response) => {
      console.log('🚨 Emergency alert received in UI:', response);
      
      // add urgent warning message to chat
      const emergencyMessage = {
        type: 'mascot',
        message: response.message, // just use the LLM's natural reaction
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        bufoFace: response.emotion
      };
      
      setChatHistory(prev => [...prev, emergencyMessage]);
      
      // update bufo to concerned face
      if (bufoManager.isLoaded()) {
        const concernedBufo = bufoManager.getBufoByEmotion(response.emotion);
        if (concernedBufo) setBufoImage(concernedBufo);
      }
    });

    return () => {
      removeEmergencyListener();
    };
  }, []);

  // handle api key changes
  const handleApiKeyUpdate = async (newKey: string) => {
    console.log('Updating API key, length:', newKey.length);
    setApiKey(newKey);
    localStorage.setItem('sambanova-api-key', newKey);
    
    if (newKey) {
      const result = await window.electronAPI.aiInitialize(newKey);
      console.log('AI initialization result:', result.success);
      setIsAIConnected(result.success);
      
      if (result.success) {
        const successMessage = {
          type: 'mascot',
          message: 'awesome! ai is connected and ready to help with your dating game! 🚀',
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

  // auto-scroll to bottom when new messages are added
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatMessagesRef.current) {
        const container = chatMessagesRef.current;
        // force scroll to absolute bottom
        container.scrollTop = container.scrollHeight + 1000;
      }
    };

    // immediate scroll
    scrollToBottom();
    
    // multiple delayed scrolls to catch any late-rendering content
    const timeoutId1 = setTimeout(scrollToBottom, 50);
    const timeoutId2 = setTimeout(scrollToBottom, 200);
    const timeoutId3 = setTimeout(scrollToBottom, 500);
    
    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [chatHistory]);
  
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMessage = {
      type: 'user',
      message: chatMessage,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      bufoFace: currentBufo // user messages can also have a bufo face for consistency
    };

    setChatHistory(prev => [...prev, userMessage]);
    const originalMessage = chatMessage;
    setChatMessage('');

    // get real ai response
    setIsTyping(true);
    
    try {
      console.log('Chat response - Connected:', isAIConnected);
      
      // get ai response through ipc
      const result = await window.electronAPI.aiChat(originalMessage, chatHistory, onboardingData);
      
      let responseData;
      if (result.success && result.response) {
        responseData = result.response;
      } else if (result.fallback) {
        responseData = result.fallback;
      } else {
        // default fallback
        responseData = {
          message: 'connect your ai api key in the debug panel to unlock smart responses! 🔑',
          emotion: 'casual',
          confidence: 0.3
        };
      }
      
      // check if AI wants to use tools
      if (responseData.toolCall && responseData.toolCall.name === 'analyze_profile') {
        console.log('AI requested profile analysis tool');
        
        // show ai response first
        const initialResponse = {
          type: 'mascot',
          message: responseData.message,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bufoFace: responseData.emotion
        };
        setChatHistory(prev => [...prev, initialResponse]);
        
        // start downloading photos
        setDownloadingPhotos(true);
        setCurrentPhotos([]);
        
        // add photo downloading message with its own photo array
        const downloadMessageId = Date.now(); // unique ID for this download
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
            console.log('Downloaded', downloadResult.images.length, 'images for analysis');
            
            // analyze profile with AI
            setIsTyping(true);
            const analysisResult = await window.electronAPI.aiAnalyzeProfile(
              downloadResult.images,
              originalMessage,
              onboardingData,
              chatHistory
            );
            
            if (analysisResult.success && analysisResult.response) {
              // create analysis message with the complete response
              const analysisMessage = {
                type: 'mascot',
                message: analysisResult.response.message,
                timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                bufoFace: analysisResult.response.emotion
              };
              setChatHistory(prev => [...prev, analysisMessage]);
              
              // update bufo based on analysis emotion
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
          console.error('Tool execution error:', toolError);
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
        console.log('AI requested message assistance tool');
        
        // start message improvement immediately, don't show initial response
        setIsTyping(true);
        
        try {
          const assistanceResult = await window.electronAPI.aiImproveMessage(
            originalMessage,
            onboardingData,
            chatHistory
          );
          
          if (assistanceResult.success && assistanceResult.response) {
            // just show the feedback, no need to repeat their draft
            const fullMessage = assistanceResult.response.message;
            
            const improvementMessage = {
              type: 'mascot',
              message: fullMessage,
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              bufoFace: assistanceResult.response.emotion
            };
            setChatHistory(prev => [...prev, improvementMessage]);
            
            // update bufo based on assistance emotion
            if (bufoManager.isLoaded()) {
              const newBufoImage = bufoManager.getBufoByEmotion(assistanceResult.response.emotion);
              if (newBufoImage) setBufoImage(newBufoImage);
            }
          } else {
            throw new Error(assistanceResult.error || 'Assistance failed');
          }
          
        } catch (toolError) {
          console.error('Message assistance error:', toolError);
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
        console.log('AI requested message writing tool');
        
        // show bufo's natural response first (let AI generate the acknowledgment)
        const writingMessage = {
          type: 'mascot',
          message: responseData.message, // use the AI's actual response
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bufoFace: responseData.emotion
        };
        setChatHistory(prev => [...prev, writingMessage]);
        
        // update bufo based on AI emotion
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
            
            // small delay then start typing (no preview message)
            setTimeout(async () => {
              try {
                await window.electronAPI.typeMessage(generatedMessage);
                
                // generate dynamic completion message
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
                  
                  // update bufo based on completion emotion
                  if (bufoManager.isLoaded()) {
                    const completionBufoImage = bufoManager.getBufoByEmotion(completionResult.response.emotion);
                    if (completionBufoImage) setBufoImage(completionBufoImage);
                  }
                } else {
                  // fallback if completion generation fails
                  const completeMessage = {
                    type: 'mascot',
                    message: 'done! 🔥',
                    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    bufoFace: 'confident'
                  };
                  setChatHistory(prev => [...prev, completeMessage]);
                }
                
              } catch (typeError) {
                console.error('Message typing error:', typeError);
                // show the message they can copy if typing failed
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
          console.error('Message writing error:', toolError);
          const errorMessage = {
            type: 'mascot',
            message: (toolError as Error)?.message?.includes('messages page') 
              ? 'i can only write messages when you\'re on the tinder chat page! 💬'
              : 'having trouble writing that message right now. try again? 🤔',
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            bufoFace: 'confused'
          };
          setChatHistory(prev => [...prev, errorMessage]);
        } finally {
          setIsTyping(false);
        }
        
      } else {
        // normal response without tool calls
        const mascotMessage = {
          type: 'mascot',
          message: responseData.message,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          bufoFace: responseData.emotion
        };
        
        setChatHistory(prev => [...prev, mascotMessage]);
        
        // update current bufo based on ai emotion
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
        message: 'oops, my brain hiccuped! 🤖 try asking again?',
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

  const renderMainPanel = () => (
    <div className="panel-content">
      {/* stats row */}
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

      {/* chat interface */}
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
            // get the appropriate bufo image for this message
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
          
          {/* typing indicator */}
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

  const handleRandomBufo = () => {
    if (bufoManager.isLoaded()) {
      const randomBufo = bufoManager.getRandomBufo();
      if (randomBufo) {
        setBufoImage(randomBufo);
        setCurrentBufo('random');
      }
    }
  };

  const renderDebugPanel = () => (
    <div className="panel-content">
      <h2>debugger</h2>
      
      {/* ai api key */}
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
      
      {/* bufo controls */}
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
      
      {/* textarea debug */}
      <div className="form-group">
        <label>message textarea debug:</label>
        <div className="button-group">
          <button onClick={() => {
            console.log('Debugging textarea content...');
            window.electronAPI.debugTextarea();
          }}>debug textarea</button>
          <button onClick={async () => {
            console.log('Testing emergency system...');
            const testMessage = "heyo u look so ugly i feel like youd scare off a group of children";
            const result = await window.electronAPI.aiEmergencyCheck(testMessage, onboardingData, chatHistory);
            console.log('Emergency test result:', result);
          }}>test emergency</button>
          <button onClick={() => {
            console.log('Checking monitoring status...');
            window.electronAPI.checkMonitoring();
          }}>check monitoring</button>
        </div>
        <small style={{color: '#666', fontSize: '0.75rem'}}>
          check console for textarea content and emergency test results
        </small>
      </div>
      
      {/* profile analysis test */}
      <div className="form-group">
        <label>profile analysis test:</label>
        <div className="button-group">
          <button onClick={async () => {
            console.log('Testing profile download...');
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
              console.log('Download result:', result);
              
              if (result.success && result.images) {
                // update the message with final photos
                setChatHistory(prev => {
                  const updated = [...prev];
                  // find the latest message with hasPhotoStack and update it
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
                  message: `downloaded ${result.count} photos successfully! 📸`,
                  timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  bufoFace: 'excited'
                };
                setChatHistory(prev => [...prev, successMessage]);
              }
            } catch (error) {
              console.error('Download test error:', error);
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

  return (
    <div className="app-layout">
      {/* main content area */}
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
      
      {/* right panel with tabs */}
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