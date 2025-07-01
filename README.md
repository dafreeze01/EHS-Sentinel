# EHS-Sentinel Home Assistant Addon

Ein umfassendes Home Assistant Addon zur Integration von Samsung EHS Wärmepumpen.

## 🚀 Features

- **Vollständige Integration**: Überwachung und Steuerung von Samsung EHS Wärmepumpen
- **MQTT Auto-Discovery**: Automatische Geräteerkennung in Home Assistant
- **Umfassende Sensoren**: Temperaturen, Drücke, Leistung, Effizienz und mehr
- **Erweiterte Steuerung**: FSV-Parameter für Heizung, Kühlung und Warmwasser
- **Sichere Architektur**: Ersetzt unsichere `eval()` durch sichere arithmetische Auswertung
- **Optimierte Performance**: Verbesserte Polling-Konfiguration und Fehlerbehandlung

## 📋 Voraussetzungen

### Hardware
- Samsung EHS Wärmepumpe (getestet mit Mono HQ Quiet)
- RS485-zu-Ethernet Adapter oder USB-RS485 Adapter
- Home Assistant Installation

### Software
- Home Assistant Core 2023.1 oder neuer
- MQTT Broker (z.B. Mosquitto)

## 🔧 Installation

### Automatisches Build (Empfohlen)

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
   - Klicken Sie auf die drei Punkte (⋮) oben rechts → **Repositories**
   - Fügen Sie den lokalen Pfad hinzu: `/pfad/zu/EHS-Sentinel`

4. **Addon installieren:**
   - Das "EHS-Sentinel" Addon erscheint im Add-on Store
   - Klicken Sie auf **Installieren**

## ⚙️ Konfiguration

### Verbindungseinstellungen

**TCP Verbindung (RS485-zu-Ethernet):**
```yaml
verbindung_typ: "tcp"
tcp_ip: "192.168.1.100"
tcp_port: 4196
```

**Serielle Verbindung (USB-RS485):**
```yaml
verbindung_typ: "serial"
serial_device: "/dev/ttyUSB0"
serial_baudrate: 9600
```

### MQTT Konfiguration

```yaml
mqtt_broker_url: "core-mosquitto"
mqtt_broker_port: 1883
mqtt_benutzer: ""  # Optional
mqtt_passwort: ""  # Optional
mqtt_homeassistant_discovery: true
```

### Erweiterte Funktionen

⚠️ **WARNUNG**: Diese Funktionen greifen aktiv in die Wärmepumpen-Kommunikation ein!

```yaml
steuerung_erlauben: false  # Ermöglicht Steuerung über Home Assistant
polling_aktiviert: false   # Aktiviert aktive Datenabfrage
```

### Polling-Konfiguration

Wenn Polling aktiviert ist, können Sie die Intervalle für verschiedene Sensorgruppen anpassen:

```yaml
polling_intervalle:
  basic_sensors: 30    # Grundlegende Sensoren (Sekunden)
  fsv10xx: 300        # Fernbedienung (5 Minuten)
  fsv20xx: 600        # Wassergesetz (10 Minuten)
  fsv30xx: 900        # Warmwasser (15 Minuten)
  fsv40xx: 1200       # Heizung (20 Minuten)
  fsv50xx: 1800       # Sonstige (30 Minuten)
```

### Logging-Optionen

```yaml
log_level: "INFO"  # DEBUG, INFO, WARNING, ERROR
log_geraet_hinzugefuegt: true
log_verarbeitete_nachricht: false
log_poller_nachricht: false
```

## 📊 Verfügbare Sensoren

### Grundlegende Steuerung
- Wärmepumpen Ein/Aus Status
- Betriebsmodus (AUTO, HEAT, COOL, DHW, FAN)
- Außeneinheit Betriebsstatus
- Warmwasser Status
- Leiser Modus
- Abtau-Status

### Temperaturen
- Vorlauf-/Rücklauftemperatur
- Außentemperatur
- Warmwassertemperatur
- Kompressor-Temperaturen (Saugung, Druck, Kondensator, Verdampfer)
- Zusätzliche Temperatursensoren (1-10)

### Leistung & Effizienz
- Aktuelle Leistungsaufnahme
- Berechnete Heizleistung
- COP (Coefficient of Performance)
- Gesamtenergieverbrauch
- Kompressor-Frequenz

### FSV-Parameter (Field Setting Values)
- **FSV 10XX**: Fernbedienung (Temperaturlimits)
- **FSV 20XX**: Wassergesetz (Heizkurven)
- **FSV 30XX**: Warmwasser (DHW-Einstellungen)
- **FSV 40XX**: Heizung (Zusatzheizung, Mischventil)
- **FSV 50XX**: Sonstige (Smart Grid, PV-Steuerung)

## 🏠 Dashboard-Vorlagen

Das Addon enthält drei vorgefertigte Dashboard-Vorlagen:

1. **Comprehensive Template**: Vollständige Übersicht mit allen verfügbaren Sensoren
2. **Control Mode Template**: Fokus auf Steuerung und wichtige Parameter
3. **Read-Only Template**: Nur-Lese-Ansicht für Monitoring

Die Vorlagen finden Sie im `ressources/` Verzeichnis.

## 🔒 Sicherheitshinweise

⚠️ **WICHTIGE WARNUNG**: 

Die Funktionen "Steuerung erlauben" und "Polling aktiviert" greifen aktiv in die Kommunikation der Samsung EHS ein. Dies bedeutet:

- Das Addon sendet Befehle an die Wärmepumpe
- Mögliche Beeinflussung des normalen Betriebs
- **Nutzung erfolgt ausschließlich auf eigene Gefahr**
- **Keine Haftung für eventuelle Schäden**

Für reine Überwachung lassen Sie beide Optionen deaktiviert.

## 🛠️ Fehlerbehebung

### Verbindungsprobleme
```bash
# TCP-Verbindung testen
ping <ip-adresse>
telnet <ip-adresse> <port>

# Serielle Verbindung prüfen
ls -la /dev/ttyUSB*
```

### Logs überprüfen
```bash
# Addon-Logs in Home Assistant
Einstellungen → Add-ons → EHS-Sentinel → Logs

# Detaillierte Logs aktivieren
log_level: "DEBUG"
```

### Häufige Probleme

1. **Keine Sensoren in Home Assistant**
   - MQTT Auto-Discovery aktiviert?
   - MQTT Broker erreichbar?
   - Addon-Logs auf Fehler prüfen

2. **Verbindung zur Wärmepumpe fehlgeschlagen**
   - IP-Adresse und Port korrekt?
   - RS485-Adapter funktionsfähig?
   - Verkabelung prüfen

3. **Steuerung funktioniert nicht**
   - `steuerung_erlauben: true` gesetzt?
   - Entsprechende FSV-Parameter verfügbar?

## 🔄 Updates

Das Addon wird automatisch über das Home Assistant Add-on System aktualisiert. Für manuelle Updates:

```bash
cd EHS-Sentinel
git pull
./build-local.sh
```

## 🤝 Beitragen

Beiträge sind willkommen! Bitte:

1. Fork des Repositories erstellen
2. Feature-Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt steht unter der MIT-Lizenz. Siehe [LICENSE](LICENSE) für Details.

## 🙏 Danksagungen

- Samsung für die EHS-Wärmepumpen-Technologie
- Home Assistant Community
- Alle Beitragenden und Tester

## 📞 Support

Bei Problemen oder Fragen:

1. [GitHub Issues](https://github.com/dafreeze01/EHS-Sentinel/issues) erstellen
2. Logs und Konfiguration beifügen
3. Detaillierte Problembeschreibung

---

**Entwickelt mit ❤️ für die Home Assistant Community**