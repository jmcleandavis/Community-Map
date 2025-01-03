import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import GarageSalesWindow from './pages/GarageSalesWindow'

// Determine which component to render based on the URL
const isGarageSalesWindow = window.location.pathname.includes('garageSalesWindow');
const Component = isGarageSalesWindow ? GarageSalesWindow : App;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Component />
  </StrictMode>,
)
