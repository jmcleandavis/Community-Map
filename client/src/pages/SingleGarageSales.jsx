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
  const [communityName, setCommunityName] = useState('Individual Garage Sales');
  
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
    navigate(`/?communityId=GENPUB`);
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

  const handleSelectAll = () => {
    // Create a new Set with all sale IDs
    const allSaleIds = new Set(garageSales.map(sale => sale.id));
    setSelectedSales(allSaleIds);
    
    // Update server if user is authenticated
    if (isAuthenticated && userInfo?.userId) {
      try {
        console.log('Saving all selections to server for user:', userInfo.userId);
        const allSaleIdsArray = Array.from(allSaleIds);
        api.createUpdateUserAddressList(userInfo.userId, allSaleIdsArray, 'GENPUB');
        console.log('Successfully saved all selections to server');
      } catch (error) {
        console.error('Error saving all selections to server:', error);
      }
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

  const handleViewSelected = async () => {
    // Filter sales to only include those that are in the selectedSales set
    const selectedSalesData = filteredSales
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



  return (
    <div className="garage-sales-container">
      <h1>Individual Garage Sales</h1>
      
      {isAuthenticated && userInfo && (
        <div className="user-info">
          <div className="user-name">{userInfo?.fName} {userInfo?.lName}</div>
          {userInfo?.email && <div className="user-email">{userInfo.email}</div>}
        </div>
      )}
      
      {/* Search and filter controls */}
      <div className="controls-container">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by address or description..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
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
                Deselect All ({selectedSales.size})
              </button>
              <button 
                className="view-selected-button"
                onClick={handleViewSelected}
                disabled={selectedSales.size === 0}
              >
                View Selected on Map
              </button>
            </>
          ) : (
            <button 
              className="select-all-button"
              onClick={handleSelectAll}
            >
              Select All
            </button>
          )}
        </div>
      </div>
      
      {/* Loading and error states */}
      {loading && <div className="loading">Loading garage sales...</div>}
      {error && <div className="error">{error}</div>}
      
      {/* Sales list */}
      {!loading && !error && (
        <>
          {filteredSales.length === 0 ? (
            <div className="no-results">
              No garage sales found matching your search.
            </div>
          ) : (
            <div className="garage-sales-list">
              {filteredSales.map(sale => (
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
                    <h3>{sale.name || 'GARAGE SALE'}</h3>
                    
                    {/* Display full address with each component on its own line */}
                    <div className="sale-address-details">
                      {sale.fullAddress && (
                        <>
                          <p className="address-line">
                            {sale.fullAddress.streetNum} {sale.fullAddress.street}
                          </p>
                          <p className="address-line">
                            {sale.fullAddress.city}, {sale.fullAddress.provState} {sale.fullAddress.postalZipCode}
                          </p>
                        </>
                      )}
                      {!sale.fullAddress && <p>No Address Available</p>}
                    </div>
                    
                    {sale.description && (
                      <p className="sale-description">{sale.description}</p>
                    )}
                    
                    {sale.highlightedItems && (
                      <p className="sale-items">
                        <strong>Featured Items:</strong> {sale.highlightedItems}
                      </p>
                    )}
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
        </>
      )}
      
      {/* Login modal */}
      {showLoginModal && (
        <LoginRequiredModal
          onClose={() => setShowLoginModal(false)}
          message="Please log in to save garage sales to your list."
        />
      )}
    </div>
  );
};

export default SingleGarageSales;
