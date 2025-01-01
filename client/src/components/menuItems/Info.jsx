import React from 'react';

const Info = () => {
  return (
    <div className="menu-item info">
      <h2>Info</h2>
      <div className="content">
        <div className="about-section">
          <h3>About Community Map</h3>
          <p>A community-driven platform for finding and sharing local garage sales.</p>
        </div>
        <div className="version-info">
          <h3>Version</h3>
          <p>1.0.0</p>
        </div>
        <div className="links">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">Community Guidelines</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Info;
