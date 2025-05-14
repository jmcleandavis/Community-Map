import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const InitialPageContext = createContext();

// Key for sessionStorage
const SESSION_INITIAL_PAGE_KEY = 'initialPage';

export const InitialPageProvider = ({ children }) => {
  const location = useLocation();
  const [initialPath, setInitialPath] = useState(null);
  const [initialPathSet, setInitialPathSet] = useState(false);

  // Set the initial path when the app loads
  useEffect(() => {
    // Check if we have a stored initial page from a previous session (e.g., after Google redirect)
    const storedInitialPage = sessionStorage.getItem(SESSION_INITIAL_PAGE_KEY);
    
    if (storedInitialPage && !initialPathSet) {
      // If we have a stored initial page, use it
      setInitialPath(storedInitialPage);
      setInitialPathSet(true);
      console.log(`[InitialPageContext] Restored initial page from session: ${storedInitialPage}`);
    } else if (!initialPathSet) {
      // Otherwise, use the current path as the initial page
      setInitialPath(location.pathname);
      setInitialPathSet(true);
      // Store in sessionStorage for persistence during redirects
      sessionStorage.setItem(SESSION_INITIAL_PAGE_KEY, location.pathname);
      console.log(`[InitialPageContext] First page recorded in memory and session: ${location.pathname}`);
    }
  }, [location.pathname, initialPathSet]);

  // Function to check if initial page was the map
  const wasInitialPageMap = () => {
    return initialPath === '/';
  };

  // Function to check if initial page was the about/landing page
  const wasInitialPageAbout = () => {
    return initialPath === '/about' || initialPath === '/landing';
  };

  // Debug function to log the current initial page information
  const debugInitialPage = () => {
    console.log('===== INITIAL PAGE CONTEXT DEBUG INFO =====');
    console.log(`Current initial page in memory: ${initialPath || 'Not set'}`);
    console.log(`Current initial page in session: ${sessionStorage.getItem(SESSION_INITIAL_PAGE_KEY) || 'Not set'}`);
    console.log(`Is initial page map? ${wasInitialPageMap() ? 'YES' : 'NO'}`);
    console.log(`Is initial page about/landing? ${wasInitialPageAbout() ? 'YES' : 'NO'}`);
    console.log('=========================================');
  };
  
  // Function to clear the initial page (useful for testing)
  const clearInitialPage = () => {
    setInitialPath(null);
    setInitialPathSet(false);
    sessionStorage.removeItem(SESSION_INITIAL_PAGE_KEY);
    console.log('[InitialPageContext] Initial page cleared from memory and session');
  };

  return (
    <InitialPageContext.Provider
      value={{
        initialPath,
        wasInitialPageMap,
        wasInitialPageAbout,
        debugInitialPage,
        clearInitialPage
      }}
    >
      {children}
    </InitialPageContext.Provider>
  );
};

export const useInitialPage = () => {
  const context = useContext(InitialPageContext);
  if (!context) {
    throw new Error('useInitialPage must be used within an InitialPageProvider');
  }
  return context;
};

export default InitialPageContext;
