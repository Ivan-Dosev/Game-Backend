const sqlite3 = require('sqlite3').verbose(); // SQLite library
const fs = require('fs'); // File system to write JSON data

// Create or open SQLite database
const db = new sqlite3.Database('./pointsData.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');

        // Read data from the database
        db.all('SELECT * FROM points', (err, rows) => {
            if (err) {
                console.error('Error retrieving data from the database:', err.message);
            } else {
                // Convert the rows to JSON format
                const jsonData = JSON.stringify(rows, null, 2);

                // Write JSON data to a file
                fs.writeFile('./pointsData.json', jsonData, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing JSON file:', err.message);
                    } else {
                        console.log('Data exported to pointsData.json successfully');
                    }
                });
            }

            // Close the database connection
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                } else {
                    console.log('Closed the database connection.');
                }
            });
        });
    }
});
