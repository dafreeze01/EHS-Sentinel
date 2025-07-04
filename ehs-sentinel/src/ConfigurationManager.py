"""
Konfigurationsmanager für EHS-Sentinel Addon-UI
Verwaltet Sensor-Parameter, Polling-Intervalle und UI-Konfiguration
"""

import json
import yaml
import os
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
from datetime import datetime

from CustomLogger import logger

class ParameterType(Enum):
    """Typen von Parametern"""
    TEMPERATURE = "temperature"
    POWER = "power"
    FREQUENCY = "frequency"
    PRESSURE = "pressure"
    FLOW = "flow"
    TIME = "time"
    ENUM = "enum"
    BOOLEAN = "boolean"
    STRING = "string"

class ParameterGroup(Enum):
    """Parameter-Gruppen für die UI"""
    CRITICAL = "critical"
    IMPORTANT = "important"
    MONITORING = "monitoring"
    FSV_REMOTE = "fsv_remote"
    FSV_WATER_LAW = "fsv_water_law"
    FSV_DHW = "fsv_dhw"
    FSV_HEATING = "fsv_heating"
    FSV_MISC = "fsv_misc"
    SYSTEM_INFO = "system_info"

@dataclass
class ParameterDefinition:
    """Definition eines konfigurierbaren Parameters"""
    name: str
    group: ParameterGroup
    parameter_type: ParameterType
    description: str
    unit: str = ""
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    step: Optional[float] = None
    enum_values: Optional[List[str]] = None
    default_value: Any = None
    writable: bool = False
    polling_interval: int = 60  # Sekunden
    priority: int = 3  # 1=höchste, 5=niedrigste
    enabled: bool = True
    nasa_address: str = ""
    hass_entity_id: str = ""

@dataclass
class GroupConfiguration:
    """Konfiguration für eine Parameter-Gruppe"""
    name: str
    display_name: str
    description: str
    icon: str
    default_polling_interval: int
    priority: int
    enabled: bool = True
    parameters: List[str] = None

class ConfigurationManager:
    """
    Verwaltet die Konfiguration für das EHS-Sentinel Addon.
    Definiert verfügbare Parameter und deren Eigenschaften für die UI.
    """
    
    def __init__(self, nasa_repo_path: str = "/app/data/NasaRepository.yml"):
        self.nasa_repo_path = nasa_repo_path
        self.config_file = "/data/addon_configuration.json"
        
        # Lade NASA Repository
        self.nasa_repo = self._load_nasa_repo()
        
        # Definiere Parameter und Gruppen
        self.parameters: Dict[str, ParameterDefinition] = {}
        self.groups: Dict[str, GroupConfiguration] = {}
        
        # Initialisiere Konfiguration
        self._initialize_parameters()
        self._initialize_groups()
        
        # Lade gespeicherte Konfiguration
        self._load_saved_configuration()
    
    def _load_nasa_repo(self) -> Dict[str, Any]:
        """Lädt das NASA Repository"""
        try:
            with open(self.nasa_repo_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Fehler beim Laden des NASA Repository: {e}")
            return {}
    
    def _initialize_parameters(self):
        """Initialisiert alle verfügbaren Parameter"""
        
        # Kritische Parameter
        critical_params = [
            ("NASA_POWER", "Wärmepumpe Ein/Aus", ParameterType.ENUM, ["OFF", "ON"]),
            ("NASA_INDOOR_OPMODE", "Betriebsmodus", ParameterType.ENUM, ["AUTO", "HEAT", "COOL", "DHW", "FAN"]),
            ("NASA_OUTDOOR_OPERATION_STATUS", "Betriebsstatus", ParameterType.ENUM, ["STOP", "HEATING", "COOLING", "DHW", "DEFROST"]),
            ("NASA_OUTDOOR_TW1_TEMP", "Rücklauftemperatur", ParameterType.TEMPERATURE, None),
            ("NASA_OUTDOOR_TW2_TEMP", "Vorlauftemperatur", ParameterType.TEMPERATURE, None),
            ("NASA_OUTDOOR_OUT_TEMP", "Außentemperatur", ParameterType.TEMPERATURE, None),
        ]
        
        for name, desc, param_type, enum_vals in critical_params:
            self._add_parameter(name, ParameterGroup.CRITICAL, param_type, desc, 
                              enum_values=enum_vals, polling_interval=15, priority=1)
        
        # Wichtige Parameter
        important_params = [
            ("NASA_INDOOR_DHW_CURRENT_TEMP", "Warmwassertemperatur", ParameterType.TEMPERATURE),
            ("NASA_OUTDOOR_COMP1_RUN_HZ", "Kompressor Istfrequenz", ParameterType.FREQUENCY),
            ("NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT", "Stromverbrauch", ParameterType.POWER),
            ("VAR_IN_FLOW_SENSOR_CALC", "Wasserdurchfluss", ParameterType.FLOW),
        ]
        
        for name, desc, param_type in important_params:
            self._add_parameter(name, ParameterGroup.IMPORTANT, param_type, desc, 
                              polling_interval=30, priority=2)
        
        # FSV 10xx - Fernbedienung
        fsv10_params = [
            ("VAR_IN_FSV_1011", "Wasser Ausgangstemperatur für Kühlung Max.", ParameterType.TEMPERATURE, 5, 25, 1),
            ("VAR_IN_FSV_1012", "Wasser Ausgangstemperatur für Kühlung Min.", ParameterType.TEMPERATURE, 5, 25, 1),
            ("VAR_IN_FSV_1021", "Raumtemperatur für Kühlung Max.", ParameterType.TEMPERATURE, 16, 32, 1),
            ("VAR_IN_FSV_1022", "Raumtemperatur für Kühlung Min.", ParameterType.TEMPERATURE, 16, 32, 1),
            ("VAR_IN_FSV_1031", "Wasser Ausgangstemperatur für Heizung Max.", ParameterType.TEMPERATURE, 25, 65, 1),
            ("VAR_IN_FSV_1032", "Wasser Ausgangstemperatur für Heizung Min.", ParameterType.TEMPERATURE, 25, 65, 1),
            ("VAR_IN_FSV_1041", "Raumtemperatur für Heizung Max.", ParameterType.TEMPERATURE, 16, 32, 1),
            ("VAR_IN_FSV_1042", "Raumtemperatur für Heizung Min.", ParameterType.TEMPERATURE, 16, 32, 1),
            ("VAR_IN_FSV_1051", "Warmwasser Tank Temperatur Max.", ParameterType.TEMPERATURE, 40, 75, 1),
            ("VAR_IN_FSV_1052", "Warmwasser Tank Temperatur Min.", ParameterType.TEMPERATURE, 40, 75, 1),
        ]
        
        for name, desc, param_type, min_val, max_val, step in fsv10_params:
            self._add_parameter(name, ParameterGroup.FSV_REMOTE, param_type, desc,
                              min_value=min_val, max_value=max_val, step=step,
                              polling_interval=300, priority=4, writable=True)
        
        # FSV 20xx - Wassergesetz
        fsv20_params = [
            ("VAR_IN_FSV_2011", "Heizung Außentemperatur für WL Max.", ParameterType.TEMPERATURE, -20, 25, 1),
            ("VAR_IN_FSV_2012", "Heizung Außentemperatur für WL Min.", ParameterType.TEMPERATURE, -20, 25, 1),
            ("ENUM_IN_FSV_2041", "Heizung WL Auswahl", ParameterType.ENUM, None, None, None, ["WL1", "WL2", "AUTO"]),
        ]
        
        for item in fsv20_params:
            if len(item) == 7:  # ENUM
                name, desc, param_type, _, _, _, enum_vals = item
                self._add_parameter(name, ParameterGroup.FSV_WATER_LAW, param_type, desc,
                                  enum_values=enum_vals, polling_interval=600, priority=4, writable=True)
            else:  # Numeric
                name, desc, param_type, min_val, max_val, step = item
                self._add_parameter(name, ParameterGroup.FSV_WATER_LAW, param_type, desc,
                                  min_value=min_val, max_value=max_val, step=step,
                                  polling_interval=600, priority=4, writable=True)
        
        # System-Informationen
        system_params = [
            ("STR_OUTDOOR_MODEL_NAME", "Außeneinheit Modellname", ParameterType.STRING),
            ("STR_INDOOR_MODEL_NAME", "Inneneinheit Modellname", ParameterType.STRING),
            ("STR_SOFTWARE_VERSION", "Software Version", ParameterType.STRING),
            ("STR_FIRMWARE_VERSION", "Firmware Version", ParameterType.STRING),
        ]
        
        for name, desc, param_type in system_params:
            self._add_parameter(name, ParameterGroup.SYSTEM_INFO, param_type, desc,
                              polling_interval=3600, priority=5)
    
    def _add_parameter(self, name: str, group: ParameterGroup, param_type: ParameterType,
                      description: str, min_value: float = None, max_value: float = None,
                      step: float = None, enum_values: List[str] = None,
                      polling_interval: int = 60, priority: int = 3, writable: bool = False):
        """Fügt einen Parameter zur Konfiguration hinzu"""
        
        # Hole zusätzliche Informationen aus NASA Repository
        unit = ""
        nasa_address = ""
        default_value = None
        
        if name in self.nasa_repo:
            repo_entry = self.nasa_repo[name]
            unit = repo_entry.get('unit', '')
            nasa_address = repo_entry.get('address', '')
            
            # Bestimme Default-Wert basierend auf Typ
            if param_type == ParameterType.ENUM and enum_values:
                default_value = enum_values[0]
            elif param_type == ParameterType.BOOLEAN:
                default_value = False
            elif param_type in [ParameterType.TEMPERATURE, ParameterType.POWER, ParameterType.FREQUENCY]:
                if min_value is not None:
                    default_value = min_value
        
        # Generiere Home Assistant Entity ID
        hass_entity_id = self._generate_entity_id(name, writable)
        
        parameter = ParameterDefinition(
            name=name,
            group=group,
            parameter_type=param_type,
            description=description,
            unit=unit,
            min_value=min_value,
            max_value=max_value,
            step=step,
            enum_values=enum_values,
            default_value=default_value,
            writable=writable,
            polling_interval=polling_interval,
            priority=priority,
            nasa_address=nasa_address,
            hass_entity_id=hass_entity_id
        )
        
        self.parameters[name] = parameter
    
    def _generate_entity_id(self, name: str, writable: bool) -> str:
        """Generiert Home Assistant Entity ID"""
        # Normalisiere Namen
        normalized = name.lower()
        for prefix in ['enum_', 'lvar_', 'nasa_', 'var_', 'str_']:
            if normalized.startswith(prefix):
                normalized = normalized[len(prefix):]
                break
        
        # Konvertiere zu CamelCase
        parts = normalized.split('_')
        if parts:
            camel_case = parts[0] + ''.join(word.capitalize() for word in parts[1:])
        else:
            camel_case = normalized
        
        # Bestimme Platform
        if writable:
            # Hier ist der Fix: Wir prüfen direkt auf den Parameter-Typ, nicht auf ein Dictionary
            if name in self.parameters:
                param = self.parameters[name]
                if param.parameter_type == ParameterType.ENUM:
                    platform = "select"
                elif param.parameter_type == ParameterType.BOOLEAN:
                    platform = "switch"
                else:
                    platform = "number"
            else:
                # Wenn der Parameter noch nicht existiert, bestimmen wir den Typ aus dem Repository
                if name in self.nasa_repo:
                    repo_entry = self.nasa_repo[name]
                    if repo_entry.get('type') == 'ENUM':
                        platform = "select"
                    elif repo_entry.get('type') == 'BOOLEAN':
                        platform = "switch"
                    else:
                        platform = "number"
                else:
                    platform = "number"  # Default
        else:
            platform = "sensor"
        
        return f"{platform}.samsung_ehssentinel_{camel_case.lower()}"
    
    def _initialize_groups(self):
        """Initialisiert Parameter-Gruppen"""
        group_definitions = [
            (ParameterGroup.CRITICAL, "Kritische Parameter", "Grundlegende Steuerung und Status", "mdi:alert-circle", 15, 1),
            (ParameterGroup.IMPORTANT, "Wichtige Parameter", "Temperaturen und Leistung", "mdi:thermometer", 30, 2),
            (ParameterGroup.MONITORING, "Überwachung", "Effizienz und Durchfluss", "mdi:chart-line", 60, 3),
            (ParameterGroup.FSV_REMOTE, "FSV 10xx - Fernbedienung", "Temperaturlimits und Grundeinstellungen", "mdi:remote", 300, 4),
            (ParameterGroup.FSV_WATER_LAW, "FSV 20xx - Wassergesetz", "Heizkurven und Wassertemperaturen", "mdi:chart-bell-curve", 600, 4),
            (ParameterGroup.FSV_DHW, "FSV 30xx - Warmwasser", "Warmwassereinstellungen", "mdi:water-boiler", 900, 4),
            (ParameterGroup.FSV_HEATING, "FSV 40xx - Heizung", "Heizungsparameter", "mdi:radiator", 1200, 4),
            (ParameterGroup.FSV_MISC, "FSV 50xx - Sonstige", "Smart Grid und PV-Steuerung", "mdi:cog", 1800, 5),
            (ParameterGroup.SYSTEM_INFO, "System-Informationen", "Gerätedaten und Versionen", "mdi:information", 3600, 5),
        ]
        
        for group_enum, display_name, description, icon, interval, priority in group_definitions:
            # Sammle Parameter für diese Gruppe
            group_parameters = [
                name for name, param in self.parameters.items() 
                if param.group == group_enum
            ]
            
            group_config = GroupConfiguration(
                name=group_enum.value,
                display_name=display_name,
                description=description,
                icon=icon,
                default_polling_interval=interval,
                priority=priority,
                parameters=group_parameters
            )
            
            self.groups[group_enum.value] = group_config
    
    def get_addon_ui_config(self) -> Dict[str, Any]:
        """Generiert Konfiguration für die Addon-UI"""
        ui_config = {
            "version": "1.0.0",
            "title": "EHS-Sentinel Konfiguration",
            "description": "Erweiterte Konfiguration für Samsung EHS Wärmepumpen-Integration",
            "groups": {},
            "parameters": {}
        }
        
        # Gruppen-Konfiguration
        for group_name, group_config in self.groups.items():
            ui_config["groups"][group_name] = {
                "display_name": group_config.display_name,
                "description": group_config.description,
                "icon": group_config.icon,
                "default_polling_interval": group_config.default_polling_interval,
                "priority": group_config.priority,
                "enabled": group_config.enabled,
                "parameter_count": len(group_config.parameters)
            }
        
        # Parameter-Konfiguration
        for param_name, param_config in self.parameters.items():
            ui_param = {
                "name": param_name,
                "display_name": param_config.description,
                "group": param_config.group.value,
                "type": param_config.parameter_type.value,
                "unit": param_config.unit,
                "writable": param_config.writable,
                "polling_interval": param_config.polling_interval,
                "priority": param_config.priority,
                "enabled": param_config.enabled,
                "hass_entity_id": param_config.hass_entity_id,
                "nasa_address": param_config.nasa_address
            }
            
            # Typ-spezifische Eigenschaften
            if param_config.parameter_type == ParameterType.ENUM:
                ui_param["enum_values"] = param_config.enum_values
                ui_param["default_value"] = param_config.default_value
            elif param_config.parameter_type in [ParameterType.TEMPERATURE, ParameterType.POWER, ParameterType.FREQUENCY]:
                ui_param["min_value"] = param_config.min_value
                ui_param["max_value"] = param_config.max_value
                ui_param["step"] = param_config.step
                ui_param["default_value"] = param_config.default_value
            elif param_config.parameter_type == ParameterType.BOOLEAN:
                ui_param["default_value"] = param_config.default_value
            
            ui_config["parameters"][param_name] = ui_param
        
        return ui_config
    
    def get_polling_configuration(self) -> Dict[str, Any]:
        """Generiert Polling-Konfiguration für das Addon"""
        polling_config = {
            "fetch_interval": [],
            "groups": {}
        }
        
        # Erstelle Intervall-Definitionen
        for group_name, group_config in self.groups.items():
            if group_config.enabled and group_config.parameters:
                polling_config["fetch_interval"].append({
                    "name": group_name,
                    "enable": True,
                    "schedule": f"{group_config.default_polling_interval}s"
                })
                
                # Nur aktivierte Parameter hinzufügen
                enabled_params = [
                    param_name for param_name in group_config.parameters
                    if self.parameters[param_name].enabled
                ]
                
                polling_config["groups"][group_name] = enabled_params
        
        return polling_config
    
    def update_parameter_config(self, parameter_name: str, updates: Dict[str, Any]) -> bool:
        """Aktualisiert die Konfiguration eines Parameters"""
        if parameter_name not in self.parameters:
            return False
        
        param = self.parameters[parameter_name]
        
        # Aktualisiere erlaubte Felder
        allowed_updates = ['enabled', 'polling_interval', 'priority']
        for field in allowed_updates:
            if field in updates:
                setattr(param, field, updates[field])
        
        # Speichere Konfiguration
        self._save_configuration()
        
        logger.info(f"📝 Parameter-Konfiguration aktualisiert: {parameter_name}")
        return True
    
    def update_group_config(self, group_name: str, updates: Dict[str, Any]) -> bool:
        """Aktualisiert die Konfiguration einer Gruppe"""
        if group_name not in self.groups:
            return False
        
        group = self.groups[group_name]
        
        # Aktualisiere erlaubte Felder
        allowed_updates = ['enabled', 'default_polling_interval']
        for field in allowed_updates:
            if field in updates:
                setattr(group, field, updates[field])
        
        # Aktualisiere auch alle Parameter der Gruppe
        if 'default_polling_interval' in updates:
            for param_name in group.parameters:
                if param_name in self.parameters:
                    self.parameters[param_name].polling_interval = updates['default_polling_interval']
        
        # Speichere Konfiguration
        self._save_configuration()
        
        logger.info(f"📝 Gruppen-Konfiguration aktualisiert: {group_name}")
        return True
    
    def _save_configuration(self):
        """Speichert die aktuelle Konfiguration"""
        try:
            config_data = {
                "timestamp": datetime.now().isoformat(),
                "parameters": {
                    name: {
                        "enabled": param.enabled,
                        "polling_interval": param.polling_interval,
                        "priority": param.priority
                    }
                    for name, param in self.parameters.items()
                },
                "groups": {
                    name: {
                        "enabled": group.enabled,
                        "default_polling_interval": group.default_polling_interval
                    }
                    for name, group in self.groups.items()
                }
            }
            
            with open(self.config_file, 'w') as f:
                json.dump(config_data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Fehler beim Speichern der Konfiguration: {e}")
    
    def _load_saved_configuration(self):
        """Lädt gespeicherte Konfiguration"""
        try:
            if not os.path.exists(self.config_file):
                return
            
            with open(self.config_file, 'r') as f:
                config_data = json.load(f)
            
            # Lade Parameter-Konfiguration
            for name, param_data in config_data.get("parameters", {}).items():
                if name in self.parameters:
                    param = self.parameters[name]
                    param.enabled = param_data.get("enabled", param.enabled)
                    param.polling_interval = param_data.get("polling_interval", param.polling_interval)
                    param.priority = param_data.get("priority", param.priority)
            
            # Lade Gruppen-Konfiguration
            for name, group_data in config_data.get("groups", {}).items():
                if name in self.groups:
                    group = self.groups[name]
                    group.enabled = group_data.get("enabled", group.enabled)
                    group.default_polling_interval = group_data.get("default_polling_interval", group.default_polling_interval)
            
            logger.info(f"📝 Gespeicherte Konfiguration geladen")
            
        except Exception as e:
            logger.error(f"Fehler beim Laden der gespeicherten Konfiguration: {e}")

# Globale Instanz
config_manager = ConfigurationManager()