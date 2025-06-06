import React, { useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactGA from 'react-ga4'; // Import react-ga4
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import './App.css';
import HamburgerMenu from './components/HamburgerMenu';
import ConditionalMenu from './components/ConditionalMenu';
import InfoPage from './pages/Info';
import ListActiveCommunitySalesEvents from './pages/ListActiveCommunitySalesEvents';
import Help from './pages/Help';
import Login from './pages/Login';
import LoginRedirect from './pages/LoginRedirect';
import LanderRedirect from './components/LanderRedirect';
import PasswordReset from './pages/PasswordReset';
import GarageSales from './pages/GarageSales';
import SingleGarageSales from './pages/SingleGarageSales';
import GarageSalesAdmin from './pages/GarageSalesAdmin';
import GarageSalesBulkUpload from './pages/GarageSalesBulkUpload';
import CommunitySalesAdmin from './pages/CommunitySalesAdmin';
import LandingPage from './pages/LandingPage';
import MapView from './components/MapView';
import { GarageSalesProvider } from './context/GarageSalesContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DisplayProvider } from './context/DisplayContext';
import { LocationProvider } from './context/LocationContext';
import { NavigationProvider } from './context/NavigationContext';
import { CommunitySalesProvider } from './context/CommunitySalesContext';
import { InitialPageProvider } from './context/InitialPageContext';
import DocumentTitle from './components/DocumentTitle';

function App() {
  const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID; // Make sure you have this in your .env file
  ReactGA.initialize(GA_MEASUREMENT_ID);
  const location = useLocation(); // Get the current location object


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

    // Track page views with Google Analytics
    useEffect(() => {
      ReactGA.send({ hitType: "pageview", page: location.pathname + location.search });
    }, [location]); // Re-run this effect whenever the location changes
  

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
                <InitialPageProvider>
                  <CommunitySalesProvider>
                    <DocumentTitle />
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
                        <Route path="/list-active-community-sales-events" element={
                          <>
                            <ConditionalMenu />
                            <ListActiveCommunitySalesEvents />
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
                        <Route path="/single-garage-sales" element={
                          <>
                            <ConditionalMenu />
                            <SingleGarageSales />
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
                        <Route path="/lander" element={<LanderRedirect />} />
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
                        <Route path="/admin/bulk-upload" element={
                          <ProtectedRouteWrapper>
                            <>
                              <ConditionalMenu />
                              <GarageSalesBulkUpload />
                            </>
                          </ProtectedRouteWrapper>
                        } />
                      </Routes>
                    </div>
                  </CommunitySalesProvider>
                </InitialPageProvider>
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
  const { isAuthenticated } = useAuth();

  // Only check if the user is authenticated, no longer requiring admin status
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default App;
