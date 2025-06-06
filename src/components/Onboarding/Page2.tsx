import React, { useState } from 'react';

interface Page2Props {
  onNext: () => void;
  onBack: () => void;
}

function Page2({ onNext, onBack }: Page2Props) {
  const [personality, setPersonality] = useState('');

  return (
    <div>
      <h2>How would you describe your online personality?</h2>
      <div className="onboarding-options">
        <label>
          <input type="radio" name="personality" value="reserved" checked={personality === 'reserved'} onChange={(e) => setPersonality(e.target.value)} />
          Quiet and Reserved
        </label>
        <label>
          <input type="radio" name="personality" value="outgoing" checked={personality === 'outgoing'} onChange={(e) => setPersonality(e.target.value)} />
          Friendly and Outgoing
        </label>
        <label>
          <input type="radio" name="personality" value="analytical" checked={personality === 'analytical'} onChange={(e) => setPersonality(e.target.value)} />
          Analytical and Precise
        </label>
        <label>
          <input type="radio" name="personality" value="creative" checked={personality === 'creative'} onChange={(e) => setPersonality(e.target.value)} />
          Creative and Spontaneous
        </label>
      </div>
      <div className="navigation-buttons">
        <button onClick={onBack} className="back-button">Back</button>
        <button onClick={onNext} className="next-button">Next</button>
      </div>
    </div>
  );
}

export default Page2; 