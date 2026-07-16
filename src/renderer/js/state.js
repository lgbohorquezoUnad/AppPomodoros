const state = {
  tasks: [],
  activeTaskId: null,
  mode: "focus",
  running: false,
  remaining: 25 * 60,
  total: 25 * 60,
  completedFocus: 0,
  focusMinutes: 0,
  cycle: 1,
  timerId: null,
  endTime: null,
  lastStatsReset: new Date().toDateString(),
  settings: {
    focus: 25,
    short: 5,
    long: 15,
    cycles: 4,
    sound: true,
    volume: 120,
    tone: "classic",
    customTone: "660,880,1046",
    floating: true,
    alwaysOnTop: true,
    autoBreak: false,
    autoFocus: false,
    darkTheme: false,
    compactOpacity: 100
  }
};

function loadState() {
  const saved = localStorage.getItem("focusTomatoState");
  if (!saved) return false;

  try {
    const parsed = JSON.parse(saved);
    state.tasks = Array.isArray(parsed.tasks) ? parsed.tasks : [];
    state.activeTaskId = parsed.activeTaskId ?? null;
    state.completedFocus = parsed.completedFocus ?? 0;
    state.focusMinutes = parsed.focusMinutes ?? 0;
    state.cycle = parsed.cycle ?? 1;
    state.settings = { ...state.settings, ...(parsed.settings ?? {}) };
    applySettingsToInputs();

    // Reiniciar estadísticas si cambió el día.
    const today = new Date().toDateString();
    const lastReset = parsed.lastStatsReset;
    if (lastReset !== today) {
      state.completedFocus = 0;
      state.focusMinutes = 0;
      state.lastStatsReset = today;
    } else {
      state.lastStatsReset = lastReset;
    }

    state.mode = parsed.mode === "short" || parsed.mode === "long" ? parsed.mode : "focus";
    state.total = getModeMinutes(state.mode) * 60;

    if (parsed.running && parsed.endTime) {
      const secondsLeft = Math.ceil((parsed.endTime - Date.now()) / 1000);
      if (secondsLeft > 0) {
        // La sesión seguía corriendo al cerrar: la reanudamos con el tiempo real transcurrido.
        state.remaining = Math.min(secondsLeft, state.total);
        return true;
      }
      // La sesión terminó mientras la app estaba cerrada: arrancamos limpio en este modo.
      state.remaining = state.total;
      return false;
    }

    const savedRemaining = Number(parsed.remaining);
    state.remaining = Number.isFinite(savedRemaining)
      ? Math.max(0, Math.min(savedRemaining, state.total))
      : state.total;
    return false;
  } catch {
    localStorage.removeItem("focusTomatoState");
    return false;
  }
}

function saveState() {
  localStorage.setItem("focusTomatoState", JSON.stringify({
    tasks: state.tasks,
    activeTaskId: state.activeTaskId,
    completedFocus: state.completedFocus,
    focusMinutes: state.focusMinutes,
    cycle: state.cycle,
    mode: state.mode,
    remaining: state.remaining,
    running: state.running,
    endTime: state.endTime,
    lastStatsReset: state.lastStatsReset,
    settings: state.settings
  }));
}

function applySettingsToInputs() {
  elements.focusInput.value = state.settings.focus;
  elements.shortInput.value = state.settings.short;
  elements.longInput.value = state.settings.long;
  elements.cyclesInput.value = state.settings.cycles;
  elements.opacityInput.value = state.settings.compactOpacity;
  elements.opacityValue.textContent = `${state.settings.compactOpacity}%`;
  elements.compactOpacityInput.value = state.settings.compactOpacity;
  elements.compactOpacityValue.textContent = `${state.settings.compactOpacity}%`;
  elements.volumeInput.value = state.settings.volume;
  elements.volumeValue.textContent = `${state.settings.volume}%`;
  elements.toneSelect.value = state.settings.tone;
  elements.customToneInput.value = state.settings.customTone;
  elements.soundToggle.checked = state.settings.sound;
  elements.floatingToggle.checked = state.settings.floating;
  elements.alwaysOnTopToggle.checked = state.settings.alwaysOnTop;
  elements.autoBreakToggle.checked = state.settings.autoBreak;
  elements.autoFocusToggle.checked = state.settings.autoFocus;
  elements.darkThemeToggle.checked = state.settings.darkTheme;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function getModeMinutes(mode = state.mode) {
  if (mode === "short") return state.settings.short;
  if (mode === "long") return state.settings.long;
  return state.settings.focus;
}

function getModeLabel() {
  if (state.mode === "short") return "Descanso corto";
  if (state.mode === "long") return "Descanso largo";
  return "Enfoque";
}

function getModeShortLabel() {
  if (state.mode === "short") return "DESCANSO CORTO";
  if (state.mode === "long") return "DESCANSO LARGO";
  return "ENFOQUE";
}
