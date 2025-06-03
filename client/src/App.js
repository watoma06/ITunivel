import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import './App.css';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import Filter from './components/Filter';
import ConvenienceLinks from './components/ConvenienceLinks'; // Import ConvenienceLinks

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/todos';

function App() {
  const [todos, setTodos] = useState([]); // Initialize with empty array
  const [filterClient, setFilterClient] = useState('');
  const [editingTodo, setEditingTodo] = useState(null); // Holds the todo being edited
  const [errorMessage, setErrorMessage] = useState(''); // State for error messages

  // Fetch Todos
  useEffect(() => {
    const fetchTodos = async () => {
      setErrorMessage(''); // Clear previous errors
      try {
        const response = await axios.get(API_URL);
        setTodos(response.data);
      } catch (error) {
        console.error("Error fetching todos:", error.response ? error.response.data : error.message);
        setErrorMessage('Failed to fetch todos. Please check your connection or try again later.');
      }
    };
    fetchTodos();
  }, []); // Empty dependency array means this runs once on mount

  const handleAddTodo = async (newTodoData) => {
    setErrorMessage(''); // Clear previous errors
    try {
      const response = await axios.post(API_URL, newTodoData);
      setTodos(prevTodos => [...prevTodos, response.data]);
    } catch (error) {
      console.error("Error adding todo:", error.response ? error.response.data : error.message);
      const serverError = error.response && error.response.data && error.response.data.error;
      setErrorMessage(serverError || 'Failed to add todo. Please try again.');
    }
  };

  const handleUpdateTodo = async (updatedTodoData) => {
    if (!editingTodo || !updatedTodoData) {
      setEditingTodo(null);
      return;
    }
    setErrorMessage(''); // Clear previous errors
    try {
      const response = await axios.put(`${API_URL}/${editingTodo.id}`, updatedTodoData);
      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === editingTodo.id ? response.data : todo
        )
      );
      setEditingTodo(null); // Clear editing state
    } catch (error) {
      console.error(`Error updating todo with id ${editingTodo.id}:`, error.response ? error.response.data : error.message);
      const serverError = error.response && error.response.data && error.response.data.error;
      setErrorMessage(serverError || `Failed to update todo (ID: ${editingTodo.id}). Please try again.`);
    }
  };

  const startEditTodo = (todo) => {
    setErrorMessage(''); // Clear errors when starting an edit
    setEditingTodo(todo);
  };

  // Function to cancel editing, called from TodoForm if needed
  const cancelEdit = () => {
    setErrorMessage(''); // Clear errors on cancel
    setEditingTodo(null);
  };

  const handleDeleteTodo = async (idToDelete) => {
    setErrorMessage(''); // Clear previous errors
    try {
      await axios.delete(`${API_URL}/${idToDelete}`);
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== idToDelete));
    } catch (error) {
      console.error(`Error deleting todo with id ${idToDelete}:`, error.response ? error.response.data : error.message);
      const serverError = error.response && error.response.data && error.response.data.error;
      setErrorMessage(serverError || `Failed to delete todo (ID: ${idToDelete}). Please try again.`);
    }
  };

  const filteredTodos = todos.filter(todo =>
    todo.client && todo.client.toLowerCase().includes(filterClient.toLowerCase())
  );

  // Ensure cancelEdit is passed to TodoForm if it has a cancel button that should use this logic
  // For now, it's used internally if startEditTodo is called or an update is successful/failed.

  return (
    <div className="App">
      <header className="App-header">
        <h1>Todo Management</h1>
      </header>
      <main>
        <ConvenienceLinks />
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        <TodoForm
          onSubmit={editingTodo ? handleUpdateTodo : handleAddTodo}
          initialData={editingTodo}
          // onCancelEdit={cancelEdit} // Pass this if TodoForm has an explicit cancel button to call it
        />
        <hr />
        <Filter filterClient={filterClient} setFilterClient={setFilterClient} />
        <TodoList
          todos={filteredTodos}
          onEdit={startEditTodo}
          onDelete={handleDeleteTodo}
        />
      </main>
    </div>
  );
}

export default App;
