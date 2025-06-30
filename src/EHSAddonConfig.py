from EHSExceptions import ConfigException
from EHSAddonArguments import EHSAddonArguments
from AddonConfig import AddonConfig
import yaml
import os
import re

from CustomLogger import logger

class EHSAddonConfig():
    """
    Singleton-Klasse für die Addon-Konfiguration.
    Adaptiert die ursprüngliche EHSConfig für die Verwendung mit Home Assistant Addon.
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
            cls._instance = super(EHSAddonConfig, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, *args, **kwargs):
        if self._initialized:
            return
        self._initialized = True
        super().__init__(*args, **kwargs)

        logger.debug("init EHSAddonConfig")
        self.args = EHSAddonArguments()
        self.addon_config = AddonConfig(self.args.ADDON_CONFIG)

        # Lade Konfiguration aus Addon-Optionen
        self.MQTT = self.addon_config.mqtt
        self.GENERAL = self.addon_config.allgemein
        self.SERIAL = self.addon_config.serial
        self.TCP = self.addon_config.tcp
        self.LOGGING = self.addon_config.logging
        self.POLLING = self.addon_config.polling

        logger.debug(f"Konfiguration geladen:")
        logger.debug(f"MQTT: {self.MQTT}")
        logger.debug(f"GENERAL: {self.GENERAL}")
        logger.debug(f"SERIAL: {self.SERIAL}")
        logger.debug(f"TCP: {self.TCP}")
        logger.debug(f"LOGGING: {self.LOGGING}")
        logger.debug(f"POLLING: {self.POLLING}")

        self.validate()
    
    def parse_time_string(self, time_str: str) -> int:
        """Konvertiert Zeitstring (z.B. '30m') in Sekunden."""
        match = re.match(r'^(\d+)([smh])$', time_str.strip(), re.IGNORECASE)
        if not match:
            raise ValueError("Ungültiges Zeitformat. Verwende '10s', '10m', oder '10h'.")
        
        value, unit = int(match.group(1)), match.group(2).lower()
        
        conversion_factors = {
            's': 1,   # Sekunden
            'm': 60,  # Minuten
            'h': 3600 # Stunden
        }
    
        return value * conversion_factors[unit]

    def validate(self):
        """Validiert die Konfiguration."""
        # Lade NASA Repository
        if os.path.isfile(self.GENERAL['nasaRepositoryFile']):
             with open(self.GENERAL['nasaRepositoryFile'], mode='r') as file:
                self.NASA_REPO = yaml.safe_load(file)
        else:
            raise ConfigException(argument=self.GENERAL['nasaRepositoryFile'], 
                                message="NASA Repository Datei fehlt")

        # Validiere Verbindungseinstellungen
        if self.SERIAL is None and self.TCP is None:
            raise ConfigException(argument="", 
                                message="Definiere TCP oder Serial Verbindungsparameter")

        if self.SERIAL is not None and self.TCP is not None:
            raise ConfigException(argument="", 
                                message="Du kannst nicht TCP und Serial gleichzeitig definieren")

        # Validiere Polling-Konfiguration
        if self.POLLING is not None:
            if 'fetch_interval' not in self.POLLING:
                raise ConfigException(argument='', 
                                    message="fetch_interval in Polling-Parameter fehlt")
            
            if 'groups' not in self.POLLING:
                raise ConfigException(argument='', 
                                    message="groups in Polling-Parameter fehlt")
            
            # Validiere Polling-Intervalle
            for poller in self.POLLING['fetch_interval']:
                if poller['name'] not in self.POLLING['groups']:
                    raise ConfigException(argument=poller['name'], 
                                        message="Gruppenname aus fetch_interval nicht in groups definiert")
                if 'schedule' in poller:
                    try:
                        poller['schedule'] = self.parse_time_string(poller['schedule'])
                    except ValueError as e:
                        raise ConfigException(argument=poller['schedule'], 
                                            message="Zeitplan-Wert aus fetch_interval konnte nicht validiert werden, verwende Format 10s, 10m oder 10h")
                
                # Validiere Gruppenmitglieder
                for ele in self.POLLING['groups'][poller['name']]:
                    if ele not in self.NASA_REPO:
                        raise ConfigException(argument=ele, 
                                            message="Element aus Gruppe nicht im NASA Repository")

        logger.info(f"Logging-Konfiguration:")
        for key, value in self.LOGGING.items():
            logger.info(f"    {key}: {value}")