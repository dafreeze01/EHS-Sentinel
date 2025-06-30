from EHSExceptions import ConfigException
from EHSArguments import EHSArguments
import yaml
import os
import re
import json

from CustomLogger import logger

class EHSConfig():
    """
    Singleton class to handle the configuration for the EHS Sentinel application.
    Modified for Home Assistant Addon support.
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
                'allowControl': addon_config.get('allgemein', {}).get('steuerung_erlauben', False)
            },
            'mqtt': {
                'broker-url': addon_config.get('mqtt', {}).get('broker_url', 'core-mosquitto'),
                'broker-port': addon_config.get('mqtt', {}).get('broker_port', 1883),
                'client-id': addon_config.get('mqtt', {}).get('client_id', 'ehs-sentinel'),
                'topicPrefix': addon_config.get('mqtt', {}).get('topic_prefix', 'ehsSentinel'),
                'homeAssistantAutoDiscoverTopic': 'homeassistant' if addon_config.get('mqtt', {}).get('homeassistant_discovery', True) else '',
                'useCamelCaseTopicNames': addon_config.get('mqtt', {}).get('camel_case_topics', True)
            },
            'logging': addon_config.get('logging', {})
        }

        # Add user/password if provided
        mqtt_user = addon_config.get('mqtt', {}).get('benutzer', '')
        mqtt_pass = addon_config.get('mqtt', {}).get('passwort', '')
        if mqtt_user:
            config['mqtt']['user'] = mqtt_user
        if mqtt_pass:
            config['mqtt']['password'] = mqtt_pass

        # Add protocol file if provided
        protocol_file = addon_config.get('allgemein', {}).get('protokoll_datei', '')
        if protocol_file:
            config['general']['protocolFile'] = protocol_file

        # Connection configuration
        connection_type = addon_config.get('verbindung', {}).get('typ', 'tcp')
        if connection_type == 'tcp':
            config['tcp'] = {
                'ip': addon_config.get('verbindung', {}).get('tcp', {}).get('ip', '192.168.1.100'),
                'port': addon_config.get('verbindung', {}).get('tcp', {}).get('port', 4196)
            }
        else:
            config['serial'] = {
                'device': addon_config.get('verbindung', {}).get('serial', {}).get('device', '/dev/ttyUSB0'),
                'baudrate': addon_config.get('verbindung', {}).get('serial', {}).get('baudrate', 9600)
            }

        # Polling configuration
        if addon_config.get('polling', {}).get('aktiviert', False):
            config['polling'] = {
                'fetch_interval': [],
                'groups': {
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
            }
            
            # Add enabled intervals from addon config
            for interval in addon_config.get('polling', {}).get('intervalle', []):
                if interval.get('aktiviert', False):
                    config['polling']['fetch_interval'].append({
                        'name': interval['name'],
                        'enable': True,
                        'schedule': interval['zeitplan']
                    })

        # Save generated config to file for compatibility
        with open(self.args.CONFIGFILE, 'w') as f:
            yaml.dump(config, f, default_flow_style=False)

        self._load_config(config)

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
                        try:
                            poller['schedule'] = self.parse_time_string(poller['schedule'])
                        except ValueError as e:
                            raise ConfigException(argument=poller['schedule'], message="schedule value from fetch_interval couldn't be validated, use format 10s, 10m or 10h")
                
                for group in self.POLLING['groups']:
                    for ele in self.POLLING['groups'][group]:
                        if ele not in self.NASA_REPO:
                            raise ConfigException(argument=ele, message="Element from group not in NASA Repository")
             
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