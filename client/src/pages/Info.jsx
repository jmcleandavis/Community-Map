import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '../context/NavigationContext';
import './Info.css';

const InfoPage = () => {
  const navigate = useNavigate();
  const { fromMap, setFromMap } = useNavigation();
  
  // Record that the user started on the about page
  useEffect(() => {
    // Store the initial page in sessionStorage
    sessionStorage.setItem('initialPage', '/about');
    console.log('InfoPage: Recorded initial page as "/about" in sessionStorage');
  }, []);
  return (
    <div className="info-page">
      <div className="info-container">
        <h2>INFO</h2>
        <div className="content">
          <div className="about-section">
            <h3>About Community Map</h3>
            <p>An app that maps out garage sales in your community during a community garage sale event.</p>
          </div>
          <div className="developed-by">
            <h3>Developed By</h3>
            <div className="developer">
              <p>Asher Green</p>
              <a href="mailto:asher@ashergreen.ca">asher@ashergreen.ca</a>
              <br />
              <a href="https://www.ashergreen.ca" target="_blank" rel="noopener noreferrer">www.ashergreen.ca</a>
            </div>
            <div className="developer">
              <p>Jamie-Lee Mclean-Davis</p>
              <a href="mailto:jmclean.davis@gmail.com">jmclean.davis@gmail.com</a>
            </div>
          </div>
          <div className="version-info">
            <h3>Version</h3>
            <p>1.0.0</p>
          </div>
          {/* <div className="links">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">Community Guidelines</a></li>
            </ul>
          </div> */}
        </div>
      </div>
      
      {/* Return to Map Button - Only shown if user came from map */}
      {fromMap && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <div 
            className="cta-button secondary" 
            onClick={() => {
              navigate('/');
            }} 
            style={{ 
              display: 'inline-block',
              backgroundColor: '#27ae60',
              color: 'white',
              padding: '0.8rem 1.5rem',
              borderRadius: '4px',
              textDecoration: 'none',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Return to Map
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPage;
