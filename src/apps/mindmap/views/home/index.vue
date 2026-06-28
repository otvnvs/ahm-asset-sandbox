<!-- CHUNK 1: TEMPLATE -->
<template>
  <div class="mf-wrapper mf-dark">
    <!-- Top Header Navigation -->
    <header class="mf-header">
      <div class="mf-brand">
        <span class="mf-icon"></span>
        <h1 class="mf-title">MindFlow</h1>
      </div>
      <div class="mf-actions">
        <button @click="resetMap" class="mf-btn mf-btn-secondary">Clear</button>
        <button @click="exportData" class="mf-btn mf-btn-primary">Export</button>
      </div>
    </header>

    <!-- Interactive Map Canvas Surface -->
    <main 
      ref="canvasRef"
      class="mf-canvas bg-grid-pattern"
      @touchstart="handleCanvasTouchStart"
      @touchmove="handleCanvasTouchMove"
      @touchend="handleCanvasTouchEnd"
      @mousedown="handleCanvasMouseDown"
      @mousemove="handleCanvasMouseMove"
      @mouseup="handleCanvasMouseUp"
    >
      <!-- Connection Vectors Layer -->
      <svg class="mf-svg-layer">
        <g :style="canvasStyle">
          <!-- Rendered Node-to-Node Links -->
          <path
            v-for="link in links"
            :key="link.id"
            :d="generateLinkPath(link)"
            stroke="#6366f1"
            stroke-width="3"
            fill="none"
            stroke-linecap="round"
            opacity="0.7"
          />
          <!-- Virtual Link Active Drag Template Indicator -->
          <path
            v-if="isDraggingNewNode && dragStartNode"
            :d="generateVirtualLinkPath()"
            stroke="#10b981"
            stroke-width="3"
            stroke-dasharray="6,4"
            fill="none"
            stroke-linecap="round"
          />
        </g>
      </svg>

      <!-- Dynamic Node Elements Container -->
      <div class="mf-nodes-layer" :style="canvasStyle">
        <div
          v-for="node in nodes"
          :key="node.id"
          :style="{ left: `${node.x}px`, top: `${node.y}px` }"
          class="mf-node-wrapper"
        >
          <div 
            @touchstart.stop="handleNodeTouchStart($event, node)"
            @mousedown.stop="handleNodeMouseDown($event, node)"
            @click.stop="selectNode(node)"
            :class="['mf-node', selectedNodeId === node.id ? 'mf-node-selected' : '']"
          >
            <p class="mf-node-text">{{ node.text }}</p>
            
            <!-- Link Extender Handle Anchor Element -->
            <div 
              v-if="selectedNodeId === node.id"
              class="mf-node-handle"
              @touchstart.stop.prevent="startNodeDrawDrag($event, node)"
              @mousedown.stop.prevent="startNodeDrawDrag($event, node)"
              title="Drag away to grow a new idea"
            >
              ➕
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Actions Overlay Form Sheet -->
    <div v-if="selectedNode" class="mf-bottom-sheet">
      <div class="mf-sheet-header">
        <span class="mf-sheet-label">Edit Node</span>
        <button @click="selectedNodeId = null" class="mf-sheet-close">✕</button>
      </div>

      <input 
        v-model="selectedNode.text"
        @input="saveToStorage"
        type="text"
        class="mf-input"
        placeholder="Node text..."
        ref="inputRef"
      />

      <div class="mf-sheet-actions">
        <button @click="addChildNode" class="mf-btn mf-btn-primary mf-w-full">
          Details
        </button>
        <button 
          @click="deleteNode"
          v-if="selectedNodeId !== 'root'"
          class="mf-btn mf-btn-danger mf-w-full"
        >
          Delete
        </button>
      </div>
    </div>

    <!-- Status Helper Label Overlay -->
    <div v-if="!selectedNodeId" class="mf-floating-hint">
      Tap a node, then drag its green edge handle to create connections
    </div>
  </div>
</template>
<!-- CHUNK 2: SCRIPT SETUP -->
<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';

// Canvas Pan and Zoom State tracking
const panX = ref(window.innerWidth / 2);
const panY = ref(window.innerHeight / 3);
const zoom = ref(1);
const canvasRef = ref(null);
const inputRef = ref(null);

// Core Map Node State Layout array
const nodes = ref([]);
const selectedNodeId = ref(null);

// Drag & Pan tracking interaction variables
let isPanning = false;
let startPanX = 0;
let startPanY = 0;
let isDraggingNode = null;
let nodeStartX = 0;
let nodeStartY = 0;
let touchStartX = 0;
let touchStartY = 0;

// Drag-to-Create branch specific states
const isDraggingNewNode = ref(false);
const dragStartNode = ref(null);
const dragCurrentX = ref(0);
const dragCurrentY = ref(0);

// Reactive Computed Transformations
const canvasStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${zoom.value})`,
}));

const selectedNode = computed(() => 
  nodes.value.find(n => n.id === selectedNodeId.value)
);

const links = computed(() => {
  const list = [];
  nodes.value.forEach(node => {
    if (node.parentId) {
      const parent = nodes.value.find(n => n.id === node.parentId);
      if (parent) {
        list.push({ id: `${parent.id}-${node.id}`, source: parent, target: node });
      }
    }
  });
  return list;
});

// Storage Persistent Management Logic
const loadStorage = () => {
  const data = localStorage.getItem('mindflow_map');
  if (data) {
    try {
      nodes.value = JSON.parse(data);
    } catch (e) {
      initDefaultMap();
    }
  } else {
    initDefaultMap();
  }
};

const saveToStorage = () => {
  localStorage.setItem('mindflow_map', JSON.stringify(nodes.value));
};

const initDefaultMap = () => {
  nodes.value = [
    { id: 'root', text: 'Central Idea', x: 0, y: 0, parentId: null }
  ];
  saveToStorage();
};

const resetMap = () => {
  if (confirm('Reset your mind map?')) {
    initDefaultMap();
    selectedNodeId.value = null;
    panX.value = window.innerWidth / 2;
    panY.value = window.innerHeight / 3;
  }
};

// Node Operations Layout Builders
const selectNode = (node) => {
  selectedNodeId.value = node.id;
  nextTick(() => {
    inputRef.value?.focus();
  });
};

const addChildNode = () => {
  if (!selectedNode.value) return;
  
  const id = 'node_' + Date.now();
  const angle = Math.random() * Math.PI * 2;
  const distance = 140;
  
  const newNode = {
    id,
    text: 'New Idea',
    x: selectedNode.value.x + Math.cos(angle) * distance,
    y: selectedNode.value.y + Math.sin(angle) * distance,
    parentId: selectedNode.value.id
  };
  
  nodes.value.push(newNode);
  selectedNodeId.value = id;
  saveToStorage();
};

const deleteNode = () => {
  if (!selectedNodeId.value || selectedNodeId.value === 'root') return;
  
  const getDescendantIds = (id) => {
    let ids = [id];
    nodes.value.forEach(n => {
      if (n.parentId === id) {
        ids = [...ids, ...getDescendantIds(n.id)];
      }
    });
    return ids;
  };
  
  const toDelete = getDescendantIds(selectedNodeId.value);
  nodes.value = nodes.value.filter(n => !toDelete.includes(n.id));
  selectedNodeId.value = null;
  saveToStorage();
};

// Vector Generation Math: Smooth Cubic Bezier Curves
const generateLinkPath = (link) => {
  const sX = link.source.x;
  const sY = link.source.y;
  const tX = link.target.x;
  const tY = link.target.y;
  
  const cpX1 = sX + (tX - sX) / 2;
  const cpY1 = sY;
  const cpX2 = sX + (tX - sX) / 2;
  const cpY2 = tY;
  
  return `M ${sX} ${sY} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${tX} ${tY}`;
};

// Virtual Path for real-time creation line dragging
const generateVirtualLinkPath = () => {
  if (!dragStartNode.value) return '';
  const sX = dragStartNode.value.x;
  const sY = dragStartNode.value.y;
  const tX = dragCurrentX.value;
  const tY = dragCurrentY.value;
  
  const cpX1 = sX + (tX - sX) / 2;
  const cpY1 = sY;
  const cpX2 = sX + (tX - sX) / 2;
  const cpY2 = tY;
  
  return `M ${sX} ${sY} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${tX} ${tY}`;
};

// Drag To Create Core Interactivity Actions
const startNodeDrawDrag = (e, node) => {
  isPanning = false;
  isDraggingNode = null;
  isDraggingNewNode.value = true;
  dragStartNode.value = node;
  
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  dragCurrentX.value = (clientX - panX.value) / zoom.value;
  dragCurrentY.value = (clientY - panY.value) / zoom.value;
};

const handleCanvasTouchStart = (e) => {
  if (e.touches.length === 1) {
    isPanning = true;
    startPanX = e.touches[0].clientX - panX.value;
    startPanY = e.touches[0].clientY - panY.value;
  }
};

const handleCanvasTouchMove = (e) => {
  if (e.touches.length !== 1) return;
  const clientX = e.touches[0].clientX;
  const clientY = e.touches[0].clientY;

  if (isDraggingNewNode.value) {
    dragCurrentX.value = (clientX - panX.value) / zoom.value;
    dragCurrentY.value = (clientY - panY.value) / zoom.value;
  } else if (isPanning) {
    panX.value = clientX - startPanX;
    panY.value = clientY - startPanY;
  } else if (isDraggingNode) {
    isDraggingNode.x = nodeStartX + (clientX - touchStartX) / zoom.value;
    isDraggingNode.y = nodeStartY + (clientY - touchStartY) / zoom.value;
  }
};

const handleCanvasTouchEnd = () => {
  finalizeDragNodeCreation();
  if (isDraggingNode) saveToStorage();
  isPanning = false;
  isDraggingNode = null;
};

const handleCanvasMouseDown = (e) => {
  isPanning = true;
  startPanX = e.clientX - panX.value;
  startPanY = e.clientY - panY.value;
};

const handleCanvasMouseMove = (e) => {
  if (isDraggingNewNode.value) {
    dragCurrentX.value = (e.clientX - panX.value) / zoom.value;
    dragCurrentY.value = (e.clientY - panY.value) / zoom.value;
  } else if (isPanning) {
    panX.value = e.clientX - startPanX;
    panY.value = e.clientY - startPanY;
  } else if (isDraggingNode) {
    isDraggingNode.x = nodeStartX + (e.clientX - touchStartX) / zoom.value;
    isDraggingNode.y = nodeStartY + (e.clientY - touchStartY) / zoom.value;
  }
};

const handleCanvasMouseUp = () => {
  finalizeDragNodeCreation();
  if (isDraggingNode) saveToStorage();
  isPanning = false;
  isDraggingNode = null;
};

const finalizeDragNodeCreation = () => {
  if (isDraggingNewNode.value && dragStartNode.value) {
    const id = 'node_' + Date.now();
    const newNode = {
      id,
      text: 'New Idea',
      x: dragCurrentX.value,
      y: dragCurrentY.value,
      parentId: dragStartNode.value.id
    };
    nodes.value.push(newNode);
    selectedNodeId.value = id;
    saveToStorage();
  }
  isDraggingNewNode.value = false;
  dragStartNode.value = null;
};

const handleNodeTouchStart = (e, node) => {
  isPanning = false;
  isDraggingNode = node;
  nodeStartX = node.x;
  nodeStartY = node.y;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
};

const handleNodeMouseDown = (e, node) => {
  isPanning = false;
  isDraggingNode = node;
  nodeStartX = node.x;
  nodeStartY = node.y;
  touchStartX = e.clientX;
  touchStartY = e.clientY;
};

const exportData = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes.value, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `mindflow-${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

onMounted(() => {
  loadStorage();
});
</script>
<!-- CHUNK 3: ENFORCED DARK THEME STYLES -->
<style scoped>
/* Main Structural Wrappers & Layout Resets */
.mf-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  user-select: none;
  -webkit-user-select: none;
  box-sizing: border-box;
}

.mf-dark {
  background-color: #030712;
  color: #f3f4f6;
}

/* Application Top Navigation Bar */
.mf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #111827;
  border-bottom: 1px solid #1f2937;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  z-index: 20;
  box-sizing: border-box;
}

.mf-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mf-icon {
  font-size: 20px;
}

.mf-title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.05em;
  margin: 0;
  color: #f9fafb;
}

.mf-actions {
  display: flex;
  gap: 8px;
}

/* Infinite Mapping Canvas Surface & Radial Grid Pattern */
.mf-canvas {
  flex: 1;
  position: relative;
  overflow: hidden;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}

.bg-grid-pattern {
  background-image: radial-gradient(#1e293b 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Hardware-Accelerated Layout Sub-layers */
.mf-svg-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.mf-nodes-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* Absolute Coordinate Node Items Wrapper */
.mf-node-wrapper {
  position: absolute;
  pointer-events: auto;
  transform: translate(-50%, -50%);
  will-change: left, top;
}

/* Custom Interactive Mindmap Node Elements */
.mf-node {
  position: relative;
  background-color: rgba(17, 24, 39, 0.95);
  border: 1px solid #374151;
  color: #f3f4f6;
  padding: 10px 16px;
  border-radius: 12px;
  min-width: 110px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.mf-node:active {
  transform: scale(0.96);
}

.mf-node-selected {
  background-color: #4f46e5;
  border-color: #a5b4fc;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.4), 0 15px 25px -5px rgba(0, 0, 0, 0.6);
}

.mf-node-text {
  font-size: 14px;
  margin: 0;
  max-width: 180px;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
}

/* Link Extender Drag Target Handle */
.mf-node-handle {
  position: absolute;
  right: -12px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background-color: #10b981;
  border: 2px solid #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
  cursor: crosshair;
  z-index: 10;
  transition: transform 0.1s ease;
}

.mf-node-handle:active {
  transform: translateY(-50%) scale(1.2);
  background-color: #059669;
}

/* Standard Button Variations UI Framework */
.mf-btn {
  border: none;
  font-size: 12px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.15s, transform 0.1s;
}

.mf-btn:active {
  transform: scale(0.95);
}

.mf-btn-primary {
  background-color: #4f46e5;
  color: #ffffff;
}

.mf-btn-primary:hover {
  background-color: #4338ca;
}

.mf-btn-secondary {
  background-color: #27272a;
  color: #e4e4e7;
  border: 1px solid #3f3f46;
}

.mf-btn-secondary:hover {
  background-color: #3f3f46;
}

.mf-btn-danger {
  background-color: rgba(127, 29, 29, 0.4);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.mf-btn-danger:hover {
  background-color: rgba(127, 29, 29, 0.6);
}

.mf-w-full {
  width: 100%;
}

/* Mobile Bottom Drawer Context Action panel sheet */
.mf-bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #111827;
  border-top: 1px solid #1f2937;
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 20px;
  box-shadow: 0 -10px 30px -5px rgba(0, 0, 0, 0.7);
  z-index: 50;
  box-sizing: border-box;
}

.mf-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.mf-sheet-label {
  font-size: 11px;
  font-weight: 700;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.mf-sheet-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
}

/* Base Interactive Text Inputs */
.mf-input {
  width: 100%;
  background-color: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  padding: 12px 16px;
  color: #f3f4f6;
  font-size: 16px;
  outline: none;
  margin-bottom: 16px;
  box-sizing: border-box;
}

.mf-input:focus {
  border-color: #4f46e5;
}

.mf-sheet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

/* Screen Float Hint Prompts Label styling */
.mf-floating-hint {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(17, 24, 39, 0.85);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 10px 18px;
  border-radius: 9999px;
  border: 1px solid #1f2937;
  font-size: 12px;
  color: #9ca3af;
  box-shadow: 0 10px 20px -3px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
}
</style>

