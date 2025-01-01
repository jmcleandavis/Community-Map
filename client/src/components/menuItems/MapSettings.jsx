import React from 'react';

const MapSettings = () => {
  return (
    <div className="menu-item map-settings">
      <h2>Map Settings</h2>
      <div className="content">
        <div className="map-options">
          <label>
            <input type="checkbox" defaultChecked /> Show Sale Markers
          </label>
          <label>
            <input type="checkbox" defaultChecked /> Show Location Pin
          </label>
          <label>
            <input type="checkbox" /> Dark Mode
          </label>
        </div>
        <div className="map-style">
          <h3>Map Style</h3>
          <select defaultValue="default">
            <option value="default">Default</option>
            <option value="satellite">Satellite</option>
            <option value="terrain">Terrain</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default MapSettings;
