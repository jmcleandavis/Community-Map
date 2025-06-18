import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './GarageSales.css'; // Reusing the same CSS
import { useAuth } from '../context/AuthContext';
import { useDisplay } from '../context/DisplayContext';
import { useSearch } from '../context/SearchContext';
import { useSelection } from '../context/SelectionContext';
import LoginRequiredModal from '../components/LoginRequiredModal';
import api from '../utils/api';

const SingleGarageSales = () => {
  const [garageSales, setGarageSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [communityName, setCommunityName] = useState('Garage Sales');
  
  // Optimize route state variables
  const [showOptimizeRoute, setShowOptimizeRoute] = useState(false);
  const [optimizedRouteAddresses, setOptimizedRouteAddresses] = useState([]);
  const [showRouteList, setShowRouteList] = useState(false);
  const [optimizeFullRoute, setOptimizeFullRoute] = useState(false);
  
  const { searchTerm, handleSearchChange } = useSearch();
  const { selectedSales, handleCheckboxChange, handleDeselectAll } = useSelection();
  const { showOnlySelected, toggleDisplayMode } = useDisplay();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userInfo, userEmail } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [userAddressList, setUserAddressList] = useState(null);
  const [selectionsInitialized, setSelectionsInitialized] = useState(false);

  // Fetch single garage sales from GENPUB community
  useEffect(() => {
    const fetchSingleGarageSales = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Use the environment variable for the API URL
        const apiUrl = `${import.meta.env.VITE_MAPS_API_URL}/v1/getAddressByCommunity/GENPUB`;
        console.log('SingleGarageSales: Fetching data from API URL:', apiUrl);
        
        // Try to get data from the API
        let data;
        try {
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'app-name': 'web-service',
              'app-key': import.meta.env.VITE_APP_SESSION_KEY
            }
          });
          
          if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
          }
          
          data = await response.json();
          console.log('SingleGarageSales: Data received from API:', data);
          
          // Store successful API response in sessionStorage for future use
          sessionStorage.setItem('garageSalesData', JSON.stringify(data));
        } catch (apiError) {
          console.error('Error fetching from API:', apiError);
          
          // Try to get data from sessionStorage as fallback
          const storedData = sessionStorage.getItem('garageSalesData');
          if (storedData) {
            console.log('Using cached data from sessionStorage');
            data = JSON.parse(storedData);
          } else {
            throw new Error('No cached data available and API request failed');
          }
        }
        
        // Process the response data properly
        console.log('Raw data to process:', data);
        
        // Based on the screenshots, the response structure is an array
        if (data && Array.isArray(data)) {
          const salesData = data.map(sale => {
            // Extract address data from the nested address object
            const addressObj = sale.address || {};
            
            // Create a formatted address string including all components
            const formattedAddress = [
              addressObj.streetNum, 
              addressObj.street, 
              addressObj.city, 
              addressObj.provState, 
              addressObj.postalZipCode
            ].filter(Boolean).join(', ');
            
            return {
              id: sale.id || `sale-${Math.random().toString(36).substr(2, 9)}`,
              address: formattedAddress,
              fullAddress: addressObj, // Store the full address object for reference
              description: sale.description || '',
              name: sale.name || 'GARAGE SALE',
              highlightedItems: Array.isArray(sale.highlightedItems) ? sale.highlightedItems.join(', ') : '',
              community: sale.community || 'GENPUB',
              position: {
                lat: parseFloat(addressObj.lat) || 0,
                lng: parseFloat(addressObj.long) || 0
              }
            };
          });
          
          console.log('Processed sales data:', salesData);
          setGarageSales(salesData);
        } else {
          console.log('No valid garage sales data found');
          setGarageSales([]);
        }
      } catch (err) {
        console.error('Error in garage sales processing:', err);
        setError('Failed to load garage sales. Please try again later.');
        setGarageSales([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSingleGarageSales();
  }, []);

  // Effect to fetch user's saved address list from server if user is logged in
  useEffect(() => {
    const fetchUserAddressList = async () => {
      if (isAuthenticated && userInfo?.userId) {
        try {
          console.log('SingleGarageSales: Fetching user address list for user:', userInfo.userId);
          const userAddressListResponse = await api.getUserAddressList(userInfo.userId);
          
          if (userAddressListResponse && userAddressListResponse.addressList && userAddressListResponse.addressList.length > 0) {
            console.log('SingleGarageSales: User has saved address list on server:', userAddressListResponse.addressList);
            setUserAddressList(userAddressListResponse.addressList);
          } else {
            console.log('SingleGarageSales: User does not have a saved address list on server, using local selections');
            setUserAddressList([]);
          }
        } catch (error) {
          console.error('SingleGarageSales: Error fetching user address list:', error);
          // If there's an error, we'll fall back to the local storage selections
          setUserAddressList([]);
        }
      }
    };
    
    fetchUserAddressList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to filter and apply user's selected sales when garage sales are loaded (GENPUB community only)
  useEffect(() => {
    if (userAddressList && garageSales && garageSales.length > 0 && !selectionsInitialized) {
      // Filter the selected sales to only include those from the GENPUB community
      let filteredSelectedSales = userAddressList;
      
      // Get the IDs of garage sales that belong to the GENPUB community
      const genpubGarageSaleIds = garageSales.map(sale => sale.id);
      
      // Filter the user's selected sales to only include those in the GENPUB community
      filteredSelectedSales = userAddressList.filter(selectedSaleId => 
        genpubGarageSaleIds.includes(selectedSaleId)
      );
      
      console.log('SingleGarageSales: Filtered selected sales for GENPUB community:', filteredSelectedSales);
      console.log('SingleGarageSales: GENPUB garage sale IDs:', genpubGarageSaleIds);
      
      // Convert the filtered array to a Set for the selection context
      const serverSelectedSales = new Set(filteredSelectedSales);
      
      // Update the selected sales in the selection context
      // This will override any locally stored selections
      handleDeselectAll(); // Clear existing selections first
      
      // Add each server-side selection that belongs to the GENPUB community
      serverSelectedSales.forEach(saleId => {
        handleCheckboxChange(saleId);
      });
      
      console.log('SingleGarageSales: Updated selections from server list (filtered for GENPUB community)');
      setSelectionsInitialized(true); // Mark selections as initialized
    }
  }, [userAddressList, garageSales]);

  // Handle optimize route functionality
  const handleOptimizeRoute = async () => {
    // Determine if we're optimizing the full route or just selected sales
    const isFullRouteOptimization = selectedSales.size === 0;
    setOptimizeFullRoute(isFullRouteOptimization);
    
    console.log(`Optimizing ${isFullRouteOptimization ? 'FULL route' : 'SELECTED sales route'}`);
    
    // If there are selected sales and the user is authenticated, save them to the backend first
    if (selectedSales.size > 0 && isAuthenticated && userInfo?.userId) {
      try {
        console.log('Saving selected sales to server before optimization for user:', userInfo.userId);
        
        // Filter sales to only include those that are selected
        const selectedSalesData = garageSales
          .filter(sale => selectedSales.has(sale.id));
        
        // Extract just the IDs for the server request
        const selectedSaleIds = selectedSalesData.map(sale => sale.id);
        
        console.log(`Saving ${selectedSaleIds.length} selected sales for GENPUB community`);
        
        // Save the selected sales to the server with GENPUB as communityId
        const response = await api.createUpdateUserAddressList(userInfo.userId, selectedSaleIds, 'GENPUB');
        console.log('Successfully saved selected sales to server before optimization:', response);
      } catch (error) {
        console.error('Error saving selected sales to server before optimization:', error);
        // Continue with optimization even if server save fails
        // We don't want to block the user from optimizing their route
      }
    }
    
    // Show the optimize route view to let the user select a starting point
    setShowOptimizeRoute(true);
  };

  const handleSelectFirstVisit = async (saleId) => {
    try {
      console.log('Selected first visit:', saleId);
      
      // Get sessionId from localStorage
      const sessionId = localStorage.getItem('sessionId');
      
      // Make API call to get optimized route
      let optimizedRouteData = null;
      
      // Use different endpoints based on whether we're optimizing full route or selected sales
      const endpoint = !optimizeFullRoute && selectedSales.size > 0 
        ? `${import.meta.env.VITE_MAPS_API_URL}/v1/getOptimzedRoute/bySavedList`
        : `${import.meta.env.VITE_MAPS_API_URL}/v1/getOptimzedRoute`;
      
      console.log(`Using endpoint: ${endpoint} (optimizeFullRoute=${optimizeFullRoute}, selectedSales.size=${selectedSales.size})`);
      
      // Prepare the request payload based on the endpoint
      const payload = !optimizeFullRoute && selectedSales.size > 0
        ? {
            startingAddressId: saleId,
            communityId: 'GENPUB',
            userId: userInfo?.userId || ''
          }
        : {
            startingAddressId: saleId,
            communityId: 'GENPUB'
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
        
        // Store the optimized route data in localStorage for the map to use
        localStorage.setItem('optimizedRoute', JSON.stringify(filteredOptimizedRouteData));
        
        // Set the optimized route addresses for display
        setOptimizedRouteAddresses(filteredWaypoints);
        
        // Show the route list
        setShowRouteList(true);
        setShowOptimizeRoute(false);
      } else {
        console.log('No optimized route data received or orderedWaypoints is empty');
        alert('No optimized route could be generated. Please try again.');
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
    // Get the optimized route data from localStorage
    const optimizedRouteData = JSON.parse(localStorage.getItem('optimizedRoute') || '{}');
    
    // If we have optimized route data and we're not doing a full route optimization
    if (optimizedRouteData.orderedWaypoints && !optimizeFullRoute) {
      // Filter the garage sales to only include those in the optimized route
      const optimizedSales = garageSales.filter(sale => 
        optimizedRouteData.orderedWaypoints.some(wp => wp.id === sale.id)
      );
      
      // Store only the optimized sales in localStorage
      localStorage.setItem('selectedSales', JSON.stringify(optimizedSales));
      
      // Make sure we're in selected sales mode
      if (!showOnlySelected) {
        toggleDisplayMode();
      }
    } else if (optimizeFullRoute) {
      // For full route optimization, show all markers
      toggleDisplayMode('showAll');
    }
    
    // Navigate to map view with parameters for GENPUB community
    navigate(`/?communityId=GENPUB&showOptimizedRoute=true`);
    
    // Close the route list view
    setShowRouteList(false);
  };

  const handleSelectionWithAuth = (saleId) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    handleCheckboxChange(saleId);
  };

  const handleDeselectAllWithServerUpdate = async () => {
    handleDeselectAll();
    
    // Also update the server if authenticated
    if (isAuthenticated && userInfo?.userId) {
      try {
        await api.createUpdateUserAddressList(userInfo.userId, [], 'GENPUB');
        console.log('Successfully cleared selections on server');
      } catch (error) {
        console.error('Error clearing selections on server:', error);
      }
    }
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
    navigate(`/?communityId=GENPUB`);
  };

  const handleViewSelected = async () => {
    // Filter sales to only include those that are in the selectedSales set
    const selectedSalesData = garageSales
      .filter(sale => selectedSales.has(sale.id));

    if (selectedSalesData.length > 0) {
      // If user is authenticated, save the selection to the server
      if (isAuthenticated && userInfo?.userId) {
        try {
          console.log('Saving selected sales to server for user:', userInfo.userId);
          
          // Extract just the IDs for the server request
          const selectedSaleIds = selectedSalesData.map(sale => sale.id);
          
          // Save the selected sales to the server with the GENPUB communityId
          const response = await api.createUpdateUserAddressList(userInfo.userId, selectedSaleIds, 'GENPUB');
          console.log('Successfully saved selected sales to server:', response);
        } catch (error) {
          console.error('Error saving selected sales to server:', error);
        }
      } else {
        console.log('User not authenticated, skipping server save of selected sales');
      }
      
      // If not already showing only selected sales, turn it on
      if (!showOnlySelected) {
        toggleDisplayMode();
      }
      
      // Store the selected sales in localStorage
      localStorage.setItem('selectedSales', JSON.stringify(selectedSalesData));
      
      // Navigate to the map view with the GENPUB community ID
      navigate('/?communityId=GENPUB');
    } else {
      alert('Please select at least one garage sale to view on the map.');
    }
  };

  // Add debugging for the garage sales state
  console.log('Current garageSales state:', garageSales);
  console.log('Number of garage sales:', garageSales.length);
  
  // Filter sales based on search term and display mode
  const filteredSales = garageSales.filter(sale => {
    // First apply search filter if there's a search term
    const matchesSearch = !searchTerm || 
      (sale.address && sale.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.description && sale.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.name && sale.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.highlightedItems && sale.highlightedItems.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Then apply selected filter if showOnlySelected is true
    const matchesSelected = !showOnlySelected || selectedSales.has(sale.id);
    
    return matchesSearch && matchesSelected;
  });
  
  // Add debugging for filtered sales
  console.log('Filtered sales:', filteredSales);
  console.log('Number of filtered sales:', filteredSales.length);

  // Show optimize route selection view
  if (showOptimizeRoute) {
    const salesToDisplay = optimizeFullRoute ? filteredSales : filteredSales.filter(sale => selectedSales.has(sale.id));
    const displayMessage = optimizeFullRoute 
      ? `Select your starting point from ${salesToDisplay.length} garage sales:`
      : `Select your starting point from ${salesToDisplay.length} selected garage sales:`;

    return (
      <div className="garage-sales-container">
        <h1>Optimize Route - Select Starting Point</h1>
        
        <div className="optimize-info">
          <p>{displayMessage}</p>
          <button 
            className="back-button"
            onClick={handleBackToSelection}
          >
            ← Back to Selection
          </button>
        </div>

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

  // Show optimized route list
  if (showRouteList) {
    return (
      <div className="garage-sales-container">
        <h1>Optimized Route</h1>
        
        <div className="route-info">
          <p>Your optimized route with {optimizedRouteAddresses.length} stops:</p>
          <div className="route-actions">
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
              View Route on Map →
            </button>
          </div>
        </div>

        <div className="route-list">
          {optimizedRouteAddresses.map((stop, index) => (
            <div key={stop.id || index} className="route-stop">
              <div className="stop-number">{index + 1}</div>
              <div className="stop-details">
                <h3>{stop.address}</h3>
                <p>{stop.description}</p>
              </div>
            </div>
          ))}
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
                View Selected on Map
              </button>
              <button 
                className="view-selected-button"
                onClick={handleOptimizeRoute}
              >
                Optimise Selected Route
              </button>
            </>
          ) : null}
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
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </div>
  );
};

export default SingleGarageSales;
