import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in on component mount
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      setIsAuthenticated(true);
      // You might want to verify the session here
      const userRole = localStorage.getItem('userRole');
      setIsAdmin(userRole === 'admin');
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      setIsAuthenticated(true);
      setUser(response.user);
      // Check if user is admin from response
      const isAdminUser = response.user?.role === 'admin';
      setIsAdmin(isAdminUser);
      localStorage.setItem('userRole', isAdminUser ? 'admin' : 'user');
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userRole');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userRole');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, user, login, logout }}>
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
