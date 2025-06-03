document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');
    const projectSelect = document.getElementById('project-select');
    const tagsInput = document.getElementById('tags-input');
    const projectFilter = document.getElementById('project-filter');
    const tagFilter = document.getElementById('tag-filter');

    // Load todos from localStorage on page load
    loadTodos();

    // Add event listeners for filtering
    projectFilter.addEventListener('change', filterTodos);
    tagFilter.addEventListener('input', filterTodos);

    addTodoBtn.addEventListener('click', () => {
        const todoText = todoInput.value.trim();
        if (todoText === '') {
            alert("TODO text cannot be empty.");
            return;
        }

        // Parse tags from tags input
        const tagsText = tagsInput.value.trim();
        const tags = tagsText ? tagsText.split(/\s+/).filter(tag => tag.startsWith('#')).map(tag => tag.substring(1)) : [];

        // Create new todo with local ID
        const newTodo = {
            id: Date.now(), // Simple ID generation
            text: todoText,
            completed: false,
            project: projectSelect.value,
            tags: tags,
            createdAt: new Date().toISOString()
        };

        // Save to localStorage
        saveTodo(newTodo);
        
        // Add to DOM
        addTodoItemToDOM(newTodo);
        
        // Clear inputs
        todoInput.value = '';
        tagsInput.value = '';
        projectSelect.value = '';
    });

    // Filtering function
    function filterTodos() {
        const selectedProject = projectFilter.value;
        const searchTag = tagFilter.value.trim().toLowerCase().replace('#', '');
        
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            const filteredTodos = todos.filter(todo => {
                const projectMatch = !selectedProject || todo.project === selectedProject;
                const tagMatch = !searchTag || (todo.tags && todo.tags.some(tag => 
                    tag.toLowerCase().includes(searchTag)
                ));
                return projectMatch && tagMatch;
            });
            renderTodos(filteredTodos);
        }
    }

    // LocalStorage functions
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
        if (todo.completed) {
            listItem.classList.add('completed');
        }

        // Create todo content container
        const todoContent = document.createElement('div');
        todoContent.classList.add('todo-content');

        // Create text and meta container
        const textContainer = document.createElement('div');
        textContainer.style.flex = '1';

        const textSpan = document.createElement('div');
        textSpan.classList.add('todo-text');
        textSpan.textContent = todo.text;
        textContainer.appendChild(textSpan);

        // Create meta information (project and tags)
        const metaDiv = document.createElement('div');
        metaDiv.classList.add('todo-meta');

        // Add project badge
        if (todo.project) {
            const projectBadge = document.createElement('span');
            projectBadge.classList.add('project-badge');
            projectBadge.textContent = todo.project;
            metaDiv.appendChild(projectBadge);
        }

        // Add tags
        if (todo.tags && todo.tags.length > 0) {
            todo.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.classList.add('tag');
                // Add specific class for common tags
                if (['coding', 'design', 'bugfix', 'feature', 'review'].includes(tag.toLowerCase())) {
                    tagSpan.classList.add(tag.toLowerCase());
                }
                tagSpan.textContent = `#${tag}`;
                metaDiv.appendChild(tagSpan);
            });
        }

        textContainer.appendChild(metaDiv);
        todoContent.appendChild(textContainer);

        // Create actions container
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('todo-actions');

        const completeButton = document.createElement('button');
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
        actionsDiv.appendChild(completeButton);

        const removeButton = document.createElement('button');
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

        todoContent.appendChild(actionsDiv);
        listItem.appendChild(todoContent);
        todoList.appendChild(listItem);
    }
});
