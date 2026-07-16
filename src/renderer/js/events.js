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
