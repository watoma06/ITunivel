import React, { useState, useEffect } from 'react';
import './TodoForm.css'; // Import TodoForm styles

const TodoForm = ({ onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    task: '',
    priority: 'Medium',
    status: 'Pending',
    due_date: '',
    client: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        task: initialData.task || '',
        priority: initialData.priority || 'Medium',
        status: initialData.status || 'Pending',
        due_date: initialData.due_date ? initialData.due_date.split('T')[0] : '', // Assuming ISO string for date
        client: initialData.client || ''
      });
    } else {
      // Reset form if no initial data (e.g., for new todo)
      setFormData({
        task: '',
        priority: 'Medium',
        status: 'Pending',
        due_date: '',
        client: ''
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    // Reset form only if it's not for editing (no initialData)
    if (!initialData) {
        setFormData({
            task: '',
            priority: 'Medium',
            status: 'Pending',
            due_date: '',
            client: ''
        });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <h3>{initialData ? 'Edit Todo' : 'Add New Todo'}</h3>
      <div>
        <label htmlFor="task">Task:</label>
        <input type="text" id="task" name="task" value={formData.task} onChange={handleChange} required />
      </div>
      <div>
        <label htmlFor="priority">Priority:</label>
        <select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>
      <div>
        <label htmlFor="status">Status:</label>
        <select id="status" name="status" value={formData.status} onChange={handleChange}>
          <option value="Pending">Pending</option>
          <option value="In-Progress">In-Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>
      <div>
        <label htmlFor="due_date">Due Date:</label>
        <input type="date" id="due_date" name="due_date" value={formData.due_date} onChange={handleChange} />
      </div>
      <div>
        <label htmlFor="client">Client:</label>
        <input type="text" id="client" name="client" value={formData.client} onChange={handleChange} />
      </div>
      <button type="submit">{initialData ? 'Update Todo' : 'Add Todo'}</button>
      {initialData && <button type="button" onClick={() => onSubmit(null)}>Cancel Edit</button>}
    </form>
  );
};

export default TodoForm;
