import { useEffect } from 'react';
import { useCommunitySales } from '../context/CommunitySalesContext';

/**
 * Component that updates the document title based on the current community
 * This component doesn't render anything, it just updates the document title
 */
function DocumentTitle() {
  const { communityName } = useCommunitySales();
  
  useEffect(() => {
    // Set a default title if no community is selected
    const baseTitle = 'Community Map';
    
    // Update the document title when communityName changes
    if (communityName) {
      document.title = `${communityName} - Community Sale Day`;
    } else {
      document.title = baseTitle;
    }
    
    // Reset title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [communityName]);
  
  // This component doesn't render anything
  return null;
}

export default DocumentTitle;
