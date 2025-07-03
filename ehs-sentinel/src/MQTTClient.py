import asyncio
import os
import signal
import json
import time
import datetime

import gmqtt

# Get the logger
from CustomLogger import logger
from EHSArguments import EHSArguments
from EHSConfig import EHSConfig
from SensorMonitor import sensor_monitor, SensorStatus, ErrorType
from MQTTCommunicationAnalyzer import mqtt_analyzer, MQTTMessageType, ConversionDirection

class MQTTClient:
    """
    MQTTClient is a singleton class that manages the connection and communication with an MQTT broker.
    It handles the initialization, connection, subscription, and message publishing for the MQTT client.
    The class also supports Home Assistant auto-discovery and maintains a list of known devices.
    """
    _instance = None
    STOP = asyncio.Event()

    DEVICE_ID = "samsung_ehssentinel"

    def __new__(cls, *args, **kwargs):
        
        if not cls._instance:
            cls._instance = super(MQTTClient, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        
        if self._initialized:
            return
        self.config = EHSConfig()
        self.args = EHSArguments()
        self.message_producer = None
        self._initialized = True
        self.broker = self.config.MQTT['broker-url']
        self.port = self.config.MQTT['broker-port']
        self.client_id = self.config.MQTT['client-id']
        self.client = gmqtt.Client(self.client_id)
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message
        self.client.on_subscribe = self.on_subscribe
        if 'user' in self.config.MQTT and 'password' in self.config.MQTT:
            if self.config.MQTT['user'] and self.config.MQTT['password']:
                self.client.set_auth_credentials(self.config.MQTT['user'], self.config.MQTT['password'])
        self.topicPrefix = self.config.MQTT['topicPrefix']
        self.homeAssistantAutoDiscoverTopic = self.config.MQTT['homeAssistantAutoDiscoverTopic']
        self.useCamelCaseTopicNames = self.config.MQTT['useCamelCaseTopicNames']

        self.initialized = True
        self.known_topics: list = list()  # Set to keep track of known topics
        self.known_devices_topic = "known/devices"  # Dedicated topic for storing known topics
        self.auto_discovery_completed = False  # Flag to track if auto-discovery is done

    def set_message_producer(self, producer):
        """Set the message producer instance with proper writer"""
        self.message_producer = producer
        logger.info(f"🔄 MQTT client received MessageProducer: {'✅ Available' if producer else '❌ Not available'}")

    async def connect(self):
        logger.info("[MQTT] Connecting to broker...")
        await self.client.connect(self.broker, self.port, keepalive=60, version=gmqtt.constants.MQTTv311)

        if hasattr(self.args, 'CLEAN_KNOWN_DEVICES') and self.args.CLEAN_KNOWN_DEVICES:
            self._publish(f"{self.topicPrefix.replace('/', '')}/{self.known_devices_topic}", " ", retain=True)
            logger.info("Known Devices Topic have been cleared")

    def subscribe_known_topics(self):        
        logger.info("Subscribe to known devices topic")
        sublist =  [
                gmqtt.Subscription(f"{self.topicPrefix.replace('/', '')}/{self.known_devices_topic}", 1),
                gmqtt.Subscription(f"{self.homeAssistantAutoDiscoverTopic}/status", 1)
            ]
        if self.config.GENERAL['allowControl']:
            sublist.append(gmqtt.Subscription(f"{self.topicPrefix.replace('/', '')}/entity/+/set", 1))

        self.client.subscribe(sublist)

    def on_subscribe(self, client, mid, qos, properties):
        logger.debug('SUBSCRIBED')

    def on_message(self, client, topic, payload, qos, properties):        
        if self.known_devices_topic in topic:
            # Update the known devices set with the retained message
            self.known_topics = list(filter(None, [x.strip() for x in payload.decode().split(",")]))
            if properties['retain'] == True:
                if self.config.LOGGING['deviceAdded']:
                    total_available = len(self.config.NASA_REPO) if hasattr(self.config, 'NASA_REPO') else "unknown"
                    logger.info(f"📊 Loaded devices from known devices Topic ({len(self.known_topics)}/{total_available} total sensors):")

                    for idx, devname in enumerate(self.known_topics, start=1):
                        # Hole Beschreibung aus NASA Repository
                        description = ""
                        if hasattr(self.config, 'NASA_REPO') and devname in self.config.NASA_REPO:
                            description = self.config.NASA_REPO[devname].get('description', '')
                            if description:
                                description = f" - {description}"
                        
                        logger.info(f"   Device {idx:>3}/{len(self.known_topics)}: {devname}{description}")
                else:
                    logger.debug(f"Loaded devices from known devices Topic:")
                    for idx, devname in enumerate(self.known_topics):
                        logger.debug(f"Device added no. {idx:<3}:  {devname} ")

        if f"{self.homeAssistantAutoDiscoverTopic}/status" == topic:
            logger.info(f"HASS Status Messages {topic} received: {payload.decode()}")
            if payload.decode() == "online":
                self._publish(f"{self.topicPrefix.replace('/', '')}/{self.known_devices_topic}", " ", retain=True)
                logger.info("Known Devices Topic have been cleared")          
                self.clear_hass()
                logger.info("All configuration from HASS has been resetet")
                
                # Starte Auto-Discovery für alle verfügbaren Sensoren nach HASS-Reset
                if not self.auto_discovery_completed:
                    asyncio.create_task(self.create_all_devices())
        
        if topic.startswith(f"{self.topicPrefix.replace('/', '')}/entity"):
            logger.info(f"HASS Set Entity Messages {topic} received: {payload.decode()}")
            
            # Log MQTT message for analysis
            parts = topic.split("/")
            sensor_name = parts[2] if len(parts) > 2 else None
            
            if sensor_name:
                # Log the SET command
                mqtt_analyzer.log_mqtt_message(
                    topic=topic,
                    payload=payload.decode(),
                    message_type=MQTTMessageType.SET_COMMAND,
                    sensor_name=sensor_name,
                    qos=qos,
                    retain=properties.get('retain', False)
                )
            
            if self.message_producer is not None:
                # Start time for response time measurement
                start_time = time.time()
                
                # Process the command
                asyncio.create_task(self.message_producer.write_request(parts[2], payload.decode(), read_request_after=True))
                
                # Log the conversion if applicable
                if sensor_name and sensor_name in self.config.NASA_REPO:
                    try:
                        # Get original value
                        original_value = payload.decode()
                        
                        # Determine conversion type
                        repo_entry = self.config.NASA_REPO[sensor_name]
                        if 'type' in repo_entry and repo_entry['type'] == 'ENUM':
                            # For ENUM, convert string to number
                            enum_values = repo_entry.get('enum', {})
                            converted_value = None
                            
                            for key, val in enum_values.items():
                                if val == original_value:
                                    converted_value = key
                                    break
                            
                            if converted_value is not None:
                                mqtt_analyzer.log_value_conversion(
                                    sensor_name=sensor_name,
                                    original_value=original_value,
                                    converted_value=converted_value,
                                    conversion_type=ConversionDirection.STRING_TO_BYTES,
                                    success=True
                                )
                            else:
                                mqtt_analyzer.log_value_conversion(
                                    sensor_name=sensor_name,
                                    original_value=original_value,
                                    converted_value=None,
                                    conversion_type=ConversionDirection.STRING_TO_BYTES,
                                    success=False,
                                    error_message=f"Enum value not found: {original_value}"
                                )
                        elif 'reverse-arithmetic' in repo_entry:
                            # For numeric values with arithmetic
                            try:
                                arithmetic = repo_entry['reverse-arithmetic']
                                value = float(original_value)
                                
                                # Simple evaluation for common patterns
                                if arithmetic == "value * 10":
                                    converted_value = value * 10
                                elif arithmetic == "value * 100":
                                    converted_value = value * 100
                                elif arithmetic == "value / 10":
                                    converted_value = value / 10
                                else:
                                    # More complex arithmetic would need a safe evaluator
                                    converted_value = value
                                
                                mqtt_analyzer.log_value_conversion(
                                    sensor_name=sensor_name,
                                    original_value=original_value,
                                    converted_value=converted_value,
                                    conversion_type=ConversionDirection.DECIMAL_TO_HEX,
                                    success=True
                                )
                            except Exception as e:
                                mqtt_analyzer.log_value_conversion(
                                    sensor_name=sensor_name,
                                    original_value=original_value,
                                    converted_value=None,
                                    conversion_type=ConversionDirection.DECIMAL_TO_HEX,
                                    success=False,
                                    error_message=str(e)
                                )
                    except Exception as e:
                        logger.error(f"Error logging conversion: {e}")
            else:
                logger.warning(f"⚠️ Cannot process control message - MessageProducer not available")
                
                # Log sensor error
                if sensor_name:
                    sensor_monitor.log_sensor_error(
                        sensor_name=sensor_name,
                        error_type=ErrorType.MQTT_ERROR,
                        error_message="MessageProducer not available for processing control message"
                    )

    def on_connect(self, client, flags, rc, properties):
        if rc == 0:
            logger.info(f"Connected to MQTT with result code {rc}")
            if len(self.homeAssistantAutoDiscoverTopic) > 0:
                self.subscribe_known_topics()
                
                # Starte Auto-Discovery für alle verfügbaren Sensoren nach Verbindung
                if not self.auto_discovery_completed:
                    asyncio.create_task(self.create_all_devices())
        else:
            logger.error(f"Failed to connect, return code {rc}")

    def on_disconnect(self, client, packet, exc=None):        
        logger.info(f"Disconnected with result code ")
        logger.warning("Unexpected disconnection. Reconnecting...")
        while True:
            try:
                self.client.reconnect()
                break
            except Exception as e:
                logger.error(f"Reconnection failed: {e}")
                time.sleep(5)

    def _publish(self, topic, payload, qos=0, retain=False):        
        logger.debug(f"MQTT Publish Topic: {topic} payload: {payload}")
        self.client.publish(f"{topic}", payload, qos, retain)
        #time.sleep(0.1)

    async def create_all_devices(self):
        """Erstellt Auto-Discovery für alle verfügbaren Sensoren im NASA Repository."""
        if self.auto_discovery_completed:
            return
            
        logger.info("🚀 Starte Auto-Discovery für alle verfügbaren Sensoren...")
        
        total_sensors = len(self.config.NASA_REPO)
        created_count = 0
        
        for sensor_name in self.config.NASA_REPO.keys():
            if sensor_name not in self.known_topics:
                try:
                    self.auto_discover_hass(sensor_name)
                    self.refresh_known_devices(sensor_name)
                    created_count += 1
                    
                    # Kleine Pause zwischen den Erstellungen, um MQTT nicht zu überlasten
                    await asyncio.sleep(0.1)
                    
                except Exception as e:
                    logger.warning(f"⚠️ Fehler beim Erstellen von Sensor {sensor_name}: {e}")
        
        self.auto_discovery_completed = True
        logger.info(f"✅ Auto-Discovery abgeschlossen: {created_count} neue Sensoren erstellt")
        logger.info(f"📊 Gesamt verfügbare Sensoren: {len(self.known_topics)}/{total_sensors}")

    def refresh_known_devices(self, devname):
        self.known_topics.append(devname)
        
        # Hole Beschreibung aus NASA Repository
        description = ""
        if hasattr(self.config, 'NASA_REPO') and devname in self.config.NASA_REPO:
            description = self.config.NASA_REPO[devname].get('description', '')
            if description:
                description = f" - {description}"
        
        total_available = len(self.config.NASA_REPO) if hasattr(self.config, 'NASA_REPO') else "unknown"
        
        if self.config.LOGGING['deviceAdded']:
            logger.info(f"📱 Device added {len(self.known_topics):>3}/{total_available}: {devname}{description}")
        else:
            logger.debug(f"Device added no. {len(self.known_topics):<3}:  {devname} ")
        
        self._publish(f"{self.topicPrefix.replace('/', '')}/{self.known_devices_topic}", ",".join(self.known_topics), retain=True)
    
    async def publish_message(self, name, value):        
        newname = f"{self._normalize_name(name)}"
        
        if len(self.homeAssistantAutoDiscoverTopic) > 0:

            if name not in self.known_topics:
                self.auto_discover_hass(name)
                self.refresh_known_devices(name)

            # Safe platform type determination
            sensor_type = "sensor"  # Default fallback
            try:
                if (self.config.NASA_REPO[name]['hass_opts']['writable'] and 
                    'platform' in self.config.NASA_REPO[name]['hass_opts'] and 
                    'type' in self.config.NASA_REPO[name]['hass_opts']['platform']):
                    sensor_type = self.config.NASA_REPO[name]['hass_opts']['platform']['type']
                else:
                    sensor_type = self.config.NASA_REPO[name]['hass_opts']['default_platform']
            except KeyError:
                sensor_type = "sensor"
                
            topicname = f"{self.config.MQTT['homeAssistantAutoDiscoverTopic']}/{sensor_type}/{self.DEVICE_ID}_{newname.lower()}/state"
        else:
            topicname = f"{self.topicPrefix.replace('/', '')}/{newname}"
        
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            value = round(value, 2) if isinstance(value, float) and "." in f"{value}" else value

        # Log MQTT message for analysis
        mqtt_analyzer.log_mqtt_message(
            topic=topicname,
            payload=value,
            message_type=MQTTMessageType.STATE_UPDATE,
            sensor_name=name,
            qos=2,
            retain=False
        )
        
        # Log sensor reading
        try:
            # Convert value to bytes for raw_value
            if isinstance(value, (int, float)):
                raw_value = str(value).encode()
            elif isinstance(value, str):
                raw_value = value.encode()
            else:
                raw_value = str(value).encode()
            
            sensor_monitor.log_sensor_reading(
                sensor_name=name,
                raw_value=raw_value,
                converted_value=value,
                mqtt_topic=topicname
            )
        except Exception as e:
            logger.error(f"Error logging sensor reading: {e}")
        
        self._publish(topicname, value, qos=2, retain=False)

    def clear_hass(self):
        entities = {}
        for nasa in self.config.NASA_REPO:
            namenorm = self._normalize_name(nasa)
            sensor_type = "sensor"  # Default fallback
            try:
                if (self.config.NASA_REPO[nasa]['hass_opts']['writable'] and 
                    'platform' in self.config.NASA_REPO[nasa]['hass_opts'] and 
                    'type' in self.config.NASA_REPO[nasa]['hass_opts']['platform']):
                    sensor_type = self.config.NASA_REPO[nasa]['hass_opts']['platform']['type']
                else:
                    sensor_type = self.config.NASA_REPO[nasa]['hass_opts']['default_platform']
            except KeyError:
                sensor_type = "sensor"
                
            entities[namenorm] = {"platform": sensor_type}
        
        device = {
            "device": self._get_device(),
            "origin": self._get_origin(),
            "components": entities,
            "qos": 2
        }

        logger.debug(f"Auto Discovery HomeAssistant Clear Message: ")
        logger.debug(f"{device}")

        self._publish(f"{self.config.MQTT['homeAssistantAutoDiscoverTopic']}/device/{self.DEVICE_ID}/config",
                      json.dumps(device, ensure_ascii=False),
                      qos=2, 
                      retain=True)

    def auto_discover_hass(self, name):
        entity = {}
        namenorm = self._normalize_name(name)
        entity = {
                "name": f"{namenorm}",
                "object_id": f"{self.DEVICE_ID}_{namenorm.lower()}",
                "unique_id": f"{self.DEVICE_ID}_{name.lower()}",
                "force_update": True,
                #"expire_after": 86400,  # 1 day (24h * 60m * 60s)
                "value_template": "{{ value }}"
                #"value_template": "{{ value if value | length > 0 else 'unavailable' }}",
            }
        
        # Safe platform type determination with comprehensive error handling
        sensor_type = "sensor"  # Default fallback
        try:
            if (self.config.NASA_REPO[name]['hass_opts']['writable'] and 
                self.config.GENERAL['allowControl'] and
                'platform' in self.config.NASA_REPO[name]['hass_opts'] and 
                'type' in self.config.NASA_REPO[name]['hass_opts']['platform']):
                
                sensor_type = self.config.NASA_REPO[name]['hass_opts']['platform']['type']
                
                # Safe attribute access for select type
                if sensor_type == 'select':
                    if 'options' in self.config.NASA_REPO[name]['hass_opts']['platform']:
                        entity['options'] = self.config.NASA_REPO[name]['hass_opts']['platform']['options']
                        
                # Safe attribute access for number type
                if sensor_type == 'number':
                    platform_opts = self.config.NASA_REPO[name]['hass_opts']['platform']
                    if 'mode' in platform_opts:
                        entity['mode'] = platform_opts['mode']
                    if 'min' in platform_opts:
                        entity['min'] = platform_opts['min']
                    if 'max' in platform_opts:
                        entity['max'] = platform_opts['max']
                    if 'step' in platform_opts:
                        entity['step'] = platform_opts['step']
                        
                entity['command_topic'] = f"{self.topicPrefix.replace('/', '')}/entity/{name}/set"
                entity['optimistic'] = False
            else:
                sensor_type = self.config.NASA_REPO[name]['hass_opts']['default_platform']
        except KeyError as e:
            logger.warning(f"Missing configuration for {name}: {e}, using default sensor type")
            sensor_type = "sensor"

        # Safe unit assignment
        try:
            if 'unit' in self.config.NASA_REPO[name]['hass_opts']:
                entity['unit_of_measurement'] = self.config.NASA_REPO[name]['hass_opts']['unit']
        except KeyError:
            pass

        entity['platform'] = sensor_type
        entity['state_topic'] = f"{self.homeAssistantAutoDiscoverTopic}/{sensor_type}/{self.DEVICE_ID}_{namenorm.lower()}/state"

        # Safe payload assignment
        try:
            if 'platform' in self.config.NASA_REPO[name]['hass_opts']:
                platform_opts = self.config.NASA_REPO[name]['hass_opts']['platform']
                if 'payload_off' in platform_opts:
                    entity['payload_off'] = "OFF"
                if 'payload_on' in platform_opts:
                    entity['payload_on'] = "ON"
        except KeyError:
            pass
            
        # Safe state_class and device_class assignment
        try:
            if 'state_class' in self.config.NASA_REPO[name]['hass_opts']:
                entity['state_class'] = self.config.NASA_REPO[name]['hass_opts']['state_class']
        except KeyError:
            pass
            
        try:
            if 'device_class' in self.config.NASA_REPO[name]['hass_opts']:
                entity['device_class'] = self.config.NASA_REPO[name]['hass_opts']['device_class']
        except KeyError:
            pass

        device = {
            "device": self._get_device(),
            "origin": self._get_origin(),
            "qos": 2
        }
        device.update(entity)

        logger.debug(f"Auto Discovery HomeAssistant Message: ")
        logger.debug(f"{device}")

        # Log MQTT message for analysis
        mqtt_analyzer.log_mqtt_message(
            topic=f"{self.homeAssistantAutoDiscoverTopic}/{sensor_type}/{self.DEVICE_ID}_{name.lower()}/config",
            payload=device,
            message_type=MQTTMessageType.DISCOVERY,
            sensor_name=name,
            qos=2,
            retain=True
        )

        self._publish(f"{self.homeAssistantAutoDiscoverTopic}/{sensor_type}/{self.DEVICE_ID}_{name.lower()}/config",
                      json.dumps(device, ensure_ascii=False),
                      qos=2, 
                      retain=True)

    def _get_device(self):
        # Dynamic version with build timestamp
        sw_version = f"1.3.1-{datetime.datetime.now().strftime('%Y%m%d')}"
        return {
                "identifiers": self.DEVICE_ID,
                "name": "Samsung EHS",
                "manufacturer": "Samsung",
                "model": "Mono HQ Quiet",
                "sw_version": sw_version
            }   

    def _get_origin(self):
        return {
                "name": "EHS-Sentinel",
                "support_url": "https://github.com/dafreeze01/EHS-Sentinel"
            }     

    def _normalize_name(self, name):
        if self.useCamelCaseTopicNames:
            prefix_to_remove = ['ENUM_', 'LVAR_', 'NASA_', 'VAR_', 'STR_']
            # remove unnecessary prefixes of name
            for prefix in prefix_to_remove:
                if name.startswith(prefix):
                    name = name[len(prefix):]
                    break

            name_parts = name.split("_")
            tmpname = name_parts[0].lower()
            # construct new name in CamelCase
            for i in range(1, len(name_parts)):
                tmpname += name_parts[i].capitalize()
        else:
            tmpname = name

        return tmpname