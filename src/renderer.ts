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
    updateAPI?: {
      checkForUpdates: () => Promise<any>;
      quitAndInstall: () => Promise<any>;
      onUpdateAvailable: (callback: (info: any) => void) => void;
      onUpdateNotAvailable: (callback: (info: any) => void) => void;
      onDownloadProgress: (callback: (percent: number) => void) => void;
      onUpdateDownloaded: (callback: (info: any) => void) => void;
      onUpdateError: (callback: (message: string) => void) => void;
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

  if (window.updateAPI) {
    window.updateAPI.onUpdateAvailable((info) => {
      console.info('Update verfügbar:', info?.version ?? 'unbekannt');
      alert(`Ein neues Update (${info?.version ?? 'neue Version'}) ist verfügbar und wird heruntergeladen...`);
    });
    window.updateAPI.onUpdateNotAvailable(() => {
      console.info('Keine Updates verfügbar.');
    });
    window.updateAPI.onDownloadProgress((percent) => {
      console.info(`Update-Download: ${percent.toFixed(1)}%`);
    });
    window.updateAPI.onUpdateDownloaded(() => {
      alert('Update bereit. Die App wird neu gestartet, um es zu installieren.');
      window.updateAPI?.quitAndInstall().catch((err) => console.error('quitAndInstall fehlgeschlagen', err));
    });
    window.updateAPI.onUpdateError((message) => {
      console.error('Update-Fehler:', message);
    });

    window.updateAPI.checkForUpdates().catch((err) => console.error('Update-Check fehlgeschlagen', err));
  }

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
