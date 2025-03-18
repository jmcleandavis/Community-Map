import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MenuBar.css';

const MenuBar = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav className="menu-bar">
      <div className="menu-bar-item" onClick={() => handleNavigation('/about')}>About</div>
      <div className="menu-bar-item" onClick={() => handleNavigation('/info')}>Info</div>
      <div className="menu-bar-item" onClick={() => handleNavigation('/')}>Map View</div>
      <div className="menu-bar-item" onClick={() => handleNavigation('/admin/community-sales')}>Manage Community Sales</div>
      <div className="menu-bar-item" onClick={() => handleNavigation('/login')}>Login</div>
    </nav>
  );
};

export default MenuBar;
