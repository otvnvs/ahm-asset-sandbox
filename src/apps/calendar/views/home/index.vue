<template>
  <div class="calendar-app">
    <!-- Header: Month and Year Navigation -->
    <header class="calendar-header">
      <button @click="previousMonth" class="nav-btn">&larr;</button>
      <h2>{{ currentMonthName }} {{ currentYear }}</h2>
      <button @click="nextMonth" class="nav-btn">&rarr;</button>
    </header>

    <!-- Days of the Week Labels -->
    <div class="weekdays-grid">
      <div v-for="day in weekdayLabels" :key="day" class="weekday-label">
        {{ day }}
      </div>
    </div>

    <!-- Scrollable Content Area -->
    <div class="main-content">
      <!-- Days Grid with Square Aspect Ratio -->
      <div class="days-grid">
        <!-- Empty slots for days from the previous month -->
        <div 
          v-for="blank in firstDayOffset" 
          :key="'blank-' + blank" 
          class="day-cell empty"
        ></div>

        <!-- Calendar days -->
        <button
          v-for="day in daysInMonth"
          :key="'day-' + day"
          :class="['day-cell', { 'is-today': isToday(day), 'is-selected': isSelected(day) }]"
          @click="selectDate(day)"
        >
          <span class="day-number">{{ day }}</span>
          <span v-if="hasNote(day)" class="note-indicator"></span>
        </button>
      </div>

      <!-- Notes Management Panel -->
      <section class="notes-section">
        <h3>Notes for {{ formattedSelectedDate }}</h3>
        <div class="note-input-container">
          <textarea 
            v-model="currentNoteText" 
            placeholder="Tap here to add or edit notes for this day..."
            @input="saveNote"
          ></textarea>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// State
const currentDate = ref(new Date())
const selectedDate = ref(new Date())
const notes = ref({}) // Format: { 'YYYY-MM-DD': 'Note text' }

// Constants
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Computed Properties
const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())
const currentMonthName = computed(() => monthNames[currentMonth.value])

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOffset = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const selectedDateKey = computed(() => {
  return formatDateKey(selectedDate.value.getFullYear(), selectedDate.value.getMonth(), selectedDate.value.getDate())
})

const currentNoteText = computed({
  get: () => notes.value[selectedDateKey.value] || '',
  set: (val) => {
    if (val.trim()) {
      notes.value[selectedDateKey.value] = val
    } else {
      delete notes.value[selectedDateKey.value]
    }
  }
})

const formattedSelectedDate = computed(() => {
  return selectedDate.value.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})

// Lifecycle
onMounted(() => {
  const savedNotes = localStorage.getItem('calendar_notes')
  if (savedNotes) {
    try {
      notes.value = JSON.parse(savedNotes)
    } catch (e) {
      console.error('Failed to parse notes from localStorage', e)
    }
  }
})

// Methods
const formatDateKey = (year, month, day) => {
  const mm = String(month + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

const previousMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const selectDate = (day) => {
  selectedDate.value = new Date(currentYear.value, currentMonth.value, day)
}

const isToday = (day) => {
  const today = new Date()
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  )
}

const isSelected = (day) => {
  return (
    day === selectedDate.value.getDate() &&
    currentMonth.value === selectedDate.value.getMonth() &&
    currentYear.value === selectedDate.value.getFullYear()
  )
}

const hasNote = (day) => {
  const key = formatDateKey(currentYear.value, currentMonth.value, day)
  return !!notes.value[key]
}

const saveNote = () => {
  localStorage.setItem('calendar_notes', JSON.stringify(notes.value))
}
</script>

<style scoped>
/* Reset and Fullscreen Constraints */
:global(html), :global(body), :global(#__nuxt), :global(#app) {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #121212;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Main Layout Structure */
.calendar-app {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #121212;
  color: #e0e0e0;
  box-sizing: border-box;
}

/* Header Styling */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #1e1e1e;
  border-bottom: 1px solid #2d2d2d;
}

.calendar-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.nav-btn {
  background: none;
  border: none;
  color: #bb86fc;
  font-size: 1.5rem;
  padding: 8px 16px;
  cursor: pointer;
}

/* Weekday Labels Grid */
.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  width: 100%;
  background-color: #1a1a1a;
  border-bottom: 1px solid #2d2d2d;
}

.weekday-label {
  text-align: center;
  padding: 12px 0;
  font-size: 0.8rem;
  font-weight: bold;
  color: #888888;
  text-transform: uppercase;
}

/* Scrollable Container below Top Headers */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Days Layout using Square Ratio Grid */
.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  width: 100%;
  background-color: #121212;
}

/* Day Cells - Forced Perfect Squares via Aspect Ratio */
.day-cell {
  background: none;
  border: 0.5px solid #2d2d2d;
  color: #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  position: relative;
  cursor: pointer;
  padding: 0;
  aspect-ratio: 1 / 1; /* Forces strict square block shapes */
}

.day-cell:active {
  background-color: #2a2a2a;
}

.day-cell.empty {
  background-color: #161616;
  cursor: default;
  pointer-events: none;
}

.day-number {
  z-index: 2;
}

/* Visual UI Indicators */
.day-cell.is-today {
  color: #bb86fc;
  font-weight: bold;
}

.day-cell.is-selected {
  background-color: #bb86fc;
  color: #121212;
  font-weight: bold;
}

/* Active Note indicator dot */
.note-indicator {
  position: absolute;
  bottom: 8px;
  width: 5px;
  height: 5px;
  background-color: #03dac6;
  border-radius: 50%;
}

.day-cell.is-selected .note-indicator {
  background-color: #121212;
}

/* Notes Section Management */
.notes-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background-color: #1e1e1e;
  border-top: 1px solid #2d2d2d;
  min-height: 180px;
}

.notes-section h3 {
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #b0b0b0;
}

.note-input-container {
  flex: 1;
  display: flex;
}

.notes-section textarea {
  width: 100%;
  height: 100%;
  min-height: 100px;
  background-color: #121212;
  border: 1px solid #2d2d2d;
  border-radius: 8px;
  color: #e0e0e0;
  padding: 12px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: none;
  outline: none;
  box-sizing: border-box;
}

.notes-section textarea:focus {
  border-color: #bb86fc;
}
</style>

