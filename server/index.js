const express = require('express');
const cors = require('cors');
const path = require('path'); // Import path module
const db = require('./db'); // Import database helper functions, which now initializes the DB connection

const app = express();
const port = 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../client/build')));

// API Endpoints

// GET /api/todos - Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await db.getAllTodos();
    res.json(todos);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: 'Failed to retrieve todos', details: err.message });
  }
});

// GET /api/todos/client/:clientName - Get todos by client name
app.get('/api/todos/client/:clientName', async (req, res) => {
  try {
    const clientName = req.params.clientName;
    const todos = await db.getTodosByClient(clientName);
    if (todos.length === 0) {
      // Optionally return 404 if no todos for client, or just empty array
      // return res.status(404).json({ message: 'No todos found for this client.' });
    }
    res.json(todos);
  } catch (err) {
    console.error(`Error fetching todos for client ${req.params.clientName}:`, err);
    res.status(500).json({ error: 'Failed to retrieve todos for client', details: err.message });
  }
});

// POST /api/todos - Add a new todo
app.post('/api/todos', async (req, res) => {
  try {
    const todoData = req.body;
    // Basic validation (can be expanded)
    if (!todoData.task) {
      return res.status(400).json({ error: 'Task is required' });
    }
    const newTodo = await db.addTodo(todoData);
    res.status(201).json(newTodo);
  } catch (err) {
    console.error('Error adding todo:', err);
    res.status(500).json({ error: 'Failed to add todo', details: err.message });
  }
});

// PUT /api/todos/:id - Update an existing todo
app.put('/api/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    const todoData = req.body;
    // Basic validation
    if (!todoData.task) {
      return res.status(400).json({ error: 'Task is required' });
    }
    // Ensure ID from params is used, not from body if present
    const updatedTodo = await db.updateTodo(id, todoData);
    res.json(updatedTodo);
  } catch (err) {
    console.error(`Error updating todo with id ${req.params.id}:`, err);
    if (err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
    } else {
        res.status(500).json({ error: 'Failed to update todo', details: err.message });
    }
  }
});

// DELETE /api/todos/:id - Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    const result = await db.deleteTodo(id);
    res.json(result); // Or res.status(204).send(); for no content
  } catch (err) {
    console.error(`Error deleting todo with id ${req.params.id}:`, err);
    if (err.message.includes("not found")) {
        res.status(404).json({ error: err.message });
    } else {
        res.status(500).json({ error: 'Failed to delete todo', details: err.message });
    }
  }
});


// Default "Hello World" route (can be removed or kept for basic testing)
// The "catchall" handler: for any request that doesn't match one above,
// send back React's index.html file.
app.get('*', (req, res) => {
  // Ensure the path is correctly pointing to the client's build directory
  const indexPath = path.join(__dirname, '../client/build', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // Log the error and send a 500 response if the file can't be served
      console.error('Error sending index.html:', err);
      res.status(500).send('Error serving the application.');
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}, serving API and React app from client/build`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server and DB connection.');
  try {
    await db.closeDbConnection(); // Ensure this is the function exported from db.js
    console.log('Database connection closed through SIGINT handler.');
    // server.close() would be here if 'server' was assigned from app.listen()
    // For simplicity, as app.listen doesn't return the server object directly in this setup:
    process.exit(0);
  } catch (err) {
    console.error('Error during SIGINT shutdown:', err);
    process.exit(1);
  }
});
