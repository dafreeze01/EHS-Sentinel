# Changelog

## [1.1.0] - 2025-01-XX

### 🔧 Kritische Fehlerbehebungen
- **Fixed**: Arithmetic double-replacement Bug (`packed_packed_value`)
- **Fixed**: Enum KeyError für unbekannte Werte (2, 255, etc.)
- **Fixed**: MessageProducer String-zu-Bytes Konvertierung
- **Fixed**: MQTTClient platform KeyError Handling
- **Fixed**: MessageProducer Writer-Initialisierung (NoneType Error)
- **Fixed**: Umfassende Fehlerbehandlung mit graceful fallbacks

### ✨ Neue Features
- **Added**: Automatische Versionsnummer mit Build-Timestamp
- **Added**: Detaillierte Build-Informationen im Startup-Log
- **Added**: Robuste Fallback-Werte für alle kritischen Pfade
- **Added**: Verbesserte Logging-Ausgaben mit Fix-Details
- **Added**: Proper Writer-Management für MessageProducer

### 🛡️ Verbesserungen
- **Enhanced**: Defensive Programmierung in allen kritischen Bereichen
- **Enhanced**: Graceful Degradation statt Crashes
- **Enhanced**: Umfassende Try-Catch Blöcke
- **Enhanced**: Bessere Debugging-Möglichkeiten
- **Enhanced**: Sichere Initialisierung aller Komponenten

### 🚨 Sicherheitshinweise
- ⚠️ Steuerung und Polling erfolgen weiterhin auf eigene Gefahr
- Keine Haftung für Schäden an der Wärmepumpe

## [1.0.0] - 2025-01-XX

### Hinzugefügt
- Erste Version des Home Assistant Addons
- Deutsche Benutzeroberfläche
- TCP und Serial Verbindungsunterstützung
- MQTT Integration mit Home Assistant Auto-Discovery
- Optionale Steuerungsfunktionen
- Optionales Polling von Werten
- Umfassende Sicherheitswarnungen

### Sicherheitshinweise
- ⚠️ Steuerung und Polling erfolgen auf eigene Gefahr
- Keine Haftung für Schäden an der Wärmepumpe