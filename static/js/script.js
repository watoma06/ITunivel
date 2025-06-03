document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');

    fetchTodos();

    addTodoBtn.addEventListener('click', async () => {
        const todoText = todoInput.value.trim();
        if (todoText === '') {
            alert("TODO text cannot be empty.");
            return;
        }

        try {
            const response = await fetch('/api/todos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: todoText }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const newTodo = await response.json();
            addTodoItemToDOM(newTodo); // Add the new item (returned from server with ID) to the DOM
            todoInput.value = ''; // Clear the input field
        } catch (error) {
            console.error("Failed to add todo:", error);
            alert("Failed to add TODO. Please try again.");
        }
    });

    async function fetchTodos() {
        try {
            const response = await fetch('/api/todos');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const todos = await response.json();
            renderTodos(todos);
        } catch (error) {
            console.error("Failed to fetch todos:", error);
            // Optionally display an error message to the user
        }
    }

    function renderTodos(todos) {
        todoList.innerHTML = ''; // Clear existing list items
        if (todos && Array.isArray(todos)) {
            todos.forEach(todo => {
                addTodoItemToDOM(todo);
            });
        }
    }

    function addTodoItemToDOM(todo) {
        const listItem = document.createElement('li');
        listItem.dataset.id = todo.id;

        const textSpan = document.createElement('span');
        textSpan.textContent = todo.text;
        listItem.appendChild(textSpan);

        if (todo.completed) {
            listItem.classList.add('completed');
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('todo-actions');

        const completeButton = document.createElement('button');
        completeButton.textContent = todo.completed ? 'Undo' : 'Complete';
        completeButton.classList.add('complete-btn');
        completeButton.addEventListener('click', async () => {
            const currentCompletedStatus = listItem.classList.contains('completed');
            const newCompletedStatus = !currentCompletedStatus;
            const todoId = listItem.dataset.id;
            // We also need the current text to send it back, as per current Go PUT handler
            const currentText = textSpan.textContent;


            try {
                const response = await fetch(`/api/todos/${todoId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    // Go backend expects "text" and "completed" in PUT
                    body: JSON.stringify({ text: currentText, completed: newCompletedStatus }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // const updatedTodo = await response.json(); // Contains the full updated todo
                listItem.classList.toggle('completed');
                completeButton.textContent = newCompletedStatus ? 'Undo' : 'Complete';
            } catch (error) {
                console.error(`Failed to update todo ${todoId}:`, error);
                alert("Failed to update TODO. Please try again.");
            }
        });
        actionsDiv.appendChild(completeButton);

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-btn');
        removeButton.addEventListener('click', async () => {
            const todoId = listItem.dataset.id;
            try {
                const response = await fetch(`/api/todos/${todoId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) { // Handles 404 as well for already deleted items
                    if(response.status === 404) {
                         console.warn(`Todo ${todoId} not found for deletion.`);
                         listItem.remove(); // Remove from DOM anyway if server says not found
                         return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                // For DELETE, successful response is 204 No Content, so no JSON body
                listItem.remove();
            } catch (error) {
                console.error(`Failed to delete todo ${todoId}:`, error);
                alert("Failed to delete TODO. Please try again.");
            }
        });
        actionsDiv.appendChild(removeButton);

        listItem.appendChild(actionsDiv);
        todoList.appendChild(listItem);
    }
});
