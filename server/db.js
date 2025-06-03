const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/todos.db');

function getDbConnection() {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database connection for operation:', err.message);
      throw err; // Re-throw error to be caught by caller
    }
  });
}

function getAllTodos() {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    db.all('SELECT * FROM todos', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
      db.close();
    });
  });
}

function addTodo(todoData) {
  return new Promise((resolve, reject) => {
    const { task, priority, status, due_date, client } = todoData;
    const db = getDbConnection();
    const sql = `INSERT INTO todos (task, priority, status, due_date, client) VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [task, priority, status, due_date, client], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...todoData });
      }
      db.close();
    });
  });
}

function updateTodo(id, todoData) {
  return new Promise((resolve, reject) => {
    const { task, priority, status, due_date, client } = todoData;
    const db = getDbConnection();
    // Ensure all fields are provided or handle partial updates carefully
    const sql = `UPDATE todos SET task = ?, priority = ?, status = ?, due_date = ?, client = ? WHERE id = ?`;

    db.run(sql, [task, priority, status, due_date, client, id], function(err) {
      if (err) {
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error(`Todo with id ${id} not found.`));
        } else {
          resolve({ id, ...todoData });
        }
      }
      db.close();
    });
  });
}

function deleteTodo(id) {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    const sql = `DELETE FROM todos WHERE id = ?`;

    db.run(sql, [id], function(err) {
      if (err) {
        reject(err);
      } else {
        if (this.changes === 0) {
          reject(new Error(`Todo with id ${id} not found.`));
        } else {
          resolve({ message: `Todo with id ${id} deleted successfully.` });
        }
      }
      db.close();
    });
  });
}

function getTodosByClient(clientName) {
  return new Promise((resolve, reject) => {
    const db = getDbConnection();
    db.all('SELECT * FROM todos WHERE client = ?', [clientName], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
      db.close();
    });
  });
}

module.exports = {
  getDbConnection, // Though typically not used directly by API routes if other functions handle db opening/closing
  getAllTodos,
  addTodo,
  updateTodo,
  deleteTodo,
  getTodosByClient,
};
