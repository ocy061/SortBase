/**
 * Electron Main Process
 * Verwaltet App-Fenster und Datenpersistierung
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import * as path from 'path';
import * as fs from 'fs';

import { InventoryList } from './src/models';

// Pfad zur JSON-Datei im User-Data-Verzeichnis
const DATA_PATH = path.join(app.getPath('userData'), 'sortbase-data.json');


// === TYPE DEFINITIONS ===

/** Speichert alle Filter- und Sortier-Einstellungen */
interface SortOptions {
  listSortMode: string;
  listSortAsc: boolean;
  itemSortMode: string;
  itemSortAsc: boolean;
  detailViewState?: {
    [listId: string]: {
      listViewMode: 'all' | 'sublists' | 'items';
      combinedSortMode: 'name' | 'category' | 'purchasePrice' | 'currentValue';
      combinedSortAsc: boolean;
      combinedSearchQuery: string;
    }
  };
  listSearchQuery?: string;
  itemSearchQuery?: string;
}

/** Haupt-Datenstruktur die in JSON gespeichert wird */
interface InventarData {
  lists: InventoryList[];
  sortOptions?: SortOptions;
}

// === FILE I/O FUNCTIONS ===

/** Lädt Daten aus JSON-Datei, gibt leere Struktur zurück falls Fehler */
function loadData(): InventarData {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Fehler beim Laden der Daten:', e);
  }
  return { lists: [], sortOptions: undefined };
}

/** Speichert Daten in JSON-Datei mit Formatierung */
function saveData(data: InventarData) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Fehler beim Speichern der Daten:', e);
  }
}

// === AUTO-UPDATE ===

const UPDATE_FEED_URL = process.env.SORTBASE_UPDATE_URL;
let autoUpdaterWired = false;

function setupAutoUpdates(win: BrowserWindow) {
  if (!app.isPackaged) {
    log.info('Auto-Updates werden im Development-Modus übersprungen.');
    return;
  }

  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  if (UPDATE_FEED_URL) {
    autoUpdater.setFeedURL({ provider: 'generic', url: UPDATE_FEED_URL });
  }

  ipcMain.removeHandler('check-for-updates');
  ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) return { status: 'dev-skip' };
    try {
      const result = await autoUpdater.checkForUpdates();
      return { status: 'checking', version: result?.updateInfo?.version };
    } catch (err: any) {
      log.error('Update check failed', err);
      return { status: 'error', message: err?.message ?? String(err) };
    }
  });

  if (!autoUpdaterWired) {
    autoUpdater.on('update-available', (info) => {
      if (!win.isDestroyed()) win.webContents.send('update-available', info);
    });

    autoUpdater.on('update-not-available', (info) => {
      if (!win.isDestroyed()) win.webContents.send('update-not-available', info);
    });

    autoUpdater.on('download-progress', (progress) => {
      if (!win.isDestroyed()) win.webContents.send('update-download-progress', progress.percent);
    });

    autoUpdater.on('update-downloaded', (info) => {
      if (!win.isDestroyed()) win.webContents.send('update-downloaded', info);
    });

    autoUpdater.on('error', (err) => {
      log.error('Auto-Update error', err);
      if (!win.isDestroyed()) win.webContents.send('update-error', err?.message ?? String(err));
    });

    autoUpdaterWired = true;
  }

  autoUpdater.checkForUpdatesAndNotify().catch((err) => {
    log.error('checkForUpdatesAndNotify failed', err);
  });
}

// === ELECTRON WINDOW ===

/** Erstellt Hauptfenster mit festgelegten Dimensionen und Sicherheitseinstellungen */
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'dist', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile('index.html');

  setupAutoUpdates(win);
}

// === IPC HANDLERS: Main <-> Renderer Communication ===

/** Handler: Daten laden */
ipcMain.handle('load-lists', () => {
  return loadData();
});

/** Handler: Daten speichern */
ipcMain.handle('save-lists', (_event, data) => {
  saveData(data);
  return true;
});

// === APP LIFECYCLE ===

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  app.whenReady().then(() => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
