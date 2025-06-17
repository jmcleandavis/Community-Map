import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GooglePlacesAutocomplete from 'react-google-places-autocomplete';
import './RegisterGarageSale.css'; // Use dedicated CSS for this component
import api from '../utils/api';

const RegisterGarageSale = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userInfo } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: 'Garage Sale',
    description: '',
    street: '',  // Combined street number and name
    unit: '',
    city: '',
    provState: '',
    postalZipCode: '',
    startDate: '',
    endDate: ''
  });
  
  // Featured items as separate array
  const [featuredItems, setFeaturedItems] = useState(['']);
  
  // Additional state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingSale, setExistingSale] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [useManualAddress, setUseManualAddress] = useState(false);

  // Check if user is authenticated and fetch their existing garage sale if any
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?returnTo=/register-garage-sale');
      return;
    }
    
    const fetchUserGarageSale = async () => {
      setLoading(true);
      try {
        // Fetch user's garage sale if it exists
        const response = await api.getUserGarageSale(userInfo.id);
        if (response.data && response.data.length > 0) {
          const sale = response.data[0];
          setExistingSale(sale);
          
          // Pre-fill form with existing data
          setFormData({
            name: sale.name || '',
            description: sale.description || '',
            streetNum: sale.address?.streetNum || '',
            street: sale.address?.street || '',
            unit: sale.address?.unit || '',
            city: sale.address?.city || '',
            provState: sale.address?.provState || '',
            postalZipCode: sale.address?.postalZipCode || '',
            startDate: sale.startDate || '',
            endDate: sale.endDate || ''
          });
          setFeaturedItems(sale.highlightedItems || ['']);
        }
      } catch (err) {
        console.error('Error fetching user garage sale:', err);
        // No existing sale or error fetching - that's okay, user can create a new one
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserGarageSale();
  }, [isAuthenticated, navigate, userInfo]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // If manually entering address, clear the selected place
    if (name === 'street' && selectedPlace) {
      setSelectedPlace(null);
    }
  };

  // Handle address selection from Google Places Autocomplete
  const handleAddressSelect = (place) => {
    if (!place) {
      // Handle clearing the selection (when X is clicked)
      setSelectedPlace(null);
      setFormData(prev => ({
        ...prev,
        street: '',
        unit: '',
        city: '',
        provState: '',
        postalZipCode: ''
      }));
      return;
    }
    
    setSelectedPlace(place);
    
    // Get place details to extract address components
    const placeId = place.value.place_id;
    
    // Use Google Places service to get detailed address components
    if (window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      service.getDetails({
        placeId: placeId,
        fields: ['address_components', 'formatted_address']
      }, (result, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
          const addressComponents = result.address_components;
          
          // Parse address components
          let streetNum = '';
          let streetName = '';
          let city = '';
          let state = '';
          let postalCode = '';
          let unit = '';
          
          addressComponents.forEach(component => {
            const types = component.types;
            
            if (types.includes('street_number')) {
              streetNum = component.long_name;
            } else if (types.includes('route')) {
              streetName = component.long_name;
            } else if (types.includes('locality')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              state = component.short_name;
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name;
            } else if (types.includes('subpremise')) {
              unit = component.long_name;
            }
          });
          
          // Update form data with parsed address
          setFormData(prev => ({
            ...prev,
            street: streetNum ? `${streetNum} ${streetName}`.trim() : streetName,
            unit: unit,
            city: city,
            provState: state,
            postalZipCode: postalCode
          }));
          
          // Create a custom display value for the selected place that shows only street address
          setSelectedPlace({
            label: streetNum ? `${streetNum} ${streetName}`.trim() : streetName,
            value: { 
              place_id: placeId, 
              description: streetNum ? `${streetNum} ${streetName}`.trim() : streetName 
            }
          });
        } else {
          console.error('Error getting place details:', status);
          setError('Failed to get address details. Please try entering manually.');
        }
      });
    } else {
      console.error('Google Maps Places API not loaded');
      setError('Address search is not available. Please enter your address manually.');
      setUseManualAddress(true);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format dates for API - convert YYYY-MM-DD to ISO datetime format
      const formatDateForAPI = (dateString, isEndDate = false) => {
        if (!dateString) return null;
        
        // For start date, use 9:00 AM; for end date, use 6:00 PM
        const time = isEndDate ? '18:00:00' : '09:00:00';
        return `${dateString}T${time}`;
      };
      
      // Format data for API
      const saleData = {
        name: formData.name || "",
        description: formData.description || "",
        address: {
          streetNum: formData.streetNum,
          street: formData.street,
          unit: formData.unit || "",
          city: formData.city,
          provState: formData.provState,
          postalZipCode: formData.postalZipCode
        },
        highlightedItems: featuredItems.filter(item => item.trim() !== ''),
        dateTime: {
          start: formatDateForAPI(formData.startDate, false),
          end: formatDateForAPI(formData.endDate || formData.startDate, true),
          timezone: "America/Toronto"
        },
        community: 'GENPUB', // Default community for individual garage sales
        userId: userInfo.id
      };
      
      let response;
      if (existingSale && isEditing) {
        // Update existing garage sale
        response = await api.updateGarageSale(existingSale.id, saleData);
        setSuccess('Your garage sale has been updated successfully!');
      } else {
        // Create new garage sale
        response = await api.createGarageSale(saleData);
        setSuccess('Your garage sale has been registered successfully!');
      }
      
      // Update the existingSale state with the new data
      setExistingSale(response.data);
      setIsEditing(false);
      
      // Store in session storage for immediate use in other components
      const currentData = JSON.parse(sessionStorage.getItem('garageSalesData') || '[]');
      const updatedData = isEditing 
        ? currentData.map(sale => sale.id === existingSale.id ? response.data : sale)
        : [...currentData, response.data];
      sessionStorage.setItem('garageSalesData', JSON.stringify(updatedData));
      
    } catch (err) {
      console.error('Error saving garage sale:', err);
      setError(err.response?.data?.message || 'Failed to save your garage sale. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete garage sale
  const handleDelete = async () => {
    if (!existingSale) return;
    
    if (window.confirm('Are you sure you want to delete your garage sale? This action cannot be undone.')) {
      setLoading(true);
      try {
        await api.deleteGarageSale(existingSale.id);
        
        // Remove from session storage
        const currentData = JSON.parse(sessionStorage.getItem('garageSalesData') || '[]');
        const updatedData = currentData.filter(sale => sale.id !== existingSale.id);
        sessionStorage.setItem('garageSalesData', JSON.stringify(updatedData));
        
        setExistingSale(null);
        setFormData({
          name: '',
          description: '',
          streetNum: '',
          street: '',
          unit: '',
          city: '',
          provState: '',
          postalZipCode: '',
          startDate: '',
          endDate: ''
        });
        setFeaturedItems(['']);
        setSuccess('Your garage sale has been deleted successfully.');
      } catch (err) {
        console.error('Error deleting garage sale:', err);
        setError(err.response?.data?.message || 'Failed to delete your garage sale. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle edit mode
  const handleEditClick = () => {
    setIsEditing(true);
    setSuccess(null);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    if (existingSale) {
      // Reset form to existing sale data
      setFormData({
        name: existingSale.name || '',
        description: existingSale.description || '',
        street: existingSale.address?.street || (existingSale.address?.streetNum ? 
          `${existingSale.address.streetNum} ${existingSale.address.street || ''}`.trim() : ''),
        unit: existingSale.address?.unit || '',
        city: existingSale.address?.city || '',
        provState: existingSale.address?.provState || '',
        postalZipCode: existingSale.address?.postalZipCode || '',
        startDate: existingSale.startDate || '',
        endDate: existingSale.endDate || ''
      });
      setFeaturedItems(existingSale.highlightedItems || ['']);
    }
    setIsEditing(false);
    setError(null);
  };

  // Handle adding new featured item input
  const handleAddFeaturedItem = () => {
    setFeaturedItems([...featuredItems, '']);
  };

  // Handle removing featured item input
  const handleRemoveFeaturedItem = (index) => {
    setFeaturedItems(featuredItems.filter((item, i) => i !== index));
  };

  // Handle featured item input change
  const handleFeaturedItemChange = (e, index) => {
    const updatedItems = [...featuredItems];
    updatedItems[index] = e.target.value;
    setFeaturedItems(updatedItems);
  };

  return (
    <div className="garage-sales-container">
      <h1>{existingSale && !isEditing ? 'Your Garage Sale' : 'Register a Garage Sale'}</h1>
      
      {loading && <div className="loading">Loading...</div>}
      
      {error && (
        <div className="error">
          {error}
          <button className="retry-button" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      {success && !isEditing && (
        <div className="success-message">
          {success}
        </div>
      )}
      
      {existingSale && !isEditing ? (
        <div className="existing-sale-container">
          <div className="garage-sale-card">
            <div className="sale-content">
              <h3>{existingSale.name || 'GARAGE SALE'}</h3>
              
              <div className="sale-address-details">
                {existingSale.address && (
                  <>
                    <p className="address-line">
                      {existingSale.address.street}
                    </p>
                    <p className="address-line">
                      {existingSale.address.unit && (
                        <span>{existingSale.address.unit} </span>
                      )}
                      {existingSale.address.city}, {existingSale.address.provState} {existingSale.address.postalZipCode}
                    </p>
                  </>
                )}
              </div>
              
              {existingSale.description && (
                <p className="sale-description">{existingSale.description}</p>
              )}
              
              {existingSale.highlightedItems && (
                <p className="sale-items">
                  <strong>Featured Items:</strong> {Array.isArray(existingSale.highlightedItems) 
                    ? existingSale.highlightedItems.join(', ') 
                    : existingSale.highlightedItems}
                </p>
              )}
              
              <div className="sale-dates">
                <p><strong>Start Date:</strong> {new Date(existingSale.startDate).toLocaleDateString()}</p>
                <p><strong>End Date:</strong> {new Date(existingSale.endDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="sale-actions">
            <button className="edit-button" onClick={handleEditClick}>Edit Garage Sale</button>
            <button className="delete-button" onClick={handleDelete}>Delete Garage Sale</button>
          </div>
        </div>
      ) : (
        <form className="garage-sale-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Garage Sale Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Spring Cleaning Sale"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your garage sale..."
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <label>Featured Items</label>
            {featuredItems.map((item, index) => (
              <div 
                key={index} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  gap: '8px'
                }}
              >
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleFeaturedItemChange(e, index)}
                  placeholder="e.g., Furniture, Electronics, Toys"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
                {featuredItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFeaturedItem(index)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      fontSize: '18px',
                      padding: '4px',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove item"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddFeaturedItem}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a73e8',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '8px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '16px' }}>+</span> Add item
            </button>
          </div>
          
          <div className="form-row">
            <div className="form-group" style={{ width: '100%' }}>
              <label htmlFor="street">
                Street Address <span style={{ color: 'red' }}>*</span>
              </label>
              {useManualAddress ? (
                <input
                  type="text"
                  id="street"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  placeholder="e.g., 123 Main St"
                  required
                  style={{ width: '100%' }}
                />
              ) : (
                <GooglePlacesAutocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                  autocompletionRequest={{
                    types: ['address'],
                    componentRestrictions: {
                      country: ['us', 'ca'] // Restrict to US and Canada
                    }
                  }}
                  selectProps={{
                    value: selectedPlace,
                    onChange: handleAddressSelect,
                    placeholder: 'Search for your address...',
                    isClearable: true,
                    styles: {
                      input: (provided) => ({
                        ...provided,
                        fontSize: '16px',
                      }),
                      option: (provided) => ({
                        ...provided,
                        fontSize: '14px',
                      }),
                      control: (provided) => ({
                        ...provided,
                        minHeight: '38px',
                        height: '38px',
                      })
                    }
                  }}
                />
              )}
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                {useManualAddress 
                  ? 'Enter your full street address (e.g., 123 Main St)' 
                  : 'Search for your address to auto-fill all fields below'
                }
              </small>
              <button
                type="button"
                onClick={() => setUseManualAddress(!useManualAddress)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#007bff',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginTop: '4px',
                  padding: '0'
                }}
              >
                {useManualAddress ? 'Use address search instead' : 'Enter address manually'}
              </button>
            </div>
          </div>
          
          <div className="form-row">
            
            <div className="form-group">
              <label htmlFor="unit">Unit</label>
              <input
                type="text"
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                placeholder="Unit"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">
                City <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="City, village, town, etc"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="provState">
                Province/State <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="provState"
                name="provState"
                value={formData.provState}
                onChange={handleInputChange}
                placeholder="ON"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="postalZipCode">
                Postal/Zip Code <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                id="postalZipCode"
                name="postalZipCode"
                value={formData.postalZipCode}
                onChange={handleInputChange}
                placeholder="A1A 1A1"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="startDate">
              Start Date <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-actions">
            {isEditing && (
              <button type="button" className="cancel-button" onClick={handleCancelEdit}>
                Cancel
              </button>
            )}
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Saving...' : (isEditing ? 'Update Garage Sale' : 'Register Garage Sale')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegisterGarageSale;
