import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../pages/Login.css';

const LoginRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleGoogleCallback } = useAuth();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Processing your login...');

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Debug the incoming URL
        console.log('=== LoginRedirect Page Loaded ===');
        console.log('Current location:', location);
        console.log('URL:', window.location.href);
        console.log('Search params:', location.search);
        console.log('Hash params:', location.hash);
        
        // Look for either code in search params or token in hash
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        
        if (code) {
          console.log('Authorization code found:', code);
          
          // Process the code
          await handleGoogleCallback(code);
          setStatus('Login successful! Redirecting...');
          setTimeout(() => navigate('/'), 1000);
        } else {
          console.error('No authorization code found in URL');
          setError('Authentication failed: No authorization code found');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (err) {
        console.error('Error in LoginRedirect:', err);
        setError(`Authentication error: ${err.message}`);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processAuth();
  }, [location, navigate, handleGoogleCallback]);

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Google Sign-In</h2>
        {error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div>
            <p>{status}</p>
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginRedirect;
