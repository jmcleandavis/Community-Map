import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './MenuBar.css';

const MenuBar = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout, userEmail } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="menu-bar">
      <div className="menu-bar-item" onClick={() => handleNavigation('/about')}>About</div>
      <div className="menu-bar-item" onClick={() => handleNavigation('/info')}>Info</div>
      <div className="menu-bar-item" onClick={() => handleNavigation('/admin/community-sales')}>Manage Community Sales</div>
      {isAuthenticated ? (
        <div className="menu-bar-item" onClick={handleLogout}>Logout ({userEmail})</div>
      ) : (
        <div className="menu-bar-item" onClick={() => handleNavigation('/login')}>Login</div>
      )}
    </nav>
  );
};

export default MenuBar;
