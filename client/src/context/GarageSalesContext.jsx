import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 5000
});

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
      const { data: addresses } = await api.get('/api/addresses');
      const salesWithIds = addresses.map((sale, index) => ({
        ...sale,
        id: `sale-${index}`
      }));
      setGarageSales(salesWithIds);
      setError(null);
    } catch (err) {
      setError('Failed to load garage sales. Please try again later.');
      console.error('Error fetching garage sales:', err);
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
