export function getTodos() {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
}

export function saveTodos(todos) {
    localStorage.setItem('todos', JSON.stringify(todos));
}

export function saveTodo(todo) {
    const todos = getTodos();
    todos.push(todo);
    saveTodos(todos);
}

export function updateTodo(id, updates) {
    const todos = getTodos().map(t => t.id == id ? { ...t, ...updates } : t);
    saveTodos(todos);
}

export function deleteTodo(id) {
    const todos = getTodos().filter(t => t.id != id);
    saveTodos(todos);
}

export function loadTodos(sortFunc = null) {
    const todos = getTodos();
    if (sortFunc) {
        sortFunc(todos);
    }
    return todos;
}
