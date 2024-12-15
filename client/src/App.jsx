import { useState, useCallback } from 'react'
import './App.css'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

function App() {
  const [map, setMap] = useState(null);
  const [position, setPosition] = useState(null);
  
  const mapContainerStyle = {
    width: '100%',
    height: '100vh'
  };

  const defaultCenter = {
    lat: 51.505,
    lng: -0.09
  };

  const onLoad = useCallback(function callback(map) {
    setMap(map);
    // Enable the current location blue dot
    if (navigator.geolocation) {
      const locationButton = document.createElement("button");
      locationButton.textContent = "Pan to Current Location";
      locationButton.classList.add("custom-map-control-button");
      
      map.controls[window.google.maps.ControlPosition.TOP_RIGHT].push(locationButton);

      locationButton.addEventListener("click", () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setPosition(pos);
            map.setCenter(pos);
          },
          () => {
            console.log("Error: The Geolocation service failed.");
          }
        );
      });
    }
  }, []);

  // Get initial position
  if (navigator.geolocation && !position) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        console.log('Geolocation error');
      },
    );
  }

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapTypeControl: true,
    scaleControl: true,
    streetViewControl: true,
    rotateControl: true,
    fullscreenControl: true,
  };

  return (
    <div>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={position || defaultCenter}
          zoom={13}
          options={mapOptions}
          onLoad={onLoad}
        >
          {position && (
            <Marker
              position={position}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#4285F4",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  )
}

export default App
