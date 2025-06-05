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

  // Mock data based on the sample file - use this when backend is not working
  const mockOptimizedRouteData = {
    "summary": "Optimized Route",
    "orderedWaypoints": [
      "727 Balaton Avenue, Pickering, ON L1W 1W3",
      "879 CHAPLEAU DR, Pickering, ON L1W 1P6",
      "822 KROSNO BLVD, Pickering, ON L1W 1G8",
      "671 FRONT RD, Pickering, ON L1W 1N9",
      "725 Balaton Avenue, Pickering, ON L1W 1W3",
      "719 CORTEZ AVE, Pickering, ON L1W 1Y3",
      "688 ALDERWOOD PL, Pickering, ON L1W 1W8",
      "858 KROSNO BLVD, Pickering, ON L1W 1H3",
      "859 LIVERPOOL RD, Pickering, ON L1W 1S3",
      "828 KROSNO BLVD, Pickering, ON L1W 1G9",
      "1385 FORDON AVE, Pickering, ON L1W 1K1",
      "1322 COMMERCE ST, Pickering, ON L1W 1E2",
      "818 KROSNO BLVD, Pickering, ON L1W 1G8",
      "699 Liverpool Road, Pickering, ON L1W 1R6",
      "833 BEM AVE, Pickering, ON L1W 1X2",
      "727-C Balaton Ave HH2, Pickering, ON L1W 1M7",
      "724 KROSNO BLVD, Pickering, ON L1W 1G3",
      "844 BEM AVE, Pickering, ON L1W 1X3",
      "1483 ALYSSUM ST, Pickering, ON L1W 1J1",
      "727 Balaton Ave, Pickering, ON L1W 1W3",
      "827 BEM AVE, Pickering, ON L1W 1X2",
      "865 DOUGLAS AVE, Pickering, ON L1W 1N5",
      "727+Balaton Avenue, Pickering, ON L1W 1W3"
    ]
  };

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

  const handleOptimizeRoute = () => {
    setShowOptimizeRoute(true);
  };

  const handleSelectFirstVisit = async (saleId) => {
    try {
      console.log('Selected first visit:', saleId);
      
      // Get sessionId from localStorage
      const sessionId = localStorage.getItem('sessionId');
      
      // Try API call first, but fall back to mock data if it fails
      let optimizedRouteData = null;
      let usedMockData = false;
      
      try {
        // Make API call to get optimized route
        const response = await fetch(`${import.meta.env.VITE_MAPS_API_URL}/v1/getOptimzedRoute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'app-key': import.meta.env.VITE_APP_API_KEY,
            'app-name': 'postman-call',
            'sessionId': sessionId
          },
          body: JSON.stringify({
            startingAddressId: saleId,
            communityId: communityId
          })
        });
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }
        
        optimizedRouteData = await response.json();
        console.log('API Response:', optimizedRouteData);
        
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError.message);
        
        // Use mock data and create a route that starts with the selected sale
        const selectedSale = selectedSalesData.find(sale => sale.id === saleId);
        const selectedAddress = selectedSale ? selectedSale.address : null;
        
        // Create a custom route starting with the selected address
        let customOrderedWaypoints = [...mockOptimizedRouteData.orderedWaypoints];
        
        if (selectedAddress) {
          // Remove the selected address if it exists in the mock data
          customOrderedWaypoints = customOrderedWaypoints.filter(addr => 
            !addr.toLowerCase().includes(selectedAddress.toLowerCase().split(',')[0])
          );
          // Add the selected address at the beginning
          customOrderedWaypoints.unshift(selectedAddress);
        }
        
        // Limit to the number of selected sales to make it more realistic
        customOrderedWaypoints = customOrderedWaypoints.slice(0, selectedSalesData.length);
        
        optimizedRouteData = {
          ...mockOptimizedRouteData,
          orderedWaypoints: customOrderedWaypoints,
          summary: `Optimized Route (Starting from ${selectedAddress || 'Selected Location'})`
        };
        
        usedMockData = true;
      }
      
      // Process the response (whether from API or mock data)
      if (optimizedRouteData && optimizedRouteData.orderedWaypoints) {
        console.log('Using optimized route data:', optimizedRouteData);
        
        if (usedMockData) {
          console.log('Note: Using mock data due to API unavailability');
        }
        
        // Store the optimized route data in localStorage for the map to use
        localStorage.setItem('optimizedRoute', JSON.stringify(optimizedRouteData));
        
        // Set the optimized route addresses for display
        setOptimizedRouteAddresses(optimizedRouteData.orderedWaypoints);
        
        // Close the optimize route view and show the route list
        setShowOptimizeRoute(false);
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
        <h1>{communityName ? `${communityName} - Optimized Route` : 'Optimized Route'}</h1>
        
        <div className="optimize-route-instructions">
          <p><strong>Your optimized route in order of visits:</strong></p>
        </div>
        
        <div className="optimized-addresses-list">
          {optimizedRouteAddresses.map((address, index) => (
            <div key={index} className="optimized-address-item">
              <div className="address-number">{index + 1}</div>
              <div className="address-text">{address}</div>
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
    return (
      <div className="garage-sales-container">
        <h1>{communityName ? `${communityName} - Optimize Route` : 'Optimize Route'}</h1>
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
          {selectedSalesData.map((sale) => (
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
          Showing {selectedSalesData.length} selected garage sales
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
              <button 
                className="view-selected-button"
                onClick={handleOptimizeRoute}
              >
                Optimize Route
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
