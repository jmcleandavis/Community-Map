import React, { createContext, useContext, useState, useEffect } from 'react';

const SelectionContext = createContext();

export function SelectionProvider({ children }) {
  // Initialize selectedSales from localStorage if available
  const [selectedSales, setSelectedSales] = useState(() => {
    const saved = localStorage.getItem('selectedSaleIds');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist selectedSales to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedSaleIds', JSON.stringify([...selectedSales]));
  }, [selectedSales]);

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
    selectedSales,
    handleCheckboxChange,
    handleSelectAll,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
}
