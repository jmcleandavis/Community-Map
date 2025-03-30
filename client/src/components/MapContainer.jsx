import React, { useState } from 'react';
import MapView from './MapView';
import HamburgerMenu from './HamburgerMenu';

// Define libraries as a static constant
const libraries = ['marker'];

function MapContainer() {
  const [isLoaded, setIsLoaded] = useState(true);

  return (
    <>
      <HamburgerMenu />
      <div className="map-container">
        <MapView isLoaded={isLoaded} />
      </div>
    </>
  );
}

export default MapContainer;
