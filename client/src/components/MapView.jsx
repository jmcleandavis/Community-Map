import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { useGarageSales } from '../context/GarageSalesContext';
import { useDisplay } from '../context/DisplayContext';
import './MapView.css';
import { useLocation as useRouterLocation, useNavigate } from 'react-router-dom';
import useWindowSize from '../hooks/useWindowSize';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { useSelection } from '../context/SelectionContext';
import { useCommunitySales } from '../context/CommunitySalesContext';
import { useCommunityName } from '../hooks/useCommunityName';
import api from '../utils/api';
import { logger } from '../utils/logger';

// Fallback component when map fails to load
const MapLoadError = ({ error }) => {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      backgroundColor: '#f8f9fa',
      border: '1px solid #ddd',
      borderRadius: '4px',
      padding: '20px'
    }}>
      <h3 style={{ color: '#dc3545' }}>Google Maps failed to load</h3>
      <p>{error || 'Please check your internet connection and try again.'}</p>
      <button 
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
        onClick={() => window.location.reload()}
      >
        Reload Page
      </button>
    </div>
  );
};

function MapView({ mapContainerStyle, mapOptions }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [componentMounted, setComponentMounted] = useState(false);
  const [directions, setDirections] = useState(null);
  const [showOptimizedRoute, setShowOptimizedRoute] = useState(false);
  const [optimizedRouteData, setOptimizedRouteData] = useState(null);
  const [markersVersion, setMarkersVersion] = useState(0);
  // Default center (will be updated when garage sales are loaded)
  const [center, setCenter] = useState({
    lat: 43.8384,
    lng: -79.0868
  });
  
  // Get window dimensions
  const { width } = useWindowSize();
  const isCompactView = width < 1045;
  
  // Google Maps is already loaded by LoadScript in App.jsx
  // We assume it's loaded when this component mounts
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const markerElementsRef = useRef(new Map());
  const userMarkerRef = useRef(null);
  const initialLoadRef = useRef(false);
  const userSelectionsLoadedRef = useRef(false);
  const { fetchGarageSales, garageSales, loading, error } = useGarageSales();
  const { showOnlySelected } = useDisplay();
  const { isAuthenticated, userInfo } = useAuth();
  const { selectedSales, handleCheckboxChange, handleDeselectAll } = useSelection();
  const { userLocation, shouldCenterOnUser, clearCenterOnUser, centerOnUserLocation } = useLocation();
  const { communityName, setCommunityName, communityId, setCommunityId } = useCommunitySales();

  // Use custom hook for community name fetching
  useCommunityName(communityId, communityName, setCommunityName, {
    componentName: 'MapView',
    skipIfExists: true
  });
  
  // Use the community name from context or API call
  // The fallback is now handled in the fetch effect above
  const COMMUNITY_NAME = communityName || 'Loading community...';
  const location = useRouterLocation();
  const navigate = useNavigate();
  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const urlCommunityId = urlParams.get('communityId');
  const urlShowOptimizedRoute = urlParams.get('showOptimizedRoute') === 'true';

  // Ensure component is fully mounted before making navigation decisions
  useEffect(() => {
    setComponentMounted(true);
    
    // Check if we should show optimized route
    if (urlShowOptimizedRoute) {
      const storedRoute = localStorage.getItem('optimizedRoute');
      if (storedRoute) {
        try {
          const routeData = JSON.parse(storedRoute);
          setOptimizedRouteData(routeData);
          setShowOptimizedRoute(true);
        } catch (error) {
          logger.error('[MapView] Error parsing optimized route data:', error);
        }
      }
    }
  }, [urlShowOptimizedRoute]);

  // Use this effect to update the communityId or navigate to landing page
  useEffect(() => {
    // Don't make navigation decisions until component is fully mounted
    // and we've had a chance to parse the URL
    if (!componentMounted) {
      return;
    }
    
    // Give URLSearchParams a chance to be processed by checking if location.search exists
    if (location.search && !urlCommunityId) {
      // URL has search params but communityId wasn't found - might still be parsing
      logger.log('[MapView] URL has search params but communityId not found yet, waiting...');
      return;
    }
    
    if(urlCommunityId) {
      logger.log('[MapView] Setting community ID from URL:', urlCommunityId);
      setCommunityId(urlCommunityId);
    } else if (!communityId && !location.search) {
      // Default to a specific community ID when none is provided
      const defaultCommunityId = '96cc0f2f-13e2-4090-8e3d-6dbe35856ef4'; // 2026 default community
      logger.log('[MapView] No community ID provided, defaulting to:', defaultCommunityId);
      setCommunityId(defaultCommunityId);
      // Update the URL to include the default community ID
      navigate(`?communityId=${defaultCommunityId}`, { replace: true });
    }
  }, [urlCommunityId, communityId, setCommunityId, navigate, componentMounted, location.search]);

  // Community name fetching handled by useCommunityName hook

  // selectedSaleIds is used by createMarkers for initial pin colors; intentionally not reactive
  // to prevent marker recreation (which closes any open InfoWindow) on selection toggle.
  // Reactive color updates are handled by the useEffect below.
  const selectedSaleIds = useMemo(() => {
    const stored = localStorage.getItem('selectedSaleIds');
    return stored ? JSON.parse(stored) : [];
  }, []);

  // When selection changes, update only the affected marker's pin color directly — avoids
  // full marker recreation which would close any open InfoWindow.
  // Also controls visibility when showOnlySelected is active so deselected markers
  // disappear immediately without recreating the full marker set.
  useEffect(() => {
    markerElementsRef.current.forEach((el, id) => {
      el.style.backgroundColor = selectedSales.has(id) ? '#4CAF50' : '#FF0000';
      if (showOnlySelected) {
        el.style.display = selectedSales.has(id) ? '' : 'none';
      } else {
        el.style.display = '';
      }
    });
  }, [selectedSales, showOnlySelected, markersVersion]);

  // Record that the user started on the map page
  useEffect(() => {
    const initialPage = '/';
    // Store the initial page in sessionStorage
    sessionStorage.setItem('initialPage', initialPage);
    logger.log(`[MapView] Recorded initial page as "${initialPage}" in sessionStorage`);
  }, []);

  // Initial load of garage sales
  useEffect(() => {
    if (!initialLoadRef.current && communityId) {
      logger.log('[MapView] Initial load - fetching garage sales with communityId:', communityId);
      fetchGarageSales(communityId);
      initialLoadRef.current = true;
    }
  }, [fetchGarageSales, communityId]);
  
  // Load user's saved garage sale selections if they're logged in
  useEffect(() => {
    const fetchUserSelections = async () => {
      // Only fetch if user is logged in, we haven't already loaded selections,
      // and we have the user's ID
      if (isAuthenticated && !userSelectionsLoadedRef.current && userInfo?.userId) {
        try {
          logger.log('[MapView] User is logged in, fetching saved selections for user:', userInfo.userId);
          const userAddressList = await api.getUserAddressList(userInfo.userId);
          
          if (userAddressList && userAddressList.addressList && userAddressList.addressList.length > 0) {
            logger.log('[MapView] User has saved selections on server:', userAddressList.addressList);
            
            // Clear existing selections first
            handleDeselectAll();
            
            // Add each server-side selection
            userAddressList.addressList.forEach(saleId => {
              handleCheckboxChange(saleId);
            });
            
            logger.log('[MapView] Updated selections from server list');
          } else {
            logger.log('[MapView] User does not have saved selections on server, using local selections');
          }
          
          // Mark that we've loaded user selections
          userSelectionsLoadedRef.current = true;
        } catch (error) {
          logger.error('[MapView] Error fetching user selections:', error);
          // If there's an error, we'll fall back to local storage selections
        }
      }
    };
    
    fetchUserSelections();
  }, [isAuthenticated, userInfo, handleCheckboxChange, handleDeselectAll]);

  // Reset the selections-loaded guard when the user logs out so re-login triggers a fresh fetch
  useEffect(() => {
    if (!isAuthenticated || !userInfo?.userId) {
      userSelectionsLoadedRef.current = false;
    }
  }, [isAuthenticated, userInfo]);

  // Cleanup function for markers
  const cleanupMarkers = useCallback(() => {
    logger.log('[MapView] Cleaning up markers');
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        if (marker) {
          marker.map = null;
        }
      });
      markersRef.current = [];
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null;
      userMarkerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      logger.log('[MapView] Component unmounting, cleaning up');
      cleanupMarkers();
      if (mapRef.current) {
        logger.log('[MapView] Clearing map reference');
        mapRef.current = null;
        setIsLoaded(false);
      }
    };
  }, [cleanupMarkers]);

  const createMarkers = useCallback(() => {
    if (!mapRef.current || !window.google || !garageSales) {
      logger.log('[MapView] Cannot create markers - missing requirements', {
        hasMap: !!mapRef.current,
        hasGoogle: !!window.google,
        salesCount: garageSales?.length
      });
      return;
    }

    logger.log('[MapView] Creating markers for', garageSales.length, 'sales');
    
    // Only cleanup if we have existing markers
    if (markersRef.current.length > 0) {
      logger.log('[MapView] Cleaning up existing markers before creating new ones');
      cleanupMarkers();
    }
    markerElementsRef.current.clear();

    // Filter sales based on display mode
    const salesToShow = showOnlySelected 
      ? garageSales.filter(sale => selectedSaleIds.includes(sale.id))
      : garageSales;

    const { AdvancedMarkerElement } = window.google.maps.marker;
    if (!AdvancedMarkerElement) {
      logger.error('[MapView] AdvancedMarkerElement not available');
      return;
    }

    logger.log('[MapView] Starting to create', salesToShow.length, 'markers');
    let markersCreated = 0;

    // Create a map of addresses to their position in the optimized route
    const addressOrderMap = {};
    const saleIdOrderMap = {};
    
    // If we have optimized route data, use it to determine the order numbers
    if (showOptimizedRoute && optimizedRouteData && optimizedRouteData.orderedWaypoints) {
      logger.log('[MapView] Using optimized route data for marker numbering');
      
      // Create a map of sale IDs to their corresponding addresses for better matching
      const saleIdToAddressMap = {};
      garageSales.forEach(sale => {
        if (sale && sale.id && sale.address) {
          saleIdToAddressMap[sale.id] = sale.address;
        }
      });
      
      // Map each address to its position in the ordered waypoints
      optimizedRouteData.orderedWaypoints.forEach((waypoint, index) => {
        try {
          // First, check if the waypoint has an ID (for filtered waypoints with routeOrder)
          if (typeof waypoint === 'object' && waypoint.id) {
            // This is likely from the filtered waypoints with routeOrder
            saleIdOrderMap[waypoint.id] = waypoint.routeOrder || (index + 1);
            logger.log(`[MapView] Mapped sale ID ${waypoint.id} to order ${saleIdOrderMap[waypoint.id]}`);
            
            // Also map the address if available
            if (waypoint.address) {
              const normalizedAddress = waypoint.address.toLowerCase().replace(/\s+/g, ' ').trim();
              addressOrderMap[normalizedAddress] = waypoint.routeOrder || (index + 1);
            }
          } else {
            // Handle case where address might be an object or other non-string
            const addressStr = typeof waypoint === 'string' ? waypoint : 
                              (waypoint && waypoint.address ? waypoint.address : 
                              (waypoint && waypoint.id && saleIdToAddressMap[waypoint.id] ? saleIdToAddressMap[waypoint.id] : ''));
            
            if (!addressStr) {
              logger.log('[MapView] Could not extract address string from waypoint:', waypoint);
              return; // Skip this waypoint
            }
            
            // Normalize the address to improve matching
            const normalizedAddress = addressStr.toLowerCase().replace(/\s+/g, ' ').trim();
            
            // Store both the full address and parts of it to improve matching chances
            addressOrderMap[normalizedAddress] = index + 1; // +1 so numbering starts at 1 instead of 0
            
            // Also store without street suffix (Rd, St, Ave, etc.) for more flexible matching
            const simplifiedAddress = normalizedAddress
              .replace(/\b(road|rd|street|st|avenue|ave|drive|dr|court|ct|place|pl|lane|ln|way|circle|cir|boulevard|blvd)\b/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (simplifiedAddress !== normalizedAddress) {
              addressOrderMap[simplifiedAddress] = index + 1;
            }
            
            // Also store just the house number and street name for even more flexible matching
            const addressParts = normalizedAddress.split(',');
            if (addressParts.length > 0) {
              const streetPart = addressParts[0].trim();
              addressOrderMap[streetPart] = index + 1;
            }
            
            // Log for debugging
            logger.log(`[MapView] Mapped waypoint ${index + 1}:`, addressStr);
          }
        } catch (error) {
          logger.error('[MapView] Error processing waypoint address:', error, waypoint);
        }
      });
    }

    salesToShow.forEach(sale => {
      const markerColor = selectedSaleIds.includes(sale.id) ? '#4CAF50' : '#FF0000';
      
      // Create the pin container element
      const pinElement = document.createElement('div');
      pinElement.className = 'custom-pin';
      pinElement.style.cursor = 'pointer';
      pinElement.style.width = '28px'; // Slightly larger to accommodate number
      pinElement.style.height = '28px';
      pinElement.style.borderRadius = '50%';
      pinElement.style.backgroundColor = markerColor;
      pinElement.style.border = '2px solid white';
      pinElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      pinElement.style.display = 'flex';
      pinElement.style.justifyContent = 'center';
      pinElement.style.alignItems = 'center';
      pinElement.style.position = 'relative';
      
      // Check if this sale has a position in the optimized route
      let orderNumber = null;
      
      // First check if we have a direct sale ID match (most reliable)
      if (sale.id && saleIdOrderMap[sale.id]) {
        orderNumber = saleIdOrderMap[sale.id];
        logger.log(`[MapView] Found order number ${orderNumber} for sale ID ${sale.id}`);
      }
      // If no match by ID, try matching by address
      else if (sale.address) {
        try {
          // Try multiple variations of the address to improve matching chances
          const normalizedSaleAddress = sale.address.toLowerCase().replace(/\s+/g, ' ').trim();
          
          // Try exact match first
          orderNumber = addressOrderMap[normalizedSaleAddress];
          
          // If no match, try without street suffix
          if (!orderNumber) {
            const simplifiedSaleAddress = normalizedSaleAddress
              .replace(/\b(road|rd|street|st|avenue|ave|drive|dr|court|ct|place|pl|lane|ln|way|circle|cir|boulevard|blvd)\b/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            
            orderNumber = addressOrderMap[simplifiedSaleAddress];
          }
          
          // If still no match, try just the house number and street name
          if (!orderNumber) {
            const addressParts = normalizedSaleAddress.split(',');
            if (addressParts.length > 0) {
              const streetPart = addressParts[0].trim();
              orderNumber = addressOrderMap[streetPart];
            }
          }
          
          // If we found a match, log it for debugging
          if (orderNumber) {
            logger.log(`[MapView] Found order number ${orderNumber} for sale at ${sale.address}`);
          }
        } catch (error) {
          logger.error('[MapView] Error matching sale address:', error, sale.address);
        }
      }
      
      // Only add numbers if we're showing the optimized route and this address is in the route
      if (showOptimizedRoute && orderNumber) {
        // Create the number element
        const numberElement = document.createElement('span');
        numberElement.textContent = orderNumber.toString();
        numberElement.style.color = 'white';
        numberElement.style.fontSize = '12px';
        numberElement.style.fontWeight = 'bold';
        numberElement.style.userSelect = 'none';
        pinElement.appendChild(numberElement);
      }

      try {
        const marker = new AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat: sale.position.lat, lng: sale.position.lng },
          content: pinElement,
          title: sale.address
        });

        marker.addListener('gmp-click', () => {
          setSelectedSale(sale);
        });

        markersRef.current.push(marker);
        markerElementsRef.current.set(sale.id, pinElement);
        markersCreated++;
      } catch (error) {
        logger.error('[MapView] Error creating marker:', error, sale);
      }
    });

    logger.log('[MapView] Successfully created', markersCreated, 'markers');
    setMarkersVersion(v => v + 1);
  }, [garageSales, selectedSaleIds, showOnlySelected, cleanupMarkers, showOptimizedRoute, optimizedRouteData, setMarkersVersion]);

  // Watch for when both map and data are ready and create markers
  useEffect(() => {
    // Only proceed if we have all necessary data
    if (mapRef.current && garageSales?.length && window.google && isLoaded) {
      logger.log('[MapView] DIRECT EFFECT: Map and data both ready, creating markers now!');
      // Always recreate markers when this effect runs to ensure they're up to date
      createMarkers();
    }
  }, [mapRef, garageSales, createMarkers, isLoaded, showOptimizedRoute]);

  // Function to calculate and center on community sales
  const centerOnCommunitySales = useCallback(() => {
    if (!garageSales?.length || !mapRef.current) return;
    
    // Calculate the average lat/lng of all garage sales
    let totalLat = 0;
    let totalLng = 0;
    let validPositions = 0;
    
    // Also track bounds to determine appropriate zoom level
    const bounds = new window.google.maps.LatLngBounds();
    
    garageSales.forEach(sale => {
      if (sale.position && sale.position.lat && sale.position.lng) {
        totalLat += sale.position.lat;
        totalLng += sale.position.lng;
        validPositions++;
        
        // Add to bounds for zoom calculation
        bounds.extend({
          lat: sale.position.lat,
          lng: sale.position.lng
        });
      }
    });
    
    if (validPositions > 0) {
      const communityCenter = {
        lat: totalLat / validPositions,
        lng: totalLng / validPositions
      };
      
      logger.log('[MapView] Centering on community sales at', communityCenter);
      setCenter(communityCenter);
      
      // Center the map and fit to bounds
      mapRef.current.panTo(communityCenter);
      mapRef.current.fitBounds(bounds);
      
      // Limit max zoom to avoid excessive zooming on small areas
      const currentZoom = mapRef.current.getZoom();
      if (currentZoom > 15) {
        mapRef.current.setZoom(15);
      }
    }
  }, [garageSales]);

  // Effect to handle centering on user location
  useEffect(() => {
    if (shouldCenterOnUser && userLocation && mapRef.current) {
      logger.log('[MapView] Centering on user location', userLocation);
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(15);
      clearCenterOnUser();
    }
  }, [shouldCenterOnUser, userLocation, clearCenterOnUser]);
  
  // Effect to center on community sales when garage sales data is loaded
  useEffect(() => {
    if (garageSales?.length > 0 && mapRef.current && window.google) {
      centerOnCommunitySales();
    }
  }, [garageSales, centerOnCommunitySales]);

  // Effect to update user location marker
  useEffect(() => {
    // Only proceed if map is loaded and we have location
    if (!isLoaded) {
      logger.log('[MapView] Map not yet loaded, waiting...');
      return;
    }

    if (!userLocation) {
      logger.log('[MapView] No user location yet, waiting...');
      return;
    }

    if (!window.google) {
      logger.log('[MapView] Google Maps not yet available, waiting...');
      return;
    }

    if (!mapRef.current) {
      logger.log('[MapView] Map reference not yet available, waiting...');
      return;
    }

    logger.log('[MapView] All requirements met, creating user location marker', {
      hasMap: !!mapRef.current,
      hasLocation: !!userLocation,
      hasGoogle: !!window.google,
      isLoaded
    });

    try {
      const { AdvancedMarkerElement } = window.google.maps.marker;
      if (!AdvancedMarkerElement) {
        logger.error('[MapView] AdvancedMarkerElement not available');
        return;
      }

      // Clean up existing marker
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
        userMarkerRef.current = null;
      }

      const userPinElement = document.createElement('div');
      userPinElement.style.position = 'relative';
      userPinElement.style.width = '20px';
      userPinElement.style.height = '20px';

      // Inner circle (blue dot)
      const innerCircle = document.createElement('div');
      innerCircle.style.width = '20px';
      innerCircle.style.height = '20px';
      innerCircle.style.borderRadius = '50%';
      innerCircle.style.backgroundColor = '#4285F4';
      innerCircle.style.border = '3px solid white';
      innerCircle.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      userPinElement.appendChild(innerCircle);

      // Outer circle (pulse effect)
      const outerCircle = document.createElement('div');
      outerCircle.style.position = 'absolute';
      outerCircle.style.top = '-5px';
      outerCircle.style.left = '-5px';
      outerCircle.style.width = '30px';
      outerCircle.style.height = '30px';
      outerCircle.style.borderRadius = '50%';
      outerCircle.style.backgroundColor = 'rgba(66, 133, 244, 0.2)';
      outerCircle.style.animation = 'pulse 2s infinite';
      userPinElement.appendChild(outerCircle);

      // Add the pulse animation if it doesn't exist
      if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.textContent = `
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      userMarkerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: userLocation,
        content: userPinElement,
        title: 'Your Location'
      });

      logger.log('[MapView] Successfully created user location marker');
    } catch (error) {
      logger.error('[MapView] Error creating user location marker:', error);
    }
  }, [userLocation, isLoaded]);

  // Effect to create markers when map is loaded and sales data is available
  useEffect(() => {
    if (!isLoaded) {
      logger.log('[MapView] Map not loaded yet, waiting to create markers...');
      return;
    }

    if (!garageSales?.length) {
      logger.log('[MapView] No garage sales data yet, waiting...');
      return;
    }

    if (!window.google) {
      logger.log('[MapView] Google Maps not available yet, waiting...');
      return;
    }

    if (!mapRef.current) {
      logger.log('[MapView] Map reference not available yet, waiting...');
      return;
    }

    logger.log('[MapView] All requirements met, creating', garageSales.length, 'markers');
    createMarkers();
  }, [isLoaded, garageSales, createMarkers]);

  // Inject the Select checkbox directly into the InfoWindow container so it sits on
  // the same line as the native Google Maps close button (they become DOM siblings).
  useEffect(() => {
    if (!selectedSale || !isAuthenticated) return;

    let selectEl = null;
    const timer = setTimeout(() => {
      const container = document.querySelector('.gm-style-iw-c');
      if (!container) return;

      // Remove Google's default top padding so content doesn't push Select down
      container.style.paddingTop = '0';

      selectEl = document.createElement('label');
      selectEl.className = 'info-window-portal-select';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      // eslint-disable-next-line react-hooks/exhaustive-deps
      checkbox.checked = selectedSales.has(selectedSale.id);
      checkbox.addEventListener('change', () => {
        const saleId = selectedSale.id;
        const newSelected = new Set(selectedSales);
        if (newSelected.has(saleId)) {
          newSelected.delete(saleId);
        } else {
          newSelected.add(saleId);
        }
        handleCheckboxChange(saleId);
        if (userInfo?.userId) {
          api.createUpdateUserAddressList(
            userInfo.userId,
            Array.from(newSelected),
            communityId
          );
        }
        setSelectedSale(null);
      });

      selectEl.appendChild(checkbox);
      selectEl.appendChild(document.createTextNode(' Select'));
      container.appendChild(selectEl);
    }, 50);

    return () => {
      clearTimeout(timer);
      if (selectEl?.parentNode) selectEl.parentNode.removeChild(selectEl);
    };
  }, [selectedSale, isAuthenticated]); // intentionally omit selectedSales/handleCheckboxChange — see comment above

  // Function to display the optimized route on the map
  const displayOptimizedRoute = useCallback((routeData) => {
    if (!mapRef.current || !window.google || !routeData) {
      logger.error('[MapView] Cannot display optimized route - missing requirements');
      return;
    }

    logger.log('[MapView] Displaying optimized route with data:', routeData);
    
    try {
      const DirectionsService = new window.google.maps.DirectionsService();
      
      // Extract waypoints from the route data
      const waypoints = routeData.orderedWaypoints || [];
      
      if (waypoints.length < 2) {
        logger.error('[MapView] Not enough waypoints to create a route');
        return;
      }
      
      // Process waypoints based on their format
      const processedWaypoints = waypoints.map(waypoint => {
        if (typeof waypoint === 'string') {
          return waypoint;
        } else if (waypoint && waypoint.address) {
          return waypoint.address;
        } else if (waypoint && waypoint.position) {
          return new window.google.maps.LatLng(
            waypoint.position.lat,
            waypoint.position.lng
          );
        }
        return waypoint; // Return as is if we can't process it
      });
      
      // Create waypoint objects for the DirectionsService
      const googleWaypoints = processedWaypoints.slice(1, processedWaypoints.length - 1).map(location => ({
        location,
        stopover: true
      }));
      
      // Request directions
      DirectionsService.route({
        origin: processedWaypoints[0],
        destination: processedWaypoints[processedWaypoints.length - 1],
        waypoints: googleWaypoints,
        optimizeWaypoints: false, // Already optimized
        travelMode: window.google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          logger.log('[MapView] Successfully received directions for optimized route');
          setDirections(result);
        } else {
          logger.error('[MapView] Error getting directions for optimized route:', status);
          alert(`Error getting directions: ${status}`);
        }
      });
    } catch (error) {
      logger.error('[MapView] Error displaying optimized route:', error);
    }
  }, []);

  // Effect to display optimized route when data changes
  useEffect(() => {
    if (isLoaded && showOptimizedRoute && optimizedRouteData && window.google) {
      logger.log('[MapView] Optimized route data changed, displaying route and recreating markers');
      displayOptimizedRoute(optimizedRouteData);
      
      // Recreate markers to show the sequence numbers
      setTimeout(() => {
        if (mapRef.current) {
          createMarkers();
        }
      }, 100); // Small delay to ensure route is processed first
    }
  }, [isLoaded, showOptimizedRoute, optimizedRouteData, displayOptimizedRoute, createMarkers]);

  // Handle map load event
  const handleMapLoad = useCallback((map) => {
    logger.log('[MapView] Map loaded');
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  // Handle map click to close info windows
  const handleMapClick = useCallback(() => {
    // Close InfoWindow when clicking on the map
    if (selectedSale) setSelectedSale(null);
    
    // Close hamburger menu if it's open
    if (window.closeHamburgerMenu) {
      window.closeHamburgerMenu();
    }
  }, [selectedSale]);

  const titleStyle = {
    textAlign: 'center',
    padding: '15px',
    fontSize: isCompactView ? '10px' : '24px',
    fontWeight: 'bold',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'absolute',
    top: '10px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1,
    borderRadius: '5px'
  };


  // Log when rendering the map
  logger.log('[MapView] Rendering Google Map component');

  // Prepare render content based on state
  let renderContent;
  
  // Check if window.google is available (maps script is loaded)
  if (!window.google) {
    logger.error('[MapView] Google Maps API not loaded yet');
    renderContent = <MapLoadError error="Google Maps not loaded yet. Please try refreshing the page." />;
  }
  // Loading and error states for garage sales data
  else if (loading) {
    renderContent = <div>Loading garage sales...</div>;
  }
  else if (error) {
    renderContent = <div>Error loading garage sales: {error}</div>;
  }
  else {
    renderContent = (
      <div className={`map-container${!isLoaded && isCompactView ? ' map-type-hidden' : ''}`}>
        {/* Display the community name at the top */}
        <div style={titleStyle}>{COMMUNITY_NAME}</div>

        <GoogleMap
          mapContainerStyle={mapContainerStyle || { width: '100%', height: '100vh' }}
          center={center}
          zoom={13}
          onClick={() => {
            // Close InfoWindow when clicking on the map
            if (selectedSale) setSelectedSale(null);
            
            // Close hamburger menu if it's open
            if (window.closeHamburgerMenu) {
              window.closeHamburgerMenu();
            }
          }}
          onLoad={(map) => {
            logger.log('[MapView] Map component loaded');
            mapRef.current = map;

            // Explicitly set map type control position based on screen width
            if (map && window.google) {
              logger.log('[MapView] Setting map options with screen width:', width, 'isCompactView:', isCompactView);

              if (isCompactView) {
                map.setOptions({
                  disableDefaultUI: true,
                  mapTypeControl: true,
                  mapTypeControlOptions: {
                    position: window.google.maps.ControlPosition.LEFT_BOTTOM,
                    style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                  },
                  zoomControl: false,
                  fullscreenControl: true,
                  fullscreenControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_RIGHT
                  },
                  streetViewControl: true,
                  scaleControl: true
                });
              } else {
                map.setOptions({
                  disableDefaultUI: true,
                  mapTypeControl: true,
                  mapTypeControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_RIGHT,
                    style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR
                  },
                  zoomControl: true,
                  zoomControlOptions: {
                    position: window.google.maps.ControlPosition.RIGHT_CENTER
                  },
                  fullscreenControl: true,
                  fullscreenControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_RIGHT
                  },
                  streetViewControl: true,
                  scaleControl: true
                });
              }
            }

            // Set loaded state after configuring the map
            setIsLoaded(true);
            
            // Map type controls position is now handled entirely through CSS in MapView.css
            
            // Add a custom My Location button that uses the existing centerOnUserLocation function
            const locationButton = document.createElement("button");
            locationButton.title = "My Location";
            locationButton.classList.add("my-location-button");
            
            // Create a div for the icon
            const iconContainer = document.createElement("div");
            iconContainer.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle><line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>';
            iconContainer.classList.add("icon-container");
            locationButton.appendChild(iconContainer);
            
            // The button is styled via CSS classes in MapView.css
            
            map.controls[window.google.maps.ControlPosition.RIGHT_BOTTOM].push(locationButton);
            
            // Setup the click event listener
            locationButton.addEventListener("click", () => {
              // Call the existing centerOnUserLocation function
              centerOnUserLocation();
            });
            
            // Directly create markers if garage sales data is available
            if (garageSales?.length && window.google) {
              logger.log('[MapView] Map loaded with data available, creating markers immediately');
              setTimeout(() => {
                createMarkers();
                // Center on the community sales instead of user location
                centerOnCommunitySales();
              }, 100); // Small timeout to ensure state is updated
            }
          }}
          onUnmount={(map) => {
            logger.log('[MapView] Map component unmounted');
            mapRef.current = null;
          }}
          options={mapOptions}
        >
          {/* Render directions if available */}
          {directions && showOptimizedRoute && (
            <DirectionsRenderer
              directions={directions}
              options={{
                /**
                 * If true, prevents the rendering of default markers on the map.
                 */
                suppressMarkers: true,
                suppressPolylines: true,
                polylineOptions: {
                  strokeColor: '#4285F4', // Google Maps blue color
                  strokeWeight: 5,
                  strokeOpacity: 0.8
                }
              }}
            />
          )}
          
          {selectedSale && (
            <InfoWindow
              position={{
                lat: selectedSale.position.lat,
                lng: selectedSale.position.lng
              }}
              onCloseClick={() => setSelectedSale(null)}
            >
              <div className="info-window-content" style={isAuthenticated ? { paddingTop: '30px' } : undefined}>
                <h3 style={{ margin: '0 0 4px 0' }}>{selectedSale.address}</h3>
                <p style={{ margin: '0 0 4px 0' }}>{selectedSale.description || 'No description available'}</p>
                <button
                  onClick={() => {
                    // Create Google Maps URL with directions from current location to this address
                    const destination = encodeURIComponent(selectedSale.address);
                    let navigationUrl;
                    
                    if (userLocation) {
                      // If we have user's location, use it as the starting point
                      const origin = `${userLocation.lat},${userLocation.lng}`;
                      navigationUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
                    } else {
                      // Otherwise, let Google Maps determine the current location
                      navigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
                    }
                    
                    // Open in a new tab
                    window.open(navigationUrl, '_blank');
                  }}
                  style={{
                    backgroundColor: '#4285F4',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    marginTop: '10px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%'
                  }}
                >
                  <span style={{ marginRight: '5px' }}>📍</span> Navigate here
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    );
  }

  return renderContent;
}

export default MapView;
