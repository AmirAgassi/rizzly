import React, { useState } from 'react';
import Page1 from './Page1';
import Page2 from './Page2';
import Page3 from './Page3';
import Page4 from './Page4';
import './Onboarding.css';

interface OnboardingFlowProps {
  onComplete: () => void;
}

function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const handleNext = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleFinish = () => {
    onComplete();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Page1 onNext={handleNext} />;
      case 2:
        return <Page2 onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <Page3 onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <Page4 onFinish={handleFinish} onBack={handleBack} />;
      default:
        return <Page1 onNext={handleNext} />;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
        </div>
        {renderStep()}
      </div>
    </div>
  );
}

export default OnboardingFlow; 