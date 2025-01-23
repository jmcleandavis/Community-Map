import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../utils/api';
import { mockGarageSales } from '../utils/mockData';

const GarageSalesContext = createContext();

export function GarageSalesProvider({ children }) {
  const [garageSales, setGarageSales] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false to avoid double fetch
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Initialize selectedSales from localStorage if available
  const [selectedSales, setSelectedSales] = useState(() => {
    const saved = localStorage.getItem('selectedSaleIds');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist selectedSales to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedSaleIds', JSON.stringify([...selectedSales]));
  }, [selectedSales]);

  const fetchGarageSales = useCallback(async () => {
    try {
      setLoading(true);
      console.log('GarageSalesContext: Clearing cached data to force fresh API call...');
      localStorage.removeItem('garageSales');
      
      console.log('GarageSalesContext: Fetching from API...');
      let data;
      
      try {
        const response = await api.getAddresses();
        console.log('GarageSalesContext: Response from getAddressList:', response.data);
        
        // Map the response data to our expected format
        data = response.data.map(sale => {
          // Parse coordinates from string format "[lat° N/S, lng° E/W]"
          let position = { lat: null, lng: null };
          if (sale.coordinates) {
            try {
              const coords = sale.coordinates.replace(/[[\]°]/g, '').split(',');
              const lat = parseFloat(coords[0].trim());
              const lng = parseFloat(coords[1].trim());
              position = {
                lat: coords[0].includes('S') ? -lat : lat,
                lng: coords[1].includes('W') ? -lng : lng
              };
            } catch (e) {
              console.warn('Failed to parse coordinates:', sale.coordinates);
            }
          }

          return {
            id: sale.id || `sale-${Math.random().toString(36).substr(2, 9)}`,
            Address: sale.address,
            Description: sale.description,
            position: position,
          };
        });
      } catch (apiError) {
        console.error('GarageSalesContext: API call failed:', apiError.message);
        throw apiError;
      }

      if (!data || !Array.isArray(data)) {
        console.error('GarageSalesContext: Invalid data format received:', data);
        throw new Error('Invalid data format received');
      }

      // Validate and filter out items with invalid coordinates
      data = data.filter(sale => {
        const hasValidPosition = 
          sale.position &&
          !isNaN(sale.position.lat) && 
          !isNaN(sale.position.lng) &&
          sale.position.lat !== null &&
          sale.position.lng !== null;
        
        if (!hasValidPosition) {
          console.warn('GarageSalesContext: Filtered out sale with invalid position:', sale);
        }
        return hasValidPosition;
      });

      console.log('GarageSalesContext: Raw data after position processing:', data);
      
      // Cache the processed data in localStorage
      localStorage.setItem('garageSales', JSON.stringify(data));
      console.log('GarageSalesContext: Data cached in localStorage');
      
      setGarageSales(data);
      setError(null);
    } catch (err) {
      console.error('GarageSalesContext: Error in fetchGarageSales:', err);
      const errorMessage = err.response 
        ? `Server error: ${err.response.status} - ${err.response.statusText}`
        : 'Failed to load garage sales. Please try again later.';
      setError(errorMessage);
      setGarageSales([]); // Clear garage sales on error
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setGarageSales]);

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
