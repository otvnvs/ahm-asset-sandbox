<template>
  <div class="mobile-container">
    <!-- Minimalist Status/Header Space -->
    <header class="app-header">
      <h1 class="header-title">Apps</h1>
      <span class="status-dot"></span>
    </header>

    <!-- App Grid Layout -->
    <main class="app-grid">
      <div 
        v-for="app in apps" 
        :key="app.id" 
        class="app-item"
        @click="navigateTo(app.route)"
      >
        <!-- Dark minimalist icon frame -->
        <div class="icon-wrapper">
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="1.5" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            class="app-icon"
            v-html="app.svgContent"
          ></svg>
        </div>
        <span class="app-label">{{ app.name }}</span>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Vanilla SVG inner paths (Ultra-light stroke style)
const apps = ref([
  { 
    id: 1, 
    name: 'Spreadsheet', 
    route: '/spreadsheet', 
    //svgContent: '<polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line>' //terminal
    svgContent: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="10" y1="10" x2="10" y2="20"></line>'

  },
  { 
    id: 2, 
    name: 'Todo', 
    route: '/todo', 
    //svgContent: '<line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="3"></rect>' 
    svgContent: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><path d="m9 12 2 2 4-4"></path><line x1="3" y1="10" x2="21" y2="10"></line>'

  },
  { 
    id: 3, 
    name: 'Mind Map', 
    route: '/mindmap', 
    //svgContent: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' 
    svgContent: '<circle cx="12" cy="12" r="2.5"></circle><path d="M12 9.5V4.5"></path><path d="m14 13.5 4 2.5"></path><path d="m10 13.5-4 2.5"></path><circle cx="12" cy="3.5" r="1"></circle><circle cx="19" cy="16.5" r="1"></circle><circle cx="5" cy="16.5" r="1"></circle><path d="M18 16.5h2"></path><path d="M6 16.5H4"></path>'

  },
  { 
    id: 4, 
    name: 'Calendar', 
    route: '/calendar', 
    //svgContent: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>' //cog
    svgContent: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>'

  },
  {
    id: 5, 
    name: 'Synth', 
    route: '/tapsynth', 
    svgContent: '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>'
  },
  {
    id: 6, 
    name: 'Editor', 
    route: '/editor', 
    svgContent: '<path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>'
  },
  {
    id: 7,
    name: 'Alarm',
    route: '/alarm',
    svgContent: '<circle cx="12" cy="13" r="7" /><path d="M5 6.5C4 7.5 3 9 3 10.5" /><path d="M19 6.5C20 7.5 21 9 21 10.5" /><path d="M7 20l-1.5 2" /><path d="M17 20l1.5 2" /><path d="M12 10v3h3" />'
  },
  {
    id: 8,
    name: 'Composer',
    route: '/composer',
    svgContent: '<path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /><path d="M12 10h9" /><path d="M3 5h3" /><path d="M3 9h10" /><path d="M3 13h5" />'
  },
{
  id: 9,
  name: 'Local Storage',
  route: '/localstorage',
  svgContent: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /><path d="M6 10v7" /><path d="M6 13h4" /><path d="M6 17h4" /><path d="M10 12h3" /><path d="M10 16h3" />'
}

])

const navigateTo = (route) => {
  router.push(route)
}
</script>

<style scoped>
/* OLED Black / Deep Slate Shell */
.mobile-container {
  margin: 0 auto;
  min-height: 100vh;
  background-color: #0a0a0c;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #f3f4f6;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
}

/* Minimalist Header Alignment */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px 24px 16px 24px;
}

.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.05em;
  color: #8e8e93;
  text-transform: uppercase;
}

.status-dot {
  width: 6px;
  height: 6px;
  background-color: #30d158;
  border-radius: 50%;
}

/* 4-Column strict spacing */
.app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px 12px;
  padding: 24px;
}

/* Touch targets */
.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: opacity 0.15s ease;
}

/* Monochromatic tap feedback */
.app-item:active {
  opacity: 0.5;
}

/* Dark uniform square wrapper */
.icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  background-color: #16161a;
  border: 1px solid #242429;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

/* High-contrast white stroke lines */
.app-icon {
  width: 22px;
  height: 22px;
  color: #ffffff;
}

/* Muted modern text labeling */
.app-label {
  font-size: 11px;
  font-weight: 400;
  color: #8e8e93;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  letter-spacing: 0.01em;
}
</style>

