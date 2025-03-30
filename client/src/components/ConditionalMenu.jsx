import React from 'react';
import HamburgerMenu from './HamburgerMenu';
import MenuBar from './MenuBar';
import { useNavigation } from '../context/NavigationContext';
import { useLocation } from 'react-router-dom';

const ConditionalMenu = () => {
  const { fromLanding } = useNavigation();
  const location = useLocation();
  
  // Always use the HamburgerMenu when on the map page (root path)
  if (location.pathname === '/') {
    return <HamburgerMenu />;
  }
  
  // Use the MenuBar on landing and about pages or if we came from landing
  if (location.pathname === '/landing' || location.pathname === '/about' || fromLanding) {
    return <MenuBar />;
  }
  
  // Use HamburgerMenu for all other cases
  return <HamburgerMenu />;
};

export default ConditionalMenu;
