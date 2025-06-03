import React from 'react';
import './TodoItem.css'; // Import TodoItem styles

const TodoItem = ({ todo, onEdit, onDelete }) => {
  return (
    <tr className="todo-item-row">
      <td>{todo.task}</td>
      <td>{todo.priority}</td>
      <td>{todo.status}</td>
      <td>{todo.due_date ? new Date(todo.due_date).toLocaleDateString() : 'N/A'}</td>
      <td>{todo.client}</td>
      <td className="actions">
        <button className="edit-button" onClick={() => onEdit(todo)}>Edit</button>
        <button className="delete-button" onClick={() => onDelete(todo.id)}>Delete</button>
      </td>
    </tr>
  );
};

export default TodoItem;
