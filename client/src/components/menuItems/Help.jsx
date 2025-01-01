import React from 'react';

const Help = () => {
  return (
    <div className="menu-item help">
      <h2>Help</h2>
      <div className="content">
        <div className="faq-section">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-item">
            <h4>How do I add a garage sale?</h4>
            <p>Click on "Garage Sales" in the menu and select "Add New Sale".</p>
          </div>
          <div className="faq-item">
            <h4>How do I find sales near me?</h4>
            <p>Enable location services and use the radius filter in "My Location".</p>
          </div>
        </div>
        <div className="contact-support">
          <h3>Need More Help?</h3>
          <button className="action-button">Contact Support</button>
        </div>
      </div>
    </div>
  );
};

export default Help;
