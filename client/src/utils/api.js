import axios from 'axios';

// Session API configuration
const sessionApi = axios.create({
  baseURL: 'https://br-session-api-dev001-207215937730.us-central1.run.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_SESSION_KEY
  }
});

// Maps API configuration
const mapsApi = axios.create({
  baseURL: 'https://br-maps-mgt-api-dev001-207215937730.us-central1.run.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'app-key': import.meta.env.VITE_APP_API_MAP_KEY
  }
});

// Add response interceptor to handle errors
const errorInterceptor = error => {
  console.error('API Error:', {
    message: error.message,
    code: error.code,
    response: error.response?.data,
    timeout: error.config?.timeout
  });
  return Promise.reject(error);
};

sessionApi.interceptors.response.use(response => response, errorInterceptor);
mapsApi.interceptors.response.use(response => response, errorInterceptor);

// Create a new session
const createSession = async () => {
  try {
    console.log('Creating new session...');
    const response = await sessionApi.post('/createSession');
    console.log('Create session response:', response);
    if (!response.data || !response.data.sessionId) {
      throw new Error('No sessionId received from createSession');
    }
    const sessionId = response.data.sessionId;
    console.log('New session created:', sessionId);
    localStorage.setItem('sessionId', sessionId);
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

// Verify session is valid
const verifySession = async (sessionId) => {
  try {
    console.log('Verifying session:', sessionId);
    const response = await sessionApi.get(`/getSessionDetailsById/${sessionId}`);
    console.log('Session verification response:', response);
    return true;
  } catch (error) {
    console.error('Session verification failed:', error);
    return false;
  }
};

// Get or create session ID
const getSessionId = async () => {
  const storedSessionId = localStorage.getItem('sessionId');
  if (storedSessionId) {
    console.log('Found stored session:', storedSessionId);
    const isValid = await verifySession(storedSessionId);
    if (isValid) {
      console.log('Stored session is valid');
      return storedSessionId;
    }
    console.log('Stored session is invalid, creating new one...');
    localStorage.removeItem('sessionId');
  }
  return await createSession();
};

// Custom get method for addresses
const getAddresses = async () => {
  try {
    console.log('Fetching addresses from backend...');
    
    // Ensure we have a valid session
    const sessionId = await getSessionId();
    console.log('Using sessionId for request:', sessionId);
    
    // Add sessionId to headers
    const response = await mapsApi.get('/getAddressList', {
      headers: {
        'sessionId': sessionId
      }
    });
    
    console.log('Response from backend:', response.data);
    return response;
  } catch (error) {
    console.error('Error fetching addresses:', error);
    throw error;
  }
};

// Add the custom methods to the api object
const api = {
  createSession,
  getSessionId,
  verifySession,
  getAddresses
};

export default api;
