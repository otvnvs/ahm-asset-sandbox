<!-- ./views/home/index.vue - PART 1: TEMPLATE -->
<template>
  <div class="storage-container">
    <!-- Header Area -->
    <div class="storage-header">
      <h1>ANC Data</h1>
      <p class="storage-stats" v-if="!loading && !error">
        Sheet: <span class="details-title">{{ currentSheetName }}</span> 
        &bull; Matches: {{ filteredRows.length }} / {{ tableRows.length }} 
      </p>
    </div>

    <!-- Controls Bar -->
    <div v-if="!loading && !error" class="storage-controls layout-controls">
      <div class="search-wrapper">
        <input 
          type="text" 
          v-model="searchQuery" 
          placeholder="Search records..." 
          class="search-input"
        />
      </div>
      <div class="dropdown-wrapper">
        <label class="storage-value">Show: </label>
        <select v-model="rowsPerPage" class="custom-select">
          <option :value="10">10 Rows</option>
          <option :value="25">25 Rows</option>
          <option :value="50">50 Rows</option>
          <option :value="100">100 Rows</option>
        </select>
      </div>
    </div>

    <!-- Status Messages -->
    <div v-if="loading" class="empty-state">Loading spreadsheet data...</div>
    <div v-if="error" class="json-workspace"><p class="error-text">{{ error }}</p></div>

    <!-- Spreadsheet Table Container -->
    <div v-if="!loading && !error && filteredRows.length > 0" class="json-workspace json-display-wrapper">
      <table class="excel-dark-table">
        <thead>
          <tr>
            <th v-for="(header, index) in tableHeaders" :key="index">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(row, rowIndex) in paginatedRows" 
            :key="rowIndex" 
            class="table-row-item"
            @click="openDetails(row)"
          >
            <!-- Render explicitly by header array match to block thousands of ghost cells -->
            <td v-for="(header, colIndex) in tableHeaders" :key="colIndex">
              {{ row[header] !== undefined ? row[header] : '' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty State for Empty Search Results -->
    <div v-if="!loading && !error && filteredRows.length === 0" class="empty-state">
      No matching records found.
    </div>

    <!-- Pagination Controls -->
    <div v-if="!loading && !error && totalPages > 1" class="action-bar pagination-container">
      <button class="action-btn" :disabled="currentPage === 1" @click="prevPage">&larr; Previous</button>
      <span class="page-indicator">Page {{ currentPage }} of {{ totalPages }}</span>
      <button class="action-btn" :disabled="currentPage === totalPages" @click="nextPage">Next &rarr;</button>
    </div>

    <!-- Row Details Popup Modal Overlay -->
    <div v-if="selectedRow" class="modal-overlay" @click.self="closeDetails">
      <div class="modal-content json-workspace">
        <div class="modal-header">
          <h3>Record Details</h3>
          <button class="delete-btn close-modal-btn" @click="closeDetails">&times;</button>
        </div>
        <div class="modal-body json-display-wrapper">
          <ul class="storage-list">
            <li v-for="header in tableHeaders" :key="header" class="storage-item detailed-item">
              <div class="storage-content">
                <div class="custom-indicator"></div>
                <div class="storage-text-group">
                  <span class="storage-value">{{ header }}</span>
                  <span class="storage-key data-highlight">{{ selectedRow[header] !== undefined ? selectedRow[header] : '-' }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div class="details-actions">
          <button class="cancel-btn" @click="closeDetails">Close View</button>
        </div>
      </div>
    </div>
  </div>
</template>
<!-- ./views/home/index.vue - PART 2: SCRIPT -->
<script>
import * as XLSX from '../../lib/xlsx.mjs';

export default {
  data() {
    return {
      tableHeaders: [],
      tableRows: [],
      currentSheetName: '',
      loading: true,
      error: null,
      searchQuery: '',
      currentPage: 1,
      rowsPerPage: 10,
      selectedRow: null
    };
  },
  watch: {
    searchQuery() { this.currentPage = 1; },
    rowsPerPage() { this.currentPage = 1; }
  },
  computed: {
    filteredRows() {
      if (!this.searchQuery.trim()) return this.tableRows;
      const query = this.searchQuery.toLowerCase();
      return this.tableRows.filter(row => {
        return Object.values(row).some(val => String(val).toLowerCase().includes(query));
      });
    },
    totalPages() {
      return Math.ceil(this.filteredRows.length / this.rowsPerPage) || 1;
    },
    paginatedRows() {
      const startIndex = (this.currentPage - 1) * this.rowsPerPage;
      return this.filteredRows.slice(startIndex, startIndex + this.rowsPerPage);
    }
  },
  mounted() {
    this.loadExcelFile();
  },
  methods: {
    async loadExcelFile() {
      try {
        const response = await fetch('./src/apps/anc/res/a.xlsx');
        if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        const firstSheetName = workbook.SheetNames[0];
        this.currentSheetName = firstSheetName;

        const worksheet = workbook.Sheets[firstSheetName];
        
        // Use 'defendHeaders' optimization to completely eliminate thousands of ghost columns
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (jsonData.length > 0) {
          // Identify only columns that contain actual characters or entries
          const dynamicKeys = new Set();
          jsonData.forEach(row => {
            Object.keys(row).forEach(key => {
              if (key.trim() !== "" && !key.startsWith("__EMPTY")) {
                dynamicKeys.add(key);
              }
            });
          });

          this.tableHeaders = Array.from(dynamicKeys);
          this.tableRows = jsonData;
        } else {
          this.error = "The Excel file is empty.";
        }
      } catch (err) {
        this.error = `Error reading Excel file: ${err.message}`;
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },
    prevPage() { if (this.currentPage > 1) this.currentPage--; },
    openDetails(row) { this.selectedRow = row; },
    closeDetails() { this.selectedRow = null; }
  }
};
</script>
<!-- ./views/home/index.vue - PART 3: STYLES -->
<style scoped>
.folder-type { background-color: var(--accent)!important; border-radius: 3px!important; }
.file-type { background-color: transparent!important; border: 2px solid var(--text-muted)!important; border-radius: 50%!important; }

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
  font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  width: 100vw;
  min-height: 100vh;
  margin: 0; padding: 2rem;
  background-color: var(--bg-surface); color: var(--text-primary);
  box-sizing: border-box;
}

.storage-header { margin-bottom: 1.5rem; text-align: center; position: relative; }
.storage-header h1 { margin: 0 0 0.5rem 0; font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; }
.details-title { color: var(--accent); word-break: break-all; padding: 0 1rem; }
.storage-stats { margin: 0; color: var(--text-muted); font-size: 0.9rem; }

.layout-controls { display: flex; gap: 1rem; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
.search-wrapper { flex: 1; }
.search-input {
  width: 100%; padding: 0.7rem 1rem; background-color: var(--bg-input);
  border: 1px solid transparent; border-radius: var(--border-radius);
  color: var(--text-primary); font-size: 0.95rem; outline: none;
  box-sizing: border-box; transition: var(--transition);
}
.search-input:focus { border-color: var(--accent); }

.dropdown-wrapper { display: flex; align-items: center; gap: 0.5rem; }
.custom-select {
  padding: 0.65rem 2rem 0.65rem 1rem; background-color: var(--bg-input);
  border: 1px solid transparent; border-radius: 8px; color: var(--text-primary);
  font-weight: 600; font-size: 0.9rem; outline: none; cursor: pointer;
  transition: var(--transition); appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://w3.org' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23bb86fc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.7rem center; background-size: 1.1rem;
}
.custom-select:focus { border-color: var(--accent); }

.json-workspace { margin: 1.5rem 0; background-color: var(--bg-input); border-radius: var(--border-radius); padding: 1rem; min-height: 250px; }
.json-display-wrapper { overflow-x: auto; }
.excel-dark-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 0.9rem; text-align: left; }
.excel-dark-table th { background-color: var(--bg-primary); color: var(--accent); padding: 0.8rem 1rem; font-weight: 600; border-bottom: 2px solid var(--bg-surface); white-space: nowrap; }
.excel-dark-table td { padding: 0.8rem 1rem; color: var(--text-primary); border-bottom: 1px solid var(--bg-surface); white-space: nowrap; }
.table-row-item { transition: var(--transition); cursor: pointer; }
.table-row-item:hover { background-color: var(--bg-surface); }

.action-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.action-btn {
  flex: 1; padding: 0.6rem; background-color: var(--bg-input); border: 1px solid var(--accent);
  border-radius: var(--border-radius); color: var(--accent); font-weight: 600;
  font-size: 0.9rem; cursor: pointer; text-align: center; transition: var(--transition);
}
.action-btn:hover:not(:disabled) { background-color: var(--accent); color: #000000; }
.action-btn:disabled { opacity: 0.3; border-color: var(--text-muted); color: var(--text-muted); cursor: not-allowed; }
.pagination-container { display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; }

.storage-list { list-style: none; padding: 0; margin: 0; }
.storage-item { display: flex; align-items: center; justify-content: space-between; padding: 0.8rem 1rem; background-color: var(--bg-surface); border-radius: var(--border-radius); margin-bottom: 0.5rem; }
.storage-content { display: flex; align-items: center; gap: 0.75rem; width: 100%; }
.custom-indicator { height: 14px; width: 14px; background-color: transparent; border: 2px solid var(--accent); border-radius: 50%; flex-shrink: 0; }
.storage-text-group { display: flex; flex-direction: column; gap: 0.15rem; overflow: hidden; width: 100%; }
.storage-key { font-size: 1rem; font-weight: 600; color: var(--text-primary); word-break: break-word; }
.storage-value { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.data-highlight { color: #a8ffb2 !important; font-family: monospace; }
.delete-btn { background: none; border: none; color: var(--text-muted); font-size: 1.5rem; cursor: pointer; padding: 0 0.5rem; line-height: 1; }
.delete-btn:hover { color: var(--danger); }

.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(0, 0, 0, 0.75); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; box-sizing: border-box; }
.modal-content { width: 100%; max-width: 500px; max-height: 85vh; display: flex; flex-direction: column; border: 1px solid var(--bg-surface); box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--bg-surface); padding-bottom: 0.75rem; margin-bottom: 1rem; }
.modal-header h3 { margin: 0; color: var(--accent); font-size: 1.3rem; }
.modal-body { flex: 1; overflow-y: auto; }
.detailed-item { background-color: var(--bg-primary); }
.details-actions { margin-top: 1rem; }
.cancel-btn { background-color: transparent; border: 1px solid var(--text-muted) !important; color: var(--text-primary); width: 100%; padding: 0.8rem; border-radius: var(--border-radius); font-weight: 600; cursor: pointer; transition: var(--transition); }
.cancel-btn:hover { background-color: var(--bg-input); }

.error-text { color: var(--danger); font-size: 0.85rem; margin: 0.5rem 0 0 0; }
.empty-state { text-align: center; color: var(--text-muted); padding: 2rem 0; font-style: italic; }

@media(max-width: 480px) {
  .storage-container { padding: 1rem; }
  .storage-header h1 { font-size: 1.5rem; }
  .layout-controls { flex-direction: column; align-items: stretch; gap: 0.75rem; }
  .dropdown-wrapper { justify-content: space-between; }
}
</style>

