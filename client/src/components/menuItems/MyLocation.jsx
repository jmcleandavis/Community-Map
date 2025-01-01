import React from 'react';

const MyLocation = () => {
  return (
    <div className="menu-item my-location">
      <h2>My Location</h2>
      <div className="content">
        <button className="action-button">Center on My Location</button>
        <div className="location-settings">
          <label>
            <input type="checkbox" /> Track My Location
          </label>
          <label>
            <input type="checkbox" /> Show Location Radius
          </label>
          <div className="radius-slider">
            <span>Radius: </span>
            <input type="range" min="1" max="10" defaultValue="5" />
            <span>5 km</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyLocation;
