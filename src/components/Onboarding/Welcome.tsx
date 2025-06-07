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
      <h2>Welcome to Rizzly.</h2>
      <p className="subtitle">
        Your AI-powered dating assistant that helps you connect with matches using your unique personality and style.
      </p>

      <div className="text-input-group">
        <div className="onboarding-options">
          <label>
            <input 
              type="radio" 
              name="welcome" 
              value="start" 
              defaultChecked={true}
            />
            <span className="option-icon">🚀</span>
            Ready to get started!
          </label>
        </div>
      </div>

    </div>
  );
}

export default Welcome; 