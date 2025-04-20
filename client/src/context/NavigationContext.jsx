import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationContext = createContext();

export const useNavigation = () => {
  return useContext(NavigationContext);
};

export const NavigationProvider = ({ children }) => {
  const [fromLanding, setFromLanding] = useState(false);
  const [fromMap, setFromMap] = useState(false);
  const location = useLocation();

  // Check if the user is on the landing page or came from it
  useEffect(() => {
    if (location.pathname === '/landing' || location.pathname === '/about') {
      // If we're on the landing page, mark that future navigations will be from landing
      setFromLanding(true);
    } else if (location.pathname === '/') {
      // If we're on the map page, mark that future navigations will be from map
      setFromMap(true);
    } else {
      // Reset the fromMap state when navigating to other pages
      setFromMap(false);
    }
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
