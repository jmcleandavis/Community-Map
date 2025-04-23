import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation as useLocationContext } from '../context/LocationContext';
import DisplayMode from './menuItems/DisplayMode';
import './HamburgerMenu.css';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userId, userType, logout, userEmail, userInfo } = useAuth();
  const { centerOnUserLocation } = useLocationContext();
  const menuRef = useRef(null);

  // Function to check if a click is outside the menu
  const handleClickOutside = (event) => {
    // Check if click is outside the menu and not on the hamburger button
    if (menuRef.current && !menuRef.current.contains(event.target) && 
        !event.target.closest('.hamburger-button')) {
      // Close the menu when clicking outside
      setIsOpen(false);
    }
  };

  // Additional handler specifically for map clicks
  const handleMapClick = () => {
    // This will be called when the map is clicked via the MapView component
    setIsOpen(false);
  };
  
  // Expose the handleMapClick function to the window object so it can be called from MapView
  useEffect(() => {
    // Make the function accessible globally
    window.closeHamburgerMenu = handleMapClick;
    
    return () => {
      // Clean up when component unmounts
      delete window.closeHamburgerMenu;
    };
  }, []);

  // Add event listener when component mounts
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup function to remove event listener when component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); // Empty dependency array means this runs once on mount

  // Handler for Map menu item click
  const handleMapMenuItemClick = () => {
    navigate('/');
    setIsOpen(false);
  };


  const handleLogout = () => {
    logout();
    setIsOpen(false);
    
    // When on map view, stay there after logout
    if (location.pathname === '/') {
      navigate('/'); // Stay on the map page
    } else {
      navigate('/landing'); // Otherwise go to landing page
    }
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
        {isAuthenticated && (
          <div className="menu-header">
            <span className="menu-icon">👤</span>
            <span className="menu-user">{userInfo?.fName} {userInfo?.lName}</span>
          </div>
        )}

        <div className="menu-item" onClick={handleMapMenuItemClick}>
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

        {/* Community Sales Administration menu item removed */}


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
          navigate('/about');
          setIsOpen(false);
        }}>
          <span className="menu-icon">📖</span>
          <span className="menu-text">About</span>
        </div>

        {isAuthenticated ? (
          <div className="menu-item" onClick={handleLogout}>
            <span className="menu-icon">🚪</span>
            <span className="menu-text">Logout ({userEmail})</span>
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
