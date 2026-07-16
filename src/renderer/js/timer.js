function setMode(mode, persist = true) {
  state.mode = mode;
  state.total = getModeMinutes(mode) * 60;
  state.remaining = state.total;
  if (persist) saveState();
  render();
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
