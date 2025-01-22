import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import './App.css';
import HamburgerMenu from './components/HamburgerMenu';
import InfoPage from './pages/Info';
import Help from './pages/Help';
import Login from './pages/Login';
import GarageSales from './pages/GarageSales';
import MapView from './components/MapView';
import { GarageSalesProvider } from './context/GarageSalesContext';
import { AuthProvider } from './context/AuthContext';

// Define libraries as a static constant
const libraries = ['marker'];

function App() {
  const mapContainerStyle = {
    width: '100%',
    height: '100vh'
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    mapId: import.meta.env.VITE_GOOGLE_MAPS_ID,
    streetViewControl: true,
    mapTypeControl: true,
    mapTypeControlOptions: {
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT,
      style: window.google?.maps?.MapTypeControlStyle?.DROPDOWN_MENU
    },
    fullscreenControl: true,
    fullscreenControlOptions: {
      position: window.google?.maps?.ControlPosition?.TOP_RIGHT
    },
    zoomControlOptions: {
      position: window.google?.maps?.ControlPosition?.RIGHT_CENTER
    }
  };

  return (
    <AuthProvider>
      <GarageSalesProvider>
        <LoadScript 
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} 
          libraries={libraries}
        >
          <div className="app">
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
                    <MapView 
                      mapContainerStyle={mapContainerStyle}
                      mapOptions={mapOptions}
                    />
                  </div>
                </>
              } />
            </Routes>
          </div>
        </LoadScript>
      </GarageSalesProvider>
    </AuthProvider>
  );
}

export default App;
