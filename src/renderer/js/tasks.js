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
