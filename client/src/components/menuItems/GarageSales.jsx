import React from 'react';

const GarageSales = () => {
  return (
    <div className="menu-item garage-sales">
      <h2>Garage Sales</h2>
      <div className="content">
        <button className="action-button">Add New Sale</button>
        <button className="action-button">View My Sales</button>
        <div className="sale-filters">
          <h3>Filters</h3>
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
