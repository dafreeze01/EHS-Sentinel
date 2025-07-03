"""
Erweiterte Logging-System für EHS-Sentinel
Detaillierte Protokollierung von Sensor-Kommunikation mit Filteroptionen
"""

import logging
import json
import os
import gzip
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import asyncio

from CustomLogger import logger

class LogLevel(Enum):
    """Log-Level für verschiedene Ereignisse"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class LogCategory(Enum):
    """Kategorien für Logs"""
    SENSOR_COMMUNICATION = "sensor_communication"
    MQTT_COMMUNICATION = "mqtt_communication"
    DATA_CONVERSION = "data_conversion"
    ERROR_HANDLING = "error_handling"
    SYSTEM_STATUS = "system_status"
    PERFORMANCE = "performance"

@dataclass
class LogEntry:
    """Strukturierter Log-Eintrag"""
    timestamp: datetime
    level: LogLevel
    category: LogCategory
    sensor_name: Optional[str]
    message: str
    details: Dict[str, Any]
    duration_ms: Optional[float] = None
    error_code: Optional[str] = None
    correlation_id: Optional[str] = None

class StructuredLogger:
    """
    Erweiterte Logging-Klasse mit strukturierten Logs und Filteroptionen.
    Speichert detaillierte Informationen über Sensor-Kommunikation.
    """
    
    def __init__(self):
        self.log_entries: List[LogEntry] = []
        self.max_entries = 10000
        self.log_dir = "/data/logs"
        self.current_log_file = None
        
        # Erstelle Log-Verzeichnis
        os.makedirs(self.log_dir, exist_ok=True)
        
        # Setup strukturierte Logging-Handler
        self._setup_structured_logging()
        
        # Starte Log-Rotation
        asyncio.create_task(self._log_rotation_task())
    
    def _setup_structured_logging(self):
        """Richtet strukturierte Logging-Handler ein"""
        # Erstelle separaten Logger für strukturierte Logs
        self.structured_logger = logging.getLogger('ehs_structured')
        self.structured_logger.setLevel(logging.DEBUG)
        
        # Entferne vorhandene Handler
        for handler in self.structured_logger.handlers[:]:
            self.structured_logger.removeHandler(handler)
        
        # JSON-File-Handler für strukturierte Logs
        log_file = os.path.join(self.log_dir, f"structured_{datetime.now().strftime('%Y%m%d')}.jsonl")
        self.current_log_file = log_file
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.DEBUG)
        
        # JSON-Formatter
        json_formatter = JsonFormatter()
        file_handler.setFormatter(json_formatter)
        
        self.structured_logger.addHandler(file_handler)
        
        # Verhindere Propagation zum Root-Logger
        self.structured_logger.propagate = False
    
    def log_sensor_communication(self, sensor_name: str, action: str, 
                                details: Dict[str, Any], level: LogLevel = LogLevel.INFO,
                                duration_ms: float = None, error_code: str = None):
        """Protokolliert Sensor-Kommunikation"""
        entry = LogEntry(
            timestamp=datetime.now(),
            level=level,
            category=LogCategory.SENSOR_COMMUNICATION,
            sensor_name=sensor_name,
            message=f"Sensor {action}: {sensor_name}",
            details=details,
            duration_ms=duration_ms,
            error_code=error_code
        )
        
        self._add_log_entry(entry)
    
    def log_mqtt_communication(self, topic: str, action: str, payload: Any,
                              level: LogLevel = LogLevel.INFO, sensor_name: str = None):
        """Protokolliert MQTT-Kommunikation"""
        entry = LogEntry(
            timestamp=datetime.now(),
            level=level,
            category=LogCategory.MQTT_COMMUNICATION,
            sensor_name=sensor_name,
            message=f"MQTT {action}: {topic}",
            details={
                "topic": topic,
                "action": action,
                "payload": payload,
                "payload_size": len(str(payload)) if payload else 0
            }
        )
        
        self._add_log_entry(entry)
    
    def log_data_conversion(self, sensor_name: str, conversion_type: str,
                           original_value: Any, converted_value: Any,
                           success: bool = True, error_message: str = None):
        """Protokolliert Datenkonvertierung"""
        level = LogLevel.INFO if success else LogLevel.ERROR
        
        entry = LogEntry(
            timestamp=datetime.now(),
            level=level,
            category=LogCategory.DATA_CONVERSION,
            sensor_name=sensor_name,
            message=f"Data conversion {conversion_type}: {sensor_name}",
            details={
                "conversion_type": conversion_type,
                "original_value": original_value,
                "converted_value": converted_value,
                "success": success,
                "error_message": error_message
            },
            error_code="CONVERSION_ERROR" if not success else None
        )
        
        self._add_log_entry(entry)
    
    def log_error(self, category: LogCategory, message: str, details: Dict[str, Any],
                  sensor_name: str = None, error_code: str = None):
        """Protokolliert Fehler"""
        entry = LogEntry(
            timestamp=datetime.now(),
            level=LogLevel.ERROR,
            category=category,
            sensor_name=sensor_name,
            message=message,
            details=details,
            error_code=error_code
        )
        
        self._add_log_entry(entry)
    
    def log_performance(self, operation: str, duration_ms: float, 
                       details: Dict[str, Any] = None):
        """Protokolliert Performance-Metriken"""
        entry = LogEntry(
            timestamp=datetime.now(),
            level=LogLevel.INFO,
            category=LogCategory.PERFORMANCE,
            sensor_name=None,
            message=f"Performance: {operation}",
            details=details or {},
            duration_ms=duration_ms
        )
        
        self._add_log_entry(entry)
    
    def _add_log_entry(self, entry: LogEntry):
        """Fügt Log-Eintrag hinzu"""
        # Füge zu In-Memory-Liste hinzu
        self.log_entries.append(entry)
        
        # Begrenze Anzahl der In-Memory-Einträge
        if len(self.log_entries) > self.max_entries:
            self.log_entries = self.log_entries[-self.max_entries:]
        
        # Schreibe in strukturierte Log-Datei
        log_data = asdict(entry)
        log_data['timestamp'] = entry.timestamp.isoformat()
        log_data['level'] = entry.level.value
        log_data['category'] = entry.category.value
        
        self.structured_logger.info(json.dumps(log_data))
    
    def get_logs(self, filters: Dict[str, Any] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Gibt gefilterte Logs zurück"""
        filtered_entries = self.log_entries
        
        if filters:
            # Filter nach Level
            if 'level' in filters:
                level_filter = LogLevel(filters['level'])
                filtered_entries = [e for e in filtered_entries if e.level == level_filter]
            
            # Filter nach Kategorie
            if 'category' in filters:
                category_filter = LogCategory(filters['category'])
                filtered_entries = [e for e in filtered_entries if e.category == category_filter]
            
            # Filter nach Sensor
            if 'sensor_name' in filters:
                sensor_filter = filters['sensor_name']
                filtered_entries = [e for e in filtered_entries if e.sensor_name == sensor_filter]
            
            # Filter nach Zeitraum
            if 'start_time' in filters:
                start_time = datetime.fromisoformat(filters['start_time'])
                filtered_entries = [e for e in filtered_entries if e.timestamp >= start_time]
            
            if 'end_time' in filters:
                end_time = datetime.fromisoformat(filters['end_time'])
                filtered_entries = [e for e in filtered_entries if e.timestamp <= end_time]
            
            # Filter nach Fehlern
            if 'errors_only' in filters and filters['errors_only']:
                filtered_entries = [e for e in filtered_entries if e.level in [LogLevel.ERROR, LogLevel.CRITICAL]]
        
        # Sortiere nach Zeitstempel (neueste zuerst)
        filtered_entries.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Begrenze Anzahl
        filtered_entries = filtered_entries[:limit]
        
        # Konvertiere zu Dict
        return [
            {
                "timestamp": entry.timestamp.isoformat(),
                "level": entry.level.value,
                "category": entry.category.value,
                "sensor_name": entry.sensor_name,
                "message": entry.message,
                "details": entry.details,
                "duration_ms": entry.duration_ms,
                "error_code": entry.error_code
            }
            for entry in filtered_entries
        ]
    
    def get_log_statistics(self, hours: int = 24) -> Dict[str, Any]:
        """Gibt Log-Statistiken zurück"""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_entries = [e for e in self.log_entries if e.timestamp > cutoff_time]
        
        # Statistiken nach Level
        level_stats = {}
        for level in LogLevel:
            level_stats[level.value] = sum(1 for e in recent_entries if e.level == level)
        
        # Statistiken nach Kategorie
        category_stats = {}
        for category in LogCategory:
            category_stats[category.value] = sum(1 for e in recent_entries if e.category == category)
        
        # Sensor-Statistiken
        sensor_stats = {}
        for entry in recent_entries:
            if entry.sensor_name:
                if entry.sensor_name not in sensor_stats:
                    sensor_stats[entry.sensor_name] = {"total": 0, "errors": 0}
                sensor_stats[entry.sensor_name]["total"] += 1
                if entry.level in [LogLevel.ERROR, LogLevel.CRITICAL]:
                    sensor_stats[entry.sensor_name]["errors"] += 1
        
        # Performance-Statistiken
        performance_entries = [e for e in recent_entries if e.duration_ms is not None]
        avg_duration = sum(e.duration_ms for e in performance_entries) / len(performance_entries) if performance_entries else 0
        
        return {
            "time_period_hours": hours,
            "total_entries": len(recent_entries),
            "level_breakdown": level_stats,
            "category_breakdown": category_stats,
            "sensor_breakdown": sensor_stats,
            "performance": {
                "avg_duration_ms": round(avg_duration, 2),
                "total_operations": len(performance_entries)
            },
            "error_rate": round(level_stats.get("ERROR", 0) / len(recent_entries) * 100, 2) if recent_entries else 0
        }
    
    def export_logs(self, filters: Dict[str, Any] = None, format: str = "json") -> str:
        """Exportiert Logs in verschiedenen Formaten"""
        logs = self.get_logs(filters, limit=10000)
        
        if format == "json":
            return json.dumps(logs, indent=2)
        elif format == "csv":
            import csv
            import io
            
            output = io.StringIO()
            if logs:
                fieldnames = logs[0].keys()
                writer = csv.DictWriter(output, fieldnames=fieldnames)
                writer.writeheader()
                for log in logs:
                    # Flatten details for CSV
                    flattened_log = log.copy()
                    if 'details' in flattened_log:
                        details = flattened_log.pop('details')
                        for key, value in details.items():
                            flattened_log[f"details_{key}"] = value
                    writer.writerow(flattened_log)
            
            return output.getvalue()
        else:
            raise ValueError(f"Unsupported format: {format}")
    
    async def _log_rotation_task(self):
        """Rotiert Log-Dateien täglich"""
        while True:
            try:
                await asyncio.sleep(3600)  # Prüfe stündlich
                
                current_date = datetime.now().strftime('%Y%m%d')
                expected_file = os.path.join(self.log_dir, f"structured_{current_date}.jsonl")
                
                if self.current_log_file != expected_file:
                    # Komprimiere alte Log-Datei
                    if self.current_log_file and os.path.exists(self.current_log_file):
                        await self._compress_log_file(self.current_log_file)
                    
                    # Setup neuer Log-Handler
                    self._setup_structured_logging()
                
                # Bereinige alte Log-Dateien (älter als 30 Tage)
                await self._cleanup_old_logs()
                
            except Exception as e:
                logger.error(f"Fehler bei Log-Rotation: {e}")
    
    async def _compress_log_file(self, file_path: str):
        """Komprimiert eine Log-Datei"""
        try:
            compressed_path = f"{file_path}.gz"
            
            with open(file_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    f_out.writelines(f_in)
            
            # Lösche ursprüngliche Datei
            os.remove(file_path)
            
            logger.info(f"📦 Log-Datei komprimiert: {compressed_path}")
            
        except Exception as e:
            logger.error(f"Fehler beim Komprimieren der Log-Datei {file_path}: {e}")
    
    async def _cleanup_old_logs(self):
        """Bereinigt alte Log-Dateien"""
        try:
            cutoff_date = datetime.now() - timedelta(days=30)
            
            for filename in os.listdir(self.log_dir):
                file_path = os.path.join(self.log_dir, filename)
                
                if os.path.isfile(file_path):
                    file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                    
                    if file_time < cutoff_date:
                        os.remove(file_path)
                        logger.info(f"🗑️ Alte Log-Datei gelöscht: {filename}")
            
        except Exception as e:
            logger.error(f"Fehler bei Log-Bereinigung: {e}")

class JsonFormatter(logging.Formatter):
    """JSON-Formatter für strukturierte Logs"""
    
    def format(self, record):
        # Bereits JSON-formatierte Nachrichten direkt zurückgeben
        return record.getMessage()

# Globale Instanz
structured_logger = StructuredLogger()