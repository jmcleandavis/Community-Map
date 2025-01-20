import React, { useState } from 'react';
import { LoadScript } from '@react-google-maps/api';
import MapView from './MapView';
import HamburgerMenu from './HamburgerMenu';

// Define libraries as a static constant
const libraries = ['marker'];

function MapContainer() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      <HamburgerMenu />
      <div className="map-container">
        <LoadScript
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
          libraries={libraries}
          onLoad={() => {
            console.log('Google Maps script loaded');
            setIsLoaded(true);
          }}
        >
          {isLoaded && <MapView isLoaded={isLoaded} />}
        </LoadScript>
      </div>
    </>
  );
}

export default MapContainer;
