import axios from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: 'http://localhost:3001',
  timeout: 30000,  // Default timeout of 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      timeout: error.config?.timeout
    });
    return Promise.reject(error);
  }
);

// Calculate timeout based on number of addresses
// Base timeout of 60 seconds + 500ms per address
const calculateTimeout = (addressCount) => {
  const baseTimeout = 60000;  // 60 seconds base
  const timePerAddress = 500; // 500ms per address
  const timeout = baseTimeout + (addressCount * timePerAddress);
  console.log(`Calculated timeout: ${timeout}ms for ${addressCount} addresses`);
  return timeout;
};

// Custom get method for addresses with dynamic timeout
const getAddressesWithDynamicTimeout = async () => {
  try {
    // First, try to get the count of addresses
    console.log('Fetching address count...');
    const countResponse = await api.get('/api/addresses/count');
    const addressCount = countResponse.data.count;
    
    // Calculate appropriate timeout
    const dynamicTimeout = calculateTimeout(addressCount);
    console.log(`Setting timeout to ${dynamicTimeout}ms for ${addressCount} addresses`);
    
    // Make the main request with dynamic timeout
    return await axios.get(`${api.defaults.baseURL}/api/addresses`, {
      ...api.defaults,
      timeout: dynamicTimeout,
      headers: api.defaults.headers
    });
  } catch (error) {
    if (error.response?.status === 404) {
      // If count endpoint doesn't exist, use a generous default timeout
      console.log('Count endpoint not found, using default timeout of 60 seconds');
      return await axios.get(`${api.defaults.baseURL}/api/addresses`, {
        ...api.defaults,
        timeout: 60000, // 60 seconds
        headers: api.defaults.headers
      });
    }
    console.error('Error in getAddressesWithDynamicTimeout:', error);
    throw error;
  }
};

// Add the custom method to the api object
api.getAddressesWithDynamicTimeout = getAddressesWithDynamicTimeout;

export default api;
