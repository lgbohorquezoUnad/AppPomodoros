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

const $ = (selector) => document.querySelector(selector);
let audioContext = null;

// Variables para el arrastre del tomate flotante
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

const elements = {
  taskForm: $("#taskForm"),
  taskInput: $("#taskInput"),
  taskList: $("#taskList"),
  clearDoneButton: $("#clearDoneButton"),
  modeLabel: $("#modeLabel"),
  activeTaskLabel: $("#activeTaskLabel"),
  cycleLabel: $("#cycleLabel"),
  progressRing: $("#progressRing"),
  timeLabel: $("#timeLabel"),
  timerCaption: $("#timerCaption"),
  startPauseButton: $("#startPauseButton"),
  resetButton: $("#resetButton"),
  skipButton: $("#skipButton"),
  compactButton: $("#compactButton"),
  expandButton: $("#expandButton"),
  compactModeLabel: $("#compactModeLabel"),
  compactStartPauseButton: $("#compactStartPauseButton"),
  compactResetButton: $("#compactResetButton"),
  compactPinButton: $("#compactPinButton"),
  donePomodoros: $("#donePomodoros"),
  focusMinutes: $("#focusMinutes"),
  completedTasks: $("#completedTasks"),
  focusInput: $("#focusInput"),
  shortInput: $("#shortInput"),
  longInput: $("#longInput"),
  cyclesInput: $("#cyclesInput"),
  opacityInput: $("#opacityInput"),
  opacityValue: $("#opacityValue"),
  compactOpacityInput: $("#compactOpacityInput"),
  compactOpacityValue: $("#compactOpacityValue"),
  volumeInput: $("#volumeInput"),
  volumeValue: $("#volumeValue"),
  toneSelect: $("#toneSelect"),
  customToneSetting: $("#customToneSetting"),
  customToneInput: $("#customToneInput"),
  soundToggle: $("#soundToggle"),
  testSoundButton: $("#testSoundButton"),
  floatingToggle: $("#floatingToggle"),
  alwaysOnTopToggle: $("#alwaysOnTopToggle"),
  autoBreakToggle: $("#autoBreakToggle"),
  autoFocusToggle: $("#autoFocusToggle"),
  darkThemeToggle: $("#darkThemeToggle"),
  floatingTomato: $("#floatingTomato"),
  tomato: $("#tomato"),
  tomatoMinutes: $("#tomatoMinutes"),
  tomatoStatus: $("#tomatoStatus"),
  progressBarTop: $("#progressBarTop")
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

function setMode(mode, persist = true) {
  state.mode = mode;
  state.total = getModeMinutes(mode) * 60;
  state.remaining = state.total;
  if (persist) saveState();
  render();
}

function addTask(title) {
  const task = {
    id: crypto.randomUUID(),
    title,
    done: false,
    pomodoros: 0
  };
  state.tasks.unshift(task);
  state.activeTaskId = task.id;
  saveState();
  render();
}

function getActiveTask() {
  return state.tasks.find((task) => task.id === state.activeTaskId);
}

function renderTasks() {
  elements.taskList.innerHTML = "";

  if (state.tasks.length === 0) {
    const empty = document.createElement("li");
    empty.className = "task-item";
    empty.innerHTML = '<span></span><span class="task-title">Agrega tu primera tarea</span><span></span>';
    elements.taskList.appendChild(empty);
    return;
  }

  state.tasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item${task.done ? " done" : ""}${task.id === state.activeTaskId ? " active" : ""}`;

    const check = document.createElement("button");
    check.className = "task-check";
    check.type = "button";
    check.title = task.done ? "Marcar pendiente" : "Marcar hecha";
    check.textContent = task.done ? "✓" : "";
    check.addEventListener("click", () => {
      task.done = !task.done;
      saveState();
      render();
    });

    const title = document.createElement("button");
    title.className = "task-title";
    title.type = "button";
    title.textContent = `${task.title} · ${task.pomodoros} pom.`;
    title.addEventListener("click", () => {
      state.activeTaskId = task.id;
      saveState();
      render();
    });

    const remove = document.createElement("button");
    remove.className = "task-delete";
    remove.type = "button";
    remove.title = "Eliminar tarea";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      item.classList.add("deleting");
      window.setTimeout(() => {
        state.tasks = state.tasks.filter((entry) => entry.id !== task.id);
        if (state.activeTaskId === task.id) state.activeTaskId = state.tasks[0]?.id ?? null;
        saveState();
        render();
      }, 300);
    });

    item.append(check, title, remove);
    elements.taskList.appendChild(item);
  });
}

function renderTomato(progress) {
  const ripeness = Math.round(progress * 100);
  elements.tomato.style.setProperty("--ripe", `${ripeness}%`);
  elements.tomato.classList.toggle("running", state.running);
  elements.tomato.classList.toggle("break-mode", state.mode !== "focus");
  elements.tomato.classList.toggle("long-break-mode", state.mode === "long");
  elements.tomatoMinutes.textContent = document.body.classList.contains("compact-mode")
    ? formatTime(state.remaining)
    : Math.ceil(state.remaining / 60).toString();

  if (state.mode === "short") {
    elements.tomatoStatus.textContent = "Descanso corto";
  } else if (state.mode === "long") {
    elements.tomatoStatus.textContent = "Descanso largo";
  } else if (ripeness < 35) {
    elements.tomatoStatus.textContent = "Tomate verde";
  } else if (ripeness < 75) {
    elements.tomatoStatus.textContent = "Madurando";
  } else {
    elements.tomatoStatus.textContent = "Casi listo";
  }

  // En compacto el tomate es la interfaz principal: siempre visible.
  // En modo normal se muestra si "Tomate flotante" está activado.
  const isCompact = document.body.classList.contains("compact-mode");
  elements.floatingTomato.classList.toggle("hidden", !isCompact && !state.settings.floating);
}

function animateCounter(element) {
  if (!element) return;
  element.classList.remove("animating");
  void element.offsetWidth;
  element.classList.add("animating");
}

function updateProgressBar() {
  if (!elements.progressBarTop) return;
  const progress = state.total > 0 ? (1 - state.remaining / state.total) * 100 : 0;
  elements.progressBarTop.style.setProperty("--progress-top", `${progress}%`);

  const isUrgent = state.running && state.remaining > 0 && state.remaining <= 30;
  elements.progressBarTop.classList.toggle("urgent", isUrgent);
}

function applyFloatPosition(x, y) {
  const el = elements.floatingTomato;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const maxX = Math.max(0, window.innerWidth - rect.width);
  const maxY = Math.max(0, window.innerHeight - rect.height);
  el.style.animation = "none";
  el.style.right = "auto";
  el.style.bottom = "auto";
  el.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
  el.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
}

function clearFloatingTomatoInlinePosition() {
  const el = elements.floatingTomato;
  if (!el) return;
  el.style.left = "";
  el.style.top = "";
  el.style.right = "";
  el.style.bottom = "";
  el.style.animation = "";
}

function restoreFloatingTomatoPosition() {
  const saved = localStorage.getItem("focusTomatoFloatPos");
  if (!saved) return;
  try {
    const pos = JSON.parse(saved);
    if (Number.isFinite(pos.x) && Number.isFinite(pos.y)) applyFloatPosition(pos.x, pos.y);
  } catch {
    localStorage.removeItem("focusTomatoFloatPos");
  }
}

function initFloatingTomatoDrag() {
  const el = elements.floatingTomato;
  if (!el) return;

  el.addEventListener("pointerdown", (e) => {
    // En modo compacto la ventana entera se mueve con -webkit-app-region: drag.
    if (document.body.classList.contains("compact-mode")) return;
    // No iniciar arrastre desde los botones o el slider del propio widget.
    if (e.target.closest("button, input")) return;

    e.preventDefault(); // evita seleccionar texto mientras se arrastra
    isDragging = true;
    const rect = el.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    el.classList.add("dragging");
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    applyFloatPosition(e.clientX - dragOffsetX, e.clientY - dragOffsetY);
  });

  const endDrag = () => {
    if (!isDragging) return;
    isDragging = false;
    el.classList.remove("dragging");
    const rect = el.getBoundingClientRect();
    localStorage.setItem("focusTomatoFloatPos", JSON.stringify({ x: rect.left, y: rect.top }));
  };
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);

  restoreFloatingTomatoPosition();
}

function createConfetti() {
  if (document.body.classList.contains("compact-mode")) return;

  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
  `;
  document.body.appendChild(container);

  const colors = ["#c44536", "#5d8d55", "#426b8f", "#e4b84f"];
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div");
    const size = Math.random() * 8 + 4;
    const delay = Math.random() * 0.2;
    confetti.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: 0;
      top: 0;
      border-radius: 50%;
      --tx: ${(Math.random() - 0.5) * 300}px;
      --ty: ${Math.random() * 400 - 200}px;
      --tr: ${Math.random() * 720}deg;
      animation: confetti 2s ease-out ${delay}s forwards;
    `;
    container.appendChild(confetti);
  }

  window.setTimeout(() => container.remove(), 2500);
}

function render() {
  const activeTask = getActiveTask();
  const progress = state.total > 0 ? 1 - state.remaining / state.total : 0;
  const doneTasks = state.tasks.filter((task) => task.done).length;

  elements.modeLabel.textContent = getModeLabel();
  elements.compactModeLabel.textContent = getModeShortLabel();
  elements.activeTaskLabel.textContent = activeTask?.title ?? "Selecciona una tarea";
  elements.cycleLabel.textContent = `Ciclo ${state.cycle} de ${state.settings.cycles}`;
  elements.timeLabel.textContent = formatTime(state.remaining);
  elements.timerCaption.textContent = state.running ? "Sesión en marcha" : "Listo para empezar";
  elements.startPauseButton.textContent = state.running ? "Pausar" : "Iniciar";
  elements.compactStartPauseButton.textContent = state.running ? "Ⅱ" : "▶";
  elements.compactPinButton.classList.toggle("active", state.settings.alwaysOnTop);
  elements.compactPinButton.title = state.settings.alwaysOnTop ? "Quitar siempre encima" : "Fijar encima";
  elements.progressRing.style.setProperty("--progress", `${Math.round(progress * 360)}deg`);
  elements.donePomodoros.textContent = state.completedFocus;
  elements.focusMinutes.textContent = state.focusMinutes;
  elements.completedTasks.textContent = doneTasks;

  renderTasks();
  renderTomato(progress);
  document.body.classList.toggle("dark-theme", state.settings.darkTheme);
  document.body.classList.toggle("focus-mode", state.mode === "focus");
  document.body.classList.toggle("short-break-mode", state.mode === "short");
  document.body.classList.toggle("long-break-mode", state.mode === "long");
  document.body.style.setProperty("--compact-opacity", state.settings.compactOpacity / 100);
  elements.customToneSetting.classList.toggle("visible", state.settings.tone === "custom");
  updateProgressBar();
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioContext) audioContext = new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function playTone(audio, frequency, startAt, duration, volume = 0.18) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = state.settings.tone === "soft" ? "sine" : "triangle";
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.03);
}

function getToneFrequencies() {
  const presets = {
    classic: [660, 880, 1046],
    soft: [440, 554, 659],
    deep: [220, 277, 330],
    bright: [784, 988, 1318]
  };

  if (state.settings.tone !== "custom") return presets[state.settings.tone] ?? presets.classic;

  const custom = state.settings.customTone
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value >= 80 && value <= 2000)
    .slice(0, 6);

  return custom.length > 0 ? custom : presets.classic;
}

function playDoneSound(force = false) {
  if (!state.settings.sound) return;
  const audio = getAudioContext();
  if (!audio) return;
  const now = audio.currentTime + (force ? 0.01 : 0.05);
  const frequencies = getToneFrequencies();
  const baseVolume = Math.max(0, Math.min(2, state.settings.volume / 100));
  frequencies.forEach((frequency, index) => {
    const isLastTone = index === frequencies.length - 1;
    playTone(audio, frequency, now + index * 0.26, isLastTone ? 0.46 : 0.28, Math.min(0.85, baseVolume * (isLastTone ? 0.42 : 0.48)));
  });
}

function notifyDone() {
  playDoneSound();
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Focus Tomato", { body: `${getModeLabel()} terminado.` });
  }
}

function finishSession() {
  const activeTask = getActiveTask();
  const finishedMode = state.mode;

  // Cerramos el conteo actual antes de cambiar de modo para que stopTimer no
  // recalcule el tiempo restante a partir de un endTime ya vencido (p. ej. al "Saltar").
  state.endTime = null;

  notifyDone();

  if (state.mode === "focus") {
    state.completedFocus += 1;
    state.focusMinutes += state.settings.focus;
    if (activeTask) activeTask.pomodoros += 1;
    const nextIsLong = state.completedFocus % state.settings.cycles === 0;
    state.cycle = nextIsLong ? state.settings.cycles : (state.completedFocus % state.settings.cycles) + 1;
    setMode(nextIsLong ? "long" : "short");
  } else {
    setMode("focus");
  }

  stopTimer(false);
  const shouldAutoStart = finishedMode === "focus" ? state.settings.autoBreak : state.settings.autoFocus;
  saveState();
  render();

  // Animar los contadores y crear confeti después de una sesión de focus completada
  if (finishedMode === "focus") {
    createConfetti();
    window.setTimeout(() => {
      animateCounter(elements.donePomodoros);
      animateCounter(elements.focusMinutes);
    }, 100);
  }

  updateProgressBar();
  if (shouldAutoStart) startTimer();
}

function tick() {
  // El tiempo restante se deriva de la hora de fin, no de restar 1s por tick.
  // Así el conteo es exacto aunque Windows ralentice los timers en segundo plano
  // o el equipo se suspenda.
  const secondsLeft = (state.endTime - Date.now()) / 1000;
  if (secondsLeft <= 0) {
    state.remaining = 0;
    state.endTime = null;
    finishSession();
    return;
  }
  state.remaining = Math.ceil(secondsLeft);
  render();
  updateProgressBar();
}

function startTimer() {
  if (state.running) return;

  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }

  state.running = true;
  state.endTime = Date.now() + state.remaining * 1000;
  state.timerId = window.setInterval(tick, 250);
  saveState();
  render();
}

function stopTimer(renderAfter = true) {
  if (state.running && state.endTime) {
    state.remaining = Math.max(0, Math.ceil((state.endTime - Date.now()) / 1000));
  }
  state.running = false;
  window.clearInterval(state.timerId);
  state.timerId = null;
  state.endTime = null;
  saveState();
  if (renderAfter) render();
}

function resetTimer() {
  stopTimer(false);
  state.remaining = state.total;
  saveState();
  render();
}

function updateSetting(key, value) {
  state.settings[key] = value;
  const currentWasAtStart = state.remaining === state.total || !state.running;
  state.total = getModeMinutes() * 60;
  if (currentWasAtStart) state.remaining = state.total;
  if (state.running) state.endTime = Date.now() + state.remaining * 1000;
  saveState();
  if (key === "alwaysOnTop") window.focusTomatoDesktop?.setAlwaysOnTop?.(value);
  if (key === "compactOpacity") {
    elements.opacityInput.value = value;
    elements.opacityValue.textContent = `${value}%`;
    elements.compactOpacityInput.value = value;
    elements.compactOpacityValue.textContent = `${value}%`;
    window.focusTomatoDesktop?.setOpacity?.(document.body.classList.contains("compact-mode") ? value / 100 : 1);
  }
  if (key === "volume") {
    elements.volumeInput.value = value;
    elements.volumeValue.textContent = `${value}%`;
  }
  if (key === "tone") elements.toneSelect.value = value;
  if (key === "customTone") elements.customToneInput.value = value;
  render();
}

elements.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = elements.taskInput.value.trim();
  if (!title) return;
  addTask(title);
  elements.taskInput.value = "";
});

elements.clearDoneButton.addEventListener("click", () => {
  state.tasks = state.tasks.filter((task) => !task.done);
  if (!state.tasks.some((task) => task.id === state.activeTaskId)) {
    state.activeTaskId = state.tasks[0]?.id ?? null;
  }
  saveState();
  render();
});

elements.startPauseButton.addEventListener("click", () => {
  getAudioContext();
  if (state.running) {
    stopTimer();
  } else {
    startTimer();
  }
});

elements.resetButton.addEventListener("click", resetTimer);
elements.skipButton.addEventListener("click", finishSession);
elements.testSoundButton.addEventListener("click", () => {
  state.settings.sound = true;
  elements.soundToggle.checked = true;
  saveState();
  playDoneSound(true);
});
elements.compactStartPauseButton.addEventListener("click", () => {
  if (state.running) {
    stopTimer();
  } else {
    startTimer();
  }
});
elements.compactResetButton.addEventListener("click", resetTimer);
elements.compactPinButton.addEventListener("click", () => {
  updateSetting("alwaysOnTop", !state.settings.alwaysOnTop);
});
elements.compactButton.addEventListener("click", () => {
  document.body.classList.add("compact-mode");
  clearFloatingTomatoInlinePosition();
  window.focusTomatoDesktop?.compact(state.settings.alwaysOnTop);
  window.setTimeout(() => {
    window.focusTomatoDesktop?.setOpacity?.(state.settings.compactOpacity / 100);
  }, 80);
  render();
});
elements.expandButton.addEventListener("click", () => {
  document.body.classList.remove("compact-mode");
  restoreFloatingTomatoPosition();
  window.focusTomatoDesktop?.setOpacity?.(1);
  window.focusTomatoDesktop?.expand();
  render();
});

window.focusTomatoDesktop?.onEnterCompact?.(() => {
  document.body.classList.add("compact-mode");
  clearFloatingTomatoInlinePosition();
  window.setTimeout(() => {
    window.focusTomatoDesktop?.setOpacity?.(state.settings.compactOpacity / 100);
  }, 80);
  render();
});

window.focusTomatoDesktop?.onExitCompact?.(() => {
  document.body.classList.remove("compact-mode");
  restoreFloatingTomatoPosition();
  window.focusTomatoDesktop?.setOpacity?.(1);
  render();
});

elements.focusInput.addEventListener("change", () => updateSetting("focus", Math.max(1, Number(elements.focusInput.value) || 25)));
elements.shortInput.addEventListener("change", () => updateSetting("short", Math.max(1, Number(elements.shortInput.value) || 5)));
elements.longInput.addEventListener("change", () => updateSetting("long", Math.max(1, Number(elements.longInput.value) || 15)));
elements.cyclesInput.addEventListener("change", () => updateSetting("cycles", Math.max(2, Number(elements.cyclesInput.value) || 4)));
elements.opacityInput.addEventListener("input", () => updateSetting("compactOpacity", Math.max(30, Math.min(100, Number(elements.opacityInput.value) || 100))));
elements.compactOpacityInput.addEventListener("input", (e) => {
  const val = Math.max(30, Math.min(100, Number(e.target.value) || 100));
  updateSetting("compactOpacity", val);
  // Feedback visual: la ventana se vuelve más transparente en tiempo real
  const isCompact = document.body.classList.contains("compact-mode");
  if (isCompact) {
    window.focusTomatoDesktop?.setOpacity?.(val / 100);
    // Animar el control mientras se arrastra
    elements.progressBarTop?.classList.add("dragging");
  }
});

elements.compactOpacityInput.addEventListener("mousedown", () => {
  elements.progressBarTop?.classList.add("dragging");
});

elements.compactOpacityInput.addEventListener("mouseup", () => {
  window.setTimeout(() => elements.progressBarTop?.classList.remove("dragging"), 300);
});

elements.compactOpacityInput.addEventListener("touchstart", () => {
  elements.progressBarTop?.classList.add("dragging");
});

elements.compactOpacityInput.addEventListener("touchend", () => {
  window.setTimeout(() => elements.progressBarTop?.classList.remove("dragging"), 300);
});
elements.volumeInput.addEventListener("input", () => updateSetting("volume", Math.max(0, Math.min(200, Number(elements.volumeInput.value) || 0))));
elements.toneSelect.addEventListener("change", () => updateSetting("tone", elements.toneSelect.value));
elements.customToneInput.addEventListener("change", () => updateSetting("customTone", elements.customToneInput.value.trim() || "660,880,1046"));
elements.soundToggle.addEventListener("change", () => updateSetting("sound", elements.soundToggle.checked));
elements.floatingToggle.addEventListener("change", () => updateSetting("floating", elements.floatingToggle.checked));
elements.alwaysOnTopToggle.addEventListener("change", () => updateSetting("alwaysOnTop", elements.alwaysOnTopToggle.checked));
elements.autoBreakToggle.addEventListener("change", () => updateSetting("autoBreak", elements.autoBreakToggle.checked));
elements.autoFocusToggle.addEventListener("change", () => updateSetting("autoFocus", elements.autoFocusToggle.checked));
elements.darkThemeToggle.addEventListener("change", () => updateSetting("darkTheme", elements.darkThemeToggle.checked));

const shouldResume = loadState();
applySettingsToInputs();
render();
if (shouldResume) startTimer();
initFloatingTomatoDrag();
