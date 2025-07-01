from EHSExceptions import ConfigException
from EHSArguments import EHSArguments
import yaml
import os
import re
import json
import logging

from CustomLogger import logger

class EHSConfig():
    """
    Singleton class to handle the configuration for the EHS Sentinel application.
    Modified for Home Assistant Addon support with comprehensive sensor polling.
    """

    _instance = None
    MQTT = None
    GENERAL = None
    SERIAL = None
    TCP = None
    NASA_REPO = None
    LOGGING = {}
    POLLING = None
    NASA_VAL_STORE = {}

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(EHSConfig, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, *args, **kwargs):
        if self._initialized:
            return
        self._initialized = True
        super().__init__(*args, **kwargs)

        logger.debug("init EHSConfig")
        self.args = EHSArguments()

        if self.args.ADDON_CONFIG:
            # Generate config from Home Assistant Addon options
            self._generate_config_from_addon()
        else:
            # Load from traditional config file
            with open(self.args.CONFIGFILE, mode='r') as file:
                config = yaml.safe_load(file)
                self._load_config(config)

        self.validate()

    def _generate_config_from_addon(self):
        """Generate configuration from Home Assistant Addon options"""
        addon_config = self.args.ADDON_CONFIG
        
        config = {
            'general': {
                'nasaRepositoryFile': '/app/data/NasaRepository.yml',
                'allowControl': addon_config.get('steuerung_erlauben', False)
            },
            'mqtt': {
                'broker-url': addon_config.get('mqtt_broker_url', 'core-mosquitto'),
                'broker-port': addon_config.get('mqtt_broker_port', 1883),
                'client-id': addon_config.get('mqtt_client_id', 'ehs-sentinel'),
                'topicPrefix': addon_config.get('mqtt_topic_prefix', 'ehsSentinel'),
                'homeAssistantAutoDiscoverTopic': 'homeassistant' if addon_config.get('mqtt_homeassistant_discovery', True) else '',
                'useCamelCaseTopicNames': addon_config.get('mqtt_camel_case_topics', True)
            },
            'logging': {
                'deviceAdded': addon_config.get('log_geraet_hinzugefuegt', True),
                'messageNotFound': addon_config.get('log_nachricht_nicht_gefunden', False),
                'packetNotFromIndoorOutdoor': addon_config.get('log_paket_nicht_von_innen_aussen', False),
                'proccessedMessage': addon_config.get('log_verarbeitete_nachricht', False),
                'pollerMessage': addon_config.get('log_poller_nachricht', False),
                'controlMessage': addon_config.get('log_steuerungs_nachricht', False),
                'invalidPacket': addon_config.get('log_ungueltiges_paket', False)
            }
        }

        # Add user/password if provided
        mqtt_user = addon_config.get('mqtt_benutzer', '')
        mqtt_pass = addon_config.get('mqtt_passwort', '')
        if mqtt_user:
            config['mqtt']['user'] = mqtt_user
        if mqtt_pass:
            config['mqtt']['password'] = mqtt_pass

        # Add protocol file if provided
        protocol_file = addon_config.get('protokoll_datei', '')
        if protocol_file:
            config['general']['protocolFile'] = protocol_file

        # Set log level
        log_level = addon_config.get('log_level', 'INFO')
        self._set_log_level(log_level)

        # Connection configuration
        connection_type = addon_config.get('verbindung_typ', 'tcp')
        if connection_type == 'tcp':
            config['tcp'] = {
                'ip': addon_config.get('tcp_ip', '192.168.1.100'),
                'port': addon_config.get('tcp_port', 4196)
            }
        else:
            config['serial'] = {
                'device': addon_config.get('serial_device', '/dev/ttyUSB0'),
                'baudrate': addon_config.get('serial_baudrate', 9600)
            }

        # Enhanced Polling configuration - Poll ALL available sensors
        if addon_config.get('polling_aktiviert', False):
            # Load NASA Repository first to get all available sensors
            nasa_repo_path = '/app/data/NasaRepository.yml'
            if os.path.isfile(nasa_repo_path):
                with open(nasa_repo_path, mode='r') as file:
                    nasa_repo = yaml.safe_load(file)
                
                # Get all sensor names from NASA Repository
                all_sensors = list(nasa_repo.keys())
                
                logger.info(f"📊 Gefunden: {len(all_sensors)} Sensoren in NASA Repository")
                logger.info(f"🔄 Konfiguriere Polling für ALLE verfügbaren Sensoren...")
                
                # Create a single group with ALL sensors
                config['polling'] = {
                    'fetch_interval': [
                        {'name': 'all_sensors', 'enable': True, 'schedule': 60}  # Poll all sensors every 60 seconds
                    ],
                    'groups': {
                        'all_sensors': all_sensors
                    }
                }
                
                logger.info(f"✅ Polling konfiguriert für {len(all_sensors)} Sensoren")
                logger.info(f"📋 Sensoren werden alle 60 Sekunden abgefragt")
            else:
                logger.warning(f"⚠️ NASA Repository nicht gefunden: {nasa_repo_path}")

        # Save generated config to file for compatibility
        with open(self.args.CONFIGFILE, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)

        self._load_config(config)

    def _set_log_level(self, level: str):
        """Set the logging level for the application"""
        level_map = {
            'DEBUG': logging.DEBUG,
            'INFO': logging.INFO,
            'WARNING': logging.WARNING,
            'ERROR': logging.ERROR
        }
        
        if level in level_map:
            logger.setLevel(level_map[level])
            logger.info(f"Log level set to: {level}")

    def _load_config(self, config):
        """Load configuration from config dict"""
        self.MQTT = config.get('mqtt')
        self.GENERAL = config.get('general')

        if 'tcp' in config:
            self.TCP = config.get('tcp')

        if 'serial' in config:
            self.SERIAL = config.get('serial')

        if 'logging' in config:
            self.LOGGING = config.get('logging')
        else:
            self.LOGGING = {}

        if 'polling' in config:
            self.POLLING = config.get('polling')

        logger.debug(f"Configuration loaded: {config}")
    
    def parse_time_string(self, time_str: str) -> int:
        match = re.match(r'^(\d+)([smh])$', time_str.strip(), re.IGNORECASE)
        if not match:
            raise ValueError("Invalid time format. Use '10s', '10m', or '10h'.")
        
        value, unit = int(match.group(1)), match.group(2).lower()
        
        conversion_factors = {
            's': 1,   # seconds
            'm': 60,  # minutes
            'h': 3600 # hours
        }
    
        return value * conversion_factors[unit]

    def validate(self):
        if os.path.isfile(self.GENERAL['nasaRepositoryFile']):
             with open(self.GENERAL['nasaRepositoryFile'], mode='r') as file:
                self.NASA_REPO = yaml.safe_load(file)
        else:
            raise ConfigException(argument=self.GENERAL['nasaRepositoryFile'], message="NASA Repository File is missing")

        if 'protocolFile' not in self.GENERAL:
            self.GENERAL['protocolFile'] = None

        if 'allowControl' not in self.GENERAL:
            self.GENERAL['allowControl'] = False

        if self.SERIAL is None and self.TCP is None:
            raise ConfigException(argument="", message="define tcp or serial config params")

        if self.SERIAL is not None and self.TCP is not None:
            raise ConfigException(argument="", message="you cannot define tcp and serial please define only one")

        if self.SERIAL is not None:
            if 'device' not in self.SERIAL:
                raise ConfigException(argument=self.SERIAL['device'], message="serial device config parameter is missing")
            
            if 'baudrate' not in self.SERIAL:
                raise ConfigException(argument=self.SERIAL['baudrate'], message="serial baudrate config parameter is missing")
            
        if self.TCP is not None:
            if 'ip' not in self.TCP:
                raise ConfigException(argument=self.TCP['ip'], message="tcp ip config parameter is missing")
            
            if 'port' not in self.TCP:
                raise ConfigException(argument=self.TCP['port'], message="tcp port config parameter is missing")
            
        if self.POLLING is not None:
            if 'fetch_interval' not in self.POLLING:
                raise ConfigException(argument='', message="fetch_interval in polling parameter is missing")
            
            if 'groups' not in self.POLLING:
                raise ConfigException(argument='', message="groups in polling parameter is missing")
            
            if 'fetch_interval' in self.POLLING and 'groups' in self.POLLING:
                for poller in self.POLLING['fetch_interval']:
                    if poller['name'] not in self.POLLING['groups']:
                        raise ConfigException(argument=poller['name'], message="Groupname from fetch_interval not defined in groups: ")
                    if 'schedule' in poller:
                        # Schedule is already in seconds from addon config
                        if isinstance(poller['schedule'], str):
                            try:
                                poller['schedule'] = self.parse_time_string(poller['schedule'])
                            except ValueError as e:
                                raise ConfigException(argument=poller['schedule'], message="schedule value from fetch_interval couldn't be validated, use format 10s, 10m or 10h")
                
                # Count total sensors and validate
                total_sensors = 0
                for group in self.POLLING['groups']:
                    valid_sensors = []
                    for ele in self.POLLING['groups'][group]:
                        if ele in self.NASA_REPO:
                            valid_sensors.append(ele)
                        else:
                            logger.warning(f"Element {ele} from group {group} not found in NASA Repository - skipping")
                    
                    self.POLLING['groups'][group] = valid_sensors
                    total_sensors += len(valid_sensors)
                
                logger.info(f"📊 Polling-Validierung abgeschlossen:")
                logger.info(f"   ✅ {total_sensors} gültige Sensoren gefunden")
                logger.info(f"   📋 {len(self.NASA_REPO)} Sensoren im NASA Repository verfügbar")
                
                if total_sensors < len(self.NASA_REPO):
                    missing = len(self.NASA_REPO) - total_sensors
                    logger.warning(f"   ⚠️ {missing} Sensoren werden nicht gepollt")
             
        if 'broker-url' not in self.MQTT:
            raise ConfigException(argument=self.MQTT['broker-url'], message="mqtt broker-url config parameter is missing")
        
        if 'broker-port' not in self.MQTT:
            raise ConfigException(argument=self.MQTT['broker-port'], message="mqtt broker-port parameter is missing")
        
        if 'homeAssistantAutoDiscoverTopic' not in self.MQTT:
           self.MQTT['homeAssistantAutoDiscoverTopic'] = ""

        if 'useCamelCaseTopicNames' not in self.MQTT:
           self.MQTT['useCamelCaseTopicNames'] = False
        
        if 'topicPrefix' not in self.MQTT:
            self.MQTT['topicPrefix'] = "ehsSentinel"

        if 'client-id' not in self.MQTT:
            self.MQTT['client-id'] = "ehsSentinel"
        
        if 'user' not in self.MQTT and 'password' in self.MQTT:
            raise ConfigException(argument=self.SERIAL['device'], message="mqtt user parameter is missing")
        
        if 'password' not in self.MQTT and 'user' in self.MQTT:
            raise ConfigException(argument=self.SERIAL['device'], message="mqtt password parameter is missing")
        
        # Set default logging values
        logging_defaults = {
            'messageNotFound': False,
            'invalidPacket': False,
            'deviceAdded': True,
            'packetNotFromIndoorOutdoor': False,
            'proccessedMessage': False,
            'pollerMessage': False,
            'controlMessage': False
        }
        
        for key, default_value in logging_defaults.items():
            if key not in self.LOGGING:
                self.LOGGING[key] = default_value

        logger.info(f"Logging Config:")
        for key, value in self.LOGGING.items():
            logger.info(f"    {key}: {value}")