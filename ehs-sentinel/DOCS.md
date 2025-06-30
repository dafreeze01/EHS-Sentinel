# EHS-Sentinel Home Assistant Addon

## Installation

1. Fügen Sie dieses Repository zu Ihren Home Assistant Addon-Repositories hinzu:
   `https://github.com/dafreeze01/EHS-Sentinel`

2. Installieren Sie das "EHS-Sentinel" Addon

3. Konfigurieren Sie das Addon über die Benutzeroberfläche

4. Starten Sie das Addon

## Konfiguration

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

### Erweiterte Einstellungen

⚠️ **WARNUNG**: Die folgenden Funktionen erfordern aktive Kommunikation mit der Wärmepumpe:

- **Steuerung erlauben**: Ermöglicht die Steuerung der Wärmepumpe über Home Assistant
- **Polling**: Aktiviert aktive Abfrage von Werten

## Sicherheitshinweise

⚠️ **WICHTIGE WARNUNG**: Die Funktionen "Steuerung erlauben" und "Polling" erfordern, dass EHS-Sentinel aktiv mit der Samsung EHS kommuniziert. Dies bedeutet, dass das Addon in den Modbus-Datenverkehr zwischen den Komponenten eingreift. Die Aktivierung dieser Funktionalitäten erfolgt ausschließlich auf eigene Gefahr. Es wird keine Haftung für eventuelle Schäden übernommen.

## Unterstützte Hardware

- Samsung EHS Mono HQ Quiet
- Andere Samsung EHS Modelle (möglicherweise kompatibel)

### Benötigte Hardware

- RS485-zu-Ethernet Adapter oder USB-RS485 Adapter
- Verbindung zur Samsung EHS über die serielle Schnittstelle

## Support

Bei Problemen oder Fragen erstellen Sie bitte ein Issue im GitHub Repository.