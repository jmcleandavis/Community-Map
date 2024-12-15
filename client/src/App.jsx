import { useState } from 'react'
import './App.css'
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';

function App() {
  const [position, setPosition] = useState(null);
  const mapContainerStyle = {
    width: '100%',
    height: '100vh'
  };

  const defaultCenter = {
    lat: 51.505,
    lng: -0.09
  };

  if (navigator.geolocation) {
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

  return (
    <div>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={position || defaultCenter}
          zoom={13}
        >
          {position && (
            <Marker
              position={position}
              title="You are here!"
            />
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  )
}

export default App
