import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      setIsAuthenticated(true);
      const userRole = localStorage.getItem('userRole');
      setIsAdmin(userRole === 'admin');
      // Restore user data if available
      const userData = localStorage.getItem('userData');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      console.log('Login response:', response); 
      setIsAuthenticated(true);
      
      // Create user object from response data
      const userData = {
        email: response.userID,
        role: response.userType || 'user'
      };
      console.log('Created user data:', userData); 
      
      setUser(userData);
      
      // Check if user is admin
      const isAdminUser = response.userType === 'admin'; 
      console.log('Is admin user?', { userType: response.userType, isAdmin: isAdminUser }); 
      
      setIsAdmin(isAdminUser);
      localStorage.setItem('userRole', isAdminUser ? 'admin' : 'user');
      localStorage.setItem('userData', JSON.stringify(userData));
      return response;
    } catch (error) {
      throw error;
    }
  };o?<Mncx22QN4>fpD

  const logout = async () => {
    try {
      await api.logout();
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUser(null);
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userData');
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

export default AuthContext;
