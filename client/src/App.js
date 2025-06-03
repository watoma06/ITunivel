import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Import axios
import './App.css';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import Filter from './components/Filter';
import ConvenienceLinks from './components/ConvenienceLinks'; // Import ConvenienceLinks

const API_URL = 'http://localhost:3001/api/todos';

function App() {
  const [todos, setTodos] = useState([]); // Initialize with empty array
  const [filterClient, setFilterClient] = useState('');
  const [editingTodo, setEditingTodo] = useState(null); // Holds the todo being edited

  // Fetch Todos
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await axios.get(API_URL);
        setTodos(response.data);
      } catch (error) {
        console.error("Error fetching todos:", error.response ? error.response.data : error.message);
        // Optionally, set an error state here to display to the user
      }
    };
    fetchTodos();
  }, []); // Empty dependency array means this runs once on mount

  const handleAddTodo = async (newTodoData) => {
    try {
      const response = await axios.post(API_URL, newTodoData);
      setTodos(prevTodos => [...prevTodos, response.data]);
      // No need to manually set ID, server should handle it
    } catch (error) {
      console.error("Error adding todo:", error.response ? error.response.data : error.message);
    }
  };

  const handleUpdateTodo = async (updatedTodoData) => {
    if (!editingTodo || !updatedTodoData) {
      setEditingTodo(null);
      return;
    }
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
      // If update fails, you might want to leave editingTodo as is, or provide user feedback
    }
  };

  const startEditTodo = (todo) => {
    setEditingTodo(todo);
  };

  // Function to cancel editing, called from TodoForm if needed
  const cancelEdit = () => {
    setEditingTodo(null);
  };

  const handleDeleteTodo = async (idToDelete) => {
    try {
      await axios.delete(`${API_URL}/${idToDelete}`);
      setTodos(prevTodos => prevTodos.filter(todo => todo.id !== idToDelete));
    } catch (error) {
      console.error(`Error deleting todo with id ${idToDelete}:`, error.response ? error.response.data : error.message);
    }
  };

  const filteredTodos = todos.filter(todo =>
    todo.client && todo.client.toLowerCase().includes(filterClient.toLowerCase())
  );

  return (
    <div className="App">
      <header className="App-header">
        <h1>Todo Management</h1>
      </header>
      <main>
        <ConvenienceLinks /> {/* Add ConvenienceLinks here */}
        <TodoForm
          onSubmit={editingTodo ? handleUpdateTodo : handleAddTodo}
          initialData={editingTodo}
          // Pass cancelEdit to TodoForm if you have a cancel button there that needs to clear App's editingTodo state
          // onCancelEdit={cancelEdit}
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
