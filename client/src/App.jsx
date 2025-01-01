import { useState, useCallback, useEffect } from 'react'
import axios from 'axios';
import './App.css'
import { GoogleMap, LoadScript, InfoWindow } from '@react-google-maps/api';
import ReactDOM from 'react-dom';
import HamburgerMenu from './components/HamburgerMenu';

// Define libraries as a static constant
const libraries = ['marker'];

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 5000
});

// Create axios instance with base URL for backend
const backendApi = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 5000
});

// Create axios instance for Google Geocoding API
const geocodingApi = axios.create({
  baseURL: 'https://maps.googleapis.com/maps/api/geocode/json',
  timeout: 5000
});

function App() {
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  const [garageSales, setGarageSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [currentLocationMarker, setCurrentLocationMarker] = useState(null);
  const [saleMarkers, setSaleMarkers] = useState([]);

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
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT
    },
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT
    }
  };

  // Get current position
  useEffect(() => {
    if (!isLoaded || !window.google) return;

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
      if (!isLoaded || !window.google) {
        console.log('Google Maps not yet loaded');
        return;
      }

      try {
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
        const geocodeAddress = async (address) => {
          try {
            const fullAddress = `${address}, Pickering, ON, Canada`;
            console.log('Geocoding address:', fullAddress);
            
            const response = await geocodingApi.get('', {
              params: {
                address: fullAddress,
                key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
              }
            });

            if (response.data.status === 'OK' && response.data.results && response.data.results[0]) {
              const location = response.data.results[0].geometry.location;
              return {
                address: address,
                position: {
                  lat: location.lat,
                  lng: location.lng
                }
              };
            }
            console.warn(`Geocoding failed for address: ${fullAddress}`);
            return null;
          } catch (error) {
            console.error(`Error geocoding address ${address}:`, error);
            return null;
          }
        };

        // Geocode all addresses using axios
        const geocodePromises = addresses.map(address => geocodeAddress(address));

        const locations = await Promise.all(geocodePromises);
        const validLocations = locations.filter(location => location !== null);
        console.log('Final locations:', validLocations);
        setGarageSales(validLocations);
      } catch (error) {
        console.error('Error fetching garage sales:', error.response?.data || error.message);
      }
    };

    fetchGarageSales();
  }, [isLoaded]);

  // Effect for current location marker
  useEffect(() => {
    if (!map || !position || !window.google) return;
    
    // Remove existing marker
    if (currentLocationMarker) {
      currentLocationMarker.map = null;
    }

    // Create new marker
    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      position,
      map,
      title: "Your Location",
      content: (() => {
        const div = document.createElement('div');
        div.className = 'current-location-marker';
        div.style.backgroundColor = '#4285F4';
        div.style.borderRadius = '50%';
        div.style.border = '2px solid #FFFFFF';
        div.style.width = '16px';
        div.style.height = '16px';
        return div;
      })()
    });

    marker.addListener('click', () => setSelectedSale(null));
    setCurrentLocationMarker(marker);

    return () => {
      if (marker) {
        marker.map = null;
      }
    };
  }, [map, position]);

  // Effect for garage sale markers
  useEffect(() => {
    if (!map || !window.google) return;

    // Remove existing markers
    saleMarkers.forEach(marker => {
      marker.map = null;
    });

    // Create new markers
    const newMarkers = garageSales.map(sale => {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: sale.position,
        map,
        title: sale.address,
        content: (() => {
          const div = document.createElement('div');
          div.className = 'garage-sale-marker';
          div.style.backgroundColor = '#FF0000';
          div.style.borderRadius = '50%';
          div.style.border = '2px solid #FFFFFF';
          div.style.width = '16px';
          div.style.height = '16px';
          return div;
        })()
      });

      marker.addListener('click', () => setSelectedSale(sale));
      return marker;
    });

    setSaleMarkers(newMarkers);

    return () => {
      newMarkers.forEach(marker => {
        marker.map = null;
      });
    };
  }, [map, garageSales]);

  // Custom control for hamburger menu
  const onLoad = (map) => {
    console.log('Map loaded');
    setMap(map);

    // Create custom control div
    const customControlDiv = document.createElement('div');
    customControlDiv.style.marginLeft = '10px';
    
    // Add the control to the map
    map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(customControlDiv);

    // Render hamburger menu into the control
    const root = ReactDOM.createRoot(customControlDiv);
    root.render(<HamburgerMenu />);
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
        onLoad={() => setIsLoaded(true)}
      >
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={position || defaultCenter}
            zoom={12}
            options={mapOptions}
            onLoad={onLoad}
          >
            {/* Info window for selected garage sale */}
            {selectedSale && (
              <InfoWindow
                position={selectedSale.position}
                onCloseClick={() => setSelectedSale(null)}
              >
                <div>
                  <h3>Garage Sale</h3>
                  <p>{selectedSale.address}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </LoadScript>
    </div>
  );
}

export default App
