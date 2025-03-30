import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationContext = createContext();

export const useNavigation = () => {
  return useContext(NavigationContext);
};

export const NavigationProvider = ({ children }) => {
  const [fromLanding, setFromLanding] = useState(false);
  const location = useLocation();

  // Check if the user is on the landing page or came from it
  useEffect(() => {
    if (location.pathname === '/landing' || location.pathname === '/about') {
      // If we're on the landing page, mark that future navigations will be from landing
      setFromLanding(true);
    }
    // We don't reset the flag anymore so they maintain the "from landing" context
  }, [location.pathname]);

  const value = {
    fromLanding,
    setFromLanding
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
