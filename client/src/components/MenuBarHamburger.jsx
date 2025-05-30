import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import './MenuBarHamburger.css';

const MenuBarHamburger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, userEmail } = useAuth();
  const { setFromLanding } = useNavigation();
  const menuRef = useRef(null);

  const handleNavigation = (path) => {
    setFromLanding(true); // Set that navigation came from landing/menu bar
    navigate(path);
    setIsOpen(false); // Close menu after navigation
  };

  const handleLogout = () => {
    logout();
    setFromLanding(true); // Maintain the menu bar even after logout
    setIsOpen(false); // Close menu after logout
    
    // When on landing/about page, stay there after logout
    if (location.pathname === '/landing' || location.pathname === '/about') {
      navigate(location.pathname); // Stay on the current page
    } else {
      navigate('/landing'); // Otherwise go to landing page
    }
  };

  // Function to check if a click is outside the menu
  const handleClickOutside = (event) => {
    // Check if click is outside the menu and not on the hamburger button
    if (menuRef.current && !menuRef.current.contains(event.target) && 
        !event.target.closest('.menubar-hamburger-button')) {
      // Close the menu when clicking outside
      setIsOpen(false);
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

  return (
    <div className="menubar-hamburger-container">
      <button className="menubar-hamburger-button" onClick={() => setIsOpen(!isOpen)}>
        <div className={`menubar-hamburger-icon ${isOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className={`menubar-menu-items ${isOpen ? 'open' : ''}`} ref={menuRef}>
        <div className="menubar-menu-item" onClick={() => handleNavigation('/about')}>
          <span className="menubar-menu-icon">📖</span>
          <span className="menubar-menu-text">About</span>
        </div>

        <div className="menubar-menu-item" onClick={() => handleNavigation('/list-active-community-sales-events')}>
          <span className="menubar-menu-icon">📋</span>
          <span className="menubar-menu-text">List of Active Community Sales Events</span>
        </div>

        <div className="menubar-menu-item" onClick={() => handleNavigation('/admin/community-sales')}>
          <span className="menubar-menu-icon">⚙️</span>
          <span className="menubar-menu-text">Manage Community Sales</span>
        </div>

        <div className="menubar-menu-item" onClick={() => handleNavigation('/info')}>
          <span className="menubar-menu-icon">ℹ️</span>
          <span className="menubar-menu-text">Info</span>
        </div>

        {isAuthenticated ? (
          <div className="menubar-menu-item" onClick={handleLogout}>
            <span className="menubar-menu-icon">🚪</span>
            <span className="menubar-menu-text">Logout</span>
          </div>
        ) : (
          <div className="menubar-menu-item" onClick={() => handleNavigation('/login?from=landing')}>
            <span className="menubar-menu-icon">🔑</span>
            <span className="menubar-menu-text">Login</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBarHamburger;
