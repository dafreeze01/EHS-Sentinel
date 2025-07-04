"""
Sensor-Monitoring System für EHS-Sentinel
Überwacht Sensor-Status, Kommunikation und Datenqualität
"""

import asyncio
import json
import os
import time
import logging
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum

from CustomLogger import logger
from EHSConfig import EHSConfig

class SensorStatus(Enum):
    """Status-Enum für Sensoren"""
    ACTIVE = "active"
    UNKNOWN = "unknown"
    ERROR = "error"
    TIMEOUT = "timeout"
    CRC_ERROR = "crc_error"
    OFFLINE = "offline"

class ErrorType(Enum):
    """Fehlertypen für Sensor-Kommunikation"""
    CRC_MISMATCH = "crc_mismatch"
    TIMEOUT = "timeout"
    INVALID_RESPONSE = "invalid_response"
    CONVERSION_ERROR = "conversion_error"
    MQTT_ERROR = "mqtt_error"
    COMMUNICATION_LOST = "communication_lost"

@dataclass
class SensorReading:
    """Datenklasse für Sensor-Messwerte"""
    sensor_name: str
    raw_value: bytes
    converted_value: Any
    timestamp: datetime
    status: SensorStatus
    error_type: Optional[ErrorType] = None
    error_message: Optional[str] = None
    mqtt_topic: Optional[str] = None
    response_time_ms: Optional[float] = None

@dataclass
class SensorConfig:
    """Konfiguration für einen Sensor"""
    name: str
    group: str
    polling_interval: int  # Sekunden
    priority: int  # 1=hoch, 5=niedrig
    enabled: bool = True
    timeout: int = 5  # Sekunden
    retry_count: int = 3
    description: str = ""
    unit: str = ""
    writable: bool = False

class SensorMonitor:
    """
    Überwacht alle Sensoren und deren Kommunikation.
    Protokolliert Fehler, Status und Datenqualität.
    """
    
    def __init__(self):
        self.config = EHSConfig()
        self.sensors: Dict[str, SensorConfig] = {}
        self.readings: Dict[str, List[SensorReading]] = {}
        self.status_cache: Dict[str, SensorStatus] = {}
        self.error_counts: Dict[str, Dict[ErrorType, int]] = {}
        self.last_successful: Dict[str, datetime] = {}
        
        # Konfiguration
        self.max_readings_per_sensor = 100
        self.status_file = "/data/sensor_status.json"
        self.log_file = "/data/sensor_communication.log"
        
        # Setup logging
        self._setup_sensor_logging()
        
        # Lade Sensor-Konfigurationen
        self._load_sensor_configs()
        
        # Initialisiere Monitoring
        self._initialize_monitoring()
    
    def _setup_sensor_logging(self):
        """Richtet spezifisches Logging für Sensor-Kommunikation ein"""
        self.sensor_logger = logging.getLogger('sensor_communication')
        self.sensor_logger.setLevel(logging.DEBUG)
        
        # File Handler für detaillierte Logs
        file_handler = logging.FileHandler(self.log_file)
        file_handler.setLevel(logging.DEBUG)
        
        # Formatter für strukturierte Logs
        formatter = logging.Formatter(
            '%(asctime)s | %(levelname)-8s | %(sensor)s | %(action)s | %(details)s'
        )
        file_handler.setFormatter(formatter)
        
        self.sensor_logger.addHandler(file_handler)
    
    def _load_sensor_configs(self):
        """Lädt Sensor-Konfigurationen aus dem NASA Repository"""
        if not hasattr(self.config, 'NASA_REPO') or not self.config.NASA_REPO:
            logger.error("NASA Repository nicht verfügbar")
            return
        
        # Definiere Sensor-Gruppen mit Prioritäten
        sensor_groups = {
            'critical': {
                'priority': 1,
                'interval': 15,
                'sensors': [
                    'NASA_POWER', 'NASA_INDOOR_OPMODE', 'NASA_OUTDOOR_OPERATION_STATUS',
                    'NASA_OUTDOOR_TW1_TEMP', 'NASA_OUTDOOR_TW2_TEMP', 'NASA_OUTDOOR_OUT_TEMP'
                ]
            },
            'important': {
                'priority': 2,
                'interval': 30,
                'sensors': [
                    'NASA_INDOOR_DHW_CURRENT_TEMP', 'NASA_OUTDOOR_COMP1_RUN_HZ',
                    'NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT', 'VAR_IN_FLOW_SENSOR_CALC'
                ]
            },
            'monitoring': {
                'priority': 3,
                'interval': 60,
                'sensors': [
                    'NASA_EHSSENTINEL_HEAT_OUTPUT', 'NASA_EHSSENTINEL_COP',
                    'DHW_POWER', 'CONTROL_SILENCE'
                ]
            },
            'fsv_settings': {
                'priority': 4,
                'interval': 300,
                'sensors': [
                    'VAR_IN_TEMP_WATER_LAW_TARGET_F', 'VAR_IN_FSV_1031', 'VAR_IN_FSV_1051'
                ]
            },
            'system_info': {
                'priority': 5,
                'interval': 3600,
                'sensors': [
                    'STR_OUTDOOR_MODEL_NAME', 'STR_INDOOR_MODEL_NAME', 'STR_SOFTWARE_VERSION'
                ]
            }
        }
        
        # Erstelle Sensor-Konfigurationen
        for group_name, group_config in sensor_groups.items():
            for sensor_name in group_config['sensors']:
                if sensor_name in self.config.NASA_REPO:
                    repo_entry = self.config.NASA_REPO[sensor_name]
                    
                    sensor_config = SensorConfig(
                        name=sensor_name,
                        group=group_name,
                        polling_interval=group_config['interval'],
                        priority=group_config['priority'],
                        description=repo_entry.get('description', ''),
                        unit=repo_entry.get('unit', ''),
                        writable=repo_entry.get('hass_opts', {}).get('writable', False)
                    )
                    
                    self.sensors[sensor_name] = sensor_config
                    self.readings[sensor_name] = []
                    self.status_cache[sensor_name] = SensorStatus.UNKNOWN
                    self.error_counts[sensor_name] = {error_type: 0 for error_type in ErrorType}
        
        logger.info(f"📊 Sensor-Monitor initialisiert: {len(self.sensors)} Sensoren in {len(sensor_groups)} Gruppen")
    
    def _initialize_monitoring(self):
        """Initialisiert das Monitoring-System"""
        # Lade vorherige Status-Daten
        self._load_status_cache()
        
        # Starte Monitoring-Tasks
        asyncio.create_task(self._status_monitor_loop())
        asyncio.create_task(self._cleanup_old_readings())
        asyncio.create_task(self._generate_status_reports())
    
    def log_sensor_reading(self, sensor_name: str, raw_value: bytes, 
                          converted_value: Any, response_time_ms: float = None,
                          mqtt_topic: str = None):
        """Protokolliert eine erfolgreiche Sensor-Ablesung"""
        reading = SensorReading(
            sensor_name=sensor_name,
            raw_value=raw_value,
            converted_value=converted_value,
            timestamp=datetime.now(),
            status=SensorStatus.ACTIVE,
            mqtt_topic=mqtt_topic,
            response_time_ms=response_time_ms
        )
        
        # Füge Reading hinzu
        if sensor_name not in self.readings:
            self.readings[sensor_name] = []
        
        self.readings[sensor_name].append(reading)
        
        # Begrenze Anzahl der Readings
        if len(self.readings[sensor_name]) > self.max_readings_per_sensor:
            self.readings[sensor_name] = self.readings[sensor_name][-self.max_readings_per_sensor:]
        
        # Update Status
        self.status_cache[sensor_name] = SensorStatus.ACTIVE
        self.last_successful[sensor_name] = reading.timestamp
        
        # Detailliertes Logging
        self.sensor_logger.info(
            "Sensor reading successful",
            extra={
                'sensor': sensor_name,
                'action': 'READ_SUCCESS',
                'details': f"Value: {converted_value}, Raw: {raw_value.hex()}, Response: {response_time_ms}ms"
            }
        )
    
    def log_sensor_error(self, sensor_name: str, error_type: ErrorType, 
                        error_message: str, raw_data: bytes = None):
        """Protokolliert einen Sensor-Fehler"""
        reading = SensorReading(
            sensor_name=sensor_name,
            raw_value=raw_data or b'',
            converted_value=None,
            timestamp=datetime.now(),
            status=SensorStatus.ERROR,
            error_type=error_type,
            error_message=error_message
        )
        
        # Füge Reading hinzu
        if sensor_name not in self.readings:
            self.readings[sensor_name] = []
        
        self.readings[sensor_name].append(reading)
        
        # Update Fehler-Statistiken
        if sensor_name not in self.error_counts:
            self.error_counts[sensor_name] = {et: 0 for et in ErrorType}
        
        self.error_counts[sensor_name][error_type] += 1
        
        # Update Status
        if error_type == ErrorType.TIMEOUT:
            self.status_cache[sensor_name] = SensorStatus.TIMEOUT
        elif error_type == ErrorType.CRC_MISMATCH:
            self.status_cache[sensor_name] = SensorStatus.CRC_ERROR
        else:
            self.status_cache[sensor_name] = SensorStatus.ERROR
        
        # Detailliertes Logging
        self.sensor_logger.error(
            "Sensor error occurred",
            extra={
                'sensor': sensor_name,
                'action': f'ERROR_{error_type.value.upper()}',
                'details': f"Message: {error_message}, Raw: {raw_data.hex() if raw_data else 'None'}"
            }
        )
        
        # Warnung bei kritischen Sensoren
        if sensor_name in self.sensors and self.sensors[sensor_name].priority <= 2:
            logger.warning(f"🚨 Kritischer Sensor {sensor_name} hat Fehler: {error_message}")
    
    def log_mqtt_communication(self, sensor_name: str, action: str, 
                              topic: str, payload: Any, success: bool = True):
        """Protokolliert MQTT-Kommunikation"""
        action_type = f"MQTT_{action.upper()}"
        
        if success:
            self.sensor_logger.info(
                "MQTT communication",
                extra={
                    'sensor': sensor_name,
                    'action': action_type,
                    'details': f"Topic: {topic}, Payload: {payload}"
                }
            )
        else:
            self.sensor_logger.error(
                "MQTT communication failed",
                extra={
                    'sensor': sensor_name,
                    'action': f"{action_type}_FAILED",
                    'details': f"Topic: {topic}, Payload: {payload}"
                }
            )
            
            # Protokolliere als Fehler
            self.log_sensor_error(sensor_name, ErrorType.MQTT_ERROR, 
                                f"MQTT {action} failed for topic {topic}")
    
    def get_sensor_status(self, sensor_name: str) -> Dict[str, Any]:
        """Gibt den aktuellen Status eines Sensors zurück"""
        if sensor_name not in self.sensors:
            return {"error": "Sensor not found"}
        
        config = self.sensors[sensor_name]
        status = self.status_cache.get(sensor_name, SensorStatus.UNKNOWN)
        last_reading = None
        
        if sensor_name in self.readings and self.readings[sensor_name]:
            last_reading = self.readings[sensor_name][-1]
        
        # Berechne Statistiken
        total_readings = len(self.readings.get(sensor_name, []))
        error_count = sum(self.error_counts.get(sensor_name, {}).values())
        success_rate = ((total_readings - error_count) / total_readings * 100) if total_readings > 0 else 0
        
        return {
            "name": sensor_name,
            "status": status.value,
            "group": config.group,
            "priority": config.priority,
            "polling_interval": config.polling_interval,
            "enabled": config.enabled,
            "description": config.description,
            "unit": config.unit,
            "writable": config.writable,
            "last_reading": {
                "value": last_reading.converted_value if last_reading else None,
                "timestamp": last_reading.timestamp.isoformat() if last_reading else None,
                "response_time_ms": last_reading.response_time_ms if last_reading else None
            } if last_reading else None,
            "last_successful": self.last_successful.get(sensor_name, datetime.min).isoformat(),
            "statistics": {
                "total_readings": total_readings,
                "error_count": error_count,
                "success_rate": round(success_rate, 2),
                "error_breakdown": {et.value: count for et, count in self.error_counts.get(sensor_name, {}).items()}
            }
        }
    
    def get_group_status(self, group_name: str) -> Dict[str, Any]:
        """Gibt den Status einer Sensor-Gruppe zurück"""
        group_sensors = [name for name, config in self.sensors.items() if config.group == group_name]
        
        if not group_sensors:
            return {"error": "Group not found"}
        
        # Sammle Gruppen-Statistiken
        total_sensors = len(group_sensors)
        active_sensors = sum(1 for name in group_sensors if self.status_cache.get(name) == SensorStatus.ACTIVE)
        error_sensors = sum(1 for name in group_sensors if self.status_cache.get(name) in [SensorStatus.ERROR, SensorStatus.CRC_ERROR])
        
        return {
            "group": group_name,
            "total_sensors": total_sensors,
            "active_sensors": active_sensors,
            "error_sensors": error_sensors,
            "health_percentage": round((active_sensors / total_sensors * 100), 2),
            "sensors": [self.get_sensor_status(name) for name in group_sensors]
        }
    
    def get_system_overview(self) -> Dict[str, Any]:
        """Gibt eine Systemübersicht zurück"""
        all_groups = set(config.group for config in self.sensors.values())
        
        system_stats = {
            "total_sensors": len(self.sensors),
            "active_sensors": sum(1 for status in self.status_cache.values() if status == SensorStatus.ACTIVE),
            "error_sensors": sum(1 for status in self.status_cache.values() if status in [SensorStatus.ERROR, SensorStatus.CRC_ERROR]),
            "unknown_sensors": sum(1 for status in self.status_cache.values() if status == SensorStatus.UNKNOWN),
            "groups": {}
        }
        
        for group in all_groups:
            system_stats["groups"][group] = self.get_group_status(group)
        
        # Berechne Gesamt-Gesundheit
        if system_stats["total_sensors"] > 0:
            system_stats["overall_health"] = round(
                (system_stats["active_sensors"] / system_stats["total_sensors"] * 100), 2
            )
        else:
            system_stats["overall_health"] = 0
        
        return system_stats
    
    async def _status_monitor_loop(self):
        """Überwacht kontinuierlich den Sensor-Status"""
        while True:
            try:
                current_time = datetime.now()
                
                # Prüfe Timeouts
                for sensor_name, config in self.sensors.items():
                    if not config.enabled:
                        continue
                    
                    last_success = self.last_successful.get(sensor_name, datetime.min)
                    timeout_threshold = current_time - timedelta(seconds=config.timeout * 3)
                    
                    if last_success < timeout_threshold and self.status_cache.get(sensor_name) == SensorStatus.ACTIVE:
                        self.status_cache[sensor_name] = SensorStatus.TIMEOUT
                        logger.warning(f"⏰ Sensor {sensor_name} Timeout - keine Daten seit {last_success}")
                
                # Speichere Status
                self._save_status_cache()
                
                await asyncio.sleep(30)  # Prüfe alle 30 Sekunden
                
            except Exception as e:
                logger.error(f"Fehler im Status-Monitor: {e}")
                await asyncio.sleep(60)
    
    async def _cleanup_old_readings(self):
        """Bereinigt alte Readings"""
        while True:
            try:
                cutoff_time = datetime.now() - timedelta(hours=24)
                
                for sensor_name in self.readings:
                    # Behalte nur Readings der letzten 24 Stunden
                    self.readings[sensor_name] = [
                        reading for reading in self.readings[sensor_name]
                        if reading.timestamp > cutoff_time
                    ]
                
                await asyncio.sleep(3600)  # Bereinige stündlich
                
            except Exception as e:
                logger.error(f"Fehler bei Readings-Bereinigung: {e}")
                await asyncio.sleep(3600)
    
    async def _generate_status_reports(self):
        """Generiert regelmäßige Status-Berichte"""
        while True:
            try:
                await asyncio.sleep(3600)  # Stündliche Berichte
                
                overview = self.get_system_overview()
                
                if overview["overall_health"] < 80:
                    logger.warning(f"🚨 System-Gesundheit niedrig: {overview['overall_health']}%")
                    logger.warning(f"   Aktive Sensoren: {overview['active_sensors']}/{overview['total_sensors']}")
                    logger.warning(f"   Fehlerhafte Sensoren: {overview['error_sensors']}")
                
                # Detaillierter Bericht alle 6 Stunden
                if datetime.now().hour % 6 == 0:
                    self._log_detailed_report(overview)
                
            except Exception as e:
                logger.error(f"Fehler bei Status-Bericht: {e}")
                await asyncio.sleep(3600)
    
    def _log_detailed_report(self, overview: Dict[str, Any]):
        """Protokolliert einen detaillierten Status-Bericht"""
        logger.info("📊 Detaillierter Sensor-Status-Bericht:")
        logger.info(f"   Gesamt-Gesundheit: {overview['overall_health']}%")
        
        for group_name, group_data in overview["groups"].items():
            logger.info(f"   Gruppe '{group_name}': {group_data['health_percentage']}% ({group_data['active_sensors']}/{group_data['total_sensors']})")
            
            # Zeige fehlerhafte Sensoren
            error_sensors = [s for s in group_data["sensors"] if s["status"] in ["error", "crc_error", "timeout"]]
            if error_sensors:
                for sensor in error_sensors:
                    logger.warning(f"     ❌ {sensor['name']}: {sensor['status']}")
    
    def _save_status_cache(self):
        """Speichert den Status-Cache"""
        try:
            status_data = {
                "timestamp": datetime.now().isoformat(),
                "sensors": {
                    name: {
                        "status": status.value,
                        "last_successful": self.last_successful.get(name, datetime.min).isoformat(),
                        "error_counts": {et.value: count for et, count in self.error_counts.get(name, {}).items()}
                    }
                    for name, status in self.status_cache.items()
                }
            }
            
            with open(self.status_file, 'w') as f:
                json.dump(status_data, f, indent=2)
                
        except Exception as e:
            logger.error(f"Fehler beim Speichern des Status-Cache: {e}")
    
    def _load_status_cache(self):
        """Lädt den Status-Cache"""
        try:
            if not os.path.exists(self.status_file):
                return
            
            with open(self.status_file, 'r') as f:
                status_data = json.load(f)
            
            for name, data in status_data.get("sensors", {}).items():
                if name in self.sensors:
                    self.status_cache[name] = SensorStatus(data["status"])
                    
                    # Lade letzte erfolgreiche Zeit
                    try:
                        self.last_successful[name] = datetime.fromisoformat(data["last_successful"])
                    except:
                        self.last_successful[name] = datetime.min
                    
                    # Lade Fehler-Counts
                    error_counts = {}
                    for et_str, count in data.get("error_counts", {}).items():
                        try:
                            error_counts[ErrorType(et_str)] = count
                        except ValueError:
                            pass
                    self.error_counts[name] = error_counts
            
            logger.info(f"📊 Status-Cache geladen: {len(status_data.get('sensors', {}))} Sensoren")
            
        except Exception as e:
            logger.error(f"Fehler beim Laden des Status-Cache: {e}")

# Globale Instanz
sensor_monitor = SensorMonitor()