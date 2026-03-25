import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logger } from '../utils/logger';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CardActionArea,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  Grid,
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import LanguageIcon from '@mui/icons-material/Language';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';

function formatDate(dateString) {
  if (!dateString) return '';
  const [datePart] = dateString.split('T');
  const date = new Date(datePart);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
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
  const [sortOrder, setSortOrder] = useState('upcoming');
  const { userInfo } = useAuth();
  const navigate = useNavigate();

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
        logger.info('[ListActiveCommunitySalesEvents] Fetched community sales data:', data);
        const salesWithDummyLinks = (data || []).map((sale, i) => {
          if (i === 0) return { ...sale, facebookUrl: 'https://www.facebook.com/community-sale', websiteUrl: 'https://example.com/community' };
          if (i === 1) return { ...sale, facebookUrl: 'https://www.facebook.com/neighbourhood-sale' };
          if (i === 2) return { ...sale, websiteUrl: 'https://example.com/spring-event' };
          return sale;
        });
        setSales(salesWithDummyLinks);
      } catch (err) {
        setError(err.message);
        logger.error('[ListActiveCommunitySalesEvents] Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  const sortAndFilterSales = () => {
    const filtered = sales.filter(sale => {
      const searchText = search.toLowerCase();
      return (
        sale.name?.toLowerCase().includes(searchText) ||
        sale.location?.toLowerCase().includes(searchText) ||
        sale.description?.toLowerCase().includes(searchText) ||
        formatDate(sale.startDate).toLowerCase().includes(searchText) ||
        formatDate(sale.endDate).toLowerCase().includes(searchText)
      );
    });

    return filtered.sort((a, b) => {
      const now = new Date();
      const dateA = a.startDate ? new Date(a.startDate) : new Date(0);
      const dateB = b.startDate ? new Date(b.startDate) : new Date(0);

      switch (sortOrder) {
        case 'upcoming':
          if (dateA < now && dateB >= now) return 1;
          if (dateA >= now && dateB < now) return -1;
          return dateA - dateB;
        case 'recent':
          if (dateA < now && dateB >= now) return 1;
          if (dateA >= now && dateB < now) return -1;
          return dateB - dateA;
        case 'alphabetical': {
          const nameA = (a.name || '').toLowerCase();
          const nameB = (b.name || '').toLowerCase();
          return nameA.localeCompare(nameB);
        }
        default:
          return dateA - dateB;
      }
    });
  };

  const filteredSales = sortAndFilterSales();

  const isUpcoming = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) >= new Date();
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h2" sx={{ mb: 3 }}>Community Sales Events</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by community or location..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="upcoming">Upcoming Events</MenuItem>
          <MenuItem value="recent">Latest Events</MenuItem>
          <MenuItem value="alphabetical">Alphabetical</MenuItem>
        </TextField>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && !error && filteredSales.length === 0 && (
        <Alert severity="info">No active community sales found.</Alert>
      )}

      <Stack spacing={2}>
        {filteredSales.map(sale => {
          const isManagedByUser = userInfo?.userId === sale.userId || userInfo?.id === sale.userId;
          const upcoming = isUpcoming(sale.endDate);

          return (
            <Card key={sale.id}>
              <CardActionArea
                onClick={() => { window.location.href = `/?communityId=${sale.id}`; }}
                sx={{ p: 0 }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="h4" noWrap>{sale.name}</Typography>
                        <Chip
                          label={upcoming ? 'Upcoming' : 'Past'}
                          color={upcoming ? 'success' : 'default'}
                          size="small"
                          variant={upcoming ? 'filled' : 'outlined'}
                        />
                      </Stack>

                      {sale.location && (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">{sale.location}</Typography>
                        </Stack>
                      )}

                      {sale.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {sale.description}
                        </Typography>
                      )}

                      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <CalendarTodayIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(sale.startDate)} — {formatDate(sale.endDate)}
                          </Typography>
                        </Stack>

                        {(sale.facebookUrl || sale.websiteUrl) && (
                          <Stack direction="row" spacing={1}>
                            {sale.facebookUrl && (
                              <IconButton
                                size="small"
                                href={sale.facebookUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                sx={{ color: '#1877F2' }}
                              >
                                <FacebookIcon fontSize="small" />
                              </IconButton>
                            )}
                            {sale.websiteUrl && (
                              <IconButton
                                size="small"
                                href={sale.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                color="default"
                              >
                                <LanguageIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Stack>
                        )}
                      </Stack>
                    </Box>

                    {isManagedByUser && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); navigate('/admin/community-sales'); }}
                        sx={{ ml: 2, flexShrink: 0 }}
                      >
                        Manage
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default ListActiveCommunitySalesEvents;
