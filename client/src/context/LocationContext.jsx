import React, { createContext, useContext, useState, useCallback } from 'react';

const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [userLocation, setUserLocation] = useState(null);
  const [shouldCenterOnUser, setShouldCenterOnUser] = useState(false);

  const centerOnUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(pos);
          setShouldCenterOnUser(true);
        },
        (error) => {
          console.warn('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
    }
  }, []);

  const clearCenterOnUser = useCallback(() => {
    setShouldCenterOnUser(false);
  }, []);

  const value = {
    userLocation,
    shouldCenterOnUser,
    centerOnUserLocation,
    clearCenterOnUser
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
