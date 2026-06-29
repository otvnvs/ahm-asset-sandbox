<template>
  <div class="storage-container">
    <!-- ================= MAIN VIEW ================= -->
    <div v-if="currentView === 'list'">
      <header class="storage-header">
        <h1>Local Storage Browser</h1>
        <p class="storage-stats">{{ items.length }} total keys found</p>
      </header>

      <!-- Action Controls (Export / Import) -->
      <div class="action-bar">
        <button @click="exportAllData" class="action-btn">Export Data</button>
        <label class="action-btn import-label">
          Import Data
          <input type="file" accept=".json" @click="importData" style="display: none;" />
        </label>
      </div>

      <!-- Add New Key Form -->
	<!--
      <form @submit.prevent="createNewKey" class="storage-form">
        <div class="form-inputs">
          <input 
            v-model.trim="newKeyName" 
            type="text" 
            placeholder="New key name..." 
            maxlength="100" 
            aria-label="New Key Name"
          />
        </div>
        <button type="submit" :disabled="!newKeyName">Create Key</button>
      </form>
	-->

      <!-- Search Field (Filters strictly by Key Name) -->
      <div class="storage-controls" v-if="items.length > 0 || searchQuery">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search keys..." 
          class="search-input"
        />
      </div>

      <!-- Storage List -->
      <transition-group name="list" tag="ul" class="storage-list">
        <li 
          v-for="item in filteredItems" 
          :key="item.key" 
          class="storage-item"
          @click="navigateToDetails(item)"
        >
          <div class="storage-content">
            <span class="custom-indicator"></span>
            <div class="storage-text-group">
              <span class="storage-key">{{ item.key }}</span>
              <span class="storage-value">{{ formatSize(item.size) }}</span>
            </div>
          </div>
          <button 
            @click.stop="removeItem(item.key)" 
            class="delete-btn" 
            aria-label="Delete key"
          >
            &times;
          </button>
        </li>
      </transition-group>

      <!-- Empty State -->
      <div v-if="filteredItems.length === 0" class="empty-state">
        <p>{{ emptyStateMessage }}</p>
      </div>
    </div>

    <!-- ================= DETAILS & EDIT VIEW ================= -->
    <div v-else-if="currentView === 'details' && selectedItem">
      <header class="storage-header">
        <button @click="backToList" class="back-btn">&larr; Back to list</button>
        <h1 class="details-title">{{ selectedItem.key }}</h1>
        <p class="storage-stats">Size: {{ formatSize(selectedItem.size) }}</p>
      </header>

      <!-- JSON Workspace -->
      <div class="json-workspace">
        <div v-if="!isEditingMode" class="json-display-wrapper">
          <pre class="json-display"><code>{{ formattedJson }}</code></pre>
        </div>
        <div v-else class="json-edit-wrapper">
          <textarea 
            v-model="editingTextValue" 
            class="json-textarea"
            placeholder="Enter valid JSON or string value..."
          ></textarea>
          <p v-if="jsonError" class="error-text">{{ jsonError }}</p>
        </div>
      </div>

      <!-- Form Mode Switches / Actions -->
      <div class="details-actions">
        <template v-if="!isEditingMode">
          <button @click="enterEditMode" class="edit-toggle-btn">Edit JSON</button>
	  <!--
          <button @click="clearAllStorage" class="clear-all-btn">Clear All Storage</button>
	  -->
        </template>
        <template v-else>
          <button @click="saveJsonEdits" class="save-btn">Save Changes</button>
          <button @click="exitEditMode" class="cancel-btn">Cancel</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// View management state
const currentView = ref('list') // 'list' or 'details'
const selectedItem = ref(null)

// Core database state
const items = ref([])
const searchQuery = ref('')
const newKeyName = ref('')

// Editing engine state
const isEditingMode = ref(false)
const editingTextValue = ref('')
const jsonError = ref('')

// Measures exact byte dimensions matching UTF-16 strings
const getByteSize = (str) => {
  return str ? new Blob([str]).size : 0
}

// Scans local environment structures
const refreshStorage = () => {
  const allItems = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const value = localStorage.getItem(key)
    allItems.push({ 
      key, 
      value,
      size: getByteSize(value)
    })
  }
  items.value = allItems.sort((a, b) => a.key.localeCompare(b.key))
  
  // Keep current active selected object synchronized with raw alterations
  if (selectedItem.value) {
    const updated = items.value.find(i => i.key === selectedItem.value.key)
    if (updated) {
      selectedItem.value = updated
    } else {
      backToList()
    }
  }
}

onMounted(() => {
  refreshStorage()
  window.addEventListener('storage', refreshStorage)
})

// Formatting strings to structured scale limits
const formatSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Creating completely blank fresh records
const createNewKey = () => {
  if (!newKeyName.value) return
  if (localStorage.getItem(newKeyName.value) !== null) {
    alert('Key already exists!')
    return
  }
  localStorage.setItem(newKeyName.value, '{}')
  refreshStorage()
  newKeyName.value = ''
}

const removeItem = (key) => {
  localStorage.removeItem(key)
  refreshStorage()
}

const clearAllStorage = () => {
  if (confirm('Are you sure you want to clear all local storage keys entirely?')) {
    localStorage.clear()
    refreshStorage()
  }
}

// Dynamic display filtering properties
const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value
  const query = searchQuery.value.toLowerCase()
  return items.value.filter(item => item.key.toLowerCase().includes(query))
})

const emptyStateMessage = computed(() => {
  if (items.value.length === 0) return 'Local Storage is completely empty!'
  return 'No matching keys found.'
})

// Navigation hooks
const navigateToDetails = (item) => {
  selectedItem.value = item
  currentView.value = 'details'
  exitEditMode()
}

const backToList = () => {
  currentView.value = 'list'
  selectedItem.value = null
}

// Pretty prints complex text variants or strings safely
const formattedJson = computed(() => {
  if (!selectedItem.value) return ''
  try {
    const parsed = JSON.parse(selectedItem.value.value)
    return JSON.stringify(parsed, null, 2)
  } catch (e) {
    return selectedItem.value.value // fallback if text isn't JSON
  }
})

// Detail View Edit Management
const enterEditMode = () => {
  isEditingMode.value = true
  try {
    const parsed = JSON.parse(selectedItem.value.value)
    editingTextValue.value = JSON.stringify(parsed, null, 2)
  } catch (e) {
    editingTextValue.value = selectedItem.value.value
  }
  jsonError.value = ''
}

const exitEditMode = () => {
  isEditingMode.value = false
  editingTextValue.value = ''
  jsonError.value = ''
}

const saveJsonEdits = () => {
  let finalValue = editingTextValue.value
  jsonError.value = ''

  // Enforce JSON validation if it looks like an object/array
  if (finalValue.trim().startsWith('{') || finalValue.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(finalValue)
      finalValue = JSON.stringify(parsed)
    } catch (e) {
      jsonError.value = 'Invalid JSON structure: ' + e.message
      return
    }
  }

  localStorage.setItem(selectedItem.value.key, finalValue)
  refreshStorage()
  isEditingMode.value = false
}

// Export Engine
//const exportAllData = () => {
//  const exportPayload = {}
//  for (let i = 0; i < localStorage.length; i++) {
//    const key = localStorage.key(i)
//    const val = localStorage.getItem(key)
//    try {
//      exportPayload[key] = JSON.parse(val)
//    } catch (e) {
//      exportPayload[key] = val
//    }
//  }
//
//  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' })
//  const url = URL.createObjectURL(blob)
//  const a = document.createElement('a')
//  a.href = url
//  a.download = `localstorage-dump-${Date.now()}.json`
//  document.body.appendChild(a)
//  a.click()
//  document.body.removeChild(a)
//  URL.revokeObjectURL(url)
//}
const exportAllData = () => {
  const exportPayload = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    const val = localStorage.getItem(key)
    try {
      exportPayload[key] = JSON.parse(val)
    } catch (e) {
      exportPayload[key] = val
    }
  }

  const jsonString = JSON.stringify(exportPayload, null, 2);

  // Send the payload via a custom header to your native virtual host
  fetch('/api/app/export-localstorage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Export-Data': encodeURIComponent(jsonString) // Safely handles spaces, quotes, and brackets
    }
  })
  .then(response => {
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
  })
  .then(data => {
  alert(data.message);
    console.log('Export succeeded:', data.message);
  })
  .catch(error => {
  alert(error);
    console.error('Export failed:', error);
  });
}


// Import Engine
//const importData = (event) => {
//  const file = event.target.files[0]
//  if (!file) return
//
//  const reader = new FileReader()
//  reader.onload = (e) => {
//    try {
//      const importedObj = JSON.parse(e.target.result)
//      if (typeof importedObj !== 'object' || importedObj === null) {
//        throw new Error('Root structure must be a JSON Object')
//      }
//
//      if (confirm('Import data? This will overwrite items with matching keys.')) {
//        Object.keys(importedObj).forEach(key => {
//          const value = importedObj[key]
//          const stringified = typeof value === 'object' ? JSON.stringify(value) : String(value)
//          localStorage.setItem(key, stringified)
//        })
//        refreshStorage()
//        alert('Storage database imported successfully!')
//      }
//    } catch (err) {
//      alert('Error parsing import bundle: ' + err.message)
//    }
//  }
//  reader.readAsText(file)
//  event.target.value = '' // Reset tracking file input target values
//}
const importData = () => {
  // Make a GET request to your virtual Android API endpoint
  fetch('/api/app/import-localstorage', {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => { throw new Error(err.message || 'File not found') });
    }
    return response.json();
  })
  .then(importedObj => {
    if (typeof importedObj !== 'object' || importedObj === null) {
      throw new Error('Root structure must be a JSON Object');
    }

    if (confirm('Import data from ahm-localstorage-dum.json? This will overwrite items with matching keys.')) {
      Object.keys(importedObj).forEach(key => {
        const value = importedObj[key];
        const stringified = typeof value === 'object' ? JSON.stringify(value) : String(value);
        localStorage.setItem(key, stringified);
      });
      
      // Call your existing view refresh helper methods here
      if (typeof refreshStorage === 'function') refreshStorage();
      alert('Storage database imported successfully!');
    }
  })
  .catch(err => {
    alert('Import failed: ' + err.message);
  });
}

</script>

<style scoped>
.storage-container {
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
  
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;width: 100vw;min-height: 100vh;margin: 0;padding: 2rem;background-color: var(--bg-surface);color: var(--text-primary);box-sizing: border-box;}.storage-header {margin-bottom: 1.5rem;text-align: center;position: relative;}.storage-header h1 {margin: 0 0 0.5rem 0;font-size: 1.8rem;font-weight: 700;letter-spacing: -0.5px;}.details-title {color: var(--accent);word-break: break-all;padding: 0 1rem;}.storage-stats {margin: 0;color: var(--text-muted);font-size: 0.9rem;}.action-bar {display: flex;gap: 0.5rem;margin-bottom: 1.5rem;}.action-btn {flex: 1;padding: 0.6rem;background-color: var(--bg-input);border: 1px solid var(--accent);border-radius: var(--border-radius);color: var(--accent);font-weight: 600;font-size: 0.9rem;cursor: pointer;text-align: center;transition: var(--transition);}.action-btn:hover {background-color: var(--accent);color: #000000;}.import-label {display: block;cursor: pointer;}.storage-form {display: flex;gap: 0.5rem;margin-bottom: 1.5rem;}.form-inputs {flex: 1;}.storage-form input {width: 100%;padding: 0.8rem 1rem;background-color: var(--bg-input);border: 1px solid transparent;border-radius: var(--border-radius);color: var(--text-primary);font-size: 1rem;outline: none;box-sizing: border-box;transition: var(--transition);}.storage-form input:focus {border-color: var(--accent);}.storage-form button {padding: 0.8rem 1.5rem;background-color: var(--accent);color: #000000;border: none;border-radius: var(--border-radius);font-weight: 600;font-size: 1rem;cursor: pointer;transition: var(--transition);}.storage-form button:hover:not(:disabled) {background-color: var(--accent-hover);}.storage-form button:disabled {opacity: 0.5;cursor: not-allowed;}.storage-controls {margin-bottom: 1rem;}.search-input {width: 100%;padding: 0.6rem 1rem;background-color: transparent;border: 1px solid var(--bg-input);border-radius: 6px;color: var(--text-primary);font-size: 0.9rem;outline: none;box-sizing: border-box;transition: var(--transition);}.search-input:focus {border-color: var(--text-muted);}.storage-list {list-style: none;padding: 0;margin: 0;}.storage-item {display: flex;align-items: center;justify-content: space-between;padding: 0.8rem 1rem;background-color: var(--bg-input);border-radius: var(--border-radius);margin-bottom: 0.5rem;cursor: pointer;transition: var(--transition);}.storage-item:hover {border-color: var(--text-muted);transform: translateY(-1px);}.storage-content {display: flex;align-items: center;gap: 0.75rem;width: calc(100% - 30px);}.custom-indicator {height: 14px;width: 14px;background-color: transparent;border: 2px solid var(--accent);border-radius: 50%;flex-shrink: 0;}.storage-text-group {display: flex;flex-direction: column;gap: 0.15rem;overflow: hidden;}.storage-key {font-size: 1rem;font-weight: 600;color: var(--text-primary);white-space: nowrap;overflow: hidden;text-overflow: ellipsis;}.storage-value {font-size: 0.85rem;color: var(--text-muted);}.delete-btn {background: none;border: none;color: var(--text-muted);font-size: 1.5rem;cursor: pointer;padding: 0 0.5rem;line-height: 1;transition: var(--transition);}.delete-btn:hover {color: var(--danger);}/* Details Panel Styling */.back-btn {position: absolute;left: 0;top: 4px;background: none;border: none;color: var(--accent);cursor: pointer;font-size: 0.95rem;font-weight: 600;}.back-btn:hover {text-decoration: underline;}.json-workspace {margin: 1.5rem 0;background-color: var(--bg-input);border-radius: var(--border-radius);padding: 1rem;min-height: 250px;}.json-display-wrapper {overflow-x: auto;}.json-display {margin: 0;font-family: 'Courier New', Courier, monospace;font-size: 0.9rem;color: #a8ffb2;white-space: pre-wrap;word-break: break-all;}.json-edit-wrapper {display: flex;flex-direction: column;height: 100%;}.json-textarea {width: 100%;min-height: 300px;background-color: #121212;color: #e0e0e0;border: 1px solid var(--text-muted);border-radius: 6px;padding: 0.8rem;font-family: 'Courier New', Courier, monospace;font-size: 0.9rem;outline: none;resize: vertical;box-sizing: border-box;}.json-textarea:focus {border-color: var(--accent);}.error-text {color: var(--danger);font-size: 0.85rem;margin: 0.5rem 0 0 0;}.details-actions {display: flex;flex-direction: column;gap: 0.5rem;}.details-actions button {width: 100%;padding: 0.8rem;border-radius: var(--border-radius);font-size: 1rem;font-weight: 600;cursor: pointer;border: none;transition: var(--transition);}.edit-toggle-btn, .save-btn {background-color: var(--accent);color: #000000;}.edit-toggle-btn:hover, .save-btn:hover {background-color: var(--accent-hover);}.clear-all-btn {background-color: transparent;border: 1px solid var(--danger) !important;color: var(--danger);}.clear-all-btn:hover {background-color: var(--danger);color: #000000;}.cancel-btn {background-color: transparent;border: 1px solid var(--text-muted) !important;color: var(--text-primary);}.cancel-btn:hover {background-color: var(--bg-input);}.empty-state {text-align: center;color: var(--text-muted);padding: 2rem 0;font-style: italic;}.list-enter-active, .list-leave-active {transition: all 0.3s ease;}.list-enter-from, .list-leave-to {opacity: 0;transform: translateX(-20px);}@media(max-width: 480px) {.storage-container {padding: 1rem;}.storage-header h1 {font-size: 1.5rem;}.back-btn {position: static;display: block;margin-bottom: 0.5rem;}.storage-form {flex-direction: column;}.storage-form button {padding: 0.75rem;}}</style>
