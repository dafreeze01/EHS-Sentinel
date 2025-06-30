import asyncio
import serial
import serial_asyncio
import traceback
from MessageProcessor import MessageProcessor
from MessageProducer import MessageProducer
from EHSAddonArguments import EHSAddonArguments
from EHSAddonConfig import EHSAddonConfig
from EHSExceptions import MessageWarningException, SkipInvalidPacketException
from MQTTClient import MQTTClient
import aiofiles
import json

# Get the logger
from CustomLogger import logger
from NASAPacket import NASAPacket, AddressClassEnum, PacketType, DataType
from NASAMessage import NASAMessage

version = "1.0.0 Home Assistant Addon"

async def main():
    """
    Hauptfunktion für das Home Assistant Addon.
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
    logger.info(f"Starte EHS-Sentinel {version} als Home Assistant Addon")
    logger.info("")

    logger.info("Lese Addon-Argumente ...")
    args = EHSAddonArguments()

    logger.info("Lese Addon-Konfiguration ...")
    config = EHSAddonConfig()

    logger.info("Verbinde mit MQTT Broker ...")
    mqtt = MQTTClient()
    await mqtt.connect()

    await asyncio.sleep(1)

    # Wenn Trockenlauf, dann aus Dump-Datei lesen (nur für Debugging)
    if args.DRYRUN and args.DUMPFILE:
        logger.info(f"TROCKENLAUF erkannt, lese aus Dump-Datei {args.DUMPFILE}")
        async with aiofiles.open(args.DUMPFILE, mode='r') as file:
            async for line in file:
                try:
                    line = json.loads(line.strip())
                except:
                    line = line.strip().replace("'", "").replace("[", "").replace("]", "").split(", ")
                    line = [int(value, 16) for value in line]
                await process_packet(line, args, config)
    else:
        # Normale Ausführung - lese von serieller Schnittstelle oder TCP
        await serial_connection(config, args)

async def process_buffer(buffer, args, config):
    """Verarbeitet den empfangenen Puffer."""
    if buffer:
        if (len(buffer) > 14):
            for i in range(0, len(buffer)):
                if buffer[i] == 0x32:
                    if (len(buffer[i:]) > 14):
                        asyncio.create_task(process_packet(buffer[i:], args, config))
                    else:
                        logger.debug(f"Puffernachrichten zu kurz für NASA {len(buffer)}")
                    break
        else:
            logger.debug(f"Puffer zu kurz für NASA {len(buffer)}")

async def serial_connection(config, args):
    """Stellt die Verbindung zur seriellen Schnittstelle oder TCP her."""
    buffer = []
    loop = asyncio.get_running_loop()

    if config.TCP is not None:
        logger.info(f"Verbinde mit TCP {config.TCP['ip']}:{config.TCP['port']}")
        reader, writer = await asyncio.open_connection(config.TCP['ip'], config.TCP['port'])
    else:
        logger.info(f"Verbinde mit serieller Schnittstelle {config.SERIAL['device']}")
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
        
    await asyncio.gather(
            serial_read(reader, args, config),
            serial_write(writer, config),
        )

async def serial_read(reader: asyncio.StreamReader, args, config):
    """Liest Daten von der seriellen Schnittstelle oder TCP."""
    prev_byte = 0x00
    packet_started = False
    data = bytearray()
    packet_size = 0

    while True:
        current_byte = await reader.read(1)
        if current_byte:
            if packet_started:
                data.extend(current_byte)
                if len(data) == 3:
                    packet_size = ((data[1] << 8) | data[2]) + 2
    
                if packet_size <= len(data):
                    if current_byte == b'\x34':
                        asyncio.create_task(process_buffer(data, args, config))
                        logger.debug(f"Empfangen int: {data}")
                        logger.debug(f"Empfangen hex: {[hex(x) for x in data]}")
                        data = bytearray()
                        packet_started = False
                    else:
                        if config.LOGGING['invalidPacket']:
                            logger.warning(f"Paket endet nicht mit 0x34. Größe {packet_size} Länge {len(data)}")
                            logger.warning(f"Empfangen hex: {[hex(x) for x in data]}")
                            logger.warning(f"Empfangen raw: {data}")
                        else:
                            logger.debug(f"Paket endet nicht mit 0x34. Größe {packet_size} Länge {len(data)}")
                            logger.debug(f"Empfangen hex: {[hex(x) for x in data]}")
                            logger.debug(f"Empfangen raw: {data}")
                        
                        data = bytearray()
                        packet_started = False

            # Paketstart identifizieren
            if current_byte == b'\x00' and prev_byte == b'\x32':
                packet_started = True
                data.extend(prev_byte)
                data.extend(current_byte)

            prev_byte = current_byte

async def serial_write(writer: asyncio.StreamWriter, config):
    """Schreibt Daten zur seriellen Schnittstelle oder TCP (Polling)."""
    producer = MessageProducer(writer=writer)

    # Warte 20s vor dem ersten Polling
    await asyncio.sleep(20)

    if config.POLLING is not None:
        for poller in config.POLLING['fetch_interval']:
            if poller['enable']:
                await asyncio.sleep(1)
                asyncio.create_task(make_default_request_packet(producer=producer, config=config, poller=poller))

async def make_default_request_packet(producer: MessageProducer, config: EHSAddonConfig, poller):
    """Erstellt Standard-Anfragepakete für Polling."""
    logger.info(f"Richte Poller {poller['name']} alle {poller['schedule']} Sekunden ein")
    message_list = []
    for message in config.POLLING['groups'][poller['name']]:
        message_list.append(message)

    while True:
        try:
            await producer.read_request(message_list)
        except MessageWarningException as e:
            logger.warning("Polling-Nachrichten waren nicht erfolgreich")
            logger.warning(f"Fehler beim Verarbeiten der Nachricht: {e}")
            logger.warning(f"Nachrichtenliste: {message_list}")
        except Exception as e:
            logger.error("Fehler aufgetreten, Polling wird übersprungen")
            logger.error(f"Fehler beim Verarbeiten der Nachricht: {e}")
            logger.error(traceback.format_exc())
        await asyncio.sleep(poller['schedule'])
        logger.info(f"Aktualisiere Poller {poller['name']}")

async def process_packet(buffer, args, config):
    """Verarbeitet ein empfangenes Paket."""
    if args.DUMPFILE and not args.DRYRUN:
        async with aiofiles.open(args.DUMPFILE, "a") as dumpWriter:
           await dumpWriter.write(f"{buffer}\n")
    else:
        try:
            nasa_packet = NASAPacket()
            nasa_packet.parse(buffer)
            logger.debug("Paket verarbeitet: ")
            logger.debug(f"Paket raw: {[hex(x) for x in buffer]}")
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
                    logger.info("Nachricht nicht von Innen- oder Außengerät") 
                    logger.info(nasa_packet)
                    logger.info(f"Paket int: {[x for x in buffer]}")
                    logger.info(f"Paket hex: {[hex(x) for x in buffer]}")
                else:
                    logger.debug("Nachricht nicht von Innen- oder Außengerät") 
                    logger.debug(nasa_packet)
                    logger.debug(f"Paket int: {[x for x in buffer]}")
                    logger.debug(f"Paket hex: {[hex(x) for x in buffer]}")
                    
        except ValueError as e:
            logger.warning("Wertfehler beim Parsen des Pakets, Paket wird übersprungen")
            logger.warning(f"Fehler beim Verarbeiten der Nachricht: {e}")
            logger.warning(f"Komplettes Paket: {[hex(x) for x in buffer]}")
            logger.warning(traceback.format_exc())
        except SkipInvalidPacketException as e:
            logger.debug("Warnung aufgetreten, Paket wird übersprungen")
            logger.debug(f"Fehler beim Verarbeiten der Nachricht: {e}")
            logger.debug(f"Komplettes Paket: {[hex(x) for x in buffer]}")
            logger.debug(traceback.format_exc())
        except MessageWarningException as e:
            logger.warning("Warnung aufgetreten, Paket wird übersprungen")
            logger.warning(f"Fehler beim Verarbeiten der Nachricht: {e}")
            logger.warning(f"Komplettes Paket: {[hex(x) for x in buffer]}")
            logger.warning(traceback.format_exc())
        except Exception as e:
            logger.error("Fehler aufgetreten, Paket wird übersprungen")
            logger.error(f"Fehler beim Verarbeiten der Nachricht: {e}")
            logger.error(traceback.format_exc())

if __name__ == "__main__":
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(main())
    except RuntimeError as e:
        logger.error(f"Laufzeitfehler: {e}")