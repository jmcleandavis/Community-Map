import React, { createContext, useContext, useState } from 'react';

// Create the context with default values
const CommunitySalesContext = createContext({
  communityName: '', // Display name of the current community
  setCommunityName: () => {},
  communityId: null, // Unique ID of the current community
  setCommunityId: () => {}
});

export function CommunitySalesProvider({ children }) {
  const [communityName, setCommunityName] = useState('');
  const [communityId, setCommunityId] = useState(null);

  const value = {
    communityName,
    setCommunityName,
    communityId,
    setCommunityId
  };

  return (
    <CommunitySalesContext.Provider value={value}>
      {children}
    </CommunitySalesContext.Provider>
  );
}

// Custom hook to access community sales context
export function useCommunitySales() {
  const context = useContext(CommunitySalesContext);
  if (!context) {
    throw new Error('useCommunitySales must be used within a CommunitySalesProvider');
  }
  return context;
}
