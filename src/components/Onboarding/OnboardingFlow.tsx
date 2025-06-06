import React, { useState } from 'react';
import Welcome from './Welcome';
import FinalSetup from './FinalSetup';
import './Onboarding.css';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export interface OnboardingData {
  // step 1: welcome
  // step 2: primary goal
  primaryGoal: string;
  // step 3: experience level
  experience: string;
  // step 4: communication style
  communicationStyle: string[];
  // step 5: conversation topics
  conversationTopics: string[];
  // step 6: opener style
  openerStyle: string;
  // step 7: response speed
  responseSpeed: string;
  // step 8: name
  name: string;
  // step 9: notifications
  notifications: boolean;
}

// individual question components
const GoalQuestion = ({ data, updateData, onNext, onBack }: any) => (
  <div className="onboarding-content">
    <h2>What's your primary goal?</h2>
    <p className="subtitle">
      Help us understand what you're looking for so we can customize your experience.
    </p>

    <div className="text-input-group">
      <div className="onboarding-options">
        <label>
          <input 
            type="radio" 
            name="goal" 
            value="serious-relationship" 
            checked={data.primaryGoal === 'serious-relationship'} 
            onChange={(e) => updateData({ primaryGoal: e.target.value })} 
          />
          <span className="option-icon">💍</span>
          Finding a serious relationship
        </label>
        <label>
          <input 
            type="radio" 
            name="goal" 
            value="casual-dating" 
            checked={data.primaryGoal === 'casual-dating'} 
            onChange={(e) => updateData({ primaryGoal: e.target.value })} 
          />
          <span className="option-icon">😊</span>
          Casual dating and meeting new people
        </label>
        <label>
          <input 
            type="radio" 
            name="goal" 
            value="hookups" 
            checked={data.primaryGoal === 'hookups'} 
            onChange={(e) => updateData({ primaryGoal: e.target.value })} 
          />
          <span className="option-icon">🔥</span>
          Casual hookups and fun
        </label>
        <label>
          <input 
            type="radio" 
            name="goal" 
            value="exploring" 
            checked={data.primaryGoal === 'exploring'} 
            onChange={(e) => updateData({ primaryGoal: e.target.value })} 
          />
          <span className="option-icon">🌟</span>
          Just exploring and having fun
        </label>
      </div>
    </div>

    <div className="navigation-buttons">
      <button onClick={onBack} className="back-button">Back</button>
      <button 
        onClick={onNext} 
        className="next-button"
        disabled={!data.primaryGoal}
      >
        Continue
      </button>
    </div>
  </div>
);

const ExperienceQuestion = ({ data, updateData, onNext, onBack }: any) => (
  <div className="onboarding-content">
    <h2>Your dating app experience?</h2>
    <p className="subtitle">
      This helps us tailor the AI's approach to match your comfort level.
    </p>

    <div className="text-input-group">
      <div className="onboarding-options three-column">
        <label>
          <input 
            type="radio" 
            name="experience" 
            value="beginner" 
            checked={data.experience === 'beginner'} 
            onChange={(e) => updateData({ experience: e.target.value })} 
          />
          <span className="option-icon">🌱</span>
          New to dating apps
        </label>
        <label>
          <input 
            type="radio" 
            name="experience" 
            value="intermediate" 
            checked={data.experience === 'intermediate'} 
            onChange={(e) => updateData({ experience: e.target.value })} 
          />
          <span className="option-icon">📱</span>
          Some experience, looking to improve
        </label>
        <label>
          <input 
            type="radio" 
            name="experience" 
            value="experienced" 
            checked={data.experience === 'experienced'} 
            onChange={(e) => updateData({ experience: e.target.value })} 
          />
          <span className="option-icon">🎯</span>
          Very experienced, want to optimize
        </label>
      </div>
    </div>

    <div className="navigation-buttons">
      <button onClick={onBack} className="back-button">Back</button>
      <button 
        onClick={onNext} 
        className="next-button"
        disabled={!data.experience}
      >
        Continue
      </button>
    </div>
  </div>
);

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

      <div className="navigation-buttons">
        <button onClick={onBack} className="back-button">Back</button>
        <button 
          onClick={onNext} 
          className="next-button"
          disabled={!data.communicationStyle?.length}
        >
          Continue
        </button>
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
            { value: 'books', icon: '📚', label: 'Books & literature' }
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

      <div className="navigation-buttons">
        <button onClick={onBack} className="back-button">Back</button>
        <button 
          onClick={onNext} 
          className="next-button"
          disabled={!data.conversationTopics?.length}
        >
          Continue
        </button>
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

    <div className="navigation-buttons">
      <button onClick={onBack} className="back-button">Back</button>
      <button 
        onClick={onNext} 
        className="next-button"
        disabled={!data.openerStyle}
      >
        Continue
      </button>
    </div>
  </div>
);

const ResponseSpeedQuestion = ({ data, updateData, onNext, onBack }: any) => (
  <div className="onboarding-content">
    <h2>How should your AI pace conversations?</h2>
    <p className="subtitle">
      Choose the response timing that matches your dating style and personality.
    </p>

    <div className="text-input-group">
      <div className="onboarding-options three-column">
        <label>
          <input 
            type="radio" 
            name="responseSpeed" 
            value="quick" 
            checked={data.responseSpeed === 'quick'} 
            onChange={(e) => updateData({ responseSpeed: e.target.value })} 
          />
          <span className="option-icon">⚡</span>
          Quick responses
        </label>
        <label>
          <input 
            type="radio" 
            name="responseSpeed" 
            value="moderate" 
            checked={data.responseSpeed === 'moderate'} 
            onChange={(e) => updateData({ responseSpeed: e.target.value })} 
          />
          <span className="option-icon">⏰</span>
          Moderate pace
        </label>
        <label>
          <input 
            type="radio" 
            name="responseSpeed" 
            value="slow" 
            checked={data.responseSpeed === 'slow'} 
            onChange={(e) => updateData({ responseSpeed: e.target.value })} 
          />
          <span className="option-icon">🐌</span>
          Slow responses
        </label>
      </div>
    </div>

    <div className="navigation-buttons">
      <button onClick={onBack} className="back-button">Back</button>
      <button 
        onClick={onNext} 
        className="next-button"
        disabled={!data.responseSpeed}
      >
        Continue
      </button>
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

    <div className="navigation-buttons">
      <button onClick={onBack} className="back-button">Back</button>
      <button 
        onClick={onNext} 
        className="next-button"
        disabled={!data.name.trim()}
      >
        Continue
      </button>
    </div>
  </div>
);

const NotificationsQuestion = ({ data, updateData, onNext, onBack }: any) => (
  <div className="onboarding-content">
    <h2>Stay in the loop?</h2>
    <p className="subtitle">
      Get notified about new matches, conversations, and AI activity to never miss an opportunity.
    </p>

    <div className="text-input-group">
      <div className="toggle-container">
        <div>
          <strong>Enable Notifications</strong>
          <p>Get notified about matches and AI activity</p>
        </div>
        <div 
          className={`toggle-switch ${data.notifications ? 'active' : ''}`}
          onClick={() => updateData({ notifications: !data.notifications })}
        ></div>
      </div>
    </div>

    <div className="navigation-buttons">
      <button onClick={onBack} className="back-button">Back</button>
      <button 
        onClick={onNext} 
        className="next-button"
      >
        Continue
      </button>
    </div>
  </div>
);

function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 9;
  
  const [data, setData] = useState<OnboardingData>({
    primaryGoal: '',
    experience: '',
    communicationStyle: [],
    conversationTopics: [],
    openerStyle: '',
    responseSpeed: '',
    name: '',
    notifications: true,
  });

  const next = () => setStep(s => Math.min(s + 1, totalSteps));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleComplete = () => {
    localStorage.setItem('rizzly-preferences', JSON.stringify(data));
    onComplete();
  };

  const renderStep = () => {
    const commonProps = {
      data,
      updateData,
      onNext: next,
      onBack: back,
    };

    switch (step) {
      case 1:
        return <Welcome data={data} updateData={updateData} onNext={next} onBack={back} />;
      case 2:
        return <GoalQuestion {...commonProps} />;
      case 3:
        return <ExperienceQuestion {...commonProps} />;
      case 4:
        return <CommunicationStyleQuestion {...commonProps} />;
      case 5:
        return <TopicsQuestion {...commonProps} />;
      case 6:
        return <OpenerStyleQuestion {...commonProps} />;
      case 7:
        return <ResponseSpeedQuestion {...commonProps} />;
      case 8:
        return <NameQuestion {...commonProps} />;
      case 9:
        return <NotificationsQuestion {...commonProps} />;
      case 10:
        return <FinalSetup data={data} updateData={updateData} onFinish={handleComplete} onBack={back} />;
      default:
        return <Welcome data={data} updateData={updateData} onNext={next} onBack={back} />;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="progress-bar-container">
        <div 
          className="progress-bar" 
          style={{ width: `${(step / totalSteps) * 100}%` }}
        ></div>
      </div>
      
      <div className="onboarding-card">
        {renderStep()}
      </div>
    </div>
  );
}

export default OnboardingFlow; 