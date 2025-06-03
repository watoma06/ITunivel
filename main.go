package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"sync"
)

// Todo struct represents a single TODO item
type Todo struct {
	ID        int    `json:"id"`
	Text      string `json:"text"`
	Completed bool   `json:"completed"`
}

// todoPayload is used for decoding the request body for new or updated todos
// For updates, Text might be optional if only Completed status is changing, or vice-versa.
// For simplicity, we'll expect both, but real-world might make fields pointers.
type todoPayload struct {
	Text      string `json:"text"`
	Completed *bool  `json:"completed,omitempty"` // Pointer to distinguish between false and not provided
}

var (
	todos  []Todo // In-memory store for TODOs
	nextID int    = 1 // To simulate auto-incrementing ID
	mu     sync.Mutex // For thread-safe access to todos and nextID
)

// mainTodosHandler routes requests for /api/todos based on HTTP method
// This handles GET (all) and POST
func mainTodosHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		getTodosHandler(w, r)
	case http.MethodPost:
		addTodoHandler(w, r)
	default:
		http.Error(w, "Method not allowed for /api/todos", http.StatusMethodNotAllowed)
	}
}

// todoByIDHandler routes requests for /api/todos/{id} based on HTTP method
// This handles GET (one), PUT, and DELETE
func todoByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/todos/")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid TODO ID in path", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet: // Though not explicitly requested, good for consistency
		getTodoByIDHandler(w, r, id)
	case http.MethodPut:
		updateTodoHandler(w, r, id)
	case http.MethodDelete:
		deleteTodoHandler(w, r, id)
	default:
		http.Error(w, "Method not allowed for /api/todos/{id}", http.StatusMethodNotAllowed)
	}
}

// getTodosHandler handles GET requests to /api/todos
func getTodosHandler(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(todos); err != nil {
		log.Printf("Error encoding todos to JSON: %v", err)
		http.Error(w, "Failed to encode todos", http.StatusInternalServerError)
	}
}

// addTodoHandler handles POST requests to /api/todos
func addTodoHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct { // Anonymous struct for this specific payload
		Text string `json:"text"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("Error decoding request body for new todo: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if payload.Text == "" {
		http.Error(w, "Text field is required", http.StatusBadRequest)
		return
	}

	mu.Lock()
	defer mu.Unlock()

	newTodo := Todo{
		ID:        nextID,
		Text:      payload.Text,
		Completed: false,
	}
	nextID++
	todos = append(todos, newTodo)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	if err := json.NewEncoder(w).Encode(newTodo); err != nil {
		log.Printf("Error encoding new todo to JSON: %v", err)
	}
}

// getTodoByIDHandler handles GET requests to /api/todos/{id}
func getTodoByIDHandler(w http.ResponseWriter, r *http.Request, id int) {
	mu.Lock()
	defer mu.Unlock()

	for _, todo := range todos {
		if todo.ID == id {
			w.Header().Set("Content-Type", "application/json")
			if err := json.NewEncoder(w).Encode(todo); err != nil {
				log.Printf("Error encoding todo ID %d to JSON: %v", id, err)
				http.Error(w, "Failed to encode todo", http.StatusInternalServerError)
			}
			return
		}
	}
	http.NotFound(w, r)
}

// updateTodoHandler handles PUT requests to /api/todos/{id}
func updateTodoHandler(w http.ResponseWriter, r *http.Request, id int) {
	var payload todoPayload // Using the shared payload struct

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("Error decoding request body for update: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Basic validation: At least text or completed must be provided for an update.
	// Here, we expect text to be non-empty if provided, and completed to be a valid pointer.
	// If text is empty string from payload, it means client wants to set it to empty.
	// This logic can be more sophisticated based on requirements.

	mu.Lock()
	defer mu.Unlock()

	found := false
	var updatedTodo Todo
	for i, todo := range todos {
		if todo.ID == id {
			// Update fields if provided in payload
			todos[i].Text = payload.Text // Always update text from payload
			if payload.Completed != nil { // Only update completed if it was in the payload
				todos[i].Completed = *payload.Completed
			}
			updatedTodo = todos[i]
			found = true
			break
		}
	}

	if !found {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(updatedTodo); err != nil {
		log.Printf("Error encoding updated todo ID %d to JSON: %v", id, err)
		http.Error(w, "Failed to encode updated todo", http.StatusInternalServerError)
	}
}

// deleteTodoHandler handles DELETE requests to /api/todos/{id}
func deleteTodoHandler(w http.ResponseWriter, r *http.Request, id int) {
	mu.Lock()
	defer mu.Unlock()

	found := false
	for i, todo := range todos {
		if todo.ID == id {
			// Remove the todo by slicing: todos = append(todos[:i], todos[i+1:]...)
			todos = append(todos[:i], todos[i+1:]...)
			found = true
			break
		}
	}

	if !found {
		http.NotFound(w, r)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func main() {
	mu.Lock()
	if len(todos) == 0 {
		todos = append(todos, Todo{ID: nextID, Text: "Learn Go", Completed: false}); nextID++
		todos = append(todos, Todo{ID: nextID, Text: "Build a TODO app", Completed: true}); nextID++
		todos = append(todos, Todo{ID: nextID, Text: "Test an item", Completed: false}); nextID++
	}
	mu.Unlock()

	// Main routing logic
	http.HandleFunc("/api/todos", mainTodosHandler) // For GET all and POST
	http.HandleFunc("/api/todos/", todoByIDHandler) // For GET one, PUT, DELETE by ID

	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)

	log.Println("Starting server on :8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Could not start server: %s\n", err.Error())
	}
}
