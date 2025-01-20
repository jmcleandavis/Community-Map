import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api';
import { mockGarageSales } from '../utils/mockData';

const GarageSalesContext = createContext();

export function GarageSalesProvider({ children }) {
  const [garageSales, setGarageSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSales, setSelectedSales] = useState(new Set());

  const fetchGarageSales = async () => {
    try {
      setLoading(true);
      console.log('Attempting to fetch garage sales from /api/addresses');
      let data;
      
      try {
        const response = await api.get('/api/addresses');
        console.log('Response from /api/addresses:', response.data);
        data = response.data;
      } catch (apiError) {
        console.warn('API call failed, using mock data:', apiError);
        data = mockGarageSales;
      }

      if (!data || !Array.isArray(data)) {
        throw new Error('Invalid data format received');
      }

      // Add IDs to the sales data
      const salesWithIds = data.map((sale, index) => ({
        ...sale,
        id: `sale-${index}`
      }));

      console.log('Processed sales data:', salesWithIds);
      setGarageSales(salesWithIds);
      setError(null);
    } catch (err) {
      const errorMessage = err.response 
        ? `Server error: ${err.response.status} - ${err.response.statusText}`
        : 'Failed to load garage sales. Please try again later.';
      console.error('Error details:', {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data
      });
      setError(errorMessage);
      setGarageSales([]); // Clear garage sales on error
    } finally {
      setLoading(false);
    }
  };

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
  return context;
}
