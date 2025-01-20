import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { GarageSalesProvider } from './context/GarageSalesContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GarageSalesProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GarageSalesProvider>
  </React.StrictMode>
)
