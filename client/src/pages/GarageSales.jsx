import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './GarageSales.css';
import { useGarageSales } from '../context/GarageSalesContext';

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

  useEffect(() => {
    fetchGarageSales();
  }, []);

  const handleViewOnMap = async (sale) => {
    try {
      const fullAddress = `${sale.Address}, Pickering, ON, Canada`;
      console.log('Geocoding single address:', fullAddress);
      
      const response = await api.get('/api/geocode', {
        params: { address: fullAddress }
      });
      console.log('Single geocoding response:', response.data);
      
      if (response.data.status === 'OK' && response.data.results && response.data.results[0]) {
        const location = response.data.results[0].geometry.location;
        const geocodedSale = {
          ...sale,
          lat: Number(location.lat),
          lng: Number(location.lng),
          address: sale.Address || 'No Address Available',
          description: sale.Description || 'No Description Available'
        };
        console.log('Storing single geocoded sale:', geocodedSale);
        localStorage.setItem('selectedSales', JSON.stringify([geocodedSale]));
        navigate('/');
      } else {
        console.error('Failed to geocode address:', fullAddress);
        alert('Failed to locate this address on the map. Please try again.');
      }
    } catch (error) {
      console.error('Error geocoding sale:', error);
      alert('Error locating address on the map. Please try again.');
    }
  };

  const handleViewSelected = async () => {
    const selectedSalesData = filteredSales.filter(sale => selectedSales.has(sale.id));
    console.log('Selected sales before geocoding:', selectedSalesData);
    
    if (selectedSalesData.length > 0) {
      try {
        const geocodedSales = await Promise.all(selectedSalesData.map(async (sale) => {
          const fullAddress = `${sale.Address}, Pickering, ON, Canada`;
          console.log('Geocoding address:', fullAddress);
          
          try {
            const response = await api.get('/api/geocode', {
              params: { address: fullAddress }
            });
            console.log('Geocoding response:', response.data);
            
            if (response.data.status === 'OK' && response.data.results && response.data.results[0]) {
              const location = response.data.results[0].geometry.location;
              return {
                ...sale,
                lat: Number(location.lat),
                lng: Number(location.lng),
                address: sale.Address || 'No Address Available',
                description: sale.Description || 'No Description Available'
              };
            }
            console.warn(`Failed to geocode address: ${fullAddress}`);
            return null;
          } catch (error) {
            console.error(`Error geocoding address ${fullAddress}:`, error);
            return null;
          }
        }));
        
        // Filter out any failed geocoding attempts
        const validGeocodedSales = geocodedSales.filter(sale => sale !== null);
        
        if (validGeocodedSales.length > 0) {
          console.log('Storing geocoded sales:', validGeocodedSales);
          localStorage.setItem('selectedSales', JSON.stringify(validGeocodedSales));
          navigate('/');
        } else {
          alert('Failed to locate any of the selected addresses on the map. Please try again.');
        }
      } catch (error) {
        console.error('Error geocoding selected sales:', error);
        alert('Error locating addresses on the map. Please try again.');
      }
    }
  };

  const filteredSales = garageSales.filter(sale => 
    sale.address.toLowerCase().includes(searchTerm) ||
    sale.description.toLowerCase().includes(searchTerm)
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
            onClick={handleSelectAll}
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
                <h3>{sale.address}</h3>
                <p>{sale.description}</p>
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
}

export default GarageSales;
