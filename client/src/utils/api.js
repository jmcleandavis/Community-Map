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
    'app-key': import.meta.env.VITE_APP_SESSION_KEY,
    'app-name': 'web-service'
  },
  withCredentials: false
});

// Auth (Logging in) API configuration
const authApi = axios.create({
  baseURL: 'https://br-auth-api-dev001-207215937730.us-central1.run.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_SESSION_KEY
  }
});

// Create Customer/user API configuration
const createCustomerApi = axios.create({
  baseURL: 'https://br-customer-mgmt-api-dev001-207215937730.us-central1.run.app',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_SESSION_KEY
  }
});

// User Information API configuration
const userInformationApi = axios.create({
  baseURL: 'https://br-customer-mgmt-api-dev001-207215937730.us-central1.run.app/v1/getCustomerByEmail/EMAIL',
  timeout: 30000,
  // withCredentials: true, //flagged with true when it should be false
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_SESSION_KEY //used incorrect key
  }
});

// Add response interceptor to handle errors
const errorInterceptor = error => {
  console.error('🔴 API Error Details:', {
    // Request details
    request: {
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL,
      headers: {
        ...error.config?.headers,
        'app-key': error.config?.headers['app-key'] ? '[PRESENT]' : '[MISSING]'
      },
      data: error.config?.data
    },
    // Response details
    response: {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    },
    // Error specific details
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
  
  // Log the request headers that were actually sent
  console.log('📨 Request Headers:', {
    contentType: error.config?.headers['Content-Type'],
    appName: error.config?.headers['app-name'],
    appKey: error.config?.headers['app-key'] ? '[PRESENT]' : '[MISSING]',
    sessionId: error.config?.headers['sessionId']
  });
  
  return Promise.reject(error);
};

// Add request interceptor to log headers
const requestInterceptor = async config => {
  const currentSessionId = await sessionStorage.getItem('sessionId');
  console.log('Current session ID before request:', currentSessionId);
  
  // Ensure headers object exists
  config.headers = config.headers || {};
  
  // Add session ID if it exists
  if (currentSessionId) {
    config.headers['sessionId'] = currentSessionId;
    console.log('Added session ID to request headers');
  } else {
    console.log('No session ID available for request');
  }
  
  console.log('Final request config:', {
    url: config.url,
    method: config.method,
    headers: {
      contentType: config.headers['Content-Type'],
      appName: config.headers['app-name'],
      appKey: config.headers['app-key'] ? '[PRESENT]' : '[MISSING]',
      sessionId: config.headers['sessionId']
    }
  });
  
  return config;
};

sessionApi.interceptors.response.use(response => response, errorInterceptor);
authApi.interceptors.response.use(response => response, errorInterceptor);
mapsApi.interceptors.response.use(response => response, errorInterceptor);
userInformationApi.interceptors.response.use(response => response, errorInterceptor);

authApi.interceptors.request.use(requestInterceptor);
userInformationApi.interceptors.request.use(requestInterceptor);
mapsApi.interceptors.request.use(requestInterceptor);

// Create a new session
const createSession = async () => {
  try {
    console.log('Creating new session...');
    console.log('Previous sessionId in localStorage:', localStorage.getItem('sessionId'));
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

    const sessionId = sessionData.sessionId || sessionData.sessionID; //updated the OR to include ID rahter than Id again (was duplicated)
    
    if (!sessionId) {
      console.error('Invalid session data structure:', sessionData);
      throw new Error('No sessionId in response data');
    }

    console.log('New session data:', sessionData);
    console.log('Setting new sessionId in localStorage:', sessionId);
    sessionStorage.setItem('sessionId', sessionId);
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
  const storedSessionId = sessionStorage.getItem('sessionId');
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
    const response = await mapsApi.get('/v1/getAddressByCommunity/d31a9eec-0dda-469d-8565-692ef9ad55c2');
    
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
    console.log('Getting user info for email:', email);
    
    // Ensure we have a valid session
    const sessionId = await getSessionId();
    console.log('Using session ID for user info request:', sessionId);
    
    // Make the request
    console.log('Making user info request...');
    const response = await userInformationApi.get(email);
    console.log('User info response:', response);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
}

// Create a new garage sale
const createGarageSale = async (addressData, description, name, highlightedItems) => {
  try {
    const currentSessionId = await getSessionId();
    const response = await mapsApi.post('/v1/createAddress', {
      address: {
        postalZipCode: addressData.postalCode || "",
        street: addressData.street || "",
        streetNum: addressData.streetNumber || "",
        city: addressData.city || "",
        provState: addressData.state || "",
        unit: addressData.unit || ""
      },
      description: description,
      highlightedItems: highlightedItems || [],
      name: name || "Garage Sale",
      community: "d31a9eec-0dda-469d-8565-692ef9ad55c2"
    }, {
      headers: {
        'sessionId': currentSessionId
      }
    });
    return response.data;
  } catch (error) {
    console.error('Create garage sale error:', error);
    if (error.response?.data?.code === 'ERR_MAPS001' && 
        error.response?.data?.errorMsg === 'Existing Address') {
      throw new Error('A garage sale already exists at this address');
    }
    throw error;
  }
};

// Delete a garage sale
const deleteGarageSale = async (saleIds) => {
  try {
    const currentSessionId = await getSessionId();
    
    // Handle both single ID and array of IDs
    const idsToDelete = Array.isArray(saleIds) ? saleIds : [saleIds];
    
    console.log('API: Deleting garage sales with IDs:', idsToDelete);
    
    const response = await mapsApi.delete('/v1/deleteAddress', {
      headers: {
        'sessionId': currentSessionId,
        'Content-Type': 'application/json'
      },
      data: idsToDelete
    });
    
    console.log('API: Delete response:', response);
    return response.data;
  } catch (error) {
    console.error('Delete garage sale error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    throw error;
  }
};

// Update a garage sale
const updateGarageSale = async (saleId, updateData) => {
  try {
    const sessionId = await getSessionId();
    
    const response = await mapsApi.patch(`/v1/updateAddress/${saleId}`, updateData, {
      headers: {
        'sessionId': sessionId
      }
    });
    
    console.log('Updated garage sale:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error updating garage sale:', error);
    throw error;
  }
};

// Authentication methods
const register = async (userEmail, password, firstName, lastName) => {
  try {
    // First create a session
    const sessionResponse = await createSession();
    console.log('Current session ID before request:', sessionResponse);
    
    // Prepare the request body to match the exact format from curl
    const requestBody = {
      fName: firstName,
      lName: lastName,
      userEmail: userEmail,
      password: password,
      regType: "MANUAL",
      userType: "USER"
    };

    // Log complete request details
    console.log('Registration Request Details:', {
      method: 'POST',
      url: createCustomerApi.defaults.baseURL + '/v1/createCustomer',
      headers: {
        ...createCustomerApi.defaults.headers,
        'sessionId': sessionResponse
      },
      body: requestBody
    });

    // Make the registration request
    try {
      const response = await createCustomerApi.post('/v1/createCustomer', requestBody, {
        headers: {
          'sessionId': sessionResponse
        }
      });
    
      console.log('Registration Response Details:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      if (response.status === 200) {
        // Store sessionId if it exists in the response
        if (response.data?.sessionId) {
          localStorage.setItem('sessionId', response.data.sessionId);
        }
        return response.data;
      }
    } catch (error) {
      console.error('Registration error:', error);

      if (error.response?.status === 400) {
        // display a modal with the error message
        throw new Error(error.response?.data?.errorMsg);
      }

      throw error;
    }
    throw new Error('Registration failed: ' + response.statusText);
  } catch (error) {
    console.error('Registration Error Details:', {
      name: error.name,
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      responseData: error.response?.data,
      request: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data
      }
    });
    throw error;
  }
};

const login = async (email, password) => {
  try {
    // First ensure we have a valid session
      // const sessionId = await createSession();
      const sessionId = await getSessionId();
    console.log('Created/Retrieved session for login:', sessionId);
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('type', 'EMAIL');

    console.log('Sending login request with sessionId:', sessionId);
    const response = await authApi.post('/login', formData);
    
    // Check if login was successful
    if (response.data === true) {
      console.log('Login successful, fetching user info');
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
      statusText: error.response?.statusText,
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
    // if response status is 401 throw error "please check credentials"
    throw new Error(error.response?.data?.message || 'Login failed. Please check your credentials.');
    // otherwise
    // throw error "Server is down. Please try again."
  }
};

const logout = async () => {
  try {
    const sessionId = sessionStorage.getItem('sessionId');
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
  verifySession,
  getAddresses,
  getUserInfo,
  createGarageSale,
  deleteGarageSale,
  updateGarageSale,
  register,
  login,
  logout,
  
  // Google SSO login
  googleLogin: async () => {
    try {
      const response = await authApi.get('/auth/google');
      return response.data;
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },
  
  // Handle Google SSO callback
  handleGoogleCallback: async (token) => {
    try {
      const response = await authApi.post('/auth/google/callback', { token });
      return response.data;
    } catch (error) {
      console.error('Google callback error:', error);
      throw error;
    }
  }
};

export default api;
