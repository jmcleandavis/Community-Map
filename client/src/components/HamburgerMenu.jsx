import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HamburgerMenu.css';
import GarageSales, { openGarageSalesList } from './menuItems/GarageSales';
import MyLocation from './menuItems/MyLocation';
import MapSettings from './menuItems/MapSettings';
import Auth from './menuItems/Auth';
import Settings from './menuItems/Settings';
import Help from './menuItems/Help';
import { useAuth } from '../context/AuthContext';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveItem(null);
    }
  };

  const handleMapClick = () => {
    navigate('/');
    setIsOpen(false);
  };

  const handleInfoClick = () => {
    navigate('/info');
    setIsOpen(false);
  };

  const handleMyLocation = () => {
    navigate('/my-location');
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { id: 'map', label: 'Map', path: '/' },
    { id: 'garage-sales', label: 'Garage Sales', path: '/sales' },
    { id: 'my-location', label: 'My Location', onClick: handleMyLocation },
    { id: 'map-settings', label: 'Map Settings', onClick: () => console.log('Map Settings clicked') },
    isAuthenticated
      ? { id: 'logout', label: 'Logout', onClick: handleLogout }
      : { id: 'auth', label: 'Login/Signup', path: '/login' },
    { id: 'settings', label: 'Settings', path: '/settings' },
    { id: 'help', label: 'Help', path: '/help' },
    { id: 'about', label: 'About', path: '/info' }
  ];

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
      setIsOpen(false);
    } else {
      setActiveItem(activeItem === item.id ? null : item.id);
    }
  };

  return (
    <div className="hamburger-container">
      <button className="hamburger-button" onClick={toggleMenu}>
        <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      
      {isOpen && (
        <div className="menu-content">
          <ul>
            {menuItems.map((item) => (
              <li 
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={activeItem === item.id ? 'active' : ''}
              >
                {item.label}
              </li>
            ))}
          </ul>
          {activeItem && !menuItems.find(item => item.id === activeItem)?.path && (
            <div className="menu-item-content">
              {(() => {
                const Component = menuItems.find(item => item.id === activeItem)?.component;
                return Component ? <Component /> : null;
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
