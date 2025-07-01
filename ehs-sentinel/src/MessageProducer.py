from CustomLogger import logger
from EHSArguments import EHSArguments
from EHSConfig import EHSConfig
from EHSExceptions import MessageWarningException
from SafeArithmetic import safe_eval_arithmetic
import asyncio
import traceback

from NASAMessage import NASAMessage
from NASAPacket import NASAPacket, AddressClassEnum, PacketType, DataType

class MessageProducer:
    """
    The MessageProducer class is responsible for sending messages to the EHS-Sentinel system.
    It follows the singleton pattern to ensure only one instance is created. The class provides methods to request and write
    messages and transforme the value of message payloads based on predefined rules. It also includes logging for debugging and tracing the
    message producing steps.
    """

    _instance = None
    _CHUNKSIZE = 10 # message requests list will be split into this chunks, experience have shown that more then 10 are too much for an packet

    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(MessageProducer, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, writer: asyncio.StreamWriter = None):
        if self._initialized:
            return
        self._initialized = True
        self.writer = writer
        self.config = EHSConfig()
        logger.info(f"🔧 MessageProducer initialized with writer: {'✅ Available' if writer else '❌ Not available'}")

    def set_writer(self, writer: asyncio.StreamWriter):
        """Set or update the writer for this producer"""
        self.writer = writer
        logger.info(f"🔄 MessageProducer writer updated: {'✅ Available' if writer else '❌ Not available'}")

    async def read_request(self, list_of_messages: list):
        if not self.writer:
            logger.error("❌ Cannot send read request - no writer available")
            return
            
        try:
            chunks = [list_of_messages[i:i + self._CHUNKSIZE] for i in range(0, len(list_of_messages), self._CHUNKSIZE)]
            for chunk in chunks:
                await asyncio.sleep(0.5)
                nasa_packet = self._build_default_read_packet()
                nasa_packet.set_packet_messages([self._build_message(x) for x in chunk])
                await self._write_packet_to_serial(nasa_packet)

                if self.config.LOGGING['pollerMessage']:
                    logger.info(f"Polling following NASAPacket: {nasa_packet}")
                else:
                    logger.debug(f"Sent data NASAPacket: {nasa_packet}")
        except Exception as e:
            logger.error(f"❌ Error in read_request: {e}")
            logger.error(traceback.format_exc())

    async def write_request(self, message: str, value: str | int, read_request_after=False):
        if not self.writer:
            logger.error(f"❌ Error in write_request for {message} with value {value}: No writer available")
            return
            
        try:
            # Ensure value is properly converted
            if isinstance(value, str):
                value = value.strip()
            
            decoded_value = self._decode_value(message.strip(), value)
            nasa_packet = self._build_default_request_packet()
            nasa_packet.set_packet_messages([self._build_message(message.strip(), decoded_value)])
            nasa_packet.to_raw()
            
            if self.config.LOGGING['controlMessage']:
                logger.info(f"Write request for {message} with value: {value}")
                logger.info(f"Sending NASA packet: {nasa_packet}")
            else:
                logger.debug(f"Write request for {message} with value: {value}")
                logger.debug(f"Sending NASA packet: {nasa_packet}")
                
            await self._write_packet_to_serial(nasa_packet)
            await asyncio.sleep(1)
            if read_request_after:
                await self.read_request([message])
        except Exception as e:
            logger.error(f"❌ Error in write_request for {message} with value {value}: {e}")
            logger.error(traceback.format_exc())

    def _search_nasa_enumkey_for_value(self, message, value):
        try:
            if 'type' in self.config.NASA_REPO[message] and self.config.NASA_REPO[message]['type'] == 'ENUM':
                if 'enum' in self.config.NASA_REPO[message]:
                    for key, val in self.config.NASA_REPO[message]['enum'].items():
                        if val == value:
                            return key
        except Exception as e:
            logger.warning(f"Error searching enum key for {message} with value {value}: {e}")
                
        return None
    
    def is_number(self, s):
        try:
            float(s)
            return True
        except (ValueError, TypeError):
            return False

    def _decode_value(self, message, value) -> int:  
        try:
            # Convert value to string if it's not already
            if not isinstance(value, str):
                value = str(value)
                
            enumval = self._search_nasa_enumkey_for_value(message, value)
            if enumval is None:
                if self.is_number(value):
                    try:
                        numeric_value = int(float(value))
                    except (ValueError, TypeError):
                        logger.warning(f"Could not convert {value} to number, using 0")
                        numeric_value = 0

                    if 'reverse-arithmetic' in self.config.NASA_REPO[message]:
                        arithmetic = self.config.NASA_REPO[message]['reverse-arithmetic']
                        try:
                            # Verwende sichere arithmetische Auswertung
                            return int(safe_eval_arithmetic(arithmetic, value=numeric_value))
                        except Exception as e:
                            logger.warning(f"Arithmetic Function couldn't been applied for Message {message}, using raw value: reverse-arithmetic = {arithmetic} {e} {numeric_value}")
                            return numeric_value
                    else:
                        return numeric_value
                else:
                    logger.warning(f"Value {value} is not a number and not an enum value, using 0")
                    return 0
            else:
                return int(enumval)
        except Exception as e:
            logger.error(f"Error decoding value {value} for message {message}: {e}")
            logger.error(traceback.format_exc())
            return 0

        return 0

    def _build_message(self, message, value=None) -> NASAMessage:
        try:
            tmpmsg = NASAMessage()
            tmpmsg.set_packet_message(self._extract_address(message))
            if value is None:
                value = 0
            
            # Ensure value is an integer
            if not isinstance(value, int):
                try:
                    if isinstance(value, str):
                        value = int(float(value))
                    else:
                        value = int(value)
                except (ValueError, TypeError):
                    logger.warning(f"Could not convert value {value} to int, using 0")
                    value = 0
            
            try:
                if tmpmsg.packet_message_type == 0:
                    value_raw = value.to_bytes(1, byteorder='big', signed=True) 
                elif tmpmsg.packet_message_type == 1:
                    value_raw = value.to_bytes(2, byteorder='big', signed=True) 
                elif tmpmsg.packet_message_type == 2:
                    value_raw = value.to_bytes(4, byteorder='big', signed=True) 
                elif tmpmsg.packet_message_type == 3:
                    # STR-Typ: Erstelle einen leeren String-Payload für Polling
                    # Für String-Typen verwenden wir einen minimalen Payload
                    value_raw = b'\x00\x00\x00\x00'  # 4 Bytes für String-Polling
                    logger.debug(f"Created STR-type message for {message} with minimal payload")
                else:
                    raise MessageWarningException(argument=tmpmsg.packet_message_type, message=f"Unknown Type for {message} type:")
            except (OverflowError, ValueError) as e:
                logger.warning(f"Value {value} too large for message type {tmpmsg.packet_message_type}, using 0")
                value = 0
                if tmpmsg.packet_message_type == 0:
                    value_raw = value.to_bytes(1, byteorder='big', signed=True) 
                elif tmpmsg.packet_message_type == 1:
                    value_raw = value.to_bytes(2, byteorder='big', signed=True) 
                elif tmpmsg.packet_message_type == 2:
                    value_raw = value.to_bytes(4, byteorder='big', signed=True) 
                elif tmpmsg.packet_message_type == 3:
                    value_raw = b'\x00\x00\x00\x00'
                    
            tmpmsg.set_packet_payload_raw(value_raw)
            return tmpmsg
        except Exception as e:
            logger.error(f"Error building message for {message} with value {value}: {e}")
            logger.error(traceback.format_exc())
            # Create a safe default message
            tmpmsg = NASAMessage()
            tmpmsg.set_packet_message(0)
            tmpmsg.set_packet_payload_raw(b'\x00')
            return tmpmsg

    def _extract_address(self, messagename) -> int:
        try:
            return int(self.config.NASA_REPO[messagename]['address'], 16)
        except Exception as e:
            logger.error(f"Error extracting address for {messagename}: {e}")
            return 0

    def _build_default_read_packet(self) -> NASAPacket:
        nasa_msg = NASAPacket()
        nasa_msg.set_packet_source_address_class(AddressClassEnum.JIGTester)
        nasa_msg.set_packet_source_channel(255)
        nasa_msg.set_packet_source_address(0)
        nasa_msg.set_packet_dest_address_class(AddressClassEnum.BroadcastSetLayer)
        nasa_msg.set_packet_dest_channel(0)
        nasa_msg.set_packet_dest_address(32)
        nasa_msg.set_packet_information(True)
        nasa_msg.set_packet_version(2)
        nasa_msg.set_packet_retry_count(0)
        nasa_msg.set_packet_type(PacketType.Normal)
        nasa_msg.set_packet_data_type(DataType.Read)
        nasa_msg.set_packet_number(166)
        return nasa_msg
    
    def _build_default_request_packet(self) -> NASAPacket:
        nasa_msg = NASAPacket()
        nasa_msg.set_packet_source_address_class(AddressClassEnum.JIGTester)
        nasa_msg.set_packet_source_channel(0)
        nasa_msg.set_packet_source_address(255)
        nasa_msg.set_packet_dest_address_class(AddressClassEnum.Indoor)
        nasa_msg.set_packet_dest_channel(0)
        nasa_msg.set_packet_dest_address(0)
        nasa_msg.set_packet_information(True)
        nasa_msg.set_packet_version(2)
        nasa_msg.set_packet_retry_count(0)
        nasa_msg.set_packet_type(PacketType.Normal)
        nasa_msg.set_packet_data_type(DataType.Request)
        nasa_msg.set_packet_number(166)
        return nasa_msg

    async def _write_packet_to_serial(self, packet: NASAPacket):
        if not self.writer:
            logger.error("❌ Cannot write packet - no writer available")
            return
            
        try:
            final_packet = packet.to_raw()
            self.writer.write(final_packet)
            await self.writer.drain()
        except Exception as e:
            logger.error(f"❌ Error writing packet to serial: {e}")
            logger.error(traceback.format_exc())