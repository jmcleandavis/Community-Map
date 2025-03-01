import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, createRoutesFromChildren, matchRoutes } from 'react-router-dom'
import App from './App.jsx'
import { GarageSalesProvider } from './context/GarageSalesContext'
import { SearchProvider } from './context/SearchContext'
import { SelectionProvider } from './context/SelectionContext'
import './index.css'

// Configure future flags for React Router v7 compatibility
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <GarageSalesProvider>
    <SearchProvider>
      <SelectionProvider>
        <BrowserRouter {...router}>
          <App />
        </BrowserRouter>
      </SelectionProvider>
    </SearchProvider>
  </GarageSalesProvider>
)
