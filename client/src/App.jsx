import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function App() {
  const [count, setCount] = useState(0)
  console.log('Rendering App component');
  const [position, setPosition] = useState(null);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosition([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        console.log('Geolocation error');
      },
    );
  }

  return (
    <div>
      <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: "100vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://osm.org/copyright'>OpenStreetMap</a> contributors"
        />
        {position && (
          <Marker position={position}>
            <Popup>
              You are here!
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}

export default App
