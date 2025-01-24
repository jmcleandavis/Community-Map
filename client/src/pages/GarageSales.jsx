import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GarageSales.css';
import { useGarageSales } from '../context/GarageSalesContext';
import { useAuth } from '../context/AuthContext';

const GarageSales = () => {
  const {
    garageSales,
    loading,
    error,
    searchTerm,
    selectedSales,
    fetchGarageSales,
    handleSearchChange,
    handleCheckboxChange,
    handleSelectAll,
  } = useGarageSales();
  
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleViewOnMap = (sale) => {
    // Use the existing geocoded data
    const saleToView = {
      ...sale,
      lat: sale.position.lat,
      lng: sale.position.lng,
      address: sale.address,
      description: sale.description
    };
    
    localStorage.setItem('selectedSales', JSON.stringify([saleToView]));
    navigate('/');
  };

  const handleViewSelected = () => {
    const selectedSalesData = filteredSales
      .filter(sale => selectedSales.has(sale.id))
      .map(sale => ({
        ...sale,
        lat: sale.position.lat,
        lng: sale.position.lng,
        address: sale.address,
        description: sale.description
      }));

    if (selectedSalesData.length > 0) {
      localStorage.setItem('selectedSales', JSON.stringify(selectedSalesData));
      navigate('/');
    } else {
      alert('Please select at least one garage sale to view on the map.');
    }
  };

  const filteredSales = garageSales.filter(sale => 
    (sale.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="garage-sales-container">
        <div className="loading">Loading garage sales...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="garage-sales-container">
        <div className="error">{error}</div>
        <button className="retry-button" onClick={fetchGarageSales}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="garage-sales-container">
      <h1>Garage Sales</h1>
      {isAuthenticated && user?.data?.email && (
        <div className="user-email">Logged in as: {user.data.email}</div>
      )}
      
      <div className="controls-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by address or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="selection-controls">
          <button 
            className="select-all-button"
            onClick={() => handleSelectAll(filteredSales)}
          >
            {selectedSales.size === filteredSales.length ? 'Unselect All' : 'Select All'}
          </button>
          
          {selectedSales.size > 0 && (
            <button 
              className="view-selected-button"
              onClick={handleViewSelected}
            >
              View Selected ({selectedSales.size})
            </button>
          )}
        </div>
      </div>

      {filteredSales.length === 0 ? (
        <div className="no-results">
          No garage sales found matching your search.
        </div>
      ) : (
        <div className="garage-sales-list">
          {filteredSales.map((sale) => (
            <div key={sale.id} className="garage-sale-card">
              <div className="card-header">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={selectedSales.has(sale.id)}
                    onChange={() => handleCheckboxChange(sale.id)}
                  />
                  <span className="checkmark"></span>
                </label>
              </div>
              <div className="sale-content">
                <h3>{sale.address || 'No Address Available'}</h3>
                <p>{sale.description || 'No Description Available'}</p>
              </div>
              <button 
                className="view-map-button"
                onClick={() => handleViewOnMap(sale)}
              >
                View on Map
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="total-count">
        Showing {filteredSales.length} of {garageSales.length} garage sales
        {selectedSales.size > 0 && ` (${selectedSales.size} selected)`}
      </div>
    </div>
  );
};

export default GarageSales;
