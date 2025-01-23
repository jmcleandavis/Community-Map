import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../utils/api';
import { mockGarageSales } from '../utils/mockData';

const GarageSalesContext = createContext();

export function GarageSalesProvider({ children }) {
  const [garageSales, setGarageSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fetchInProgressRef = useRef(false);
  const initialFetchDoneRef = useRef(false);
  
  // Debug mount/unmount cycles
  useEffect(() => {
    console.log('GarageSalesContext: Provider mounted');
    return () => {
      console.log('GarageSalesContext: Provider unmounted');
    };
  }, []);

  // Clear cache on initial mount
  useEffect(() => {
    console.log('GarageSalesContext: Clearing cache on initial mount');
    console.log('Initial fetch status:', {
      fetchInProgress: fetchInProgressRef.current,
      initialFetchDone: initialFetchDoneRef.current
    });
    localStorage.removeItem('garageSales');
    return () => {
      console.log('GarageSalesContext: Cleanup - Resetting refs');
      fetchInProgressRef.current = false;
      initialFetchDoneRef.current = false;
    };
  }, []); // Empty dependency array means this runs once on mount

  // Initialize selectedSales from localStorage if available
  const [selectedSales, setSelectedSales] = useState(() => {
    const saved = localStorage.getItem('selectedSaleIds');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist selectedSales to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedSaleIds', JSON.stringify([...selectedSales]));
  }, [selectedSales]);

  const parseCoordinates = (coordString) => {
    if (!coordString) return null;
    
    try {
      // Remove brackets and split by comma
      const parts = coordString.replace(/[\[\]]/g, '').split(',');
      if (parts.length !== 2) return null;

      // Process latitude
      const latPart = parts[0].trim();
      const latMatch = latPart.match(/([\d.]+)°\s*([NS])/);
      if (!latMatch) return null;
      const lat = parseFloat(latMatch[1]);
      const latDir = latMatch[2];
      const latitude = latDir === 'S' ? -lat : lat;

      // Process longitude
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

    // Check if we have cached data first
    const cachedData = localStorage.getItem('garageSales');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      console.log('Found cached data:', parsed.length, 'items');
      setGarageSales(parsed);
      initialFetchDoneRef.current = true;
      return;
    }

    // Multiple safeguards against repeated fetches
    if (initialFetchDoneRef.current) {
      console.log('GarageSalesContext: Initial fetch already completed');
      return;
    }

    if (fetchInProgressRef.current) {
      console.log('GarageSalesContext: Fetch already in progress');
      return;
    }

    console.log('GarageSalesContext: Starting fresh fetch...');
    fetchInProgressRef.current = true;
    
    try {
      setLoading(true);
      
      console.log('GarageSalesContext: Fetching from API...');
      const response = await api.getAddresses();
      console.log('GarageSalesContext: Raw API response:', response.data);
      
      // Map the response data to our expected format
      let data = response.data.map(sale => {
        const position = parseCoordinates(sale.coordinates);
        
        if (!position) {
          console.warn('GarageSalesContext: Failed to parse coordinates for sale:', {
            id: sale.id,
            coordinates: sale.coordinates
          });
        }

        const address = sale.address ? 
          `${sale.address.streetNum} ${sale.address.street}` : 
          'Address not available';

        return {
          id: sale.id || `sale-${Math.random().toString(36).substr(2, 9)}`,
          address: address,
          description: sale.description || '',
          position: position,
          highlightedItems: sale.highlightedItems || []
        };
      });

      // Filter out invalid positions
      const validData = data.filter(sale => {
        const hasValidPosition = sale.position !== null;
        if (!hasValidPosition) {
          console.warn('GarageSalesContext: Filtered out sale with invalid position:', sale);
        }
        return hasValidPosition;
      });

      console.log('GarageSalesContext: Processed data:', {
        total: data.length,
        valid: validData.length,
        data: validData
      });

      // Cache the processed data
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleCheckboxChange = (saleId) => {
    setSelectedSales(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(saleId)) {
        newSelected.delete(saleId);
      } else {
        newSelected.add(saleId);
      }
      return newSelected;
    });
  };

  const handleSelectAll = (filteredSales) => {
    if (selectedSales.size === filteredSales.length) {
      setSelectedSales(new Set());
    } else {
      setSelectedSales(new Set(filteredSales.map(sale => sale.id)));
    }
  };

  const value = {
    garageSales,
    loading,
    error,
    searchTerm,
    selectedSales,
    fetchGarageSales,
    handleSearchChange,
    handleCheckboxChange,
    handleSelectAll,
    setSelectedSales
  };

  console.log('GarageSalesContext: Providing context with garageSales:', garageSales);

  return (
    <GarageSalesContext.Provider value={value}>
      {children}
    </GarageSalesContext.Provider>
  );
}

export function useGarageSales() {
  const context = useContext(GarageSalesContext);
  if (context === undefined) {
    throw new Error('useGarageSales must be used within a GarageSalesProvider');
  }
  console.log('useGarageSales hook: Returning context with garageSales:', context.garageSales);
  return context;
}
