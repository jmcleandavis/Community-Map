import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      if (sessionId == null) {
        // get a session
        const session = await api.createSession();
        setSessionId(session.sessionID);
        localStorage.setItem('sessionId', session.sessionID);
      } else {
        setIsAuthenticated(true);
        const userRole = localStorage.getItem('userRole');
        setIsAdmin(userRole === 'admin');
        // Restore user data if available
        const userData = localStorage.getItem('userData');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    };

    loadSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      const { sessionId, userRole, userData } = response.data;
      
      setIsAuthenticated(true);
      setIsAdmin(userRole === 'admin');
      setUser(userData);
      
      localStorage.setItem('sessionId', sessionId);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('userData', JSON.stringify(userData));
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
