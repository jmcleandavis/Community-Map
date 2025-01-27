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
    // Fetch garage sales immediately on mount
    fetchGarageSales();
    
    return () => {
      console.log('GarageSalesContext: Provider unmounted');
    };
  }, []);

  const parseCoordinates = (coordString) => {
    if (!coordString) {
      console.warn('GarageSalesContext: Empty coordinates string');
      return null;
    }
    
    try {
      const parts = coordString.replace(/[\[\]]/g, '').split(',');
      if (parts.length !== 2) {
        console.warn('GarageSalesContext: Invalid coordinate format - expected 2 parts, got:', parts.length);
        return null;
      }

      const latPart = parts[0].trim();
      const latMatch = latPart.match(/([\d.]+)°\s*([NS])/);
      if (!latMatch) {
        console.warn('GarageSalesContext: Could not parse latitude from:', latPart);
        return null;
      }
      const lat = parseFloat(latMatch[1]);
      const latDir = latMatch[2];
      const latitude = latDir === 'S' ? -lat : lat;

      const lngPart = parts[1].trim();
      const lngMatch = lngPart.match(/([\d.]+)°\s*([EW])/);
      if (!lngMatch) {
        console.warn('GarageSalesContext: Could not parse longitude from:', lngPart);
        return null;
      }
      const lng = parseFloat(lngMatch[1]);
      const lngDir = lngMatch[2];
      const longitude = lngDir === 'W' ? -lng : lng;

      if (isNaN(latitude) || isNaN(longitude)) {
        console.warn('GarageSalesContext: Invalid numeric values:', { latitude, longitude });
        return null;
      }

      return { lat: latitude, lng: longitude };
    } catch (e) {
      console.error('GarageSalesContext: Failed to parse coordinates:', coordString, e);
      return null;
    }
  };

  const fetchGarageSales = useCallback(async () => {
    if (fetchInProgressRef.current) {
      console.log('GarageSalesContext: Fetch already in progress');
      return;
    }

    if (initialFetchDoneRef.current) {
      console.log('GarageSalesContext: Initial fetch already done');
      return;
    }

    try {
      console.log('GarageSalesContext: Starting fetch');
      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      const response = await api.getAddresses();
      console.log('GarageSalesContext: Raw API response:', response);

      if (response && response.data) {
        const processedData = response.data.map(sale => {
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
        }).filter(sale => {
          const hasValidPosition = sale.position !== null;
          if (!hasValidPosition) {
            console.warn('GarageSalesContext: Filtered out sale with invalid position:', sale);
          }
          return hasValidPosition;
        });

        setGarageSales(processedData);
        initialFetchDoneRef.current = true;
        console.log('GarageSalesContext: Fetch completed successfully');
      }
    } catch (err) {
      console.error('GarageSalesContext: Error fetching garage sales:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, []);

  return (
    <GarageSalesContext.Provider
      value={{
        garageSales,
        loading,
        error,
        fetchGarageSales
      }}
    >
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
