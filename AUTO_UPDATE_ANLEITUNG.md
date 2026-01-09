# Auto-Update Anleitung für SortBase

## 🔧 Setup-Voraussetzungen

### 1. GitHub Personal Access Token erstellen

1. Gehe zu GitHub: **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Klicke auf **Generate new token (classic)**
3. Name: `SortBase Release Token`
4. Berechtigungen auswählen:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `public_repo` (wenn Repository öffentlich ist, reicht das)
5. Token generieren und **sofort kopieren** (wird nur einmal angezeigt!)

### 2. Token als Umgebungsvariable setzen

#### macOS/Linux:
```bash
# In ~/.zshrc oder ~/.bash_profile hinzufügen:
export GH_TOKEN="dein_github_token_hier"

# Terminal neu laden:
source ~/.zshrc
```

#### Windows (PowerShell als Administrator):
```powershell
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'dein_github_token_hier', 'User')
```

#### Windows (CMD als Administrator):
```cmd
setx GH_TOKEN "dein_github_token_hier"
```

**⚠️ WICHTIG:** Nach dem Setzen der Umgebungsvariable Terminal/IDE neu starten!

---

## 📦 Release-Prozess

### 1. Version erhöhen

Bearbeite `package.json`:
```json
{
  "version": "1.0.3"  // Von 1.0.2 auf 1.0.3 erhöhen
}
```

### 2. Code committen

```bash
git add .
git commit -m "Version 1.0.3: Beschreibung der Änderungen"
git push origin main
```

### 3. Build und Publish in einem Schritt

```bash
npm run dist:all
```

oder für einzelne Plattformen:
```bash
npm run dist:mac   # Nur macOS
npm run dist:win   # Nur Windows
```

**electron-builder wird automatisch:**
1. Die App für alle Plattformen bauen
2. Einen neuen GitHub Release mit Tag `v1.0.3` erstellen
3. Alle Build-Artefakte hochladen (.dmg, .zip, .exe, .yml)
4. Die `latest.yml` und `latest-mac.yml` Dateien veröffentlichen (wichtig für Auto-Update!)

---

## ✅ So funktioniert das Auto-Update

### Für Benutzer:

1. **Beim App-Start**: 
   - Die App prüft automatisch auf Updates via GitHub Releases
   - Wenn ein neues Release verfügbar ist → Notification

2. **Download**:
   - Update wird automatisch im Hintergrund heruntergeladen
   - Fortschrittsanzeige in der Konsole (Console-Log)

3. **Installation**:
   - Alert: "Update geladen. Bitte die App neu starten, um es zu installieren."
   - Beim nächsten App-Neustart wird das Update installiert

### Technische Details:

- **Update-Server**: GitHub Releases API
- **Update-Dateien**: `latest.yml` (Windows) und `latest-mac.yml` (macOS)
- **Delta-Updates**: Wenn möglich nur Differenzen herunterladen
- **Signierung**: Für macOS automatisch signiert (wenn Developer-Zertifikat vorhanden)

---

## 🐛 Troubleshooting

### "Error: Cannot find GitHub releases"

**Lösung:**
- Prüfe, ob `GH_TOKEN` gesetzt ist: `echo $GH_TOKEN` (macOS/Linux) oder `echo %GH_TOKEN%` (Windows)
- Stelle sicher, dass das Repository korrekt ist: `ocy061/SortBase`
- Token muss die richtigen Berechtigungen haben

### "No published versions on GitHub"

**Lösung:**
- Mindestens ein Release muss auf GitHub existieren
- Release muss die Dateien `latest.yml` oder `latest-mac.yml` enthalten
- Diese werden automatisch von electron-builder erstellt

### Updates werden nicht gefunden

**Lösung:**
1. Prüfe GitHub Releases: https://github.com/ocy061/SortBase/releases
2. Stelle sicher, dass `latest.yml` / `latest-mac.yml` vorhanden sind
3. Version in `package.json` muss höher sein als installierte Version

### Build schlägt fehl

**Lösung:**
```bash
# Cache löschen und neu builden
rm -rf release/
rm -rf node_modules/
npm install
npm run dist:all
```

---

## 📋 Checkliste für jeden Release

- [ ] Version in `package.json` erhöht
- [ ] `GH_TOKEN` ist gesetzt
- [ ] Code committed und gepusht
- [ ] `npm run dist:all` ausgeführt
- [ ] GitHub Release überprüft (sollte automatisch erstellt sein)
- [ ] `latest.yml` / `latest-mac.yml` im Release vorhanden
- [ ] App auf einem anderen Gerät getestet (Update-Check)

---

## 🎯 Best Practices

1. **Semantische Versionierung**: `MAJOR.MINOR.PATCH` (z.B. 1.0.3)
   - MAJOR: Breaking Changes
   - MINOR: Neue Features (kompatibel)
   - PATCH: Bugfixes

2. **Release Notes**: Automatisch aus Git-Commits oder manuell in GitHub bearbeiten

3. **Testing**: 
   - Teste neue Version lokal vor dem Release
   - Nutze `npm run pack` für Test-Build ohne Publish

4. **Backup**: 
   - Alte Release-Artefakte bleiben auf GitHub
   - Nutzer können bei Problemen downgraden

---

## 🔍 Logs überprüfen

Logs werden automatisch geschrieben:

**macOS**: `~/Library/Logs/SortBase/main.log`
**Windows**: `%USERPROFILE%\AppData\Roaming\SortBase\logs\main.log`

Useful für Debugging von Update-Problemen.

---

## ⚡ Schnellreferenz

```bash
# Neues Release erstellen:
1. Version in package.json erhöhen
2. git add . && git commit -m "v1.0.x" && git push
3. npm run dist:all

# Update-Status testen (in gebauter App):
- Öffne DevTools (Cmd+Alt+I / F12)
- Schaue in Console nach Update-Logs
```

**Fertig!** 🚀
