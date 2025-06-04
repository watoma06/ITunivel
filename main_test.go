package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Helper function to reset the state for each test
func resetState() {
	mu.Lock()
	defer mu.Unlock()
	todos = []Todo{} // Clear existing todos
	nextID = 1       // Reset ID counter
	// Add initial data for consistent testing environment
	todos = append(todos, Todo{ID: nextID, Text: "Initial Task 1", Completed: false})
	nextID++
	todos = append(todos, Todo{ID: nextID, Text: "Initial Task 2", Completed: true})
	nextID++
}

func TestGetTodosHandler(t *testing.T) {
	resetState()
	req, err := http.NewRequest("GET", "/api/todos", nil)
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(mainTodosHandler) // Use the main router for /api/todos
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusOK)
	}

	var returnedTodos []Todo
	if err := json.NewDecoder(rr.Body).Decode(&returnedTodos); err != nil {
		t.Fatalf("Could not decode response: %v", err)
	}

	mu.Lock() // Lock for reading global 'todos'
	if len(returnedTodos) != len(todos) {
		t.Errorf("handler returned unexpected number of todos: got %v want %v", len(returnedTodos), len(todos))
	}
	mu.Unlock()
}

func TestAddTodoHandler(t *testing.T) {
	resetState()
	payload := []byte(`{"text":"New Test TODO"}`)
	req, err := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(payload))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(mainTodosHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusCreated {
		t.Errorf("handler returned wrong status code: got %v want %v", status, http.StatusCreated)
	}

	var createdTodo Todo
	if err := json.NewDecoder(rr.Body).Decode(&createdTodo); err != nil {
		t.Fatalf("Could not decode response: %v", err)
	}

	if createdTodo.Text != "New Test TODO" {
		t.Errorf("handler returned unexpected todo text: got %v want %v", createdTodo.Text, "New Test TODO")
	}
	if createdTodo.Completed != false {
		t.Errorf("handler returned unexpected completed status: got %v want %v", createdTodo.Completed, false)
	}
	mu.Lock()
	if len(todos) != 3 { // 2 initial + 1 new
		t.Errorf("todo was not added to the list, count: got %v want %v", len(todos), 3)
	}
	mu.Unlock()
}

func TestAddTodoHandlerInvalidJSON(t *testing.T) {
	resetState()
	// Intentionally malformed JSON payload
	payload := []byte(`{"text":"Missing quote}`)
	req, err := http.NewRequest("POST", "/api/todos", bytes.NewBuffer(payload))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(mainTodosHandler)
	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code for invalid JSON: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestGetTodoByIDHandler(t *testing.T) {
	resetState()
	// Test getting an existing TODO
	req, err := http.NewRequest("GET", "/api/todos/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	rr := httptest.NewRecorder()
	http.DefaultServeMux.ServeHTTP(rr, req) // Using DefaultServeMux as setup in main() for path parsing

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code for existing ID: got %v want %v", status, http.StatusOK)
	}
	var todo Todo
	if err := json.NewDecoder(rr.Body).Decode(&todo); err != nil {
		t.Fatalf("Could not decode response for existing ID: %v", err)
	}
	if todo.ID != 1 || todo.Text != "Initial Task 1" {
		t.Errorf("handler returned incorrect TODO data: got %+v", todo)
	}

	// Test getting a non-existent TODO
	reqNonExistent, err := http.NewRequest("GET", "/api/todos/999", nil)
	if err != nil {
		t.Fatal(err)
	}
	rrNonExistent := httptest.NewRecorder()
	http.DefaultServeMux.ServeHTTP(rrNonExistent, reqNonExistent)

	if status := rrNonExistent.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code for non-existent ID: got %v want %v", status, http.StatusNotFound)
	}
}

func TestUpdateTodoHandler(t *testing.T) {
	resetState()
	// Test updating an existing TODO
	updatePayload := []byte(`{"text":"Updated Task 1", "completed":true}`)
	reqUpdate, err := http.NewRequest("PUT", "/api/todos/1", bytes.NewBuffer(updatePayload))
	if err != nil {
		t.Fatal(err)
	}
	reqUpdate.Header.Set("Content-Type", "application/json")
	rrUpdate := httptest.NewRecorder()
	http.DefaultServeMux.ServeHTTP(rrUpdate, reqUpdate)

	if status := rrUpdate.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code for update: got %v want %v", status, http.StatusOK)
	}
	var updatedTodo Todo
	if err := json.NewDecoder(rrUpdate.Body).Decode(&updatedTodo); err != nil {
		t.Fatalf("Could not decode response for update: %v", err)
	}
	if updatedTodo.ID != 1 || updatedTodo.Text != "Updated Task 1" || !updatedTodo.Completed {
		t.Errorf("handler did not update TODO correctly: got %+v", updatedTodo)
	}

	// Test updating a non-existent TODO
	reqNonExistent, err := http.NewRequest("PUT", "/api/todos/999", bytes.NewBuffer(updatePayload))
	if err != nil {
		t.Fatal(err)
	}
	reqNonExistent.Header.Set("Content-Type", "application/json")
	rrNonExistent := httptest.NewRecorder()
	http.DefaultServeMux.ServeHTTP(rrNonExistent, reqNonExistent)

	if status := rrNonExistent.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code for non-existent update: got %v want %v", status, http.StatusNotFound)
	}
}

func TestUpdateTodoHandlerInvalidID(t *testing.T) {
	resetState()
	updatePayload := []byte(`{"text":"Updated"}`)
	req, err := http.NewRequest("PUT", "/api/todos/abc", bytes.NewBuffer(updatePayload))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	http.DefaultServeMux.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusBadRequest {
		t.Errorf("handler returned wrong status code for non-numeric ID: got %v want %v", status, http.StatusBadRequest)
	}
}

func TestDeleteTodoHandler(t *testing.T) {
	resetState()
	initialCount := len(todos)

	// Test deleting an existing TODO
	reqDelete, err := http.NewRequest("DELETE", "/api/todos/1", nil)
	if err != nil {
		t.Fatal(err)
	}
	rrDelete := httptest.NewRecorder()
	http.DefaultServeMux.ServeHTTP(rrDelete, reqDelete)

	if status := rrDelete.Code; status != http.StatusNoContent {
		t.Errorf("handler returned wrong status code for delete: got %v want %v", status, http.StatusNoContent)
	}
	mu.Lock()
	if len(todos) != initialCount-1 {
		t.Errorf("TODO was not removed from the list: got count %v want %v", len(todos), initialCount-1)
	}
	// Verify it's actually gone
	for _, todo := range todos {
		if todo.ID == 1 {
			t.Errorf("TODO with ID 1 was found after deletion")
		}
	}
	mu.Unlock()

	// Test deleting a non-existent TODO
	reqNonExistent, err := http.NewRequest("DELETE", "/api/todos/999", nil)
	if err != nil {
		t.Fatal(err)
	}
	rrNonExistent := httptest.NewRecorder()
	http.DefaultServeMux.ServeHTTP(rrNonExistent, reqNonExistent)

	if status := rrNonExistent.Code; status != http.StatusNotFound {
		t.Errorf("handler returned wrong status code for non-existent delete: got %v want %v", status, http.StatusNotFound)
	}
}

// TestMain is needed to correctly register handlers for path matching if not using a dedicated router package
// and relying on DefaultServeMux behavior as implicitly done in main()
// For more complex scenarios, initializing the router used in main() is better.
func TestMain(m *testing.M) {
	// Setup handlers as in main() for tests that rely on path prefix matching
	// This is a simplified way; a real app might have a setupRouter() function.
	http.HandleFunc("/api/todos", mainTodosHandler)
	http.HandleFunc("/api/todos/", todoByIDHandler) // Note the trailing slash for prefix matching

	// Run tests
	m.Run()
}
