import React, { useState, useEffect } from 'react';
import '../styles/MainApp.css';
import { bufoManager } from '../../shared/services/BufoManager';
import { ChatContainer } from '../features/chat';
import { useChatStore, useBufoStore, useOnboardingStore } from '../stores';
import { useAIConnection } from '../hooks/use-ai-connection';
import { useDownloadProgress } from '../hooks/use-download-progress';
import { ErrorBoundary } from './error-handling';

// debug panel component (will be extracted further later)
const DebugPanel = () => {
  const [url, setUrl] = useState('https://tinder.com/app/recs');
  const [nextButtonSelector] = useState('button[aria-label="Next Photo"]');
  const [localApiKey, setLocalApiKey] = useState('');
  const { isConnected, apiKey, updateApiKey } = useAIConnection();
  const { data: onboardingData } = useOnboardingStore();
  const { setBufoImage } = useBufoStore();
  const { addMessage, setDownloadingPhotos } = useChatStore();

  // sync local api key with store on mount
  useEffect(() => {
    setLocalApiKey(apiKey);
  }, [apiKey]);

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

  const handleRandomBufo = () => {
    if (bufoManager.isLoaded()) {
      const randomBufo = bufoManager.getRandomBufo();
      if (randomBufo) {
        setBufoImage(randomBufo);
      }
    }
  };

  return (
    <div className="panel-content">
      <h2>debugger</h2>
      
      {/* api key input and connection status */}
      <div className="form-group">
        <label htmlFor="api-key-input">
          sambanova api key {isConnected && <span style={{color: '#48dbfb'}}>✓</span>}:
        </label>
        <div className="input-group">
          <input
            id="api-key-input"
            type="password"
            value={localApiKey}
            onChange={(e) => setLocalApiKey(e.target.value)}
            placeholder="your sambanova api key"
            style={{fontSize: '0.8rem'}}
          />
          <button onClick={() => updateApiKey(localApiKey)}>
            {isConnected ? 'update' : 'connect'}
          </button>
        </div>
        <small style={{color: '#666', fontSize: '0.75rem'}}>
          {isConnected ? '🟢 ai connected and ready' : '🔴 enter api key for smart responses'}
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
      
      {/* test profile photo download and stack display */}
      <div className="form-group">
        <label>profile analysis test:</label>
        <div className="button-group">
          <button onClick={async () => {
            console.log('testing profile download...');
            setDownloadingPhotos(true);
            
            const downloadMessage = {
              type: 'mascot' as const,
              message: 'testing photo download...',
              timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
              bufoFace: 'thinking',
              hasPhotoStack: true,
              photos: []
            };
            addMessage(downloadMessage);
            
            try {
              const result = await window.electronAPI.downloadProfileImages();
              console.log('download result:', result);
              
              if (result.success && result.images) {
                const successMessage = {
                  type: 'mascot' as const,
                  message: `downloaded ${result.count} photos n stuff`,
                  timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                  bufoFace: 'excited'
                };
                addMessage(successMessage);
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
};

// stats component
const StatsRow = () => (
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
);

// main panel component
const MainPanel = () => (
  <div className="panel-content">
    <StatsRow />
    <ErrorBoundary>
      <ChatContainer />
    </ErrorBoundary>
  </div>
);

function MainApp() {
  const [activeTab, setActiveTab] = useState('main');
  const { setBufoImage, setLoaded } = useBufoStore();
  const { addMessage, clearHistory } = useChatStore();
  
  // initialize ai connection on startup
  useAIConnection();
  
  // handle download progress updates
  useDownloadProgress();

  // initialization effects
  useEffect(() => {
    clearHistory(); // clear old chat
    
    const initBufos = async () => {
      await bufoManager.loadAllBufos();
      if (bufoManager.isLoaded()) {
        setLoaded(true);
        const teaBufo = bufoManager.getBufo('bufo-tea');
        if (teaBufo) setBufoImage(teaBufo);
      }
    };
    initBufos();
    
    // note: initial "heyo" message is already handled by chat store initialization
  }, [setBufoImage, setLoaded]);

  // emergency alerts listener
  useEffect(() => {
    const removeEmergencyListener = window.electronAPI.onEmergencyAlert((response) => {
      console.log('🚨 emergency alert received in ui:', response);
      
      const emergencyMessage = {
        type: 'mascot' as const,
        message: response.message,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        bufoFace: response.emotion
      };
      
      addMessage(emergencyMessage);
      
      // update bufo to match emergency emotion
      if (bufoManager.isLoaded()) {
        const concernedBufo = bufoManager.getBufoByEmotion(response.emotion);
        if (concernedBufo) setBufoImage(concernedBufo);
      }
    });

    return () => {
      removeEmergencyListener();
    };
  }, [addMessage, setBufoImage]);

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
          {activeTab === 'main' ? <MainPanel /> : <DebugPanel />}
        </div>
      </div>
    </div>
  );
}

export default MainApp; 