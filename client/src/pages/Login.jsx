import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, googleLogin, handleGoogleCallback, requestPasswordReset, verifyResetToken, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for Google auth callback or password reset token
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get('code'); // Google returns 'code' not 'token'
    const resetTokenParam = searchParams.get('reset');
    const userEmailParam = searchParams.get('email');
    
    if (code) {
      // Handle Google auth callback
      const handleCallback = async () => {
        try {
          setLoading(true);
          setError('');
          console.log('Processing Google authorization code');
          await handleGoogleCallback(code);
          navigate('/');
        } catch (err) {
          setError('Failed to authenticate with Google. Please try again.');
          console.error('Google authentication error:', err);
        } finally {
          setLoading(false);
        }
      };
      
      handleCallback();
    } else if (resetTokenParam) {
      // Handle password reset token
      const verifyToken = async () => {
        try {
          setLoading(true);
          await verifyResetToken(resetTokenParam);
          setIsResetPassword(true);
          setResetToken(resetTokenParam);
          
          // Save the email from the query parameter if available
          if (userEmailParam) {
            setFormData(prev => ({
              ...prev,
              email: userEmailParam
            }));
          }
        } catch (err) {
          setError('Invalid or expired password reset link. Please request a new one.');
        } finally {
          setLoading(false);
        }
      };
      
      verifyToken();
    }
  }, [location, handleGoogleCallback, navigate, verifyResetToken]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
    if (successMessage) setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        
        // Get the current path
        const currentPath = location.pathname;
        
        // If we're logging in from the map view (/login without referrer), stay on map
        // Otherwise redirect to landing page
        if (currentPath === '/login' && !location.search.includes('from=landing')) {
          navigate('/');
        } else {
          navigate('/landing');
        }
      } else if (isForgotPassword) {
        // Handle forgot password form submission
        if (!formData.email) {
          throw new Error('Please enter your email address');
        }
        
        const response = await requestPasswordReset(formData.email);
        setSuccessMessage('Password reset link has been sent to your email. Please check your inbox and spam folder. Due to email provider limitations, the email may appear in your spam folder.');
        
        // Clear the email field after successful submission
        setFormData({
          ...formData,
          email: ''
        });
      } else if (isResetPassword) {
        // Handle password reset form submission
        if (!formData.newPassword || !formData.confirmNewPassword) {
          throw new Error('Please fill in all password fields');
        }
        
        if (formData.newPassword !== formData.confirmNewPassword) {
          throw new Error('Passwords do not match');
        }
        
        // Basic password validation
        if (formData.newPassword.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        
        // Use the email that was saved from the URL or entered by the user
        if (!formData.email) {
          throw new Error('Email address is missing. Please contact support.');
        }
        
        await resetPassword(resetToken, formData.newPassword, formData.email);
        setSuccessMessage('Your password has been reset successfully. You can now log in with your new password.');
        
        // Reset the form state after successful reset
        setTimeout(() => {
          setIsResetPassword(false);
          setIsForgotPassword(false);
          setIsLogin(true);
          setSuccessMessage('');
          setFormData({
            ...formData,
            newPassword: '',
            confirmNewPassword: ''
          });
        }, 3000);
      } else {
        // Validation for registration
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (!formData.firstName || !formData.lastName) {
          throw new Error('First name and last name are required');
        }
        await register(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );
        
        // Get the current path
        const currentPath = location.pathname;
        
        // If we're logging in from the map view (/login without referrer), stay on map
        // Otherwise redirect to landing page
        if (currentPath === '/login' && !location.search.includes('from=landing')) {
          navigate('/');
        } else {
          navigate('/landing');
        }
      }
    } catch (err) {
      if (isForgotPassword) {
        setError(err.message || 'Failed to send password reset email. Please try again.');
      } else if (isResetPassword) {
        setError(err.message || 'Failed to reset password. Please try again.');
      } else {
        setError(err.message || `Failed to ${isLogin ? 'log in' : 'sign up'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      await googleLogin();
      // No need to navigate here as googleLogin will redirect to Google OAuth
    } catch (err) {
      setError('Failed to initiate Google login. Please try again.');
      setLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsLogin(!isLogin);
    setError('');
    setSuccessMessage('');
  };

  const backToLogin = () => {
    setIsForgotPassword(false);
    setIsResetPassword(false);
    setIsLogin(true);
    setError('');
    setSuccessMessage('');
    setFormData({
      ...formData,
      password: '',
      newPassword: '',
      confirmNewPassword: ''
    });
  };

  const renderForm = () => {
    if (isForgotPassword) {
      return (
        <>
          <h2>Forgot Password</h2>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Send Reset Link'}
            </button>
          </form>
          <button 
            className="back-button"
            onClick={backToLogin}
            disabled={loading}
          >
            Back to Login
          </button>
        </>
      );
    } else if (isResetPassword) {
      return (
        <>
          <h2>Reset Password</h2>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                placeholder="New Password"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                id="confirmNewPassword"
                name="confirmNewPassword"
                placeholder="Confirm New Password"
                value={formData.confirmNewPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Reset Password'}
            </button>
          </form>
        </>
      );
    } else {
      return (
        <>
          <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
          
          <button 
            className="google-button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img 
              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" 
              alt="Google" 
              className="google-icon" 
            />
            Sign in with Google
          </button>
          
          <div className="or-divider">OR</div>
          
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="form-group">
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required={!isLogin}
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            {isLogin && (
              <span 
                className="forgot-password"
                onClick={toggleForgotPassword}
              >
                Forgot Password?
              </span>
            )}
            {!isLogin && (
              <div className="form-group">
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                />
              </div>
            )}
            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>
          <button 
            className="toggle-button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccessMessage('');
              setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                firstName: '',
                lastName: '',
                newPassword: '',
                confirmNewPassword: ''
              });
            }}
            disabled={loading}
          >
            {isLogin ? 'Need an account? Sign up' : 'Have an account? Login'}
          </button>
        </>
      );
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {renderForm()}
      </div>
    </div>
  );
};

export default Login;
