import React, { createContext, useContext, useState } from 'react';

// Create the context with default values
const CommunitySalesContext = createContext({
  communitySalesEventName: '',
  setCommunitySalesEventName: () => {},
  currentCommunityId: null,
  setCurrentCommunityId: () => {}
});

export function CommunitySalesProvider({ children }) {
  const [communitySalesEventName, setCommunitySalesEventName] = useState('');
  const [currentCommunityId, setCurrentCommunityId] = useState(null);

  const value = {
    communitySalesEventName,
    setCommunitySalesEventName,
    currentCommunityId,
    setCurrentCommunityId
  };

  return (
    <CommunitySalesContext.Provider value={value}>
      {children}
    </CommunitySalesContext.Provider>
  );
}

export function useCommunitySales() {
  const context = useContext(CommunitySalesContext);
  if (!context) {
    throw new Error('useCommunitySales must be used within a CommunitySalesProvider');
  }
  return context;
}
