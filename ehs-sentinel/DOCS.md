# EHS-Sentinel Home Assistant Addon

## 🚀 Funktionen

- **Vollständige Integration**: Überwachung und Steuerung von Samsung EHS Wärmepumpen
- **MQTT Auto-Discovery**: Automatische Geräteerkennung in Home Assistant
- **Umfassende Sensoren**: Temperaturen, Drücke, Leistung, Effizienz und mehr
- **Erweiterte Steuerung**: FSV-Parameter für Heizung, Kühlung und Warmwasser
- **Dreistufige Polling-Strategie**: Optimierte Abfrageintervalle für verschiedene Sensortypen
- **Paketqualitätsüberwachung**: Automatische Analyse der Kommunikationsqualität

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

### Paketqualitätsüberwachung

Das Addon überwacht automatisch die Qualität der Kommunikation:

- **Fehlerrate-Tracking**: Erfassung ungültiger Pakete
- **Stündliche Statistiken**: Detaillierte Aufzeichnung der Übertragungsfehler
- **Automatische Warnungen**: Bei Überschreitung des Schwellwerts (>5% fehlerhafte Pakete)
- **24h-Berichte**: Tägliche Zusammenfassung der Kommunikationsqualität

### Erweiterte Einstellungen

⚠️ **WARNUNG**: Die folgenden Funktionen erfordern aktive Kommunikation mit der Wärmepumpe:

- **Steuerung erlauben**: Ermöglicht die Steuerung der Wärmepumpe über Home Assistant
- **Polling**: Aktiviert aktive Abfrage von Werten

## 🔧 Dashboards

Das Addon enthält mehrere vorgefertigte Dashboard-Vorlagen:

1. **Comprehensive Dashboard**: Vollständige Übersicht mit allen Sensoren
2. **Quick Controls**: Kompakte Steuerung der wichtigsten Funktionen
3. **Energy Correlation**: Diagramme zur Analyse der Energieeffizienz

Zusätzlich kann ein benutzerdefiniertes Dashboard mit dem Tool `create_dashboard.py` erstellt werden.

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