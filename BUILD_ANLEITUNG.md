# SortBase - Standalone Anwendung

## ✅ Setup abgeschlossen

Die App ist jetzt bereit, als eigenständige Anwendung für **macOS und Windows** gebaut zu werden!

## 📦 App bauen

### Schnellstart (ohne Icon)

**Nur macOS:**
```bash
npm run dist:mac
```

**Nur Windows:**
```bash
npm run dist:win
```

**Beide Plattformen:**
```bash
npm run dist:all
```

Dies erstellt (je nach Plattform):
- **macOS**: DMG-Installer + ZIP (Intel + Apple Silicon)
- **Windows**: NSIS-Installer (.exe) + Portable Version (32-bit + 64-bit)

**Hinweis**: Der erste Build dauert länger (5-15 Min), da Electron heruntergeladen wird. Terminal nicht schließen!

### Mit eigenem Icon (empfohlen)

1. Erstellen oder laden Sie ein **512x512 Pixel PNG-Bild** herunter
2. Speichern Sie es als `build/icon.png`
3. Details siehe [build/ICON_README.md](build/ICON_README.md)
4. Aktivieren Sie das Icon in `package.json`:
   ```json
   "mac": {
     "icon": "build/icon.png"
   }
   ```
5. Bauen Sie die App: `npm run dist:mac`

## 🚀 App installieren und starten

### macOS

**Aus DMG-Installer (empfohlen):**
1. Öffnen Sie die `.dmg`-Datei im `release/` Ordner
2. Ziehen Sie "SortBase.app" in den Programme-Ordner
3. Starten Sie die App per Doppelklick aus dem Programme-Ordner
4. **Beim ersten Start**: Rechtsklick → "Öffnen" (wegen fehlender Code-Signatur)

**Aus ZIP:**
1. Entpacken Sie die `.zip`-Datei im `release/` Ordner
2. Verschieben Sie "SortBase.app" in den Programme-Ordner
3. Rechtsklick → "Öffnen"

### Windows

**Aus NSIS-Installer (empfohlen):**
1. Doppelklicken Sie auf `SortBase Setup 1.0.0.exe`
2. Folgen Sie dem Installationsassistenten
3. Wählen Sie Installationspfad (optional)
4. Desktop-Verknüpfung wird automatisch erstellt

**Portable Version:**
1. Laden Sie `SortBase-1.0.0-portable.exe` herunter
2. Legen Sie die .exe an einen beliebigen Ort
3. Doppelklick zum Starten — keine Installation nötig
4. **Vorteil**: USB-Stick-fähig, keine Admin-Rechte erforderlich

## 🔧 Verfügbare Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `npm run build` | Kompiliert TypeScript + Webpack |
| `npm start` | Startet die App im Development-Modus (Terminal) |
| `npm run dev` | Startet mit Console-Logging |
| `npm run pack` | Baut .app/.exe ohne Installer (schneller Test) |
| `npm run dist:mac` | Baut DMG + ZIP für macOS (Intel + ARM) |
| `npm run dist:win` | Baut NSIS-Installer + Portable für Windows (x64 + x86) |
| `npm run dist:all` | Baut für macOS UND Windows |
| `npm run dist` | Baut für alle konfigurierten Plattformen |

## 📁 Ordnerstruktur nach Build

```
sortbase/
├── release/                                      # Build-Ausgabe
│   ├── SortBase-1.0.0-arm64.dmg                 # macOS ARM
│   ├── SortBase-1.0.0-x64.dmg                   # macOS Intel
│   ├── SortBase-1.0.0-arm64-mac.zip
│   ├── SortBase-1.0.0-x64-mac.zip
│   ├── SortBase Setup 1.0.0.exe                 # Windows NSIS Installer
│   ├── SortBase-1.0.0-portable.exe              # Windows Portable
│   ├── mac-arm64/
│   │   └── SortBase.app                         # macOS App
│   └── win-unpacked/
│       └── SortBase.exe                         # Windows App (entpackt)
├── build/                                        # Icon und Ressourcen
│   ├── icon.png                                  # Ihr App-Icon
│   └── ICON_README.md
└── ...
```

## 🎯 Nächste Schritte (optional)

### Code-Signing (für macOS Gatekeeper)
Um die Warnung "App von unbekanntem Entwickler" zu vermeiden:
1. Apple Developer Account erstellen ($99/Jahr)
2. Developer ID Zertifikat beantragen
3. In `package.json` unter `build.mac` hinzufügen:
   ```json
   "identity": "Developer ID Application: Ihr Name (TEAM_ID)"
   ```

### Auto-Updates
NutzLinux**: `build.linux` in package.json konfigurieren (AppImage, deb, rpm)
npm install electron-updater
```

### Weitere Plattformen
- **Windows**: `build.win` in package.json konfigurieren
- **Linux**: `build.linux` in package.json konfigurieren

## 🔄 Auto-Updates (empfohlen)

SortBase nutzt electron-updater. So aktivierst du Auto-Updates:

1. Stelle einen Update-Feed bereit (z.B. GitHub Releases oder eigenen HTTPS-Server).
2. Setze zur Build-/Laufzeit die Umgebungsvariable `SORTBASE_UPDATE_URL` auf die Basis-URL deiner Releases (Generic Provider, z.B. `https://example.com/sortbase`).
3. Baue wie gewohnt (`npm run dist:mac`).
4. Nutzer erhalten verfügbare Updates automatisch; nach Download einmal neu starten zum Installieren.

Hinweise:
- Für macOS-Auto-Updates ist Code-Signing erforderlich.
- Ohne gesetzte `SORTBASE_UPDATE_URL` bleiben Auto-Updates deaktiviert, die App funktioniert aber normal.

## ❓ Häufige Probleme

**"App kann nicht geöffnet werden" (macOS Gatekeeper)**
### macOS

**"App kann nicht geöffnet werden" (Gatekeeper)**
- Rechtsklick → "Öffnen" statt Doppelklick
- Oder: Systemeinstellungen → Sicherheit → "Trotzdem öffnen"

**DMG lässt sich nicht mounten**
- Build mit `npm run dist:mac` wiederholen
- Stelle sicher, dass genug Speicherplatz vorhanden ist

### Windows

**"Windows hat Ihren PC geschützt" (SmartScreen)**
- Klicken Sie auf "Weitere Informationen"
- Dann auf "Trotzdem ausführen"
- Grund: App ist nicht digital signiert (erfordert Zertifikat)

**Antivirus blockiert die App**
- Fügen Sie die .exe zur Ausnahmeliste hinzu
- Electron-Apps werden manchmal fälschlicherweise als verdächtig markiert

### Beide Plattformen

**App startet nicht / bleibt weiß**
- GPU-Probleme: Deaktiviere Hardware-Beschleunigung in `main.ts`
- Konsole/Event Viewer prüfen für Fehler

**macOS:**
```
~/Library/Application Support/sortbase/sortbase-data.json
```

**Windows:**
```
%APPDATA%\sortbase\sortbase-data.json
```
(Typischerweise: `C:\Users\IhrName\AppData\Roaming\sortbase\`) App speichert Daten weiterhin in:
```
~/Library/Application Support/sortbase/sortbase-data.json
```

Diese Datei bleibt erhalten, auch wenn Sie die App neu installieren.

## 🆕 Updates verteilen

Bei neuen Versionen:
1. Version in `package.json` erhöhen (z.B. `1.0.0` → `1.1.0`)
2. `SORTBASE_UPDATE_URL` setzen (falls Auto-Updates aktiv) und `npm run dist:mac` ausführen
3. Falls Auto-Updates deaktiviert: DMG-Dateien manuell an Nutzer verteilen
4. Nutzer installieren per Drag & Drop über alte Version
