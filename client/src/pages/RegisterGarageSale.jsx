import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './RegisterGarageSale.css'; // Use dedicated CSS for this component
import api from '../utils/api';

const RegisterGarageSale = () => {
  const navigate = useNavigate();
  const { isAuthenticated, userInfo } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    streetNum: '',
    street: '',
    city: '',
    provState: '',
    postalZipCode: '',
    highlightedItems: '',
    startDate: '',
    endDate: ''
  });
  
  // Additional state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingSale, setExistingSale] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

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
            city: sale.address?.city || '',
            provState: sale.address?.provState || '',
            postalZipCode: sale.address?.postalZipCode || '',
            highlightedItems: Array.isArray(sale.highlightedItems) 
              ? sale.highlightedItems.join(', ') 
              : sale.highlightedItems || '',
            startDate: sale.startDate || '',
            endDate: sale.endDate || ''
          });
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
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format data for API
      const saleData = {
        name: formData.name,
        description: formData.description,
        address: {
          streetNum: formData.streetNum,
          street: formData.street,
          city: formData.city,
          provState: formData.provState,
          postalZipCode: formData.postalZipCode
        },
        highlightedItems: formData.highlightedItems.split(',').map(item => item.trim()),
        startDate: formData.startDate,
        endDate: formData.endDate,
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
          city: '',
          provState: '',
          postalZipCode: '',
          highlightedItems: '',
          startDate: '',
          endDate: ''
        });
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
        streetNum: existingSale.address?.streetNum || '',
        street: existingSale.address?.street || '',
        city: existingSale.address?.city || '',
        provState: existingSale.address?.provState || '',
        postalZipCode: existingSale.address?.postalZipCode || '',
        highlightedItems: Array.isArray(existingSale.highlightedItems) 
          ? existingSale.highlightedItems.join(', ') 
          : existingSale.highlightedItems || '',
        startDate: existingSale.startDate || '',
        endDate: existingSale.endDate || ''
      });
    }
    setIsEditing(false);
    setError(null);
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
                      {existingSale.address.streetNum} {existingSale.address.street}
                    </p>
                    <p className="address-line">
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
              required
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
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="streetNum">Street Number</label>
              <input
                type="text"
                id="streetNum"
                name="streetNum"
                value={formData.streetNum}
                onChange={handleInputChange}
                placeholder="123"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="street">Street Name</label>
              <input
                type="text"
                id="street"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                placeholder="Main St"
                required
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Cityville"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="provState">Province/State</label>
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
              <label htmlFor="postalZipCode">Postal/Zip Code</label>
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
            <label htmlFor="highlightedItems">Featured Items (comma separated)</label>
            <input
              type="text"
              id="highlightedItems"
              name="highlightedItems"
              value={formData.highlightedItems}
              onChange={handleInputChange}
              placeholder="Furniture, Electronics, Toys"
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
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
                required
              />
            </div>
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
