import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GarageSalesAdmin.css';
import { useGarageSales } from '../context/GarageSalesContext';
import AutoResizeTextArea from '../components/AutoResizeTextArea';

const GarageSalesAdmin = () => {
  const {
    garageSales,
    loading,
    error,
    fetchGarageSales,
  } = useGarageSales();
  
  const navigate = useNavigate();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSale, setNewSale] = useState({
    Address: '',
    Description: ''
  });

  const handleAddNew = () => {
    setIsAddingNew(true);
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewSale({
      Address: '',
      Description: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSale(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement API call to add new garage sale
    console.log('Adding new garage sale:', newSale);
    setIsAddingNew(false);
    setNewSale({
      Address: '',
      Description: ''
    });
    // Refresh the list after adding
    fetchGarageSales();
  };

  const handleDelete = async (saleId) => {
    if (window.confirm('Are you sure you want to delete this garage sale?')) {
      // TODO: Implement API call to delete garage sale
      console.log('Deleting garage sale:', saleId);
      // Refresh the list after deleting
      fetchGarageSales();
    }
  };

  const handleViewOnMap = (sale) => {
    const saleToView = {
      ...sale,
      lat: sale.position.lat,
      lng: sale.position.lng,
      address: sale.Address,
      description: sale.Description
    };
    
    localStorage.setItem('selectedSales', JSON.stringify([saleToView]));
    navigate('/');
  };

  const filteredSales = (garageSales || []).filter(sale => {
    const currentSearchTerm = searchTerm.toLowerCase();
    const address = (sale?.Address || '').toLowerCase();
    const description = (sale?.Description || '').toLowerCase();
    
    return address.includes(currentSearchTerm) || description.includes(currentSearchTerm);
  });

  if (loading) {
    return (
      <div className="garage-sales-admin">
        <div className="loading">Loading garage sales...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="garage-sales-admin">
        <div className="error">{error}</div>
        <button className="retry-button" onClick={fetchGarageSales}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="garage-sales-admin">
      <h1>Garage Sales Administration</h1>
      
      <div className="admin-controls">
        {!isAddingNew && (
          <button onClick={handleAddNew}>Add New Garage Sale</button>
        )}
      </div>

      {isAddingNew && (
        <div className="add-sale-form">
          <h2>Add New Garage Sale</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Address:</label>
              <input
                type="text"
                name="Address"
                value={newSale.Address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <AutoResizeTextArea
                name="Description"
                value={newSale.Description}
                onChange={handleInputChange}
                placeholder="Enter garage sale description..."
                minRows={3}
              />
            </div>
            <div className="form-buttons">
              <button type="submit">Save</button>
              <button type="button" onClick={handleCancelAdd}>Cancel</button>
            </div>
          </form>
        </div>
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
      </div>

      <div className="garage-sales-list">
        {filteredSales.length === 0 ? (
          <div className="no-results">No garage sales found</div>
        ) : (
          filteredSales.map(sale => (
            <div key={sale.id} className="garage-sale-item">
              <div className="sale-info">
                <h3>{sale.Address}</h3>
                <p>{sale.Description}</p>
              </div>
              <div className="sale-actions">
                <button
                  className="view-map-button"
                  onClick={() => handleViewOnMap(sale)}
                >
                  View on Map
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDelete(sale.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GarageSalesAdmin;
