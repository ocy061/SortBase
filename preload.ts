/**
 * Preload Script für Electron
 * Stellt sichere Kommunikationsbrücke zwischen Main und Renderer her
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  loadLists: () => ipcRenderer.invoke('load-lists'),
  saveLists: (data: any) => ipcRenderer.invoke('save-lists', data),
});
