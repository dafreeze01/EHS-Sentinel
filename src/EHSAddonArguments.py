import argparse
import os
from EHSExceptions import ArgumentException
from CustomLogger import logger, setDebugMode

class EHSAddonArguments:
    """
    Argumentenklasse für das Home Assistant Addon.
    Vereinfachte Version der ursprünglichen EHSArguments Klasse.
    """

    ADDON_CONFIG = ''
    DRYRUN = False
    DUMPFILE = ''
    CLEAN_KNOWN_DEVICES = False

    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(EHSAddonArguments, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        logger.debug("init EHSAddonArguments")
        
        parser = argparse.ArgumentParser(description="EHS-Sentinel Home Assistant Addon")
        parser.add_argument('--addon-config', type=str, required=True, 
                          help='Pfad zur Addon-Konfigurationsdatei')
        parser.add_argument('--dumpfile', type=str, required=False, 
                          help='Datei für Dump-Modus (nur für Debugging)')
        parser.add_argument('--dryrun', action='store_true', default=False, required=False, 
                          help='Trockenlauf-Modus (nur für Debugging)')
        parser.add_argument('--clean-known-devices', action='store_true', default=True, required=False, 
                          help='Bekannte Geräte beim Start löschen')
        parser.add_argument('-v', '--verbose', action='store_true', default=False, required=False, 
                          help='Ausführliche Ausgabe aktivieren')

        args = parser.parse_args()

        if args.verbose:
            setDebugMode()

        logger.debug(args)

        # Prüfe ob die Addon-Konfigurationsdatei existiert
        if not os.path.isfile(args.addon_config):
            raise ArgumentException(argument=args.addon_config, 
                                  message="Addon-Konfigurationsdatei existiert nicht")
            
        self.ADDON_CONFIG = args.addon_config
        self.DUMPFILE = args.dumpfile
        self.DRYRUN = args.dryrun
        self.CLEAN_KNOWN_DEVICES = args.clean_known_devices