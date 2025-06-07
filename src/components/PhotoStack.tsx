import React from 'react';
import './PhotoStack.css';

interface PhotoStackProps {
  photos: string[];
  isDownloading: boolean;
  totalExpected?: number;
}

function PhotoStack({ photos, isDownloading, totalExpected }: PhotoStackProps) {
  console.log('PhotoStack render:', { photoCount: photos.length, isDownloading });
  
  return (
    <div className="photo-stack-container">
      <div className="photo-stack">
        {photos.map((photo, index) => {
          // Fan from bottom effect - like cards in your hand
          const fanAngle = (index - photos.length / 2) * 12; // spread from center
          const fanDistance = index * 8; // distance from bottom center
          const randomTilt = [-3, 2, -1, 4, -2, 1, -4, 3, -1, 2][index] || 0; // slight random tilt
          
          const rotation = fanAngle + randomTilt;
          const translateX = Math.sin(fanAngle * Math.PI / 180) * fanDistance;
          const translateY = -Math.abs(index * 3); // slightly upward as they spread
          const transformValue = `rotate(${rotation}deg) translate(${translateX}px, ${translateY}px)`;
          
          console.log(`Photo ${index}: transform = ${transformValue}`);
          
          return (
            <div 
              key={index}
              className="photo-item"
              style={{
                zIndex: index + 1,
                transform: transformValue,
                animationDelay: `${index * 300}ms`,
                left: `45%`,
                top: `45%`,
                position: 'absolute'
              }}
            >
              <img src={`data:image/jpeg;base64,${photo}`} alt={`Profile ${index + 1}`} />
            </div>
          );
        })}
        
        {isDownloading && (
          <div className="downloading-indicator">
            <div className="spinner"></div>
            <span>downloading photos... ({photos.length}{totalExpected ? `/${totalExpected}` : ''})</span>
          </div>
        )}
      </div>
      
      {photos.length > 0 && !isDownloading && (
        <div className="stack-summary">
          <span>{photos.length} photos collected 📸</span>
        </div>
      )}
    </div>
  );
}

export default PhotoStack; 