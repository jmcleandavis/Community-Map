import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useGarageSales } from '../context/GarageSalesContext';
import { useDisplay } from '../context/DisplayContext';
import { useLocation } from '../context/LocationContext';

const COMMUNITY_NAME = 'BAY RIDGES';
const EVENT_NAME = 'COMMUNITY SALE DAY';
const currentYear = new Date().getFullYear();
const communityId = 'd31a9eec-0dda-469d-8565-692ef9ad55c2';

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
  const [center] = useState({
    lat: 43.8384,
    lng: -79.0868
  });
  
  // Google Maps is already loaded by LoadScript in App.jsx
  // We assume it's loaded when this component mounts
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const initialLoadRef = useRef(false);
  const { fetchGarageSales, garageSales, loading, error } = useGarageSales();
  const { showOnlySelected } = useDisplay();
  const { userLocation, shouldCenterOnUser, clearCenterOnUser } = useLocation();

  // Get selected sale IDs from localStorage
  const selectedSaleIds = useMemo(() => {
    const selectedSalesStr = localStorage.getItem('selectedSaleIds');
    return selectedSalesStr ? JSON.parse(selectedSalesStr) : [];
  }, []);

  // Initial load of garage sales
  useEffect(() => {
    if (!initialLoadRef.current) {
      console.log('MapView: Initial load - fetching garage sales');
      fetchGarageSales();
      initialLoadRef.current = true;
    }
  }, [fetchGarageSales]);

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

  const titleStyle = {
    textAlign: 'center',
    padding: '15px',
    fontSize: '24px',
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

  // Check if window.google is available (maps script is loaded)
  if (!window.google) {
    console.error('Google Maps API not loaded yet');
    return <MapLoadError error="Google Maps not loaded yet. Please try refreshing the page." />;
  }

  // Loading and error states for garage sales data
  if (loading) {
    return <div>Loading garage sales...</div>;
  }

  if (error) {
    return <div>Error loading garage sales: {error}</div>;
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={titleStyle}>
        {`${COMMUNITY_NAME} ${EVENT_NAME} ${currentYear}`}
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle || { width: '100%', height: '100vh' }}
        center={center}
        zoom={13}
        onLoad={(map) => {
          console.log("Map component loaded");
          mapRef.current = map;
          
          // Explicitly set map type control position
          if (map && window.google) {
            map.setOptions({
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
              }
            });
          }
          
          // Set loaded state after configuring the map
          setIsLoaded(true);
          
          // Directly create markers if garage sales data is available
          if (garageSales?.length && window.google) {
            console.log("Map loaded with data available, creating markers immediately");
            setTimeout(() => createMarkers(), 100); // Small timeout to ensure state is updated
          }
        }}
        onUnmount={(map) => {
          console.log("Map component unmounted");
          mapRef.current = null;
        }}
        options={mapOptions}
      >
        {selectedSale && (
          <InfoWindow
            position={selectedSale.position}
            onCloseClick={() => setSelectedSale(null)}
          >
            <div>
              <h3>{selectedSale.address}</h3>
              <p>{selectedSale.description}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default MapView;
