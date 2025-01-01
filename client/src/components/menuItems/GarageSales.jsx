import React, { useState } from 'react';
import GarageSalesList from '../GarageSalesList';
import '../menuItems/menuItems.css';

const GarageSales = () => {
  const [showList, setShowList] = useState(false);

  return (
    <>
      <div className="menu-item garage-sales">
        <h2>Garage Sales</h2>
        <div className="content">
          <button 
            className="action-button"
            onClick={() => setShowList(true)}
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
      
      {showList && (
        <>
          <div className="overlay" onClick={() => setShowList(false)} />
          <GarageSalesList onClose={() => setShowList(false)} />
        </>
      )}
    </>
  );
};

export default GarageSales;
