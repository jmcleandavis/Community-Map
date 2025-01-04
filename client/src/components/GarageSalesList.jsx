import React, { useState, useEffect } from 'react';
import './GarageSalesList.css';

const GarageSalesList = () => {
  const [garageSales, setGarageSales] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      console.log('Component mounted, checking localStorage...');
      
      const keys = Object.keys(localStorage);
      console.log('All localStorage keys:', keys);
      
      const savedSales = localStorage.getItem('garageSales');
      console.log('Raw garage sales data:', savedSales);
      
      if (savedSales) {
        const parsedSales = JSON.parse(savedSales);
        console.log('Parsed garage sales:', parsedSales);
        setGarageSales(parsedSales);
      } else {
        console.log('No garage sales found in localStorage');
        setError('No garage sales data available');
      }
    } catch (err) {
      console.error('Error loading garage sales:', err);
      setError(err.message);
    }
  }, []);

  if (error) {
    return (
      <div className="garage-sales-standalone">
        <div className="window-header">
          <h2>Garage Sales</h2>
        </div>
        <div className="error-message">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="garage-sales-standalone">
      <div className="window-header">
        <h2>Garage Sales</h2>
        <p>Total Sales: {garageSales.length}</p>
      </div>

      <div className="sales-list">
        {garageSales.length > 0 ? (
          garageSales.map((sale, index) => (
            <div key={index} className="sale-item">
              <h3>{sale.address}</h3>
              <p className="description">
                {sale.description}
              </p>
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
