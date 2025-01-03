import React from 'react';
import { createRoot } from 'react-dom/client';
import GarageSalesList from './components/GarageSalesList';
import './components/GarageSalesList.css';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div className="garage-sales-standalone">
      <GarageSalesList />
    </div>
  </React.StrictMode>
);
