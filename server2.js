const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose(); // Using SQLite3
const rateLimit = require('express-rate-limit');
const validator = require('validator');

const app = express();
const PORT = 5001;

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minutes
    max: 3, // Limit each IP to 2 requests per `window` (1 minutes)
    message: 'Too many requests from this IP, please try again later.',
});

// app.use(cors());
app.use(cors({
    origin: ['https://play.thedrop.top', 'https://www.play.thedrop.top', 'https://thedrop.top', 'http://localhost:3000'],
    methods: 'GET,POST', // Specify allowed methods
    allowedHeaders: 'Content-Type,Authorization', // Specify allowed headers
    optionsSuccessStatus: 204 // For legacy browsers that choke on 204 responses
}));

// Middleware
app.use(bodyParser.json());
//app.use(limiter);

const isValidWallet = (wallet) => {
    const walletRegex = /^[A-Za-z0-9_]+$/;  // Allows letters, numbers, underscores, and dashes
    return walletRegex.test(wallet);
};

// Create or open SQLite database
const db = new sqlite3.Database('./pointsData.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        
        // Create the points table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS points (
                wallet TEXT PRIMARY KEY,
                points INTEGER DEFAULT 0
            )
        `, (err) => {
            if (err) {
                console.error('Error creating points table:', err.message);
            } else {
                console.log('Points table created or already exists.');

                // Insert sample data into the points table
                const sampleData = [];

                sampleData.forEach(({ wallet, points }) => {
                    db.run(`
                        INSERT INTO points (wallet, points) 
                        VALUES (?, ?)
                        ON CONFLICT(wallet) DO NOTHING
                    `, [wallet, points], (err) => {
                        if (err) {
                            console.error(`Error inserting sample data for wallet ${wallet}:`, err.message);
                        } else {
                            console.log(`Inserted data for wallet ${wallet}`);
                        }
                    });
                });
            }
        });
    }
});

// Endpoint to save points
app.post('/api/savePoints', (req, res) => {
    const { wallet } = req.body;

    console.log(`Received request to save points for wallet: ${wallet}`);  // Log the incoming wallet

    const points = 1000000;

    if (!isValidWallet(wallet)) {
        console.error('Invalid wallet:', wallet);  // Log invalid wallets
        return res.status(400).json({ message: 'Invalid wallet address.' });
    }

    // Check if the wallet exists and update points, or insert a new wallet
    db.get('SELECT * FROM points WHERE wallet = ?', [wallet], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);  // Log database errors
            return res.status(500).json({ message: 'Error fetching data' });
        }
        if (row) {
            // Wallet exists, update points
            console.log(`Wallet exists. Updating points for ${wallet}`);
            db.run('UPDATE points SET points = points + ? WHERE wallet = ?', [points, wallet], (err) => {
                if (err) {
                    console.error('Error updating points:', err.message);  // Log update errors
                    return res.status(500).json({ message: 'Error updating points' });
                }
                console.log(`Points updated for wallet: ${wallet}`);
                res.json({ message: '1M points added successfully' });
            });
        } else {
            // Wallet does not exist, insert a new row
            console.log(`New wallet. Inserting points for ${wallet}`);
            db.run('INSERT INTO points (wallet, points) VALUES (?, ?)', [wallet, points], (err) => {
                if (err) {
                    console.error('Error saving points:', err.message);  // Log insert errors
                    return res.status(500).json({ message: 'Error saving points' });
                }
                console.log(`Points saved for new wallet: ${wallet}`);
                res.json({ message: '1M points saved successfully' });
            });
        }
    });
});

// Endpoint to get all points
app.get('/api/getPoints', (req, res) => {
    db.all('SELECT * FROM points', (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Error retrieving data' });
            console.error(err.message);
        } else {
            res.json(rows);
        }
    });
});

// Endpoint to get top 10 wallets by points
app.get('/api/top10', (req, res) => {
    db.all('SELECT wallet, points FROM points ORDER BY points DESC LIMIT 10', (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Error retrieving top 10 results' });
            console.error(err.message);
        } else {
            res.json(rows); // Ensure rows is an array
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});