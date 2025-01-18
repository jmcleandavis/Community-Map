import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 30000,  // Default timeout of 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Calculate timeout based on number of addresses
// Base timeout of 30 seconds + 250ms per address
const calculateTimeout = (addressCount) => {
  const baseTimeout = 30000;  // 30 seconds base
  const timePerAddress = 250; // 250ms per address
  return baseTimeout + (addressCount * timePerAddress);
};

// Custom get method for addresses with dynamic timeout
const getAddressesWithDynamicTimeout = async () => {
  try {
    // First, get the count of addresses
    const countResponse = await api.get('/api/addresses/count');
    const addressCount = countResponse.data.count;
    
    // Calculate appropriate timeout
    const dynamicTimeout = calculateTimeout(addressCount);
    console.log(`Setting timeout to ${dynamicTimeout}ms for ${addressCount} addresses`);
    
    // Make the main request with dynamic timeout
    return await axios.get(`${api.defaults.baseURL}/api/addresses`, {
      ...api.defaults,
      timeout: dynamicTimeout
    });
  } catch (error) {
    console.error('Error in getAddressesWithDynamicTimeout:', error);
    throw error;
  }
};

// Add the custom method to the api object
api.getAddressesWithDynamicTimeout = getAddressesWithDynamicTimeout;

export default api;
