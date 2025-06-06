import React from 'react';

// A simple reusable input component for this page
const SiteInput = ({ id, label, placeholder }: { id: string; label: string; placeholder: string; }) => (
    <div className="text-input-group">
        <label htmlFor={id}>{label}</label>
        <input type="text" id={id} name={id} placeholder={placeholder} />
    </div>
);


interface Page3Props {
  onNext: () => void;
  onBack: () => void;
}

function Page3({ onNext, onBack }: Page3Props) {
  return (
    <div>
      <h2>What are some websites you frequent?</h2>
        <div className="onboarding-options">
            <SiteInput id="site1" label="Site 1:" placeholder="https://google.com" />
            <SiteInput id="site2" label="Site 2:" placeholder="https://github.com" />
            <SiteInput id="site3" label="Site 3:" placeholder="https://stackoverflow.com" />
        </div>
      <div className="navigation-buttons">
        <button onClick={onBack} className="back-button">Back</button>
        <button onClick={onNext} className="next-button">Next</button>
      </div>
    </div>
  );
}

export default Page3; 