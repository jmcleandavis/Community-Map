import React, { createContext, useContext, useState } from 'react';

const DisplayContext = createContext();

export function DisplayProvider({ children }) {
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  const toggleDisplayMode = () => {
    setShowOnlySelected(prev => !prev);
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
