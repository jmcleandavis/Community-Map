import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HamburgerMenu.css';
import Auth from './menuItems/Auth';
import Settings from './menuItems/Settings';
import Help from './menuItems/Help';
import DisplayMode from './menuItems/DisplayMode';
import { useAuth } from '../context/AuthContext';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isAdmin, logout } = useAuth();

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
        <div className="menu-items">
          <div className="menu-item" onClick={handleMapClick}>
            <span className="menu-icon">🗺️</span>
            <span className="menu-text">Map</span>
          </div>
          <DisplayMode onSelect={() => setIsOpen(false)} />
          <div className="menu-item" onClick={() => {
            navigate('/sales');
            setIsOpen(false);
          }}>
            <span className="menu-icon">🏷️</span>
            <span className="menu-text">Garage Sales</span>
          </div>
          {isAuthenticated && isAdmin && (
            <div className="menu-item" onClick={() => {
              navigate('/admin/sales');
              setIsOpen(false);
            }}>
              <span className="menu-icon">⚙️</span>
              <span className="menu-text">Manage Sales</span>
            </div>
          )}
          <div className="menu-item" onClick={handleMyLocation}>
            <span className="menu-icon">📍</span>
            <span className="menu-text">My Location</span>
          </div>
          <div className="menu-item" onClick={() => {
            console.log('Map Settings clicked');
            setIsOpen(false);
          }}>
            <span className="menu-icon">⚙️</span>
            <span className="menu-text">Map Settings</span>
          </div>
          <div className="menu-item" onClick={() => {
            navigate('/help');
            setIsOpen(false);
          }}>
            <span className="menu-icon">❓</span>
            <span className="menu-text">Help</span>
          </div>
          <div className="menu-item" onClick={() => {
            navigate('/info');
            setIsOpen(false);
          }}>
            <span className="menu-icon">ℹ️</span>
            <span className="menu-text">Info</span>
          </div>
          {isAuthenticated ? (
            <div className="menu-item" onClick={handleLogout}>
              <span className="menu-icon">🚪</span>
              <span className="menu-text">Logout</span>
            </div>
          ) : (
            <div className="menu-item" onClick={() => {
              navigate('/login');
              setIsOpen(false);
            }}>
              <span className="menu-icon">🔑</span>
              <span className="menu-text">Login</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
