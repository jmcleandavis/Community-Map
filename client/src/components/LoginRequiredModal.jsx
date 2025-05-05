import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginRequiredModal.css';

const LoginRequiredModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToLogin = () => {
    onClose();
    navigate('/login');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Authentication Required</h2>
        <p>You must be logged in to select garage sales.</p>
        <div className="modal-buttons">
          <button className="modal-button cancel" onClick={onClose}>Return</button>
          <button className="modal-button login" onClick={handleGoToLogin}>Go to Login</button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
