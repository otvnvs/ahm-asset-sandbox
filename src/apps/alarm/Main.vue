<!-- ./src/Main.vue -->
<template>
  <div class="app">
    <!-- Big Monospace Time Display -->
    <div class="time">{{ formattedTime }}</div>

    <!-- Target Selection Row (15-minute intervals) -->
    <div class="target-control">
      <button @click="changeAlarm(-5)" :disabled="isRunning || isRinging" class="btn-step">−</button>
      <div class="target-label">
        Target: <span class="accent">{{ alarmMinutes }}m</span>
      </div>
      <button @click="changeAlarm(5)" :disabled="isRunning || isRinging" class="btn-step">+</button>
    </div>

    <!-- Beautiful Pulsing Alarm Interrupt Overlay -->
    <div v-if="isRinging" class="alarm-overlay">
      <div class="alarm-card">
        <div class="alarm-title">TIME UP</div>
        <div class="alarm-subtitle">Target of {{ alarmMinutes }}m reached</div>
        <button @click="dismissAlarm" class="btn-dismiss">DISMISS ALARM</button>
      </div>
    </div>

    <!-- Core Controls Grid -->
    <div class="main-controls">
      <button @click="reset" class="btn-action">RESET</button>
      <button v-if="!isRunning" @click="start" class="btn-action start">START</button>
      <button v-else @click="stop" class="btn-action stop">STOP</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

// --- State Variables ---
const elapsedTime = ref(0);
const isRunning = ref(false);
const alarmMinutes = ref(0);
const alarmTriggered = ref(false);
const isRinging = ref(false);

let timerInterval = null, startTime = null, audioCtx = null, ringLoop = null;

// --- Time Formatting Logic ---
const formattedTime = computed(() => {
  const totalSecs = Math.floor(elapsedTime.value / 1000);
  const ms = Math.floor((elapsedTime.value % 1000) / 10);
  const s = totalSecs % 60;
  const m = Math.floor(totalSecs / 60) % 60;
  const h = Math.floor(totalSecs / 3600);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms)}`;
});

// --- Aggressive Square Wave Alarm Engine ---
const playHardBeep = () => {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square'; // Aggressive, jarring waveform
    osc.frequency.setValueAtTime(1200, audioCtx.currentTime); // Piercing high frequency

    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime + 0.25); // Harsh quick cutoff

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {}
};

const triggerAlarm = () => {
  isRinging.value = true;
  if (ringLoop) clearInterval(ringLoop);
  playHardBeep();
  ringLoop = setInterval(playHardBeep, 400); // Swift repetitive timing
};

const dismissAlarm = () => {
  isRinging.value = false;
  clearInterval(ringLoop);
  save();
};

// --- Operations & Stopwatch Timing Core ---
const changeAlarm = (amount) => {
  alarmMinutes.value = Math.max(0, alarmMinutes.value + amount);
};

const start = () => {
  if (isRunning.value) return;
  isRunning.value = true;
  startTime = Date.now() - elapsedTime.value;
  timerInterval = setInterval(() => {
    elapsedTime.value = Date.now() - startTime;
    if (alarmMinutes.value > 0 && !alarmTriggered.value && (elapsedTime.value / 60000) >= alarmMinutes.value) {
      alarmTriggered.value = true;
      triggerAlarm();
    }
  }, 10);
};

const stop = () => { isRunning.value = false; clearInterval(timerInterval); };
const reset = () => { stop(); dismissAlarm(); elapsedTime.value = 0; alarmTriggered.value = false; save(); };

// --- Local Storage Synchronization Sync ---
const save = () => {
  localStorage.setItem('min-sw-v2', JSON.stringify({
    elapsedTime: elapsedTime.value, isRunning: isRunning.value,
    alarmMinutes: alarmMinutes.value, alarmTriggered: alarmTriggered.value,
    isRinging: isRinging.value, savedAt: Date.now()
  }));
};

onMounted(() => {
  const saved = localStorage.getItem('min-sw-v2');
  if (!saved) return;
  try {
    const s = JSON.parse(saved);
    alarmMinutes.value = s.alarmMinutes || 0;
    alarmTriggered.value = s.alarmTriggered || false;
    if (s.isRinging) triggerAlarm();
    if (s.isRunning) {
      elapsedTime.value = (s.elapsedTime || 0) + (Date.now() - s.savedAt);
      start();
    } else {
      elapsedTime.value = s.elapsedTime || 0;
    }
  } catch (e) {}
  window.addEventListener('beforeunload', save);
  window.addEventListener('visibilitychange', save);
});

onUnmounted(() => { clearInterval(timerInterval); clearInterval(ringLoop); });
watch([elapsedTime, isRunning, alarmMinutes, alarmTriggered, isRinging], save);
</script>

<style scoped>
/* Low Footprint OLED Dark Base Structure */
.app {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: #050505; color: #fff; font-family: monospace;
  display: flex; flex-direction: column; justify-content: space-around; align-items: center;
  box-sizing: border-box; padding: 30px; text-align: center;
}

.time { font-size: 13vw; font-variant-numeric: tabular-nums; font-weight: bold; letter-spacing: -2px; }

/* Large Touch Target Config Rules */
.target-control { display: flex; align-items: center; gap: 24px; width: 100%; justify-content: center; }
.btn-step { width: 84px; height: 84px; font-size: 2.5rem; background: #121212; color: #fff; border: 1px solid #262626; border-radius: 16px; font-weight: bold; cursor: pointer; }
.btn-step:active { background: #262626; }
.target-label { font-size: 1.6rem; min-width: 150px; color: #a3a3a3; }
.accent { color: #3b82f6; font-weight: bold; }

/* Elegant Fullscreen Breathing Ambient Overlay */
.alarm-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex; justify-content: center; align-items: center; z-index: 1000;
  animation: pulse-bg 1.5s infinite alternate ease-in-out;
}

.alarm-card {
  background: #111; border: 1px solid #ef4444; border-radius: 24px;
  padding: 40px 24px; width: 85%; max-width: 360px;
  box-shadow: 0 10px 40px rgba(239, 68, 68, 0.2);
  animation: float-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.alarm-title { font-size: 2.2rem; font-weight: 900; color: #ef4444; letter-spacing: 2px; margin-bottom: 8px; }
.alarm-subtitle { font-size: 1rem; color: #a3a3a3; margin-bottom: 32px; }

.btn-dismiss {
  width: 100%; padding: 20px; background: #ef4444; color: #fff;
  font-size: 1.1rem; font-weight: bold; border: none; border-radius: 14px;
  cursor: pointer; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
.btn-dismiss:active { transform: scale(0.98); opacity: 0.9; }

/* Control Operations Grid */
.main-controls { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; width: 100%; max-width: 500px; }
.btn-action { padding: 26px; font-size: 1.3rem; font-weight: bold; background: #121212; color: #fff; border: 1px solid #262626; border-radius: 16px; cursor: pointer; letter-spacing: 1px; }
.btn-action:active { transform: scale(0.98); }
.start { background: #064e3b; border-color: #059669; color: #34d399; }
.stop { background: #7f1d1d; border-color: #dc2626; color: #f87171; }

/* UI Keyframe Animations */
@keyframes pulse-bg {
  0% { background: rgba(5, 5, 5, 0.85); }
  100% { background: rgba(69, 10, 10, 0.9); }
}

@keyframes float-up {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
</style>

