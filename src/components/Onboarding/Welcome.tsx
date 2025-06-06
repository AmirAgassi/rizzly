import React from 'react';

interface WelcomeProps {
  data: any;
  updateData: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
}

function Welcome({ data, updateData, onNext, onBack }: WelcomeProps) {
  return (
    <div className="onboarding-content">
      <div className="welcome-content">
        <span className="welcome-emoji">🥶</span>
        <h1>Welcome to Rizzly!</h1>
        <p className="subtitle">
          Your AI-powered dating assistant that helps you connect with matches using your unique personality and style.
        </p>
        <p className="description">
          We'll ask you a few quick questions to personalize your AI companion. This takes about 2 minutes.
        </p>
      </div>

      <div className="navigation-buttons">
        <button 
          onClick={onNext} 
          className="next-button primary"
        >
          Let's Get Started
        </button>
      </div>
    </div>
  );
}

export default Welcome; 