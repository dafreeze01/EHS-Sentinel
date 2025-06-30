import json
import os
from typing import Dict, Any, Optional
from CustomLogger import logger

class AddonConfig:
    """
    Konfigurationsklasse für das Home Assistant Addon.
    Liest die Konfiguration aus den Addon-Optionen.
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
        """Polling Einstellungen."""
        polling_config = self._config.get('polling', {})
        
        if not polling_config.get('aktiviert', False):
            return None
            
        # Konvertiere Intervalle
        fetch_intervals = []
        for interval in polling_config.get('intervalle', []):
            fetch_intervals.append({
                'name': interval.get('name'),
                'enable': interval.get('aktiviert', False),
                'schedule': interval.get('zeitplan', '30m')
            })
        
        # Standard Gruppen (können später konfigurierbar gemacht werden)
        groups = {
            'fsv10xx': [
                'VAR_IN_FSV_1011', 'VAR_IN_FSV_1012', 'VAR_IN_FSV_1021', 'VAR_IN_FSV_1022',
                'VAR_IN_FSV_1031', 'VAR_IN_FSV_1032', 'VAR_IN_FSV_1041', 'VAR_IN_FSV_1042',
                'VAR_IN_FSV_1051', 'VAR_IN_FSV_1052'
            ],
            'fsv20xx': [
                'VAR_IN_FSV_2011', 'VAR_IN_FSV_2012', 'VAR_IN_FSV_2021', 'VAR_IN_FSV_2022',
                'VAR_IN_FSV_2031', 'VAR_IN_FSV_2032', 'ENUM_IN_FSV_2041', 'VAR_IN_FSV_2051',
                'VAR_IN_FSV_2052', 'VAR_IN_FSV_2061', 'VAR_IN_FSV_2062', 'VAR_IN_FSV_2071',
                'VAR_IN_FSV_2072', 'ENUM_IN_FSV_2081', 'ENUM_IN_FSV_2091', 'ENUM_IN_FSV_2092',
                'ENUM_IN_FSV_2093', 'ENUM_IN_FSV_2094'
            ],
            'fsv30xx': [
                'ENUM_IN_FSV_3011', 'VAR_IN_FSV_3021', 'VAR_IN_FSV_3022', 'VAR_IN_FSV_3023',
                'VAR_IN_FSV_3024', 'VAR_IN_FSV_3025', 'VAR_IN_FSV_3026', 'ENUM_IN_FSV_3031',
                'VAR_IN_FSV_3032', 'VAR_IN_FSV_3033', 'ENUM_IN_FSV_3041', 'ENUM_IN_FSV_3042',
                'VAR_IN_FSV_3043', 'VAR_IN_FSV_3044', 'VAR_IN_FSV_3045', 'VAR_IN_FSV_3046',
                'ENUM_IN_FSV_3051', 'VAR_IN_FSV_3052', 'ENUM_IN_FSV_3061', 'ENUM_IN_FSV_3071',
                'VAR_IN_FSV_3081', 'VAR_IN_FSV_3082', 'VAR_IN_FSV_3083'
            ],
            'fsv40xx': [
                'ENUM_IN_FSV_4011', 'VAR_IN_FSV_4012', 'VAR_IN_FSV_4013', 'ENUM_IN_FSV_4021',
                'ENUM_IN_FSV_4022', 'ENUM_IN_FSV_4023', 'VAR_IN_FSV_4024', 'VAR_IN_FSV_4025',
                'ENUM_IN_FSV_4031', 'ENUM_IN_FSV_4032', 'VAR_IN_FSV_4033', 'ENUM_IN_FSV_4041',
                'VAR_IN_FSV_4042', 'VAR_IN_FSV_4043', 'ENUM_IN_FSV_4044', 'VAR_IN_FSV_4045',
                'VAR_IN_FSV_4046', 'ENUM_IN_FSV_4051', 'VAR_IN_FSV_4052', 'ENUM_IN_FSV_4053',
                'ENUM_IN_FSV_4061'
            ],
            'fsv50xx': [
                'VAR_IN_FSV_5011', 'VAR_IN_FSV_5012', 'VAR_IN_FSV_5013', 'VAR_IN_FSV_5014',
                'VAR_IN_FSV_5015', 'VAR_IN_FSV_5016', 'VAR_IN_FSV_5017', 'VAR_IN_FSV_5018',
                'VAR_IN_FSV_5019', 'VAR_IN_FSV_5021', 'VAR_IN_FSV_5031', 'ENUM_IN_FSV_5022',
                'VAR_IN_FSV_5023', 'ENUM_IN_FSV_5041', 'ENUM_IN_FSV_5042', 'ENUM_IN_FSV_5043',
                'ENUM_IN_FSV_5051', 'ENUM_IN_FSV_5061', 'ENUM_IN_FSV_5081', 'VAR_IN_FSV_5082',
                'VAR_IN_FSV_5083', 'ENUM_IN_FSV_5091', 'VAR_IN_FSV_5092', 'VAR_IN_FSV_5093',
                'ENUM_IN_FSV_5094'
            ]
        }
        
        return {
            'fetch_interval': fetch_intervals,
            'groups': groups
        }