import React from 'react';
import TodoItem from './TodoItem';
import './TodoList.css'; // Import TodoList styles

const TodoList = ({ todos, onEdit, onDelete }) => {
  if (!todos || todos.length === 0) {
    return <p>No todos yet. Add one above!</p>;
  }

  return (
    <div className="todo-list">
      <h3>Todo List</h3>
      <table>
        <thead>
          <tr>
            <th>Task</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Client</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {todos.map(todo => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TodoList;
