import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useGarageSales } from '../context/GarageSalesContext';

function MapView({ mapContainerStyle, mapOptions }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const { fetchGarageSales, garageSales, loading, error } = useGarageSales();
  const hasFetchedRef = useRef(false);

  const center = {
    lat: 43.8384,
    lng: -79.0868
  };

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
