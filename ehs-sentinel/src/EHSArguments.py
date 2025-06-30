import argparse
import os
import json
from EHSExceptions import ArgumentException

from CustomLogger import logger, setDebugMode

class EHSArguments:
    """
    EHSArguments is a singleton class that handles command-line arguments for the EHS Sentinel script.
    Modified for Home Assistant Addon support.
    """

    CONFIGFILE = ''
    DRYRUN = False
    DUMPFILE = ''
    ADDON_CONFIG = None

    _instance = None

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(EHSArguments, cls).__new__(cls, *args, **kwargs)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        logger.debug("init EHSArguments")
        
        # Check if running as Home Assistant Addon
        if os.path.exists('/data/options.json'):
            # Running as Home Assistant Addon
            with open('/data/options.json', 'r') as f:
                self.ADDON_CONFIG = json.load(f)
            self.CONFIGFILE = '/tmp/config.yml'  # We'll generate this from addon config
            self.DRYRUN = False
            self.DUMPFILE = ''
            self.CLEAN_KNOWN_DEVICES = False
            logger.info("Running as Home Assistant Addon")
        else:
            # Running standalone - parse command line arguments
            parser = argparse.ArgumentParser(description="Process some integers.")
            parser.add_argument('--configfile', type=str, required=True, help='Config file path')
            parser.add_argument('--dumpfile', type=str,  required=False, help='File Path for where the Dumpfile should be written to or read from if dryrun flag is set too.')
            parser.add_argument('--dryrun', action='store_true', default=False, required=False, help='Run the script in dry run mode, data will be read from DumpFile and not MQTT Message will be sent.')
            parser.add_argument('--clean-known-devices', action='store_true', default=False, required=False, help='Cleans the know Devices Topic on Startup.')
            parser.add_argument('-v', '--verbose', action='store_true', default=False, required=False, help='Enable verbose mode')
            parser.add_argument('--addon-config', type=str, required=False, help='Home Assistant Addon config file')

            args = parser.parse_args()

            if args.verbose:
                setDebugMode()

            logger.debug(args)

            if args.dryrun:
                if args.dumpfile is None:
                    raise ArgumentException(argument="--dumpfile")
                else:
                    if not os.path.isfile(args.dumpfile):
                        raise ArgumentException(argument=args.dumpfile, message="Dump File does not exist")
                
            # Check if the config file exists
            if not os.path.isfile(args.configfile):
                raise ArgumentException(argument=args.configfile, message="Config File does not exist")
                
            self.CONFIGFILE = args.configfile
            self.DUMPFILE = args.dumpfile
            self.DRYRUN = args.dryrun
            self.CLEAN_KNOWN_DEVICES = args.clean_known_devices