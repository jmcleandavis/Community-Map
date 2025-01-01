import React from 'react';

const Settings = () => {
  return (
    <div className="menu-item settings">
      <h2>Settings</h2>
      <div className="content">
        <div className="notification-settings">
          <h3>Notifications</h3>
          <label>
            <input type="checkbox" /> Email Notifications
          </label>
          <label>
            <input type="checkbox" /> Push Notifications
          </label>
        </div>
        <div className="display-settings">
          <h3>Display</h3>
          <label>
            <input type="checkbox" /> Dark Mode
          </label>
          <label>
            Distance Unit:
            <select defaultValue="km">
              <option value="km">Kilometers</option>
              <option value="mi">Miles</option>
            </select>
          </label>
        </div>
        <button className="action-button">Save Settings</button>
      </div>
    </div>
  );
};

export default Settings;
