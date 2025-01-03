import React from 'react';
import GarageSalesList from '../components/GarageSalesList';
import '../components/GarageSalesList.css';

const GarageSalesWindow = () => {
  return (
    <div className="garage-sales-standalone">
      <GarageSalesList />
    </div>
  );
};

export default GarageSalesWindow;
