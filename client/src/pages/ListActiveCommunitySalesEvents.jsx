import React, { useState, useEffect } from 'react';
import './ListActiveCommunitySalesEvents.css';

function formatDate(dateString) {
  if (!dateString) return '';
  // Get only the date part if there's a T
  const [datePart] = dateString.split('T');
  const date = new Date(datePart);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  // Add ordinal suffix
  function ordinal(n) {
    if (n > 3 && n < 21) return 'th';
    switch (n % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  return `${month} ${day}${ordinal(day)}, ${year}`;
}

const API_URL = import.meta.env.VITE_MAPS_API_URL;
const APP_KEY = import.meta.env.VITE_APP_SESSION_KEY;

const ListActiveCommunitySalesEvents = () => {
  const [sales, setSales] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true);
      setError(null);
      try {
        const sessionId = sessionStorage.getItem('sessionId');
        const response = await fetch(`${API_URL}/v1/communitySales/all`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'app-name': 'web-service',
            'app-key': APP_KEY,
            'sessionId': sessionId || '',
          }
        });
        if (!response.ok) throw new Error('Failed to fetch sales');
        const data = await response.json();
        console.log('Fetched community sales data:', data);
        setSales(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const filteredSales = sales.filter(sale => {
  const searchText = search.toLowerCase();
  return (
    sale.name?.toLowerCase().includes(searchText) ||
    sale.location?.toLowerCase().includes(searchText) ||
    sale.description?.toLowerCase().includes(searchText) ||
    formatDate(sale.startDate).toLowerCase().includes(searchText) ||
    formatDate(sale.endDate).toLowerCase().includes(searchText)
  );
});

  return (
    <div style={{ maxWidth: 700, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
      <h1>Active Community Sales Events</h1>
      <input
        type="text"
        placeholder="Search by community or city..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: 10, margin: '16px 0 32px 0', borderRadius: 6, border: '1px solid #bbb', fontSize: 16 }}
      />
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && filteredSales.length === 0 && <p>No active community sales found.</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {filteredSales.map(sale => (
  <li key={sale.id} style={{ marginBottom: 24, padding: 0, border: 'none', borderRadius: 8, background: 'none' }}>
    <button
      className="community-sale-btn"
      onClick={() => {
        window.location.href = `/?communityId=${sale.id}`;
      }}
      aria-label={`View ${sale.name} on map`}
    >
      <h2 style={{ margin: 0 }}>{sale.name}</h2>
      <div style={{ color: '#555', fontSize: 15 }}>
        <strong>Location:</strong> {sale.location} <br />
        <span style={{ display: 'block', margin: '8px 0', color: '#333' }}>{sale.description}</span>
        <strong>Start:</strong> {formatDate(sale.startDate)} <br />
        <strong>End:</strong> {formatDate(sale.endDate)}
      </div>
    </button>
  </li>
))}
      </ul>
    </div>
  );
};

export default ListActiveCommunitySalesEvents;
