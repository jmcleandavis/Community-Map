import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './GarageSales.css';
import { useGarageSales } from '../context/GarageSalesContext';
import { useAuth } from '../context/AuthContext';
import { useDisplay } from '../context/DisplayContext';
import { useSearch } from '../context/SearchContext';
import { useSelection } from '../context/SelectionContext';
import { useCommunitySales } from '../context/CommunitySalesContext';
import LoginRequiredModal from '../components/LoginRequiredModal';
import api from '../utils/api';

const GarageSales = () => {
  const {
    garageSales,
    loading,
    error,
    fetchGarageSales
  } = useGarageSales();
  
  const { searchTerm, handleSearchChange } = useSearch();
  const { selectedSales, handleCheckboxChange, handleDeselectAll } = useSelection();
  const { showOnlySelected, toggleDisplayMode } = useDisplay();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userEmail, userInfo } = useAuth();
  const { communitySalesEventName, setCommunitySalesEventName, currentCommunityId, setCurrentCommunityId } = useCommunitySales();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [communityId, setCommunityId] = useState(currentCommunityId || null);
  const [communityName, setCommunityName] = useState(communitySalesEventName || '');

  // Extract communityId from URL parameters and update context/state
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('communityId');
    
    if (id) {
      // Update local state
      setCommunityId(id);
      // Update context
      setCurrentCommunityId(id);
      
      // If we don't have the community name in context, fetch it
      if (!communitySalesEventName) {
        console.log('GarageSales: Community name not in context, fetching from API');
        const fetchCommunityName = async () => {
          try {
            const apiUrl = `${import.meta.env.VITE_MAPS_API_URL}/v1/communitySales/${id}`;
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'app-name': 'web-service',
                'app-key': import.meta.env.VITE_APP_SESSION_KEY
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const name = data.name || 'Community Sale';
              setCommunityName(name);
              setCommunitySalesEventName(name); // Also update the context
            }
          } catch (error) {
            console.error('Error fetching community name:', error);
          }
        };
        
        fetchCommunityName();
      } else {
        console.log('GarageSales: Using community name from context:', communitySalesEventName);
        setCommunityName(communitySalesEventName);
      }
    }
  }, [location, communitySalesEventName, setCurrentCommunityId, setCommunitySalesEventName]);

  // Fetch garage sales, filtered by communityId if available
  useEffect(() => {
    fetchGarageSales(communityId);
  }, [fetchGarageSales, communityId]);

  // Effect to fetch user's saved address list from server if user is logged in - only runs once on mount
  useEffect(() => {
    const fetchUserAddressList = async () => {
      if (isAuthenticated && userInfo?.userId) {
        try {
          console.log('Fetching user address list for user:', userInfo.userId);
          const userAddressList = await api.getUserAddressList(userInfo.userId);
          
          if (userAddressList && userAddressList.addressList && userAddressList.addressList.length > 0) {
            console.log('User has saved address list on server:', userAddressList.addressList);
            
            // Convert the array to a Set for the selection context
            const serverSelectedSales = new Set(userAddressList.addressList);
            
            // Update the selected sales in the selection context
            // This will override any locally stored selections
            handleDeselectAll(); // Clear existing selections first
            
            // Add each server-side selection
            serverSelectedSales.forEach(saleId => {
              handleCheckboxChange(saleId);
            });
            
            console.log('Updated selections from server list');
          } else {
            console.log('User does not have a saved address list on server, using local selections');
          }
        } catch (error) {
          console.error('Error fetching user address list:', error);
          // If there's an error, we'll fall back to the local storage selections
        }
      }
    };
    
    fetchUserAddressList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSelectionWithAuth = (saleId) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // Just update local selection state without server calls
    handleCheckboxChange(saleId);
  };

  const handleViewOnMap = (sale) => {
    const saleToView = {
      ...sale,
      lat: sale.position.lat,
      lng: sale.position.lng,
      address: sale.address,
      description: sale.description
    };
    
    localStorage.setItem('selectedSales', JSON.stringify([saleToView]));
    navigate(`/?communityId=${currentCommunityId || ''}`);
  };

  const handleDeselectAllWithServerUpdate = async () => {
    // First, clear the local selections
    handleDeselectAll();
    
    // Then, if user is authenticated, update the server with an empty list
    if (isAuthenticated && userInfo?.userId) {
      try {
        console.log('Updating server with empty selection list for user:', userInfo.userId);
        
        // Call API with empty array for addressList
        const response = await api.createUpdateUserAddressList(userInfo.userId, []);
        console.log('Successfully updated server with empty selection list:', response);
      } catch (error) {
        console.error('Error updating server with empty selection list:', error);
      }
    }
  };

  const handleViewSelected = async () => {
    const selectedSalesData = filteredSales
      .filter(sale => selectedSales.has(sale.id));

    if (selectedSalesData.length > 0) {
      // If user is authenticated, save the selection to the server
      if (isAuthenticated && userInfo?.userId) {
        try {
          console.log('Saving selected sales to server for user:', userInfo.userId);
          
          // Extract just the IDs for the server request
          const selectedSaleIds = Array.from(selectedSales);
          
          // Save the selected sales to the server
          const response = await api.createUpdateUserAddressList(userInfo.userId, selectedSaleIds);
          console.log('Successfully saved selected sales to server:', response);
          
          // Optional: Show a success message
          // alert('Your selected garage sales have been saved to your account.');
        } catch (error) {
          console.error('Error saving selected sales to server:', error);
          // Continue with navigation even if server save fails
          // We don't want to block the user from viewing their selections
        }
      } else {
        console.log('User not authenticated, skipping server save of selected sales');
      }
      
      // If not already showing only selected sales, turn it on
      if (!showOnlySelected) {
        toggleDisplayMode();
      }
      
      // Navigate to the map page to view the selected sales
      navigate(`/?communityId=${currentCommunityId || ''}`);
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
      <h1>{communityName ? `${communityName}` : 'Garage Sales'}</h1>
      {isAuthenticated && (
        <div className="user-info">
          <div className="user-name">{userInfo?.fName} {userInfo?.lName}</div>
          <div className="user-email">{userEmail}</div>
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

        <div className="selection-controls">
          {selectedSales.size > 0 && (
            <>
              <button 
                className="select-all-button"
                onClick={handleDeselectAllWithServerUpdate}
              >
                Deselect All
              </button>
              <button 
                className="view-selected-button"
                onClick={handleViewSelected}
              >
                View and Save Selected ({selectedSales.size})
              </button>
            </>
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
                    onChange={() => handleSelectionWithAuth(sale.id)}
                  />
                  <span className="checkmark"></span>
                </label>
              </div>
              <div className="sale-content">
                <h3>{sale.address || 'No Address Available'}</h3>
                <p>{sale.description || 'No Description Available'}</p>
              </div>
              {/* <button 
                className="view-map-button"
                onClick={() => handleViewOnMap(sale)}
              >
                View on Map
              </button> */}
            </div>
          ))}
        </div>
      )}

      <div className="total-count">
        Showing {filteredSales.length} of {garageSales.length} garage sales
        {selectedSales.size > 0 && ` (${selectedSales.size} selected)`}
      </div>
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
};

export default GarageSales;
