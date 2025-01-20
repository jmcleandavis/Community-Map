import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useGarageSales } from '../context/GarageSalesContext';

function MapView({ mapContainerStyle, mapOptions }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [center, setCenter] = useState({
    lat: 43.8384,
    lng: -79.0868
  });
  
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const initialLocationSetRef = useRef(false);
  const { fetchGarageSales, garageSales, loading, error } = useGarageSales();
  const hasFetchedRef = useRef(false);

  // Only fetch once when component mounts and map is loaded
  useEffect(() => {
    if (isLoaded && !hasFetchedRef.current) {
      console.log('MapView: Initial fetch of garage sales...');
      hasFetchedRef.current = true;
      fetchGarageSales();
    }
  }, [isLoaded, fetchGarageSales]);

  const onMapLoad = useCallback((map) => {
    console.log('MapView: Map loaded and ref set');
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  const handleGetLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          
          // Only set center and zoom on initial location fetch
          if (!initialLocationSetRef.current) {
            setCenter(userPos);
            if (mapRef.current) {
              mapRef.current.setCenter(userPos);
              mapRef.current.setZoom(13);
              initialLocationSetRef.current = true;
            }
          }

          // Create or update user location marker
          if (userMarkerRef.current) {
            userMarkerRef.current.map = null;
          }

          if (mapRef.current) {
            const markerElement = document.createElement('div');
            markerElement.className = 'user-location-marker';
            markerElement.style.backgroundColor = '#4285F4';
            markerElement.style.borderRadius = '50%';
            markerElement.style.border = '2px solid #FFFFFF';
            markerElement.style.width = '16px';
            markerElement.style.height = '16px';
            markerElement.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.3)';

            userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              position: userPos,
              content: markerElement,
              title: 'Your Location',
              map: mapRef.current,
              zIndex: 1000 // Keep user marker on top
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  }, []);

  // Effect to update user location periodically
  useEffect(() => {
    if (!isLoaded) return;

    handleGetLocation(); // Get initial location

    const intervalId = setInterval(() => {
      handleGetLocation();
    }, 10000); // Update every 10 seconds

    return () => {
      clearInterval(intervalId);
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
      }
    };
  }, [isLoaded, handleGetLocation]);

  // Effect to manage markers
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !garageSales?.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (marker) {
        marker.map = null;
      }
    });
    markersRef.current = [];

    // Create new markers
    garageSales.forEach((sale, index) => {
      if (!sale?.position?.lat || !sale?.position?.lng) {
        console.warn('MapView: Sale missing position data:', sale);
        return;
      }

      try {
        const markerElement = document.createElement('div');
        markerElement.className = 'garage-sale-marker';
        markerElement.style.backgroundColor = '#FF0000';
        markerElement.style.borderRadius = '50%';
        markerElement.style.border = '2px solid #FFFFFF';
        markerElement.style.width = '12px';
        markerElement.style.height = '12px';

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: sale.position,
          content: markerElement,
          title: sale.address,
          map: mapRef.current
        });

        // Create info window for this marker
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div>
              <h3>${sale.address}</h3>
              <p>${sale.description || ''}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          setSelectedSale(sale);
          infoWindow.open({
            anchor: marker,
            map: mapRef.current
          });
        });

        markersRef.current.push(marker);
      } catch (error) {
        console.error('Error creating marker:', error);
      }
    });

    // Cleanup function
    return () => {
      markersRef.current.forEach(marker => {
        if (marker) {
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
        options={mapOptions}
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

export default MapView;
