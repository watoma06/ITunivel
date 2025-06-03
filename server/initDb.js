const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define the path for the database file relative to the server directory, pointing to the database directory
const dbPath = path.resolve(__dirname, '../database/todos.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

db.serialize(() => {
  // Create the todos table
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    priority TEXT CHECK(priority IN ('High', 'Medium', 'Low')),
    status TEXT CHECK(status IN ('Pending', 'In-Progress', 'Completed')) DEFAULT 'Pending',
    due_date TEXT,
    client TEXT
  )`, (err) => {
    if (err) {
      console.error('Error creating todos table', err.message);
    } else {
      console.log('Todos table created or already exists.');
    }
  });
});

db.close((err) => {
  if (err) {
    console.error('Error closing database', err.message);
  } else {
    console.log('Database connection closed.');
  }
});
