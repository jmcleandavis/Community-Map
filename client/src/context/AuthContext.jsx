import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const loadSession = async () => {
      if (sessionId == null) {
        // get a session
        const session = await api.createSession();
        setSessionId(session.sessionID);
        localStorage.setItem('sessionId', session.sessionID);
      } else {
        setIsAuthenticated(true);
        // Restore user data if available
        const storedUserId = localStorage.getItem('userId');
        const storedUserType = localStorage.getItem('userType');
        if (storedUserId && storedUserType) {
          setUserId(storedUserId);
          setUserType(storedUserType);
        }
      }
    };

    loadSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      const { sessionId: newSessionId, userId: newUserId, userType: newUserType } = response.data;
      
      setIsAuthenticated(true);
      setUserId(newUserId);
      setUserType(newUserType);
      
      localStorage.setItem('sessionId', newSessionId);
      localStorage.setItem('userId', newUserId);
      localStorage.setItem('userType', newUserType);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await api.register(email, password, name);
      const { sessionId: newSessionId, userId: newUserId, userType: newUserType } = response;
      
      setIsAuthenticated(true);
      setUserId(newUserId);
      setUserType(newUserType);
      
      localStorage.setItem('sessionId', newSessionId);
      localStorage.setItem('userId', newUserId);
      localStorage.setItem('userType', newUserType);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setUserType(null);
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userId,
      userType,
      login,
      logout,
      register,
      isAdmin: userType === 'admin'
    }}>
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
