import React, { useState, useEffect } from 'react';

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
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'app-name': 'web-service',
            'app-key': APP_KEY,
            'sessionId': sessionId || '',
          },
          body: '',
        });
        if (!response.ok) throw new Error('Failed to fetch sales');
        const data = await response.json();
        setSales(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const filteredSales = sales.filter(sale =>
    sale.communityName?.toLowerCase().includes(search.toLowerCase()) ||
    sale.city?.toLowerCase().includes(search.toLowerCase())
  );

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
          <li key={sale.id} style={{ marginBottom: 24, padding: 18, border: '1px solid #eee', borderRadius: 8 }}>
            <h2 style={{ margin: 0 }}>{sale.communityName}</h2>
            <div style={{ color: '#555', fontSize: 15 }}>
              <strong>City:</strong> {sale.city} <br />
              <strong>Status:</strong> {sale.status} <br />
              <strong>Start:</strong> {sale.startDate} <br />
              <strong>End:</strong> {sale.endDate}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListActiveCommunitySalesEvents;
