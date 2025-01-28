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
  const [newSale, setNewSale] = useState({
    address: '',
    description: ''
  });

  const handleAddNew = () => {
    setIsAddingNew(true);
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
    setNewSale({
      address: '',
      description: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSale(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement API call to add new garage sale
    console.log('Adding new garage sale:', newSale);
    setIsAddingNew(false);
    setNewSale({
      address: '',
      description: ''
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
      lng: sale.position.lng
    };
    
    localStorage.setItem('selectedSales', JSON.stringify([saleToView]));
    navigate('/');
  };

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
                name="address"
                value={newSale.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <AutoResizeTextArea
                name="description"
                value={newSale.description}
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

      <div className="sales-grid">
        {garageSales && garageSales.length > 0 ? (
          garageSales.map(sale => (
            <div key={sale.id} className="sale-card">
              <h3>{sale.address}</h3>
              <p>{sale.description}</p>
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
        ) : (
          <div className="no-results">No garage sales found</div>
        )}
      </div>
    </div>
  );
};

export default GarageSalesAdmin;
