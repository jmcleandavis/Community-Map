import React from 'react'
import { createRoot } from 'react-dom/client'
import GarageSalesList from './components/GarageSalesList'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <div className="garage-sales-standalone">
      <GarageSalesList />
    </div>
  </React.StrictMode>
)
