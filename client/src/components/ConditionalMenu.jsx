import React from 'react';
import HamburgerMenu from './HamburgerMenu';
import MenuBar from './MenuBar';
import { useNavigation } from '../context/NavigationContext';
import { useLocation } from 'react-router-dom';

const ConditionalMenu = () => {
  const { fromLanding } = useNavigation();
  const location = useLocation();
  
  // Always use the MenuBar on the landing or about pages
  if (location.pathname === '/landing' || location.pathname === '/about') {
    return <MenuBar />;
  }
  
  // Use MenuBar if we came from landing, otherwise use HamburgerMenu
  return fromLanding ? <MenuBar /> : <HamburgerMenu />;
};

export default ConditionalMenu;
