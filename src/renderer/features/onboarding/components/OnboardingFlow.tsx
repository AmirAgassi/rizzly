import React, { useState, useEffect } from 'react';
import Welcome from './Welcome';
import FinalSetup from './FinalSetup';
import { GoalQuestion } from './GoalQuestion';
import { AssistanceLevelQuestion } from './AssistanceLevelQuestion';
import './Onboarding.css';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export interface OnboardingData {
  // step 0: welcome
  // step 1: primary goal
  primaryGoal: string;
  // step 2: assistance level
  assistanceLevel: string;
  // step 3: communication style
  communicationStyle: string[];
  // step 4: conversation topics
  conversationTopics: string[];
  // step 5: opener style
  openerStyle: string;
  // step 6: name
  name: string;
}

// individual question components




const CommunicationStyleQuestion = ({ data, updateData, onNext, onBack }: any) => {
  const handleStyleChange = (style: string) => {
    const currentStyles = data.communicationStyle || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter((s: string) => s !== style)
      : [...currentStyles, style];
    updateData({ communicationStyle: newStyles });
  };

  return (
    <div className="onboarding-content">
      <h2>How should your AI communicate?</h2>
      <p className="subtitle">
        Select all communication styles that match your personality. You can choose multiple options.
      </p>

      <div className="text-input-group">
        <div className="onboarding-options three-column">
          {[
            { value: 'witty', icon: '😄', label: 'Witty & humorous' },
            { value: 'flirty', icon: '😉', label: 'Flirty & playful' },
            { value: 'casual', icon: '😊', label: 'Casual & laid-back' },
            { value: 'intellectual', icon: '🤓', label: 'Intellectual & deep' },
            { value: 'direct', icon: '🎯', label: 'Direct & straightforward' },
            { value: 'sweet', icon: '🥰', label: 'Sweet & romantic' }
          ].map(style => (
            <div key={style.value} className="multi-select-option">
              <label>
                <input 
                  type="checkbox" 
                  value={style.value}
                  checked={data.communicationStyle?.includes(style.value) || false}
                  onChange={() => handleStyleChange(style.value)}
                />
                <span className="option-icon">{style.icon}</span>
                {style.label}
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

const TopicsQuestion = ({ data, updateData, onNext, onBack }: any) => {
  const handleTopicChange = (topic: string) => {
    const currentTopics = data.conversationTopics || [];
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter((t: string) => t !== topic)
      : [...currentTopics, topic];
    updateData({ conversationTopics: newTopics });
  };

  return (
    <div className="onboarding-content">
      <h2>What topics should your AI focus on?</h2>
      <p className="subtitle">
        Select your favorite conversation topics. Your AI will use these to create engaging conversations.
      </p>

      <div className="text-input-group">
        <div className="onboarding-options three-column">
          {[
            { value: 'travel', icon: '✈️', label: 'Travel & adventures' },
            { value: 'music', icon: '🎵', label: 'Music & concerts' },
            { value: 'movies', icon: '🎬', label: 'Movies & TV shows' },
            { value: 'food', icon: '🍕', label: 'Food & restaurants' },
            { value: 'fitness', icon: '💪', label: 'Fitness & sports' },
            { value: 'books', icon: '📚', label: 'Books & reading' }
          ].map(topic => (
            <div key={topic.value} className="multi-select-option">
              <label>
                <input 
                  type="checkbox" 
                  value={topic.value}
                  checked={data.conversationTopics?.includes(topic.value) || false}
                  onChange={() => handleTopicChange(topic.value)}
                />
                <span className="option-icon">{topic.icon}</span>
                {topic.label}
              </label>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

const OpenerStyleQuestion = ({ data, updateData, onNext, onBack }: any) => (
  <div className="onboarding-content">
    <h2>What opener style should your AI use?</h2>
    <p className="subtitle">
      Choose how your AI should start conversations with new matches.
    </p>

    <div className="text-input-group">
      <div className="onboarding-options">
        <label>
          <input 
            type="radio" 
            name="openerStyle" 
            value="funny" 
            checked={data.openerStyle === 'funny'} 
            onChange={(e) => updateData({ openerStyle: e.target.value })} 
          />
          <span className="option-icon">😂</span>
          Funny & humorous
        </label>
        <label>
          <input 
            type="radio" 
            name="openerStyle" 
            value="thoughtful" 
            checked={data.openerStyle === 'thoughtful'} 
            onChange={(e) => updateData({ openerStyle: e.target.value })} 
          />
          <span className="option-icon">💭</span>
          Thoughtful & engaging
        </label>
        <label>
          <input 
            type="radio" 
            name="openerStyle" 
            value="flirty" 
            checked={data.openerStyle === 'flirty'} 
            onChange={(e) => updateData({ openerStyle: e.target.value })} 
          />
          <span className="option-icon">😘</span>
          Flirty & confident
        </label>
        <label>
          <input 
            type="radio" 
            name="openerStyle" 
            value="direct" 
            checked={data.openerStyle === 'direct'} 
            onChange={(e) => updateData({ openerStyle: e.target.value })} 
          />
          <span className="option-icon">🎯</span>
          Direct & straightforward
        </label>
      </div>
    </div>

  </div>
);



const NameQuestion = ({ data, updateData, onNext, onBack }: any) => (
  <div className="onboarding-content">
    <div className="welcome-content">
      <span className="welcome-emoji">👋</span>
      <h2>What should we call you?</h2>
      <p className="subtitle">
        Just your first name is perfect. We'll use this to personalize your experience.
      </p>
    </div>

    <div className="text-input-group">
      <input
        type="text"
        value={data.name}
        onChange={(e) => updateData({ name: e.target.value })}
        placeholder="Enter your first name"
      />
    </div>

  </div>
);

function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(0); // start at 0 to skip buggy first render
  const totalSteps = 8;
  
  const [data, setData] = useState<OnboardingData>({
    primaryGoal: '',
    assistanceLevel: '',
    communicationStyle: [],
    conversationTopics: [],
    openerStyle: '',
    name: '',
  });

  const next = () => setStep(s => Math.min(s + 1, totalSteps));
  const back = () => setStep(s => Math.max(s - 1, 1));
  
  // check for existing preferences and skip onboarding if they exist
  React.useEffect(() => {
    const existingPreferences = localStorage.getItem('rizzly-preferences');
    if (existingPreferences) {
      try {
        const savedData = JSON.parse(existingPreferences);
        // check if the saved data has all required fields
        if (savedData.primaryGoal && savedData.assistanceLevel && savedData.name) {
          console.log('Found existing preferences, skipping onboarding');
          onComplete();
          return;
        }
      } catch (error) {
        console.log('Error parsing saved preferences, starting fresh onboarding');
        localStorage.removeItem('rizzly-preferences');
      }
    }
    
    // auto-advance from dummy step 0 if no existing preferences
    if (step === 0) {
      const timer = setTimeout(() => setStep(1), 100);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleComplete = () => {
    localStorage.setItem('rizzly-preferences', JSON.stringify(data));
    onComplete();
  };

  // determine if next button should be disabled based on current step
  const isNextDisabled = () => {
    switch (step) {
      case 1: return false; // welcome step never disabled
      case 2: return !data.primaryGoal;
      case 3: return !data.assistanceLevel;
      case 4: return !data.communicationStyle?.length;
      case 5: return !data.conversationTopics?.length;
      case 6: return !data.openerStyle;
      case 7: return !data.name.trim();
      case 8: return false; // final step
      default: return false;
    }
  };

  const renderStep = () => {
    const commonProps = {
      data,
      updateData,
      onNext: next,
      onBack: back,
    };

    console.log('Rendering step:', step); // debug log

    switch (step) {
      case 1:
        return <Welcome key="welcome" data={data} updateData={updateData} onNext={next} onBack={back} />;
      case 2:
        return <GoalQuestion key="goal" {...commonProps} />;
      case 3:
        return <AssistanceLevelQuestion key="assistance" {...commonProps} />;
      case 4:
        return <CommunicationStyleQuestion key="communication" {...commonProps} />;
      case 5:
        return <TopicsQuestion key="topics" {...commonProps} />;
      case 6:
        return <OpenerStyleQuestion key="opener" {...commonProps} />;
      case 7:
        return <NameQuestion key="name" {...commonProps} />;
      case 8:
        return <FinalSetup key="final" data={data} updateData={updateData} onFinish={handleComplete} onBack={back} />;
      default:
        console.log('ERROR: Invalid step, defaulting to welcome');
        return <Welcome key="welcome-default" data={data} updateData={updateData} onNext={next} onBack={back} />;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        {/* <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          ></div>
        </div> */}
        <div style={{ width: '100%', height: '100%' }}>
          {step === 0 && <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>.</div>}
          {step === 1 && <Welcome data={data} updateData={updateData} onNext={next} onBack={back} />}
          {step === 2 && <GoalQuestion data={data} updateData={updateData} onNext={next} onBack={back} />}
          {step === 3 && <AssistanceLevelQuestion data={data} updateData={updateData} onNext={next} onBack={back} />}
          {step === 4 && <CommunicationStyleQuestion data={data} updateData={updateData} onNext={next} onBack={back} />}
          {step === 5 && <TopicsQuestion data={data} updateData={updateData} onNext={next} onBack={back} />}
          {step === 6 && <OpenerStyleQuestion data={data} updateData={updateData} onNext={next} onBack={back} />}
          {step === 7 && <NameQuestion data={data} updateData={updateData} onNext={next} onBack={back} />}
          {step === 8 && <FinalSetup data={data} updateData={updateData} onFinish={handleComplete} onBack={back} />}
        </div>
        
        {/* nav buttons */}
        {step > 0 && step <= 8 && (
          <div className="navigation-buttons">
            <button 
              onClick={() => {
                console.log('Back clicked, current step:', step);
                back();
              }} 
              className="back-button"
              style={{ pointerEvents: 'auto', zIndex: 10000 }}
            >
              Back
            </button>
            <button 
              onClick={() => {
                console.log('Next clicked, current step:', step);
                if (step === 8) {
                  handleComplete();
                } else {
                  next();
                }
              }} 
              className={`next-button ${step === 8 ? 'primary' : ''}`}
              disabled={isNextDisabled()}
              style={{ pointerEvents: 'auto', zIndex: 10000 }}
            >
              {step === 8 ? 'Launch Rizzly' : 'Continue'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

export default OnboardingFlow; 