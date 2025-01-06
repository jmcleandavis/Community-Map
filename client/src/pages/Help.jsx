import React from 'react';
import './Help.css';

function Help() {
  return (
    <div className="help-container">
      <h1>Help & FAQ</h1>
      
      <section className="help-section">
        <h2>Getting Started</h2>
        <p>Welcome to Community Map! This guide will help you navigate and use all the features of our application.</p>
      </section>

      <section className="help-section">
        <h2>Map Navigation</h2>
        <ul>
          <li>Pan the map by clicking and dragging</li>
          <li>Zoom in/out using the scroll wheel or the + / - buttons</li>
          <li>Click the "My Location" button to center on your current position</li>
          <li>The blue dot shows your current location</li>
          <li>Red dots indicate garage sale locations</li>
        </ul>
      </section>

      <section className="help-section">
        <h2>Garage Sales</h2>
        <ul>
          <li>Click on any red dot to view garage sale details</li>
          <li>The info window shows the address and description</li>
          <li>Close the info window by clicking the X or clicking elsewhere on the map</li>
        </ul>
      </section>

      <section className="help-section">
        <h2>Menu Options</h2>
        <ul>
          <li><strong>Map:</strong> Return to the main map view</li>
          <li><strong>Garage Sales:</strong> View a list of all garage sales</li>
          <li><strong>My Location:</strong> Center the map on your current location</li>
          <li><strong>Map Settings:</strong> Adjust map display preferences</li>
          <li><strong>Login/Signup:</strong> Access your account</li>
          <li><strong>Settings:</strong> Configure application settings</li>
          <li><strong>Help:</strong> View this help guide</li>
        </ul>
      </section>

      <section className="help-section">
        <h2>Need More Help?</h2>
        <p>If you have any questions or need additional assistance, please contact us at support@communitymap.com</p>
      </section>
    </div>
  );
}

export default Help;
