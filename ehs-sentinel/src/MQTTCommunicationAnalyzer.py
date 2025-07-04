"""
MQTT-Kommunikationsanalysator für EHS-Sentinel
Überwacht und analysiert MQTT-Nachrichten zwischen Home Assistant und EHS-Sentinel
"""

import json
import time
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

from CustomLogger import logger

class MQTTMessageType(Enum):
    """MQTT-Nachrichtentypen"""
    SET_COMMAND = "set_command"
    STATE_UPDATE = "state_update"
    DISCOVERY = "discovery"
    STATUS = "status"

class ConversionDirection(Enum):
    """Richtung der Datenkonvertierung"""
    DECIMAL_TO_HEX = "decimal_to_hex"
    HEX_TO_DECIMAL = "hex_to_decimal"
    STRING_TO_BYTES = "string_to_bytes"
    BYTES_TO_STRING = "bytes_to_string"

@dataclass
class MQTTMessage:
    """MQTT-Nachricht mit Metadaten"""
    topic: str
    payload: Any
    timestamp: datetime
    message_type: MQTTMessageType
    sensor_name: Optional[str] = None
    qos: int = 0
    retain: bool = False

@dataclass
class ValueConversion:
    """Datenkonvertierung zwischen verschiedenen Formaten"""
    original_value: Any
    converted_value: Any
    conversion_type: ConversionDirection
    timestamp: datetime
    sensor_name: str
    success: bool = True
    error_message: Optional[str] = None

@dataclass
class CommunicationFlow:
    """Vollständiger Kommunikationsfluss für einen Wert"""
    sensor_name: str
    initiated_by: str  # "home_assistant" oder "ehs_sentinel"
    set_command: Optional[MQTTMessage] = None
    state_update: Optional[MQTTMessage] = None
    conversion: Optional[ValueConversion] = None
    response_time_ms: Optional[float] = None
    success: bool = False
    error_message: Optional[str] = None

class MQTTCommunicationAnalyzer:
    """
    Analysiert MQTT-Kommunikation zwischen Home Assistant und EHS-Sentinel.
    Überwacht Datenkonvertierung und Übertragungsfehler.
    """
    
    def __init__(self):
        self.messages: List[MQTTMessage] = []
        self.conversions: List[ValueConversion] = []
        self.communication_flows: List[CommunicationFlow] = []
        self.pending_commands: Dict[str, MQTTMessage] = {}
        
        # Konfiguration
        self.max_messages = 1000
        self.max_flows = 500
        self.command_timeout = 30  # Sekunden
        
        # Statistiken
        self.stats = {
            "total_messages": 0,
            "successful_conversions": 0,
            "failed_conversions": 0,
            "successful_flows": 0,
            "failed_flows": 0,
            "avg_response_time": 0.0
        }
        
        # Wir starten den Cleanup-Task nicht im Konstruktor
        # sondern werden ihn später im Event-Loop starten
        self._cleanup_task = None
    
    def start_cleanup_task(self, loop=None):
        """Startet den Cleanup-Task im angegebenen Event-Loop"""
        if loop is None:
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                logger.warning("Kein Event-Loop verfügbar für MQTT-Analyzer Cleanup-Task")
                return
        
        if self._cleanup_task is None:
            self._cleanup_task = loop.create_task(self._cleanup_old_data())
            logger.debug("MQTT-Analyzer Cleanup-Task gestartet")
    
    def log_mqtt_message(self, topic: str, payload: Any, message_type: MQTTMessageType,
                        sensor_name: str = None, qos: int = 0, retain: bool = False):
        """Protokolliert eine MQTT-Nachricht"""
        message = MQTTMessage(
            topic=topic,
            payload=payload,
            timestamp=datetime.now(),
            message_type=message_type,
            sensor_name=sensor_name,
            qos=qos,
            retain=retain
        )
        
        self.messages.append(message)
        self.stats["total_messages"] += 1
        
        # Begrenze Anzahl der Nachrichten
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]
        
        # Verarbeite Nachricht je nach Typ
        if message_type == MQTTMessageType.SET_COMMAND:
            self._handle_set_command(message)
        elif message_type == MQTTMessageType.STATE_UPDATE:
            self._handle_state_update(message)
        
        logger.debug(f"📨 MQTT {message_type.value}: {topic} = {payload}")
    
    def log_value_conversion(self, sensor_name: str, original_value: Any, 
                           converted_value: Any, conversion_type: ConversionDirection,
                           success: bool = True, error_message: str = None):
        """Protokolliert eine Wertkonvertierung"""
        conversion = ValueConversion(
            original_value=original_value,
            converted_value=converted_value,
            conversion_type=conversion_type,
            timestamp=datetime.now(),
            sensor_name=sensor_name,
            success=success,
            error_message=error_message
        )
        
        self.conversions.append(conversion)
        
        if success:
            self.stats["successful_conversions"] += 1
        else:
            self.stats["failed_conversions"] += 1
        
        # Detailliertes Logging
        if success:
            logger.debug(f"🔄 Konvertierung {conversion_type.value}: {original_value} → {converted_value}")
        else:
            logger.error(f"❌ Konvertierung fehlgeschlagen {conversion_type.value}: {original_value} | Fehler: {error_message}")
    
    def _handle_set_command(self, message: MQTTMessage):
        """Verarbeitet SET-Kommandos von Home Assistant"""
        if message.sensor_name:
            # Speichere als ausstehenden Befehl
            self.pending_commands[message.sensor_name] = message
            
            # Starte neuen Communication Flow
            flow = CommunicationFlow(
                sensor_name=message.sensor_name,
                initiated_by="home_assistant",
                set_command=message
            )
            self.communication_flows.append(flow)
            
            logger.info(f"🎛️ SET-Kommando empfangen: {message.sensor_name} = {message.payload}")
    
    def _handle_state_update(self, message: MQTTMessage):
        """Verarbeitet STATE-Updates von EHS-Sentinel"""
        if message.sensor_name:
            # Suche nach passendem ausstehenden Befehl
            if message.sensor_name in self.pending_commands:
                set_command = self.pending_commands.pop(message.sensor_name)
                
                # Finde passenden Communication Flow
                for flow in reversed(self.communication_flows):
                    if (flow.sensor_name == message.sensor_name and 
                        flow.set_command and 
                        flow.set_command.timestamp == set_command.timestamp):
                        
                        # Vervollständige Flow
                        flow.state_update = message
                        flow.response_time_ms = (message.timestamp - set_command.timestamp).total_seconds() * 1000
                        
                        # Prüfe Erfolg (vereinfacht)
                        flow.success = self._verify_command_success(set_command, message)
                        
                        if flow.success:
                            self.stats["successful_flows"] += 1
                            logger.info(f"✅ Kommando erfolgreich: {message.sensor_name} ({flow.response_time_ms:.1f}ms)")
                        else:
                            self.stats["failed_flows"] += 1
                            flow.error_message = "Wert-Mismatch zwischen SET und STATE"
                            logger.warning(f"⚠️ Kommando-Mismatch: {message.sensor_name}")
                        
                        break
            else:
                # Spontanes State-Update (nicht durch SET ausgelöst)
                flow = CommunicationFlow(
                    sensor_name=message.sensor_name,
                    initiated_by="ehs_sentinel",
                    state_update=message,
                    success=True
                )
                self.communication_flows.append(flow)
    
    def _verify_command_success(self, set_command: MQTTMessage, state_update: MQTTMessage) -> bool:
        """Überprüft, ob ein SET-Kommando erfolgreich war"""
        try:
            # Vereinfachte Verifikation - kann erweitert werden
            set_value = str(set_command.payload).strip()
            state_value = str(state_update.payload).strip()
            
            # Direkte String-Vergleich
            if set_value == state_value:
                return True
            
            # Numerische Vergleich mit Toleranz
            try:
                set_num = float(set_value)
                state_num = float(state_value)
                return abs(set_num - state_num) < 0.01
            except ValueError:
                pass
            
            return False
            
        except Exception as e:
            logger.error(f"Fehler bei Kommando-Verifikation: {e}")
            return False
    
    def get_communication_stats(self) -> Dict[str, Any]:
        """Gibt Kommunikationsstatistiken zurück"""
        # Berechne durchschnittliche Antwortzeit
        response_times = [
            flow.response_time_ms for flow in self.communication_flows 
            if flow.response_time_ms is not None
        ]
        
        avg_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # Aktualisiere Statistiken
        self.stats["avg_response_time"] = round(avg_response_time, 2)
        
        # Berechne Erfolgsraten
        total_flows = len(self.communication_flows)
        success_rate = (self.stats["successful_flows"] / total_flows * 100) if total_flows > 0 else 0
        
        conversion_total = self.stats["successful_conversions"] + self.stats["failed_conversions"]
        conversion_rate = (self.stats["successful_conversions"] / conversion_total * 100) if conversion_total > 0 else 0
        
        return {
            "message_stats": {
                "total_messages": self.stats["total_messages"],
                "messages_last_hour": self._count_messages_last_hour(),
                "pending_commands": len(self.pending_commands)
            },
            "conversion_stats": {
                "successful_conversions": self.stats["successful_conversions"],
                "failed_conversions": self.stats["failed_conversions"],
                "conversion_success_rate": round(conversion_rate, 2)
            },
            "flow_stats": {
                "total_flows": total_flows,
                "successful_flows": self.stats["successful_flows"],
                "failed_flows": self.stats["failed_flows"],
                "success_rate": round(success_rate, 2),
                "avg_response_time_ms": self.stats["avg_response_time"]
            },
            "recent_errors": self._get_recent_errors()
        }
    
    def get_sensor_communication_history(self, sensor_name: str, hours: int = 24) -> Dict[str, Any]:
        """Gibt die Kommunikationshistorie für einen Sensor zurück"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        # Filtere Nachrichten
        sensor_messages = [
            msg for msg in self.messages 
            if msg.sensor_name == sensor_name and msg.timestamp > cutoff_time
        ]
        
        # Filtere Flows
        sensor_flows = [
            flow for flow in self.communication_flows 
            if flow.sensor_name == sensor_name and 
            (flow.set_command and flow.set_command.timestamp > cutoff_time or
             flow.state_update and flow.state_update.timestamp > cutoff_time)
        ]
        
        # Filtere Konvertierungen
        sensor_conversions = [
            conv for conv in self.conversions 
            if conv.sensor_name == sensor_name and conv.timestamp > cutoff_time
        ]
        
        return {
            "sensor_name": sensor_name,
            "time_period_hours": hours,
            "messages": [
                {
                    "timestamp": msg.timestamp.isoformat(),
                    "type": msg.message_type.value,
                    "topic": msg.topic,
                    "payload": msg.payload
                }
                for msg in sensor_messages
            ],
            "communication_flows": [
                {
                    "timestamp": flow.set_command.timestamp.isoformat() if flow.set_command else flow.state_update.timestamp.isoformat(),
                    "initiated_by": flow.initiated_by,
                    "success": flow.success,
                    "response_time_ms": flow.response_time_ms,
                    "error_message": flow.error_message,
                    "set_value": flow.set_command.payload if flow.set_command else None,
                    "state_value": flow.state_update.payload if flow.state_update else None
                }
                for flow in sensor_flows
            ],
            "conversions": [
                {
                    "timestamp": conv.timestamp.isoformat(),
                    "type": conv.conversion_type.value,
                    "original": conv.original_value,
                    "converted": conv.converted_value,
                    "success": conv.success,
                    "error": conv.error_message
                }
                for conv in sensor_conversions
            ]
        }
    
    def _count_messages_last_hour(self) -> int:
        """Zählt Nachrichten der letzten Stunde"""
        cutoff_time = datetime.now() - timedelta(hours=1)
        return sum(1 for msg in self.messages if msg.timestamp > cutoff_time)
    
    def _get_recent_errors(self, hours: int = 1) -> List[Dict[str, Any]]:
        """Gibt aktuelle Fehler zurück"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        errors = []
        
        # Konvertierungsfehler
        for conv in self.conversions:
            if not conv.success and conv.timestamp > cutoff_time:
                errors.append({
                    "type": "conversion_error",
                    "timestamp": conv.timestamp.isoformat(),
                    "sensor": conv.sensor_name,
                    "message": conv.error_message,
                    "details": f"{conv.conversion_type.value}: {conv.original_value}"
                })
        
        # Flow-Fehler
        for flow in self.communication_flows:
            if not flow.success and flow.error_message and \
               (flow.set_command and flow.set_command.timestamp > cutoff_time):
                errors.append({
                    "type": "communication_error",
                    "timestamp": flow.set_command.timestamp.isoformat(),
                    "sensor": flow.sensor_name,
                    "message": flow.error_message,
                    "details": f"SET: {flow.set_command.payload}, STATE: {flow.state_update.payload if flow.state_update else 'None'}"
                })
        
        return sorted(errors, key=lambda x: x["timestamp"], reverse=True)[:10]
    
    async def _cleanup_old_data(self):
        """Bereinigt alte Daten"""
        while True:
            try:
                await asyncio.sleep(3600)  # Stündliche Bereinigung
                
                cutoff_time = datetime.now() - timedelta(hours=24)
                
                # Bereinige alte Nachrichten
                self.messages = [msg for msg in self.messages if msg.timestamp > cutoff_time]
                
                # Bereinige alte Konvertierungen
                self.conversions = [conv for conv in self.conversions if conv.timestamp > cutoff_time]
                
                # Bereinige alte Flows
                self.communication_flows = [
                    flow for flow in self.communication_flows 
                    if (flow.set_command and flow.set_command.timestamp > cutoff_time) or
                       (flow.state_update and flow.state_update.timestamp > cutoff_time)
                ]
                
                # Bereinige abgelaufene ausstehende Befehle
                timeout_cutoff = datetime.now() - timedelta(seconds=self.command_timeout)
                expired_commands = [
                    sensor for sensor, cmd in self.pending_commands.items()
                    if cmd.timestamp < timeout_cutoff
                ]
                
                for sensor in expired_commands:
                    cmd = self.pending_commands.pop(sensor)
                    logger.warning(f"⏰ SET-Kommando Timeout: {sensor} (nach {self.command_timeout}s)")
                    
                    # Markiere Flow als fehlgeschlagen
                    for flow in reversed(self.communication_flows):
                        if (flow.sensor_name == sensor and 
                            flow.set_command and 
                            flow.set_command.timestamp == cmd.timestamp):
                            flow.success = False
                            flow.error_message = "Timeout - keine STATE-Antwort erhalten"
                            self.stats["failed_flows"] += 1
                            break
                
                logger.debug(f"🧹 MQTT-Daten bereinigt: {len(self.messages)} Nachrichten, {len(self.communication_flows)} Flows")
                
            except Exception as e:
                logger.error(f"Fehler bei MQTT-Datenbereinigung: {e}")

# Globale Instanz
mqtt_analyzer = MQTTCommunicationAnalyzer()