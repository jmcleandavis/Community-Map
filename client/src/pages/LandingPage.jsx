import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import communityMapImage from '../assets/community-map-example.jpg';
import { useNavigation } from '../context/NavigationContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { setFromLanding, fromMap, setFromMap } = useNavigation();

  const handleNavigation = (path) => {
    setFromLanding(true); // Set that navigation came from landing page
    navigate(path);
  };

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <h1 className="landing-title">Community Sale Events on Google Maps</h1>
        <p className="landing-subtitle">
          Create interactive maps for your neighborhood's community sales, making it easy for visitors to find what they're looking for.
        </p>
      </header>

      <div className="landing-content">
        {/* Main Image */}
        <img 
          src={communityMapImage}
          alt="Example of a community sale map" 
          className="landing-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/1200x600?text=Community+Sale+Map+Example';
          }}
        />

        {/* Introduction */}
        <section className="landing-section">
          <h2 className="landing-section-title">Simplify Your Community Sale Event</h2>
          <p>
            Are you organizing a community sale event for your neighbourhood and would like to map out
            all the community sales on Google Maps? This makes it easy for visitors to find the sales
            they want to go to, or even just to see where the sales are in relation to them without the
            need for those old fashioned maps.
          </p>
          <p>
            We have created a simple way to do it right. All you have to do is login to your account,
            create the garage sale event, enter in the addresses and the descriptions. It's really easy.
          </p>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <div className="cta-button" onClick={() => handleNavigation('/login')}>
              Get Started Today
            </div>
            {fromMap && (
              <div className="cta-button secondary" onClick={() => {
                // Don't reset fromMap flag so the button remains visible when returning to this page
                navigate('/');
              }} style={{ marginLeft: '1rem' }}>
                Return to Map
              </div>
            )}
          </div>
        </section>

        {/* How It Works */}
        <section className="landing-section">
          <h2 className="landing-section-title">How It Works</h2>
          <div className="landing-steps">
            <div className="landing-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3 className="step-title">Create an Account</h3>
                <p className="step-description">
                  Sign up for a free account to get started. It only takes a minute and you'll be ready to create your first community sale event.
                </p>
              </div>
            </div>

            <div className="landing-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3 className="step-title">Set Up Your Community Sale</h3>
                <p className="step-description">
                  Create a new community sale event with details like name, date, and location. This will be the main hub for all the individual garage sales.
                </p>
              </div>
            </div>

            <div className="landing-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3 className="step-title">Add Garage Sales</h3>
                <p className="step-description">
                  Add individual garage sales to your community event by entering addresses and descriptions. Our system automatically places them on the map.
                </p>
              </div>
            </div>

            <div className="landing-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3 className="step-title">Share With Your Community</h3>
                <p className="step-description">
                  Share your interactive map with everyone in your community. Visitors can easily browse and find the sales they're interested in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="landing-section">
          <h2 className="landing-section-title">Features</h2>
          <div className="landing-grid">
            <div className="landing-card">
              <h3 className="landing-card-title">Interactive Maps</h3>
              <p className="landing-card-content">
                Fully interactive Google Maps integration that makes it easy for visitors to explore and find sales.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="landing-card-title">Sale Management</h3>
              <p className="landing-card-content">
                Easy-to-use tools for adding, editing, and removing garage sales from your community event.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="landing-card-title">Search Functionality</h3>
              <p className="landing-card-content">
                Visitors can search for specific items or categories to find exactly what they're looking for.
              </p>
            </div>

            <div className="landing-card">
              <h3 className="landing-card-title">Mobile Friendly</h3>
              <p className="landing-card-content">
                Responsive design works great on smartphones and tablets, perfect for visitors on the go.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="landing-section" style={{ textAlign: 'center' }}>
          <h2 className="landing-section-title">Ready to Get Started?</h2>
          <p>Create your first community garage sale map today and make it easier for everyone to find what they're looking for.</p>
          <div className="cta-button" onClick={() => handleNavigation('/login')}>
            Sign Up Now
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        {/* <p>&copy; 2025 Community Garage Sale Maps. All rights reserved.</p> */}
      </footer>
    </div>
  );
};

export default LandingPage;
