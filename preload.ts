/**
 * Preload Script für Electron
 * Stellt sichere Kommunikationsbrücke zwischen Main und Renderer her
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('inventarAPI', {
  loadLists: () => ipcRenderer.invoke('load-lists'),
  saveLists: (data: any) => ipcRenderer.invoke('save-lists', data),
});

contextBridge.exposeInMainWorld('updateAPI', {
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  onUpdateAvailable: (callback: (info: any) => void) => ipcRenderer.on('update-available', (_event, info) => callback(info)),
  onUpdateNotAvailable: (callback: (info: any) => void) => ipcRenderer.on('update-not-available', (_event, info) => callback(info)),
  onDownloadProgress: (callback: (percent: number) => void) => ipcRenderer.on('update-download-progress', (_event, percent) => callback(percent)),
  onUpdateDownloaded: (callback: (info: any) => void) => ipcRenderer.on('update-downloaded', (_event, info) => callback(info)),
  onUpdateError: (callback: (message: string) => void) => ipcRenderer.on('update-error', (_event, message) => callback(message)),
});
