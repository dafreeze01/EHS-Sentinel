# EHS-Sentinel Home Assistant Addon

## 🚀 Funktionen

- **Vollständige Integration**: Überwachung und Steuerung von Samsung EHS Wärmepumpen
- **MQTT Auto-Discovery**: Automatische Geräteerkennung in Home Assistant
- **Umfassende Sensoren**: Temperaturen, Drücke, Leistung, Effizienz und mehr
- **Erweiterte Steuerung**: FSV-Parameter für Heizung, Kühlung und Warmwasser
- **Dreistufige Polling-Strategie**: Optimierte Abfrageintervalle für verschiedene Sensortypen
- **Paketqualitätsüberwachung**: Automatische Analyse der Kommunikationsqualität
- **Sensor-Monitoring**: Detaillierte Überwachung aller Sensoren mit Statusanzeige
- **MQTT-Kommunikationsanalyse**: Überwachung des Nachrichtenflusses und der Datenkonvertierung
- **Strukturiertes Logging**: Umfassendes Logging-System mit Filteroptionen
- **Technische Dokumentation**: Automatisch generierte Dokumentation für Kommunikation und Fehlerbehebung

## 📋 Installation

1. Fügen Sie dieses Repository zu Ihren Home Assistant Addon-Repositories hinzu:
   `https://github.com/dafreeze01/EHS-Sentinel`

2. Installieren Sie das "EHS-Sentinel" Addon

3. Konfigurieren Sie das Addon über die Benutzeroberfläche

4. Starten Sie das Addon

## ⚙️ Konfiguration

### Verbindung

Wählen Sie zwischen TCP (für RS485-zu-Ethernet Adapter) oder Serial (für USB-RS485 Adapter):

**TCP Verbindung:**
- IP-Adresse: IP-Adresse Ihres RS485-zu-Ethernet Adapters
- Port: Port des Adapters (Standard: 4196)

**Serielle Verbindung:**
- Gerätepfad: Pfad zum seriellen Gerät (z.B. `/dev/ttyUSB0`)
- Baudrate: Baudrate für die Verbindung (Standard: 9600)

### MQTT

- **Broker URL**: URL Ihres MQTT Brokers (Standard: `core-mosquitto`)
- **Broker Port**: Port des MQTT Brokers (Standard: 1883)
- **Benutzername/Passwort**: MQTT Anmeldedaten (optional)
- **Home Assistant Auto-Discovery**: Aktiviert automatische Geräteerkennung

### Sensor-Monitoring

Das Addon bietet ein umfassendes Sensor-Monitoring-System:

- **Sensor-Status**: Überwacht den Status aller Sensoren (aktiv, unbekannt, fehlerhaft)
- **Timeout-Erkennung**: Erkennt Sensoren, die keine Daten mehr liefern
- **Fehlerrate-Überwachung**: Analysiert die Fehlerrate für jeden Sensor
- **Gruppierung**: Sensoren werden in logische Gruppen eingeteilt
- **Prioritäten**: Kritische Sensoren werden mit höherer Priorität überwacht

### Polling-Strategie

Das Addon verwendet eine dreistufige Polling-Strategie für optimale Performance:

1. **Live-Daten** (15-30 Sekunden):
   - Kritische Betriebsdaten (Temperaturen, Frequenzen, Status)
   - Wichtig für Echtzeit-Monitoring

2. **FSV-Einstellungen** (5-30 Minuten):
   - Veränderliche Einstellungen (Sollwerte, Automationsparameter)
   - Gruppiert nach FSV-Kategorien (10xx, 20xx, etc.)

3. **Statische Daten** (stündlich):
   - Unveränderliche Informationen (Gerätedaten, Grenzwerte)
   - Minimale Belastung des Systems

Die Intervalle können in der Konfiguration angepasst werden.

### MQTT-Kommunikationsanalyse

Das Addon analysiert die MQTT-Kommunikation zwischen Home Assistant und der Wärmepumpe:

- **Nachrichtenfluss**: Überwachung von SET- und STATE-Nachrichten
- **Datenkonvertierung**: Dokumentation der Konvertierung zwischen Dezimal- und Hex-Werten
- **Antwortzeiten**: Messung der Antwortzeiten für Befehle
- **Fehleranalyse**: Identifikation von Kommunikationsproblemen

### Logging-System

Das Addon bietet ein umfassendes Logging-System:

- **Strukturierte Logs**: Kategorisierte Logs mit Zeitstempeln und Kontext
- **Filteroptionen**: Filtern nach Level, Kategorie, Sensor, Zeitraum
- **Statistiken**: Analyse der Fehlerraten und Performance
- **Export**: Export von Logs in verschiedenen Formaten

### Erweiterte Einstellungen

⚠️ **WARNUNG**: Die folgenden Funktionen erfordern aktive Kommunikation mit der Wärmepumpe:

- **Steuerung erlauben**: Ermöglicht die Steuerung der Wärmepumpe über Home Assistant
- **Polling**: Aktiviert aktive Abfrage von Werten

## 🔧 Addon-UI

Das Addon bietet eine umfassende Benutzeroberfläche:

### Dashboard

- **System-Übersicht**: Gesamtstatus des Systems
- **Kritische Sensoren**: Status der wichtigsten Sensoren
- **MQTT-Statistiken**: Kommunikationsstatistiken
- **Aktuelle Fehler**: Liste der aktuellen Fehler

### Sensoren

- **Sensor-Tabelle**: Übersicht aller Sensoren mit Status
- **Detailansicht**: Detaillierte Informationen zu jedem Sensor
- **Filteroptionen**: Filtern nach Gruppe und Status

### MQTT

- **Kommunikationsstatistiken**: Statistiken zur MQTT-Kommunikation
- **Kommunikationshistorie**: Verlauf der Kommunikation für jeden Sensor
- **Fehleranalyse**: Analyse von Kommunikationsfehlern

### Logs

- **Log-Einträge**: Alle Log-Einträge mit Filteroptionen
- **Log-Statistiken**: Statistiken zu Logs und Fehlern
- **Export**: Export von Logs für die Analyse

### Konfiguration

- **Gruppen-Konfiguration**: Konfiguration von Sensor-Gruppen
- **Parameter-Konfiguration**: Konfiguration einzelner Parameter
- **Polling-Intervalle**: Anpassung der Polling-Intervalle

### Dokumentation

- **MQTT-Kommunikation**: Dokumentation der MQTT-Kommunikation
- **Datenkonvertierung**: Erklärung der Datenkonvertierung
- **Fehlerbehebung**: Anleitung zur Fehlerbehebung

## 📊 Berichte und Analysen

Das Addon generiert automatisch Berichte zur Kommunikationsqualität:

- **Tägliche Berichte**: Zusammenfassung der letzten 24 Stunden
- **Wöchentliche Berichte**: Langzeitanalyse der Verbindungsqualität
- **Fehleranalyse**: Identifikation von Mustern in problematischen Zeiträumen

Die Berichte werden im Verzeichnis `/data/reports` gespeichert und können über die Home Assistant Dateiverwaltung eingesehen werden.

## 🛠️ Tools

Das Addon enthält mehrere nützliche Tools:

- **generate_24h_report.py**: Erstellt einen detaillierten 24-Stunden-Bericht
- **packet_quality_analyzer.py**: Analysiert die Paketqualität mit Visualisierungen
- **create_dashboard.py**: Generiert ein benutzerdefiniertes Dashboard
- **sensor_monitoring_api.py**: API für die Addon-UI

Diese Tools können über die Home Assistant Terminal-Schnittstelle ausgeführt werden.

## ⚠️ Sicherheitshinweise

**WICHTIGE WARNUNG**: Die Funktionen "Steuerung erlauben" und "Polling" erfordern, dass EHS-Sentinel aktiv mit der Samsung EHS kommuniziert. Dies bedeutet, dass das Addon in den Modbus-Datenverkehr zwischen den Komponenten eingreift. Die Aktivierung dieser Funktionalitäten erfolgt ausschließlich auf eigene Gefahr. Es wird keine Haftung für eventuelle Schäden übernommen.

## 🔌 Unterstützte Hardware

- Samsung EHS Mono HQ Quiet
- Andere Samsung EHS Modelle (möglicherweise kompatibel)

### Benötigte Hardware

- RS485-zu-Ethernet Adapter oder USB-RS485 Adapter
- Verbindung zur Samsung EHS über die serielle Schnittstelle

## 📞 Support

Bei Problemen oder Fragen erstellen Sie bitte ein Issue im GitHub Repository.