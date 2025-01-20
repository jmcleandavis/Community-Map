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
import { GarageSalesProvider, useGarageSales } from './context/GarageSalesContext';

// Define libraries as a static constant
const libraries = ['marker'];

function App() {
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [center, setCenter] = useState({ lat: 43.5890, lng: -79.6441 });
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const mapRef = useRef(null);
  const { fetchGarageSales, garageSales } = useGarageSales();

  // Map load effect
  useEffect(() => {
    if (isLoaded && mapRef.current) {
      console.log('Map is loaded');
      fetchGarageSales();
    }
  }, [isLoaded, fetchGarageSales]);

  // Effect to manage markers
  useEffect(() => {
    if (isLoaded && mapRef.current && garageSales.length > 0) {
      console.log('Creating markers for garage sales:', garageSales);
      
      // Clear existing markers
      markersRef.current.forEach(marker => {
        if (marker) {
          marker.map = null;
        }
      });
      markersRef.current = [];

      // Create new markers
      garageSales.forEach(sale => {
        if (!sale.lat || !sale.lng) {
          console.warn('Sale missing coordinates:', sale);
          return;
        }

        const lat = parseFloat(sale.lat);
        const lng = parseFloat(sale.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.warn('Invalid coordinates for sale:', sale);
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
            title: sale.address,
            map: mapRef.current
          });

          // Create info window for this marker
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div>
                <h3>${sale.address}</h3>
                <p>${sale.description}</p>
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
  }, [isLoaded, garageSales]);

  const onMapLoad = useCallback((map) => {
    console.log('Map loaded, setting map ref');
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

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
      <GarageSalesProvider>
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
        </LoadScript>
      </GarageSalesProvider>
    </div>
  );
}

export default App;
