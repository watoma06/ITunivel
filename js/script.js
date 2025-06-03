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
    
    // Initialize enhanced features
    initializeEnhancedFeatures();

    // Add event listeners for filtering and sorting
    projectFilter.addEventListener('change', () => {
        filterTodos();
        updateEmptyState();
    });
    tagFilter.addEventListener('input', debounce(() => {
        filterTodos();
        updateEmptyState();
    }, 300));
    priorityFilter.addEventListener('change', () => {
        filterTodos();
        updateEmptyState();
    });
    sortFilter.addEventListener('change', () => {
        filterTodos();
        updateEmptyState();
    });

    // Dark mode toggle with accessibility
    darkModeToggle.addEventListener('click', () => {
        toggleDarkMode();
        const isDark = document.body.classList.contains('dark-mode');
        darkModeToggle.setAttribute('aria-pressed', isDark.toString());
        darkModeToggle.innerHTML = `<span aria-hidden="true">${isDark ? '☀️' : '🌙'}</span>`;
        announceToScreenReader(`${isDark ? 'ダーク' : 'ライト'}モードに切り替えました`);
    });

    // Action buttons with enhanced feedback
    exportBtn.addEventListener('click', () => {
        exportTodos();
        announceToScreenReader('タスクリストをエクスポートしました');
    });
    
    clearCompletedBtn.addEventListener('click', () => {
        const completedCount = todos.filter(todo => todo.completed).length;
        if (completedCount > 0) {
            clearCompletedTodos();
            announceToScreenReader(`${completedCount}個の完了済みタスクを削除しました`);
        } else {
            announceToScreenReader('削除する完了済みタスクがありません');
        }
    });
    
    markAllCompleteBtn.addEventListener('click', () => {
        const visibleTodos = getFilteredTodos();
        const incompleteCount = visibleTodos.filter(todo => !todo.completed).length;
        if (incompleteCount > 0) {
            markAllComplete();
            announceToScreenReader(`${incompleteCount}個のタスクを完了にしました`);
        } else {
            announceToScreenReader('完了にするタスクがありません');
        }
    });    addTodoBtn.addEventListener('click', () => {
        const todoText = todoInput.value.trim();
        
        // Enhanced validation
        if (!validateTodoInput(todoText)) {
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

    // Enhanced Accessibility and PWA Support
// Screen Reader Announcements
function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Focus Management
function manageFocus() {
    // Skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.focus();
                mainContent.scrollIntoView();
            }
        });
    }
    
    // Focus trap for modals (if any)
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    // Enhanced keyboard navigation
    document.addEventListener('keydown', (e) => {
        // Quick add todo with Ctrl+Enter
        if (e.ctrlKey && e.key === 'Enter' && document.activeElement === todoInput) {
            e.preventDefault();
            addTodoBtn.click();
        }
        
        // Quick filter with Ctrl+F
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            tagFilter.focus();
        }
        
        // Dark mode toggle with Ctrl+D
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            darkModeToggle.click();
        }
        
        // Export with Ctrl+E
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportBtn.click();
        }
    });
}

// PWA Installation Support
let deferredPrompt;
let installButton;

function initializePWA() {
    // Create install button
    installButton = document.createElement('button');
    installButton.textContent = 'アプリをインストール';
    installButton.className = 'action-btn';
    installButton.style.display = 'none';
    installButton.setAttribute('aria-label', 'このアプリをデバイスにインストール');
    
    const actionBar = document.querySelector('.action-bar');
    if (actionBar) {
        actionBar.appendChild(installButton);
    }
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA: Install prompt available');
        e.preventDefault();
        deferredPrompt = e;
        installButton.style.display = 'block';
        announceToScreenReader('アプリのインストールが利用可能になりました');
    });
    
    // Install button click handler
    installButton.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('PWA: Install outcome:', outcome);
            
            if (outcome === 'accepted') {
                announceToScreenReader('アプリがインストールされました');
            }
            
            deferredPrompt = null;
            installButton.style.display = 'none';
        }
    });
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
        console.log('PWA: App was installed');
        announceToScreenReader('アプリのインストールが完了しました');
        installButton.style.display = 'none';
    });
}

// Online/Offline Status
function initializeOfflineSupport() {
    const onlineStatus = document.createElement('div');
    onlineStatus.className = 'online-status sr-only';
    onlineStatus.setAttribute('aria-live', 'assertive');
    document.body.appendChild(onlineStatus);
    
    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        onlineStatus.textContent = isOnline ? 'オンラインです' : 'オフラインです';
        
        // Visual indicator
        document.body.classList.toggle('offline', !isOnline);
        
        if (!isOnline) {
            announceToScreenReader('インターネット接続が切断されました。データは保存されています。', 'assertive');
        } else {
            announceToScreenReader('インターネット接続が復旧しました', 'polite');
        }
    }
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Initial status
    updateOnlineStatus();
}

// Enhanced Error Handling with Accessibility
function showAccessibleError(message, element = null) {
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'assertive');
    
    // Position near the problematic element
    if (element) {
        element.parentNode.insertBefore(errorDiv, element.nextSibling);
        element.setAttribute('aria-invalid', 'true');
        element.setAttribute('aria-describedby', errorDiv.id = 'error-' + Date.now());
    } else {
        document.body.appendChild(errorDiv);
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
        if (element) {
            element.removeAttribute('aria-invalid');
            element.removeAttribute('aria-describedby');
        }
    }, 5000);
    
    // Screen reader announcement
    announceToScreenReader(message, 'assertive');
}

// Enhanced Input Validation
function validateTodoInput(text) {
    if (!text || text.trim().length === 0) {
        showAccessibleError('タスクの内容を入力してください', todoInput);
        todoInput.focus();
        return false;
    }
    
    if (text.length > 500) {
        showAccessibleError('タスクの内容は500文字以内で入力してください', todoInput);
        todoInput.focus();
        return false;
    }
    
    return true;
}

// Gesture Support for Touch Devices
function initializeGestureSupport() {
    let touchStartX = 0;
    let touchStartY = 0;
    const minSwipeDistance = 100;
    
    todoList.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    todoList.addEventListener('touchend', (e) => {
        if (!touchStartX || !touchStartY) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Only proceed if horizontal swipe is dominant
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            const todoItem = e.target.closest('li');
            if (todoItem) {
                const todoId = parseInt(todoItem.dataset.todoId);
                
                if (deltaX > 0) {
                    // Right swipe - complete todo
                    toggleComplete(todoId);
                    announceToScreenReader('タスクを完了しました');
                } else {
                    // Left swipe - delete todo
                    if (confirm('このタスクを削除しますか？')) {
                        removeTodo(todoId);
                        announceToScreenReader('タスクを削除しました');
                    }
                }
            }
        }
        
        touchStartX = 0;
        touchStartY = 0;
    }, { passive: true });
}

// Performance Optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// Virtual Scrolling for Large Lists (if needed)
function initializeVirtualScrolling() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Load more items if needed
                console.log('Todo item is visible:', entry.target);
            }
        });
    });
    
    // Observe todo items
    document.querySelectorAll('#todo-list li').forEach(item => {
        observer.observe(item);
    });
}

// Initialize all accessibility and PWA features
function initializeEnhancedFeatures() {
    manageFocus();
    initializePWA();
    initializeOfflineSupport();
    initializeGestureSupport();
    
    // Add debounced filter function
    const debouncedFilter = debounce(filterTodos, 300);
    tagFilter.addEventListener('input', debouncedFilter);
    
    // Enhanced form validation
    todoInput.addEventListener('blur', () => {
        if (todoInput.value.trim() && !validateTodoInput(todoInput.value)) {
            todoInput.focus();
        }
    });
    
    // Update empty state
    updateEmptyState();
}

// Update empty state for better UX
function updateEmptyState() {
    const emptyState = document.getElementById('empty-state');
    const visibleTodos = document.querySelectorAll('#todo-list li:not([style*="display: none"])');
    
    if (emptyState) {
        if (visibleTodos.length === 0) {
            emptyState.textContent = '現在表示するタスクがありません';
            emptyState.className = 'empty-state';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
        }
    }
}
});
