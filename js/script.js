document.addEventListener('DOMContentLoaded', () => {
    const todoInput = document.getElementById('todo-input');
    const addTodoBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');
    const projectSelect = document.getElementById('project-select');
    const tagsInput = document.getElementById('tags-input');
    const projectFilter = document.getElementById('project-filter');
    const tagFilter = document.getElementById('tag-filter');
    const prioritySelect = document.getElementById('priority-select');
    const priorityFilter = document.getElementById('priority-filter');
    const sortFilter = document.getElementById('sort-filter');
    const deadlineInput = document.getElementById('deadline-input');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const exportBtn = document.getElementById('export-btn');
    const clearCompletedBtn = document.getElementById('clear-completed-btn');
    const markAllCompleteBtn = document.getElementById('mark-all-complete-btn');

    // Load todos and initialize
    loadTodos();
    updateStats();
    initializeDarkMode();

    // Add event listeners for filtering and sorting
    projectFilter.addEventListener('change', filterTodos);
    tagFilter.addEventListener('input', filterTodos);
    priorityFilter.addEventListener('change', filterTodos);
    sortFilter.addEventListener('change', filterTodos);

    // Dark mode toggle
    darkModeToggle.addEventListener('click', toggleDarkMode);

    // Action buttons
    exportBtn.addEventListener('click', exportTodos);
    clearCompletedBtn.addEventListener('click', clearCompletedTodos);
    markAllCompleteBtn.addEventListener('click', markAllComplete);    addTodoBtn.addEventListener('click', () => {
        const todoText = todoInput.value.trim();
        if (todoText === '') {
            alert("TODO text cannot be empty.");
            return;
        }

        // Parse tags from tags input
        const tagsText = tagsInput.value.trim();
        const tags = tagsText ? tagsText.split(/\s+/).filter(tag => tag.startsWith('#')).map(tag => tag.substring(1)) : [];

        // Create new todo with enhanced properties
        const newTodo = {
            id: Date.now(), // Simple ID generation
            text: todoText,
            completed: false,
            project: projectSelect.value,
            tags: tags,
            priority: prioritySelect.value || 'medium',
            deadline: deadlineInput.value || null,
            createdAt: new Date().toISOString()
        };

        // Save to localStorage
        saveTodo(newTodo);
        
        // Add to DOM
        addTodoItemToDOM(newTodo);
        
        // Update statistics
        updateStats();
        
        // Clear inputs
        todoInput.value = '';
        tagsInput.value = '';
        projectSelect.value = '';
        prioritySelect.value = 'medium';
        deadlineInput.value = '';
    });    // Enhanced filtering function
    function filterTodos() {
        const selectedProject = projectFilter.value;
        const searchTag = tagFilter.value.trim().toLowerCase().replace('#', '');
        const selectedPriority = priorityFilter.value;
        const sortBy = sortFilter.value;
        
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            let todos = JSON.parse(savedTodos);
            
            // Apply filters
            const filteredTodos = todos.filter(todo => {
                const projectMatch = !selectedProject || todo.project === selectedProject;
                const tagMatch = !searchTag || (todo.tags && todo.tags.some(tag => 
                    tag.toLowerCase().includes(searchTag)
                ));
                const priorityMatch = !selectedPriority || todo.priority === selectedPriority;
                return projectMatch && tagMatch && priorityMatch;
            });
            
            // Apply sorting
            const sortedTodos = sortTodos(filteredTodos, sortBy);
            renderTodos(sortedTodos);
        }
    }

    // Sorting function
    function sortTodos(todos, sortBy) {
        return todos.sort((a, b) => {
            switch (sortBy) {
                case 'priority':
                    const priorityOrder = { high: 3, medium: 2, low: 1 };
                    return (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
                case 'deadline':
                    if (!a.deadline && !b.deadline) return 0;
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return new Date(a.deadline) - new Date(b.deadline);
                case 'project':
                    return (a.project || '').localeCompare(b.project || '');
                case 'created':
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
    }

    // Statistics update function
    function updateStats() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            const total = todos.length;
            const completed = todos.filter(todo => todo.completed).length;
            const pending = total - completed;
            const overdue = todos.filter(todo => 
                todo.deadline && 
                new Date(todo.deadline) < new Date() && 
                !todo.completed
            ).length;

            document.getElementById('total-tasks').textContent = total;
            document.getElementById('completed-tasks').textContent = completed;
            document.getElementById('pending-tasks').textContent = pending;
            document.getElementById('overdue-tasks').textContent = overdue;
        }
    }

    // Dark mode functions
    function initializeDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️';
        }
    }

    function toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        darkModeToggle.textContent = isDarkMode ? '☀️' : '🌙';
        localStorage.setItem('darkMode', isDarkMode);
    }

    // Action functions
    function exportTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            const dataStr = JSON.stringify(todos, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `todos-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
        }
    }

    function clearCompletedTodos() {
        if (confirm('完了済みのタスクを全て削除しますか？')) {
            const savedTodos = localStorage.getItem('todos');
            if (savedTodos) {
                let todos = JSON.parse(savedTodos);
                todos = todos.filter(todo => !todo.completed);
                localStorage.setItem('todos', JSON.stringify(todos));
                loadTodos();
                updateStats();
            }
        }
    }

    function markAllComplete() {
        if (confirm('全てのタスクを完了にしますか？')) {
            const savedTodos = localStorage.getItem('todos');
            if (savedTodos) {
                let todos = JSON.parse(savedTodos);
                todos = todos.map(todo => ({ ...todo, completed: true }));
                localStorage.setItem('todos', JSON.stringify(todos));
                loadTodos();
                updateStats();
            }
        }
    }

    // Enhanced loadTodos function
    function loadTodos() {
        const savedTodos = localStorage.getItem('todos');
        if (savedTodos) {
            const todos = JSON.parse(savedTodos);
            const sortBy = sortFilter.value || 'created';
            const sortedTodos = sortTodos(todos, sortBy);
            renderTodos(sortedTodos);
        }
    }

    // LocalStorage functions
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
        textContainer.appendChild(textSpan);        // Create meta information (project, tags, priority, deadline)
        const metaDiv = document.createElement('div');
        metaDiv.classList.add('todo-meta');

        // Add project badge
        if (todo.project) {
            const projectBadge = document.createElement('span');
            projectBadge.classList.add('project-badge');
            projectBadge.textContent = todo.project;
            metaDiv.appendChild(projectBadge);
        }

        // Add priority badge
        if (todo.priority) {
            const priorityBadge = document.createElement('span');
            priorityBadge.classList.add('priority-badge', `priority-${todo.priority}`);
            priorityBadge.textContent = todo.priority === 'high' ? '高' : 
                                      todo.priority === 'medium' ? '中' : '低';
            metaDiv.appendChild(priorityBadge);
        }

        // Add deadline info
        if (todo.deadline) {
            const deadlineDiv = document.createElement('div');
            deadlineDiv.classList.add('deadline-info');
            const deadlineDate = new Date(todo.deadline);
            const today = new Date();
            const timeDiff = deadlineDate - today;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            let deadlineText = `📅 ${deadlineDate.toLocaleDateString('ja-JP')}`;
            
            if (daysDiff < 0 && !todo.completed) {
                deadlineDiv.classList.add('deadline-overdue');
                deadlineText += ` (${Math.abs(daysDiff)}日遅れ)`;
            } else if (daysDiff <= 3 && daysDiff >= 0 && !todo.completed) {
                deadlineDiv.classList.add('deadline-soon');
                deadlineText += ` (あと${daysDiff}日)`;
            }
            
            deadlineDiv.textContent = deadlineText;
            metaDiv.appendChild(deadlineDiv);
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
        actionsDiv.classList.add('todo-actions');        const editButton = document.createElement('button');
        editButton.textContent = 'Edit';
        editButton.classList.add('edit-btn');
        editButton.addEventListener('click', () => {
            editTodo(todo.id, textSpan, metaDiv, listItem);
        });
        actionsDiv.appendChild(editButton);        const completeButton = document.createElement('button');
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
            
            // Update statistics
            updateStats();
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
            
            // Update statistics
            updateStats();
        });
        actionsDiv.appendChild(removeButton);todoContent.appendChild(actionsDiv);
        listItem.appendChild(todoContent);
        todoList.appendChild(listItem);
    }

    // Edit todo function
    function editTodo(todoId, textSpan, metaDiv, listItem) {
        const savedTodos = localStorage.getItem('todos');
        if (!savedTodos) return;
        
        const todos = JSON.parse(savedTodos);
        const todo = todos.find(t => t.id == todoId);
        if (!todo) return;

        // Create edit form
        const editForm = document.createElement('div');
        editForm.classList.add('edit-form');
        
        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = todo.text;
        textInput.classList.add('edit-text-input');
          const projectSelect = document.createElement('select');
        projectSelect.classList.add('edit-project-select');
        projectSelect.innerHTML = `
            <option value="">プロジェクトを選択</option>
            <option value="朝岡パック">朝岡パック</option>
            <option value="中部開発">中部開発</option>
            <option value="JA.life">JA.life</option>
            <option value="中村健康院">中村健康院</option>
            <option value="みのボクシングジム">みのボクシングジム</option>
            <option value="みの建築">みの建築</option>
        `;
        projectSelect.value = todo.project || '';
        
        const prioritySelect = document.createElement('select');
        prioritySelect.classList.add('edit-priority-select');
        prioritySelect.innerHTML = `
            <option value="high">優先度: 高</option>
            <option value="medium">優先度: 中</option>
            <option value="low">優先度: 低</option>
        `;
        prioritySelect.value = todo.priority || 'medium';
        
        const deadlineInput = document.createElement('input');
        deadlineInput.type = 'date';
        deadlineInput.value = todo.deadline || '';
        deadlineInput.classList.add('edit-deadline-input');
        
        const tagsInput = document.createElement('input');
        tagsInput.type = 'text';
        tagsInput.value = todo.tags ? todo.tags.map(tag => `#${tag}`).join(' ') : '';
        tagsInput.placeholder = 'タグ (#coding #design)';
        tagsInput.classList.add('edit-tags-input');
        
        const buttonGroup = document.createElement('div');
        buttonGroup.classList.add('edit-button-group');
          const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.classList.add('save-btn');
        saveButton.addEventListener('click', () => {
            const newText = textInput.value.trim();
            if (newText === '') {
                alert("TODO text cannot be empty.");
                return;
            }
            
            const tagsText = tagsInput.value.trim();
            const newTags = tagsText ? tagsText.split(/\s+/).filter(tag => tag.startsWith('#')).map(tag => tag.substring(1)) : [];
            
            const updates = {
                text: newText,
                project: projectSelect.value,
                priority: prioritySelect.value,
                deadline: deadlineInput.value || null,
                tags: newTags
            };
            
            updateTodo(todoId, updates);
            
            // Update DOM
            textSpan.textContent = newText;
            updateMetaDisplay(metaDiv, projectSelect.value, newTags, prioritySelect.value, deadlineInput.value);
            
            // Update statistics
            updateStats();
            
            // Remove edit form and show original content
            editForm.remove();
            textSpan.style.display = 'block';
            metaDiv.style.display = 'flex';
        });
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.classList.add('cancel-btn');
        cancelButton.addEventListener('click', () => {
            editForm.remove();
            textSpan.style.display = 'block';
            metaDiv.style.display = 'flex';
        });
        
        buttonGroup.appendChild(saveButton);
        buttonGroup.appendChild(cancelButton);
          editForm.appendChild(textInput);
        editForm.appendChild(projectSelect);
        editForm.appendChild(prioritySelect);
        editForm.appendChild(deadlineInput);
        editForm.appendChild(tagsInput);
        editForm.appendChild(buttonGroup);
        
        // Hide original content and show edit form
        textSpan.style.display = 'none';
        metaDiv.style.display = 'none';
        textSpan.parentNode.insertBefore(editForm, textSpan);
    }    // Update meta display
    function updateMetaDisplay(metaDiv, project, tags, priority, deadline) {
        metaDiv.innerHTML = '';
        
        if (project) {
            const projectBadge = document.createElement('span');
            projectBadge.classList.add('project-badge');
            projectBadge.textContent = project;
            metaDiv.appendChild(projectBadge);
        }
        
        if (priority) {
            const priorityBadge = document.createElement('span');
            priorityBadge.classList.add('priority-badge', `priority-${priority}`);
            priorityBadge.textContent = priority === 'high' ? '高' : 
                                      priority === 'medium' ? '中' : '低';
            metaDiv.appendChild(priorityBadge);
        }
        
        if (deadline) {
            const deadlineDiv = document.createElement('div');
            deadlineDiv.classList.add('deadline-info');
            const deadlineDate = new Date(deadline);
            const today = new Date();
            const timeDiff = deadlineDate - today;
            const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            let deadlineText = `📅 ${deadlineDate.toLocaleDateString('ja-JP')}`;
            
            if (daysDiff < 0) {
                deadlineDiv.classList.add('deadline-overdue');
                deadlineText += ` (${Math.abs(daysDiff)}日遅れ)`;
            } else if (daysDiff <= 3 && daysDiff >= 0) {
                deadlineDiv.classList.add('deadline-soon');
                deadlineText += ` (あと${daysDiff}日)`;
            }
            
            deadlineDiv.textContent = deadlineText;
            metaDiv.appendChild(deadlineDiv);
        }
        
        if (tags && tags.length > 0) {
            tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.classList.add('tag');
                if (['coding', 'design', 'bugfix', 'feature', 'review'].includes(tag.toLowerCase())) {
                    tagSpan.classList.add(tag.toLowerCase());
                }
                tagSpan.textContent = `#${tag}`;
                metaDiv.appendChild(tagSpan);
            });
        }
    }
});
