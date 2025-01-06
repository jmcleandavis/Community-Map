import { useState, useCallback, useEffect, useRef } from 'react'
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css'
import { GoogleMap, LoadScript, InfoWindow } from '@react-google-maps/api';
import HamburgerMenu from './components/HamburgerMenu';
import InfoPage from './pages/Info';
import Help from './pages/Help';
import Login from './pages/Login';
import GarageSales from './pages/GarageSales';

// Define libraries as a static constant
const libraries = ['marker'];

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 5000
});

function App() {
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [garageSales, setGarageSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef([]);

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (marker) {
        marker.map = null;
      }
    });
    markersRef.current = [];
  };

  // Cleanup markers on unmount
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, []);

  // Get current position
  useEffect(() => {
    if (!isLoaded || !window.google || !map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('Current position:', pos);
          setPosition(pos);
          if (map) {
            map.panTo(pos);
          }

          // Create current location marker
          const div = document.createElement('div');
          div.className = 'current-location-marker';
          div.style.backgroundColor = '#4285F4';
          div.style.borderRadius = '50%';
          div.style.border = '2px solid #FFFFFF';
          div.style.width = '16px';
          div.style.height = '16px';

          // Remove old current location marker if it exists
          const currentLocationMarker = markersRef.current.find(m => m.title === 'Current Location');
          if (currentLocationMarker) {
            currentLocationMarker.map = null;
            markersRef.current = markersRef.current.filter(m => m.title !== 'Current Location');
          }

          const marker = new window.google.maps.marker.AdvancedMarkerElement({
            position: pos,
            map,
            content: div,
            title: 'Current Location'
          });

          markersRef.current.push(marker);
        },
        (error) => {
          console.error('Error getting current position:', error);
        }
      );
    }
  }, [isLoaded, map]);

  // Fetch garage sale locations
  useEffect(() => {
    const fetchGarageSales = async () => {
      if (!isLoaded || !window.google || !map) {
        console.log('Google Maps not yet loaded');
        return;
      }

      try {
        // Clear existing garage sale markers
        markersRef.current = markersRef.current.filter(marker => {
          if (marker.title === 'Current Location') {
            return true; // Keep current location marker
          }
          marker.map = null; // Remove garage sale marker
          return false;
        });

        // First check if server is healthy
        await api.get('/health');
        
        console.log('Fetching addresses...');
        const { data: addresses } = await api.get('/api/addresses');
        console.log('Received addresses:', addresses);
        
        if (!addresses || addresses.length === 0) {
          console.warn('No addresses received from server');
          return;
        }

        // Create Geocoding service
        const geocodeAddress = async (addressData) => {
          try {
            const fullAddress = `${addressData.address}, Pickering, ON, Canada`;
            console.log('Geocoding address:', fullAddress);
            
            const response = await api.get('/api/geocode', {
              params: {
                address: fullAddress
              }
            });

            if (response.data.status === 'OK' && response.data.results && response.data.results[0]) {
              const location = response.data.results[0].geometry.location;
              
              // Create marker element for garage sale
              const markerElement = document.createElement('div');
              markerElement.className = 'garage-sale-marker';
              markerElement.style.backgroundColor = '#FF0000';
              markerElement.style.borderRadius = '50%';
              markerElement.style.border = '2px solid #FFFFFF';
              markerElement.style.width = '12px';
              markerElement.style.height = '12px';

              const marker = new window.google.maps.marker.AdvancedMarkerElement({
                position: {
                  lat: location.lat,
                  lng: location.lng
                },
                map,
                content: markerElement,
                title: addressData.address
              });

              marker.addListener('click', () => {
                setSelectedSale({
                  position: {
                    lat: location.lat,
                    lng: location.lng
                  },
                  address: addressData.address,
                  description: addressData.description
                });
              });

              markersRef.current.push(marker);

              return {
                address: addressData.address,
                description: addressData.description,
                position: {
                  lat: location.lat,
                  lng: location.lng
                }
              };
            }
            console.warn(`Geocoding failed for address: ${fullAddress}`);
            return null;
          } catch (error) {
            console.error(`Error geocoding address ${addressData.address}:`, error);
            return null;
          }
        };

        // Geocode all addresses
        const geocodePromises = addresses.map(addressData => geocodeAddress(addressData));
        const locations = await Promise.all(geocodePromises);
        const validLocations = locations.filter(location => location !== null);
        console.log('Final locations:', validLocations);
        
        setGarageSales(validLocations);
      } catch (error) {
        console.error('Error fetching garage sales:', error.response?.data || error.message);
      }
    };

    fetchGarageSales();
  }, [isLoaded, map]);

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

  const onMapLoad = (map) => {
    console.log('Map loaded');
    setMap(map);
    setIsLoaded(true);
  };

  return (
    <div className="app">
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={libraries}>
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
                  center={position || defaultCenter}
                  zoom={13}
                  options={mapOptions}
                  onLoad={onMapLoad}
                >
                  {selectedSale && (
                    <InfoWindow
                      position={selectedSale.position}
                      onCloseClick={() => setSelectedSale(null)}
                    >
                      <div>
                        <h3>Garage Sale</h3>
                        <p>{selectedSale.address}</p>
                        <p>{selectedSale.description}</p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </div>
            </>
          } />
        </Routes>
      </LoadScript>
    </div>
  );
}

export default App;
