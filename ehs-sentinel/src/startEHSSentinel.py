import asyncio
import serial
import serial_asyncio
import traceback
import json
import os
import datetime
import yaml
from MessageProcessor import MessageProcessor
from MessageProducer import MessageProducer
from EHSArguments import EHSArguments
from EHSConfig import EHSConfig
from EHSExceptions import MessageWarningException, SkipInvalidPacketException
from MQTTClient import MQTTClient
from PollingManager import PollingManager
from PacketMonitor import PacketMonitor
import aiofiles
import random

# Get the logger
from CustomLogger import logger
from NASAPacket import NASAPacket, AddressClassEnum, PacketType, DataType
from NASAMessage import NASAMessage

def get_version_from_config():
    """Lädt die Version aus der config.yaml"""
    try:
        # Korrekter Pfad zur config.yaml
        config_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'config.yaml')
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
            return config.get('version', '1.0.0')
    except Exception as e:
        # Fallback-Version, wenn die Datei nicht gelesen werden kann
        return '1.0.0'

# Lade Version aus config.yaml
VERSION_BASE = get_version_from_config()
version = f"{VERSION_BASE}-{datetime.datetime.now().strftime('%Y%m%d-%H%M%S')} Home Assistant Addon"

build_info = {
    "version": VERSION_BASE,
    "build_date": datetime.datetime.now().isoformat(),
    "build_type": "Home Assistant Addon",
    "features": [
        "Complete sensor polling (ALL available sensors)",
        "Enhanced logging with sensor descriptions", 
        "Fixed STR-type sensor handling (Type 3)",
        "Improved error handling with graceful fallbacks",
        "Secure arithmetic evaluation (SafeArithmetic)",
        "Comprehensive device count reporting",
        "Dreistufige Polling-Strategie",
        "Paketqualitätsüberwachung",
        "Automatische Geräteerstellung für alle Sensoren"
    ]
}

async def main():
    """
    Main function to start the EHS Sentinel application for Home Assistant Addon.
    """

    logger.info("####################################################################################################################")
    logger.info("#                                                                                                                  #")
    logger.info("#    ######   ##  ##   #####             #####    ######  ##   ##  ########  ######  ##   ##   ######   ##         #")
    logger.info("#    ##   #   ##  ##  ##   ##           ##   ##   ##   #  ###  ##  ## ## ##    ##    ###  ##   ##   #   ##         #")
    logger.info("#    ##       ##  ##  ##                ##        ##      #### ##     ##       ##    #### ##   ##       ##         #")
    logger.info("#    ####     ######   #####             #####    ####    #######     ##       ##    #######   ####     ##         #")
    logger.info("#    ##       ##  ##       ##                ##   ##      ## ####     ##       ##    ## ####   ##       ##         #")
    logger.info("#    ##   #   ##  ##  ##   ##           ##   ##   ##   #  ##  ###     ##       ##    ##  ###   ##   #   ##         #")
    logger.info("#    ######   ##  ##   #####             #####    ######  ##   ##    ####    ######  ##   ##   ######   #######    #")
    logger.info("#                                                                                                                  #")
    logger.info("####################################################################################################################")
    logger.info(f"🚀 Starting EHSSentinel {version}")
    logger.info(f"📦 Build Info:")
    logger.info(f"   Version: {build_info['version']}")
    logger.info(f"   Build Date: {build_info['build_date']}")
    logger.info(f"   Build Type: {build_info['build_type']}")
    logger.info(f"🔧 New Features:")
    for feature in build_info['features']:
        logger.info(f"   ✅ {feature}")
    logger.info(f"👨‍💻 Written by echoDave")
    logger.info("")

    logger.info("Reading Home Assistant Addon Configuration ...")
    args = EHSArguments()

    logger.info("Reading Configuration ...")
    config = EHSConfig()

    logger.info("connecting to MQTT Broker ...")
    mqtt = MQTTClient()
    await mqtt.connect()

    await asyncio.sleep(1)

    # Initialisiere den PacketMonitor
    packet_monitor = PacketMonitor()
    await packet_monitor.start_monitoring()

    # Initialisiere den PollingManager
    polling_manager = PollingManager()

    # we are not in dryrun mode for addon, so we need to read from Serial Port
    try:
        await serial_connection(config, args, mqtt, polling_manager, packet_monitor)
    except Exception as e:
        logger.error(f"❌ Failed to establish connection: {e}")
        logger.error(traceback.format_exc())
        # Keep the process running to maintain MQTT connection
        while True:
            await asyncio.sleep(60)
            logger.warning("⚠️ No active connection. Waiting for restart.")

async def process_buffer(buffer, args, config, packet_monitor):
    if buffer:
        if (len(buffer) > 14):
            for i in range(0, len(buffer)):
                if buffer[i] == 0x32:
                    if (len(buffer[i:]) > 14):
                        asyncio.create_task(process_packet(buffer[i:], args, config))
                        # Protokolliere ein gültiges Paket
                        packet_monitor.log_valid_packet()
                    else:
                        logger.debug(f"Buffermessages to short for NASA {len(buffer)}")
                    break
        else:
            logger.debug(f"Buffer to short for NASA {len(buffer)}")

async def serial_connection(config, args, mqtt, polling_manager, packet_monitor):
    buffer = []
    loop = asyncio.get_running_loop()

    logger.info("🔌 Establishing connection...")
    
    try:
        if config.TCP is not None:
            logger.info(f"🌐 Connecting via TCP to {config.TCP['ip']}:{config.TCP['port']}...")
            reader, writer = await asyncio.open_connection(config.TCP['ip'], config.TCP['port'])
            logger.info(f"✅ TCP connection established")
        else:
            logger.info(f"🔌 Opening serial connection to {config.SERIAL['device']} at {config.SERIAL['baudrate']} baud...")
            reader, writer = await serial_asyncio.open_serial_connection(
                            loop=loop, 
                            url=config.SERIAL['device'], 
                            baudrate=config.SERIAL['baudrate'], 
                            parity=serial.PARITY_EVEN,
                            stopbits=serial.STOPBITS_ONE,
                            bytesize=serial.EIGHTBITS,
                            rtscts=True,
                            timeout=1
            )
            logger.info(f"✅ Serial connection established")
            
        logger.info("🔄 Starting read/write tasks...")
        await asyncio.gather(
                serial_read(reader, args, config, packet_monitor),
                serial_write(writer, config, mqtt, polling_manager),
            )
    except Exception as e:
        logger.error(f"❌ Connection failed: {e}")
        logger.error(traceback.format_exc())
        raise

async def serial_read(reader: asyncio.StreamReader, args, config, packet_monitor):
    prev_byte = 0x00
    packet_started = False
    data = bytearray()
    packet_size = 0
    
    logger.info("📥 Starting read loop...")

    while True:
        try:
            current_byte = await reader.read(1)  # read bitewise
            if current_byte:
                if packet_started:
                    data.extend(current_byte)
                    if len(data) == 3:
                        packet_size = ((data[1] << 8) | data[2]) + 2
        
                    if packet_size <= len(data):
                        if current_byte == b'\x34':
                            asyncio.create_task(process_buffer(data, args, config, packet_monitor))
                            logger.debug(f"Received int: {data}")
                            logger.debug(f"Received hex: {[hex(x) for x in data]}")
                            data = bytearray()
                            packet_started = False
                        else:
                            if config.LOGGING['invalidPacket']:
                                logger.warning(f"Packet does not end with an x34. Size {packet_size} length {len(data)}")
                                logger.warning(f"Received hex: {[hex(x) for x in data]}")
                                logger.warning(f"Received raw: {data}")
                            else:
                                logger.debug(f"Packet does not end with an x34. Size {packet_size} length {len(data)}")
                                logger.debug(f"Received hex: {[hex(x) for x in data]}")
                                logger.debug(f"Received raw: {data}")
                            
                            # Protokolliere ein ungültiges Paket
                            packet_monitor.log_invalid_packet(
                                f"Packet does not end with an x34. Size {packet_size} length {len(data)}",
                                [hex(x) for x in data],
                                data
                            )
                            
                            data = bytearray()
                            packet_started = False

                # identify packet start
                if current_byte == b'\x00' and prev_byte == b'\x32':
                    packet_started = True
                    data.extend(prev_byte)
                    data.extend(current_byte)

                prev_byte = current_byte
        except asyncio.CancelledError:
            logger.warning("Read task cancelled")
            break
        except Exception as e:
            logger.error(f"Error in read loop: {e}")
            logger.error(traceback.format_exc())
            await asyncio.sleep(5)  # Wait before retrying

async def serial_write(writer:asyncio.StreamWriter, config, mqtt, polling_manager):
    # Create MessageProducer with proper writer
    producer = MessageProducer(writer=writer)
    
    # Set the producer in MQTT client for control messages
    mqtt.set_message_producer(producer)
    
    # Set the producer in PollingManager
    polling_manager.set_message_producer(producer)
    
    logger.info("📤 Starting write loop and pollers...")

    # Wait 20s before initial polling
    await asyncio.sleep(20)

    # Starte das dreistufige Polling-System
    await polling_manager.start_polling()

async def process_packet(buffer, args, config):
    if args.DUMPFILE and not args.DRYRUN:
        async with aiofiles.open(args.DUMPFILE, "a") as dumpWriter:
           await dumpWriter.write(f"{buffer}\n")
    else:
        try:
            nasa_packet = NASAPacket()
            nasa_packet.parse(buffer)
            logger.debug("Packet processed: ")
            logger.debug(f"Packet raw: {[hex(x) for x in buffer]}")
            logger.debug(nasa_packet)
            if nasa_packet.packet_source_address_class in (AddressClassEnum.Outdoor, AddressClassEnum.Indoor):
                messageProcessor = MessageProcessor()
                await messageProcessor.process_message(nasa_packet)    
            elif nasa_packet.packet_source_address_class == AddressClassEnum.WiFiKit and \
                nasa_packet.packet_dest_address_class == AddressClassEnum.BroadcastSelfLayer and \
                nasa_packet.packet_data_type == DataType.Notification:
                pass
            else:
                if config.LOGGING['packetNotFromIndoorOutdoor']:
                    logger.info("Message not From Indoor or Outdoor") 
                    logger.info(nasa_packet)
                    logger.info(f"Packet int: {[x for x in buffer]}")
                    logger.info(f"Packet hex: {[hex(x) for x in buffer]}")
                else:
                    logger.debug("Message not From Indoor or Outdoor") 
                    logger.debug(nasa_packet)
                    logger.debug(f"Packet int: {[x for x in buffer]}")
                    logger.debug(f"Packet hex: {[hex(x) for x in buffer]}")
        except ValueError as e:
            logger.warning("Value Error on parsing Packet, Packet will be skipped")
            logger.warning(f"Error processing message: {e}")
            logger.warning(f"Complete Packet: {[hex(x) for x in buffer]}")
            logger.warning(traceback.format_exc())
        except SkipInvalidPacketException as e:
            logger.debug("Warning occurred, Packet will be skipped")
            logger.debug(f"Error processing message: {e}")
            logger.debug(f"Complete Packet: {[hex(x) for x in buffer]}")
            logger.debug(traceback.format_exc())
        except MessageWarningException as e:
            logger.warning("Warning occurred, Packet will be skipped")
            logger.warning(f"Error processing message: {e}")
            logger.warning(f"Complete Packet: {[hex(x) for x in buffer]}")
            logger.warning(traceback.format_exc())
        except Exception as e:
            logger.error("Error Occurred, Packet will be skipped")
            logger.error(f"Error processing message: {e}")
            logger.error(traceback.format_exc())

if __name__ == "__main__":
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(main())
    except RuntimeError as e:
        logger.error(f"Runtime error: {e}")