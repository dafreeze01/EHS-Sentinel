#!/usr/bin/env python3
"""
Dashboard Generator für EHS-Sentinel
Generiert automatisch Home Assistant Lovelace Dashboard-Konfigurationen
basierend auf der NasaRepository.yml und konfigurierten Polling-Gruppen.
"""

import yaml
import json
import argparse
from pathlib import Path
from typing import Dict, List, Any

class DashboardGenerator:
    """Generiert Home Assistant Dashboard-Konfigurationen für EHS-Sentinel."""
    
    def __init__(self, nasa_repo_path: str):
        """
        Initialisiert den Dashboard-Generator.
        
        Args:
            nasa_repo_path: Pfad zur NasaRepository.yml Datei
        """
        self.nasa_repo = self._load_nasa_repo(nasa_repo_path)
        self.device_id = "samsung_ehssentinel"
        
    def _load_nasa_repo(self, path: str) -> Dict[str, Any]:
        """Lädt das NASA Repository."""
        with open(path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    
    def _normalize_name(self, name: str) -> str:
        """Normalisiert Entity-Namen für Home Assistant."""
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
    
    def _get_entity_id(self, name: str) -> str:
        """Generiert die Entity-ID für Home Assistant."""
        normalized = self._normalize_name(name)
        
        # Bestimme den Plattform-Typ
        platform = "sensor"  # Default
        
        if name in self.nasa_repo:
            repo_entry = self.nasa_repo[name]
            hass_opts = repo_entry.get('hass_opts', {})
            
            if hass_opts.get('writable', False) and 'platform' in hass_opts:
                platform_info = hass_opts['platform']
                if isinstance(platform_info, dict) and 'type' in platform_info:
                    platform = platform_info['type']
            else:
                platform = hass_opts.get('default_platform', 'sensor')
        
        return f"{platform}.{self.device_id}_{normalized.lower()}"
    
    def _create_entity_card(self, name: str, custom_name: str = None) -> Dict[str, Any]:
        """Erstellt eine Entity-Karte für das Dashboard."""
        entity_id = self._get_entity_id(name)
        display_name = custom_name or self.nasa_repo.get(name, {}).get('description', name)
        
        card = {
            "entity": entity_id,
            "name": display_name,
            "secondary_info": "last-updated"
        }
        
        # Füge Icon hinzu basierend auf dem Typ
        if name in self.nasa_repo:
            repo_entry = self.nasa_repo[name]
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
    
    def generate_comprehensive_dashboard(self) -> Dict[str, Any]:
        """Generiert ein umfassendes Dashboard mit allen verfügbaren Sensoren."""
        
        # Grundlegende Steuerung
        control_entities = [
            self._create_entity_card("NASA_POWER", "🔌 Wärmepumpe Ein/Aus"),
            self._create_entity_card("NASA_INDOOR_OPMODE", "⚙️ Betriebsmodus"),
            self._create_entity_card("NASA_OUTDOOR_OPERATION_STATUS", "📊 Aktueller Status"),
            self._create_entity_card("DHW_POWER", "🚿 Warmwasser"),
            self._create_entity_card("CONTROL_SILENCE", "🔇 Leiser Modus"),
            self._create_entity_card("NASA_OUTDOOR_DEFROST_STEP", "❄️ Abtau-Status"),
        ]
        
        # Temperaturen
        temp_entities = [
            self._create_entity_card("NASA_OUTDOOR_TW2_TEMP", "🌡️ Vorlauf"),
            self._create_entity_card("NASA_OUTDOOR_TW1_TEMP", "🌡️ Rücklauf"),
            self._create_entity_card("NASA_OUTDOOR_OUT_TEMP", "🌡️ Außen"),
            self._create_entity_card("NASA_INDOOR_DHW_CURRENT_TEMP", "🌡️ Warmwasser"),
            self._create_entity_card("VAR_IN_TEMP_WATER_LAW_TARGET_F", "🎯 Heizkurve"),
        ]
        
        # Leistung & Effizienz
        power_entities = [
            self._create_entity_card("NASA_EHSSENTINEL_HEAT_OUTPUT", "🔥 Heizleistung"),
            self._create_entity_card("NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT", "⚡ Stromverbrauch"),
            self._create_entity_card("NASA_EHSSENTINEL_COP", "📈 COP aktuell"),
            self._create_entity_card("NASA_EHSSENTINEL_TOTAL_COP", "📊 COP gesamt"),
            self._create_entity_card("VAR_IN_FLOW_SENSOR_CALC", "💧 Durchfluss"),
        ]
        
        # Kompressor & Lüfter
        compressor_entities = [
            self._create_entity_card("NASA_OUTDOOR_COMP1_TARGET_HZ", "🎯 Zielfrequenz"),
            self._create_entity_card("NASA_OUTDOOR_COMP1_RUN_HZ", "⚡ Istfrequenz"),
            self._create_entity_card("NASA_OUTDOOR_COMP1_ORDER_HZ", "📋 Sollfrequenz"),
            self._create_entity_card("NASA_OUTDOOR_FAN_RPM1", "🌪️ Lüfter"),
        ]
        
        dashboard = {
            "views": [
                {
                    "title": "🏠 Übersicht",
                    "type": "sections",
                    "max_columns": 4,
                    "subview": False,
                    "sections": [
                        {
                            "type": "grid",
                            "cards": [
                                {
                                    "type": "entities",
                                    "entities": control_entities,
                                    "title": "🎛️ Steuerung & Status",
                                    "show_header_toggle": False
                                }
                            ],
                            "column_span": 1
                        },
                        {
                            "type": "grid",
                            "cards": [
                                {
                                    "type": "entities",
                                    "entities": temp_entities,
                                    "title": "🌡️ Temperaturen",
                                    "show_header_toggle": False
                                }
                            ],
                            "column_span": 1
                        },
                        {
                            "type": "grid",
                            "cards": [
                                {
                                    "type": "entities",
                                    "entities": power_entities,
                                    "title": "⚡ Leistung & Effizienz",
                                    "show_header_toggle": False
                                }
                            ],
                            "column_span": 1
                        },
                        {
                            "type": "grid",
                            "cards": [
                                {
                                    "type": "entities",
                                    "entities": compressor_entities,
                                    "title": "🔧 Kompressor & Lüfter",
                                    "show_header_toggle": False
                                }
                            ],
                            "column_span": 1
                        },
                        {
                            "type": "grid",
                            "cards": [
                                {
                                    "type": "history-graph",
                                    "entities": [
                                        {
                                            "entity": self._get_entity_id("NASA_OUTDOOR_TW2_TEMP"),
                                            "name": "Vorlauf"
                                        },
                                        {
                                            "entity": self._get_entity_id("NASA_OUTDOOR_TW1_TEMP"),
                                            "name": "Rücklauf"
                                        },
                                        {
                                            "entity": self._get_entity_id("NASA_OUTDOOR_OUT_TEMP"),
                                            "name": "Außen"
                                        }
                                    ],
                                    "title": "🌡️ Temperaturverlauf",
                                    "hours_to_show": 12,
                                    "grid_options": {
                                        "columns": "full",
                                        "rows": 8
                                    }
                                }
                            ],
                            "column_span": 4
                        }
                    ]
                }
            ]
        }
        
        return dashboard
    
    def generate_fsv_dashboard(self, groups: Dict[str, List[str]]) -> Dict[str, Any]:
        """Generiert ein Dashboard für FSV-Parameter basierend auf Polling-Gruppen."""
        
        sections = []
        
        for group_name, parameters in groups.items():
            if not group_name.startswith('fsv'):
                continue
                
            # Erstelle Entities für diese Gruppe
            entities = []
            for param in parameters:
                if param in self.nasa_repo:
                    entities.append(self._create_entity_card(param))
            
            if entities:
                # Bestimme den Titel basierend auf der Gruppe
                titles = {
                    'fsv10xx': 'FSV 10** - Fernbedienung',
                    'fsv20xx': 'FSV 20** - Wassergesetz',
                    'fsv30xx': 'FSV 30** - Warmwasser',
                    'fsv40xx': 'FSV 40** - Heizung',
                    'fsv50xx': 'FSV 50** - Sonstige'
                }
                
                section = {
                    "type": "grid",
                    "cards": [
                        {
                            "type": "entities",
                            "entities": entities,
                            "title": titles.get(group_name, group_name.upper()),
                            "show_header_toggle": False,
                            "state_color": True
                        }
                    ],
                    "column_span": 2
                }
                sections.append(section)
        
        dashboard = {
            "views": [
                {
                    "title": "⚙️ FSV Parameter",
                    "type": "sections",
                    "max_columns": 6,
                    "path": "fsv-parameter",
                    "sections": sections
                }
            ]
        }
        
        return dashboard
    
    def save_dashboard(self, dashboard: Dict[str, Any], output_path: str):
        """Speichert das Dashboard als YAML-Datei."""
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(dashboard, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

def main():
    """Hauptfunktion für das Dashboard-Generator-Script."""
    parser = argparse.ArgumentParser(description='Generiert Home Assistant Dashboards für EHS-Sentinel')
    parser.add_argument('--nasa-repo', default='ehs-sentinel/data/NasaRepository.yml',
                       help='Pfad zur NasaRepository.yml Datei')
    parser.add_argument('--output-dir', default='generated_dashboards',
                       help='Ausgabeverzeichnis für die generierten Dashboards')
    parser.add_argument('--type', choices=['comprehensive', 'fsv', 'all'], default='all',
                       help='Typ des zu generierenden Dashboards')
    
    args = parser.parse_args()
    
    # Erstelle Ausgabeverzeichnis
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)
    
    # Initialisiere Generator
    generator = DashboardGenerator(args.nasa_repo)
    
    if args.type in ['comprehensive', 'all']:
        print("Generiere umfassendes Dashboard...")
        comprehensive = generator.generate_comprehensive_dashboard()
        generator.save_dashboard(comprehensive, output_dir / 'comprehensive_dashboard.yaml')
        print(f"✅ Umfassendes Dashboard gespeichert: {output_dir / 'comprehensive_dashboard.yaml'}")
    
    if args.type in ['fsv', 'all']:
        print("Generiere FSV-Parameter Dashboard...")
        # Beispiel-Gruppen (sollten aus der Konfiguration geladen werden)
        fsv_groups = {
            'fsv10xx': ['VAR_IN_FSV_1011', 'VAR_IN_FSV_1012', 'VAR_IN_FSV_1021', 'VAR_IN_FSV_1022'],
            'fsv20xx': ['VAR_IN_FSV_2011', 'VAR_IN_FSV_2012', 'ENUM_IN_FSV_2041'],
            'fsv30xx': ['ENUM_IN_FSV_3011', 'VAR_IN_FSV_3021', 'ENUM_IN_FSV_3041'],
            'fsv40xx': ['ENUM_IN_FSV_4011', 'VAR_IN_FSV_4012', 'ENUM_IN_FSV_4021'],
            'fsv50xx': ['ENUM_IN_FSV_5041', 'ENUM_IN_FSV_5081', 'ENUM_IN_FSV_5091']
        }
        
        fsv_dashboard = generator.generate_fsv_dashboard(fsv_groups)
        generator.save_dashboard(fsv_dashboard, output_dir / 'fsv_dashboard.yaml')
        print(f"✅ FSV-Dashboard gespeichert: {output_dir / 'fsv_dashboard.yaml'}")
    
    print("\n🎉 Dashboard-Generierung abgeschlossen!")
    print(f"📁 Alle Dateien wurden in '{output_dir}' gespeichert.")
    print("\n📋 Nächste Schritte:")
    print("1. Kopieren Sie die gewünschte Dashboard-Datei")
    print("2. Gehen Sie zu Home Assistant → Einstellungen → Dashboards")
    print("3. Erstellen Sie ein neues Dashboard oder bearbeiten Sie ein vorhandenes")
    print("4. Wechseln Sie zur YAML-Ansicht und fügen Sie den Inhalt ein")

if __name__ == "__main__":
    main()