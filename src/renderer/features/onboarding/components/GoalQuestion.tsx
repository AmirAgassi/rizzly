import React from 'react';
import type { OnboardingData } from './OnboardingFlow';

interface GoalQuestionProps {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function GoalQuestion({ data, updateData }: GoalQuestionProps) {
  return (
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
    </div>
  );
} 