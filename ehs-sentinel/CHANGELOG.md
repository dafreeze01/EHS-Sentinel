# Changelog

## [1.2.6] - 2025-01-XX

### 🔧 Kritische Verbesserungen
- **ENHANCED**: Automatische Geräteerstellung für alle 161 verfügbaren Sensoren
- **IMPROVED**: Paketqualitäts-Monitoring mit realistischeren Schwellwerten (15% statt 5%)
- **FIXED**: Reduzierte Log-Spam bei ungültigen Paketen (nur noch DEBUG-Level)
- **ADDED**: Einheitliche Versionierung über config.yaml mit Pre-Commit-Hook
- **ENHANCED**: Verbesserte Auto-Discovery nach MQTT-Verbindung und HASS-Reset

### ✨ Neue Features
- **Added**: `create_all_devices()` Methode erstellt alle Sensoren automatisch
- **Added**: Flag `auto_discovery_completed` verhindert Doppelausführung
- **Added**: Versionierung aus config.yaml in startEHSSentinel.py
- **Added**: Intelligente Berichterstattung nur bei signifikanten Datenmengen

### 🛡️ Sicherheitsverbesserungen
- **Enhanced**: Fehlerrate-Schwellwert von 5% auf 15% erhöht (realistischer für RS485)
- **Enhanced**: Ungültige Pakete nur noch alle 1000 Pakete gewarnt
- **Enhanced**: Statistiken nur alle 100/1000 Pakete gespeichert (Performance)

### 🏗️ Architektur-Verbesserungen
- **Refactored**: Pre-Commit-Script nutzt jetzt config.yaml für Versionierung
- **Improved**: Automatische Sensor-Erstellung nach MQTT-Verbindung
- **Enhanced**: Bessere Toleranz für RS485-Kommunikationsfehler

### 📊 Dashboard-Optimierungen
- **Enhanced**: Alle 161 Sensoren werden als Home Assistant Entities erstellt
- **Improved**: Sensoren erscheinen als "unavailable" bis Daten empfangen werden
- **Added**: Vollständige Auto-Discovery unabhängig von empfangenen Daten

### 🔧 Technische Verbesserungen
- **Added**: YAML-Import für Versionierung aus config.yaml
- **Enhanced**: Robuste Fehlerbehandlung bei Versionsextraktion
- **Improved**: Einheitliche Versionsnummer über alle Komponenten

### 🚨 Migration Notes
- **IMPORTANT**: Pre-Commit-Hook nutzt jetzt config.yaml für Versionierung
- **CONFIG**: Alle Sensoren werden automatisch erstellt, auch ohne Daten
- **MONITORING**: Paketqualitäts-Schwellwert auf 15% erhöht

## [1.2.5] - 2025-01-XX

### 🔧 Kritische Fehlerbehebungen
- **BREAKING**: Vollständige Code-Bereinigung und Refactoring
- **SECURITY**: Ersetzt unsichere `eval()` durch sichere arithmetische Auswertung (`SafeArithmetic`)
- **FIXED**: Entfernt alle Code-Duplikationen zwischen Root und Addon-Verzeichnis
- **FIXED**: Vervollständigt alle Enum-Werte in `NasaRepository.yml` (255: "UNKNOWN")
- **FIXED**: Verbesserte Fehlerbehandlung mit graceful fallbacks
- **FIXED**: MessageProducer Writer-Initialisierung und Fehlerbehandlung

### ✨ Neue Features
- **Added**: Erweiterte Polling-Konfiguration mit individuellen Intervallen pro Gruppe
- **Added**: Konfigurierbares Log-Level (DEBUG, INFO, WARNING, ERROR)
- **Added**: Umfassende FSV-Gruppen für alle Wärmepumpen-Parameter
- **Added**: Sichere arithmetische Auswertung mit Shunting-Yard-Algorithmus
- **Added**: Verbesserte Addon-Konfiguration mit detaillierten Polling-Optionen
- **Added**: Automatische Versionsnummer mit Build-Timestamp

### 🛡️ Sicherheitsverbesserungen
- **Enhanced**: Sichere Auswertung arithmetischer Ausdrücke ohne Code-Injection-Risiko
- **Enhanced**: Robuste Enum-Behandlung für unbekannte Werte
- **Enhanced**: Umfassende Try-Catch-Blöcke mit spezifischen Ausnahmebehandlungen
- **Enhanced**: Defensive Programmierung in allen kritischen Bereichen

### 🏗️ Architektur-Verbesserungen
- **Refactored**: Konsolidierung aller Python-Module in `ehs-sentinel/src/`
- **Removed**: Entfernung redundanter Dateien und Entwicklungstools
- **Cleaned**: Bereinigung der Projektstruktur (entfernt: `helpertils/`, Service-Dateien)
- **Improved**: Modulare Architektur mit klarer Trennung der Verantwortlichkeiten

### 📊 Dashboard-Optimierungen
- **Enhanced**: Optimierte Polling-Intervalle für bessere Dashboard-Reaktivität
- **Improved**: Grundlegende Sensoren mit 30-Sekunden-Intervall
- **Added**: Gestaffelte Intervalle für verschiedene FSV-Gruppen (5-30 Minuten)

### 🔧 Technische Verbesserungen
- **Added**: Type Hints und verbesserte Dokumentation
- **Enhanced**: Logging mit detaillierten Fix-Informationen
- **Improved**: Konfigurationsvalidierung und Fehlerbehandlung
- **Added**: Umfassende Unit-Test-Vorbereitung

### 🚨 Migration Notes
- **IMPORTANT**: Diese Version erfordert eine Neuinstallation des Addons
- **CONFIG**: Neue Polling-Konfigurationsoptionen verfügbar
- **SECURITY**: Alle arithmetischen Ausdrücke werden jetzt sicher ausgewertet

## [1.1.0] - 2025-01-XX

### 🔧 Kritische Fehlerbehebungen
- **Fixed**: Arithmetic double-replacement Bug (`packed_packed_value`)
- **Fixed**: Enum KeyError für unbekannte Werte (2, 255, etc.)
- **Fixed**: MessageProducer String-zu-Bytes Konvertierung
- **Fixed**: MQTTClient platform KeyError Handling
- **Fixed**: MessageProducer Writer-Initialisierung (NoneType Error)
- **Fixed**: Umfassende Fehlerbehandlung mit graceful fallbacks
- **Fixed**: Serielle/TCP Verbindungsbehandlung

### ✨ Neue Features
- **Added**: Automatische Versionsnummer mit Build-Timestamp
- **Added**: Detaillierte Build-Informationen im Startup-Log
- **Added**: Robuste Fallback-Werte für alle kritischen Pfade
- **Added**: Verbesserte Logging-Ausgaben mit Fix-Details
- **Added**: Proper Writer-Management für MessageProducer
- **Added**: Verbesserte Verbindungsdiagnose

### 🛡️ Verbesserungen
- **Enhanced**: Defensive Programmierung in allen kritischen Bereichen
- **Enhanced**: Graceful Degradation statt Crashes
- **Enhanced**: Umfassende Try-Catch Blöcke
- **Enhanced**: Bessere Debugging-Möglichkeiten
- **Enhanced**: Sichere Initialisierung aller Komponenten
- **Enhanced**: Verbesserte Fehlerbehandlung bei Verbindungsproblemen

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