import React from 'react';
import HamburgerMenu from './HamburgerMenu';
import MenuBar from './MenuBar';
import { useNavigation } from '../context/NavigationContext';
import { useLocation } from 'react-router-dom';

const ConditionalMenu = () => {
  const { fromLanding } = useNavigation();
  const location = useLocation();
  
  // Always use the landing page menu on the landing page itself
  if (location.pathname === '/landing') {
    return null; // Landing page has its own menu
  }
  
  // Use MenuBar if we came from landing, otherwise use HamburgerMenu
  return fromLanding ? <MenuBar /> : <HamburgerMenu />;
};

export default ConditionalMenu;
