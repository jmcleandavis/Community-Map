import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PasswordReset.css';

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
    const searchParams = new URLSearchParams(location.search);
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

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
      setEmail(emailParam);
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

    if (!email) {
      setMessage({ type: 'error', text: 'Email address is required.' });
      return;
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
      console.error('Password reset error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'An error occurred during password reset. Please try again or request a new reset link.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="password-reset-container">
      <div className="password-reset-card">
        <h2>Reset Your Password</h2>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {isTokenValid && message.type !== 'success' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="email-display">{email}</div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <small className="password-requirements">
                Password must be at least 8 characters with at least one uppercase letter, 
                one lowercase letter, one number, and one special character.
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="reset-password-button"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        
        <div className="links">
          <a href="/login" className="login-link">Return to Login</a>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;
