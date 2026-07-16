let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

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
