import React, { useState, useEffect } from 'react';
import './GarageSalesList.css';

const GarageSalesList = () => {
  const [garageSales, setGarageSales] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, upcoming

  useEffect(() => {
    // Read garage sales from localStorage
    const loadGarageSales = () => {
      const savedSales = localStorage.getItem('garageSales');
      if (savedSales) {
        setGarageSales(JSON.parse(savedSales));
      }
    };

    loadGarageSales();

    // Set up event listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === 'garageSales') {
        loadGarageSales();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const filteredSales = garageSales || [];

  return (
    <div className="garage-sales-standalone">
      <div className="window-header">
        <h2>Garage Sales</h2>
      </div>

      <div className="filters">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Sales</option>
          <option value="active">Active Sales</option>
          <option value="upcoming">Upcoming Sales</option>
        </select>
      </div>

      <div className="sales-list">
        {garageSales ? (
          filteredSales.map((sale, index) => (
            <div key={index} className="sale-item">
              <h3>{sale.address}</h3>
              <p className="date-time">{sale.date} | {sale.time}</p>
              <p className="description">{sale.description}</p>
              <span className={`status ${sale.status}`}>
                {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
              </span>
              <p className="description">Location: ({sale.position.lat.toFixed(4)}, {sale.position.lng.toFixed(4)})</p>
            </div>
          ))
        ) : (
          <div className="loading">No garage sales found</div>
        )}
      </div>
    </div>
  );
};

export default GarageSalesList;
