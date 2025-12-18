import { InventoryList } from './models';
import { StateManager } from './utils/stateManager';
import { Renderer } from './utils/renderer';

// === TYPE DEFINITIONS ===

/** IPC-API Typen für Electron-Kommunikation */
interface SortOptions {
  listSortMode: string;
  listSortAsc: boolean;
  detailViewState?: any;
  listSearchQuery?: string;
}

interface InventarData {
  lists: InventoryList[];
  sortOptions?: SortOptions;
}

/** Globale Window-Erweiterung für preload-injizierte API */
declare global {
  interface Window {
    inventarAPI: {
      loadLists: () => Promise<InventarData>;
      saveLists: (data: InventarData) => Promise<boolean>;
    };
  }
}

/**
 * App-Initialisierung im Renderer Process
 * 1. StateManager & Renderer erstellen
 * 2. Daten aus Datei laden
 * 3. Listen-Übersicht rendern
 */
async function init() {
  const state = new StateManager();
  const renderer = new Renderer(state);

  try {
    await state.loadData();
    await renderer.renderListOverview();
  } catch (error) {
    console.error('Fehler beim Initialisieren der App:', error);
    document.body.innerHTML = '<p style="color: red;">Fehler beim Laden der App. Bitte aktualisieren Sie die Seite.</p>';
  }
}

// Starte App sobald DOM bereit ist
window.addEventListener('DOMContentLoaded', init);
