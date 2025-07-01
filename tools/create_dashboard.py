#!/usr/bin/env python3
"""
Dashboard-Generator für EHS-Sentinel

Dieses Tool erstellt automatisch ein Home Assistant Dashboard
für die Samsung EHS Wärmepumpe basierend auf den verfügbaren Sensoren.

Funktionen:
- Generiert ein umfassendes Dashboard mit allen Sensoren
- Erstellt spezifische Ansichten für Heizung, Kühlung, Warmwasser
- Integriert Paketqualitäts-Metriken in die Diagnose-Ansicht
"""

import json
import yaml
import argparse
import os
import sys
from typing import Dict, List, Any, Optional

def load_nasa_repo(repo_path: str) -> Dict[str, Any]:
    """Lädt das NASA Repository aus einer YAML-Datei."""
    if not os.path.exists(repo_path):
        print(f"Fehler: NASA Repository {repo_path} nicht gefunden.")
        sys.exit(1)
        
    try:
        with open(repo_path, 'r') as f:
            return yaml.safe_load(f)
    except yaml.YAMLError:
        print(f"Fehler: Die Datei {repo_path} enthält kein gültiges YAML.")
        sys.exit(1)
    except Exception as e:
        print(f"Fehler beim Laden des NASA Repository: {e}")
        sys.exit(1)

def load_packet_stats(stats_file: str) -> Dict[str, Any]:
    """Lädt die Paketstatistiken aus einer JSON-Datei."""
    if not os.path.exists(stats_file):
        print(f"Warnung: Paketstatistik-Datei {stats_file} nicht gefunden. Statistiken werden nicht einbezogen.")
        return {}
        
    try:
        with open(stats_file, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError:
        print(f"Warnung: Die Datei {stats_file} enthält kein gültiges JSON. Statistiken werden nicht einbezogen.")
        return {}
    except Exception as e:
        print(f"Warnung: Fehler beim Laden der Paketstatistiken: {e}")
        return {}

def normalize_entity_name(name: str) -> str:
    """Normalisiert einen Entity-Namen für Home Assistant."""
    # Entferne Präfixe
    prefixes = ['ENUM_', 'LVAR_', 'NASA_', 'VAR_', 'STR_']
    for prefix in prefixes:
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    
    # Konvertiere zu CamelCase
    parts = name.split("_")
    if not parts:
        return name.lower()
        
    result = parts[0].lower()
    for part in parts[1:]:
        result += part.capitalize()
    
    return result

def get_entity_id(name: str, nasa_repo: Dict[str, Any], device_id: str = "samsung_ehssentinel") -> str:
    """Generiert die Entity-ID für Home Assistant."""
    normalized = normalize_entity_name(name)
    
    # Bestimme den Plattform-Typ
    platform = "sensor"  # Default
    
    if name in nasa_repo:
        repo_entry = nasa_repo[name]
        hass_opts = repo_entry.get('hass_opts', {})
        
        if hass_opts.get('writable', False) and 'platform' in hass_opts:
            platform_info = hass_opts['platform']
            if isinstance(platform_info, dict) and 'type' in platform_info:
                platform = platform_info['type']
        else:
            platform = hass_opts.get('default_platform', 'sensor')
    
    return f"{platform}.{device_id}_{normalized.lower()}"

def create_entity_card(name: str, nasa_repo: Dict[str, Any], custom_name: str = None) -> Dict[str, Any]:
    """Erstellt eine Entity-Karte für das Dashboard."""
    entity_id = get_entity_id(name, nasa_repo)
    display_name = custom_name or nasa_repo.get(name, {}).get('description', name)
    
    card = {
        "entity": entity_id,
        "name": display_name,
        "secondary_info": "last-updated"
    }
    
    # Füge Icon hinzu basierend auf dem Typ
    if name in nasa_repo:
        repo_entry = nasa_repo[name]
        unit = repo_entry.get('unit', '')
        
        if '°C' in unit:
            card["icon"] = "mdi:thermometer"
        elif 'W' in unit or 'kW' in unit:
            card["icon"] = "mdi:lightning-bolt"
        elif 'bar' in unit:
            card["icon"] = "mdi:gauge"
        elif 'Hz' in unit:
            card["icon"] = "mdi:sine-wave"
        elif 'rpm' in unit:
            card["icon"] = "mdi:fan"
        elif 'min' in unit or 'h' in unit:
            card["icon"] = "mdi:timer"
    
    return card

def create_dashboard(nasa_repo: Dict[str, Any], packet_stats: Dict[str, Any], output_file: str):
    """Erstellt ein umfassendes Dashboard für die Samsung EHS Wärmepumpe."""
    # Gruppiere Sensoren nach Kategorien
    sensor_groups = {
        "control": [
            "NASA_POWER", "NASA_INDOOR_OPMODE", "NASA_OUTDOOR_OPERATION_STATUS",
            "DHW_POWER", "CONTROL_SILENCE", "NASA_OUTDOOR_DEFROST_STEP"
        ],
        "temperatures": [
            "NASA_OUTDOOR_TW2_TEMP", "NASA_OUTDOOR_TW1_TEMP", "NASA_OUTDOOR_OUT_TEMP",
            "NASA_INDOOR_DHW_CURRENT_TEMP", "VAR_IN_TEMP_WATER_LAW_TARGET_F"
        ],
        "power": [
            "NASA_EHSSENTINEL_HEAT_OUTPUT", "NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT",
            "NASA_EHSSENTINEL_COP", "NASA_EHSSENTINEL_TOTAL_COP", "VAR_IN_FLOW_SENSOR_CALC"
        ],
        "compressor": [
            "NASA_OUTDOOR_COMP1_TARGET_HZ", "NASA_OUTDOOR_COMP1_RUN_HZ",
            "NASA_OUTDOOR_COMP1_ORDER_HZ", "NASA_OUTDOOR_FAN_RPM1"
        ],
        "heating": [
            "VAR_IN_FSV_1031", "VAR_IN_FSV_1032", "VAR_IN_FSV_1041", "VAR_IN_FSV_1042",
            "VAR_IN_FSV_2011", "VAR_IN_FSV_2012", "VAR_IN_FSV_2021", "VAR_IN_FSV_2022",
            "VAR_IN_FSV_2031", "VAR_IN_FSV_2032", "ENUM_IN_FSV_2041"
        ],
        "cooling": [
            "VAR_IN_FSV_1011", "VAR_IN_FSV_1012", "VAR_IN_FSV_1021", "VAR_IN_FSV_1022",
            "VAR_IN_FSV_2051", "VAR_IN_FSV_2052", "VAR_IN_FSV_2061", "VAR_IN_FSV_2062",
            "VAR_IN_FSV_2071", "VAR_IN_FSV_2072", "ENUM_IN_FSV_2081"
        ],
        "dhw": [
            "ENUM_IN_FSV_3011", "VAR_IN_FSV_1051", "VAR_IN_FSV_1052", "VAR_IN_FSV_3021",
            "VAR_IN_FSV_3022", "VAR_IN_FSV_3023", "ENUM_IN_FSV_3041", "ENUM_IN_FSV_3042"
        ],
        "smart": [
            "ENUM_IN_SG_READY_MODE_STATE", "ENUM_IN_FSV_5091", "VAR_IN_FSV_5092",
            "VAR_IN_FSV_5093", "ENUM_IN_FSV_5094", "ENUM_IN_PV_CONTACT_STATE",
            "ENUM_IN_FSV_5081", "VAR_IN_FSV_5082", "VAR_IN_FSV_5083"
        ],
        "system": [
            "STR_OUTDOOR_MODEL_NAME", "STR_INDOOR_MODEL_NAME", "STR_SERIAL_NUMBER",
            "STR_MANUFACTURE_DATE", "STR_INSTALLATION_DATE", "STR_SOFTWARE_VERSION",
            "STR_FIRMWARE_VERSION"
        ]
    }
    
    # Erstelle Entity-Karten für jede Gruppe
    entity_cards = {}
    for group, sensors in sensor_groups.items():
        entity_cards[group] = []
        for sensor in sensors:
            if sensor in nasa_repo:
                entity_cards[group].append(create_entity_card(sensor, nasa_repo))
    
    # Erstelle das Dashboard
    dashboard = {
        "title": "🏠 EHS Wärmepumpen-Steuerung",
        "views": [
            # Hauptübersicht
            {
                "title": "📊 Hauptübersicht",
                "type": "sections",
                "max_columns": 4,
                "subview": False,
                "sections": [
                    # Steuerung
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "entities",
                                "entities": entity_cards["control"],
                                "title": "🎛️ Steuerung & Status",
                                "show_header_toggle": False,
                                "state_color": True
                            }
                        ],
                        "column_span": 1
                    },
                    # Temperaturen
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "entities",
                                "entities": entity_cards["temperatures"],
                                "title": "🌡️ Temperaturen",
                                "show_header_toggle": False,
                                "state_color": True
                            }
                        ],
                        "column_span": 1
                    },
                    # Leistung
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "entities",
                                "entities": entity_cards["power"],
                                "title": "⚡ Leistung & Effizienz",
                                "show_header_toggle": False,
                                "state_color": True
                            }
                        ],
                        "column_span": 1
                    },
                    # Kompressor
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "entities",
                                "entities": entity_cards["compressor"],
                                "title": "🔧 Kompressor & Lüfter",
                                "show_header_toggle": False,
                                "state_color": True
                            }
                        ],
                        "column_span": 1
                    },
                    # Verlaufsdiagramme
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "history-graph",
                                "entities": [
                                    {
                                        "entity": get_entity_id("NASA_OUTDOOR_TW2_TEMP", nasa_repo),
                                        "name": "Vorlauf"
                                    },
                                    {
                                        "entity": get_entity_id("NASA_OUTDOOR_TW1_TEMP", nasa_repo),
                                        "name": "Rücklauf"
                                    },
                                    {
                                        "entity": get_entity_id("NASA_OUTDOOR_OUT_TEMP", nasa_repo),
                                        "name": "Außen"
                                    }
                                ],
                                "title": "🌡️ Temperaturverlauf",
                                "hours_to_show": 24,
                                "refresh_interval": 300
                            },
                            {
                                "type": "history-graph",
                                "entities": [
                                    {
                                        "entity": get_entity_id("NASA_EHSSENTINEL_HEAT_OUTPUT", nasa_repo),
                                        "name": "Heizleistung"
                                    },
                                    {
                                        "entity": get_entity_id("NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT", nasa_repo),
                                        "name": "Stromverbrauch"
                                    },
                                    {
                                        "entity": get_entity_id("NASA_EHSSENTINEL_COP", nasa_repo),
                                        "name": "COP"
                                    }
                                ],
                                "title": "⚡ Leistungsverlauf",
                                "hours_to_show": 24,
                                "refresh_interval": 300
                            }
                        ],
                        "column_span": 4
                    }
                ]
            },
            # Heizung
            {
                "title": "🔥 Heizung",
                "type": "sections",
                "max_columns": 3,
                "path": "heizung",
                "icon": "mdi:radiator",
                "sections": [
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "entities",
                                "entities": entity_cards["heating"],
                                "title": "🎛️ Heizungseinstellungen",
                                "show_header_toggle": False,
                                "state_color": True
                            }
                        ],
                        "column_span": 3
                    }
                ]
            },
            # Kühlung
            {
                "title": "❄️ Kühlung",
                "type": "sections",
                "max_columns": 3,
                "path": "kuehlung",
                "icon": "mdi:snowflake",
                "sections": [
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "entities",
                                "entities": entity_cards["cooling"],
                                "title": "🎛️ Kühlungseinstellungen",
                                "show_header_toggle": False,
                                "state_color": True
                            }
                        ],
                        "column_span": 3
                    }
                ]
            },
            # Warmwasser
            {
                "title": "🚿 Warmwasser",
                "type": "sections",
                "max_columns": 3,
                "path": "warmwasser",
                "icon": "mdi:water-boiler",
                "sections": [
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "entities",
                                "entities": entity_cards["dhw"],
                                "title": "🎛️ Warmwassereinstellungen",
                                "show_header_toggle": False,
                                "state_color": True
                            }
                        ],
                        "column_span": 3
                    }
                ]
            },
            # Smart Features
            {
                "title": "🧠 Smart Features",
                "type": "sections",
                "max_columns": 3,
                "path": "smart",
                "icon": "mdi:brain",
                "sections": [
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "entities",
                                "entities": entity_cards["smart"],
                                "title": "🎛️ Smart Grid & PV",
                                "show_header_toggle": False,
                                "state_color": True
                            }
                        ],
                        "column_span": 3
                    }
                ]
            },
            # System Info
            {
                "title": "ℹ️ System Info",
                "type": "sections",
                "max_columns": 2,
                "path": "system",
                "icon": "mdi:information",
                "sections": [
                    {
                        "type": "grid",
                        "cards": [
                            {
                                "type": "entities",
                                "entities": entity_cards["system"],
                                "title": "🏭 Geräteinformationen",
                                "show_header_toggle": False
                            }
                        ],
                        "column_span": 2
                    }
                ]
            }
        ]
    }
    
    # Füge Paketqualitäts-Metriken hinzu, wenn verfügbar
    if packet_stats:
        try:
            total_packets = packet_stats.get("total_packets", 0)
            invalid_packets = packet_stats.get("invalid_packets", 0)
            error_rate = packet_stats.get("error_rate_percent", 0)
            
            packet_quality_card = {
                "type": "markdown",
                "title": "📊 Paketqualität",
                "content": f"""
## Kommunikationsqualität

- **Gesamtpakete**: {total_packets}
- **Ungültige Pakete**: {invalid_packets}
- **Fehlerrate**: {error_rate:.2f}%
- **Status**: {"✅ Gut" if error_rate <= 5 else "⚠️ Problematisch"}

*Letzte Aktualisierung: {packet_stats.get("last_updated", "Unbekannt")}*

Für detaillierte Berichte, führen Sie das Tool `generate_24h_report.py` aus.
"""
            }
            
            # Füge die Karte zur System Info Ansicht hinzu
            dashboard["views"][5]["sections"].append({
                "type": "grid",
                "cards": [packet_quality_card],
                "column_span": 2
            })
        except Exception as e:
            print(f"Warnung: Fehler beim Hinzufügen der Paketqualitäts-Metriken: {e}")
    
    # Speichere das Dashboard
    with open(output_file, 'w') as f:
        yaml.dump(dashboard, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
    
    print(f"Dashboard wurde in '{output_file}' gespeichert.")

def main():
    parser = argparse.ArgumentParser(description="Erstellt ein Home Assistant Dashboard für EHS-Sentinel")
    parser.add_argument("--nasa-repo", default="/app/data/NasaRepository.yml",
                       help="Pfad zum NASA Repository")
    parser.add_argument("--stats-file", default="/data/packet_stats.json",
                       help="Pfad zur Paketstatistik-Datei")
    parser.add_argument("--output-file", default="/config/ehs_dashboard.yaml",
                       help="Ausgabedatei für das Dashboard")
    
    args = parser.parse_args()
    
    # Lade NASA Repository
    print(f"Lade NASA Repository aus {args.nasa_repo}...")
    nasa_repo = load_nasa_repo(args.nasa_repo)
    
    # Lade Paketstatistiken (optional)
    packet_stats = load_packet_stats(args.stats_file)
    
    # Erstelle Dashboard
    print(f"Erstelle Dashboard: {args.output_file}")
    create_dashboard(nasa_repo, packet_stats, args.output_file)
    
    print("\n🎉 Dashboard erfolgreich erstellt!")
    print(f"📝 Dashboard-Datei: {args.output_file}")
    print("\nInstallationsanleitung:")
    print("1. Gehen Sie zu Home Assistant → Einstellungen → Dashboards")
    print("2. Klicken Sie auf 'Dashboard hinzufügen' → 'Aus YAML importieren'")
    print(f"3. Wählen Sie die Datei '{os.path.basename(args.output_file)}'")
    print("4. Klicken Sie auf 'Importieren'")

if __name__ == "__main__":
    main()