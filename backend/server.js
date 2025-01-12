require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://192.168.1.*:5173'], // Allow local network
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());

// Create axios instance for Google Geocoding API
const geocodingApi = axios.create({
    baseURL: 'https://maps.googleapis.com/maps/api/geocode/json',
    timeout: 5000
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Geocoding endpoint
app.get('/api/geocode', async (req, res) => {
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).json({ error: 'Address is required' });
        }

        if (!GOOGLE_MAPS_API_KEY) {
            return res.status(500).json({ error: 'Google Maps API key not configured' });
        }

        console.log('Geocoding address:', decodeURIComponent(address));
        const response = await geocodingApi.get('', {
            params: {
                address: decodeURIComponent(address),
                key: GOOGLE_MAPS_API_KEY
            }
        });

        if (response.data.status === 'OK') {
            console.log('Geocoding successful:', response.data);
            res.json(response.data);
        } else {
            console.error('Geocoding failed:', response.data);
            res.status(400).json({ error: 'Geocoding failed', details: response.data });
        }
    } catch (error) {
        console.error('Geocoding error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Geocoding failed', details: error.response?.data || error.message });
    }
});

// Endpoint to get all garage sale addresses
app.get('/api/addresses', (req, res) => {
    try {
        console.log('Received request for addresses');
        const filePath = path.join(__dirname, 'addresses_with_unique_descriptions.json');
        console.log('Reading file from:', filePath);
        
        if (!fs.existsSync(filePath)) {
            console.error('File does not exist:', filePath);
            return res.status(404).json({ error: 'Addresses file not found' });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        console.log('Raw file content:', fileContent);

        const addressesWithDescriptions = JSON.parse(fileContent);
        console.log(`Successfully read ${addressesWithDescriptions.length} addresses:`, addressesWithDescriptions);
        
        // Transform the data to include both address and description
        const formattedAddresses = addressesWithDescriptions.map(item => ({
            address: item.Address,
            description: item.Description
        }));
        
        res.json(formattedAddresses);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Google Maps API Key configured:', !!GOOGLE_MAPS_API_KEY);
});
