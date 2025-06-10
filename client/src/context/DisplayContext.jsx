import React, { createContext, useContext, useState } from 'react';

const DisplayContext = createContext();

export function DisplayProvider({ children }) {
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const toggleDisplayMode = (mode) => {
    if (mode === 'showAll') {
      setShowOnlySelected(false);
    } else if (mode === 'showSelected') {
      setShowOnlySelected(true);
    } else if (mode === 'optimizedRoute') {
      // For optimized route, we don't change the showOnlySelected state
      // This is handled separately via the showOptimizedRoute parameter
    } else {
      // Default toggle behavior when no specific mode is provided
      setShowOnlySelected(prev => !prev);
    }
  };

  const value = {
    showOnlySelected,
    toggleDisplayMode
  };

  return (
    <DisplayContext.Provider value={value}>
      {children}
    </DisplayContext.Provider>
  );
}

export function useDisplay() {
  const context = useContext(DisplayContext);
  if (!context) {
    throw new Error('useDisplay must be used within a DisplayProvider');
  }
  return context;
}
