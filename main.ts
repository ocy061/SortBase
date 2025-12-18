/**
 * Electron Main Process
 * Verwaltet App-Fenster und Datenpersistierung
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

import { InventoryList } from './src/models';

// Pfad zur JSON-Datei im User-Data-Verzeichnis
const DATA_PATH = path.join(app.getPath('userData'), 'inventar-data.json');


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

// === ELECTRON WINDOW ===

/** Erstellt Hauptfenster mit festgelegten Dimensionen und Sicherheitseinstellungen */
function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile('dist/index.html');
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
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
