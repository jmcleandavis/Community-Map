import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useGarageSales } from '../context/GarageSalesContext';

function MapView({ mapContainerStyle, mapOptions }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [center] = useState({
    lat: 43.8384,
    lng: -79.0868
  });
  
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const initialLocationSetRef = useRef(false);
  const { fetchGarageSales, garageSales, loading, error, setGarageSales } = useGarageSales();

  // Cleanup function for markers
  const cleanupMarkers = useCallback(() => {
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        if (marker?.infoWindow) {
          marker.infoWindow.close();
        }
        if (marker?.map) {
          marker.map = null;
        }
      });
      markersRef.current = [];
    }
  }, []);

  // Debug mount/unmount cycles
  useEffect(() => {
    console.log('MapView: Component mounted');
    return () => {
      console.log('MapView: Component unmounted');
      cleanupMarkers();
    };
  }, [cleanupMarkers]);

  // Load garage sales data
  useEffect(() => {
    console.log('MapView: Checking for garage sales data');
    
    const selectedSalesData = localStorage.getItem('selectedSales');
    const cachedGarageSales = localStorage.getItem('garageSales');
    
    if (selectedSalesData) {
      console.log('MapView: Found selected sales in localStorage');
      const parsedSelectedSales = JSON.parse(selectedSalesData);
      if (parsedSelectedSales.length > 0) {
        // Filter the garage sales to only show selected ones
        const selectedSaleIds = new Set(parsedSelectedSales);
        const filteredSales = garageSales.filter(sale => selectedSaleIds.has(sale.id));
        if (filteredSales.length > 0) {
          console.log('MapView: Displaying selected sales:', filteredSales.length);
          setGarageSales(filteredSales);
        } else {
          console.log('MapView: No matching selected sales found, fetching all sales');
          fetchGarageSales();
        }
      }
    } else if (!cachedGarageSales || garageSales.length === 0) {
      console.log('MapView: No garage sales data found, triggering fetch');
      fetchGarageSales();
    }
  }, [fetchGarageSales, garageSales, setGarageSales]);

  // Memoize callbacks
  const onMapLoad = useCallback((map) => {
    console.log('MapView: Map loaded and ref set');
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  // Create markers function
  const createMarkers = useCallback(() => {
    if (!mapRef.current || !garageSales?.length || !window.google) {
      console.log('MapView: Cannot create markers - missing dependencies');
      return;
    }

    console.log('MapView: Creating markers for sales:', garageSales.length);
    cleanupMarkers();

    garageSales.forEach(sale => {
      if (!sale?.position?.lat || !sale?.position?.lng) {
        console.warn('MapView: Sale missing position data:', sale);
        return;
      }

      try {
        const markerElement = document.createElement('div');
        markerElement.className = 'garage-sale-marker';
        markerElement.style.cssText = `
          background-color: #FF0000;
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          width: 12px;
          height: 12px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: sale.position,
          content: markerElement,
          title: sale.address,
          map: mapRef.current
        });

        const infoContent = document.createElement('div');
        infoContent.className = 'garage-sale-info';
        infoContent.innerHTML = `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">${sale.address}</h3>
            ${sale.description ? `<p style="margin: 0 0 8px 0;">${sale.description}</p>` : ''}
            ${sale.highlightedItems?.length ? `
              <div style="margin-top: 8px;">
                <strong>Featured Items:</strong>
                <ul style="margin: 4px 0 0 0; padding-left: 20px;">
                  ${sale.highlightedItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent,
          maxWidth: 250
        });

        marker.addListener('click', () => {
          markersRef.current.forEach(m => {
            if (m.infoWindow && m.infoWindow !== infoWindow) {
              m.infoWindow.close();
            }
          });

          infoWindow.open({
            anchor: marker,
            map: mapRef.current
          });

          setSelectedSale(sale);
        });

        marker.infoWindow = infoWindow;
        markersRef.current.push(marker);
      } catch (error) {
        console.error('MapView: Error creating marker:', {
          sale,
          error: error.message
        });
      }
    });

    console.log('MapView: Created markers:', markersRef.current.length);
  }, [garageSales]);

  // Effect to manage markers
  useEffect(() => {
    console.log('MapView: Marker effect running with conditions:', {
      isLoaded,
      hasMap: !!mapRef.current,
      salesCount: garageSales?.length,
      hasGoogle: !!window.google
    });

    if (!isLoaded) return;

    // Small delay to ensure map is fully loaded
    const timeoutId = setTimeout(() => {
      createMarkers();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isLoaded, createMarkers]);

  // Handle map bounds update
  const onBoundsChanged = useCallback(() => {
    if (mapRef.current && markersRef.current.length === 0) {
      createMarkers();
    }
  }, [createMarkers]);

  // Memorize map options
  const finalMapOptions = useMemo(() => ({
    ...mapOptions,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: true,
  }), [mapOptions]);

  // Handle user location tracking
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const updateUserLocation = (position) => {
      const { latitude, longitude } = position.coords;
      const newLocation = { lat: latitude, lng: longitude };
      setUserLocation(newLocation);

      // Create or update user location marker
      if (!userMarkerRef.current) {
        const markerElement = document.createElement('div');
        markerElement.className = 'user-location-marker';
        markerElement.style.cssText = `
          background-color: #4285F4;
          border: 2px solid #FFFFFF;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;

        userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
          position: newLocation,
          content: markerElement,
          map: mapRef.current,
          title: 'Your Location'
        });
      } else {
        userMarkerRef.current.position = newLocation;
      }

      // Center map on user location if it's the first time
      if (!initialLocationSetRef.current) {
        mapRef.current.panTo(newLocation);
        initialLocationSetRef.current = true;
      }
    };

    const handleError = (error) => {
      console.error('Error getting user location:', error);
    };

    // Start watching user location
    const watchId = navigator.geolocation.watchPosition(
      updateUserLocation,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    // Cleanup function
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
        userMarkerRef.current = null;
      }
    };
  }, [isLoaded]);

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        options={finalMapOptions}
        onLoad={onMapLoad}
        onBoundsChanged={onBoundsChanged}
      >
        {selectedSale && selectedSale.position && (
          <InfoWindow
            position={selectedSale.position}
            onCloseClick={() => setSelectedSale(null)}
          >
            <div>
              <h3>{selectedSale.address}</h3>
              <p>{selectedSale.description || ''}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {!loading && !error && (!garageSales || garageSales.length === 0) && <div>No addresses to display</div>}
    </>
  );
}

export default React.memo(MapView);
