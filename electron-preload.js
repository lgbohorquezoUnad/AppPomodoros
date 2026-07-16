const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("focusTomatoDesktop", {
  compact: (alwaysOnTop) => ipcRenderer.send("compact-window", alwaysOnTop),
  expand: () => ipcRenderer.send("expand-window"),
  setAlwaysOnTop: (enabled) => ipcRenderer.send("set-always-on-top", enabled),
  setOpacity: (opacity) => ipcRenderer.send("set-window-opacity", opacity),
  onEnterCompact: (callback) => ipcRenderer.on("enter-compact-mode", callback),
  onExitCompact: (callback) => ipcRenderer.on("exit-compact-mode", callback)
});
