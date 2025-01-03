import React from 'react';
import '../menuItems/menuItems.css';

const GarageSales = () => {
  const openGarageSalesList = () => {
    const width = 800;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    // Use the current origin to ensure we're using the correct development server
    const windowUrl = `${window.location.origin}/garageSalesWindow.html`;
    
    window.open(
      windowUrl,
      'GarageSalesList',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
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
