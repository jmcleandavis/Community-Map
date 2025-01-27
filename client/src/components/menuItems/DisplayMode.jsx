import React from 'react';
import { useDisplay } from '../../context/DisplayContext';

const DisplayMode = ({ onSelect }) => {
  const { showOnlySelected, toggleDisplayMode } = useDisplay();

  const handleClick = () => {
    toggleDisplayMode();
    if (onSelect) {
      onSelect();
    }
  };

  return (
    <div className="menu-item" onClick={handleClick}>
      <span className="menu-icon">
        {showOnlySelected ? '👁️' : '🔍'}
      </span>
      <span className="menu-text">
        {showOnlySelected ? 'Show All Sales' : 'Show Selected Sales'}
      </span>
    </div>
  );
};

export default DisplayMode;
