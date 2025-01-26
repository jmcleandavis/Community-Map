import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { GarageSalesProvider } from './context/GarageSalesContext'
import { SearchProvider } from './context/SearchContext'
import { SelectionProvider } from './context/SelectionContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GarageSalesProvider>
      <SearchProvider>
        <SelectionProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SelectionProvider>
      </SearchProvider>
    </GarageSalesProvider>
  </React.StrictMode>
)
