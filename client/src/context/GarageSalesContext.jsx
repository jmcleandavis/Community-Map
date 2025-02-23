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
      console.log('GarageSalesContext: Response data structure:', JSON.stringify(response.data?.[0], null, 2));

      if (response && response.data) {
        const processedData = response.data.map(sale => {
          const address = sale.address ? 
            `${sale.address.streetNum} ${sale.address.street}` : 
            'Address not available';

          // Extract position data, ensuring we have valid numbers
          const position = {
            lat: parseFloat(sale.address?.latitude) || parseFloat(sale.address?.lat) || 0,
            lng: parseFloat(sale.address?.longitude) || parseFloat(sale.address?.long) || 0
          };

          // Log position data for debugging
          console.log('Processing sale position:', {
            originalAddress: sale.address,
            processedPosition: position
          });

          return {
            id: sale.id,
            address: address,
            description: sale.description || 'No description available',
            position: position,
            highlightedItems: sale.highlightedItems || []
          };
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
  return useContext(GarageSalesContext);
}
