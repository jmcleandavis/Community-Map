import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import DisplayMode from './menuItems/DisplayMode';
import './HamburgerMenu.css';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, userId, userType, logout } = useAuth();
  const { centerOnUserLocation } = useLocation();
  const menuRef = useRef(null);

  // Function to check if a click is outside the menu
  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsOpen(false); // Close the menu
    }
  };

  // Add event listener when component mounts
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup function to remove event listener when component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Empty dependency array means this runs once on mount

  const handleMapClick = () => {
    navigate('/');
    setIsOpen(false);
  };

  const handleMyLocation = () => {
    centerOnUserLocation();
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="hamburger-container">
      <button className="hamburger-button" onClick={() => setIsOpen(!isOpen)}>
        <div className={`hamburger-icon ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className={`menu-items ${isOpen ? 'open' : ''}`} ref={menuRef}>
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

        {userType === 'admin' && (
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
          navigate('/settings');
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
            <span className="menu-text">Logout ({userId})</span>
          </div>
        ) : (
          <div className="menu-item" onClick={() => {
            navigate('/login');
            setIsOpen(false);
          }}>
            <span className="menu-icon">🔑</span>
            <span className="menu-text">Login/Signup</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HamburgerMenu;
