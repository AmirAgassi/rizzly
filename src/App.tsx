import React, { useState } from 'react';
import MainApp from './renderer/components/MainApp';
import { OnboardingFlow } from './renderer/features/onboarding';

function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const handleOnboardingComplete = () => {
    window.electronAPI.onboardingComplete();
    setOnboardingComplete(true);
  };

  if (onboardingComplete) {
    return <MainApp />;
  } else {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }
}

export default App; 