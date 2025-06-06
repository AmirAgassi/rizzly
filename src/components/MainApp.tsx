import React, { useState } from 'react';
import './MainApp.css';

function MainApp() {
  const [url, setUrl] = useState('https://www.google.com'); // test site for now
  const [selector, setSelector] = useState('textarea[name="q"], input[name="q"]');

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) {
      window.electronAPI.navigateTo(url);
    }
  };

  const handleHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (selector) {
      window.electronAPI.findAndHighlight(selector);
    }
  };

  return (
    <div className="container">
      <h1>Rizzly Integrated Browser</h1>
      <form onSubmit={handleNavigate} className="form-group">
        <label htmlFor="url-input">URL:</label>
        <div className="input-group">
          <input
            id="url-input"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <button type="submit">Go</button>
        </div>
      </form>
      <form onSubmit={handleHighlight} className="form-group">
        <label htmlFor="selector-input">CSS Selector:</label>
        <div className="input-group">
          <input
            id="selector-input"
            type="text"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            placeholder="e.g., #my-element"
          />
          <button type="submit">Find & Highlight</button>
        </div>
      </form>
    </div>
  );
}

export default MainApp; 