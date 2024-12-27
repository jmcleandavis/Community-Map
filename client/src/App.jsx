import { useState, useCallback, useEffect } from 'react'
import axios from 'axios';
import './App.css'
import { GoogleMap, LoadScript, InfoWindow } from '@react-google-maps/api';

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
        const geocoder = new window.google.maps.Geocoder();
        
        // Geocode all addresses
        const geocodePromises = addresses.map(address => {
          return new Promise((resolve) => {
            const fullAddress = `${address}, Pickering, ON, Canada`;
            console.log('Geocoding address:', fullAddress);
            
            geocoder.geocode({ address: fullAddress }, (results, status) => {
              if (status === 'OK' && results && results[0]) {
                const location = {
                  address: address,
                  position: {
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng()
                  }
                };
                console.log('Successfully geocoded:', location);
                resolve(location);
              } else {
                console.error('Geocoding failed for address:', address, status);
                resolve(null);
              }
            });
          });
        });

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

  return (
    <div>
      <LoadScript 
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        onLoad={() => {
          console.log('Google Maps script loaded');
          setIsLoaded(true);
        }}
        libraries={libraries}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={position || defaultCenter}
          zoom={12}
          options={mapOptions}
          onLoad={(map) => {
            console.log('Map loaded');
            setMap(map);
          }}
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
      </LoadScript>
    </div>
  );
}

export default App
