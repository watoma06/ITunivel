export function sortTodos(todos, sortBy) {
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
