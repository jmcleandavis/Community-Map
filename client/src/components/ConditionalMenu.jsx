import React from 'react';
import HamburgerMenu from './HamburgerMenu';
import MenuBar from './MenuBar';
import { useNavigation } from '../context/NavigationContext';
import { useLocation } from 'react-router-dom';

const ConditionalMenu = () => {
  const { fromLanding } = useNavigation();
  const location = useLocation();
  
  // Pages that should always use the HamburgerMenu regardless of navigation path
  const alwaysHamburgerPages = ['/', '/help', '/settings', '/sales'];
  if (alwaysHamburgerPages.includes(location.pathname)) {
    return <HamburgerMenu />;
  }
  
  // Use the MenuBar on landing and about pages or if we came from landing
  // but not for pages that should always use the hamburger menu
  if ((location.pathname === '/landing' || location.pathname === '/about' || fromLanding) && 
      !alwaysHamburgerPages.includes(location.pathname)) {
    return <MenuBar />;
  }
  
  // Use HamburgerMenu for all other cases
  return <HamburgerMenu />;
};

export default ConditionalMenu;
