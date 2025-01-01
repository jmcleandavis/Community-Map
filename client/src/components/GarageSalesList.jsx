import React, { useState, useEffect } from 'react';
import './GarageSalesList.css';

const GarageSalesList = ({ onClose }) => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, upcoming

  useEffect(() => {
    // TODO: Fetch garage sales from your backend
    // This is mock data for now
    const mockSales = [
      {
        id: 1,
        address: '123 Main St',
        date: '2025-01-15',
        time: '9:00 AM - 4:00 PM',
        description: 'Moving sale! Everything must go!',
        status: 'upcoming'
      },
      {
        id: 2,
        address: '456 Oak Ave',
        date: '2025-01-02',
        time: '8:00 AM - 2:00 PM',
        description: 'Vintage furniture and collectibles',
        status: 'active'
      }
    ];

    setSales(mockSales);
    setLoading(false);
  }, []);

  const filteredSales = sales.filter(sale => {
    if (filter === 'all') return true;
    return sale.status === filter;
  });

  return (
    <div className="garage-sales-window">
      <div className="window-header">
        <h2>Garage Sales</h2>
        <button className="close-button" onClick={onClose}>&times;</button>
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
        <button className="add-sale-button">+ Add New Sale</button>
      </div>

      <div className="sales-list">
        {loading ? (
          <div className="loading">Loading sales...</div>
        ) : filteredSales.length === 0 ? (
          <div className="no-sales">No garage sales found</div>
        ) : (
          filteredSales.map(sale => (
            <div key={sale.id} className="sale-card">
              <div className="sale-header">
                <h3>{sale.address}</h3>
                <span className={`status ${sale.status}`}>
                  {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                </span>
              </div>
              <div className="sale-details">
                <p><strong>Date:</strong> {sale.date}</p>
                <p><strong>Time:</strong> {sale.time}</p>
                <p>{sale.description}</p>
              </div>
              <div className="sale-actions">
                <button className="view-on-map">View on Map</button>
                <button className="more-info">More Info</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GarageSalesList;
