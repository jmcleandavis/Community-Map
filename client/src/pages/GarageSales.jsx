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
  const { communityName, setCommunityName, communityId, setCommunityId } = useCommunitySales();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOptimizeRoute, setShowOptimizeRoute] = useState(false);
  const [optimizedRouteAddresses, setOptimizedRouteAddresses] = useState([]);
  const [showRouteList, setShowRouteList] = useState(false);



  // Extract communityId from URL parameters and update context/state
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('communityId');
    
    if (id) {
      // Update local state
      setCommunityId(id);
      // Update context
      setCommunityId(id);
      
      // If we don't have the community name in context, fetch it
      if (!communityName) {
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
              setCommunityName(name); // Also update the context
            }
          } catch (error) {
            console.error('Error fetching community name:', error);
          }
        };
        
        fetchCommunityName();
      } else {
        console.log('GarageSales: Using community name from context:', communityName);
        setCommunityName(communityName);
      }
    }
  }, [location, communityName, setCommunityId, setCommunityName]);

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
    navigate(`/?communityId=${communityId || ''}`);
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
    // Filter sales to only include those from the current communityId
    // and that are also in the selectedSales set
    const selectedSalesData = filteredSales
      .filter(sale => selectedSales.has(sale.id));

    if (selectedSalesData.length > 0) {
      // If user is authenticated, save the selection to the server
      if (isAuthenticated && userInfo?.userId) {
        try {
          console.log('Saving selected sales to server for user:', userInfo.userId);
          
          // Extract just the IDs for the server request, but only for the current communityId
          // This ensures we're not including sales from other community events
          const selectedSaleIds = selectedSalesData.map(sale => sale.id);
          
          console.log(`Filtered ${selectedSales.size} total selected sales to ${selectedSaleIds.length} sales for current community ID: ${communityId}`);
          
          // Save the selected sales to the server with the current communityId
          const response = await api.createUpdateUserAddressList(userInfo.userId, selectedSaleIds, communityId);
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
      
      // Store only the selected sales for this community in localStorage
      localStorage.setItem('selectedSales', JSON.stringify(selectedSalesData));
      
      // Navigate to the map page to view the selected sales
      navigate(`/?communityId=${communityId || ''}`);
    } else {
      alert('Please select at least one garage sale to view on the map.');
    }
  };

  const handleOptimizeRoute = async () => {
    // If there are selected sales and the user is authenticated, save them to the backend first
    if (selectedSales.size > 0 && isAuthenticated && userInfo?.userId) {
      try {
        console.log('Saving selected sales to server before optimization for user:', userInfo.userId);
        
        // Filter sales to only include those from the current communityId
        // and that are also in the selectedSales set
        const selectedSalesData = filteredSales
          .filter(sale => selectedSales.has(sale.id));
        
        // Extract just the IDs for the server request
        const selectedSaleIds = selectedSalesData.map(sale => sale.id);
        
        console.log(`Saving ${selectedSaleIds.length} selected sales for current community ID: ${communityId}`);
        
        // Save the selected sales to the server with the current communityId
        const response = await api.createUpdateUserAddressList(userInfo.userId, selectedSaleIds, communityId);
        console.log('Successfully saved selected sales to server before optimization:', response);
      } catch (error) {
        console.error('Error saving selected sales to server before optimization:', error);
        // Continue with optimization even if server save fails
        // We don't want to block the user from optimizing their route
      }
    }
    
    // Show the optimize route view to let the user select a starting point
    // This will eventually call handleSelectFirstVisit with the appropriate endpoint
    // based on whether there are selected sales or not
    setShowOptimizeRoute(true);
  };
  
  const handleFullRouteOptimization = async () => {
    try {
      console.log('Getting full route optimization');
      
      // Get sessionId from localStorage
      const sessionId = localStorage.getItem('sessionId');
      
      // Make API call to get optimized route without a specific starting point
      let optimizedRouteData = null;
      
      const response = await fetch(`${import.meta.env.VITE_MAPS_API_URL}/v1/getOptimzedRoute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'app-key': import.meta.env.VITE_APP_API_KEY,
          'app-name': 'postman-call',
          'sessionId': sessionId
        },
        body: JSON.stringify({
          communityId: communityId
          // No startingAddressId means the API will optimize the full route
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      optimizedRouteData = await response.json();
      console.log('API Response:', optimizedRouteData);
      
      // Process the response
      if (optimizedRouteData && optimizedRouteData.orderedWaypoints) {
        console.log('Using optimized route data:', optimizedRouteData);
        
        // Store the optimized route data in localStorage for the map to use
        localStorage.setItem('optimizedRoute', JSON.stringify(optimizedRouteData));
        
        // Set the optimized route addresses for display
        setOptimizedRouteAddresses(optimizedRouteData.orderedWaypoints);
        
        // Show the route list
        setShowRouteList(true);
      } else {
        throw new Error('Invalid route data received');
      }
      
    } catch (error) {
      console.error('Error getting optimized route:', error);
      // Show user-friendly error message
      alert(`Error optimizing route: ${error.message}`);
    }
  };

  const handleSelectFirstVisit = async (saleId) => {
    try {
      console.log('Selected first visit:', saleId);
      
      // Get sessionId from localStorage
      const sessionId = localStorage.getItem('sessionId');
      
      // Make API call to get optimized route
      let optimizedRouteData = null;
      
      // Make API call to get optimized route
      // Use different endpoints based on whether there are selected sales or not
      const endpoint = selectedSales.size > 0 
        ? `${import.meta.env.VITE_MAPS_API_URL}/v1/getOptimzedRoute/bySavedList`
        : `${import.meta.env.VITE_MAPS_API_URL}/v1/getOptimzedRoute`;
      
      // Prepare the request payload based on the endpoint
      const payload = selectedSales.size > 0
        ? {
            startingAddressId: saleId,
            communityId: communityId,
            userId: userInfo?.userId || ''
          }
        : {
            startingAddressId: saleId,
            communityId: communityId
          };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'app-key': import.meta.env.VITE_APP_API_KEY,
          'app-name': 'postman-call',
          'sessionId': sessionId
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      optimizedRouteData = await response.json();
      console.log('API Response:', optimizedRouteData);
      
      // Process the response
      if (optimizedRouteData && optimizedRouteData.orderedWaypoints) {
        console.log('Using optimised route data:', optimizedRouteData);
        
        // Create a map of addresses to sale data for matching
        const addressToSaleMap = {};
        
        // Build a map of normalized addresses to their corresponding sale data
        garageSales.forEach(sale => {
          if (sale.address) {
            // Normalize the address by removing extra spaces and converting to lowercase
            const normalizedAddress = sale.address.toLowerCase().replace(/\s+/g, ' ').trim();
            addressToSaleMap[normalizedAddress] = sale;
          }
        });
        
        console.log('Address to sale map created with', Object.keys(addressToSaleMap).length, 'entries');
        
        // Process the ordered waypoints from the API
        const filteredWaypoints = [];
        console.log('Ordered waypoints from API:', optimizedRouteData.orderedWaypoints);
        
        // Process each waypoint in the optimized route
        optimizedRouteData.orderedWaypoints.forEach((waypoint, index) => {
          // Get the address from the waypoint
          let waypointAddress = '';
          
          // Handle different possible formats of the waypoint data
          if (typeof waypoint === 'string') {
            waypointAddress = waypoint;
          } else if (waypoint && typeof waypoint === 'object') {
            waypointAddress = waypoint.address || waypoint.location || '';
          }
          
          console.log(`Processing waypoint ${index + 1}:`, waypointAddress);
          
          if (waypointAddress) {
            // Normalize the address for matching
            const normalizedAddress = waypointAddress.toLowerCase().replace(/\s+/g, ' ').trim();
            
            // Find the matching sale by address
            const matchingSale = addressToSaleMap[normalizedAddress];
            
            if (matchingSale) {
              console.log('Found matching sale with ID:', matchingSale.id);
              
              // Add the waypoint with the correct ID and position information
              filteredWaypoints.push({
                id: matchingSale.id,
                address: matchingSale.address,
                description: matchingSale.description,
                position: matchingSale.position,
                // Add the position in the optimized route
                routeOrder: index + 1
              });
            } else {
              console.log('No matching sale found for address:', waypointAddress);
              
              // Include the waypoint even without a matching sale
              filteredWaypoints.push({
                address: waypointAddress,
                description: `Stop ${index + 1}`,
                routeOrder: index + 1
              });
            }
          }
        });
        
        console.log('Filtered waypoints with route order:', filteredWaypoints);
        
        // Create a modified optimized route data with only selected sales
        const filteredOptimizedRouteData = {
          ...optimizedRouteData,
          orderedWaypoints: filteredWaypoints
        };
        
        // Store the filtered optimized route data in localStorage for the map to use
        localStorage.setItem('optimizedRoute', JSON.stringify(filteredOptimizedRouteData));
        
        // Set the optimized route addresses for display
        setOptimizedRouteAddresses(filteredWaypoints);
        
        // Close the optimize route view and show the route list
        setShowOptimizeRoute(false);
        setShowRouteList(true);
      } else {
        throw new Error('Invalid route data received');
      }
      
    } catch (error) {
      console.error('Error getting optimised route:', error);
      // Show user-friendly error message
      alert(`Error optimising route: ${error.message}`);
    }
  };

  const handleBackToSelection = () => {
    setShowOptimizeRoute(false);
    setShowRouteList(false);
  };
  
  const handleProceedToMap = () => {
    // Set display mode to show optimized route
    toggleDisplayMode('optimizedRoute');
    
    // Navigate to map view with parameters
    navigate(`/?communityId=${communityId}&showOptimizedRoute=true`);
    
    // Close the route list view
    setShowRouteList(false);
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

  // Get selected sales for display
  const selectedSalesData = garageSales.filter(sale => selectedSales.has(sale.id));

  // Show optimized route list if active
  if (showRouteList && optimizedRouteAddresses.length > 0) {
    return (
      <div className="garage-sales-container">
        <h1>{communityName ? `${communityName} - Optimised Route` : 'Optimised Route'}</h1>
        
        <div className="optimize-route-instructions">
          <p><strong>Your optimised route in order of visits:</strong></p>
        </div>
        
        <div className="optimized-addresses-list">
          {optimizedRouteAddresses.map((waypoint, index) => (
            <div key={index} className="optimized-address-item">
              <div className="address-number">{index + 1}</div>
              <div className="address-content">
                <div className="address-text">{waypoint.address || 'No Address Available'}</div>
                <div className="address-description">{waypoint.description || ''}</div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="optimize-buttons">
          <button 
            className="back-button"
            onClick={handleBackToSelection}
          >
            ← Back to Selection
          </button>
          <button 
            className="proceed-button"
            onClick={handleProceedToMap}
          >
            View on Map
          </button>
        </div>
      </div>
    );
  }
  
  // Show optimize route view if active
  if (showOptimizeRoute) {
    // Use all sales data if there are no selections, otherwise use selected sales
    const salesToDisplay = selectedSales.size > 0 ? selectedSalesData : filteredSales;
    const displayMessage = selectedSales.size > 0 ? 
      `Showing ${salesToDisplay.length} selected garage sales` : 
      `Showing all ${salesToDisplay.length} garage sales`;
    
    return (
      <div className="garage-sales-container">
        <h1>{communityName ? `${communityName} - Optimised Route` : 'Optimised Route'}</h1>
        <div className="optimize-route-instructions">
          <p><strong>Click on the address which will be your first visit</strong></p>
        </div>
        
        <button 
          className="back-button"
          onClick={handleBackToSelection}
        >
          ← Back to Selection
        </button>

        <div className="garage-sales-list">
          {salesToDisplay.map((sale) => (
            <div 
              key={sale.id} 
              className="garage-sale-card clickable-card"
              onClick={() => handleSelectFirstVisit(sale.id)}
            >
              <div className="sale-content">
                <h3>{sale.address || 'No Address Available'}</h3>
                <p>{sale.description || 'No Description Available'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="total-count">
          {displayMessage}
        </div>
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
          {selectedSales.size > 0 ? (
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
          ) : null}
          <button 
            className="view-selected-button"
            onClick={handleOptimizeRoute}
          >
            {selectedSales.size > 0 ? 'Optimise Selected Route' : 'Optimise Full Route'}
          </button>
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
