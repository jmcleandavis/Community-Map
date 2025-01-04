const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], // Allow both localhost and IP
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
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
});
