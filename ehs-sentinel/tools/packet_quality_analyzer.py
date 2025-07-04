#!/usr/bin/env python3
"""
Paketqualitäts-Analysator für EHS-Sentinel

Dieses Tool analysiert die Paketstatistiken und generiert detaillierte Berichte
über die Kommunikationsqualität zwischen der Wärmepumpe und dem Gateway.

Funktionen:
- Analyse der Paketfehlerrate über Zeit
- Identifikation von Mustern in fehlerhaften Paketen
- Generierung von Berichten mit Visualisierungen
- Empfehlungen zur Verbesserung der Verbindungsqualität
"""

import json
import argparse
import datetime
import os
import sys
from typing import Dict, List, Any, Optional
import matplotlib.pyplot as plt
import numpy as np

def load_stats(stats_file: str) -> Dict[str, Any]:
    """Lädt die Paketstatistiken aus einer JSON-Datei."""
    if not os.path.exists(stats_file):
        print(f"Fehler: Statistikdatei {stats_file} nicht gefunden.")
        sys.exit(1)
        
    try:
        with open(stats_file, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Fehler: Die Datei {stats_file} enthält kein gültiges JSON.")
        sys.exit(1)
    except Exception as e:
        print(f"Fehler beim Laden der Statistikdatei: {e}")
        sys.exit(1)

def analyze_hourly_stats(stats: Dict[str, Any]) -> Dict[str, Any]:
    """Analysiert die stündlichen Statistiken."""
    hourly_stats = stats.get("hourly_stats", {})
    
    if not hourly_stats:
        return {"error": "Keine stündlichen Statistiken verfügbar."}
    
    # Sortiere nach Stunde
    sorted_hours = sorted(hourly_stats.keys())
    
    # Berechne Fehlerraten
    error_rates = []
    for hour in sorted_hours:
        hour_data = hourly_stats[hour]
        total = hour_data["total"]
        invalid = hour_data["invalid"]
        
        if total > 0:
            error_rate = (invalid / total) * 100
        else:
            error_rate = 0
            
        error_rates.append((hour, error_rate))
    
    # Finde Stunden mit den höchsten Fehlerraten
    worst_hours = sorted(error_rates, key=lambda x: x[1], reverse=True)[:5]
    
    # Finde Stunden mit den niedrigsten Fehlerraten
    best_hours = sorted(error_rates, key=lambda x: x[1])[:5]
    
    # Berechne durchschnittliche Fehlerrate
    avg_error_rate = sum(rate for _, rate in error_rates) / len(error_rates) if error_rates else 0
    
    # Berechne Standardabweichung
    std_dev = np.std([rate for _, rate in error_rates]) if error_rates else 0
    
    return {
        "total_hours": len(sorted_hours),
        "first_hour": sorted_hours[0] if sorted_hours else None,
        "last_hour": sorted_hours[-1] if sorted_hours else None,
        "avg_error_rate": avg_error_rate,
        "std_dev": std_dev,
        "worst_hours": worst_hours,
        "best_hours": best_hours,
        "all_hours": sorted_hours,
        "all_rates": [rate for _, rate in error_rates]
    }

def generate_plots(analysis: Dict[str, Any], output_dir: str):
    """Generiert Visualisierungen der Paketqualität."""
    if "error" in analysis:
        print(f"Fehler: {analysis['error']}")
        return
        
    os.makedirs(output_dir, exist_ok=True)
    
    # Zeitreihen-Plot der Fehlerrate
    plt.figure(figsize=(12, 6))
    
    hours = analysis["all_hours"]
    rates = analysis["all_rates"]
    
    # Konvertiere Stunden in datetime-Objekte für bessere x-Achse
    x_dates = [datetime.datetime.strptime(hour, "%Y-%m-%d %H:00") for hour in hours]
    
    plt.plot(x_dates, rates, marker='o', linestyle='-', color='#3498db')
    plt.axhline(y=5, color='r', linestyle='--', label='Schwellwert (5%)')
    
    plt.title('Paketfehlerrate über Zeit', fontsize=16)
    plt.xlabel('Datum/Uhrzeit', fontsize=12)
    plt.ylabel('Fehlerrate (%)', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.xticks(rotation=45)
    plt.tight_layout()
    plt.legend()
    
    # Speichere den Plot
    plt.savefig(os.path.join(output_dir, 'fehlerrate_zeitreihe.png'), dpi=300)
    
    # Histogramm der Fehlerraten
    plt.figure(figsize=(10, 6))
    
    plt.hist(rates, bins=20, color='#2ecc71', alpha=0.7, edgecolor='black')
    plt.axvline(x=5, color='r', linestyle='--', label='Schwellwert (5%)')
    plt.axvline(x=analysis["avg_error_rate"], color='blue', linestyle='-', label=f'Durchschnitt ({analysis["avg_error_rate"]:.2f}%)')
    
    plt.title('Verteilung der Paketfehlerraten', fontsize=16)
    plt.xlabel('Fehlerrate (%)', fontsize=12)
    plt.ylabel('Häufigkeit', fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()
    
    # Speichere den Plot
    plt.savefig(os.path.join(output_dir, 'fehlerrate_histogramm.png'), dpi=300)
    
    # Tageszeit-Analyse (Stunde des Tages vs. Fehlerrate)
    plt.figure(figsize=(10, 6))
    
    # Extrahiere Stunde des Tages und gruppiere Fehlerraten
    hour_of_day_rates = {}
    for hour_str, rate in zip(hours, rates):
        hour = int(hour_str.split(" ")[1].split(":")[0])
        if hour not in hour_of_day_rates:
            hour_of_day_rates[hour] = []
        hour_of_day_rates[hour].append(rate)
    
    # Berechne Durchschnitt pro Stunde
    avg_by_hour = {}
    for hour, hour_rates in hour_of_day_rates.items():
        avg_by_hour[hour] = sum(hour_rates) / len(hour_rates)
    
    # Sortiere nach Stunde
    sorted_hours = sorted(avg_by_hour.keys())
    sorted_rates = [avg_by_hour[hour] for hour in sorted_hours]
    
    plt.bar(sorted_hours, sorted_rates, color='#9b59b6', alpha=0.7, edgecolor='black')
    plt.axhline(y=5, color='r', linestyle='--', label='Schwellwert (5%)')
    
    plt.title('Durchschnittliche Fehlerrate nach Tageszeit', fontsize=16)
    plt.xlabel('Stunde des Tages', fontsize=12)
    plt.ylabel('Durchschnittliche Fehlerrate (%)', fontsize=12)
    plt.xticks(range(0, 24))
    plt.grid(True, linestyle='--', alpha=0.7)
    plt.legend()
    plt.tight_layout()
    
    # Speichere den Plot
    plt.savefig(os.path.join(output_dir, 'fehlerrate_tageszeit.png'), dpi=300)
    
    print(f"Plots wurden im Verzeichnis '{output_dir}' gespeichert.")

def generate_report(stats: Dict[str, Any], analysis: Dict[str, Any], output_file: str):
    """Generiert einen detaillierten Bericht über die Paketqualität."""
    if "error" in analysis:
        with open(output_file, 'w') as f:
            f.write(f"Fehler: {analysis['error']}\n")
        return
    
    report = [
        "# EHS-Sentinel Paketqualitäts-Analysebericht",
        "=" * 80,
        "",
        f"## Zusammenfassung",
        f"- **Analysezeitraum**: {analysis['first_hour']} bis {analysis['last_hour']}",
        f"- **Gesamtpakete**: {stats['total_packets']}",
        f"- **Ungültige Pakete**: {stats['invalid_packets']}",
        f"- **Gesamtfehlerrate**: {stats['error_rate_percent']:.2f}%",
        f"- **Durchschnittliche stündliche Fehlerrate**: {analysis['avg_error_rate']:.2f}%",
        f"- **Standardabweichung**: {analysis['std_dev']:.2f}%",
        "",
        f"## Stunden mit den höchsten Fehlerraten",
        "-" * 80
    ]
    
    for hour, rate in analysis["worst_hours"]:
        report.append(f"- **{hour}**: {rate:.2f}%")
    
    report.extend([
        "",
        f"## Stunden mit den niedrigsten Fehlerraten",
        "-" * 80
    ])
    
    for hour, rate in analysis["best_hours"]:
        report.append(f"- **{hour}**: {rate:.2f}%")
    
    report.extend([
        "",
        f"## Analyse und Empfehlungen",
        "-" * 80
    ])
    
    # Füge Empfehlungen basierend auf der Analyse hinzu
    if stats['error_rate_percent'] > 5:
        report.extend([
            "⚠️ **Die Gesamtfehlerrate ist zu hoch (>5%).**",
            "",
            "### Empfohlene Maßnahmen:",
            "1. **Physische Verbindung überprüfen**",
            "   - Kabel und Stecker auf Beschädigungen prüfen",
            "   - Verbindungen neu herstellen und sichern",
            "   - Qualität des RS485-Adapters überprüfen",
            "",
            "2. **WLAN-Störungen reduzieren** (bei Funk-Adaptern)",
            "   - WLAN-Kanal wechseln, um Interferenzen zu vermeiden",
            "   - Abstand zu anderen elektronischen Geräten vergrößern",
            "   - Signalstärke und Qualität überprüfen",
            "",
            "3. **Modbus-Einstellungen validieren**",
            "   - Baudrate überprüfen (Standard: 9600)",
            "   - Parität-Einstellungen überprüfen (Standard: Even)",
            "   - Stop-Bits und Datenbits-Konfiguration prüfen",
            "",
            "4. **Polling-Strategie anpassen**",
            "   - Polling-Intervalle erhöhen, um Belastung zu reduzieren",
            "   - Anzahl der abgefragten Sensoren reduzieren",
            "   - Priorität auf kritische Sensoren legen"
        ])
        
        # Spezifische Empfehlungen basierend auf Tageszeit-Analyse
        hour_analysis = {}
        for hour, rates in hour_of_day_rates.items():
            avg_rate = sum(rates) / len(rates)
            hour_analysis[hour] = avg_rate
        
        problem_hours = [hour for hour, rate in hour_analysis.items() if rate > 5]
        if problem_hours:
            report.extend([
                "",
                f"### Zeitliche Muster:",
                f"Problematische Stunden des Tages: {', '.join(map(str, problem_hours))}"
            ])
            
            if all(6 <= h <= 22 for h in problem_hours):
                report.append("- Die Probleme treten hauptsächlich während der Tagesstunden auf, was auf WLAN-Interferenzen oder erhöhte Netzwerkaktivität hindeuten könnte.")
            elif all(h < 6 or h > 22 for h in problem_hours):
                report.append("- Die Probleme treten hauptsächlich nachts auf, was auf geplante Netzwerkwartungen oder Energiesparmaßnahmen hindeuten könnte.")
    else:
        report.extend([
            "✅ **Die Gesamtfehlerrate ist akzeptabel (<5%).**",
            "",
            "### Empfehlungen zur Aufrechterhaltung:",
            "1. Regelmäßige Überprüfung der Verbindungsqualität",
            "2. Monitoring der Fehlerrate auf plötzliche Änderungen",
            "3. Backup der aktuellen Konfiguration für zukünftige Referenz"
        ])
    
    report.extend([
        "",
        "## Visualisierungen",
        "-" * 80,
        "",
        "Die folgenden Visualisierungen wurden generiert:",
        "1. `fehlerrate_zeitreihe.png` - Zeitlicher Verlauf der Fehlerrate",
        "2. `fehlerrate_histogramm.png` - Verteilung der Fehlerraten",
        "3. `fehlerrate_tageszeit.png` - Fehlerrate nach Tageszeit",
        "",
        f"Bericht erstellt am: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    ])
    
    with open(output_file, 'w') as f:
        f.write("\n".join(report))
    
    print(f"Bericht wurde in '{output_file}' gespeichert.")

def main():
    parser = argparse.ArgumentParser(description="Analysiert EHS-Sentinel Paketqualitätsstatistiken")
    parser.add_argument("--stats-file", default="/data/packet_stats.json",
                       help="Pfad zur Paketstatistik-Datei")
    parser.add_argument("--output-dir", default="packet_analysis",
                       help="Ausgabeverzeichnis für Berichte und Visualisierungen")
    parser.add_argument("--report-file", default="packet_quality_report.md",
                       help="Dateiname für den Analysebericht")
    
    args = parser.parse_args()
    
    # Lade Statistiken
    print(f"Lade Paketstatistiken aus {args.stats_file}...")
    stats = load_stats(args.stats_file)
    
    # Analysiere Statistiken
    print("Analysiere Paketqualität...")
    analysis = analyze_hourly_stats(stats)
    
    # Erstelle Ausgabeverzeichnis
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Generiere Visualisierungen
    print("Generiere Visualisierungen...")
    generate_plots(analysis, args.output_dir)
    
    # Generiere Bericht
    report_path = os.path.join(args.output_dir, args.report_file)
    print(f"Generiere Analysebericht: {report_path}")
    generate_report(stats, analysis, report_path)
    
    print("\n🎉 Analyse abgeschlossen!")
    print(f"📊 Visualisierungen und Bericht wurden in '{args.output_dir}' gespeichert.")
    print(f"📝 Hauptbericht: {report_path}")

if __name__ == "__main__":
    main()