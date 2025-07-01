#!/usr/bin/env python3
"""
24-Stunden-Report-Generator für EHS-Sentinel

Dieses Tool generiert einen umfassenden 24-Stunden-Bericht über die
Kommunikationsqualität zwischen der Wärmepumpe und dem Gateway.

Der Bericht enthält:
- Paketqualitätsmetriken
- Fehlerraten-Analyse
- Empfehlungen zur Verbesserung
"""

import json
import argparse
import datetime
import os
import sys
from typing import Dict, List, Any, Optional

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

def filter_last_24h_stats(stats: Dict[str, Any]) -> Dict[str, Any]:
    """Filtert die Statistiken der letzten 24 Stunden."""
    hourly_stats = stats.get("hourly_stats", {})
    
    if not hourly_stats:
        return {"error": "Keine stündlichen Statistiken verfügbar."}
    
    # Berechne Zeitpunkt vor 24 Stunden
    now = datetime.datetime.now()
    cutoff_time = now - datetime.timedelta(hours=24)
    cutoff_str = cutoff_time.strftime("%Y-%m-%d %H:00")
    
    # Filtere Stunden der letzten 24 Stunden
    last_24h_stats = {}
    for hour, data in hourly_stats.items():
        if hour >= cutoff_str:
            last_24h_stats[hour] = data
    
    # Berechne Gesamtstatistiken für die letzten 24 Stunden
    total_packets = sum(data["total"] for data in last_24h_stats.values())
    invalid_packets = sum(data["invalid"] for data in last_24h_stats.values())
    error_rate = (invalid_packets / total_packets * 100) if total_packets > 0 else 0
    
    return {
        "total_packets": total_packets,
        "invalid_packets": invalid_packets,
        "error_rate_percent": error_rate,
        "hourly_stats": last_24h_stats,
        "period_start": cutoff_str,
        "period_end": now.strftime("%Y-%m-%d %H:00")
    }

def generate_24h_report(stats_24h: Dict[str, Any], output_file: str):
    """Generiert einen 24-Stunden-Bericht über die Paketqualität."""
    if "error" in stats_24h:
        with open(output_file, 'w') as f:
            f.write(f"Fehler: {stats_24h['error']}\n")
        return
    
    # Sortiere Stunden chronologisch
    sorted_hours = sorted(stats_24h["hourly_stats"].keys())
    
    report = [
        "# EHS-Sentinel 24-Stunden Paketqualitäts-Bericht",
        "=" * 80,
        "",
        f"## Zusammenfassung",
        f"- **Zeitraum**: {stats_24h['period_start']} bis {stats_24h['period_end']}",
        f"- **Gesamtpakete**: {stats_24h['total_packets']}",
        f"- **Ungültige Pakete**: {stats_24h['invalid_packets']}",
        f"- **Gesamtfehlerrate**: {stats_24h['error_rate_percent']:.2f}%",
        "",
        f"## Stündliche Statistik",
        "-" * 80,
        "",
        "| Stunde | Pakete | Ungültig | Fehlerrate | Status |",
        "|--------|--------|----------|------------|--------|"
    ]
    
    # Füge stündliche Statistiken hinzu
    for hour in sorted_hours:
        data = stats_24h["hourly_stats"][hour]
        total = data["total"]
        invalid = data["invalid"]
        error_rate = (invalid / total * 100) if total > 0 else 0
        
        status = "✅ Gut" if error_rate <= 5 else "⚠️ Problematisch"
        
        report.append(f"| {hour} | {total} | {invalid} | {error_rate:.2f}% | {status} |")
    
    report.extend([
        "",
        f"## Analyse und Empfehlungen",
        "-" * 80
    ])
    
    # Füge Empfehlungen basierend auf der Analyse hinzu
    if stats_24h['error_rate_percent'] > 5:
        report.extend([
            "⚠️ **Die Gesamtfehlerrate ist zu hoch (>5%).**",
            "",
            "### Empfohlene Maßnahmen:",
            "",
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
            "   - Stop-Bits und Datenbits-Konfiguration prüfen"
        ])
        
        # Identifiziere Muster in problematischen Stunden
        problem_hours = []
        for hour in sorted_hours:
            data = stats_24h["hourly_stats"][hour]
            total = data["total"]
            invalid = data["invalid"]
            error_rate = (invalid / total * 100) if total > 0 else 0
            
            if error_rate > 5:
                hour_obj = datetime.datetime.strptime(hour, "%Y-%m-%d %H:00")
                problem_hours.append(hour_obj.hour)
        
        if problem_hours:
            report.extend([
                "",
                "### Zeitliche Muster:",
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
            "Die Verbindung zwischen der Wärmepumpe und dem Gateway funktioniert zuverlässig. Keine Maßnahmen erforderlich."
        ])
    
    report.extend([
        "",
        f"Bericht erstellt am: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    ])
    
    with open(output_file, 'w') as f:
        f.write("\n".join(report))
    
    print(f"24-Stunden-Bericht wurde in '{output_file}' gespeichert.")

def main():
    parser = argparse.ArgumentParser(description="Generiert einen 24-Stunden-Bericht über die EHS-Sentinel Paketqualität")
    parser.add_argument("--stats-file", default="/data/packet_stats.json",
                       help="Pfad zur Paketstatistik-Datei")
    parser.add_argument("--output-file", default="/data/24h_report.md",
                       help="Ausgabedatei für den 24-Stunden-Bericht")
    
    args = parser.parse_args()
    
    # Lade Statistiken
    print(f"Lade Paketstatistiken aus {args.stats_file}...")
    stats = load_stats(args.stats_file)
    
    # Filtere Statistiken der letzten 24 Stunden
    print("Filtere Statistiken der letzten 24 Stunden...")
    stats_24h = filter_last_24h_stats(stats)
    
    # Generiere Bericht
    print(f"Generiere 24-Stunden-Bericht: {args.output_file}")
    generate_24h_report(stats_24h, args.output_file)
    
    print("\n🎉 Bericht erfolgreich generiert!")
    print(f"📝 24-Stunden-Bericht: {args.output_file}")

if __name__ == "__main__":
    main()