import React from 'react';
import './Info.css';

const InfoPage = () => {
  return (
    <div className="info-page">
      <div className="info-container">
        <h2>INFO</h2>
        <div className="content">
          <div className="about-section">
            <h3>About Community Map</h3>
            <p>A community-driven platform for finding and sharing local garage sales.</p>
          </div>
          <div className="developed-by">
            <h3>Developed By</h3>
            <div className="developer">
              <p>Asher Green</p>
              <a href="mailto:asher@ashergreen.ca">asher@ashergreen.ca</a>
            </div>
            <div className="developer">
              <p>Jamie-Lee Mclean Davis</p>
              <a href="mailto:jmclean.davis@gmail.com">jmclean.davis@gmail.com</a>
            </div>
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
    </div>
  );
};

export default InfoPage;
