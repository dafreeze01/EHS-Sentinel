import json
import os
from typing import Dict, Any, Optional
from CustomLogger import logger

class EHSAddonConfig:
    """
    Konfigurationsklasse für das Home Assistant Addon.
    Liest die Konfiguration aus den Addon-Optionen und unterstützt
    die dreistufige Polling-Strategie.
    """
    
    def __init__(self, config_path: str = "/data/options.json"):
        self.config_path = config_path
        self._config = self._load_config()
        
    def _load_config(self) -> Dict[str, Any]:
        """Lädt die Konfiguration aus der Addon-Optionen Datei."""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.error(f"Konfigurationsdatei nicht gefunden: {self.config_path}")
            raise
        except json.JSONDecodeError as e:
            logger.error(f"Fehler beim Parsen der Konfigurationsdatei: {e}")
            raise
    
    @property
    def verbindung(self) -> Dict[str, Any]:
        """Verbindungseinstellungen (TCP oder Serial)."""
        return self._config.get('verbindung', {})
    
    @property
    def mqtt(self) -> Dict[str, Any]:
        """MQTT Broker Einstellungen."""
        mqtt_config = self._config.get('mqtt', {})
        
        # Konvertiere deutsche Namen zu englischen für Kompatibilität
        return {
            'broker-url': mqtt_config.get('broker_url', 'core-mosquitto'),
            'broker-port': mqtt_config.get('broker_port', 1883),
            'user': mqtt_config.get('benutzer', ''),
            'password': mqtt_config.get('passwort', ''),
            'client-id': mqtt_config.get('client_id', 'ehs-sentinel'),
            'topicPrefix': mqtt_config.get('topic_prefix', 'ehsSentinel'),
            'homeAssistantAutoDiscoverTopic': 'homeassistant' if mqtt_config.get('homeassistant_discovery', True) else '',
            'useCamelCaseTopicNames': mqtt_config.get('camel_case_topics', True)
        }
    
    @property
    def allgemein(self) -> Dict[str, Any]:
        """Allgemeine Einstellungen."""
        allgemein_config = self._config.get('allgemein', {})
        
        return {
            'nasaRepositoryFile': '/app/data/NasaRepository.yml',
            'allowControl': allgemein_config.get('steuerung_erlauben', False),
            'protocolFile': allgemein_config.get('protokoll_datei') or None
        }
    
    @property
    def logging(self) -> Dict[str, Any]:
        """Logging Einstellungen."""
        logging_config = self._config.get('logging', {})
        
        return {
            'level': logging_config.get('log_level', 'INFO'),
            'deviceAdded': logging_config.get('geraet_hinzugefuegt', True),
            'messageNotFound': logging_config.get('nachricht_nicht_gefunden', False),
            'packetNotFromIndoorOutdoor': logging_config.get('paket_nicht_von_innen_aussen', False),
            'proccessedMessage': logging_config.get('verarbeitete_nachricht', False),
            'pollerMessage': logging_config.get('poller_nachricht', False),
            'controlMessage': logging_config.get('steuerungs_nachricht', False),
            'invalidPacket': logging_config.get('ungueltiges_paket', False)
        }
    
    @property
    def serial(self) -> Optional[Dict[str, Any]]:
        """Serial Verbindungseinstellungen."""
        if self.verbindung.get('typ') == 'serial':
            serial_config = self.verbindung.get('serial', {})
            return {
                'device': serial_config.get('device', '/dev/ttyUSB0'),
                'baudrate': serial_config.get('baudrate', 9600)
            }
        return None
    
    @property
    def tcp(self) -> Optional[Dict[str, Any]]:
        """TCP Verbindungseinstellungen."""
        if self.verbindung.get('typ') == 'tcp':
            tcp_config = self.verbindung.get('tcp', {})
            return {
                'ip': tcp_config.get('ip', '192.168.1.100'),
                'port': tcp_config.get('port', 4196)
            }
        return None
    
    @property
    def polling(self) -> Optional[Dict[str, Any]]:
        """
        Polling Einstellungen mit dreistufiger Strategie.
        
        Implementiert:
        - live_data: Kritische Betriebsdaten (10-15 Sekunden)
        - fsv_settings: Veränderliche Einstellungen (5-10 Minuten)
        - static_data: Statische Informationen (stündlich)
        """
        if not self._config.get('polling_aktiviert', False):
            return None
            
        # Lade Intervalle aus der Konfiguration
        intervalle = self._config.get('polling_intervalle', {})
        
        # Definiere die drei Polling-Stufen
        fetch_intervals = [
            {
                'name': 'live_data',
                'enable': True,
                'schedule': intervalle.get('basic_sensors', 15)  # 15 Sekunden Standard
            },
            {
                'name': 'fsv_settings',
                'enable': True,
                'schedule': intervalle.get('fsv_settings', 300)  # 5 Minuten Standard
            },
            {
                'name': 'static_data',
                'enable': True,
                'schedule': intervalle.get('static_data', 3600)  # 1 Stunde Standard
            }
        ]
        
        # Definiere die Sensor-Gruppen
        groups = {
            'live_data': [
                # Kritische Betriebsdaten (Temperaturen, Frequenzen, Status)
                "NASA_POWER", "NASA_INDOOR_OPMODE", "NASA_OUTDOOR_OPERATION_STATUS",
                "NASA_OUTDOOR_TW1_TEMP", "NASA_OUTDOOR_TW2_TEMP", "NASA_OUTDOOR_OUT_TEMP",
                "NASA_INDOOR_DHW_CURRENT_TEMP", "NASA_OUTDOOR_COMP1_RUN_HZ",
                "NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT", "VAR_IN_FLOW_SENSOR_CALC",
                "NASA_EHSSENTINEL_HEAT_OUTPUT", "NASA_EHSSENTINEL_COP",
                "DHW_POWER", "CONTROL_SILENCE", "NASA_OUTDOOR_DEFROST_STEP"
            ],
            'fsv_settings': [
                # Veränderliche Einstellungen (FSV-Parameter)
                "VAR_IN_TEMP_WATER_LAW_TARGET_F",
                # FSV10xx - Fernbedienung
                "VAR_IN_FSV_1011", "VAR_IN_FSV_1012", "VAR_IN_FSV_1021", "VAR_IN_FSV_1022",
                "VAR_IN_FSV_1031", "VAR_IN_FSV_1032", "VAR_IN_FSV_1041", "VAR_IN_FSV_1042",
                "VAR_IN_FSV_1051", "VAR_IN_FSV_1052",
                # FSV20xx - Wassergesetz
                "VAR_IN_FSV_2011", "VAR_IN_FSV_2012", "VAR_IN_FSV_2021", "VAR_IN_FSV_2022",
                "VAR_IN_FSV_2031", "VAR_IN_FSV_2032", "ENUM_IN_FSV_2041", "VAR_IN_FSV_2051",
                "VAR_IN_FSV_2052", "VAR_IN_FSV_2061", "VAR_IN_FSV_2062", "VAR_IN_FSV_2071",
                "VAR_IN_FSV_2072", "ENUM_IN_FSV_2081", "ENUM_IN_FSV_2091", "ENUM_IN_FSV_2092",
                # FSV30xx - Warmwasser
                "ENUM_IN_FSV_3011", "VAR_IN_FSV_3021", "VAR_IN_FSV_3022", "VAR_IN_FSV_3023",
                "ENUM_IN_FSV_3041", "ENUM_IN_FSV_3042", "VAR_IN_FSV_3043", "VAR_IN_FSV_3044",
                # FSV40xx - Heizung
                "ENUM_IN_FSV_4011", "VAR_IN_FSV_4012", "VAR_IN_FSV_4013", "ENUM_IN_FSV_4021",
                "ENUM_IN_FSV_4022", "ENUM_IN_FSV_4023", "VAR_IN_FSV_4024", "VAR_IN_FSV_4025",
                # FSV50xx - Sonstige
                "ENUM_IN_FSV_5041", "ENUM_IN_FSV_5081", "ENUM_IN_FSV_5091", "ENUM_IN_FSV_5094"
            ],
            'static_data': [
                # Statische Informationen (Gerätedaten, Grenzwerte)
                "STR_OUTDOOR_MODEL_NAME", "STR_INDOOR_MODEL_NAME", "STR_SOFTWARE_VERSION",
                "STR_FIRMWARE_VERSION", "STR_SERIAL_NUMBER", "STR_MANUFACTURE_DATE",
                "STR_INSTALLATION_DATE", "LVAR_IN_MINUTES_SINCE_INSTALLATION",
                "LVAR_IN_MINUTES_ACTIVE", "LVAR_IN_TOTAL_GENERATED_POWER",
                "NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT_ACCUM", "LVAR_IN_DHW_OPERATION_TIME"
            ]
        }
        
        return {
            'fetch_interval': fetch_intervals,
            'groups': groups
        }