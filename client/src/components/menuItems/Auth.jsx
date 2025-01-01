import React, { useState } from 'react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="menu-item auth">
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      <div className="content">
        <form className="auth-form">
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          {!isLogin && (
            <input type="password" placeholder="Confirm Password" />
          )}
          <button type="submit" className="action-button">
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <button 
          className="switch-auth" 
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Need an account? Sign up' : 'Have an account? Login'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
