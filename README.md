# EHS-Sentinel Home Assistant Addon Repository

Dieses Repository enthält das Home Assistant Addon für EHS-Sentinel, welches Samsung EHS Wärmepumpen in Home Assistant integriert.

## Lokale Installation (Empfohlen)

### Automatisches Build-Script

1. **Repository klonen:**
   ```bash
   git clone https://github.com/dafreeze01/EHS-Sentinel
   cd EHS-Sentinel
   ```

2. **Lokales Build ausführen:**
   ```bash
   ./build-local.sh
   ```

3. **Repository in Home Assistant hinzufügen:**
   - Gehen Sie zu **Einstellungen** → **Add-ons** → **Add-on Store**
   - Klicken Sie auf die drei Punkte (⋮) oben rechts
   - Wählen Sie **Repositories**
   - Fügen Sie den lokalen Pfad hinzu: `/pfad/zu/EHS-Sentinel`

4. **Addon installieren:**
   - Das "EHS-Sentinel" Addon sollte nun im Add-on Store erscheinen
   - Klicken Sie auf das Addon und dann auf **Installieren**

### Manuelle Installation

Falls das automatische Script nicht funktioniert:

1. **Dateien vorbereiten:**
   ```bash
   # Erstelle Verzeichnisse
   mkdir -p ehs-sentinel/src ehs-sentinel/data
   
   # Kopiere Python-Dateien
   cp *.py ehs-sentinel/src/
   cp requirements.txt ehs-sentinel/
   cp data/NasaRepository.yml ehs-sentinel/data/
   ```

2. **Docker Image bauen:**
   ```bash
   cd ehs-sentinel
   docker build -t local/ehs-sentinel-addon:latest .
   ```

3. **In Home Assistant hinzufügen** (wie oben beschrieben)

## Online Installation (Alternative)

Falls Sie das Image nicht lokal bauen möchten:

1. **Repository hinzufügen:**
   - Gehen Sie zu **Einstellungen** → **Add-ons** → **Add-on Store**
   - Klicken Sie auf die drei Punkte (⋮) oben rechts
   - Wählen Sie **Repositories**
   - Fügen Sie diese URL hinzu: `https://github.com/dafreeze01/EHS-Sentinel`

2. **Warten auf automatisches Build:**
   - Das GitHub Actions Workflow baut automatisch das Image
   - Dies kann beim ersten Mal 10-15 Minuten dauern

## Konfiguration

### 🔌 Verbindung
- **Verbindungstyp**: TCP (für RS485-zu-Ethernet Adapter) oder Serial (für USB-RS485 Adapter)
- **TCP**: IP-Adresse und Port des Adapters
- **Serial**: Gerätepfad und Baudrate

### 📡 MQTT
- **Broker**: URL und Port Ihres MQTT Brokers (Standard: core-mosquitto)
- **Authentifizierung**: Benutzername und Passwort (optional)
- **Auto-Discovery**: Automatische Geräteerkennung in Home Assistant

### ⚠️ Erweiterte Funktionen (WARNUNG)
- **Steuerung**: Ermöglicht Steuerung der Wärmepumpe über Home Assistant
- **Polling**: Aktiviert aktive Abfrage von Werten

**WICHTIGER SICHERHEITSHINWEIS**: Die erweiterten Funktionen greifen aktiv in die Kommunikation der Wärmepumpe ein. Nutzung erfolgt ausschließlich auf eigene Gefahr!

### 📝 Protokollierung
Detaillierte Einstellungen für verschiedene Log-Level und Ereignisse.

## Fehlerbehebung

### Addon erscheint nicht im Store
- Stellen Sie sicher, dass das Docker Image erfolgreich gebaut wurde
- Überprüfen Sie die Logs: `docker logs <container-id>`
- Starten Sie Home Assistant neu

### Build-Fehler
- Überprüfen Sie, ob Docker läuft: `docker info`
- Stellen Sie sicher, dass alle Dateien vorhanden sind
- Prüfen Sie die Berechtigungen: `chmod +x build-local.sh`

### Verbindungsprobleme
- Überprüfen Sie die IP-Adresse und den Port des RS485-Adapters
- Testen Sie die Verbindung: `ping <ip-adresse>`
- Prüfen Sie die seriellen Geräte: `ls -la /dev/ttyUSB*`

## Unterstützte Hardware

- Samsung EHS Mono HQ Quiet
- Andere Samsung EHS Modelle (möglicherweise kompatibel)
- RS485-zu-Ethernet Adapter oder USB-RS485 Adapter

## Support

Bei Problemen oder Fragen erstellen Sie bitte ein Issue im GitHub Repository.

## Lizenz

MIT License - siehe LICENSE Datei für Details.