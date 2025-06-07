import React, { useState } from 'react';
import './MainApp.css';
// Import the mascot
import bufoTea from '../bufopack/bufo-tea.png';

function MainApp() {
  const [activeTab, setActiveTab] = useState('main');
  const [url, setUrl] = useState('https://tinder.com/app/recs');
  const [nextButtonSelector] = useState('button[aria-label="Next Photo"]');
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    {
      type: 'mascot',
      message: 'hey there! i\'m your dating copilot. ready to level up your game? ☕',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }
  ]);
  
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMessage = {
      type: 'user',
      message: chatMessage,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');

    // simulate mascot response
    setTimeout(() => {
      const responses = [
        'let me analyze that profile for you... 🔍',
        'great question! here\'s what i\'d suggest... ✨',
        'based on your preferences, try this approach... 💡',
        'i see what you\'re going for! let me help... 🎯',
        'interesting... let me craft the perfect response... ✍️'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const mascotMessage = {
        type: 'mascot',
        message: randomResponse,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      
      setChatHistory(prev => [...prev, mascotMessage]);
    }, 1000);
  };

  const renderMainPanel = () => (
    <div className="panel-content">
      {/* stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">247</span>
          <span className="stat-label">matches</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">89</span>
          <span className="stat-label">messages</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">67%</span>
          <span className="stat-label">response</span>
        </div>
      </div>

      {/* chat interface */}
      <div className="chat-container">
        <div className="chat-header">
          <img src={bufoTea} alt="Bufo" className="mascot-avatar" />
          <div className="mascot-info">
            <span className="mascot-name">bufo</span>
            <span className="mascot-status">your dating copilot</span>
          </div>
        </div>
        
        <div className="chat-messages">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.type}`}>
              {msg.type === 'mascot' && (
                <img src={bufoTea} alt="Bufo" className="message-avatar" />
              )}
              <div className="message-content">
                <span className="message-text">{msg.message}</span>
                <span className="message-time">{msg.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input-form">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder="ask bufo for dating advice..."
            className="chat-input"
          />
          <button type="submit" className="chat-send">
            <span>→</span>
          </button>
        </form>
      </div>
    </div>
  );

  const renderDebugPanel = () => (
    <div className="panel-content">
      <h2>debugger</h2>
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