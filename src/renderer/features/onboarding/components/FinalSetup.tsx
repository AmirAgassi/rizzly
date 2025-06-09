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
          Your AI dating copilot is ready to help you make meaningful connections. Let's start building your dating success!
        </p>
      </div>
    </div>
  );
}

export default FinalSetup; 