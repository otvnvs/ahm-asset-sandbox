<template>
  <div class="spreadsheet-app">
    <div class="toolbar">
      <h1>Grid</h1>
      <div class="formula-preview">
        <span>FX: </span>
        <input 
          type="text" 
          :value="activeCellText" 
          placeholder="Select a cell to write formula..." 
          disabled
        />
      </div>
	<!-- Add the Help button here -->
	<button class="btn help-btn" @click="showHelp = true">?</button>
	<button class="btn" @click="clearGrid">Clear</button>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th class="row-label"></th>
            <th v-for="col in cols" :key="col">{{ col }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in totalRows" :key="rowIndex">
            <th class="row-label">{{ rowIndex + 1 }}</th>
            <td 
              v-for="(col, colIndex) in cols.length" 
              :key="colIndex" 
              class="cell-relative"
              :class="{ 'is-selected': isCellSelected(rowIndex, colIndex) }"
              @mousedown="startDrag(rowIndex, colIndex)"
              @mouseenter="continueDrag(rowIndex, colIndex)"
              @touchstart="startDrag(rowIndex, colIndex)"
            >
              
              <!-- Active Input Mode -->
              <div v-if="isFocused(rowIndex, colIndex)" class="input-wrapper">
                <input 
                  type="text" 
                  v-model="gridData[rowIndex][colIndex]" 
                  @input="handleInput($event)"
                  @keydown="handleKeydown($event, rowIndex, colIndex)"
                  @blur="onBlur"
                  :id="`cell-${rowIndex}-${colIndex}`"
                  inputmode="text"
                  autocomplete="off"
                />
                
                <!-- Autocomplete Dropdown Panel -->
                <div v-if="filteredSuggestions.length > 0" class="autocomplete-panel">
                  <div 
                    v-for="func in filteredSuggestions" 
                    :key="func" 
                    class="autocomplete-item"
                    @mousedown.prevent="selectSuggestion(func)"
                  >
                    {{ func }}
                  </div>
                </div>
              </div>

              <!-- Static Presentation View -->
              <div 
                v-else 
                class="cell-display"
                :class="{ 'has-formula': isFormula(rowIndex, colIndex) }"
                @click="focusCell(rowIndex, colIndex)"
              >
                {{ displayValue(rowIndex, colIndex) }}
              </div>

            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <HelpModal v-if="showHelp" @close="showHelp = false" />
  </div>
</template>

<script setup>
import { ref, watch, computed, nextTick, onMounted, onUnmounted } from 'vue';
import { createEmptyGrid, saveGridData, loadGridData, clearStorage, evaluateCell, formatNumber } from '../../utils/spreadsheet.js';
import HelpModal from '../../components/help/index.vue';
const showHelp = ref(false);
const cols = ref(['A', 'B', 'C', 'D', 'E']);
const totalRows = 15;

const gridData = ref(loadGridData(totalRows, cols.value.length));
const focusedCell = ref(null); 
const typedText = ref('');

// Cell dragging and multi-selection properties
const isDragging = ref(false);
const dragStart = ref(null);
const dragEnd = ref(null);

const availableFunctions = ['SUM', 'AVERAGE', 'MIN', 'MAX'];

watch(gridData, (newData) => { saveGridData(newData); }, { deep: true });

const isFocused = (r, c) => focusedCell.value?.row === r && focusedCell.value?.col === c;
const isFormula = (r, c) => gridData.value[r][c]?.toString().startsWith('=');

const focusCell = async (r, c) => {
  focusedCell.value = { row: r, col: c };
  dragStart.value = { row: r, col: c };
  dragEnd.value = { row: r, col: c };
  typedText.value = gridData.value[r][c] || '';
  await nextTick();
  const el = document.getElementById(`cell-${r}-${c}`);
  if (el) el.focus();
};

const handleInput = (event) => {
  typedText.value = event.target.value;
};

const onBlur = () => {
  focusedCell.value = null;
  typedText.value = '';
};

// Keyboard arrow navigation handlers
const handleKeydown = (event, r, c) => {
  let targetRow = r;
  let targetCol = c;

  switch (event.key) {
    case 'ArrowUp':
      if (r > 0) targetRow--;
      break;
    case 'ArrowDown':
      if (r < totalRows - 1) targetRow++;
      break;
    case 'ArrowLeft':
      // Move left only if cursor is at the beginning of the text
      if (event.target.selectionStart === 0 && c > 0) targetCol--;
      else return;
      break;
    case 'ArrowRight':
      // Move right only if cursor is at the end of the text
      if (event.target.selectionStart === event.target.value.length && c < cols.value.length - 1) targetCol++;
      else return;
      break;
    case 'Enter':
      if (r < totalRows - 1) targetRow++;
      break;
    default:
      return;
  }

  event.preventDefault();
  focusCell(targetRow, targetCol);
};

// Cell Selection Dragging State Mechanics
const startDrag = (r, c) => {
  isDragging.value = true;
  dragStart.value = { row: r, col: c };
  dragEnd.value = { row: r, col: c };
};

const continueDrag = (r, c) => {
  if (!isDragging.value) return;
  dragEnd.value = { row: r, col: c };
};

const stopDrag = () => {
  isDragging.value = false;
};

const isCellSelected = (r, c) => {
  if (!dragStart.value || !dragEnd.value) return false;
  
  const minR = Math.min(dragStart.value.row, dragEnd.value.row);
  const maxR = Math.max(dragStart.value.row, dragEnd.value.row);
  const minC = Math.min(dragStart.value.col, dragEnd.value.col);
  const maxC = Math.max(dragStart.value.col, dragEnd.value.col);

  return r >= minR && r <= maxR && c >= minC && c <= maxC;
};

// Autocomplete Logic
const filteredSuggestions = computed(() => {
  const text = typedText.value.trim().toUpperCase();
  if (!text.startsWith('=')) return [];
  const formulaMatch = text.match(/([A-Z]+)$/);
  if (!formulaMatch) return [];
  return availableFunctions.filter(f => f.startsWith(formulaMatch[1]));
});

const selectSuggestion = async (funcName) => {
  if (!focusedCell.value) return;
  const { row, col } = focusedCell.value;
  const currentText = gridData.value[row][col];
  const updatedText = currentText.replace(/([A-Z]+)$/i, `${funcName}(`);
  gridData.value[row][col] = updatedText;
  typedText.value = updatedText;

  await nextTick();
  const el = document.getElementById(`cell-${row}-${col}`);
  if (el) el.focus();
};

const activeCellText = computed(() => {
  if (!focusedCell.value) return '';
  return gridData.value[focusedCell.value.row][focusedCell.value.col];
});

const displayValue = (r, c) => {
  const evaluated = evaluateCell(gridData.value[r][c], gridData.value);
  return formatNumber(evaluated);
};

const clearGrid = () => {
  if (confirm('Clear all data?')) {
    clearStorage();
    gridData.value = createEmptyGrid(totalRows, cols.value.length);
    focusedCell.value = null;
    dragStart.value = null;
    dragEnd.value = null;
  }
};

onMounted(() => {
  window.addEventListener('mouseup', stopDrag);
  window.addEventListener('touchend', stopDrag);
});

onUnmounted(() => {
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchend', stopDrag);
});
</script>

<style scoped>
.spreadsheet-app {
  --bg: #121212;
  --surface: #1e1e1e;
  --border: #333333;
  --text: #e0e0e0;
  --accent: #bb86fc;
  --header-bg: #252525;
  --selection: rgba(187, 134, 252, 0.15);
  
  background-color: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  padding: 10px;
  min-height: 100vh;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  padding: 5px;
}

h1 {
  font-size: 1.1rem;
  font-weight: 500;
}

.formula-preview {
  display: flex;
  align-items: center;
  flex-grow: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 4px 8px;
  border-radius: 4px;
}

.formula-preview span {
  color: var(--accent);
  margin-right: 5px;
  font-weight: bold;
  font-size: 0.8rem;
}

.formula-preview input {
  background: transparent;
  border: none;
  color: #aaa;
  width: 100%;
  outline: none;
  font-size: 0.8rem;
}

.btn {
  background: var(--surface);
  color: var(--accent);
  border: 1px solid var(--border);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  cursor: pointer;
}

.table-container {
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--surface);
}

table {
  border-collapse: collapse;
  width: 100%;
}

th, td {
  border: 1px solid var(--border);
  min-width: 75px;
  height: 42px;
  text-align: center;
  font-size: 0.9rem;
}

th {
  background-color: var(--header-bg);
  color: #888;
  font-weight: normal;
  font-size: 0.8rem;
  user-select: none;
}

th.row-label {
  min-width: 40px;
}

.cell-relative {
  position: relative;
}

.is-selected {
  background-color: var(--selection);
  box-shadow: inset 0 0 0 1px var(--accent);
}

.input-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

td input {
  width: 100%;
  height: 100%;
  border: none;
  color: var(--text);
  text-align: center;
  font-size: 0.9rem;
  padding: 2px;
  outline: 1px solid var(--accent);
  background: #252525;
}

.cell-display {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
}

.cell-display.has-formula {
  color: #81c784;
}

.autocomplete-panel {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: #252525;
  border: 1px solid var(--accent);
  border-top: none;
  z-index: 10;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
  max-height: 120px;
  overflow-y: auto;
}

.autocomplete-item {
  padding: 6px;
  font-size: 0.75rem;
  text-align: left;
  color: var(--accent);
  cursor: pointer;
  border-bottom: 1px solid var(--border);
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:active {
background: var(--surface);}

.help-btn {
  min-width: 32px;
  padding: 6px 0;
  text-align: center;
  font-weight: bold;
}
</style>
