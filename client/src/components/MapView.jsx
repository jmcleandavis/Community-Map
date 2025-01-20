import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGarageSales } from '../context/GarageSalesContext';

function MapView({ isLoaded }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const mapRef = useRef(null);
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

  const mapContainerStyle = {
    width: '100%',
    height: '100vh'
  };

  const center = {
    lat: 43.8384,
    lng: -79.0868
  };

  const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    styles: [
      {
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }]
      }
    ]
  };

  const onMapLoad = useCallback((map) => {
    console.log('MapView: Map loaded and ref set');
    mapRef.current = map;
  }, []);

  // Render markers only if we have garage sales and they have position data
  const markers = garageSales?.map((sale, index) => {
    if (!sale?.position?.lat || !sale?.position?.lng) {
      console.warn('MapView: Sale missing position data:', sale);
      return null;
    }

    return (
      <Marker
        key={sale.id || index}
        position={sale.position}
        onClick={() => {
          console.log('MapView: Marker clicked:', sale);
          setSelectedSale(sale);
        }}
      />
    );
  }).filter(Boolean) || [];

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
        options={mapOptions}
        onLoad={onMapLoad}
      >
        {markers}
        
        {selectedSale && selectedSale.position && (
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
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {!loading && !error && markers.length === 0 && <div>No addresses to display</div>}
    </>
  );
}

export default MapView;
