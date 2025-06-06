import React from 'react';

interface FinalSetupProps {
  data: any;
  updateData: (updates: any) => void;
  onFinish: () => void;
  onBack: () => void;
}

function FinalSetup({ data, updateData, onFinish, onBack }: FinalSetupProps) {
  return (
    <div className="onboarding-content">
      <div className="welcome-content">
        <span className="welcome-emoji">🎉</span>
        <h2>You're all set{data.name ? `, ${data.name}` : ''}!</h2>
        <p className="subtitle">
          Your AI dating assistant is ready to help you make meaningful connections.
        </p>
      </div>

      <div className="text-input-group">
        <div className="summary-container">
          <h3>Your AI Profile Summary:</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <strong>Goal:</strong> {data.primaryGoal?.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </div>
            <div className="summary-item">
              <strong>Experience:</strong> {data.experience?.charAt(0).toUpperCase() + data.experience?.slice(1)}
            </div>
            <div className="summary-item">
              <strong>Communication:</strong> {data.communicationStyle?.join(', ') || 'None selected'}
            </div>
            <div className="summary-item">
              <strong>Topics:</strong> {data.conversationTopics?.join(', ') || 'None selected'}
            </div>
            <div className="summary-item">
              <strong>Opener Style:</strong> {data.openerStyle?.charAt(0).toUpperCase() + data.openerStyle?.slice(1)}
            </div>
            <div className="summary-item">
              <strong>Response Pace:</strong> {data.responseSpeed?.charAt(0).toUpperCase() + data.responseSpeed?.slice(1)}
            </div>
          </div>
        </div>
      </div>

      <div className="navigation-buttons">
        <button onClick={onBack} className="back-button">Back</button>
        <button 
          onClick={onFinish} 
          className="next-button primary"
        >
          Launch Rizzly
        </button>
      </div>
    </div>
  );
}

export default FinalSetup; 