import React from 'react';

interface Page4Props {
  onFinish: () => void;
  onBack: () => void;
}

function Page4({ onFinish, onBack }: Page4Props) {
  return (
    <div>
      <h2>Ready to Go?</h2>
      <p style={{marginBottom: '2rem'}}>Your preferences are saved. You can now start using the app!</p>
      <div className="navigation-buttons">
        <button onClick={onBack} className="back-button">Back</button>
        <button onClick={onFinish} className="next-button">Finish</button>
      </div>
    </div>
  );
}

export default Page4; 