import axios from 'axios';

// Track processed Google auth codes to prevent duplicate requests
const processedAuthCodes = new Set();

// Session API configuration
const sessionApi = axios.create({
  baseURL: import.meta.env.VITE_SESSION_API_URL || '/session-api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_SESSION_KEY
  }
});

// Maps API configuration
const mapsApi = axios.create({
  baseURL: import.meta.env.VITE_MAPS_API_URL || '/maps-api',
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
  baseURL: import.meta.env.VITE_MAPS_API_URL || '/auth-api', // Always use the proxy path
  timeout: 30000,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_API_KEY
  },
  withCredentials: false // Must be false to avoid CORS issues with wildcard response
});

// Create Customer/user API configuration
const createCustomerApi = axios.create({
  baseURL: import.meta.env.VITE_CUSTOMER_API_URL || '/customer-api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_SESSION_KEY
  }
});

// User Information API configuration
const userInformationApi = axios.create({
  baseURL: import.meta.env.VITE_CUSTOMER_API_URL ? `${import.meta.env.VITE_CUSTOMER_API_URL}/v1/getCustomerByEmail/EMAIL` : '/customer-api/v1/getCustomerByEmail/EMAIL',
  timeout: 30000,
  // withCredentials: true, //flagged with true when it should be false
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'app-name': 'web-service',
    'app-key': import.meta.env.VITE_APP_SESSION_KEY
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
    
    // Get the raw data
    let userData = response.data;
    
    // Normalize the user data to ensure consistent property names
    // This ensures that properties are accessible regardless of the API response format
    const normalizedUserData = {
      ...userData,
      // Ensure fName and lName are always available for the hamburger menu
      fName: userData.fName || userData.firstName || userData.given_name || '',
      lName: userData.lName || userData.lastName || userData.family_name || '',
      // Also keep firstName/lastName for backward compatibility
      firstName: userData.firstName || userData.fName || userData.given_name || '',
      lastName: userData.lastName || userData.lName || userData.family_name || '',
      // Ensure email is always available
      email: userData.email || email
    };
    
    console.log('Normalized user data:', normalizedUserData);
    return normalizedUserData;
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
    const sessionId = await getSessionId();
    console.log('Created/Retrieved session for login:', sessionId);
    
    // Create form data
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    formData.append('type', 'EMAIL');

    console.log('Sending login request with sessionId:', sessionId);
    
    // Create temporary headers with sessionId for this request
    const headers = { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'app-name': 'web-service',
      'app-key': import.meta.env.VITE_APP_API_KEY,
      'sessionId': sessionId
    };
    
    // Use fetch API as an alternative to axios
    const fetchResponse = await fetch('/auth-api/login', {
      method: 'POST',
      headers: headers,
      body: formData,
      credentials: 'omit' // Don't send cookies or HTTP auth
    });
    
    // Check if the response is successful
    if (!fetchResponse.ok) {
      console.error('Login failed with status:', fetchResponse.status);
      const errorText = await fetchResponse.text();
      console.error('Error response:', errorText);
      throw new Error(`Login failed with status ${fetchResponse.status}: ${errorText}`);
    }
    
    // Convert fetch response to a format similar to axios
    const responseData = await fetchResponse.text();
    let response;
    try {
      // Try to parse as JSON if possible
      response = { data: JSON.parse(responseData) };
    } catch (e) {
      // If not JSON, handle as boolean or text
      response = { data: responseData === 'true' };
    }
    
    console.log('Login response:', response);
    
    // Check if login was successful
    if (response.data === true || response.data.success === true) {
      console.log('Login successful, fetching user info');
      
      // Ensure we have email (the parameter passed to this function)
      if (!email) {
        console.error('Email is undefined during login process');
        throw new Error('Email is required for user information retrieval');
      }
      
      try {
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
      } catch (userInfoError) {
        console.error('Error fetching user info after successful login:', userInfoError);
        // Still return a successful login but with minimal user info
        return {
          data: {
            sessionId: sessionId,
            userId: email, // Use email as fallback userId if userInfo fetch fails
            userType: 'USER', // Default user type
            userInfo: { email, fName: '', lName: '' } // Minimal user info
          }
        };
      }
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

// Request password reset - send email to user
const requestPasswordReset = async (email) => {
  try {
    // Get or create session ID
    const sessionId = await getSessionId();
    console.log('Using session for password reset request:', sessionId);
    
    const response = await authApi.post('/sendResetEmail', { 
      userEmail: email
    }, {
      headers: {
        sessionId: sessionId
      }
    });
    console.log('Password reset email sent successfully');
    return response.data;
  } catch (error) {
    console.error('Password reset request error:', error);
    if (error.response && error.response.status === 404) {
      throw new Error('Password reset service unavailable. Please try again later.');
    }
    throw new Error(error.response?.data?.message || 'Failed to send password reset email. Please try again.');
  }
};

// Verify reset token - no longer needed as a separate function
// We'll use the token directly in resetPassword
const verifyResetToken = async (token) => {
  try {
    // Just return success since verification happens when resetting the password
    console.log('Token will be verified during password reset');
    return { valid: true };
  } catch (error) {
    console.error('Token verification error:', error);
    throw new Error('Failed to verify reset token. Please try again.');
  }
};

// Reset password with token
const resetPassword = async (token, newPassword, userEmail) => {
  try {
    // Get or create session ID
    const sessionId = await getSessionId();
    console.log('Using session for password reset:', sessionId);
    console.log('Headers being sent to the backend:', {
      sessionId: sessionId,
      token,
      userEmail,
      newPassword,
      appCode: 'app1234'//import.meta.env.VITE_APP_CODE || '6mful1WT8NOcQLTrYdHLskYSOL4hXQ5c'
    });
    
    const response = await authApi.patch('/resetPassword', { 
      token,
      userEmail,
      newPassword,
      appCode: 'app1234'//import.meta.env.VITE_APP_CODE || '6mful1WT8NOcQLTrYdHLskYSOL4hXQ5c'
    }, {
      headers: {
        sessionId: sessionId
      }
    });
    console.log('Server response from password reset:', response);
    console.log('Password reset successful');
    return response.data;
  } catch (error) {
    console.error('Password reset error:', error);
    if (error.response && error.response.status === 400) {
      throw new Error('Invalid token or password requirements not met. Please try again.');
    }
    throw new Error(error.response?.data?.message || 'Failed to reset password. Please try again.');
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
      // Google OAuth parameters
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_CLIENT_ID_PLACEHOLDER';
      const redirectUri = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/loginRedirect';
      const scope = 'email profile';
      // Use authorization code flow instead of implicit flow
      const responseType = 'code';
      
      
      // Construct the Google OAuth URL
      const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&response_type=${encodeURIComponent(responseType)}`;
      
      console.log('Redirecting to Google OAuth:', authUrl);
      
      // Redirect the user to Google login
      window.location.href = authUrl;
      
      return { success: true };
    } catch (error) {
      console.error('Error initiating Google login:', error);
      throw error;
    }
  },
  
  
  // Handle Google SSO callback
  handleGoogleCallback: async (code) => {
    try {
      // Check if this code has already been processed
      if (processedAuthCodes.has(code)) {
        console.log('This authorization code has already been processed, preventing duplicate request');
        // Return a success indicator without requiring email
        return { success: true, user: { email: 'cached_request' } };
      }
      
      // Mark this code as being processed
      processedAuthCodes.add(code);
      
      // Get or create session ID
      const sessionId = await getSessionId();
      console.log('Using session for Google SSO:', sessionId);
      
      // Send the authorization code to the backend
      console.log('🔐 Google authorization code received:', code);
      console.log('Sending auth code to backend for token exchange');
      
      const response = await authApi.post('/login', {
        token: code,
        redirectUri: import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/loginRedirect', // Must match the original redirect URI
        sessionId: sessionId,
        type: "SSO_G"
      }, {
        headers: {
          sessionId: sessionId,
          'app-name': 'web-service',
          'app-key': import.meta.env.VITE_APP_API_KEY
        }
      });
      
      // The backend should exchange the code for tokens and return user info
      console.log('Google authentication successful');
      
      if (!response.data || !response.data.success) {
        // If request fails, remove the code from processed set so it can be tried again
        processedAuthCodes.delete(code);
        throw new Error('Invalid response from Google authentication');
      }
      
      // Extract email from the response
      let email;
      if (typeof response.data.user === 'string') {
        email = response.data.user;
      } else if (response.data.user && response.data.user.email) {
        email = response.data.user.email;
      } else {
        email = response.data.email;
      }
      
      if (!email) {
        throw new Error('No email found in Google authentication response');
      }
      
      console.log('Retrieved email from SSO:', email);
      
      // Extract any available name information from the response
      let firstName = '';
      let lastName = '';
      
      if (response.data.user && typeof response.data.user !== 'string') {
        firstName = response.data.user.firstName || response.data.user.given_name || '';
        lastName = response.data.user.lastName || response.data.user.family_name || '';
      } else {
        firstName = response.data.firstName || response.data.given_name || '';
        lastName = response.data.lastName || response.data.family_name || '';
      }
      
      // Always make a separate call to get full user information from the backend
      let userData;
      try {
        // Fetch complete user information using the email
        console.log('Making separate backend call for complete user information...');
        userData = await getUserInfo(email); // This function already normalizes the data
        console.log('Complete user info retrieved successfully:', userData);
      } catch (userInfoError) {
        console.error('Failed to retrieve user info from backend:', userInfoError);
        
        // Create a comprehensive fallback user object
        userData = {
          // Required fields for display in UI
          email: email,
          fName: firstName,
          lName: lastName,
          firstName: firstName,
          lastName: lastName,
          // Extra fields that might be needed
          userId: `google-${email}`,
          userType: 'USER',
          id: `google-${email}`
        };
        
        console.log('Using fallback user data for hamburger menu display:', userData);
      }
      
      // Final verification to ensure required fields exist
      if (!userData.fName && (userData.firstName || firstName)) {
        userData.fName = userData.firstName || firstName;
      }
      
      if (!userData.lName && (userData.lastName || lastName)) {
        userData.lName = userData.lastName || lastName;
      }
      
      if (!userData.email) {
        userData.email = email;
      }
      
      console.log('Final normalized user data for UI display:', userData);
      
      return {
        success: true,
        user: userData
      };
    } catch (error) {
      console.error('Error handling Google callback:', error);
      if (error.response && error.response.status === 400) {
        throw new Error('Invalid authorization code. Please try logging in again.');
      } else if (error.response && error.response.status === 404) {
        throw new Error('Google login service unavailable. Please try again later.');
      }
      throw new Error(error.response?.data?.message || 'Failed to authenticate with Google. Please try again.');
    }
  },
  
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};

export default api;
