import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGarageSales } from '../context/GarageSalesContext';
import { useAuth } from '../context/AuthContext';
import { useDisplay } from '../context/DisplayContext';
import { useSearch } from '../context/SearchContext';
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
  const { communitySaleId } = useParams();
  const { isAuthenticated, userEmail, userInfo } = useAuth();
  const { searchTerm, handleSearchChange } = useSearch();
  
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
  const [communitySale, setCommunitySale] = useState(null);
  const [associatedGarageSales, setAssociatedGarageSales] = useState([]);
  
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

  // Fetch community sale and associated garage sales when communitySaleId is available
  useEffect(() => {
    const fetchCommunitySaleData = async () => {
      if (communitySaleId) {
        try {
          // Fetch the community sale details
          const response = await api.getCommunitySaleById(communitySaleId);
          setCommunitySale(response);
          
          // Fetch garage sales associated with this community sale
          const associatedSales = await api.getGarageSalesByCommunitySale(communitySaleId);
          setAssociatedGarageSales(associatedSales);
          
          // Pre-select the associated garage sales in the admin UI
          const associatedIds = new Set(associatedSales.map(sale => sale.id));
          setAdminSelectedSales(associatedIds);
        } catch (error) {
          console.error('Error fetching community sale data:', error);
          setSubmitError('Failed to load community sale data. Please try again.');
        }
      }
    };
    
    fetchCommunitySaleData();
  }, [communitySaleId]);

  // Refresh garage sales data when component mounts
  useEffect(() => {
    fetchGarageSales();
  }, []);

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
    // Scroll to the top of the page to make the form visible
    window.scrollTo(0, 0);
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
        // Prepare the update data based on what changed
        const updateData = {};
        
        // Check if address was updated
        if (formData.address !== editingSale.address) {
          // Parse address components
          const addressParts = parseAddress(formData.address);
          updateData.address = {
            street: addressParts.street,
            streetNum: addressParts.streetNumber,
            city: addressParts.city,
            provState: addressParts.state,
            postalZipCode: '',
            unit: ''
          };
        }
        
        // Check if description was updated
        if (formData.description !== editingSale.description) {
          updateData.description = formData.description;
        }
        
        // Only make the API call if there are changes to update
        if (Object.keys(updateData).length > 0) {
          await api.updateGarageSale(editingSale.id, updateData);
        }
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
      // Force refresh the list after adding/editing
      await fetchGarageSales(true);
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
        
        // Force refresh the garage sales list to update the UI
        await fetchGarageSales(true);
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
        
        // Force refresh the garage sales list to update the UI
        await fetchGarageSales(true);
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
    const selectedSalesData = filteredSales
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

  // Filter garage sales based on search term
  const filteredSales = garageSales.filter(sale => 
    (sale.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle selection of all sales
  const handleSelectAll = () => {
    const allIds = new Set(garageSales.map(sale => sale.id));
    setAdminSelectedSales(allIds);
  };

  // Handle deselection of all sales
  const handleDeselectAll = () => {
    setAdminSelectedSales(new Set());
  };

  // Handle associating selected garage sales with the community sale
  const handleAssociateGarageSales = async () => {
    if (!communitySaleId) return;
    
    try {
      const selectedIds = Array.from(adminSelectedSales);
      
      // Get currently associated sale IDs
      const currentlyAssociatedIds = associatedGarageSales.map(sale => sale.id);
      
      // Find sales to add (selected but not currently associated)
      const salesToAdd = selectedIds.filter(id => !currentlyAssociatedIds.includes(id));
      
      // Find sales to remove (currently associated but not selected)
      const salesToRemove = currentlyAssociatedIds.filter(id => !adminSelectedSales.has(id));
      
      // Add new associations
      for (const saleId of salesToAdd) {
        await api.addGarageSaleToCommunitySale(communitySaleId, saleId);
      }
      
      // Remove old associations
      for (const saleId of salesToRemove) {
        await api.removeGarageSaleFromCommunitySale(communitySaleId, saleId);
      }
      
      // Refresh associated garage sales
      const updatedAssociatedSales = await api.getGarageSalesByCommunitySale(communitySaleId);
      setAssociatedGarageSales(updatedAssociatedSales);
      
      // Show success message
      alert(`Successfully updated garage sales for the community sale.`);
    } catch (error) {
      console.error('Error associating garage sales:', error);
      setSubmitError('Failed to update community sale associations. Please try again.');
    }
  };

  // Return to the community sales admin page
  const handleBackToCommunitySales = () => {
    navigate('/admin/community-sales');
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
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by address or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        {adminSelectedSales.size > 0 && (
          <>
            <button 
              className="select-all-button"
              onClick={handleSelectAll}
            >
              Select All
            </button>
            <button 
              className="deselect-all-button"
              onClick={handleDeselectAll}
            >
              Deselect All
            </button>
            <button 
              className="delete-selected-button"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({adminSelectedSales.size})
            </button>
            <button 
              className="associate-button"
              onClick={handleAssociateGarageSales}
            >
              Associate with Community Sale
            </button>
          </>
        )}
        
        <button 
          className="back-button"
          onClick={handleBackToCommunitySales}
        >
          Back to Community Sales
        </button>
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
        {filteredSales && filteredSales.length > 0 ? (
          filteredSales.map(sale => (
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
      
      <div className="total-count">
        Showing {filteredSales.length} of {garageSales.length} garage sales
        {adminSelectedSales.size > 0 && ` (${adminSelectedSales.size} selected)`}
      </div>
    </div>
  );
};

export default GarageSalesAdmin;
