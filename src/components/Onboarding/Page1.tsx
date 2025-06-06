import React, { useState } from 'react';

interface Page1Props {
  onNext: () => void;
}

function Page1({ onNext }: Page1Props) {
  const [goal, setGoal] = useState('');

  return (
    <div>
      <h2>What is your primary goal with automation?</h2>
      <div className="onboarding-options">
        <label>
          <input type="radio" name="goal" value="efficiency" checked={goal === 'efficiency'} onChange={(e) => setGoal(e.target.value)} />
          Improving Efficiency
        </label>
        <label>
          <input type="radio" name="goal" value="data" checked={goal === 'data'} onChange={(e) => setGoal(e.target.value)} />
          Data Collection
        </label>
        <label>
          <input type="radio" name="goal" value="testing" checked={goal === 'testing'} onChange={(e) => setGoal(e.target.value)} />
          Automated Testing
        </label>
        <label>
          <input type="radio" name="goal" value="fun" checked={goal === 'fun'} onChange={(e) => setGoal(e.target.value)} />
          Just for Fun!
        </label>
      </div>
      <div className="navigation-buttons">
        <div /> {/* Placeholder for alignment */}
        <button onClick={onNext} className="next-button">Next</button>
      </div>
    </div>
  );
}

export default Page1; 