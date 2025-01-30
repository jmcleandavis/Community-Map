import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGarageSales } from '../context/GarageSalesContext';
import AutoResizeTextArea from '../components/AutoResizeTextArea';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import './GarageSalesAdmin.css';

const GarageSalesAdmin = () => {
  const {
    garageSales,
    loading,
    error,
    fetchGarageSales,
  } = useGarageSales();
  
  const navigate = useNavigate();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    address: '',
    description: ''
  });

  const handleAddNew = () => {
    setEditingSale(null);
    setFormData({
      address: '',
      description: ''
    });
    setIsAddingNew(true);
  };

  const handleEdit = (sale) => {
    setIsAddingNew(false);
    setEditingSale(sale);
    setFormData({
      address: sale.address,
      description: sale.description
    });
  };

  const handleCancelEdit = () => {
    setEditingSale(null);
    setFormData({
      address: '',
      description: ''
    });
    setIsAddingNew(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressSelect = (selected) => {
    setFormData(prev => ({
      ...prev,
      address: selected.label
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingSale) {
      // TODO: Implement API call to update garage sale
      console.log('Updating garage sale:', editingSale.id, formData);
    } else {
      // TODO: Implement API call to add new garage sale
      console.log('Adding new garage sale:', formData);
    }
    setIsAddingNew(false);
    setEditingSale(null);
    setFormData({
      address: '',
      description: ''
    });
    // Refresh the list after adding/editing
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
        {!isAddingNew && !editingSale && (
          <button onClick={handleAddNew}>Add New Garage Sale</button>
        )}
      </div>

      {(isAddingNew || editingSale) && (
        <div className="add-sale-form">
          <h2>{editingSale ? 'Edit Garage Sale' : 'Add New Garage Sale'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Address:</label>
              <GooglePlacesAutocomplete
                apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                selectProps={{
                  value: { label: formData.address, value: formData.address },
                  onChange: handleAddressSelect,
                  placeholder: 'Enter address...',
                }}
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <AutoResizeTextArea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter garage sale description..."
                minRows={3}
              />
            </div>
            <div className="form-buttons">
              <button type="submit">
                {editingSale ? 'Save Changes' : 'Save'}
              </button>
              <button type="button" onClick={handleCancelEdit}>
                Cancel
              </button>
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
                  className="edit-button"
                  onClick={() => handleEdit(sale)}
                >
                  Edit
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
