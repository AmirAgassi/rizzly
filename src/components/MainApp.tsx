import React, { useState } from 'react';
import './MainApp.css';

function MainApp() {
  const [url, setUrl] = useState('https://tinder.com/app/recs');
  const [nextButtonSelector] = useState('button[aria-label="Next Photo"]');
  
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

  return (
    <div className="container">
      <h1>Rizzly Debugger</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleNavigate(); }} className="form-group">
        <label htmlFor="url-input">URL:</label>
        <div className="input-group">
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tinder.com/app/recs"
          />
          <button type="submit">Go</button>
        </div>
      </form>
      <div className="button-group">
        <button onClick={handleLogUrl}>Get Current Image URL</button>
        <button onClick={handleClickNext}>Next Photo</button>
        <button onClick={handleDownloadAll}>Download All Images</button>
      </div>
    </div>
  );
}

export default MainApp; 