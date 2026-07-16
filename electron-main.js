const { app, BrowserWindow, ipcMain, screen } = require("electron");
const fs = require("fs");
const path = require("path");

let mainWindow;
let compactMode = false;
let compactBounds = null;
let alwaysOnTopPreference = true;

function boundsPath() {
  return path.join(app.getPath("userData"), "compact-window.json");
}

function loadCompactBounds() {
  try {
    compactBounds = JSON.parse(fs.readFileSync(boundsPath(), "utf8"));
  } catch {
    compactBounds = null;
  }
}

function saveCompactBounds() {
  if (!mainWindow || !compactMode) return;
  if (mainWindow.isMaximized() || mainWindow.isMinimized()) return;
  compactBounds = mainWindow.getBounds();
  fs.writeFileSync(boundsPath(), JSON.stringify(compactBounds, null, 2));
}

function compactWindow(alwaysOnTop = alwaysOnTopPreference) {
  if (!mainWindow) return;
  // Una ventana maximizada no se puede redimensionar: hay que des-maximizarla primero.
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  const area = screen.getPrimaryDisplay().workArea;
  const savedIsCompact = compactBounds
    && compactBounds.width <= 520
    && compactBounds.height <= 620
    && compactBounds.width >= 210
    && compactBounds.height >= 260;
  const width = savedIsCompact ? compactBounds.width : 260;
  const height = savedIsCompact ? compactBounds.height : 330;
  // Por defecto: esquina inferior izquierda del área de trabajo.
  const x = savedIsCompact ? compactBounds.x : area.x + 18;
  const y = savedIsCompact ? compactBounds.y : area.y + area.height - height - 18;
  compactMode = true;
  mainWindow.setMinimumSize(210, 260);
  mainWindow.setResizable(true);
  alwaysOnTopPreference = Boolean(alwaysOnTop);
  mainWindow.setAlwaysOnTop(alwaysOnTopPreference, "floating");
  mainWindow.setBounds({ x, y, width, height });
}

function expandWindow() {
  if (!mainWindow) return;
  compactMode = false;
  mainWindow.setOpacity(1);
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setResizable(true);
  mainWindow.setMinimumSize(980, 680);
  mainWindow.setBounds({ width: 1240, height: 820 });
  mainWindow.center();
}

function showFullInterface() {
  if (!mainWindow) return;
  compactMode = false;
  mainWindow.setOpacity(1);
  mainWindow.webContents.send("exit-compact-mode");
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setResizable(true);
  mainWindow.setMinimumSize(980, 680);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 980,
    minHeight: 680,
    title: "Focus Tomato",
    backgroundColor: "#f6f4ef",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "tomato-icon.png"),
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "electron-preload.js")
    }
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));

  mainWindow.on("minimize", (event) => {
    event.preventDefault();
    mainWindow.webContents.send("enter-compact-mode");
    compactWindow();
  });

  mainWindow.on("maximize", () => {
    showFullInterface();
  });

  mainWindow.on("restore", () => {
    showFullInterface();
  });

  mainWindow.on("move", saveCompactBounds);
  mainWindow.on("resize", saveCompactBounds);
}

app.whenReady().then(() => {
  loadCompactBounds();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

ipcMain.on("compact-window", (_event, alwaysOnTop) => {
  compactWindow(alwaysOnTop);
});

ipcMain.on("expand-window", () => {
  mainWindow?.webContents.send("exit-compact-mode");
  expandWindow();
});

ipcMain.on("set-always-on-top", (_event, enabled) => {
  if (!mainWindow) return;
  alwaysOnTopPreference = Boolean(enabled);
  mainWindow.setAlwaysOnTop(alwaysOnTopPreference, "floating");
});

ipcMain.on("set-window-opacity", (_event, opacity) => {
  if (!mainWindow) return;
  if (!compactMode) {
    mainWindow.setOpacity(1);
    return;
  }
  const numericOpacity = Number(opacity);
  if (!Number.isFinite(numericOpacity)) return;
  mainWindow.setOpacity(Math.max(0.3, Math.min(1, numericOpacity)));
});
