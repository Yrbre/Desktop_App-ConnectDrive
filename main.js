const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { config } = require("dotenv");

config({
  path: app.isPackaged
    ? path.join(process.resourcesPath, ".env")
    : path.join(__dirname, ".env"),
});

const sharingDrive = process.env.SHARING_DRIVE;
const driveLetter = process.env.DRIVE_LETTER;
let mainWindow;

function runNetUse(args) {
  return new Promise((resolve) => {
    const child = spawn("net", args, { windowsHide: true });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", (error) => {
      resolve({ code: -1, stdout, stderr: error.message });
    });

    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

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
  if (!sharingDrive || !driveLetter) {
    return {
      success: false,
      message: "Konfigurasi SHARING_DRIVE atau DRIVE_LETTER belum diisi.",
    };
  }

  const deleteResult = await runNetUse(["use", driveLetter, "/delete", "/y"]);

  const connectResult = await runNetUse([
    "use",
    driveLetter,
    sharingDrive,
    password,
    `/user:${username}`,
    "/persistent:no",
  ]);

  if (connectResult.code !== 0) {
    return {
      success: false,
      message:
        connectResult.stderr ||
        connectResult.stdout ||
        `Gagal menghubungkan drive. Kode keluar: ${connectResult.code}`,
    };
  }

  return {
    success: true,
    message:
      deleteResult.code === 0 || deleteResult.code === 2
        ? "Drive berhasil terhubung."
        : "Drive berhasil terhubung.",
  };
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
