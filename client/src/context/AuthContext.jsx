import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [sessionId, setSessionId] = useState(localStorage.getItem('sessionId') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userType, setUserType] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

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
        const storedUserInfo = localStorage.getItem('userInfo');
        if (storedUserId && storedUserType) {
          setUserId(storedUserId);
          setUserType(storedUserType);
          if (storedUserInfo) {
            setUserInfo(JSON.parse(storedUserInfo));
          }
        }
      }
    };

    loadSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.login(email, password);
      const { sessionId: newSessionId, userId: newUserId, userType: newUserType, userInfo: newUserInfo } = response.data;
      
      setIsAuthenticated(true);
      setUserId(newUserId);
      setUserType(newUserType);
      setUserInfo(newUserInfo);
      
      localStorage.setItem('sessionId', newSessionId);
      localStorage.setItem('userId', newUserId);
      localStorage.setItem('userType', newUserType);
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await api.register(email, password, name);
      const { sessionId: newSessionId, userId: newUserId, userType: newUserType, userInfo: newUserInfo } = response;
      
      setIsAuthenticated(true);
      setUserId(newUserId);
      setUserType(newUserType);
      setUserInfo(newUserInfo);
      
      localStorage.setItem('sessionId', newSessionId);
      localStorage.setItem('userId', newUserId);
      localStorage.setItem('userType', newUserType);
      localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
      
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
    localStorage.removeItem('sessionId');
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('userInfo');
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      userId,
      userType,
      userInfo,
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
