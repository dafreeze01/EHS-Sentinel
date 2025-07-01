# HACS Erweiterungen Installation für EHS-Sentinel Dashboards

## 📋 Benötigte HACS-Erweiterungen

Für die optimale Nutzung der erweiterten Dashboards benötigen Sie folgende HACS-Erweiterungen:

### 🎨 Grundlagen & Design

#### 1. **Mushroom Cards** (Pflicht)
```
Repository: https://github.com/piitaya/lovelace-mushroom
Typ: Frontend
```
**Beschreibung**: Moderne, minimalistische Karten mit perfekter Integration in Home Assistant. Bietet eine komplette Familie von aufeinander abgestimmten Karten.

**Installation**:
1. HACS → Frontend → Explore & Download Repositories
2. Suchen Sie nach "Mushroom"
3. Installieren Sie "Mushroom Cards"
4. Starten Sie Home Assistant neu

#### 2. **Button Card** (Pflicht)
```
Repository: https://github.com/custom-cards/button-card
Typ: Frontend
```
**Beschreibung**: Der ultimative "Alleskönner" für hochgradig anpassbare Buttons mit Animationen, benutzerdefinierten Stilen und komplexen Logiken.

#### 3. **Card-Mod** (Empfohlen)
```
Repository: https://github.com/thomasloven/lovelace-card-mod
Typ: Frontend
```
**Beschreibung**: Ermöglicht CSS-Anpassungen für jede Karte. Unverzichtbar für Premium-Design.

### 📊 Erweiterte Diagramme

#### 4. **ApexCharts Card** (Pflicht)
```
Repository: https://github.com/RomRider/apexcharts-card
Typ: Frontend
```
**Beschreibung**: Leistungsstärkste Diagramm-Karte mit gemischten Graphen, mehreren Y-Achsen und professionellen Visualisierungen.

#### 5. **Mini Graph Card** (Empfohlen)
```
Repository: https://github.com/kalkih/mini-graph-card
Typ: Frontend
```
**Beschreibung**: Kompakte, elegante Liniendiagramme mit aktuellen Werten. Perfekt für Dashboard-Übersichten.

#### 6. **Plotly Graph Card** (Optional)
```
Repository: https://github.com/dbuezas/lovelace-plotly-graph-card
Typ: Frontend
```
**Beschreibung**: Wissenschaftliche Diagramme und Korrelationsanalysen. Ideal für COP vs. Außentemperatur Scatter Plots.

### 🏛️ Layout & Organisation

#### 7. **Layout Card** (Empfohlen)
```
Repository: https://github.com/thomasloven/lovelace-layout-card
Typ: Frontend
```
**Beschreibung**: Erweiterte Grid-Layouts mit präziser Kontrolle über Spalten und Zeilen.

#### 8. **Vertical Stack in Card** (Empfohlen)
```
Repository: https://github.com/ofekashery/vertical-stack-in-card
Typ: Frontend
```
**Beschreibung**: Gruppiert mehrere Karten in einem gemeinsamen Rahmen.

#### 9. **State Switch** (Optional)
```
Repository: https://github.com/thomasloven/lovelace-state-switch
Typ: Frontend
```
**Beschreibung**: Zeigt verschiedene Karten basierend auf Entity-Zuständen.

### ⚡ Interaktive Features

#### 10. **Auto-Entities** (Empfohlen)
```
Repository: https://github.com/thomasloven/lovelace-auto-entities
Typ: Frontend
```
**Beschreibung**: Automatische Befüllung von Karten basierend auf Filtern. Perfekt für PV-Sensoren.

#### 11. **Multiple Entity Row** (Optional)
```
Repository: https://github.com/benct/lovelace-multiple-entity-row
Typ: Frontend
```
**Beschreibung**: Zeigt mehrere Werte in einer Zeile. Platzsparend für Temperatur-Min/Max-Werte.

#### 12. **Scheduler Card** (Optional)
```
Repository: https://github.com/nielsfaber/scheduler-card
Typ: Frontend
```
**Beschreibung**: Benutzerfreundliche Zeitplan-Erstellung für Wärmepumpen-Automatisierung.

## 🚀 Schnell-Installation (Alle auf einmal)

### Methode 1: Über HACS Interface

1. **Öffnen Sie HACS**
   - Gehen Sie zu HACS → Frontend

2. **Installieren Sie die Pflicht-Erweiterungen**:
   ```
   1. Mushroom Cards
   2. Button Card
   3. ApexCharts Card
   ```

3. **Installieren Sie die empfohlenen Erweiterungen**:
   ```
   4. Card-Mod
   5. Mini Graph Card
   6. Layout Card
   7. Vertical Stack in Card
   8. Auto-Entities
   ```

4. **Starten Sie Home Assistant neu**

### Methode 2: Über YAML (Für Experten)

Fügen Sie diese Repositories zu Ihrer HACS-Konfiguration hinzu:

```yaml
# configuration.yaml
hacs:
  repositories:
    - url: https://github.com/piitaya/lovelace-mushroom
      type: frontend
    - url: https://github.com/custom-cards/button-card
      type: frontend
    - url: https://github.com/RomRider/apexcharts-card
      type: frontend
    - url: https://github.com/thomasloven/lovelace-card-mod
      type: frontend
    - url: https://github.com/kalkih/mini-graph-card
      type: frontend
    - url: https://github.com/thomasloven/lovelace-layout-card
      type: frontend
    - url: https://github.com/thomasloven/lovelace-auto-entities
      type: frontend
```

## ✅ Installations-Checkliste

Nach der Installation sollten Sie folgende Karten in Ihrem Lovelace-Editor verfügbar haben:

### Mushroom Cards:
- [ ] `custom:mushroom-entity-card`
- [ ] `custom:mushroom-title-card`
- [ ] `custom:mushroom-chips-card`
- [ ] `custom:mushroom-number-card`
- [ ] `custom:mushroom-select-card`

### Button & Layout:
- [ ] `custom:button-card`
- [ ] `custom:layout-card`
- [ ] `custom:auto-entities`

### Diagramme:
- [ ] `custom:apexcharts-card`
- [ ] `custom:mini-graph-card`
- [ ] `custom:plotly-graph` (optional)

## 🔧 Fehlerbehebung

### Problem: Karte nicht gefunden
**Lösung**:
1. Überprüfen Sie, ob die Erweiterung in HACS installiert ist
2. Starten Sie Home Assistant neu
3. Leeren Sie den Browser-Cache (Strg+F5)

### Problem: Karte wird nicht angezeigt
**Lösung**:
1. Überprüfen Sie die Browser-Konsole auf JavaScript-Fehler
2. Stellen Sie sicher, dass alle Abhängigkeiten installiert sind
3. Prüfen Sie die YAML-Syntax

### Problem: Styling funktioniert nicht
**Lösung**:
1. Stellen Sie sicher, dass Card-Mod installiert ist
2. Überprüfen Sie die CSS-Syntax in den `card_mod` Bereichen
3. Testen Sie mit einfacheren Styles

## 📱 Mobile Optimierung

Alle empfohlenen Karten sind für mobile Geräte optimiert:

- **Touch-freundlich**: Größere Tap-Bereiche
- **Responsive**: Automatische Anpassung an Bildschirmgrößen
- **Performance**: Optimierte Rendering-Performance
- **Haptisches Feedback**: Vibrationen bei Interaktionen (wo unterstützt)

## 🎯 Nächste Schritte

Nach der Installation der HACS-Erweiterungen:

1. **Importieren Sie die Dashboard-Dateien**:
   - `mushroom_modern_dashboard.yaml`
   - `button_card_advanced_dashboard.yaml`

2. **Passen Sie Entity-Namen an** (falls erforderlich)

3. **Testen Sie alle Funktionen** auf verschiedenen Geräten

4. **Anpassungen vornehmen** nach Ihren Wünschen

## 💡 Pro-Tipps

1. **Installieren Sie alle Pflicht-Erweiterungen** vor dem Dashboard-Import
2. **Starten Sie Home Assistant neu** nach jeder HACS-Installation
3. **Testen Sie auf mobilen Geräten** für beste Benutzererfahrung
4. **Nutzen Sie Card-Mod** für individuelle Anpassungen
5. **Experimentieren Sie** mit verschiedenen Kombinationen

Die Investition in diese HACS-Erweiterungen verwandelt Ihr EHS-Sentinel Dashboard in eine professionelle, moderne Steuerungszentrale für Ihre Samsung Wärmepumpe!