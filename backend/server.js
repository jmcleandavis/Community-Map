require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Check if API key is loaded
console.log('API Key status:', GOOGLE_MAPS_API_KEY ? 'Present' : 'Missing');
if (!GOOGLE_MAPS_API_KEY) {
    console.error('WARNING: Google Maps API key is not set in environment variables');
}

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

// Function to geocode a single address
async function geocodeAddress(address) {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error('Google Maps API key is not configured');
        return null;
    }

    try {
        // Clean and format the address
        const cleanAddress = address.trim().replace(/\s+/g, ' ');
        console.log(`Geocoding address: ${cleanAddress}`);
        
        // Try first with just city and province
        const fullAddress = `${cleanAddress}, Pickering, Ontario, Canada`;
        console.log(`Full address being geocoded: ${fullAddress}`);
        
        const response = await geocodingApi.get('', {
            params: {
                address: fullAddress,
                components: 'country:CA|administrative_area:ON|locality:Pickering',
                key: GOOGLE_MAPS_API_KEY
            }
        });

        console.log('Geocoding API URL:', response.config.url);
        console.log('Geocoding response status:', response.data.status);

        if (response.data.status === 'OK' && response.data.results && response.data.results[0]) {
            const location = response.data.results[0].geometry.location;
            console.log(`Successfully geocoded ${cleanAddress} to:`, location);
            return {
                lat: Number(location.lat),
                lng: Number(location.lng)
            };
        } else {
            console.error(`Geocoding failed for ${cleanAddress}. Status:`, response.data.status);
            if (response.data.error_message) {
                console.error('Error message:', response.data.error_message);
            }
            // Try alternative format without components
            const retryResponse = await geocodingApi.get('', {
                params: {
                    address: fullAddress,
                    key: GOOGLE_MAPS_API_KEY
                }
            });
            
            if (retryResponse.data.status === 'OK' && retryResponse.data.results && retryResponse.data.results[0]) {
                const location = retryResponse.data.results[0].geometry.location;
                console.log(`Successfully geocoded ${cleanAddress} on retry to:`, location);
                return {
                    lat: Number(location.lat),
                    lng: Number(location.lng)
                };
            }
            
            return null;
        }
    } catch (error) {
        console.error(`Error geocoding address ${address}:`, error.response?.data || error.message);
        if (error.response?.data?.error_message) {
            console.error('Google API error message:', error.response.data.error_message);
        }
        return null;
    }
}

// Endpoint to get all garage sale addresses
app.get('/api/addresses', async (req, res) => {
    try {
        console.log('Received request for addresses');
        const filePath = path.join(__dirname, 'addresses_with_unique_descriptions.json');
        console.log('Reading file from:', filePath);
        
        if (!fs.existsSync(filePath)) {
            console.error('File does not exist:', filePath);
            return res.status(404).json({ error: 'Addresses file not found' });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const addressesWithDescriptions = JSON.parse(fileContent);
        console.log(`Successfully read ${addressesWithDescriptions.length} addresses`);
        
        // Add delay between geocoding requests to avoid rate limits
        const geocodedAddresses = [];
        for (const item of addressesWithDescriptions) {
            const coordinates = await geocodeAddress(item.Address);
            if (coordinates) {
                geocodedAddresses.push({
                    address: item.Address,
                    description: item.Description,
                    ...coordinates
                });
                // Add a small delay between requests
                await new Promise(resolve => setTimeout(resolve, 200));
            } else {
                console.warn(`Failed to geocode address: ${item.Address}`);
            }
        }

        console.log(`Successfully geocoded ${geocodedAddresses.length} out of ${addressesWithDescriptions.length} addresses`);
        
        if (geocodedAddresses.length === 0) {
            console.error('No addresses were successfully geocoded');
            return res.status(500).json({ 
                error: 'Geocoding failed',
                message: 'Could not geocode any addresses. Please check the Google Maps API key and address format.'
            });
        }

        res.json(geocodedAddresses);
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get address count
app.get('/api/addresses/count', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'addresses_with_unique_descriptions.json');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Addresses file not found' });
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const addresses = JSON.parse(fileContent);
        res.json({ count: addresses.length });
    } catch (error) {
        console.error('Error getting address count:', error);
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
