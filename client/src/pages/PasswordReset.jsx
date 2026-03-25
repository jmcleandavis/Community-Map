import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  TextField as MuiTextField,
  Stack
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import './PasswordReset.css';
import { logger } from '../utils/logger';

const PasswordReset = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isTokenValid, setIsTokenValid] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword } = useAuth();

  useEffect(() => {
    // Extract token and email from URL parameters
    logger.log('[PasswordReset] URL search:', location.search);
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    logger.log('[PasswordReset] URL params extracted - token:', tokenParam ? 'exists' : 'missing', 'email:', emailParam);

    if (tokenParam) {
      setToken(tokenParam);
      // We could verify the token here, but we'll verify it at submission time
      setIsTokenValid(true); // Assume token is valid to show the form
    } else {
      setMessage({ 
        type: 'error', 
        text: 'Invalid or missing reset token. Please request a new password reset link.' 
      });
    }

    if (emailParam) {
      logger.log('[PasswordReset] Setting email from URL param:', emailParam);
      setEmail(emailParam);
    } else if (tokenParam) {
      // Try to extract email from token immediately
      try {
        logger.log('[PasswordReset] Attempting to extract email from token');
        const tokenParts = tokenParam.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          logger.log('[PasswordReset] Token payload:', payload);
          if (payload.email) {
            logger.log('[PasswordReset] Found email in token:', payload.email);
            setEmail(payload.email);
          }
        }
      } catch (error) {
        logger.error('[PasswordReset] Error extracting email from token:', error);
      }
    }
  }, [location]);

  const validatePassword = (password) => {
    // Password should be at least 8 characters with at least one uppercase letter, 
    // one lowercase letter, one number, and one special character
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset any previous messages
    setMessage({ type: '', text: '' });
    
    // Validation checks
    if (!token) {
      setMessage({ type: 'error', text: 'Missing reset token. Please request a new password reset link.' });
      return;
    }
    
    // Make sure we extract email from token if it's not provided as a parameter
    if (!email) {
      try {
        // Extract email from token (assuming JWT format)
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.email) {
            setEmail(payload.email);
          } else {
            setMessage({ type: 'error', text: 'Could not retrieve email from reset token. Please contact support.' });
            return;
          }
        }
      } catch (error) {
        logger.error('[PasswordReset] Error parsing token:', error);
        setMessage({ type: 'error', text: 'Invalid token format. Please request a new password reset link.' });
        return;
      }
    }

    if (!validatePassword(password)) {
      setMessage({ 
        type: 'error', 
        text: 'Password must be at least 8 characters with at least one uppercase letter, one lowercase letter, one number, and one special character.' 
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    try {
      setIsLoading(true);
      logger.warn('[PasswordReset] TOKEN: ', token);
      await resetPassword(token, password, email);
      setMessage({ 
        type: 'success', 
        text: 'Your password has been reset successfully. You will be redirected to the login page shortly.' 
      });
      
      // Redirect to login page after successful reset
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      logger.error('[PasswordReset] Password reset error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'An error occurred during password reset. Please try again or request a new reset link.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  logger.log('[PasswordReset] Rendering with email:', email);
  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      <Paper variant="outlined" sx={{ p: 4 }}>
        <Typography variant="h2" gutterBottom>
          Reset Your Password
        </Typography>
        
        {message.text && (
          <Alert severity={message.type === 'success' ? 'success' : 'error'} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        {isTokenValid && message.type !== 'success' && (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <div className="form-group">
                <Typography component="label" variant="body2" display="block" sx={{ mb: 0.5 }}>
                  Email Address
                </Typography>
                <div className="email-display">{email || 'No email available'}</div>
              </div>
              
              <div className="form-group">
                <MuiTextField
                  type="password"
                  id="password"
                  label="New Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                />
                <Typography variant="caption" component="p" className="password-requirements" sx={{ mt: 1 }}>
                  Password must be at least 8 characters with at least one uppercase letter, 
                  one lowercase letter, one number, and one special character.
                </Typography>
              </div>
              
              <div className="form-group">
                <MuiTextField
                  type="password"
                  id="confirmPassword"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  fullWidth
                />
              </div>
              
              <Button 
                type="submit" 
                variant="contained"
                disabled={isLoading}
                fullWidth
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={18} sx={{ mr: 1 }} color="inherit" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </Stack>
          </form>
        )}
        
        <div className="links">
          <a href="/login" className="login-link">Return to Login</a>
        </div>
      </Paper>
    </Box>
  );
};

export default PasswordReset;
