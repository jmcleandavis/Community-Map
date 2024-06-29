// backend/index.js
const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

// API endpoint to serve addresses
app.get('/api/addresses', (req, res) => {
    const addresses = require('./addresses.json');
    res.json(addresses);
});

// Catch-all to serve the React app for any route not handled
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
