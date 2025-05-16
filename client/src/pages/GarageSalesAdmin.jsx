import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useGarageSales } from '../context/GarageSalesContext';
import { useAuth } from '../context/AuthContext';
import { useDisplay } from '../context/DisplayContext';
import { useSearch } from '../context/SearchContext';
import { useCommunitySales } from '../context/CommunitySalesContext';
import AutoResizeTextArea from '../components/AutoResizeTextArea';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import api from '../utils/api';
import styles from './GarageSalesAdmin.module.css';

const GarageSalesAdmin = () => {
  const {
    garageSales,
    loading,
    error,
    fetchGarageSales,
  } = useGarageSales();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userEmail, userInfo } = useAuth();
  const { searchTerm, handleSearchChange } = useSearch();
  const { communitySalesEventName, currentCommunityId } = useCommunitySales();
  
  // State for community ID and name
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('communityId');
  console.warn('GarageSalesAdmin: Extracted communityId from URL:', id);
  const [communityId, setCommunityId] = useState(id || currentCommunityId);
  // Use the community name from context if available, otherwise it will be fetched
  const [communityName, setCommunityName] = useState(communitySalesEventName || '');
  
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
  
  // Update state when context or URL parameters change
  useEffect(() => {
    console.log('GarageSalesAdmin: Context values:', { communitySalesEventName, currentCommunityId });
    
    // If we have a community name from context, use it
    if (communitySalesEventName && communitySalesEventName !== communityName) {
      console.log('GarageSalesAdmin: Setting community name from context:', communitySalesEventName);
      setCommunityName(communitySalesEventName);
    }
    
    // Get communityId from URL or context
    const newId = queryParams.get('communityId') || currentCommunityId;
    if (newId && newId !== communityId) {
      console.log('GarageSalesAdmin: Community ID changed, updating state:', newId);
      setCommunityId(newId);
      // Reset selections when community changes
      setAdminSelectedSales(new Set());
      // Force a refresh of garage sales data with the new communityId
      fetchGarageSales(newId, true);
    }
  }, [location.search, fetchGarageSales, communitySalesEventName, currentCommunityId]);

  // Extract communityId from URL parameters
  useEffect(() => {
    // Only fetch community name if it's not already available in the context
    if (!communitySalesEventName && communityId) {
      console.log('GarageSalesAdmin: Community name not in context, fetching from API');
      
      // Fetch community name based on ID
      const fetchCommunityName = async () => {
        try {
          const apiUrl = `${import.meta.env.VITE_MAPS_API_URL}/v1/getAddressByCommunity/${communityId}`;
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'app-name': 'web-service',
              'app-key': import.meta.env.VITE_APP_SESSION_KEY
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setCommunityName(data.name || 'Community Sale');
          }
        } catch (error) {
          console.error('Error fetching community name:', error);
        }
      };
      
      fetchCommunityName();
    } else if (communitySalesEventName) {
      console.log('GarageSalesAdmin: Using community name from context:', communitySalesEventName);
    }
  }, [communityId, communitySalesEventName]);
  
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



  // Refresh garage sales data when component mounts or communityId changes
  useEffect(() => {
    if (communityId) {
      console.log('GarageSalesAdmin: Fetching garage sales for communityId:', communityId);
      // Always force a refresh when the communityId changes
      fetchGarageSales(communityId, true);
    }
  }, [fetchGarageSales, communityId]);

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
          [], // Empty highlighted items
          communityId // Pass the current community ID
        );
      }
      
      setIsAddingNew(false);
      setEditingSale(null);
      setFormData({
        address: '',
        description: ''
      });
      // Force refresh the list after adding/editing
      // Pass the communityId as the first parameter and true as the second parameter to force refresh
      await fetchGarageSales(communityId, true);
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
    navigate(`/?communityId=${currentCommunityId || ''}`);
  };
  
  // Function to handle QR code generation for the community map
  const handleCreateQRCode = () => {
    // Use the environment variable for the community map URL
    const baseUrl = import.meta.env.VITE_COMMUNITYMAP_API_URL;
    const mapUrl = `${baseUrl}/?communityId=${currentCommunityId || ''}`;
    
    // Use a free QR code generation service
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(mapUrl)}`;
    
    // Create a custom HTML page with white background and title
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Community Garage Sale QR Code</title>
        <style>
          body {
            background-color: white;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
          }
          .qr-container {
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            background-color: white;
          }
          .instructions {
            margin-top: 20px;
            text-align: center;
            color: #666;
            max-width: 500px;
          }
        </style>
      </head>
      <body>
        <h1>Community Garage Sale</h1>
        <div class="qr-container">
          <img src="${qrCodeUrl}" alt="QR Code for Community Garage Sale" />
        </div>
        <div class="instructions">
          <p>Scan this QR code to access the Community Garage Sale map on your mobile device.</p>
          <p>You can print this page or save the QR code image for distribution.</p>
        </div>
      </body>
      </html>
    `;
    
    // Create a blob from the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    
    // Open the custom HTML page in a new tab
    const newTab = window.open(blobUrl, '_blank');
    
    // Clean up the blob URL when the tab is closed
    if (newTab) {
      newTab.onload = () => {
        // This will execute when the new tab has loaded
        URL.revokeObjectURL(blobUrl);
      };
    }
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
    <div className={styles.garageSalesAdmin}>
      <h1 className={styles.title}>{communityName ? `${communityName}` : 'Garage Sales Administration'}</h1>
      <div className={styles.userInfo}>
        <div className={styles.userName}>{userInfo?.fName} {userInfo?.lName}</div>
        <div className={styles.userEmail}>{userEmail}</div>
      </div>
      
      <div className={styles.adminControls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by address or description..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.buttonsContainer}>
          <button 
            className={styles.addNewButton}
            onClick={handleAddNew}
            disabled={isAddingNew}
          >
            Add New Garage Sale
          </button>
          
          <button
            className={styles.qrCodeButton}
            onClick={handleCreateQRCode}
          >
            Create QR Code
          </button>
          
          {adminSelectedSales.size > 0 && (
            <>
              <button 
                className={styles.selectAllButton}
                onClick={handleSelectAll}
              >
                Select All
              </button>
              <button 
                className={styles.deselectAllButton}
                onClick={handleDeselectAll}
              >
                Deselect All
              </button>
              <button 
                className={styles.deleteSelectedButton}
                onClick={handleDeleteSelected}
              >
                Delete Selected ({adminSelectedSales.size})
              </button>
            </>
          )}
          
          <button 
            className={styles.backToCommunityButton}
            onClick={handleBackToCommunitySales}
          >
            Back to Community Sales
          </button>
        </div>
      </div>

      {(isAddingNew || editingSale) && (
        <form onSubmit={handleSubmit} className={styles.garageForm}>
          <div className={styles.formGroup}>
            <label>Address:</label>
            <GooglePlacesAutocomplete
              selectProps={{
                value: { label: formData.address, value: formData.address },
                onChange: (selected) => handleAddressSelect(selected),
                placeholder: "Enter address..."
              }}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description:</label>
            <AutoResizeTextArea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter description..."
              minRows={6}
              className={styles.descriptionTextarea}
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.saveButton}>
              {editingSale ? 'Save Changes' : 'Create Garage Sale'}
            </button>
            <button type="button" className={styles.cancelButton} onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className={styles.salesGrid}>
        {filteredSales && filteredSales.length > 0 ? (
          filteredSales.map(sale => (
            <div key={sale.id} className={styles.saleCard}>
              <div className={styles.cardHeader}>
                <label className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    checked={adminSelectedSales.has(sale.id)}
                    onChange={() => handleAdminCheckboxChange(sale.id)}
                  />
                  <span className={styles.checkmark}></span>
                </label>
              </div>
              <h3>{sale.address}</h3>
              <p>{sale.description}</p>
              <div className={styles.saleActions}>
                {/* <button
                  className={styles.viewMapButton}
                  onClick={() => handleViewOnMap(sale)}
                >
                  View on Map
                </button> */}
                <button
                  className={styles.editButton}
                  onClick={() => handleEdit(sale)}
                >
                  Edit
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(sale.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.noResults}>No garage sales found</div>
        )}
      </div>
      
      <div className={styles.totalCount}>
        Showing {filteredSales.length} of {garageSales.length} garage sales
        {adminSelectedSales.size > 0 && ` (${adminSelectedSales.size} selected)`}
      </div>
    </div>
  );
};

export default GarageSalesAdmin;
