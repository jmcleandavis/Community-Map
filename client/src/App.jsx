import { useState, useCallback, useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom';
import api from './utils/api';
import './App.css'
import { GoogleMap, LoadScript, InfoWindow } from '@react-google-maps/api';
import HamburgerMenu from './components/HamburgerMenu';
import InfoPage from './pages/Info';
import Help from './pages/Help';
import Login from './pages/Login';
import GarageSales from './pages/GarageSales';
import { GarageSalesProvider } from './context/GarageSalesContext';

// Define libraries as a static constant
const libraries = ['marker'];

// Create axios instance with base URL
// const api = axios.create({
//   baseURL: 'http://localhost:3001',
//   timeout: 5000,
//   headers: {
//     'Content-Type': 'application/json'
//   }
// });

function App() {
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [garageSales, setGarageSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [center, setCenter] = useState({ lat: 43.5890, lng: -79.6441 });
  const [addresses, setAddresses] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const mapRef = useRef(null);

  // Map load effect
  useEffect(() => {
    if (isLoaded && mapRef.current) {
      console.log('Map is loaded, checking addresses');
      if (addresses.length === 0) {
        console.log('No addresses to display');
      }
    }
  }, [isLoaded, addresses]);

  // Effect to manage markers
  useEffect(() => {
    if (isLoaded && mapRef.current && addresses.length > 0) {
      console.log('Creating markers for addresses:', addresses);
      
      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker) {
          marker.map = null;
        }
      });
      markersRef.current = [];

      // Create new markers
      addresses.forEach(address => {
        if (!address.lat || !address.lng) {
          console.warn('Address missing coordinates:', address);
          return;
        }

        const lat = parseFloat(address.lat);
        const lng = parseFloat(address.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn('Invalid coordinates for address:', address);
          return;
        }

        try {
          const markerElement = document.createElement('div');
          markerElement.className = 'garage-sale-marker';
          markerElement.style.backgroundColor = '#FF0000';
          markerElement.style.borderRadius = '50%';
          markerElement.style.border = '2px solid #FFFFFF';
          markerElement.style.width = '12px';
          markerElement.style.height = '12px';

          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: { lat, lng },
            content: markerElement,
            title: address.address,
            map: mapRef.current
          });

          // Create info window for this marker
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <h3>${address.address}</h3>
                <p>${address.description}</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            // Close any open info windows
            if (selectedMarker) {
              selectedMarker.close();
            }
            infoWindow.open({
              anchor: marker,
              map: mapRef.current
            });
            setSelectedMarker(infoWindow);
          });

          markersRef.current.push(marker);
        } catch (error) {
          console.error('Error creating marker:', error);
        }
      });
    }
  }, [isLoaded, addresses]);

  const onMapLoad = useCallback((map) => {
    console.log('Map loaded, setting map ref');
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  const fetchAddresses = async () => {
    try {
      console.log('Starting to fetch addresses...');
      const { data } = await api.get('/api/addresses');
      console.log('Received response from server:', data);
      if (data && data.length > 0) {
        // Transform data to ensure consistent property names
        const formattedAddresses = data.map(addr => ({
          ...addr,
          address: addr.address || addr.Address,
          description: addr.description || addr.Description
        }));
        setAddresses(formattedAddresses);
        console.log('Fetched addresses:', formattedAddresses);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          setCenter(userPos); // Set center state
          
          // Create user location marker
          if (userMarkerRef.current) {
            userMarkerRef.current.map = null;
          }

          const markerElement = document.createElement('div');
          markerElement.className = 'user-location-marker';
          markerElement.style.backgroundColor = '#4285F4';
          markerElement.style.borderRadius = '50%';
          markerElement.style.border = '2px solid #FFFFFF';
          markerElement.style.width = '16px';
          markerElement.style.height = '16px';
          markerElement.style.boxShadow = '0 0 8px rgba(0, 0, 0, 0.3)';

          if (mapRef.current) {
            userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
              position: userPos,
              content: markerElement,
              title: 'Your Location',
              map: mapRef.current,
              zIndex: 1000 // Keep user marker on top
            });

            // Center map on user location
            mapRef.current.setCenter(userPos);
            mapRef.current.setZoom(13);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    } else {
      console.error('Geolocation is not supported by this browser.');
    }
  };

  // Effect to update user location periodically
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isLoaded) {
        handleGetLocation();
      }
    }, 10000); // Update every 10 seconds

    return () => {
      clearInterval(intervalId);
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
      }
    };
  }, [isLoaded]);

  // Effect to create user marker when map loads
  useEffect(() => {
    if (isLoaded && mapRef.current && userLocation) {
      handleGetLocation();
    }
  }, [isLoaded, mapRef.current]);

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (marker) {
        marker.map = null;
      }
    });
    markersRef.current = [];
    
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null;
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: '100vh'
  };

  const defaultCenter = {
    lat: 43.8384,
    lng: -79.0868
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_ID,
    streetViewControl: true,
    mapTypeControl: true,
    mapTypeControlOptions: {
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT,
      style: window.google?.maps?.MapTypeControlStyle?.HORIZONTAL_BAR
    },
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT
    }
  };

  // Remove markers when component unmounts
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => {
        if (marker) {
          marker.map = null;
        }
      });
      markersRef.current = [];
      
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
      }
    };
  }, []);

  return (
    <div className="app">
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={libraries}>
        <GarageSalesProvider>
          <Routes>
            <Route path="/info" element={
              <>
                <HamburgerMenu />
                <InfoPage />
              </>
            } />
            <Route path="/help" element={
              <>
                <HamburgerMenu />
                <Help />
              </>
            } />
            <Route path="/login" element={
              <>
                <HamburgerMenu />
                <Login />
              </>
            } />
            <Route path="/sales" element={
              <>
                <HamburgerMenu />
                <GarageSales />
              </>
            } />
            <Route path="/" element={
              <>
                <HamburgerMenu />
                <div className="map-container">
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={12}
                    options={mapOptions}
                    onLoad={onMapLoad}
                  >
                  </GoogleMap>
                </div>
              </>
            } />
          </Routes>
        </GarageSalesProvider>
      </LoadScript>
    </div>
  );
}

export default App;
