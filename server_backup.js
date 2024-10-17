// server.js
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 5001; // Choose your preferred port

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Path to the JSON file
const pointsFilePath = './pointsData.json';

// Load existing points data from the JSON file
const loadPointsData = () => {
    if (fs.existsSync(pointsFilePath)) {
        const data = fs.readFileSync(pointsFilePath);
        return JSON.parse(data);
    }
    return {}; // Return an empty object if the file doesn't exist
};

// Endpoint to save points
app.post('/api/savePoints', (req, res) => {
    const { wallet, points } = req.body;
    const data = loadPointsData();

    // Check if the wallet exists, add points or create a new entry
    if (data[wallet]) {
        data[wallet] += points; // Add points
    } else {
        data[wallet] = points; // Create new entry
    }

    // Save updated data back to the JSON file
    fs.writeFileSync(pointsFilePath, JSON.stringify(data, null, 2));
    res.json({ message: 'Points saved successfully' });
});

// Endpoint to get points
app.get('/api/getPoints', (req, res) => {
    const data = loadPointsData();
    res.json(data);
});

// Endpoint to get top 10 wallets by points
app.get('/api/top10', (req, res) => {
    const data = loadPointsData();

    // Convert data object to an array and sort by points in descending order
    const sortedData = Object.entries(data)
        .sort(([, a], [, b]) => b - a)  // Sort by points (descending)
        .slice(0, 10);                  // Take the top 10 entries

    res.json(sortedData);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});