import React from 'react';
import './Help.css';

// Location icon component
const LocationIcon = () => (
  <span className="location-icon" style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: '4px', marginRight: '4px' }}>
    {/* Unicode character for a target/crosshair */}
    ⊕
  </span>
);

function Help() {
  return (
    <div className="help-container">
      <h1>Help</h1>
      
      <section className="help-section">
        <h2>Getting Started</h2>
        <p>Welcome to Community Map! This guide will help you navigate and use all the features of our application.</p>
      </section>

      <section className="help-section">
        <h2>Map Navigation</h2>
        <div className="left-aligned-list">
          <div className="list-item"><span className="bullet">•</span> Pan the map by clicking and dragging</div>
          <div className="list-item"><span className="bullet">•</span> Zoom in/out using the scroll wheel or the pinch zoom</div>
          <div className="list-item"><span className="bullet">•</span> Click the <LocationIcon /> button to center on your current position</div>
          <div className="list-item"><span className="bullet">•</span> The blue dot shows your current location</div>
          <div className="list-item"><span className="bullet">•</span> Red dots indicate garage sale locations</div>
          <div className="list-item"><span className="bullet">•</span> Green dots indicate garage sales that you have selected (must be logged in)</div>
        </div>
      </section>

      <section className="help-section">
        <h2>Garage Sales</h2>
        <div className="left-aligned-list">
          <div className="list-item"><span className="bullet">•</span> Click on any red dot to view garage sale details</div>
          <div className="list-item"><span className="bullet">•</span> The info window shows the address and description</div>
          <div className="list-item"><span className="bullet">•</span> Close the info window by clicking the X or clicking elsewhere on the map</div>
        </div>
      </section>

      <section className="help-section">
        <h2>Menu Options</h2>
        <div className="left-aligned-list">
          <div className="list-item"><span className="bullet">•</span> <strong>Map:</strong>&nbsp; Return to the main map view</div>
          <div className="list-item"><span className="bullet">•</span> <strong>Show Selected Sales:</strong>&nbsp; View all garage sales that you have selected on the map</div>
          <div className="list-item"><span className="bullet">•</span> <strong>Garage Sales:</strong>&nbsp; View a list of all garage sales</div>
          <div className="list-item"><span className="bullet">•</span> <strong>About:</strong>&nbsp; View information about the app and how to create your own community garage sale map</div>
          <div className="list-item"><span className="bullet">•</span> <strong>Login/Signup:</strong>&nbsp; Access your account</div>
          <div className="list-item"><span className="bullet">•</span> <strong>Help:</strong>&nbsp; View this help guide</div>
        </div>
      </section>

      <section className="help-section">
        <h2>Need More Help?</h2>
        <p>If you have any questions or need additional assistance, please contact us at support@communitymap.com</p>
      </section>
    </div>
  );
}

export default Help;
