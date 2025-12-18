# Inventar App

Dieses Projekt ist eine Electron-Desktop-App mit TypeScript. Ziel ist die Verwaltung von persönlichen Gegenständen und Sammlerstücken. Die App wird lokal ausgeführt und speichert Daten lokal, ist aber für spätere Synchronisation und Mehrbenutzerfähigkeit erweiterbar.

## Starten der App

1. Installiere die Abhängigkeiten:
   ```powershell
   npm install
   ```
2. Baue und starte die App:
   ```powershell
   npm run build && npm start
   ```

## Projektstruktur
- `main.ts`: Electron Main-Prozess (App-Logik, Fensterverwaltung)
- `renderer/`: Frontend-Code (UI, React/HTML)
- `webpack.config.js`: Webpack-Konfiguration
- `tsconfig.json`: TypeScript-Konfiguration

## Nächste Schritte
- Electron Main- und Renderer-Prozess einrichten
- Grundlegende UI erstellen
- Artikelverwaltung implementieren
