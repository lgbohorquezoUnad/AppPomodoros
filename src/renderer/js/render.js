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
