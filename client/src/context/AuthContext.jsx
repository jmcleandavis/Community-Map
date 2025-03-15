import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || null);

  useEffect(() => {
    const loadSession = async () => {
      // Restore user data if available
      const storedUserId = localStorage.getItem('userId');
      const storedUserType = localStorage.getItem('userType');
      const storedUserInfo = localStorage.getItem('userInfo');
      const storedUserEmail = localStorage.getItem('userEmail');

      if (storedUserId) {
        // If we have a userId, user is logged in
        setIsAuthenticated(true);
        setUserId(storedUserId);
        if (storedUserType) {
          setUserType(storedUserType);
        }
        if (storedUserInfo) {
          setUserInfo(JSON.parse(storedUserInfo));
        }
        if (storedUserEmail) {
          setUserEmail(storedUserEmail);
        }
      } else {
        // No userId means not logged in
        setIsAuthenticated(false);
        setUserId(null);
        setUserType(null);
        setUserInfo(null);
        setUserEmail(null);
      }

      // Handle session separately
      if (sessionId == null) {
        // get a session if we don't have one
        const session = await api.createSession();
        setSessionId(session.sessionId);
        localStorage.setItem('sessionId', session.sessionId);
      }
    };

    loadSession();
  }, []);

  const login = async (userEmail, password) => {
    try {
      const response = await api.login(userEmail, password);
      const { sessionId: newSessionId, userId: newUserId, userType: newUserType, userInfo: newUserInfo } = response.data;
      
      setIsAuthenticated(true);
      setUserId(newUserId);
      setUserType(newUserType);
      setUserInfo(newUserInfo);
      setUserEmail(userEmail);
      
      localStorage.setItem('sessionId', newSessionId);
      localStorage.setItem('userId', newUserId);
      localStorage.setItem('userType', newUserType);
      localStorage.setItem('userEmail', userEmail);
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
      return response;
    } catch (error) {
      throw error;
    }
  };

  const googleLogin = async () => {
    try {
      // Just call the API method - it handles the redirect directly
      await api.googleLogin();
      // No need to redirect here as it's handled in the API
    } catch (error) {
      console.error('Error in googleLogin:', error);
      throw error;
    }
  };

  const handleGoogleCallback = async (token) => {
    try {
      console.log('AuthContext: Processing Google callback with token');
      const response = await api.handleGoogleCallback(token);
      
      if (response && response.success && response.user) {
        // For now, just log the user in with the data we have
        // In production, this would use real data from the backend
        console.log('Login successful with user:', response.user);
        
        const mockUserData = {
          userId: 'google-user-123',
          userType: 'USER',
          userInfo: response.user,
          email: response.user.email
        };
        
        setIsAuthenticated(true);
        setUserId(mockUserData.userId);
        setUserType(mockUserData.userType);
        setUserInfo(mockUserData.userInfo);
        setUserEmail(mockUserData.email);
        
        localStorage.setItem('userId', mockUserData.userId);
        localStorage.setItem('userType', mockUserData.userType);
        localStorage.setItem('userEmail', mockUserData.email);
        localStorage.setItem('userInfo', JSON.stringify(mockUserData.userInfo));
        
        return { success: true, data: mockUserData };
      } else {
        throw new Error('Invalid response from Google callback');
      }
    } catch (error) {
      console.error('Error in handleGoogleCallback:', error);
      throw error;
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await api.requestPasswordReset(email);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const verifyResetToken = async (token) => {
    try {
      const response = await api.verifyResetToken(token);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      const response = await api.resetPassword(token, newPassword);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userEmail, password, firstName, lastName) => {
    try {
      const response = await api.register(userEmail, password, firstName, lastName);
      
      // Create user info from registration data
      const userInfo = {
        email: userEmail,
        firstName: firstName,
        lastName: lastName
      };

      setIsAuthenticated(true);
      setUserInfo(userInfo);
      setUserEmail(userEmail);
      
      // Store user information
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      localStorage.setItem('userEmail', userEmail);
      
      // After registration, automatically log in the user
      await login(userEmail, password);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setUserType(null);
    setUserInfo(null);
    setUserEmail(null);
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('userEmail');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        userInfo,
        userEmail,
        userId,
        userType,
        login,
        logout,
        register,
        googleLogin,
        handleGoogleCallback,
        requestPasswordReset,
        verifyResetToken,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
