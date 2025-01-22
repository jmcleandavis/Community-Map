import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      setIsAuthenticated(true);
      // You might want to verify the session here
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      setIsAuthenticated(true);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('sessionId');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('sessionId');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
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
