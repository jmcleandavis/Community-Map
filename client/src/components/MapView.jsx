import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { useGarageSales } from '../context/GarageSalesContext';
import { useDisplay } from '../context/DisplayContext';
import './MapView.css';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import useWindowSize from '../hooks/useWindowSize';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useSelection } from '../context/SelectionContext';
import { useCommunitySales } from '../context/CommunitySalesContext';
import api from '../utils/api';

// Fallback component when map fails to load
const MapLoadError = ({ error }) => {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#f8f9fa',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '20px'
    }}>
      <h3 style={{ color: '#dc3545' }}>Google Maps failed to load</h3>
      <p>{error || 'Please check your internet connection and try again.'}</p>
      <button 
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
        onClick={() => window.location.reload()}
      >
        Reload Page
      </button>
    </div>
  );
};

function MapView({ mapContainerStyle, mapOptions }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [componentMounted, setComponentMounted] = useState(false);
  const [directions, setDirections] = useState(null);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false);
  const [optimizedRouteData, setOptimizedRouteData] = useState(null);
  const [center] = useState({
    lat: 43.8384,
    lng: -79.0868
  });
  
  // Get window dimensions
  const { width } = useWindowSize();
  const isCompactView = width < 1045;
  
  // Google Maps is already loaded by LoadScript in App.jsx
  // We assume it's loaded when this component mounts
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const initialLoadRef = useRef(false);
  const userSelectionsLoadedRef = useRef(false);
  const { fetchGarageSales, garageSales, loading, error } = useGarageSales();
  const { showOnlySelected } = useDisplay();
  const { isAuthenticated, userInfo } = useAuth();
  const { handleCheckboxChange, handleDeselectAll } = useSelection();
  const { userLocation, shouldCenterOnUser, clearCenterOnUser, centerOnUserLocation } = useLocation();
  const { communityId, setCommunityId, communityName, setCommunityName } = useCommunitySales();
  
  // Use the community name from context or API call
  // The fallback is now handled in the fetch effect above
  const COMMUNITY_NAME = communityName || 'Loading community...';
  const location = useRouterLocation();
  const navigate = useNavigate();
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlCommunityId = urlParams.get('communityId');
  const urlShowOptimizedRoute = urlParams.get('showOptimizedRoute') === 'true';

  // Ensure component is fully mounted before making navigation decisions
  useEffect(() => {
    setComponentMounted(true);
    
    // Check if we should show optimized route
    if (urlShowOptimizedRoute) {
      const storedRoute = localStorage.getItem('optimizedRoute');
      if (storedRoute) {
        try {
          const routeData = JSON.parse(storedRoute);
          setOptimizedRouteData(routeData);
          setShowOptimizedRoute(true);
        } catch (error) {
          console.error('Error parsing optimized route data:', error);
        }
      }
    }
  }, [urlShowOptimizedRoute]);

  // Use this effect to update the communityId or navigate to landing page
  useEffect(() => {
    // Don't make navigation decisions until component is fully mounted
    // and we've had a chance to parse the URL
    if (!componentMounted) {
      return;
    }
    
    // Give URLSearchParams a chance to be processed by checking if location.search exists
    if (location.search && !urlCommunityId) {
      // URL has search params but communityId wasn't found - might still be parsing
      console.log('MapView: URL has search params but communityId not found yet, waiting...');
      return;
    }
    
    if(urlCommunityId) {
      console.log('MapView: Setting community ID from URL:', urlCommunityId);
      setCommunityId(urlCommunityId);
    } else if (!communityId && !location.search) {
      // Only navigate away if there are no search params at all
      console.log('MapView: No community ID provided and no URL params, navigating to landing page');
      navigate('/about');
    }
  }, [urlCommunityId, communityId, setCommunityId, navigate, componentMounted, location.search]);

  // Fetch community name via API if it's not available in context
  useEffect(() => {
    // Only fetch if we have a communityId but no communityName
    if (communityId && !communityName) {
      console.log('MapView: Community name not in context, fetching from API for communityId:', communityId);
      
      const fetchCommunityName = async () => {
        try {
          // Use the same API endpoint as in GarageSalesAdmin
          const apiUrl = `${import.meta.env.VITE_MAPS_API_URL}/v1/communitySales/byId/${communityId}`;
          const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
              'app-name': 'web-service',
              'app-key': import.meta.env.VITE_APP_SESSION_KEY
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.name) {
              console.log('MapView: Successfully fetched community name:', data.name);
              setCommunityName(data.name);
            } else {
              console.log('MapView: Community name not found in API response, using default');
              setCommunityName('Community Sales Day');
            }
          } else {
            console.error('MapView: Failed to fetch community name, status:', response.status);
            setCommunityName('Community Sales Day');
          }
        } catch (error) {
          console.error('MapView: Error fetching community name:', error);
          setCommunityName('Community Sales Day');
        }
      };
      
      fetchCommunityName();
    }
  }, [communityId, communityName, setCommunityName]);

  // Get selected sale IDs from localStorage
  const selectedSaleIds = useMemo(() => {
    const selectedSalesStr = localStorage.getItem('selectedSaleIds');
    return selectedSalesStr ? JSON.parse(selectedSalesStr) : [];
  }, []);

  // Record that the user started on the map page
  useEffect(() => {
    const initialPage = '/';
    // Store the initial page in sessionStorage
    sessionStorage.setItem('initialPage', initialPage);
    console.log(`MapView: Recorded initial page as "${initialPage}" in sessionStorage`);
  }, []);

  // Initial load of garage sales
  useEffect(() => {
    if (!initialLoadRef.current && communityId) {
      console.log('MapView: Initial load - fetching garage sales with communityId:', communityId);
      fetchGarageSales(communityId);
      initialLoadRef.current = true;
    }
  }, [fetchGarageSales, communityId]);
  
  // Load user's saved garage sale selections if they're logged in
  useEffect(() => {
    const fetchUserSelections = async () => {
      // Only fetch if user is logged in, we haven't already loaded selections,
      // and we have the user's ID
      if (isAuthenticated && !userSelectionsLoadedRef.current && userInfo?.userId) {
        try {
          console.log('MapView: User is logged in, fetching saved selections for user:', userInfo.userId);
          const userAddressList = await api.getUserAddressList(userInfo.userId);
          
          if (userAddressList && userAddressList.addressList && userAddressList.addressList.length > 0) {
            console.log('MapView: User has saved selections on server:', userAddressList.addressList);
            
            // Clear existing selections first
            handleDeselectAll();
            
            // Add each server-side selection
            userAddressList.addressList.forEach(saleId => {
              handleCheckboxChange(saleId);
            });
            
            console.log('MapView: Updated selections from server list');
          } else {
            console.log('MapView: User does not have saved selections on server, using local selections');
          }
          
          // Mark that we've loaded user selections
          userSelectionsLoadedRef.current = true;
        } catch (error) {
          console.error('MapView: Error fetching user selections:', error);
          // If there's an error, we'll fall back to local storage selections
        }
      }
    };
    
    fetchUserSelections();
  }, [isAuthenticated, userInfo, handleCheckboxChange, handleDeselectAll]);

  // Cleanup function for markers
  const cleanupMarkers = useCallback(() => {
    console.log('MapView: Cleaning up markers');
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        if (marker) {
          marker.map = null;
        }
      });
      markersRef.current = [];
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null;
      userMarkerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('MapView: Component unmounting, cleaning up');
      cleanupMarkers();
      if (mapRef.current) {
        console.log('MapView: Clearing map reference');
        mapRef.current = null;
        setIsLoaded(false);
      }
    };
  }, [cleanupMarkers]);

  const createMarkers = useCallback(() => {
    if (!mapRef.current || !window.google || !garageSales) {
      console.log('MapView: Cannot create markers - missing requirements', {
        hasMap: !!mapRef.current,
        hasGoogle: !!window.google,
        salesCount: garageSales?.length
      });
      return;
    }

    console.log('MapView: Creating markers for', garageSales.length, 'sales');
    
    // Only cleanup if we have existing markers
    if (markersRef.current.length > 0) {
      console.log('MapView: Cleaning up existing markers before creating new ones');
      cleanupMarkers();
    }

    // Filter sales based on display mode
    const salesToShow = showOnlySelected 
      ? garageSales.filter(sale => selectedSaleIds.includes(sale.id))
      : garageSales;

    const { AdvancedMarkerElement } = window.google.maps.marker;
    if (!AdvancedMarkerElement) {
      console.error('AdvancedMarkerElement not available');
      return;
    }

    console.log('MapView: Starting to create', salesToShow.length, 'markers');
    let markersCreated = 0;

    salesToShow.forEach(sale => {
      const markerColor = selectedSaleIds.includes(sale.id) ? '#4CAF50' : '#FF0000';
      
      const pinElement = document.createElement('div');
      pinElement.className = 'custom-pin';
      pinElement.style.cursor = 'pointer';
      pinElement.style.width = '24px';
      pinElement.style.height = '24px';
      pinElement.style.borderRadius = '50%';
      pinElement.style.backgroundColor = markerColor;
      pinElement.style.border = '2px solid white';
      pinElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      try {
        const marker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat: sale.position.lat, lng: sale.position.lng },
          content: pinElement,
          title: sale.address
        });

        marker.addListener('gmp-click', () => {
          setSelectedSale(sale);
        });

        markersRef.current.push(marker);
        markersCreated++;
      } catch (error) {
        console.error('Error creating marker:', error, sale);
      }
    });

    console.log('MapView: Successfully created', markersCreated, 'markers');
  }, [garageSales, selectedSaleIds, showOnlySelected, cleanupMarkers]);

  // Watch for when both map and data are ready and create markers
  useEffect(() => {
    // Only proceed if we have all necessary data
    if (mapRef.current && garageSales?.length && window.google) {
      console.log("DIRECT EFFECT: Map and data both ready, creating markers now!");
      if (markersRef.current.length === 0) { // Only create if not already created
        createMarkers();
      }
    }
  }, [mapRef.current, garageSales, createMarkers]);

  // Effect to handle centering on user location
  useEffect(() => {
    if (shouldCenterOnUser && userLocation && mapRef.current) {
      console.log('MapView: Centering on user location', userLocation);
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
      clearCenterOnUser();
    }
  }, [shouldCenterOnUser, userLocation, clearCenterOnUser]);

  // Effect to update user location marker
  useEffect(() => {
    // Only proceed if map is loaded and we have location
    if (!isLoaded) {
      console.log('MapView: Map not yet loaded, waiting...');
      return;
    }

    if (!userLocation) {
      console.log('MapView: No user location yet, waiting...');
      return;
    }

    if (!window.google) {
      console.log('MapView: Google Maps not yet available, waiting...');
      return;
    }

    if (!mapRef.current) {
      console.log('MapView: Map reference not yet available, waiting...');
      return;
    }

    console.log('MapView: All requirements met, creating user location marker', {
      hasMap: !!mapRef.current,
      hasLocation: !!userLocation,
      hasGoogle: !!window.google,
      isLoaded
    });

    try {
      const { AdvancedMarkerElement } = window.google.maps.marker;
      if (!AdvancedMarkerElement) {
        console.error('AdvancedMarkerElement not available');
        return;
      }

      // Clean up existing marker
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
        userMarkerRef.current = null;
      }

      const userPinElement = document.createElement('div');
      userPinElement.style.position = 'relative';
      userPinElement.style.width = '20px';
      userPinElement.style.height = '20px';

      // Inner circle (blue dot)
      const innerCircle = document.createElement('div');
      innerCircle.style.width = '20px';
      innerCircle.style.height = '20px';
      innerCircle.style.borderRadius = '50%';
      innerCircle.style.backgroundColor = '#4285F4';
      innerCircle.style.border = '3px solid white';
      innerCircle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      userPinElement.appendChild(innerCircle);

      // Outer circle (pulse effect)
      const outerCircle = document.createElement('div');
      outerCircle.style.position = 'absolute';
      outerCircle.style.top = '-5px';
      outerCircle.style.left = '-5px';
      outerCircle.style.width = '30px';
      outerCircle.style.height = '30px';
      outerCircle.style.borderRadius = '50%';
      outerCircle.style.backgroundColor = 'rgba(66, 133, 244, 0.2)';
      outerCircle.style.animation = 'pulse 2s infinite';
      userPinElement.appendChild(outerCircle);

      // Add the pulse animation if it doesn't exist
      if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      userMarkerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: userLocation,
        content: userPinElement,
        title: 'Your Location'
      });

      console.log('MapView: Successfully created user location marker');
    } catch (error) {
      console.error('Error creating user location marker:', error);
    }
  }, [userLocation, isLoaded]);

  // Effect to create markers when map is loaded and sales data is available
  useEffect(() => {
    if (!isLoaded) {
      console.log('MapView: Map not loaded yet, waiting to create markers...');
      return;
    }

    if (!garageSales?.length) {
      console.log('MapView: No garage sales data yet, waiting...');
      return;
    }

    if (!window.google) {
      console.log('MapView: Google Maps not available yet, waiting...');
      return;
    }

    if (!mapRef.current) {
      console.log('MapView: Map reference not available yet, waiting...');
      return;
    }

    console.log('MapView: All requirements met, creating', garageSales.length, 'markers');
    createMarkers();
  }, [isLoaded, garageSales, createMarkers]);

  // Function to display the optimized route on the map
  const displayOptimizedRoute = useCallback((routeData) => {
    if (!mapRef.current || !window.google || !routeData) {
      console.error('MapView: Cannot display optimized route - missing requirements');
      return;
    }

    console.log('MapView: Displaying optimized route with data:', routeData);
    
    try {
      const DirectionsService = new window.google.maps.DirectionsService();
      
      // Extract waypoints from the route data
      const waypoints = routeData.orderedWaypoints || [];
      
      if (waypoints.length < 2) {
        console.error('MapView: Not enough waypoints to create a route');
        return;
      }
      
      // Create waypoint objects for the DirectionsService
      const googleWaypoints = waypoints.slice(1, waypoints.length - 1).map(address => ({
        location: address,
        stopover: true
      }));
      
      // Request directions
      DirectionsService.route({
        origin: waypoints[0],
        destination: waypoints[waypoints.length - 1],
        waypoints: googleWaypoints,
        optimizeWaypoints: false, // Already optimized
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          console.log('MapView: Successfully received directions for optimized route');
          setDirections(result);
        } else {
          console.error('MapView: Error getting directions for optimized route:', status);
          alert(`Error getting directions: ${status}`);
        }
      });
    } catch (error) {
      console.error('MapView: Error displaying optimized route:', error);
    }
  }, []);

  // Effect to display optimized route when data changes
  useEffect(() => {
    if (isLoaded && showOptimizedRoute && optimizedRouteData && window.google) {
      displayOptimizedRoute(optimizedRouteData);
    }
  }, [isLoaded, showOptimizedRoute, optimizedRouteData, displayOptimizedRoute]);

  // Handle map load event
  const handleMapLoad = useCallback((map) => {
    console.log('MapView: Map loaded');
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  // Handle map click to close info windows
  const handleMapClick = useCallback(() => {
    // Close InfoWindow when clicking on the map
    if (selectedSale) setSelectedSale(null);
    
    // Close hamburger menu if it's open
    if (window.closeHamburgerMenu) {
      window.closeHamburgerMenu();
    }
  }, [selectedSale]);

  const titleStyle = {
    textAlign: 'center',
    padding: '15px',
    fontSize: isCompactView ? '10px' : '24px',
    fontWeight: 'bold',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1,
    borderRadius: '5px'
  };

  // Log when rendering the map
  console.log('MapView: Rendering Google Map component');

  // Prepare render content based on state
  let renderContent;
  
  // Check if window.google is available (maps script is loaded)
  if (!window.google) {
    console.error('Google Maps API not loaded yet');
    renderContent = <MapLoadError error="Google Maps not loaded yet. Please try refreshing the page." />;
  }
  // Loading and error states for garage sales data
  else if (loading) {
    renderContent = <div>Loading garage sales...</div>;
  }
  else if (error) {
    renderContent = <div>Error loading garage sales: {error}</div>;
  }
  else {
    renderContent = (
      <div className="map-container">
        {/* Display the community name at the top */}
        <div style={titleStyle}>{COMMUNITY_NAME}</div>

        <GoogleMap
          mapContainerStyle={mapContainerStyle || { width: '100%', height: '100vh' }}
          center={center}
          zoom={13}
          onClick={() => {
            // Close InfoWindow when clicking on the map
            if (selectedSale) setSelectedSale(null);
            
            // Close hamburger menu if it's open
            if (window.closeHamburgerMenu) {
              window.closeHamburgerMenu();
            }
          }}
          onLoad={(map) => {
            console.log("Map component loaded");
            mapRef.current = map;
            
            // Explicitly set map type control position based on screen width
            if (map && window.google) {
              console.log('Setting map options with screen width:', width, 'isCompactView:', isCompactView);
              
              if (isCompactView) {
                // For small screens (<1045px): Stack controls vertically
                // Full screen on top right, map type controls below it
                map.setOptions({
                  // Disable all default UI controls
                  disableDefaultUI: true,
                  // Then enable only the controls we want
                  mapTypeControl: true,
                  mapTypeControlOptions: {
                    position: window.google.maps.ControlPosition.LEFT_BOTTOM,
                    style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                  },
                  zoomControl: false,
                  fullscreenControl: true,
                  fullscreenControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_RIGHT
                  },
                  // Enable standard Google Maps controls
                  streetViewControl: true,
                  scaleControl: true
                });
              } else {
                // For larger screens (>=1045px): Normal horizontal positioning
                map.setOptions({
                  // Disable all default UI controls
                  disableDefaultUI: true,
                  // Then enable only the controls we want
                  mapTypeControl: true,
                  mapTypeControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_RIGHT,
                    style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR
                  },
                  zoomControl: true,
                  zoomControlOptions: {
                    position: window.google.maps.ControlPosition.RIGHT_CENTER
                  },
                  fullscreenControl: true,
                  fullscreenControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_RIGHT
                  },
                  // Enable standard Google Maps controls
                  streetViewControl: true,
                  scaleControl: true
                });
              }
            }
            
            // Set loaded state after configuring the map
            setIsLoaded(true);
            
            // Map type controls position is now handled entirely through CSS in MapView.css
            
            // Add a custom My Location button that uses the existing centerOnUserLocation function
            const locationButton = document.createElement("button");
            locationButton.title = "My Location";
            locationButton.classList.add("my-location-button");
            
            // Create a div for the icon
            const iconContainer = document.createElement("div");
            iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>';
            iconContainer.classList.add("icon-container");
            locationButton.appendChild(iconContainer);
            
            // The button is styled via CSS classes in MapView.css
            
            map.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
            
            // Setup the click event listener
            locationButton.addEventListener("click", () => {
              // Call the existing centerOnUserLocation function
              centerOnUserLocation();
            });
            
            // Directly create markers if garage sales data is available
            if (garageSales?.length && window.google) {
              console.log("Map loaded with data available, creating markers immediately");
              setTimeout(() => {createMarkers(); centerOnUserLocation();}, 100); // Small timeout to ensure state is updated
            }
          }}
          onUnmount={(map) => {
            console.log("Map component unmounted");
            mapRef.current = null;
          }}
          options={mapOptions}
        >
          {/* Render directions if available */}
          {directions && showOptimizedRoute && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: false,
                polylineOptions: {
                  strokeColor: '#4285F4',
                  strokeWeight: 5,
                  strokeOpacity: 0.8
                }
              }}
            />
          )}
          
          {selectedSale && (
            <InfoWindow
              position={{
                lat: selectedSale.position.lat,
                lng: selectedSale.position.lng
              }}
              onCloseClick={() => setSelectedSale(null)}
            >
              <div className="info-window-content">
                <h3>{selectedSale.address}</h3>
                <p>{selectedSale.description || 'No description available'}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    );
  }

  return renderContent;
}

export default MapView;
