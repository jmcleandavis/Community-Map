import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationContext = createContext();

export const useNavigation = () => {
  return useContext(NavigationContext);
};

export const NavigationProvider = ({ children }) => {
  // Check sessionStorage for shouldShowMenuBar flag on initial load
  const [fromLanding, setFromLanding] = useState(() => {
    return sessionStorage.getItem('shouldShowMenuBar') === 'true' || false;
  });
  const [fromMap, setFromMap] = useState(false);
  const location = useLocation();
  
  // Clear the sessionStorage flag after reading it
  useEffect(() => {
    if (sessionStorage.getItem('shouldShowMenuBar') === 'true') {
      sessionStorage.removeItem('shouldShowMenuBar');
    }
  }, []);

  // Check if the user is on the landing page or came from it
  useEffect(() => {
    if (location.pathname === '/landing' || location.pathname === '/about') {
      // If we're on the landing page, mark that future navigations will be from landing
      setFromLanding(true);
    } else if (location.pathname === '/') {
      // If we're on the map page, mark that future navigations will be from map
      setFromMap(true);
    }
    // We don't reset the fromMap flag so the "Return to Map" button remains visible
    // across all pages when the user has navigated from the map
    // We don't reset the fromLanding flag so they maintain the "from landing" context
  }, [location.pathname]);

  const value = {
    fromLanding,
    setFromLanding,
    fromMap,
    setFromMap
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
