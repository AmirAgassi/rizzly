import React from 'react';
import { OnboardingData } from './OnboardingFlow';

interface BotPreferencesProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

function BotPreferences({ data, updateData, onNext, onBack }: BotPreferencesProps) {
  const handleCommunicationStyleChange = (style: string) => {
    const currentStyles = data.communicationStyle || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter(s => s !== style)
      : [...currentStyles, style];
    updateData({ communicationStyle: newStyles });
  };

  const handleTopicChange = (topic: string) => {
    const currentTopics = data.conversationTopics || [];
    const newTopics = currentTopics.includes(topic)
      ? currentTopics.filter(t => t !== topic)
      : [...currentTopics, topic];
    updateData({ conversationTopics: newTopics });
  };

  const handleOpenerStyleChange = (style: string) => {
    updateData({ openerStyle: style });
  };

  const handleResponseSpeedChange = (speed: string) => {
    updateData({ responseSpeed: speed });
  };

  const canProceed = data.communicationStyle.length > 0 && data.conversationTopics.length > 0 && data.openerStyle && data.responseSpeed;

  return (
    <div className="onboarding-content">
      <h2>Customize Your AI</h2>
      <p className="subtitle">
        Tell us how your AI assistant should communicate and what topics it should focus on.
      </p>

      <div className="text-input-group">
        <label>How should the AI communicate? (Select all that apply)</label>
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
                  checked={data.communicationStyle.includes(style.value)}
                  onChange={() => handleCommunicationStyleChange(style.value)}
                />
                <span className="option-icon">{style.icon}</span>
                {style.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="text-input-group">
        <label>What topics should the AI focus on? (Select favorites)</label>
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
                  checked={data.conversationTopics.includes(topic.value)}
                  onChange={() => handleTopicChange(topic.value)}
                />
                <span className="option-icon">{topic.icon}</span>
                {topic.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="text-input-group">
        <label>What opener style should the AI use?</label>
        <div className="onboarding-options">
          <label>
            <input 
              type="radio" 
              name="openerStyle" 
              value="funny" 
              checked={data.openerStyle === 'funny'} 
              onChange={(e) => handleOpenerStyleChange(e.target.value)} 
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
              onChange={(e) => handleOpenerStyleChange(e.target.value)} 
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
              onChange={(e) => handleOpenerStyleChange(e.target.value)} 
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
              onChange={(e) => handleOpenerStyleChange(e.target.value)} 
            />
            <span className="option-icon">🎯</span>
            Direct & straightforward
          </label>
        </div>
      </div>

      <div className="text-input-group">
        <label>How should the AI pace conversations?</label>
        <div className="onboarding-options three-column">
          <label>
            <input 
              type="radio" 
              name="responseSpeed" 
              value="quick" 
              checked={data.responseSpeed === 'quick'} 
              onChange={(e) => handleResponseSpeedChange(e.target.value)} 
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
              onChange={(e) => handleResponseSpeedChange(e.target.value)} 
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
              onChange={(e) => handleResponseSpeedChange(e.target.value)} 
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
          disabled={!canProceed}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default BotPreferences; 