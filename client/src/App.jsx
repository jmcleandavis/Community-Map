import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import './App.css';
import HamburgerMenu from './components/HamburgerMenu';
import InfoPage from './pages/Info';
import Help from './pages/Help';
import Login from './pages/Login';
import GarageSales from './pages/GarageSales';
import MapContainer from './components/MapContainer';
import { GarageSalesProvider } from './context/GarageSalesContext';

// Define libraries as a static constant
const libraries = ['marker'];

function App() {
  return (
    <div className="app">
      <GarageSalesProvider>
        <LoadScript 
          googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} 
          libraries={libraries}
        >
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
                <MapContainer />
              </>
            } />
          </Routes>
        </LoadScript>
      </GarageSalesProvider>
    </div>
  );
}

export default App;
