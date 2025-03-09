import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGarageSales } from '../context/GarageSalesContext';
import { useAuth } from '../context/AuthContext';
import { useDisplay } from '../context/DisplayContext';
import AutoResizeTextArea from '../components/AutoResizeTextArea';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import api from '../utils/api';
import './GarageSalesAdmin.css';

const GarageSalesAdmin = () => {
  const {
    garageSales,
    loading,
    error,
    fetchGarageSales,
  } = useGarageSales();
  
  const navigate = useNavigate();
  const { isAuthenticated, userEmail, userInfo } = useAuth();
  
  // Create a separate state for admin selections
  const [adminSelectedSales, setAdminSelectedSales] = useState(new Set());
  
  const { showOnlySelected, toggleDisplayMode } = useDisplay();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    address: '',
    description: ''
  });
  const [submitError, setSubmitError] = useState('');

  // Load any previously saved admin selections
  useEffect(() => {
    const savedAdminSelections = localStorage.getItem('adminSelectedSaleIds');
    if (savedAdminSelections) {
      try {
        setAdminSelectedSales(new Set(JSON.parse(savedAdminSelections)));
      } catch (error) {
        console.error('Error parsing admin selections:', error);
      }
    }
  }, []);

  // Save admin selections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('adminSelectedSaleIds', JSON.stringify([...adminSelectedSales]));
  }, [adminSelectedSales]);

  const parseAddress = (addressString) => {
    // Example: "727 Balaton Ave, Pickering, ON"
    const parts = addressString.split(',').map(part => part.trim());
    const streetParts = parts[0].split(' ');
    
    return {
      streetNumber: streetParts[0],
      street: streetParts.slice(1).join(' '),
      city: parts[1] || '',
      state: parts[2] || '',
      postalCode: '',
      unit: ''
    };
  };

  const handleAddNew = () => {
    setEditingSale(null);
    setFormData({
      address: '',
      description: ''
    });
    setIsAddingNew(true);
    setSubmitError('');
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
      address: selected ? selected.label : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSale) {
        // TODO: Implement API call to update garage sale
        console.log('Updating garage sale:', editingSale.id, formData);
      } else {
        // Create new garage sale
        const addressData = parseAddress(formData.address);
        await api.createGarageSale(
          addressData,
          formData.description,
          "Garage Sale", // Default name
          [] // Empty highlighted items
        );
      }
      
      setIsAddingNew(false);
      setEditingSale(null);
      setFormData({
        address: '',
        description: ''
      });
      // Refresh the list after adding/editing
      await fetchGarageSales();
    } catch (error) {
      console.error('Error submitting garage sale:', error);
      if (error.message === 'A garage sale already exists at this address') {
        window.alert('A garage sale already exists at this address');
      } else {
        window.alert('Failed to save garage sale. Please try again.');
      }
    }
  };

  const handleDelete = async (saleId) => {
    if (window.confirm('Are you sure you want to delete this garage sale?')) {
      try {
        await api.deleteGarageSale(saleId);
        fetchGarageSales();
      } catch (error) {
        console.error('Error deleting garage sale:', error);
      }
    }
  };

  const handleAdminCheckboxChange = (saleId) => {
    setAdminSelectedSales(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(saleId)) {
        newSelected.delete(saleId);
      } else {
        newSelected.add(saleId);
      }
      return newSelected;
    });
  };

  const handleAdminDeselectAll = () => {
    setAdminSelectedSales(new Set());
  };

  const handleDeleteSelected = async () => {
    const selectedIds = Array.from(adminSelectedSales);
    
    if (selectedIds.length === 0) {
      alert('Please select garage sales to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected garage sales?`)) {
      try {
        // Use bulk deletion instead of deleting one by one
        await api.deleteGarageSale(selectedIds);
        
        // Refresh the list and clear selections
        fetchGarageSales();
        handleAdminDeselectAll();
      } catch (error) {
        console.error('Error deleting selected garage sales:', error);
        alert('An error occurred while deleting selected garage sales.');
      }
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

  const handleViewSelected = () => {
    const selectedSalesData = garageSales
      .filter(sale => adminSelectedSales.has(sale.id))
      .map(sale => ({
        ...sale,
        lat: sale.position.lat,
        lng: sale.position.lng,
        address: sale.address,
        description: sale.description
      }));

    if (selectedSalesData.length > 0) {
      localStorage.setItem('selectedSales', JSON.stringify(selectedSalesData));
      // If not already showing only selected sales, turn it on
      if (!showOnlySelected) {
        toggleDisplayMode();
      }
      navigate('/');
    } else {
      alert('Please select at least one garage sale to view on the map.');
    }
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
      <div className="user-info">
        <div className="user-name">{userInfo?.fName} {userInfo?.lName}</div>
        <div className="user-email">{userEmail}</div>
      </div>
      
      <div className="admin-controls">
        <button 
          className="add-new-button"
          onClick={handleAddNew}
          disabled={isAddingNew}
        >
          Add New Garage Sale
        </button>
        
        {adminSelectedSales.size > 0 && (
          <>
            <button 
              className="select-all-button"
              onClick={handleAdminDeselectAll}
            >
              Deselect All
            </button>
            <button 
              className="delete-selected-button"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({adminSelectedSales.size})
            </button>
          </>
        )}
      </div>

      {(isAddingNew || editingSale) && (
        <form onSubmit={handleSubmit} className="garage-sale-form">
          <div className="form-group">
            <label>Address:</label>
            <GooglePlacesAutocomplete
              selectProps={{
                value: { label: formData.address, value: formData.address },
                onChange: (selected) => handleAddressSelect(selected),
                placeholder: "Enter address..."
              }}
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <AutoResizeTextArea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter description..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="save-button">
              {editingSale ? 'Save Changes' : 'Create Garage Sale'}
            </button>
            <button type="button" className="cancel-button" onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="sales-grid">
        {garageSales && garageSales.length > 0 ? (
          garageSales.map(sale => (
            <div key={sale.id} className="sale-card">
              <div className="card-header">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={adminSelectedSales.has(sale.id)}
                    onChange={() => handleAdminCheckboxChange(sale.id)}
                  />
                  <span className="checkmark"></span>
                </label>
              </div>
              <h3>{sale.address}</h3>
              <p>{sale.description}</p>
              <div className="sale-actions">
                {/* <button
                  className="view-map-button"
                  onClick={() => handleViewOnMap(sale)}
                >
                  View on Map
                </button> */}
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
