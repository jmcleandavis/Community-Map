const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for addresses (replace with database in production)
let addresses = [
  {
    id: 1,
    address: "1471 Whites Road",
    description: "Multi-family garage sale",
    lat: 43.8344,
    lng: -79.0922
  },
  {
    id: 2,
    address: "1825 Liverpool Road",
    description: "Moving sale - everything must go!",
    lat: 43.8381,
    lng: -79.0833
  }
];

// Get all addresses
app.get('/api/addresses', (req, res) => {
  res.json(addresses);
});

// Sales data endpoint
app.get('/api/sales', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'addresses_with_descriptions.json');
    const salesData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(salesData);
  } catch (error) {
    console.error('Error reading sales data:', error);
    res.status(500).json({ error: 'Error reading sales data' });
  }
});

// Geocode address
app.get('/api/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: 'Address is required' });
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: 'Google Maps API key not configured' });
    }

    console.log('Geocoding address:', decodeURIComponent(address));
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: decodeURIComponent(address),
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ error: 'Error geocoding address' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
