import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import api from '../utils/api';

const GarageSalesAndyContext = createContext();

export function GarageSalesAndyProvider({ children }) {
  const [garageSales, setGarageSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // load garage sales when app fires
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      console.log('GarageSalesContext: Fetching from API...');
      const response = await api.getAddresses();
      var garageSales = response.data.map(gs => {
        return { ...gs, selected: false }
      });
      console.log('GarageSalesContext: Raw API response:', garageSales);
      setGarageSales(garageSales);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    localStorage.setItem('garageSales', JSON.stringify(garageSales));
  }, [garageSales]);

  const value = {
    garageSales,
    setGarageSales,
    loading,
    error
  };

  return (
    <GarageSalesAndyContext.Provider value={value}>
      {children}
    </GarageSalesAndyContext.Provider>
  );
}

export function useGarageSales() {
  const context = useContext(GarageSalesAndyContext);
  if (context === undefined) {
    throw new Error('useGarageSales must be used within a GarageSalesProvider');
  }
  console.log('useGarageSales hook: Returning context with garageSales:', context.garageSales);
  return context;
}

// Example usage
// const SomeComponent = () => {
//   const context = useGarageSales();

//   const [searchTerm, setSearchTerm] = useState('');
//   const [filteredSales, setFilteredSales] = useState(context.garageSales);

//   useEffect(() => {
//     var filteredSales = context.garageSales.filter(gs => gs.address.toLowerCase().includes(searchTerm.toLowerCase()));
//     setFilteredSales(filteredSales);
//   }, [searchTerm]);

//   return (
//     <div>
//       <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
//       <p>Garage Sales: {filteredSales.length}</p>
//       {filteredSales.map(sale =>
//         <div key={sale.id}>{sale.address}</div>
//       )}
//     </div>
//   );
// }