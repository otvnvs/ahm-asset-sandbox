<template>
  <div class="todo-container">
    <header class="todo-header">
      <h1>Task Manager</h1>
      <p class="todo-stats">{{ remainingTasks }} of {{ todos.length }} remaining</p>
    </header>

    <!-- Input Form -->
    <form @submit.prevent="addTodo" class="todo-form">
      <input 
        v-model.trim="newTodoText" 
        type="text" 
        placeholder="Add a new task..." 
        maxlength="100"
        aria-label="New todo text"
      />
      <button type="submit" :disabled="!newTodoText">Add</button>
    </form>

    <!-- Filters -->
    <div class="todo-filters" v-if="todos.length > 0">
      <button 
        v-for="filter in ['all', 'active', 'completed']" 
        :key="filter"
        :class="{ active: currentFilter === filter }"
        @click="currentFilter = filter"
      >
        {{ filter }}
      </button>
    </div>

    <!-- Todo List -->
    <transition-group name="list" tag="ul" class="todo-list">
      <li 
        v-for="todo in filteredTodos" 
        :key="todo.id" 
        :class="{ completed: todo.completed }"
        class="todo-item"
      >
        <label class="todo-checkbox-label">
          <input 
            type="checkbox" 
            v-model="todo.completed" 
            @change="saveTodos"
          />
          <span class="custom-checkbox"></span>
          <span class="todo-text">{{ todo.text }}</span>
        </label>
        <button 
          @click="removeTodo(todo.id)" 
          class="delete-btn" 
          aria-label="Delete task"
        >
          &times;
        </button>
      </li>
    </transition-group>

    <!-- Empty State -->
    <div v-if="filteredTodos.length === 0" class="empty-state">
      <p>{{ emptyStateMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// State
const todos = ref([])
const newTodoText = ref('')
const currentFilter = ref('all')

// Fetch data on load
onMounted(() => {
  const savedTodos = localStorage.getItem('vue-todos')
  if (savedTodos) {
    try {
      todos.value = JSON.parse(savedTodos)
    } catch (e) {
      localStorage.removeItem('vue-todos')
    }
  }
})

// Save helper (also triggered by deep watch)
const saveTodos = () => {
  localStorage.setItem('vue-todos', JSON.stringify(todos.value))
}

// Watch todos deeply to save on status changes automatically
watch(todos, () => {
  saveTodos()
}, { deep: true })

// Methods
const addTodo = () => {
  if (!newTodoText.value) return
  
  todos.value.unshift({
    id: Date.now(),
    text: newTodoText.value,
    completed: false
  })
  
  newTodoText.value = ''
}

const removeTodo = (id) => {
  todos.value = todos.value.filter(todo => todo.id !== id)
}

// Computed
const remainingTasks = computed(() => {
  return todos.value.filter(todo => !todo.completed).length
})

const filteredTodos = computed(() => {
  if (currentFilter.value === 'active') {
    return todos.value.filter(todo => !todo.completed)
  }
  if (currentFilter.value === 'completed') {
    return todos.value.filter(todo => todo.completed)
  }
  return todos.value
})

const emptyStateMessage = computed(() => {
  if (todos.value.length === 0) return 'No tasks yet. Add one above!'
  if (currentFilter.value === 'active') return 'No active tasks!'
  if (currentFilter.value === 'completed') return 'No completed tasks yet!'
  return 'No tasks found.'
})
</script>

<style scoped>
/* Dark Theme Variables */
.todo-container {
  --bg-primary: #121212;
  --bg-surface: #1e1e1e;
  --bg-input: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-muted: #a0a0a0;
  --accent: #bb86fc;
  --accent-hover: #9a66d4;
  --danger: #cf6679;
  --border-radius: 12px;
  --transition: all 0.2s ease;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  margin: 2rem auto;
  padding: 1.5rem;
  background-color: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  box-sizing: border-box;
}

/* Header */
.todo-header {
  margin-bottom: 1.5rem;
  text-align: center;
}
.todo-header h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.5px;
}
.todo-stats {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

/* Form Layout */
.todo-form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.todo-form input {
  flex: 1;
  padding: 0.8rem 1rem;
  background-color: var(--bg-input);
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  color: var(--text-primary);
  font-size: 1rem;
  outline: none;
  transition: var(--transition);
}
.todo-form input:focus {
  border-color: var(--accent);
}
.todo-form button {
  padding: 0.8rem 1.5rem;
  background-color: var(--accent);
  color: #000000;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: var(--transition);
}
.todo-form button:hover:not(:disabled) {
  background-color: var(--accent-hover);
}
.todo-form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Filter Tabs */
.todo-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.todo-filters button {
  flex: 1;
  padding: 0.5rem;
  background: none;
  border: 1px solid var(--bg-input);
  border-radius: 6px;
  color: var(--text-muted);
  text-transform: capitalize;
  font-size: 0.85rem;
  cursor: pointer;
  transition: var(--transition);
}
.todo-filters button.active, .todo-filters button:hover {
  background-color: var(--bg-input);
  color: var(--text-primary);
  border-color: var(--text-muted);
}

/* List Items */
.todo-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1rem;
  background-color: var(--bg-input);
  border-radius: var(--border-radius);
  margin-bottom: 0.5rem;
  transition: var(--transition);
}
.todo-item.completed {
  opacity: 0.6;
}
.todo-checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  width: 100%;
  position: relative;
}
.todo-checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}
/* Custom Checkbox Design */
.custom-checkbox {
  height: 20px;
  width: 20px;
  background-color: transparent;
  border: 2px solid var(--text-muted);
  border-radius: 6px;
  flex-shrink: 0;
  position: relative;
  transition: var(--transition);
}
.todo-checkbox-label input:checked ~ .custom-checkbox {
  background-color: var(--accent);
  border-color: var(--accent);
}
.custom-checkbox:after {
  content: "";
  position: absolute;
  display: none;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid #000;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.todo-checkbox-label input:checked ~ .custom-checkbox:after {
  display: block;
}
.todo-text {
  font-size: 1rem;
  word-break: break-word;
  user-select: none;
  transition: var(--transition);
}
.todo-item.completed .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Delete Button */
.delete-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0 0.5rem;
  line-height: 1;
  transition: var(--transition);
}
.delete-btn:hover {
  color: var(--danger);
}

/* Empty State */
.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 2rem 0;
  font-style: italic;
}

/* List Transitions */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

/* Responsive Micro-adjustments for Mobile Screens */
@media (max-width: 480px) {
  .todo-container {
    margin: 0;
    min-height: 100vh;
    border-radius: 0;
    padding: 1rem;
  }
  .todo-header h1 {
    font-size: 1.6rem;
  }
  .todo-form input, .todo-form button {
    padding: 0.75rem;
  }
}
.todo-container {
  --bg-primary: #121212;
  --bg-surface: #1e1e1e;
  --bg-input: #2d2d2d;
  --text-primary: #e0e0e0;
  --text-muted: #a0a0a0;
  --accent: #bb86fc;
  --accent-hover: #9a66d4;
  --danger: #cf6679;
  --border-radius: 12px;
  --transition: all 0.2s ease;

  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  
  /* Changed lines for full-screen layout */
  width: 100vw;
  min-height: 100vh;
  margin: 0;
  padding: 2rem;
  
  background-color: var(--bg-surface);
  color: var(--text-primary);
  box-sizing: border-box;
}

</style>

