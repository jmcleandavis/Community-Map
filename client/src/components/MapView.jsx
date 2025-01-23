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
  const { fetchGarageSales, garageSales, loading, error } = useGarageSales();

  // Debug mount/unmount cycles
  useEffect(() => {
    console.log('MapView: Component mounted');
    return () => {
      console.log('MapView: Component unmounted');
    };
  }, []);

  // Fetch garage sales only once when component mounts
  useEffect(() => {
    console.log('MapView: Fetch effect running. GarageSales length:', garageSales.length);
    if (garageSales.length === 0) {
      console.log('MapView: No garage sales data, triggering fetch');
      fetchGarageSales();
    }
  }, [fetchGarageSales, garageSales.length]);

  // Memorize callbacks
  const onMapLoad = useCallback((map) => {
    console.log('MapView: Map loaded and ref set');
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userPos);
        
        // Only set center and zoom on initial location fetch
        if (!initialLocationSetRef.current && mapRef.current) {
          mapRef.current.setCenter(userPos);
          mapRef.current.setZoom(13);
          initialLocationSetRef.current = true;
        }

        // Update user marker
        if (userMarkerRef.current) {
          userMarkerRef.current.map = null;
        }

        if (mapRef.current && window.google) {
          const markerElement = document.createElement('div');
          markerElement.className = 'user-location-marker';
          markerElement.style.cssText = `
            background-color: #4285F4;
            border-radius: 50%;
            border: 2px solid #FFFFFF;
            width: 16px;
            height: 16px;
            box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
          `;

          userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
            position: userPos,
            content: markerElement,
            title: 'Your Location',
            map: mapRef.current,
            zIndex: 1000
          });
        }
      },
      (error) => console.error('Error getting location:', error)
    );
  }, []);

  // Memorize map options
  const finalMapOptions = useMemo(() => ({
    ...mapOptions,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: true,
  }), [mapOptions]);

  // Effect to update user location periodically
  useEffect(() => {
    if (!isLoaded) return;

    handleGetLocation();
    const intervalId = setInterval(handleGetLocation, 10000);

    return () => {
      clearInterval(intervalId);
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
      }
    };
  }, [isLoaded, handleGetLocation]);

  // Effect to manage markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !garageSales?.length || !window.google) {
      console.log('MapView: Skipping marker creation - conditions not met:', {
        isLoaded,
        hasMap: !!mapRef.current,
        salesCount: garageSales?.length,
        hasGoogle: !!window.google
      });
      return;
    }

    console.log('MapView: Creating markers for sales:', garageSales);

    // Clear existing markers
    markersRef.current.forEach(marker => marker?.map && (marker.map = null));
    markersRef.current = [];

    // Create new markers
    garageSales.forEach(sale => {
      if (!sale?.position?.lat || !sale?.position?.lng) {
        console.warn('MapView: Sale missing position data:', sale);
        return;
      }

      try {
        // Create marker element
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

        // Create info window content
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

        // Create the marker
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: sale.position,
          content: markerElement,
          title: sale.address,
          map: mapRef.current
        });

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent,
          maxWidth: 250
        });

        // Add click listener
        marker.addListener('click', () => {
          // Close any open info windows
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

        // Store info window reference with marker
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

    return () => {
      markersRef.current.forEach(marker => {
        if (marker?.infoWindow) {
          marker.infoWindow.close();
        }
        if (marker?.map) {
          marker.map = null;
        }
      });
      markersRef.current = [];
    };
  }, [isLoaded, garageSales]);

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        options={finalMapOptions}
        onLoad={onMapLoad}
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
