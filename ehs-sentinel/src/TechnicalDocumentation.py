"""
Technische Dokumentation für EHS-Sentinel
Generiert automatisch Dokumentation für MQTT-Kommunikation und Datenkonvertierung
"""

import json
import yaml
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

from CustomLogger import logger

@dataclass
class CommunicationExample:
    """Beispiel für MQTT-Kommunikation"""
    scenario: str
    description: str
    steps: List[Dict[str, Any]]
    expected_result: str
    troubleshooting: List[str]

class TechnicalDocumentation:
    """
    Generiert technische Dokumentation für EHS-Sentinel.
    Erklärt MQTT-Kommunikation, Datenkonvertierung und häufige Probleme.
    """
    
    def __init__(self):
        self.examples = self._create_communication_examples()
        self.conversion_examples = self._create_conversion_examples()
        self.troubleshooting_guide = self._create_troubleshooting_guide()
    
    def _create_communication_examples(self) -> List[CommunicationExample]:
        """Erstellt Beispiele für MQTT-Kommunikation"""
        return [
            CommunicationExample(
                scenario="Temperatur setzen",
                description="Setzen der maximalen Vorlauftemperatur für Heizung",
                steps=[
                    {
                        "step": 1,
                        "actor": "Home Assistant",
                        "action": "Publiziert SET-Kommando",
                        "topic": "ehsSentinel/entity/VAR_IN_FSV_1031/set",
                        "payload": "55",
                        "description": "Benutzer setzt Temperatur auf 55°C"
                    },
                    {
                        "step": 2,
                        "actor": "EHS-Sentinel",
                        "action": "Empfängt MQTT-Nachricht",
                        "description": "Addon empfängt SET-Kommando"
                    },
                    {
                        "step": 3,
                        "actor": "EHS-Sentinel",
                        "action": "Konvertiert Wert",
                        "conversion": "55 (Dezimal) → 0x37 (Hex) → 550 (Raw für NASA)",
                        "description": "Temperatur wird für NASA-Protokoll konvertiert"
                    },
                    {
                        "step": 4,
                        "actor": "EHS-Sentinel",
                        "action": "Sendet an Wärmepumpe",
                        "protocol": "NASA/Modbus",
                        "data": "0x2031: 0x0226 (550 = 55.0°C)",
                        "description": "Wert wird an Wärmepumpe gesendet"
                    },
                    {
                        "step": 5,
                        "actor": "Wärmepumpe",
                        "action": "Bestätigt Wert",
                        "description": "Wärmepumpe bestätigt neuen Wert"
                    },
                    {
                        "step": 6,
                        "actor": "EHS-Sentinel",
                        "action": "Publiziert STATE-Update",
                        "topic": "homeassistant/number/samsung_ehssentinel_infsv1031/state",
                        "payload": "55",
                        "description": "Bestätigung wird an Home Assistant gesendet"
                    }
                ],
                expected_result="Home Assistant zeigt neuen Wert 55°C an",
                troubleshooting=[
                    "Prüfen Sie MQTT-Verbindung wenn keine STATE-Nachricht kommt",
                    "Überprüfen Sie Wertebereiche (25-65°C für Heizung)",
                    "Kontrollieren Sie Steuerung-erlauben Einstellung"
                ]
            ),
            
            CommunicationExample(
                scenario="Betriebsmodus ändern",
                description="Wechsel des Betriebsmodus von AUTO zu HEAT",
                steps=[
                    {
                        "step": 1,
                        "actor": "Home Assistant",
                        "action": "Publiziert SET-Kommando",
                        "topic": "ehsSentinel/entity/NASA_INDOOR_OPMODE/set",
                        "payload": "HEAT",
                        "description": "Benutzer wählt HEAT-Modus"
                    },
                    {
                        "step": 2,
                        "actor": "EHS-Sentinel",
                        "action": "Konvertiert ENUM",
                        "conversion": "HEAT (String) → 1 (Enum-Wert) → 0x01 (Hex)",
                        "description": "String wird zu Enum-Wert konvertiert"
                    },
                    {
                        "step": 3,
                        "actor": "EHS-Sentinel",
                        "action": "Sendet an Wärmepumpe",
                        "protocol": "NASA/Modbus",
                        "data": "0x8001: 0x01 (HEAT)",
                        "description": "Neuer Modus wird gesetzt"
                    },
                    {
                        "step": 4,
                        "actor": "EHS-Sentinel",
                        "action": "Publiziert STATE-Update",
                        "topic": "homeassistant/select/samsung_ehssentinel_indooropmode/state",
                        "payload": "HEAT",
                        "description": "Bestätigung des neuen Modus"
                    }
                ],
                expected_result="Wärmepumpe wechselt in Heizmodus",
                troubleshooting=[
                    "Prüfen Sie ob Wärmepumpe im manuellen Modus ist",
                    "Kontrollieren Sie Außentemperatur (Heizgrenze)",
                    "Überprüfen Sie Warmwasser-Priorität Einstellungen"
                ]
            )
        ]
    
    def _create_conversion_examples(self) -> Dict[str, Any]:
        """Erstellt Beispiele für Datenkonvertierung"""
        return {
            "temperature_conversion": {
                "description": "Temperaturwerte werden mit Faktor 10 übertragen",
                "examples": [
                    {
                        "user_input": "23.5°C",
                        "internal_value": 235,
                        "hex_value": "0x00EB",
                        "nasa_packet": "0x2031: 0x00EB",
                        "reverse_conversion": "235 / 10 = 23.5°C"
                    },
                    {
                        "user_input": "55°C",
                        "internal_value": 550,
                        "hex_value": "0x0226",
                        "nasa_packet": "0x2031: 0x0226",
                        "reverse_conversion": "550 / 10 = 55°C"
                    }
                ]
            },
            "power_conversion": {
                "description": "Leistungswerte werden mit Faktor 8.6 übertragen",
                "examples": [
                    {
                        "raw_value": 860,
                        "hex_value": "0x035C",
                        "converted_value": "100W",
                        "formula": "860 / 8.6 = 100W"
                    },
                    {
                        "raw_value": 2580,
                        "hex_value": "0x0A14",
                        "converted_value": "300W",
                        "formula": "2580 / 8.6 = 300W"
                    }
                ]
            },
            "enum_conversion": {
                "description": "Enum-Werte werden als Zahlen übertragen",
                "examples": [
                    {
                        "enum_name": "NASA_INDOOR_OPMODE",
                        "mappings": {
                            "AUTO": 0,
                            "HEAT": 1,
                            "COOL": 2,
                            "DHW": 3,
                            "FAN": 4
                        }
                    },
                    {
                        "enum_name": "NASA_POWER",
                        "mappings": {
                            "OFF": 0,
                            "ON": 1
                        }
                    }
                ]
            },
            "string_conversion": {
                "description": "String-Werte werden als Byte-Arrays übertragen",
                "examples": [
                    {
                        "string_value": "EHS161",
                        "byte_array": "[0x45, 0x48, 0x53, 0x31, 0x36, 0x31]",
                        "hex_representation": "0x454853313631"
                    }
                ]
            }
        }
    
    def _create_troubleshooting_guide(self) -> Dict[str, Any]:
        """Erstellt Fehlerbehebungsanleitung"""
        return {
            "common_issues": [
                {
                    "problem": "SET-Kommando wird nicht ausgeführt",
                    "symptoms": [
                        "Home Assistant zeigt alten Wert",
                        "Keine STATE-Nachricht empfangen",
                        "Timeout in MQTT-Logs"
                    ],
                    "causes": [
                        "Steuerung nicht erlaubt (steuerung_erlauben: false)",
                        "MQTT-Verbindung unterbrochen",
                        "Wärmepumpe im Fehlerzustand",
                        "Ungültiger Wertebereich"
                    ],
                    "solutions": [
                        "Aktivieren Sie 'steuerung_erlauben' in der Addon-Konfiguration",
                        "Prüfen Sie MQTT-Broker Status",
                        "Kontrollieren Sie Wärmepumpen-Display auf Fehler",
                        "Überprüfen Sie Min/Max-Werte für Parameter"
                    ]
                },
                {
                    "problem": "Werte werden falsch angezeigt",
                    "symptoms": [
                        "Temperatur zeigt unrealistische Werte",
                        "Leistung ist um Faktor 10 falsch",
                        "Enum zeigt Zahlen statt Text"
                    ],
                    "causes": [
                        "Fehlerhafte Arithmetik-Formel",
                        "Falsche Enum-Zuordnung",
                        "Datentyp-Mismatch"
                    ],
                    "solutions": [
                        "Überprüfen Sie NASA Repository Arithmetik",
                        "Kontrollieren Sie Enum-Definitionen",
                        "Prüfen Sie Sensor-Typ (VAR/ENUM/STR)"
                    ]
                },
                {
                    "problem": "Kommunikationsfehler",
                    "symptoms": [
                        "Hohe Paketfehlerrate (>5%)",
                        "Häufige CRC-Fehler",
                        "Sensor-Timeouts"
                    ],
                    "causes": [
                        "Schlechte RS485-Verbindung",
                        "WLAN-Interferenzen",
                        "Falsche Baudrate/Parität"
                    ],
                    "solutions": [
                        "Prüfen Sie Kabelverbindungen",
                        "Wechseln Sie WLAN-Kanal",
                        "Kontrollieren Sie serielle Einstellungen"
                    ]
                }
            ],
            "diagnostic_steps": [
                {
                    "step": 1,
                    "title": "MQTT-Verbindung prüfen",
                    "commands": [
                        "mosquitto_sub -h localhost -t 'ehsSentinel/#'",
                        "mosquitto_pub -h localhost -t 'test' -m 'hello'"
                    ],
                    "expected": "Nachrichten werden empfangen und gesendet"
                },
                {
                    "step": 2,
                    "title": "Sensor-Status überprüfen",
                    "location": "Home Assistant → Entwicklertools → Zustände",
                    "filter": "samsung_ehssentinel",
                    "expected": "Sensoren zeigen aktuelle Werte"
                },
                {
                    "step": 3,
                    "title": "Addon-Logs analysieren",
                    "location": "Home Assistant → Add-ons → EHS-Sentinel → Logs",
                    "search_for": ["ERROR", "WARNING", "CRC", "Timeout"],
                    "expected": "Keine kritischen Fehler"
                }
            ]
        }
    
    def generate_mqtt_documentation(self) -> str:
        """Generiert MQTT-Kommunikationsdokumentation"""
        doc = [
            "# EHS-Sentinel MQTT-Kommunikation",
            "=" * 50,
            "",
            "## Übersicht",
            "",
            "EHS-Sentinel verwendet MQTT für die Kommunikation zwischen Home Assistant und der Samsung EHS Wärmepumpe.",
            "Die Kommunikation erfolgt bidirektional über verschiedene Topics.",
            "",
            "## Topic-Struktur",
            "",
            "### Steuerung (Home Assistant → EHS-Sentinel)",
            "```",
            "ehsSentinel/entity/{SENSOR_NAME}/set",
            "```",
            "",
            "### Status-Updates (EHS-Sentinel → Home Assistant)",
            "```",
            "homeassistant/{PLATFORM}/{DEVICE_ID}_{SENSOR_NAME}/state",
            "```",
            "",
            "### Auto-Discovery (EHS-Sentinel → Home Assistant)",
            "```",
            "homeassistant/{PLATFORM}/{DEVICE_ID}_{SENSOR_NAME}/config",
            "```",
            "",
            "## Kommunikationsbeispiele",
            ""
        ]
        
        for example in self.examples:
            doc.extend([
                f"### {example.scenario}",
                "",
                example.description,
                "",
                "**Ablauf:**",
                ""
            ])
            
            for step in example.steps:
                doc.append(f"{step['step']}. **{step['actor']}**: {step['action']}")
                if 'topic' in step:
                    doc.append(f"   - Topic: `{step['topic']}`")
                if 'payload' in step:
                    doc.append(f"   - Payload: `{step['payload']}`")
                if 'conversion' in step:
                    doc.append(f"   - Konvertierung: {step['conversion']}")
                if 'description' in step:
                    doc.append(f"   - {step['description']}")
                doc.append("")
            
            doc.extend([
                f"**Erwartetes Ergebnis:** {example.expected_result}",
                "",
                "**Fehlerbehebung:**",
                ""
            ])
            
            for troubleshoot in example.troubleshooting:
                doc.append(f"- {troubleshoot}")
            
            doc.extend(["", "---", ""])
        
        return "\n".join(doc)
    
    def generate_conversion_documentation(self) -> str:
        """Generiert Datenkonvertierungsdokumentation"""
        doc = [
            "# EHS-Sentinel Datenkonvertierung",
            "=" * 50,
            "",
            "## Übersicht",
            "",
            "EHS-Sentinel konvertiert Daten zwischen verschiedenen Formaten:",
            "- Home Assistant (Benutzerfreundlich)",
            "- NASA-Protokoll (Wärmepumpen-intern)",
            "- MQTT-Nachrichten (Übertragung)",
            "",
        ]
        
        for conv_type, conv_data in self.conversion_examples.items():
            doc.extend([
                f"## {conv_type.replace('_', ' ').title()}",
                "",
                conv_data['description'],
                ""
            ])
            
            if 'examples' in conv_data:
                doc.append("**Beispiele:**")
                doc.append("")
                
                for example in conv_data['examples']:
                    if 'user_input' in example:
                        doc.extend([
                            f"- Benutzereingabe: `{example['user_input']}`",
                            f"  - Interner Wert: `{example['internal_value']}`",
                            f"  - Hex-Wert: `{example['hex_value']}`",
                            f"  - NASA-Paket: `{example['nasa_packet']}`",
                            f"  - Rückkonvertierung: `{example['reverse_conversion']}`",
                            ""
                        ])
                    elif 'raw_value' in example:
                        doc.extend([
                            f"- Raw-Wert: `{example['raw_value']}`",
                            f"  - Hex: `{example['hex_value']}`",
                            f"  - Angezeigt: `{example['converted_value']}`",
                            f"  - Formel: `{example['formula']}`",
                            ""
                        ])
            
            if 'mappings' in conv_data:
                for example in conv_data['examples']:
                    doc.extend([
                        f"**{example['enum_name']}:**",
                        ""
                    ])
                    
                    for text_val, num_val in example['mappings'].items():
                        doc.append(f"- `{text_val}` → `{num_val}`")
                    
                    doc.append("")
            
            doc.extend(["", "---", ""])
        
        return "\n".join(doc)
    
    def generate_troubleshooting_documentation(self) -> str:
        """Generiert Fehlerbehebungsdokumentation"""
        doc = [
            "# EHS-Sentinel Fehlerbehebung",
            "=" * 50,
            "",
            "## Häufige Probleme und Lösungen",
            ""
        ]
        
        for issue in self.troubleshooting_guide['common_issues']:
            doc.extend([
                f"### {issue['problem']}",
                "",
                "**Symptome:**",
                ""
            ])
            
            for symptom in issue['symptoms']:
                doc.append(f"- {symptom}")
            
            doc.extend([
                "",
                "**Mögliche Ursachen:**",
                ""
            ])
            
            for cause in issue['causes']:
                doc.append(f"- {cause}")
            
            doc.extend([
                "",
                "**Lösungsansätze:**",
                ""
            ])
            
            for solution in issue['solutions']:
                doc.append(f"- {solution}")
            
            doc.extend(["", "---", ""])
        
        doc.extend([
            "",
            "## Diagnose-Schritte",
            "",
            "Folgen Sie diesen Schritten zur systematischen Fehlerdiagnose:",
            ""
        ])
        
        for step in self.troubleshooting_guide['diagnostic_steps']:
            doc.extend([
                f"### Schritt {step['step']}: {step['title']}",
                ""
            ])
            
            if 'commands' in step:
                doc.append("**Befehle:**")
                doc.append("```bash")
                for cmd in step['commands']:
                    doc.append(cmd)
                doc.append("```")
                doc.append("")
            
            if 'location' in step:
                doc.append(f"**Ort:** {step['location']}")
                doc.append("")
            
            if 'filter' in step:
                doc.append(f"**Filter:** `{step['filter']}`")
                doc.append("")
            
            if 'search_for' in step:
                doc.append("**Suchen nach:** " + ", ".join(f"`{term}`" for term in step['search_for']))
                doc.append("")
            
            doc.extend([
                f"**Erwartetes Ergebnis:** {step['expected']}",
                "",
                "---",
                ""
            ])
        
        return "\n".join(doc)
    
    def generate_complete_documentation(self, output_dir: str = "/data/documentation"):
        """Generiert vollständige technische Dokumentation"""
        import os
        
        os.makedirs(output_dir, exist_ok=True)
        
        # MQTT-Dokumentation
        mqtt_doc = self.generate_mqtt_documentation()
        with open(f"{output_dir}/mqtt_communication.md", 'w') as f:
            f.write(mqtt_doc)
        
        # Konvertierungsdokumentation
        conversion_doc = self.generate_conversion_documentation()
        with open(f"{output_dir}/data_conversion.md", 'w') as f:
            f.write(conversion_doc)
        
        # Fehlerbehebungsdokumentation
        troubleshooting_doc = self.generate_troubleshooting_documentation()
        with open(f"{output_dir}/troubleshooting.md", 'w') as f:
            f.write(troubleshooting_doc)
        
        # Übersichtsdokumentation
        overview_doc = self._generate_overview_documentation()
        with open(f"{output_dir}/README.md", 'w') as f:
            f.write(overview_doc)
        
        logger.info(f"📚 Technische Dokumentation generiert in: {output_dir}")
        
        return {
            "mqtt_communication": f"{output_dir}/mqtt_communication.md",
            "data_conversion": f"{output_dir}/data_conversion.md",
            "troubleshooting": f"{output_dir}/troubleshooting.md",
            "overview": f"{output_dir}/README.md"
        }
    
    def _generate_overview_documentation(self) -> str:
        """Generiert Übersichtsdokumentation"""
        return f"""# EHS-Sentinel Technische Dokumentation

Generiert am: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Übersicht

Diese Dokumentation erklärt die technischen Aspekte der EHS-Sentinel Integration für Samsung EHS Wärmepumpen.

## Dokumentationsstruktur

1. **[MQTT-Kommunikation](mqtt_communication.md)**
   - Topic-Struktur und Nachrichtenfluss
   - Kommunikationsbeispiele
   - SET/STATE-Zyklen

2. **[Datenkonvertierung](data_conversion.md)**
   - Temperatur-, Leistungs- und Enum-Konvertierung
   - NASA-Protokoll Datenformate
   - Beispiele mit Hex-Werten

3. **[Fehlerbehebung](troubleshooting.md)**
   - Häufige Probleme und Lösungen
   - Systematische Diagnose-Schritte
   - MQTT und Kommunikationsfehler

## Schnellreferenz

### Wichtige MQTT-Topics

- **Steuerung:** `ehsSentinel/entity/{{SENSOR_NAME}}/set`
- **Status:** `homeassistant/{{PLATFORM}}/samsung_ehssentinel_{{SENSOR_NAME}}/state`
- **Discovery:** `homeassistant/{{PLATFORM}}/samsung_ehssentinel_{{SENSOR_NAME}}/config`

### Häufige Konvertierungen

- **Temperatur:** `Wert * 10` (23.5°C → 235)
- **Leistung:** `Wert / 8.6` (860 → 100W)
- **Enum:** String zu Zahl (HEAT → 1)

### Diagnose-Befehle

```bash
# MQTT-Nachrichten überwachen
mosquitto_sub -h localhost -t 'ehsSentinel/#'

# Sensor-Status prüfen
# Home Assistant → Entwicklertools → Zustände → Filter: samsung_ehssentinel
```

## Support

Bei Problemen konsultieren Sie die spezifischen Dokumentationsdateien oder erstellen Sie ein Issue im GitHub Repository.
"""

# Globale Instanz
tech_docs = TechnicalDocumentation()