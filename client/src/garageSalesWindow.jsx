import React from 'react';
import { createRoot } from 'react-dom/client';
import GarageSalesList from './components/GarageSalesList';
import './components/GarageSalesList.css';

console.log('Initializing garage sales window...');

// Wait for DOM to be ready
const init = () => {
  console.log('DOM is ready, mounting React app...');
  const container = document.getElementById('root');
  
  if (!container) {
    console.error('Root container not found!');
    return;
  }
  
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <div className="garage-sales-standalone">
          <GarageSalesList />
        </div>
      </React.StrictMode>
    );
    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Error mounting React app:', error);
  }
};

// Initialize when the document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
