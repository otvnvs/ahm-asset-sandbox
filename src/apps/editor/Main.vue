<template>
  <div class="editor-container">
    <header class="header">
      <button class="menu-btn" @click="isMenuOpen = true">☰</button>
      <span class="title">{{ currentFileName }}</span>
    </header>

    <textarea
      v-model="text"
      placeholder="Start typing..."
      class="editor-textarea"
      autofocus
    ></textarea>

    <Menu 
      :is-open="isMenuOpen" 
      @close="isMenuOpen = false" 
      @file-selected="loadActiveFile"
    />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { getFiles, getActiveFileId, setActiveFileId, updateFileContent } from './utils/store.js'
import Menu from './components/Menu.vue'

const text = ref('')
const activeId = ref('')
const currentFileName = ref('Editor')
const isMenuOpen = ref(false)

const loadActiveFile = (id) => {
  const files = getFiles()
  const targetId = id || getActiveFileId()
  const activeFile = files.find(f => f.id === targetId) || files[0]

  if (activeFile) {
    activeId.value = activeFile.id
    text.value = activeFile.content
    currentFileName.value = activeFile.name
    setActiveFileId(activeFile.id)
  }
}

watch(text, (newText) => {
  if (activeId.value) {
    updateFileContent(activeId.value, newText)
  }
})

loadActiveFile()
</script>

<style scoped>
.editor-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background-color: #121212;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* System font stack for layout headers/text */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.header {
  display: flex;
  align-items: center;
  height: 48px;
  background-color: #1e1e1e;
  border-bottom: 1px solid #2d2d2d;
  padding: 0 16px;
}

.menu-btn {
  background: none;
  border: none;
  color: #e0e0e0;
  font-size: 24px;
  padding: 0;
  margin-right: 16px;
  cursor: pointer;
}

.title {
  color: #e0e0e0;
  font-size: 18px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  margin: 0;
  padding: 16px;
  box-sizing: border-box;
  background-color: #121212;
  color: #e0e0e0;
  border: none;
  resize: none;
  /* Specific mobile-friendly font configurations */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  letter-spacing: 0.3px;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}
</style>

