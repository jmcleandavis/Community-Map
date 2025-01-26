import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../utils/api';

const GarageSalesContext = createContext();

export function GarageSalesProvider({ children }) {
  const [garageSales, setGarageSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchInProgressRef = useRef(false);
  const initialFetchDoneRef = useRef(false);
  
  useEffect(() => {
    console.log('GarageSalesContext: Provider mounted');
    return () => {
      console.log('GarageSalesContext: Provider unmounted');
    };
  }, []);

  useEffect(() => {
    console.log('GarageSalesContext: Clearing cache on initial mount');
    localStorage.removeItem('garageSales');
    return () => {
      console.log('GarageSalesContext: Cleanup - Resetting refs');
      fetchInProgressRef.current = false;
      initialFetchDoneRef.current = false;
    };
  }, []);

  const parseCoordinates = (coordString) => {
    if (!coordString) return null;
    
    try {
      const parts = coordString.replace(/[\[\]]/g, '').split(',');
      if (parts.length !== 2) return null;

      const latPart = parts[0].trim();
      const latMatch = latPart.match(/([\d.]+)°\s*([NS])/);
      if (!latMatch) return null;
      const lat = parseFloat(latMatch[1]);
      const latDir = latMatch[2];
      const latitude = latDir === 'S' ? -lat : lat;

      const lngPart = parts[1].trim();
      const lngMatch = lngPart.match(/([\d.]+)°\s*([EW])/);
      if (!lngMatch) return null;
      const lng = parseFloat(lngMatch[1]);
      const lngDir = lngMatch[2];
      const longitude = lngDir === 'W' ? -lng : lng;

      if (isNaN(latitude) || isNaN(longitude)) return null;

      return { lat: latitude, lng: longitude };
    } catch (e) {
      console.error('Failed to parse coordinates:', coordString, e);
      return null;
    }
  };

  const fetchGarageSales = useCallback(async () => {
    console.log('fetchGarageSales called. Current state:', {
      initialFetchDone: initialFetchDoneRef.current,
      fetchInProgress: fetchInProgressRef.current,
      garageSalesLength: garageSales.length
    });

    const cachedData = localStorage.getItem('garageSales');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      console.log('Found cached data:', parsed.length, 'items');
      setGarageSales(parsed);
      initialFetchDoneRef.current = true;
      return;
    }

    if (initialFetchDoneRef.current || fetchInProgressRef.current) {
      console.log('GarageSalesContext: Fetch already completed or in progress');
      return;
    }

    console.log('GarageSalesContext: Starting fresh fetch...');
    fetchInProgressRef.current = true;
    
    try {
      setLoading(true);
      
      const response = await api.getAddresses();
      console.log('GarageSalesContext: Raw API response:', response.data);
      
      let data = response.data.map(sale => {
        const position = parseCoordinates(sale.coordinates);
        
        const address = sale.address ? 
          `${sale.address.streetNum} ${sale.address.street}` : 
          'Address not available';

        return {
          id: sale.id || `sale-${Math.random().toString(36).substr(2, 9)}`,
          address: address,
          description: sale.description || 'No description available',
          position: position,
          highlightedItems: sale.highlightedItems || []
        };
      });

      const validData = data.filter(sale => {
        const hasValidPosition = sale.position !== null;
        if (!hasValidPosition) {
          console.warn('GarageSalesContext: Filtered out sale with invalid position:', sale);
        }
        return hasValidPosition;
      });

      localStorage.setItem('garageSales', JSON.stringify(validData));
      
      setGarageSales(validData);
      initialFetchDoneRef.current = true;
      console.log('GarageSalesContext: Fetch completed successfully');
    } catch (error) {
      console.error('GarageSalesContext: Error fetching garage sales:', error);
      setError(error.message || 'Failed to fetch garage sales');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [garageSales.length]);

  const value = {
    garageSales,
    loading,
    error,
    fetchGarageSales,
  };

  return (
    <GarageSalesContext.Provider value={value}>
      {children}
    </GarageSalesContext.Provider>
  );
}

export function useGarageSales() {
  const context = useContext(GarageSalesContext);
  if (!context) {
    throw new Error('useGarageSales must be used within a GarageSalesProvider');
  }
  return context;
}
