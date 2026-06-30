<template>
  <div class="storage-container">
    <header class="storage-header">
      <!-- Back button logic when browsing subfolders -->
      <button v-if="currentPath !== ''" @click="navigateUp" class="back-btn">&larr; Up one level</button>
      <h1>Device File Browser</h1>
      <p class="storage-stats">Working Dir: ~/storage/shared/{{ currentPath }}</p>
    </header>

    <!-- Toolbar Controls -->
    <div class="action-bar">
      <button @click="promptNewDirectory" class="action-btn">New Folder</button>
      <button @click="promptNewFile" class="action-btn">New File</button>
    </div>

    <!-- Active Item Directory Listing -->
    <transition-group name="list" tag="ul" class="storage-list">
      <li v-for="file in filesList" :key="file.name" class="storage-item" @click="handleItemClick(file)">
        <div class="storage-content">
          <!-- Distinct visual indicator for folder vs raw file types -->
          <span :class="['custom-indicator', file.isDirectory ? 'folder-type' : 'file-type']"></span>
          <div class="storage-text-group">
            <span class="storage-key">{{ file.name }}</span>
            <span class="storage-value">
              {{ file.isDirectory ? 'Directory' : formatSize(file.size) }}
            </span>
          </div>
        </div>
        <button @click.stop="deleteFileSystemItem(file)" class="delete-btn" aria-label="Delete item">&times;</button>
      </li>
    </transition-group>

    <!-- Fallback Missing Items View -->
    <div v-if="filesList.length === 0" class="empty-state">
      <p>This directory is completely empty!</p>
    </div>

    <!-- Integrated Inline Raw File Viewer / Editor Overlays -->
    <div v-if="activeFile" class="json-workspace">
      <header class="storage-header">
        <h3 class="details-title" style="margin:0;">Viewing: {{ activeFile.name }}</h3>
      </header>
      <textarea v-model="activeFileContent" class="json-textarea" placeholder="File stream text content..."></textarea>
      <div class="details-actions" style="margin-top: 1rem; flex-direction: row; gap: 0.5rem;">
        <button @click="saveActiveFileEdits" class="save-btn" style="flex:1;">Save File Changes</button>
        <button @click="activeFile = null" class="cancel-btn" style="flex:1; background-color: var(--bg-input); color: var(--text-primary);">Close Editor</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentPath = ref('')
const filesList = ref([])
const activeFile = ref(null)
const activeFileContent = ref('')

// Load standard directory files
const fetchCurrentDirectory = () => {
  fetch(`/api/fs/list?path=${encodeURIComponent(currentPath.value)}`, { method: 'GET' })
    .then(res => { if (!res.ok) throw new Error('Directory access failed.'); return res.json() })
    .then(data => {
      if (data.status === 'success') {
        // Sort items so folders always appear on top, followed by file items alphabetically
        filesList.value = data.files.sort((a, b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name))
      }
    })
    .catch(err => alert('Failed to read folder contents: ' + err.message))
}

onMounted(() => {
  fetchCurrentDirectory()
})

// Manage dynamic drilling routing down or displaying file contents
const handleItemClick = (item) => {
  if (item.isDirectory) {
    currentPath.value = currentPath.value ? `${currentPath.value}/${item.name}` : item.name
    fetchCurrentDirectory()
    activeFile.value = null
  } else {
    // Read raw data variables out of text configurations
    const fileRelativePath = currentPath.value ? `${currentPath.value}/${item.name}` : item.name
    fetch(`/api/fs/read?path=${encodeURIComponent(fileRelativePath)}`, { method: 'GET' })
      .then(res => res.text())
      .then(content => {
        activeFile.value = item
        activeFileContent.value = content
      })
      .catch(err => alert('Failed to load file contents: ' + err.message))
  }
}

// Navigate up one folder level
const navigateUp = () => {
  const segments = currentPath.value.split('/')
  segments.pop()
  currentPath.value = segments.join('/')
  fetchCurrentDirectory()
  activeFile.value = null
}

// Write/Save modifications made to an active file
const saveActiveFileEdits = () => {
  if (!activeFile.value) return
  const fileRelativePath = currentPath.value ? `${currentPath.value}/${activeFile.value.name}` : activeFile.value.name
  
  fetch(`/api/fs/write?path=${encodeURIComponent(fileRelativePath)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: activeFileContent.value
  })
  .then(res => { if (!res.ok) throw new Error('Save operation failed.'); return res.json() })
  .then(() => {
    alert('File changes written to disk storage device successfully.')
    fetchCurrentDirectory()
  })
  .catch(err => alert(err.message))
}

// REST trigger execution loops targeting direct creation actions
const promptNewDirectory = () => {
  const dirName = prompt('Enter new folder name:')
  if (!dirName) return
  const folderRelativePath = currentPath.value ? `${currentPath.value}/${dirName}` : dirName

  fetch(`/api/fs/mkdir?path=${encodeURIComponent(folderRelativePath)}&recursive=true`, { method: 'POST' })
    .then(res => res.json())
    .then(() => fetchCurrentDirectory())
    .catch(err => alert(err.message))
}

const promptNewFile = () => {
  const fileName = prompt('Enter filename (e.g. metadata.txt):')
  if (!fileName) return
  const fileRelativePath = currentPath.value ? `${currentPath.value}/${fileName}` : fileName

  fetch(`/api/fs/write?path=${encodeURIComponent(fileRelativePath)}`, {
    method: 'POST',
    body: 'New text resource container.'
  })
  .then(res => res.json())
  .then(() => fetchCurrentDirectory())
  .catch(err => alert(err.message))
}

// Execute full dynamic removal (recursive deletions for nested directory listings)
const deleteFileSystemItem = (item) => {
  const confirmationMessage = item.isDirectory 
    ? `Are you sure you want to recursively delete the folder "${item.name}" and all its contents?`
    : `Delete file "${item.name}"?`

  if (confirm(confirmationMessage)) {
    const itemRelativePath = currentPath.value ? `${currentPath.value}/${item.name}` : item.name
    fetch(`/api/fs/delete?path=${encodeURIComponent(itemRelativePath)}&recursive=true`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        if (activeFile.value && activeFile.value.name === item.name) {
          activeFile.value = null
        }
        fetchCurrentDirectory()
      })
      .catch(err => alert('Delete operation failed: ' + err.message))
  }
}

// Standard file size formatting method matching storage definitions
const formatSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>

/* Inheriting all base visual token layouts out of your original design block */
.folder-type {
  background-color: var(--accent) !important;
  border-radius: 3px !important;
}
.file-type {
  background-color: transparent !important;
  border: 2px solid var(--text-muted) !important;
  border-radius: 50% !important;
}


/* Inheriting all base visual token layouts out of your original design block */
.folder-type {
  background-color: var(--accent) !important;
  border-radius: 3px !important;
}
.file-type {
  background-color: transparent !important;
  border: 2px solid var(--text-muted) !important;
  border-radius: 50% !important;
}
/* ... rest of your shared scoped variables stay active ... */
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
