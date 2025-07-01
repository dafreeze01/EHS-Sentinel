import asyncio
import json
import os
import time
import traceback
from datetime import datetime
from typing import Dict, List, Optional

from CustomLogger import logger
from EHSConfig import EHSConfig
from MessageProducer import MessageProducer

class PollingManager:
    """
    Verwaltet die dreistufige Polling-Strategie für EHS-Sentinel.
    
    Stufen:
    1. live_data: Kritische Betriebsdaten alle 10-15 Sekunden
    2. fsv_settings: Veränderliche Einstellungen alle 5-10 Minuten
    3. static_data: Statische Informationen maximal stündlich
    """
    
    _instance = None
    _initialized = False
    _producer = None
    _config = None
    _polling_groups = {}
    _polling_tasks = {}
    _stats_file = "/data/polling_stats.json"
    _stats = {
        "last_run": {},
        "success_count": {},
        "error_count": {},
        "total_polls": 0
    }
    
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(PollingManager, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self._config = EHSConfig()
        
        # Lade vorhandene Statistiken, falls vorhanden
        self._load_stats()
        
        # Definiere die Polling-Gruppen
        self._define_polling_groups()
        
    def _load_stats(self):
        """Lädt Polling-Statistiken aus der Datei, falls vorhanden."""
        try:
            if os.path.exists(self._stats_file):
                with open(self._stats_file, 'r') as f:
                    self._stats = json.load(f)
                logger.debug(f"Polling-Statistiken geladen: {self._stats}")
            else:
                logger.info("📊 Keine vorhandenen Polling-Statistiken gefunden, starte neue Aufzeichnung")
        except Exception as e:
            logger.warning(f"Fehler beim Laden der Polling-Statistiken: {e}")
    
    def _save_stats(self):
        """Speichert Polling-Statistiken in eine Datei."""
        try:
            with open(self._stats_file, 'w') as f:
                json.dump(self._stats, f, indent=2)
        except Exception as e:
            logger.warning(f"Fehler beim Speichern der Polling-Statistiken: {e}")
    
    def _define_polling_groups(self):
        """Definiert die drei Polling-Gruppen mit ihren Sensoren."""
        # Gruppe 1: Kritische Betriebsdaten (alle 15 Sekunden)
        self._polling_groups["live_data"] = {
            "interval": 15,  # Sekunden
            "sensors": [
                "NASA_POWER",                          # Ein/Aus Status
                "NASA_INDOOR_OPMODE",                  # Betriebsmodus
                "NASA_OUTDOOR_OPERATION_STATUS",       # Betriebsstatus
                "NASA_OUTDOOR_TW1_TEMP",               # Rücklauftemperatur
                "NASA_OUTDOOR_TW2_TEMP",               # Vorlauftemperatur
                "NASA_OUTDOOR_OUT_TEMP",               # Außentemperatur
                "NASA_INDOOR_DHW_CURRENT_TEMP",        # Warmwassertemperatur
                "NASA_OUTDOOR_COMP1_RUN_HZ",           # Kompressor Istfrequenz
                "NASA_OUTDOOR_COMP1_TARGET_HZ",        # Kompressor Zielfrequenz
                "NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT", # Aktuelle Leistungsaufnahme
                "VAR_IN_FLOW_SENSOR_CALC",             # Wasserdurchfluss
                "NASA_EHSSENTINEL_HEAT_OUTPUT",        # Berechnete Heizleistung
                "NASA_EHSSENTINEL_COP",                # Berechneter COP
                "CONTROL_SILENCE",                     # Leiser Modus
                "DHW_POWER"                            # Warmwasser Ein/Aus
            ]
        }
        
        # Gruppe 2: Veränderliche Einstellungen (alle 5 Minuten)
        self._polling_groups["fsv_settings"] = {
            "interval": 300,  # Sekunden (5 Minuten)
            "sensors": [
                # FSV 10xx - Fernbedienung
                "VAR_IN_FSV_1011", "VAR_IN_FSV_1012", "VAR_IN_FSV_1021", "VAR_IN_FSV_1022",
                "VAR_IN_FSV_1031", "VAR_IN_FSV_1032", "VAR_IN_FSV_1041", "VAR_IN_FSV_1042",
                "VAR_IN_FSV_1051", "VAR_IN_FSV_1052",
                
                # FSV 20xx - Wassergesetz
                "VAR_IN_FSV_2011", "VAR_IN_FSV_2012", "VAR_IN_FSV_2021", "VAR_IN_FSV_2022",
                "VAR_IN_FSV_2031", "VAR_IN_FSV_2032", "ENUM_IN_FSV_2041", "VAR_IN_FSV_2051",
                "VAR_IN_FSV_2052", "VAR_IN_FSV_2061", "VAR_IN_FSV_2062", "VAR_IN_FSV_2071",
                "VAR_IN_FSV_2072", "ENUM_IN_FSV_2081", "ENUM_IN_FSV_2091", "ENUM_IN_FSV_2092",
                
                # FSV 30xx - Warmwasser
                "ENUM_IN_FSV_3011", "VAR_IN_FSV_3021", "VAR_IN_FSV_3022", "VAR_IN_FSV_3023",
                
                # FSV 40xx - Heizung
                "ENUM_IN_FSV_4011", "VAR_IN_FSV_4012", "VAR_IN_FSV_4013", "ENUM_IN_FSV_4021",
                "ENUM_IN_FSV_4022", "ENUM_IN_FSV_4023", "VAR_IN_FSV_4024", "ENUM_IN_FSV_4031",
                "VAR_IN_FSV_4043", "VAR_IN_FSV_4046", "ENUM_IN_FSV_4051",
                
                # FSV 50xx - Sonstiges
                "VAR_IN_FSV_5011", "VAR_IN_FSV_5012", "VAR_IN_FSV_5013", "VAR_IN_FSV_5014",
                "ENUM_IN_FSV_5022", "ENUM_IN_FSV_5041", "ENUM_IN_FSV_5051", "ENUM_IN_FSV_5061"
            ]
        }
        
        # Gruppe 3: Statische Informationen (stündlich)
        self._polling_groups["static_data"] = {
            "interval": 3600,  # Sekunden (1 Stunde)
            "sensors": [
                "STR_INDOOR_MODEL_NAME",               # Inneneinheit Modellname
                "STR_OUTDOOR_MODEL_NAME",              # Außeneinheit Modellname
                "STR_SERIAL_NUMBER",                   # Seriennummer
                "STR_MANUFACTURE_DATE",                # Herstellungsdatum
                "STR_INSTALLATION_DATE",               # Installationsdatum
                "STR_SOFTWARE_VERSION",                # Software Version
                "STR_FIRMWARE_VERSION",                # Firmware Version
                "LVAR_IN_MINUTES_SINCE_INSTALLATION",  # Minuten seit Installation
                "LVAR_IN_MINUTES_ACTIVE",              # Aktive Minuten
                "LVAR_IN_TOTAL_GENERATED_POWER",       # Gesamt erzeugte Energie
                "NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT_ACCUM", # Gesamte verbrauchte Energie
                "LVAR_IN_DHW_OPERATION_TIME"           # Warmwasser Betriebszeit
            ]
        }
    
    def set_message_producer(self, producer: MessageProducer):
        """Setzt den MessageProducer für das Polling."""
        self._producer = producer
        logger.info(f"🔄 PollingManager hat MessageProducer erhalten: {'✅ Verfügbar' if producer else '❌ Nicht verfügbar'}")
    
    def validate_polling_groups(self) -> bool:
        """Validiert alle Polling-Gruppen gegen das NASA Repository."""
        valid = True
        
        for group_name, group_data in self._polling_groups.items():
            valid_sensors = []
            for sensor in group_data["sensors"]:
                if sensor in self._config.NASA_REPO:
                    valid_sensors.append(sensor)
                else:
                    logger.warning(f"⚠️ Sensor {sensor} in Gruppe {group_name} nicht im NASA Repository gefunden")
            
            # Aktualisiere die Liste der gültigen Sensoren
            self._polling_groups[group_name]["sensors"] = valid_sensors
            logger.info(f"✅ Polling-Gruppe '{group_name}' validiert: {len(valid_sensors)} gültige Sensoren")
        
        return valid
    
    async def start_polling(self):
        """Startet das dreistufige Polling-System."""
        if not self._producer:
            logger.error("❌ Kann Polling nicht starten - kein MessageProducer verfügbar")
            return
        
        # Validiere die Polling-Gruppen
        self.validate_polling_groups()
        
        logger.info("🚀 Starte dreistufiges Polling-System...")
        
        # Starte die Polling-Tasks für jede Gruppe
        for group_name, group_data in self._polling_groups.items():
            interval = group_data["interval"]
            sensors = group_data["sensors"]
            
            if not sensors:
                logger.warning(f"⚠️ Keine gültigen Sensoren in Gruppe {group_name} - überspringe")
                continue
            
            logger.info(f"🔄 Starte Polling für Gruppe '{group_name}' alle {interval} Sekunden ({len(sensors)} Sensoren)")
            
            # Starte den Polling-Task mit zufälliger Verzögerung (0-5 Sekunden)
            # um die Last zu verteilen
            delay = 0.1 * len(self._polling_tasks)
            self._polling_tasks[group_name] = asyncio.create_task(
                self._poll_group(group_name, sensors, interval, delay)
            )
    
    async def _poll_group(self, group_name: str, sensors: List[str], interval: int, initial_delay: float = 0):
        """Führt das Polling für eine Gruppe in regelmäßigen Abständen durch."""
        # Initiale Verzögerung
        if initial_delay > 0:
            await asyncio.sleep(initial_delay)
        
        while True:
            try:
                start_time = time.time()
                
                # Führe das Polling durch
                await self._producer.read_request(sensors)
                
                # Aktualisiere Statistiken
                self._stats["total_polls"] += 1
                self._stats["last_run"][group_name] = datetime.now().isoformat()
                
                if group_name not in self._stats["success_count"]:
                    self._stats["success_count"][group_name] = 0
                self._stats["success_count"][group_name] += 1
                
                # Speichere Statistiken alle 10 erfolgreichen Polls
                if self._stats["total_polls"] % 10 == 0:
                    self._save_stats()
                
                logger.info(f"✅ Polling für Gruppe '{group_name}' abgeschlossen ({len(sensors)} Sensoren)")
                
                # Berechne die verbleibende Zeit bis zum nächsten Polling
                elapsed = time.time() - start_time
                sleep_time = max(0.1, interval - elapsed)
                
                await asyncio.sleep(sleep_time)
                
            except Exception as e:
                # Fehlerbehandlung
                if group_name not in self._stats["error_count"]:
                    self._stats["error_count"][group_name] = 0
                self._stats["error_count"][group_name] += 1
                
                logger.error(f"❌ Fehler beim Polling für Gruppe '{group_name}': {e}")
                logger.error(traceback.format_exc())
                
                # Bei Fehlern kurz warten und dann fortsetzen
                await asyncio.sleep(5)
    
    def get_polling_stats(self) -> Dict:
        """Gibt die aktuellen Polling-Statistiken zurück."""
        return self._stats
    
    def get_polling_groups(self) -> Dict:
        """Gibt die konfigurierten Polling-Gruppen zurück."""
        return self._polling_groups