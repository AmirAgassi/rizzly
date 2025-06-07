import React, { useState } from 'react';
import MainApp from './components/MainApp';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';

function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  const handleOnboardingComplete = () => {
    window.electronAPI.onboardingComplete();
    setOnboardingComplete(true);
  };

  if (onboardingComplete) {
    return <MainApp key="main-app" />;
  } else {
    return <OnboardingFlow key="onboarding" onComplete={handleOnboardingComplete} />;
  }
}

export default App; 