import React, { useState } from 'react';
import './HamburgerMenu.css';
import GarageSales from './menuItems/GarageSales';
import MyLocation from './menuItems/MyLocation';
import MapSettings from './menuItems/MapSettings';
import Auth from './menuItems/Auth';
import Settings from './menuItems/Settings';
import Help from './menuItems/Help';
import Info from './menuItems/Info';

const HamburgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setActiveItem(null);
    }
  };

  const menuItems = [
    { id: 'garage-sales', label: 'Garage Sales', component: GarageSales },
    { id: 'my-location', label: 'My Location', component: MyLocation },
    { id: 'map', label: 'Map', component: MapSettings },
    { id: 'auth', label: 'Login/Signup', component: Auth },
    { id: 'settings', label: 'Settings', component: Settings },
    { id: 'help', label: 'Help', component: Help },
    { id: 'info', label: 'Info', component: Info },
  ];

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
            {menuItems.map(({ id, label, component: Component }) => (
              <li 
                key={id}
                onClick={() => setActiveItem(activeItem === id ? null : id)}
                className={activeItem === id ? 'active' : ''}
              >
                {label}
                {activeItem === id && <Component />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HamburgerMenu;
