import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../menuItems/menuItems.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore } from '@fortawesome/free-solid-svg-icons';

const GarageSalesMenuItem = () => {
  const navigate = useNavigate();

  const openGarageSalesList = () => {
    navigate('/garage-sales');
  };

  return (
    <div className="menu-item" onClick={openGarageSalesList}>
      <FontAwesomeIcon icon={faStore} className="menu-icon" />
      <span>Garage Sales</span>
    </div>
  );
};

export default GarageSalesMenuItem;
