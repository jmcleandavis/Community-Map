import React from 'react';
import '../menuItems/menuItems.css';

const GarageSales = () => {
  const openGarageSalesList = () => {
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Use the new garageSales.html entry point
    const windowUrl = `${window.location.origin}/garageSales.html`;
    
    console.log('Opening garage sales window at:', windowUrl);
    
    const newWindow = window.open(
      windowUrl,
      'GarageSalesList',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );

    if (!newWindow) {
      console.error('Failed to open garage sales window - popup might be blocked');
    }
  };

  return (
    <div className="menu-item garage-sales">
      <h2>Garage Sales</h2>
      <div className="content">
        <button 
          className="action-button"
          onClick={openGarageSalesList}
        >
          View All Sales
        </button>
        <div className="sale-filters">
          <h3>Quick Filters</h3>
          <label>
            <input type="checkbox" /> Show Active Sales Only
          </label>
          <label>
            <input type="checkbox" /> Within 5km
          </label>
        </div>
      </div>
    </div>
  );
};

export default GarageSales;
