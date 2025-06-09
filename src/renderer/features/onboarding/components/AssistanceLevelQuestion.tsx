import React from 'react';
import type { OnboardingData } from './OnboardingFlow';

interface AssistanceLevelQuestionProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function AssistanceLevelQuestion({ data, updateData }: AssistanceLevelQuestionProps) {
  return (
    <div className="onboarding-content">
      <h2>How much help do you want?</h2>
      <p className="subtitle">
        Choose your level of AI involvement in your dating conversations.
      </p>

      <div className="text-input-group">
        <div className="onboarding-options single-column">
          <label>
            <input 
              type="radio" 
              name="assistance" 
              value="full-autopilot" 
              checked={data.assistanceLevel === 'full-autopilot'} 
              onChange={(e) => updateData({ assistanceLevel: e.target.value })} 
            />
            <span className="option-icon">✍️</span>
            <div>
              <p>I'll write and send messages for you automatically</p>
            </div>
          </label>
          <label>
            <input 
              type="radio" 
              name="assistance" 
              value="suggestions-only" 
              checked={data.assistanceLevel === 'suggestions-only'} 
              onChange={(e) => updateData({ assistanceLevel: e.target.value })} 
            />
            <span className="option-icon">💡</span>
            <div>
              <p>I'll suggest what to say, but you send the messages</p>
            </div>
          </label>
          <label>
            <input 
              type="radio" 
              name="assistance" 
              value="analysis-only" 
              checked={data.assistanceLevel === 'analysis-only'} 
              onChange={(e) => updateData({ assistanceLevel: e.target.value })} 
            />
            <span className="option-icon">👀</span>
            <div>
              <p>I'll analyze profiles and conversations, but won't write messages</p>
            </div>
          </label>
          <label>
            <input 
              type="radio" 
              name="assistance" 
              value="minimal" 
              checked={data.assistanceLevel === 'minimal'} 
              onChange={(e) => updateData({ assistanceLevel: e.target.value })} 
            />
            <span className="option-icon">🚀</span>
            <div>
              <p>Just basic tips and emergency intervention when needed</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
} 