import React, { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import './App.css';
import HamburgerMenu from './components/HamburgerMenu';
import ConditionalMenu from './components/ConditionalMenu';
import InfoPage from './pages/Info';
import Help from './pages/Help';
import Login from './pages/Login';
import LoginRedirect from './pages/LoginRedirect';
import PasswordReset from './pages/PasswordReset';
import GarageSales from './pages/GarageSales';
import GarageSalesAdmin from './pages/GarageSalesAdmin';
import CommunitySalesAdmin from './pages/CommunitySalesAdmin';
import LandingPage from './pages/LandingPage';
import MapView from './components/MapView';
import { GarageSalesProvider } from './context/GarageSalesContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DisplayProvider } from './context/DisplayContext';
import { LocationProvider } from './context/LocationContext';
import { NavigationProvider } from './context/NavigationContext';

function App() {
  // Google Maps libraries
  const libraries = useMemo(() => ['places', 'marker'], []);

  // Map container style
  const mapContainerStyle = useMemo(() => ({
    width: '100%',
    height: '100vh'
  }), []);

  const mapOptions = useMemo(() => ({
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
  }), []); // Empty dependency array since these options don't change

  return (
    <AuthProvider>
      <LoadScript 
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} 
        libraries={libraries}
        loadingElement={<div>Loading Google Maps...</div>}
      >
        <GarageSalesProvider>
          <DisplayProvider>
            <LocationProvider>
              <NavigationProvider>
                <div className="app">
                  <Routes>
                    <Route path="/loginRedirect" element={<LoginRedirect />} />
                    <Route path="/about" element={
                      <>
                        <ConditionalMenu />
                        <LandingPage />
                      </>
                    } />
                    <Route path="/info" element={
                      <>
                        <ConditionalMenu />
                        <InfoPage />
                      </>
                    } />
                    <Route path="/help" element={
                      <>
                        <ConditionalMenu />
                        <Help />
                      </>
                    } />
                    <Route path="/login" element={
                      <>
                        <ConditionalMenu />
                        <Login />
                      </>
                    } />
                    <Route path="/reset-password" element={
                      <>
                        <ConditionalMenu />
                        <PasswordReset />
                      </>
                    } />
                    <Route path="/sales" element={
                      <>
                        <ConditionalMenu />
                        <GarageSales />
                      </>
                    } />
                    <Route path="/" element={
                      <>
                        <ConditionalMenu />
                        <div className="map-container">
                          <MapView 
                            mapContainerStyle={mapContainerStyle}
                            mapOptions={mapOptions}
                          />
                        </div>
                      </>
                    } />
                    <Route path="/landing" element={
                      <>
                        <ConditionalMenu />
                        <LandingPage />
                      </>
                    } />
                    <Route path="/admin/community-sales" element={
                      <ProtectedRouteWrapper>
                        <>
                          <ConditionalMenu />
                          <CommunitySalesAdmin />
                        </>
                      </ProtectedRouteWrapper>
                    } />
                    <Route path="/admin/sales" element={
                      <ProtectedRouteWrapper>
                        <>
                          <ConditionalMenu />
                          <GarageSalesAdmin />
                        </>
                      </ProtectedRouteWrapper>
                    } />
                  </Routes>
                </div>
              </NavigationProvider>
            </LocationProvider>
          </DisplayProvider>
        </GarageSalesProvider>
      </LoadScript>
    </AuthProvider>
  );
}

// Move ProtectedRoute inside App to avoid circular dependency
const ProtectedRouteWrapper = ({ children }) => {
  const { isAuthenticated, userType } = useAuth();
  
  if (!isAuthenticated || userType !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default App;
