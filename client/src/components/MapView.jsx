import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useGarageSales } from '../context/GarageSalesContext';

function MapView({ mapContainerStyle, mapOptions }) {
  const [selectedSale, setSelectedSale] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [center] = useState({
    lat: 43.8384,
    lng: -79.0868
  });
  
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const initialLocationSetRef = useRef(false);
  const initialLoadRef = useRef(false);
  const { fetchGarageSales, garageSales, loading, error, setGarageSales } = useGarageSales();

  // Cleanup function for markers
  const cleanupMarkers = useCallback(() => {
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        if (marker?.infoWindow) {
          marker.infoWindow.close();
        }
        if (marker?.map) {
          marker.map = null;
        }
      });
      markersRef.current = [];
    }
  }, []);

  // Debug mount/unmount cycles
  useEffect(() => {
    console.log('MapView: Component mounted');
    return () => {
      console.log('MapView: Component unmounted');
      cleanupMarkers();
    };
  }, [cleanupMarkers]);

  // Load garage sales data
  useEffect(() => {
    if (initialLoadRef.current) return;
    
    console.log('MapView: Checking for garage sales data');
    
    const cachedGarageSales = localStorage.getItem('garageSales');
    
    const loadData = async () => {
      if (!cachedGarageSales || garageSales.length === 0) {
        console.log('MapView: No garage sales data found, triggering fetch');
        await fetchGarageSales();
      }
      initialLoadRef.current = true;
    };

    loadData().catch(err => {
      console.error('MapView: Error loading garage sales:', err);
    });
  }, [fetchGarageSales, garageSales.length]);

  // Handle map load
  const onLoad = useCallback((map) => {
    console.log('MapView: Map loaded');
    mapRef.current = map;
    setIsLoaded(true);
  }, []);

  // Handle map unmount
  const onUnmount = useCallback(() => {
    console.log('MapView: Map unmounted');
    mapRef.current = null;
    setIsLoaded(false);
  }, []);

  // Create markers function
  const createMarkers = useCallback(() => {
    if (!mapRef.current || !window.google) {
      console.log('MapView: Cannot create markers - map or google not ready');
      return;
    }

    if (!garageSales?.length) {
      console.log('MapView: Cannot create markers - no garage sales data');
      return;
    }

    console.log('MapView: Creating markers for sales:', garageSales.length);
    cleanupMarkers();

    // Get selected sale IDs from localStorage
    const selectedSaleIds = JSON.parse(localStorage.getItem('selectedSaleIds') || '[]');

    garageSales.forEach(sale => {
      if (!sale?.position?.lat || !sale?.position?.lng) {
        console.warn('MapView: Sale missing position data:', sale);
        return;
      }

      try {
        const markerElement = document.createElement('div');
        markerElement.className = 'garage-sale-marker';
        // Set color based on whether the sale is selected
        const markerColor = selectedSaleIds.includes(sale.id) ? '#4CAF50' : '#FF0000';
        markerElement.style.cssText = `
          background-color: ${markerColor};
          border-radius: 50%;
          border: 2px solid #FFFFFF;
          width: 12px;
          height: 12px;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        `;

        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          position: sale.position,
          content: markerElement,
          title: sale.address,
          map: mapRef.current
        });

        const infoContent = document.createElement('div');
        infoContent.className = 'garage-sale-info';
        infoContent.innerHTML = `
          <div style="padding: 8px; max-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px;">${sale.address}</h3>
            ${sale.description ? `<p style="margin: 0 0 8px 0;">${sale.description}</p>` : ''}
            ${sale.highlightedItems?.length ? `
              <div style="margin-top: 8px;">
                <strong>Featured Items:</strong>
                <ul style="margin: 4px 0 0 0; padding-left: 20px;">
                  ${sale.highlightedItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;

        const infoWindow = new window.google.maps.InfoWindow({
          content: infoContent,
          maxWidth: 250
        });

        marker.addListener('click', () => {
          markersRef.current.forEach(m => {
            if (m.infoWindow && m.infoWindow !== infoWindow) {
              m.infoWindow.close();
            }
          });

          infoWindow.open({
            anchor: marker,
            map: mapRef.current
          });

          setSelectedSale(sale);
        });

        marker.infoWindow = infoWindow;
        markersRef.current.push(marker);
      } catch (error) {
        console.error('MapView: Error creating marker:', {
          sale,
          error: error.message
        });
      }
    });

    console.log('MapView: Created markers:', markersRef.current.length);
  }, [garageSales, cleanupMarkers]);

  // Effect to manage markers
  useEffect(() => {
    console.log('MapView: Marker effect running with conditions:', {
      isLoaded,
      hasMap: !!mapRef.current,
      salesCount: garageSales?.length,
      hasGoogle: !!window.google
    });

    if (!isLoaded || !mapRef.current || !window.google) {
      console.log('MapView: Skipping marker creation - map not ready');
      return;
    }

    if (!garageSales?.length) {
      console.log('MapView: Skipping marker creation - no garage sales data');
      return;
    }

    const timeoutId = setTimeout(() => {
      createMarkers();
    }, 500); // Give a bit more time for everything to be ready

    return () => {
      clearTimeout(timeoutId);
      cleanupMarkers();
    };
  }, [isLoaded, createMarkers, cleanupMarkers, garageSales]);

  // Handle map bounds update
  const onBoundsChanged = useCallback(() => {
    if (mapRef.current && markersRef.current.length === 0) {
      createMarkers();
    }
  }, [createMarkers]);

  // Memoize map options
  const combinedMapOptions = useMemo(() => ({
    ...mapOptions,
    zoomControl: true,
    streetViewControl: true,
    mapTypeControl: true,
  }), [mapOptions]);

  // Get user's location
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !window.google || initialLocationSetRef.current) {
      return;
    }

    const getUserLocation = () => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser.');
        handleLocationError();
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      };

      const handleLocationError = () => {
        console.log('MapView: Using default location');
        const defaultPos = center;
        if (mapRef.current) {
          mapRef.current.panTo(defaultPos);
          mapRef.current.setZoom(11);
        }
      };

      try {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!mapRef.current) return;

            const pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setUserLocation(pos);
            mapRef.current.panTo(pos);
            mapRef.current.setZoom(13);

            // Create user location marker
            if (userMarkerRef.current) {
              userMarkerRef.current.setMap(null);
            }

            if (window.google && mapRef.current) {
              userMarkerRef.current = new window.google.maps.Marker({
                position: pos,
                map: mapRef.current,
                title: 'Your Location',
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                },
              });
            }
          },
          (error) => {
            console.warn('Error getting location:', error);
            handleLocationError();
          },
          options
        );
      } catch (error) {
        console.error('Error in geolocation:', error);
        handleLocationError();
      }
    };

    initialLocationSetRef.current = true;
    getUserLocation();

  }, [isLoaded, center]);

  return (
    <>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={11}
        options={combinedMapOptions}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onBoundsChanged={onBoundsChanged}
      >
        {selectedSale && selectedSale.position && (
          <InfoWindow
            position={selectedSale.position}
            onCloseClick={() => setSelectedSale(null)}
          >
            <div>
              <h3>{selectedSale.address}</h3>
              <p>{selectedSale.description || ''}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error}</div>}
      {!loading && !error && (!garageSales || garageSales.length === 0) && <div>No addresses to display</div>}
    </>
  );
}

export default React.memo(MapView);
