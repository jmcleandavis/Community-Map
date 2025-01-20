import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGarageSales } from '../context/GarageSalesContext';

function MapView({ isLoaded }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const mapRef = useRef(null);
  const { fetchGarageSales, garageSales } = useGarageSales();

  useEffect(() => {
    if (isLoaded && mapRef.current) {
      console.log('Map is loaded, fetching garage sales');
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
    console.log('Map loaded, setting map ref');
    mapRef.current = map;
  }, []);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={12}
      options={mapOptions}
      onLoad={onMapLoad}
    >
      {garageSales.map((sale, index) => (
        <Marker
          key={index}
          position={sale.position}
          onClick={() => setSelectedSale(sale)}
        />
      ))}
      
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
  );
}

export default MapView;
