const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lyve_owner_id TEXT UNIQUE,
            full_name TEXT,
            email TEXT,
            hik_person_id TEXT,
            hik_person_code TEXT
        )`);

        // Visitors table
        db.run(`CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            visitor_name TEXT,
            visit_start TEXT,
            visit_end TEXT,
            hik_visitor_id TEXT,
            qr_code TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);
        
        console.log('Database tables initialized.');
    });
}

module.exports = db;
