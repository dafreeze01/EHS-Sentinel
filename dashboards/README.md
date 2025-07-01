# 🏠 EHS-Sentinel Dashboard Collection

Eine umfassende Sammlung von Home Assistant Dashboards für die Samsung EHS Wärmepumpen-Integration mit modernsten HACS-Erweiterungen.

## 📊 Dashboard-Übersicht

### 1. **Mushroom Modern Dashboard** (`mushroom_modern_dashboard.yaml`)
**Moderne, minimalistische Benutzeroberfläche mit Mushroom Cards**

**Features**:
- 🎨 Moderne Mushroom Cards mit perfekter HA-Integration
- 📊 ApexCharts mit professionellen Diagrammen
- 🔧 Intelligente Chips für Schnellzugriff
- 📱 Vollständig responsive für alle Geräte
- ⚡ Auto-Entities für dynamische Inhalte
- 📅 Scheduler Card für Zeitpläne

**Ideal für**: Benutzer, die eine saubere, moderne Optik bevorzugen

### 2. **Button Card Advanced Dashboard** (`button_card_advanced_dashboard.yaml`)
**Hochgradig anpassbare Steuerung mit Button Cards**

**Features**:
- 🎛️ Animierte Button Cards mit benutzerdefinierten Stilen
- 🌡️ Gauge-Style Temperaturanzeigen
- 📈 Fortschrittsbalken für Leistungswerte
- 🎨 Dynamische Farbänderungen basierend auf Werten
- ⚡ Hover-Effekte und Micro-Animationen
- 🔄 Zustandsabhängige Visualisierungen

**Ideal für**: Power-User, die maximale Anpassungsmöglichkeiten wollen

### 3. **Comprehensive HVAC Dashboard** (`comprehensive_hvac_dashboard.yaml`)
**Vollständige Übersicht ohne HACS-Abhängigkeiten**

**Features**:
- 📋 Alle verfügbaren Sensoren und Steuerungen
- 🏠 Kategorisierte Ansichten (Heizung, Kühlung, Warmwasser)
- 📊 48-Stunden Verlaufsdiagramme
- 🧠 Smart Features Integration
- 🔍 Diagnose und Wartungsbereich
- ℹ️ System-Informationen

**Ideal für**: Vollständige Übersicht ohne zusätzliche Installationen

## 🛠️ Installation

### Schritt 1: HACS-Erweiterungen installieren

Für die erweiterten Dashboards (Mushroom & Button Card) benötigen Sie HACS-Erweiterungen:

**Pflicht-Erweiterungen**:
- Mushroom Cards
- Button Card
- ApexCharts Card

**Empfohlene Erweiterungen**:
- Card-Mod
- Mini Graph Card
- Layout Card
- Auto-Entities

📖 **Detaillierte Anleitung**: Siehe `hacs_installation_guide.md`

### Schritt 2: Dashboard importieren

1. **Wählen Sie Ihr bevorzugtes Dashboard**
2. **Kopieren Sie den YAML-Inhalt**
3. **Erstellen Sie ein neues Dashboard in Home Assistant**
4. **Fügen Sie den Code in den Raw-Editor ein**

### Schritt 3: Anpassungen

- **Entity-Namen** an Ihr System anpassen
- **Farben und Stile** nach Wunsch ändern
- **Zusätzliche Sensoren** hinzufügen

## 🎨 Design-Philosophie

### Moderne Ästhetik
- **Apple-Level Design**: Saubere Linien, durchdachte Abstände
- **Konsistente Farbpalette**: Harmonische Farbverläufe
- **Micro-Interactions**: Subtile Animationen für bessere UX

### Benutzerfreundlichkeit
- **Intuitive Navigation**: Logische Gruppierung von Funktionen
- **Responsive Design**: Optimiert für alle Bildschirmgrößen
- **Haptisches Feedback**: Vibrationen auf mobilen Geräten

### Funktionalität
- **Echtzeit-Updates**: Live-Daten mit minimaler Latenz
- **Intelligente Automatisierung**: Smart Grid und PV-Integration
- **Umfassende Kontrolle**: Alle FSV-Parameter zugänglich

## 📱 Mobile Optimierung

Alle Dashboards sind für mobile Nutzung optimiert:

- **Touch-freundliche Buttons**: Größere Tap-Bereiche
- **Responsive Layouts**: Automatische Spaltenanpassung
- **Optimierte Performance**: Schnelle Ladezeiten
- **Offline-Fähigkeit**: Funktioniert auch bei schlechter Verbindung

## 🔧 Anpassungsmöglichkeiten

### Farben ändern
```yaml
# Beispiel: Button Card Farbänderung
styles:
  card:
    - background: "linear-gradient(135deg, #IHR_FARBCODE_1 0%, #IHR_FARBCODE_2 100%)"
```

### Icons anpassen
```yaml
# Beispiel: Icon-Änderung
icon: mdi:ihr-gewünschtes-icon
```

### Animationen hinzufügen
```yaml
# Beispiel: Hover-Animation
card_mod:
  style: |
    ha-card:hover {
      transform: translateY(-2px);
      transition: all 0.3s ease;
    }
```

## 🚀 Erweiterte Features

### Smart Grid Integration
- **Automatische Optimierung** basierend auf Strompreisen
- **PV-Überschuss Nutzung** für Warmwasserbereitung
- **Lastspitzenmanagement** zur Kostenreduzierung

### Predictive Analytics
- **COP-Vorhersage** basierend auf Wetterprognose
- **Energieverbrauch-Trends** für bessere Planung
- **Wartungshinweise** basierend auf Betriebsstunden

### Automatisierung
- **Zeitgesteuerte Profile** für verschiedene Tageszeiten
- **Anwesenheitserkennung** für Energieeinsparung
- **Wetterbasierte Anpassungen** der Heizkurve

## 📊 Verfügbare Sensoren

### Temperaturen
- Vorlauf-/Rücklauftemperatur
- Außentemperatur
- Warmwassertemperatur
- Kompressor-Temperaturen
- Zusätzliche Sensoren (1-10)

### Leistung & Effizienz
- Aktuelle Heizleistung
- Stromverbrauch
- COP (aktuell und gesamt)
- Energiestatistiken

### Systemstatus
- Betriebsmodus
- Abtau-Status
- Kompressor-Frequenz
- Lüfter-Drehzahl
- Drücke

### FSV-Parameter
- **FSV 10XX**: Fernbedienung
- **FSV 20XX**: Wassergesetz
- **FSV 30XX**: Warmwasser
- **FSV 40XX**: Heizung
- **FSV 50XX**: Smart Features

## 🔍 Fehlerbehebung

### Dashboard lädt nicht
1. **HACS-Erweiterungen** installiert?
2. **Home Assistant** neugestartet?
3. **Browser-Cache** geleert?
4. **YAML-Syntax** korrekt?

### Sensoren nicht verfügbar
1. **EHS-Sentinel Addon** läuft?
2. **MQTT-Integration** aktiv?
3. **Entity-Namen** korrekt?

### Performance-Probleme
1. **Refresh-Intervalle** erhöhen
2. **Anzahl der Diagramme** reduzieren
3. **Browser-Tabs** schließen

## 📞 Support

Bei Problemen oder Fragen:

1. **Überprüfen Sie die Logs** des EHS-Sentinel Addons
2. **Testen Sie mit dem Basis-Dashboard** ohne HACS-Erweiterungen
3. **Erstellen Sie ein Issue** im GitHub Repository
4. **Fügen Sie Logs und Konfiguration** bei

## 🎯 Roadmap

### Geplante Features
- [ ] **Energiekosten-Tracking** mit Strompreisen
- [ ] **Wartungsplaner** mit Erinnerungen
- [ ] **Vergleichsanalysen** zwischen Zeiträumen
- [ ] **Export-Funktionen** für Daten
- [ ] **Sprachsteuerung** Integration
- [ ] **Tablet-optimierte** Vollbild-Ansicht

### Community-Wünsche
- [ ] **Dunkles Theme** für alle Dashboards
- [ ] **Kompakte Ansicht** für kleine Bildschirme
- [ ] **Mehrsprachige** Unterstützung
- [ ] **Benutzerdefinierte** Farbschemata

---

**Entwickelt mit ❤️ für die Home Assistant Community**

*Transformieren Sie Ihre Samsung EHS Wärmepumpe in ein intelligentes, vernetztes Heizsystem mit professioneller Benutzeroberfläche!*