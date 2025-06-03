document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');

    // Load todos from localStorage on page load
    loadTodos();

    addTodoBtn.addEventListener('click', () => {
        const todoText = todoInput.value.trim();
        if (todoText === '') {
            alert("TODO text cannot be empty.");
            return;
        }

        // Create new todo with local ID
        const newTodo = {
            id: Date.now(), // Simple ID generation
            text: todoText,
            completed: false
        };

        // Save to localStorage
        saveTodo(newTodo);
        
        // Add to DOM
        addTodoItemToDOM(newTodo);
        
        // Clear input
        todoInput.value = '';
    });    // LocalStorage functions
    function loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            renderTodos(todos);
        }
    }

    function saveTodo(todo) {
        const savedTodos = localStorage.getItem('todos');
        let todos = savedTodos ? JSON.parse(savedTodos) : [];
        todos.push(todo);
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    function updateTodo(todoId, updates) {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            let todos = JSON.parse(savedTodos);
            todos = todos.map(todo => 
                todo.id == todoId ? { ...todo, ...updates } : todo
            );
            localStorage.setItem('todos', JSON.stringify(todos));
        }
    }

    function deleteTodo(todoId) {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            let todos = JSON.parse(savedTodos);
            todos = todos.filter(todo => todo.id != todoId);
            localStorage.setItem('todos', JSON.stringify(todos));
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
        actionsDiv.classList.add('todo-actions');        const completeButton = document.createElement('button');
        completeButton.textContent = todo.completed ? 'Undo' : 'Complete';
        completeButton.classList.add('complete-btn');
        completeButton.addEventListener('click', () => {
            const currentCompletedStatus = listItem.classList.contains('completed');
            const newCompletedStatus = !currentCompletedStatus;
            const todoId = listItem.dataset.id;

            // Update localStorage
            updateTodo(todoId, { completed: newCompletedStatus });
            
            // Update DOM
            listItem.classList.toggle('completed');
            completeButton.textContent = newCompletedStatus ? 'Undo' : 'Complete';
        });
        actionsDiv.appendChild(completeButton);        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove';
        removeButton.classList.add('remove-btn');
        removeButton.addEventListener('click', () => {
            const todoId = listItem.dataset.id;
            
            // Delete from localStorage
            deleteTodo(todoId);
            
            // Remove from DOM
            listItem.remove();
        });
        actionsDiv.appendChild(removeButton);

        listItem.appendChild(actionsDiv);
        todoList.appendChild(listItem);
    }
});
