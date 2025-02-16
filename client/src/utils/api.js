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
    'app-key': import.meta.env.VITE_APP_API_KEY
  },
  withCredentials: false
});

// Auth API configuration
const authApi = axios.create({
  baseURL: 'https://br-auth-api-dev001-207215937730.us-central1.run.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_API_KEY
  }
});

// User Information API configuration
const userInformationApi = axios.create({
  baseURL: 'https://br-customer-mgmt-api-dev001-207215937730.us-central1.run.app/v1/getCustomerByEmail/EMAIL',
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_API_KEY
  }
});

// Add response interceptor to handle errors
const errorInterceptor = error => {
  console.error('API Error Details:', {
    url: error.config?.url,
    method: error.config?.method,
    headers: error.config?.headers,
    data: error.config?.data,
    status: error.response?.status,
    response: error.response?.data
  });
  return Promise.reject(error);
};

sessionApi.interceptors.response.use(response => response, errorInterceptor);
authApi.interceptors.response.use(response => response, errorInterceptor);
mapsApi.interceptors.response.use(response => response, errorInterceptor);
userInformationApi.interceptors.response.use(response => response, errorInterceptor);

// Add sessionId to request headers if available
const addSessionInterceptor = async (config) => {
  try {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers = {
        ...config.headers,
        'sessionId': sessionId
      };
    }
    return config;
  } catch (error) {
    console.error('Error in session interceptor:', error);
    return config;
  }
};

// Add request interceptors to automatically include sessionId
mapsApi.interceptors.request.use(addSessionInterceptor);
userInformationApi.interceptors.request.use(addSessionInterceptor);

// Create a new session
const createSession = async () => {
  try {
    console.log('Creating new session...');
    const response = await sessionApi.post('/createSession');
    console.log('Create session raw response:', response);
    
    if (!response.data) {
      throw new Error('No response data received from createSession');
    }

    // Handle the nested response structure
    const sessionData = response.data.data || response.data;
    
    if (!sessionData) {
      console.error('Invalid response structure:', response.data);
      throw new Error('No session data in response');
    }

    const sessionId = sessionData.sessionId || sessionData.sessionID;
    
    if (!sessionId) {
      console.error('Invalid session data structure:', sessionData);
      throw new Error('No sessionId in response data');
    }

    console.log('Session data:', sessionData);
    localStorage.setItem('sessionId', sessionId);
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
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
    console.log('API: Starting getAddresses call...');
    
    // Ensure we have a valid session
    console.log('API: Getting session ID...');
    await getSessionId(); // This will create or verify the session
    
    // Make the request - sessionId will be added by interceptor
    console.log('API: Making request to /getAddressList...');
    const response = await mapsApi.get('/getAddressList');
    
    console.log('API: Successful response from backend:', response);
    return response;
  } catch (error) {
    console.error('API Error in getAddresses:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    throw error;
  }
};

// Get user information by email
async function getUserInfo(email) {
  try {
    const response = await userInformationApi.get(email);
    return response.data;
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
}

// Authentication methods
const register = async (email, password, name) => {
  try {
    // First create a session
    const sessionResponse = await createSession();
    console.log('Created session for registration:', sessionResponse);
    
    // Then register with the session
    const response = await authApi.post('/createUser', {
      requesting_application: 'web-service',
      sessionId: sessionResponse,
      userData: {
        email,
        password,
        name,
        validLogin: false
      },
      sessionStart: new Date().toISOString(),
      userId: 'N/A'
    });
    
    console.log('Registration response:', response);
    
    if (response.data && response.data.sessionId) {
      localStorage.setItem('sessionId', response.data.sessionId);
      return response.data;
    }
    throw new Error('Invalid registration response');
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: JSON.parse(error.config?.data || '{}')
      }
    });
    if (error.response?.status === 404) {
      throw new Error('Registration endpoint not found. Please check the API configuration.');
    }
    throw new Error(error.response?.data?.message || 'Registration failed. Please try again.');
  }
};

const login = async (email, password) => {
  try {
    // First create a session
    const sessionId = await getSessionId();
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('type', 'EMAIL');

    const response = await authApi.post('/login', formData, {
      headers: {
        'sessionId': sessionId
      }
    });
    
    // Check if login was successful
    if (response.data === true) {
      // If login successful, fetch user information
      const userInfo = await getUserInfo(email);
      
      // Return the structured data needed by AuthContext
      return {
        data: {
          sessionId: sessionId,
          userId: userInfo.userId,
          userType: userInfo.userType,
          userInfo: userInfo // Include full user info
        }
      };
    }
    throw new Error('Invalid login response');
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }
    });
    if (error.response?.status === 404) {
      throw new Error('Login endpoint not found. Please check the API configuration.');
    }
    throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
  }
};

const logout = async () => {
  try {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      await authApi.post('/auth/logout', { 
        sessionId,
        application: 'web-service'
      });
      localStorage.removeItem('sessionId');
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Still remove the session ID even if the server call fails
    localStorage.removeItem('sessionId');
    throw error;
  }
};

// Add the custom methods to the api object
const api = {
  createSession,
  getSessionId,
  getAddresses,
  getUserInfo,
  register,
  login,
  logout,
  verifySession
};

export default api;
