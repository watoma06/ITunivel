const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../database/todos.db');

// Initialize a single, persistent database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database on startup:', err.message);
    // If the DB can't open, the app likely can't run.
    // Consider exiting or a more robust error handling strategy for production.
    // For this context, we'll log the error. Subsequent operations will likely fail.
  } else {
    console.log('Successfully connected to the SQLite database (persistent connection).');
  }
});

function getAllTodos() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM todos', [], (err, rows) => {
      if (err) {
        console.error('Error in getAllTodos:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

function addTodo(todoData) {
  return new Promise((resolve, reject) => {
    const { task, priority, status, due_date, client } = todoData;
    const sql = `INSERT INTO todos (task, priority, status, due_date, client) VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [task, priority, status, due_date, client], function(err) {
      if (err) {
        console.error('Error in addTodo:', err.message);
        reject(err);
      } else {
        // Return the newly created todo object, including its ID
        resolve({ id: this.lastID, ...todoData });
      }
    });
  });
}

function updateTodo(id, todoData) {
  return new Promise((resolve, reject) => {
    const { task, priority, status, due_date, client } = todoData;
    const sql = `UPDATE todos SET task = ?, priority = ?, status = ?, due_date = ?, client = ? WHERE id = ?`;

    db.run(sql, [task, priority, status, due_date, client, id], function(err) {
      if (err) {
        console.error('Error in updateTodo:', err.message);
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error(`Todo with id ${id} not found for update.`));
        } else {
          resolve({ id, ...todoData });
        }
      }
    });
  });
}

function deleteTodo(id) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM todos WHERE id = ?`;

    db.run(sql, [id], function(err) {
      if (err) {
        console.error('Error in deleteTodo:', err.message);
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error(`Todo with id ${id} not found for delete.`));
        } else {
          resolve({ message: `Todo with id ${id} deleted successfully.` });
        }
      }
    });
  });
}

function getTodosByClient(clientName) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM todos WHERE client = ?', [clientName], (err, rows) => {
      if (err) {
        console.error('Error in getTodosByClient:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Optional: Graceful shutdown (can be called from server/index.js)
function closeDbConnection() {
  return new Promise((resolve, reject) => {
    console.log('Attempting to close the database connection...');
    db.close((err) => {
      if (err) {
        console.error('Error closing database connection:', err.message);
        reject(err);
      } else {
        console.log('Database connection closed successfully.');
        resolve();
      }
    });
  });
}

module.exports = {
  // No longer exporting getDbConnection
  getAllTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  getTodosByClient,
  closeDbConnection, // Export the close function if used in index.js
};
