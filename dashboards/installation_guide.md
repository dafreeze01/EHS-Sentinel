# Installation Guide für EHS-Sentinel Dashboard

## 📋 Voraussetzungen

1. **Home Assistant** mit aktiviertem Lovelace UI
2. **EHS-Sentinel Addon** installiert und konfiguriert
3. **MQTT Integration** aktiv
4. **Plotly Graph Card** (optional, für erweiterte Diagramme)

## 🚀 Installation

### Schritt 1: Dashboard-Dateien vorbereiten

1. Laden Sie die Dashboard-Dateien herunter:
   - `comprehensive_hvac_dashboard.yaml`
   - `quick_controls_card.yaml`
   - `energy_correlation_card.yaml`

### Schritt 2: Plotly Graph Card installieren (optional)

Für erweiterte Korrelationsdiagramme:

```bash
# Via HACS (empfohlen)
1. Gehen Sie zu HACS → Frontend
2. Suchen Sie nach "Plotly Graph Card"
3. Installieren Sie die Karte
4. Starten Sie Home Assistant neu
```

### Schritt 3: Dashboard importieren

1. **Gehen Sie zu Home Assistant**
   - Einstellungen → Dashboards
   - Klicken Sie auf "Dashboard hinzufügen"

2. **Wählen Sie "Neues Dashboard erstellen"**
   - Name: "EHS Wärmepumpen-Steuerung"
   - Icon: `mdi:heat-pump`

3. **Wechseln Sie zur YAML-Ansicht**
   - Klicken Sie auf die drei Punkte (⋮)
   - Wählen Sie "Raw-Konfigurationseditor"

4. **Fügen Sie den Dashboard-Code ein**
   - Kopieren Sie den Inhalt von `comprehensive_hvac_dashboard.yaml`
   - Fügen Sie ihn in den Editor ein
   - Klicken Sie auf "Speichern"

### Schritt 4: Zusätzliche Karten hinzufügen (optional)

#### Schnellzugriff-Karte hinzufügen:
1. Bearbeiten Sie ein vorhandenes Dashboard
2. Fügen Sie eine neue Karte hinzu
3. Wählen Sie "Manuell" → "YAML"
4. Fügen Sie den Inhalt von `quick_controls_card.yaml` ein

#### Korrelationsdiagramme hinzufügen:
1. Stellen Sie sicher, dass Plotly Graph Card installiert ist
2. Fügen Sie eine neue Karte hinzu
3. Wählen Sie "Manuell" → "YAML"
4. Fügen Sie den Inhalt von `energy_correlation_card.yaml` ein

## ⚙️ Anpassungen

### Entity-Namen anpassen

Falls Ihre Entity-Namen abweichen, passen Sie diese in der YAML-Datei an:

```yaml
# Beispiel: Ändern Sie
entity: sensor.samsung_ehssentinel_outdoortw2temp
# zu
entity: sensor.ihr_entity_name
```

### Farben anpassen

Passen Sie die Farbschemas in den Diagrammen an:

```yaml
# In history-graph Karten
entities:
  - entity: sensor.example
    name: "Name"
    color: "#ff6b6b"  # Ihre gewünschte Farbe
```

### Icons anpassen

Ändern Sie Icons nach Ihren Wünschen:

```yaml
# Beispiel
icon: mdi:thermometer  # Ändern Sie zu einem anderen MDI-Icon
```

## 🎨 Erweiterte Anpassungen

### Responsive Design

Das Dashboard ist bereits responsive gestaltet. Für weitere Anpassungen:

```yaml
# Spaltenanzahl für verschiedene Bildschirmgrößen
max_columns: 4  # Desktop
# Automatische Anpassung für Tablet/Mobile
```

### Tooltips hinzufügen

Für zusätzliche Informationen:

```yaml
entities:
  - entity: sensor.example
    name: "Sensor Name"
    secondary_info: last-updated
    tap_action:
      action: more-info
      haptic: light  # Haptisches Feedback auf mobilen Geräten
```

### Bedingte Anzeigen

Zeigen Sie Karten nur unter bestimmten Bedingungen:

```yaml
# Beispiel: Zeige PV-Karte nur wenn PV aktiv
visibility:
  - condition: state
    entity: binary_sensor.samsung_ehssentinel_pvcontactstate
    state: "on"
```

## 🔧 Fehlerbehebung

### Problem: Entities nicht gefunden
**Lösung:** Überprüfen Sie die Entity-Namen in:
- Entwicklertools → Zustände
- Passen Sie die Namen in der YAML-Datei entsprechend an

### Problem: Plotly-Diagramme werden nicht angezeigt
**Lösung:** 
1. Stellen Sie sicher, dass Plotly Graph Card installiert ist
2. Leeren Sie den Browser-Cache
3. Starten Sie Home Assistant neu

### Problem: Dashboard lädt nicht
**Lösung:**
1. Überprüfen Sie die YAML-Syntax
2. Entfernen Sie nicht verfügbare Entities
3. Prüfen Sie die Browser-Konsole auf Fehler

## 📱 Mobile Optimierung

Das Dashboard ist für mobile Geräte optimiert:

- **Responsive Spalten**: Automatische Anpassung der Spaltenanzahl
- **Touch-freundliche Buttons**: Größere Tap-Bereiche
- **Haptisches Feedback**: Vibrationen bei Interaktionen
- **Optimierte Schriftgrößen**: Bessere Lesbarkeit auf kleinen Bildschirmen

## 🎯 Tipps für beste Ergebnisse

1. **Regelmäßige Updates**: Halten Sie das EHS-Sentinel Addon aktuell
2. **Backup erstellen**: Sichern Sie Ihre Dashboard-Konfiguration
3. **Monitoring**: Überwachen Sie die MQTT-Verbindung
4. **Performance**: Reduzieren Sie `refresh_interval` bei langsamen Systemen

## 📞 Support

Bei Problemen:
1. Überprüfen Sie die EHS-Sentinel Addon-Logs
2. Prüfen Sie die MQTT-Integration
3. Erstellen Sie ein Issue im GitHub Repository