const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  connectDrive: (username, password) =>
    ipcRenderer.invoke("connect-drive", username, password),

  openExternal: (url) => ipcRenderer.invoke("open-external", url),

  openIncognito: (url) => ipcRenderer.invoke("open-incognito", url),
});
