import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Checkbox, 
  Container, 
  FormControlLabel, 
  Grid, 
  IconButton, 
  InputAdornment, 
  Paper, 
  TextField, 
  Typography,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Map as MapIcon, 
  CheckBox as CheckBoxIcon, 
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useGarageSales } from '../context/GarageSalesContext';
import { useAuth } from '../context/AuthContext';
import { useDisplay } from '../context/DisplayContext';
import { useSearch } from '../context/SearchContext';
import { useSelection } from '../context/SelectionContext';
import { useCommunitySales } from '../context/CommunitySalesContext';
import LoginRequiredModal from '../components/LoginRequiredModal';
import api from '../utils/api';

const GarageSales = () => {
  const {
    garageSales,
    loading,
    error,
    fetchGarageSales
  } = useGarageSales();
  
  const { searchTerm, handleSearchChange } = useSearch();
  const { selectedSales, handleCheckboxChange, handleDeselectAll } = useSelection();
  const { showOnlySelected, toggleDisplayMode } = useDisplay();
  
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, userEmail, userInfo } = useAuth();
  const { communityName, setCommunityName, communityId, setCommunityId } = useCommunitySales();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOptimizeRoute, setShowOptimizeRoute] = useState(false);
  const [optimizedRouteAddresses, setOptimizedRouteAddresses] = useState([]);
  const [showRouteList, setShowRouteList] = useState(false);
  const [userAddressList, setUserAddressList] = useState(null);
  const [optimizeFullRoute, setOptimizeFullRoute] = useState(false);
  const [selectionsInitialized, setSelectionsInitialized] = useState(false);

  // Extract communityId from URL parameters and update context/state
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('communityId');
    
    if (id) {
      // Update local state
      setCommunityId(id);
      // Update context
      setCommunityId(id);
      
      // If we don't have the community name in context, fetch it
      if (!communityName) {
        console.log('GarageSales: Community name not in context, fetching from API');
        const fetchCommunityName = async () => {
          try {
            const apiUrl = `${import.meta.env.VITE_MAPS_API_URL}/v1/communitySales/${id}`;
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'app-name': 'web-service',
                'app-key': import.meta.env.VITE_APP_SESSION_KEY
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const name = data.name || 'Community Sale';
              setCommunityName(name);
              setCommunityName(name); // Also update the context
            }
          } catch (error) {
            console.error('Error fetching community name:', error);
          }
        };
        
        fetchCommunityName();
      } else {
        console.log('GarageSales: Using community name from context:', communityName);
        setCommunityName(communityName);
      }
    }
  }, [location, communityName, setCommunityId, setCommunityName]);

  // Fetch garage sales, filtered by communityId if available
  useEffect(() => {
    fetchGarageSales(communityId);
  }, [fetchGarageSales, communityId]);

  // Reset selections initialized flag when community changes
  useEffect(() => {
    setSelectionsInitialized(false);
  }, [communityId]);

  // Effect to fetch user's saved address list from server if user is logged in - only runs once on mount
  useEffect(() => {
    const fetchUserAddressList = async () => {
      if (isAuthenticated && userInfo?.userId) {
        try {
          console.log('Fetching user address list for user:', userInfo.userId);
          const userAddressListResponse = await api.getUserAddressList(userInfo.userId);
          
          if (userAddressListResponse && userAddressListResponse.addressList && userAddressListResponse.addressList.length > 0) {
            console.log('User has saved address list on server:', userAddressListResponse.addressList);
            setUserAddressList(userAddressListResponse.addressList);
          } else {
            console.log('User does not have a saved address list on server, using local selections');
            setUserAddressList([]);
          }
        } catch (error) {
          console.error('Error fetching user address list:', error);
          // If there's an error, we'll fall back to the local storage selections
          setUserAddressList([]);
        }
      }
    };
    
    fetchUserAddressList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to filter and apply user's selected sales when garage sales are loaded
  useEffect(() => {
    if (userAddressList && garageSales && garageSales.length > 0 && communityId && !selectionsInitialized) {
      // Filter the selected sales to only include those from the current community
      let filteredSelectedSales = userAddressList;
      
      // Get the IDs of garage sales that belong to the current community
      const currentCommunityGarageSaleIds = garageSales.map(sale => sale.id);
      
      // Filter the user's selected sales to only include those in the current community
      filteredSelectedSales = userAddressList.filter(selectedSaleId => 
        currentCommunityGarageSaleIds.includes(selectedSaleId)
      );
      
      console.log('Filtered selected sales for current community:', filteredSelectedSales);
      console.log('Current community garage sale IDs:', currentCommunityGarageSaleIds);
      
      // Convert the filtered array to a Set for the selection context
      const serverSelectedSales = new Set(filteredSelectedSales);
      
      // Update the selected sales in the selection context
      // This will override any locally stored selections
      handleDeselectAll(); // Clear existing selections first
      
      // Add each server-side selection that belongs to the current community
      serverSelectedSales.forEach(saleId => {
        handleCheckboxChange(saleId);
      });
      
      console.log('Updated selections from server list (filtered for current community)');
      setSelectionsInitialized(true); // Mark selections as initialized
    }
  }, [userAddressList, garageSales, communityId]);

  const handleSelectionWithAuth = (saleId) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // Just update local selection state without server calls
    handleCheckboxChange(saleId);
  };

  const handleViewOnMap = (sale) => {
    const saleToView = {
      ...sale,
      lat: sale.position.lat,
      lng: sale.position.lng,
      address: sale.address,
      description: sale.description
    };
    
    localStorage.setItem('selectedSales', JSON.stringify([saleToView]));
    navigate(`/?communityId=${communityId || ''}`);
  };

  const handleDeselectAllWithServerUpdate = async () => {
    // First, clear the local selections
    handleDeselectAll();
    
    // Then, if user is authenticated, update the server with an empty list
    if (isAuthenticated && userInfo?.userId) {
      try {
        console.log('Updating server with empty selection list for user:', userInfo.userId);
        
        // Call API with empty array for addressList
        const response = await api.createUpdateUserAddressList(userInfo.userId, []);
        console.log('Successfully updated server with empty selection list:', response);
      } catch (error) {
        console.error('Error updating server with empty selection list:', error);
      }
    }
  };

  const handleViewSelected = async () => {
    // Filter sales to only include those from the current communityId
    // and that are also in the selectedSales set
    const selectedSalesData = filteredSales
      .filter(sale => selectedSales.has(sale.id));

    if (selectedSalesData.length > 0) {
      // If user is authenticated, save the selection to the server
      if (isAuthenticated && userInfo?.userId) {
        try {
          console.log('Saving selected sales to server for user:', userInfo.userId);
          
          // Extract just the IDs for the server request, but only for the current communityId
          // This ensures we're not including sales from other community events
          const selectedSaleIds = selectedSalesData.map(sale => sale.id);
          
          console.log(`Filtered ${selectedSales.size} total selected sales to ${selectedSaleIds.length} sales for current community ID: ${communityId}`);
          
          // Save the selected sales to the server with the current communityId
          const response = await api.createUpdateUserAddressList(userInfo.userId, selectedSaleIds, communityId);
          console.log('Successfully saved selected sales to server:', response);
          
          // Optional: Show a success message
          // alert('Your selected garage sales have been saved to your account.');
        } catch (error) {
          console.error('Error saving selected sales to server:', error);
          // Continue with navigation even if server save fails
          // We don't want to block the user from viewing their selections
        }
      } else {
        console.log('User not authenticated, skipping server save of selected sales');
      }
      
      // If not already showing only selected sales, turn it on
      if (!showOnlySelected) {
        toggleDisplayMode();
      }
      
      // Store only the selected sales for this community in localStorage
      localStorage.setItem('selectedSales', JSON.stringify(selectedSalesData));
      
      // Navigate to the map page to view the selected sales
      navigate(`/?communityId=${communityId || ''}`);
    } else {
      alert('Please select at least one garage sale to view on the map.');
    }
  };

  const handleOptimizeRoute = async () => {
    // Determine if we're optimizing the full route or just selected sales
    const isFullRouteOptimization = selectedSales.size === 0;
    setOptimizeFullRoute(isFullRouteOptimization);
    
    console.log(`Optimizing ${isFullRouteOptimization ? 'FULL route' : 'SELECTED sales route'}`);
    
    // If there are selected sales and the user is authenticated, save them to the backend first
    if (selectedSales.size > 0 && isAuthenticated && userInfo?.userId) {
      try {
        console.log('Saving selected sales to server before optimization for user:', userInfo.userId);
        
        // Filter sales to only include those from the current communityId
        // and that are also in the selectedSales set
        const selectedSalesData = filteredSales
          .filter(sale => selectedSales.has(sale.id));
        
        // Extract just the IDs for the server request
        const selectedSaleIds = selectedSalesData.map(sale => sale.id);
        
        console.log(`Saving ${selectedSaleIds.length} selected sales for current community ID: ${communityId}`);
        
        // Save the selected sales to the server with the current communityId
        const response = await api.createUpdateUserAddressList(userInfo.userId, selectedSaleIds, communityId);
        console.log('Successfully saved selected sales to server before optimization:', response);
      } catch (error) {
        console.error('Error saving selected sales to server before optimization:', error);
        // Continue with optimization even if server save fails
        // We don't want to block the user from optimizing their route
      }
    }
    
    // Show the optimize route view to let the user select a starting point
    // This will eventually call handleSelectFirstVisit with the appropriate endpoint
    // based on whether there are selected sales or not
    setShowOptimizeRoute(true);
  };
  
  const handleFullRouteOptimization = async () => {
    try {
      console.log('Getting full route optimization');
      
      // Get sessionId from localStorage
      const sessionId = localStorage.getItem('sessionId');
      
      // Make API call to get optimized route without a specific starting point
      let optimizedRouteData = null;
      
      const response = await fetch(`${import.meta.env.VITE_MAPS_API_URL}/v1/getOptimzedRoute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'app-key': import.meta.env.VITE_APP_API_KEY,
          'app-name': 'postman-call',
          'sessionId': sessionId
        },
        body: JSON.stringify({
          communityId: communityId
          // No startingAddressId means the API will optimize the full route
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      optimizedRouteData = await response.json();
      console.log('API Response:', optimizedRouteData);
      
      // Process the response
      if (optimizedRouteData && optimizedRouteData.orderedWaypoints) {
        console.log('Using optimized route data:', optimizedRouteData);
        
        // Store the optimized route data in localStorage for the map to use
        localStorage.setItem('optimizedRoute', JSON.stringify(optimizedRouteData));
        
        // Set the optimized route addresses for display
        setOptimizedRouteAddresses(optimizedRouteData.orderedWaypoints);
        
        // Show the route list
        setShowRouteList(true);
      } else {
        throw new Error('Invalid route data received');
      }
      
    } catch (error) {
      console.error('Error getting optimized route:', error);
      // Show user-friendly error message
      alert(`Error optimizing route: ${error.message}`);
    }
  };

  const handleSelectFirstVisit = async (saleId) => {
    try {
      console.log('Selected first visit:', saleId);
      
      // Get sessionId from localStorage
      const sessionId = localStorage.getItem('sessionId');
      
      // Make API call to get optimized route
      let optimizedRouteData = null;
      
      // Make API call to get optimized route
      // Use different endpoints based on whether we're optimizing full route or selected sales
      // If optimizeFullRoute is true, we always use the regular endpoint regardless of selections
      const endpoint = !optimizeFullRoute && selectedSales.size > 0 
        ? `${import.meta.env.VITE_MAPS_API_URL}/v1/getOptimzedRoute/bySavedList`
        : `${import.meta.env.VITE_MAPS_API_URL}/v1/getOptimzedRoute`;
      
      console.log(`Using endpoint: ${endpoint} (optimizeFullRoute=${optimizeFullRoute}, selectedSales.size=${selectedSales.size})`);
      
      // Prepare the request payload based on the endpoint
      const payload = !optimizeFullRoute && selectedSales.size > 0
        ? {
            startingAddressId: saleId,
            communityId: communityId,
            userId: userInfo?.userId || ''
          }
        : {
            startingAddressId: saleId,
            communityId: communityId
          };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'app-key': import.meta.env.VITE_APP_API_KEY,
          'app-name': 'postman-call',
          'sessionId': sessionId
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      optimizedRouteData = await response.json();
      console.log('API Response:', optimizedRouteData);
      
      // Process the response
      if (optimizedRouteData && optimizedRouteData.orderedWaypoints) {
        console.log('Using optimised route data:', optimizedRouteData);
        
        // Create a map of addresses to sale data for matching
        const addressToSaleMap = {};
        
        // Build a map of normalized addresses to their corresponding sale data
        garageSales.forEach(sale => {
          if (sale.address) {
            // Normalize the address by removing extra spaces and converting to lowercase
            const normalizedAddress = sale.address.toLowerCase().replace(/\s+/g, ' ').trim();
            addressToSaleMap[normalizedAddress] = sale;
          }
        });
        
        console.log('Address to sale map created with', Object.keys(addressToSaleMap).length, 'entries');
        
        // Process the ordered waypoints from the API
        const filteredWaypoints = [];
        console.log('Ordered waypoints from API:', optimizedRouteData.orderedWaypoints);
        
        // Process each waypoint in the optimized route
        optimizedRouteData.orderedWaypoints.forEach((waypoint, index) => {
          // Get the address from the waypoint
          let waypointAddress = '';
          
          // Handle different possible formats of the waypoint data
          if (typeof waypoint === 'string') {
            waypointAddress = waypoint;
          } else if (waypoint && typeof waypoint === 'object') {
            waypointAddress = waypoint.address || waypoint.location || '';
          }
          
          console.log(`Processing waypoint ${index + 1}:`, waypointAddress);
          
          if (waypointAddress) {
            // Normalize the address for matching
            const normalizedAddress = waypointAddress.toLowerCase().replace(/\s+/g, ' ').trim();
            
            // Find the matching sale by address
            const matchingSale = addressToSaleMap[normalizedAddress];
            
            if (matchingSale) {
              console.log('Found matching sale with ID:', matchingSale.id);
              
              // Add the waypoint with the correct ID and position information
              filteredWaypoints.push({
                id: matchingSale.id,
                address: matchingSale.address,
                description: matchingSale.description,
                position: matchingSale.position,
                // Add the position in the optimized route
                routeOrder: index + 1
              });
            } else {
              console.log('No matching sale found for address:', waypointAddress);
              
              // Include the waypoint even without a matching sale
              filteredWaypoints.push({
                address: waypointAddress,
                description: `Stop ${index + 1}`,
                routeOrder: index + 1
              });
            }
          }
        });
        
        console.log('Filtered waypoints with route order:', filteredWaypoints);
        
        // Create a modified optimized route data with only selected sales
        const filteredOptimizedRouteData = {
          ...optimizedRouteData,
          orderedWaypoints: filteredWaypoints
        };
        
        // Store the filtered optimized route data in localStorage for the map to use
        localStorage.setItem('optimizedRoute', JSON.stringify(filteredOptimizedRouteData));
        
        // Set the optimized route addresses for display
        setOptimizedRouteAddresses(filteredWaypoints);
        
        // Close the optimize route view and show the route list
        setShowOptimizeRoute(false);
        setShowRouteList(true);
      } else {
        throw new Error('Invalid route data received');
      }
      
    } catch (error) {
      console.error('Error getting optimised route:', error);
      // Show user-friendly error message
      alert(`Error optimising route: ${error.message}`);
    }
  };

  const handleBackToSelection = () => {
    setShowOptimizeRoute(false);
    setShowRouteList(false);
  };
  
  const handleProceedToMap = () => {
    // Get the optimized route data from localStorage
    const optimizedRouteData = JSON.parse(localStorage.getItem('optimizedRoute') || '{}');
    
    // If we have optimized route data and we're not doing a full route optimization
    if (optimizedRouteData.orderedWaypoints && !optimizeFullRoute) {
      // Filter the garage sales to only include those in the optimized route
      const optimizedSales = garageSales.filter(sale => 
        optimizedRouteData.orderedWaypoints.some(wp => wp.id === sale.id)
      );
      
      // Store only the optimized sales in localStorage
      localStorage.setItem('selectedSales', JSON.stringify(optimizedSales));
      
      // Make sure we're in selected sales mode
      if (!showOnlySelected) {
        toggleDisplayMode();
      }
    } else if (optimizeFullRoute) {
      // For full route optimization, show all markers
      toggleDisplayMode('showAll');
    }
    
    // Navigate to map view with parameters
    navigate(`/?communityId=${communityId}&showOptimizedRoute=true`);
    
    // Close the route list view
    setShowRouteList(false);
  };

  const filteredSales = garageSales.filter(sale => 
    (sale.address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading garage sales...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={fetchGarageSales}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      </Container>
    );
  }

  // Get selected sales for display
  const selectedSalesData = garageSales.filter(sale => selectedSales.has(sale.id));

  // Show optimized route list if active
  if (showRouteList && optimizedRouteAddresses.length > 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {communityName ? `${communityName} - Optimised Route` : 'Optimised Route'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Your optimised route in order of visits:
          </Typography>
        </Box>
        
        <Paper variant="outlined" sx={{ mb: 4, overflow: 'hidden' }}>
          <List disablePadding>
            {optimizedRouteAddresses.map((waypoint, index) => (
              <React.Fragment key={index}>
                <ListItem 
                  sx={{
                    py: 2,
                    px: 3,
                    '&:hover': { bgcolor: 'action.hover' },
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main'
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Avatar 
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'primary.contrastText',
                        width: 28,
                        height: 28,
                        fontSize: '0.875rem'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" component="div">
                        {waypoint.address || 'No Address Available'}
                      </Typography>
                    }
                    secondary={
                      waypoint.description && (
                        <Typography variant="body2" color="text.secondary">
                          {waypoint.description}
                        </Typography>
                      )
                    }
                    sx={{ my: 0 }}
                  />
                </ListItem>
                {index < optimizedRouteAddresses.length - 1 && (
                  <Divider component="li" variant="inset" />
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToSelection}
            sx={{ minWidth: '180px' }}
          >
            Back to Selection
          </Button>
          <Button
            variant="contained"
            color="primary"
            endIcon={<MapIcon />}
            onClick={handleProceedToMap}
            sx={{ minWidth: '180px' }}
          >
            View on Map
          </Button>
        </Box>
      </Container>
    );
  }
  
  // Show optimize route view if active
  if (showOptimizeRoute) {
    // Use all sales data if there are no selections, otherwise use selected sales
    const salesToDisplay = selectedSales.size > 0 ? selectedSalesData : filteredSales;
    const displayMessage = selectedSales.size > 0 ? 
      `Showing ${salesToDisplay.length} selected garage sales` : 
      `Showing all ${salesToDisplay.length} garage sales`;
    
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {communityName ? `${communityName} - Optimised Route` : 'Optimised Route'}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" paragraph>
            Click on the address which will be your first visit
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToSelection}
            sx={{ mb: 3 }}
          >
            Back to Selection
          </Button>
        </Box>

        {salesToDisplay.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No garage sales available to optimize.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {salesToDisplay.map((sale) => (
              <Grid item xs={12} sm={6} md={4} key={sale.id}>
                <Card 
                  elevation={2}
                  onClick={() => handleSelectFirstVisit(sale.id)}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    },
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main'
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, '&:last-child': { pb: 2 } }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <RadioButtonUncheckedIcon 
                        color="primary" 
                        sx={{ mr: 1, color: 'primary.main' }} 
                      />
                      <Typography variant="subtitle1" component="div" fontWeight="medium">
                        {sale.address || 'No Address Available'}
                      </Typography>
                    </Box>
                    {sale.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>
                        {sale.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 'auto', pt: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip 
                          size="small" 
                          label={sale.date || 'No date'} 
                          variant="outlined"
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {sale.startTime || 'All day'}{sale.endTime ? ` - ${sale.endTime}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {displayMessage}
          </Typography>
        </Box>
      </Container>
    );
  }

  // Main component return
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {communityName || 'Garage Sales'}
        </Typography>
        
        {isAuthenticated && userInfo && (
          <Paper 
            elevation={0} 
            sx={{ 
              display: 'inline-flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              p: 2,
              mb: 3,
              bgcolor: 'background.paper',
              borderRadius: 2
            }}
          >
            <Typography variant="subtitle1" fontWeight="medium">
              {userInfo.fName} {userInfo.lName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {userEmail}
            </Typography>
          </Paper>
        )}
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by address or description..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
              {selectedSales.size > 0 && (
                <>
                  <Button 
                    variant="outlined" 
                    onClick={handleDeselectAllWithServerUpdate}
                    startIcon={<CloseIcon />}
                  >
                    Deselect All
                  </Button>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleViewSelected}
                    startIcon={<MapIcon />}
                  >
                    View Selected ({selectedSales.size})
                  </Button>
                </>
              )}
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleOptimizeRoute}
                startIcon={<CheckBoxIcon />}
              >
                {selectedSales.size > 0 ? 'Optimise Selected' : 'Optimise Full Route'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {filteredSales.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No garage sales found matching your search.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredSales.map((sale) => (
            <Grid item xs={12} sm={6} md={4} key={sale.id}>
              <Card 
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  },
                  borderLeft: selectedSales.has(sale.id) ? '4px solid #1976d2' : '4px solid transparent'
                }}
              >
                <CardContent 
                  sx={{ 
                    flexGrow: 1, 
                    cursor: 'pointer',
                    '&:last-child': { pb: 2 }
                  }}
                  onClick={() => handleSelectionWithAuth(sale.id)}
                >
                  <Box display="flex" alignItems="flex-start">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedSales.has(sale.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectionWithAuth(sale.id);
                          }}
                          icon={<CheckBoxOutlineBlankIcon />}
                          checkedIcon={<CheckBoxIcon color="primary" />}
                        />
                      }
                      label={
                        <Typography variant="subtitle1" component="div" fontWeight="medium">
                          {sale.address || 'No Address Available'}
                        </Typography>
                      }
                      sx={{ m: 0, flexGrow: 1 }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewOnMap(sale);
                      }}
                      title="View on map"
                    >
                      <MapIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  
                  {sale.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1.5 }}>
                      {sale.description}
                    </Typography>
                  )}
                  
                  <Box sx={{ mt: 'auto', pt: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip 
                        size="small" 
                        label={sale.date || 'No date'} 
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {sale.startTime || 'All day'}{sale.endTime ? ` - ${sale.endTime}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredSales.length} of {garageSales.length} garage sales
          {selectedSales.size > 0 && (
            <Chip 
              label={`${selectedSales.size} selected`} 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
      </Box>
      
      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
    </Container>
  );
};

export default GarageSales;
