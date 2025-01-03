import React from 'react';
import '../menuItems/menuItems.css';

export const openGarageSalesList = () => {
  const width = 800;
  const height = 600;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;

  // Use the new garageSales.html entry point
  const windowUrl = `${window.location.origin}/garageSales.html`;
  
  console.log('Opening garage sales window at:', windowUrl);
  
  const newWindow = window.open(
    windowUrl,
    'GarageSalesList',
    `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
  );

  if (!newWindow) {
    console.error('Failed to open garage sales window - popup might be blocked');
  }
};

const GarageSales = () => {
  return (
    <div className="menu-item garage-sales">
      <h2>Garage Sales</h2>
      <div className="content">
      </div>
    </div>
  );
};

export default GarageSales;
