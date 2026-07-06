require("dotenv").config();

const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { exec, spawn } = require("child_process");
const sharingDrive = process.env.SHARING_DRIVE;
const driveLetter = process.env.DRIVE_LETTER;
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 650,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.maximize();
  mainWindow.removeMenu();
  mainWindow.loadFile("index.html");
}

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/* ===========================================
   CONNECT DRIVE
=========================================== */

ipcMain.handle("connect-drive", async (event, username, password) => {
  return new Promise((resolve) => {
    exec("net use Z: /delete /y", () => {
      const cmd = `net use ${driveLetter} ${sharingDrive} "${password}" /user:${username} /persistent:no`;

      exec(cmd, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            message: stderr || error.message,
          });

          return;
        }

        resolve({
          success: true,
          message: "Drive berhasil terhubung.",
        });
      });
    });
  });
});

/* ===========================================
   OPEN DEFAULT BROWSER
=========================================== */

ipcMain.handle("open-external", async (event, url) => {
  await shell.openExternal(url);

  return true;
});

/* ===========================================
   OPEN INCOGNITO
=========================================== */

ipcMain.handle("open-incognito", async (event, url) => {
  const browsers = [
    {
      name: "Chrome",
      path: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      args: ["--incognito"],
    },

    {
      name: "Chrome x86",
      path: "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      args: ["--incognito"],
    },

    {
      name: "Edge",
      path: "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      args: ["--inprivate"],
    },

    {
      name: "Edge x86",
      path: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      args: ["--inprivate"],
    },

    {
      name: "Firefox",
      path: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
      args: ["-private-window"],
    },

    {
      name: "Brave",
      path: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
      args: ["--incognito"],
    },

    {
      name: "Opera",
      path: `C:\\Users\\${process.env.USERNAME}\\AppData\\Local\\Programs\\Opera\\opera.exe`,
      args: ["--private"],
    },
  ];

  const browser = browsers.find((b) => fs.existsSync(b.path));

  if (!browser) {
    return {
      success: false,
      message: "Browser tidak ditemukan.",
    };
  }

  spawn(browser.path, [...browser.args, url], {
    detached: true,
    stdio: "ignore",
  }).unref();

  return {
    success: true,
    browser: browser.name,
  };
});
