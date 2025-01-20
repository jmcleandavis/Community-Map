import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';
import { mockGarageSales } from '../utils/mockData';

const GarageSalesContext = createContext();

export function GarageSalesProvider({ children }) {
  const [garageSales, setGarageSales] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false to avoid double fetch
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSales, setSelectedSales] = useState(new Set());

  const fetchGarageSales = useCallback(async () => {
    try {
      setLoading(true);
      console.log('GarageSalesContext: Attempting to fetch garage sales from /api/addresses');
      let data;
      
      try {
        // Use the dynamic timeout function instead of regular get
        const response = await api.getAddressesWithDynamicTimeout();
        console.log('GarageSalesContext: Response from /api/addresses:', response.data);
        data = response.data.map(sale => ({
          ...sale,
          position: {
            lat: parseFloat(sale.lat || sale.position?.lat),
            lng: parseFloat(sale.lng || sale.position?.lng)
          }
        }));
      } catch (apiError) {
        console.log('GarageSalesContext: API call failed, using mock data. Error:', apiError.message);
        console.log('GarageSalesContext: Mock data:', mockGarageSales);
        data = mockGarageSales.map(sale => ({
          ...sale,
          position: {
            lat: parseFloat(sale.position?.lat || sale.lat),
            lng: parseFloat(sale.position?.lng || sale.lng)
          }
        }));
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

      // Add IDs to the sales data
      const salesWithIds = data.map((sale, index) => {
        const processedSale = {
          ...sale,
          id: `sale-${index}`
        };
        console.log(`GarageSalesContext: Processed sale ${index}:`, processedSale);
        return processedSale;
      });

      console.log('GarageSalesContext: Final processed sales data:', salesWithIds);
      console.log('GarageSalesContext: Updating garageSales state with:', salesWithIds);
      setGarageSales(salesWithIds);
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
