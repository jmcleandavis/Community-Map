import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CommunitySalesAdmin.css';

const CommunitySalesAdmin = () => {
  const navigate = useNavigate();
  // Mock data for demonstration purposes
  const [communitySales, setCommunitySales] = useState([
    {
      id: '1',
      name: 'Spring Community Sale',
      description: 'Annual spring community garage sale event',
      date: '2025-04-15',
      location: 'Downtown Community Center'
    },
    {
      id: '2',
      name: 'Summer Neighborhood Sale',
      description: 'Neighborhood-wide summer garage sale event',
      date: '2025-07-10',
      location: 'Oakwood Neighborhood'
    },
    {
      id: '3',
      name: 'Fall Cleanup Sale',
      description: 'Get rid of unused items before winter',
      date: '2025-10-05',
      location: 'Riverside Community Park'
    },
    {
      id: 'd31a9eec-0dda-469d-8565-692ef9ad55c2',
      name: 'Bay Ridges Community Sales Day',
      description: 'Annual community garage sale event for the Bay Ridges neighborhood. Residents can participate and sell items from their homes.',
      date: '2025-06-22',
      location: 'Bay Ridges Community, Pickering'
    }
  ]);

  const [selectedSales, setSelectedSales] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    location: ''
  });

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle adding a new community sale
  const handleAddNew = () => {
    setEditingSale(null);
    setFormData({
      name: '',
      description: '',
      date: '',
      location: ''
    });
    setIsAddingNew(true);
  };

  // Handle editing a community sale
  const handleEdit = (sale) => {
    setIsAddingNew(false);
    setEditingSale(sale);
    setFormData({
      name: sale.name,
      description: sale.description,
      date: sale.date || '',
      location: sale.location || ''
    });
    // Scroll to the top of the page to make the form visible
    window.scrollTo(0, 0);
  };

  // Handle canceling edit/add
  const handleCancelEdit = () => {
    setEditingSale(null);
    setFormData({
      name: '',
      description: '',
      date: '',
      location: ''
    });
    setIsAddingNew(false);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingSale) {
      // Update existing community sale
      setCommunitySales(prev => 
        prev.map(sale => 
          sale.id === editingSale.id 
            ? { ...sale, ...formData } 
            : sale
        )
      );
    } else {
      // Create new community sale with a mock ID
      const newSale = {
        ...formData,
        id: Date.now().toString() // use timestamp as a mock ID
      };
      
      setCommunitySales(prev => [...prev, newSale]);
    }
    
    setIsAddingNew(false);
    setEditingSale(null);
    setFormData({
      name: '',
      description: '',
      date: '',
      location: ''
    });
  };

  // Handle deleting a community sale
  const handleDelete = (saleId) => {
    if (window.confirm('Are you sure you want to delete this community sale?')) {
      setCommunitySales(prev => prev.filter(sale => sale.id !== saleId));
      
      // Also remove from selected if it was selected
      if (selectedSales.has(saleId)) {
        setSelectedSales(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(saleId);
          return newSelected;
        });
      }
    }
  };

  // Handle checkbox selection
  const handleCheckboxChange = (saleId) => {
    setSelectedSales(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(saleId)) {
        newSelected.delete(saleId);
      } else {
        newSelected.add(saleId);
      }
      return newSelected;
    });
  };

  // Handle deselecting all
  const handleDeselectAll = () => {
    setSelectedSales(new Set());
  };

  // Handle deleting selected community sales
  const handleDeleteSelected = () => {
    const selectedIds = Array.from(selectedSales);
    
    if (selectedIds.length === 0) {
      alert('Please select community sales to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected community sales?`)) {
      setCommunitySales(prev => 
        prev.filter(sale => !selectedIds.includes(sale.id))
      );
      
      setSelectedSales(new Set());
    }
  };

  // Handle navigating to manage a specific community sale
  const handleManageSale = (sale) => {
    if (sale.id === 'd31a9eec-0dda-469d-8565-692ef9ad55c2') {
      // Only navigate to the garage sales admin page for Bay Ridges Community Sales
      navigate(`/admin/sales`);
    } else {
      // For other sales, show an alert instead of navigating
      alert(`Page not available for: ${sale.name}\nThis functionality is only implemented for Bay Ridges Community Sales Day.`);
    }
  };

  // Handle viewing a community sale on the map
  const handleViewOnMap = (sale) => {
    if (sale.id === 'd31a9eec-0dda-469d-8565-692ef9ad55c2') {
      // For Bay Ridges, navigate to the map with the specific community sale ID
      navigate(`/?communityId=${sale.id}`);
    } else {
      // For sample sales, show an alert
      alert(`Map view not available for: ${sale.name}\nThis functionality is only implemented for Bay Ridges Community Sales Day.`);
    }
  };

  // Filter community sales based on search term
  const filteredSales = communitySales.filter(sale => 
    (sale.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (sale.location || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sales-admin">
      <h1>Community Sales Administration</h1>
      
      <div className="user-info">
        <div className="user-name">Admin User</div>
        <div className="user-email">admin@example.com</div>
      </div>
      
      <div className="admin-controls">
        <button 
          className="add-new-button"
          onClick={handleAddNew}
          disabled={isAddingNew}
        >
          Add New Community Sale
        </button>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search by name, description, or location..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        {selectedSales.size > 0 && (
          <>
            <button 
              className="select-all-button"
              onClick={handleDeselectAll}
            >
              Deselect All
            </button>
            <button 
              className="delete-selected-button"
              onClick={handleDeleteSelected}
            >
              Delete Selected ({selectedSales.size})
            </button>
          </>
        )}
      </div>
      
      {(isAddingNew || editingSale) && (
        <form onSubmit={handleSubmit} className="sale-form">
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter community sale name..."
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter description..."
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              placeholder="Select date..."
            />
          </div>
          
          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Enter location..."
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-button">
              {editingSale ? 'Save Changes' : 'Create Community Sale'}
            </button>
            <button type="button" className="cancel-button" onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      )}
      
      {filteredSales.length === 0 ? (
        <div className="empty-state">
          <h3>No Community Sales Found</h3>
          <p>Start by creating a new community sale using the button above.</p>
          <button onClick={handleAddNew}>Add Community Sale</button>
        </div>
      ) : (
        <div className="sales-grid">
          {filteredSales.map(sale => (
            <div key={sale.id} className="sale-card">
              <div className="card-header">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={selectedSales.has(sale.id)}
                    onChange={() => handleCheckboxChange(sale.id)}
                  />
                  <span className="checkmark"></span>
                </label>
              </div>
              <h3>{sale.name}</h3>
              {sale.date && (
                <div className="card-date">
                  Date: {new Date(sale.date).toLocaleDateString()}
                </div>
              )}
              {sale.location && (
                <div className="card-location">
                  Location: {sale.location}
                </div>
              )}
              <div className="card-description">{sale.description}</div>
              <div className="card-actions">
                <div>
                  <button 
                    className="edit-button"
                    onClick={() => handleEdit(sale)}
                  >
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(sale.id)}
                  >
                    Delete
                  </button>
                </div>
                <button 
                  className="manage-button"
                  onClick={() => handleManageSale(sale)}
                >
                  Manage Garage Sales
                </button>
                <button 
                  className="view-on-map-button"
                  onClick={() => handleViewOnMap(sale)}
                >
                  View the Map
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunitySalesAdmin;
