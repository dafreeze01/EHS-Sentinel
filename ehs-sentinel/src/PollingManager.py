import asyncio
import time
import datetime
from typing import Dict, List, Any, Optional
from collections import defaultdict
import json
import os

from CustomLogger import logger
from EHSConfig import EHSConfig
from MessageProducer import MessageProducer

class PollingManager:
    """
    Verwaltet die dreistufige Polling-Strategie und überwacht die Paketqualität.
    
    Implementiert drei Polling-Ebenen:
    - live_data: Kritische Betriebsdaten (10-15 Sekunden)
    - fsv_settings: Veränderliche Einstellungen (5-10 Minuten)
    - static_data: Statische Informationen (stündlich)
    
    Überwacht zusätzlich die Paketqualität und erstellt Statistiken.
    """
    
    def __init__(self, producer: Optional[MessageProducer] = None):
        """Initialisiert den PollingManager mit optionalem MessageProducer."""
        self.config = EHSConfig()
        self.producer = producer
        self.stats_file = "/data/packet_stats.json"
        
        # Statistik-Tracking
        self.total_packets = 0
        self.invalid_packets = 0
        self.hourly_stats = defaultdict(lambda: {"total": 0, "invalid": 0})
        self.last_stats_save = time.time()
        
        # Lade vorhandene Statistiken
        self._load_stats()
        
        # Definiere Sensor-Gruppen für dreistufiges Polling
        self.polling_groups = {
            "live_data": [
                # Kritische Betriebsdaten (Temperaturen, Frequenzen, Status)
                "NASA_POWER", "NASA_INDOOR_OPMODE", "NASA_OUTDOOR_OPERATION_STATUS",
                "NASA_OUTDOOR_TW1_TEMP", "NASA_OUTDOOR_TW2_TEMP", "NASA_OUTDOOR_OUT_TEMP",
                "NASA_INDOOR_DHW_CURRENT_TEMP", "NASA_OUTDOOR_COMP1_RUN_HZ",
                "NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT", "VAR_IN_FLOW_SENSOR_CALC",
                "NASA_EHSSENTINEL_HEAT_OUTPUT", "NASA_EHSSENTINEL_COP",
                "DHW_POWER", "CONTROL_SILENCE", "NASA_OUTDOOR_DEFROST_STEP"
            ],
            "fsv_settings": [
                # Veränderliche Einstellungen (FSV-Parameter)
                "VAR_IN_TEMP_WATER_LAW_TARGET_F",
                # FSV10xx - Fernbedienung
                "VAR_IN_FSV_1011", "VAR_IN_FSV_1012", "VAR_IN_FSV_1021", "VAR_IN_FSV_1022",
                "VAR_IN_FSV_1031", "VAR_IN_FSV_1032", "VAR_IN_FSV_1041", "VAR_IN_FSV_1042",
                "VAR_IN_FSV_1051", "VAR_IN_FSV_1052",
                # FSV20xx - Wassergesetz
                "VAR_IN_FSV_2011", "VAR_IN_FSV_2012", "VAR_IN_FSV_2021", "VAR_IN_FSV_2022",
                "VAR_IN_FSV_2031", "VAR_IN_FSV_2032", "ENUM_IN_FSV_2041", "VAR_IN_FSV_2051",
                "VAR_IN_FSV_2052", "VAR_IN_FSV_2061", "VAR_IN_FSV_2062", "VAR_IN_FSV_2071",
                "VAR_IN_FSV_2072", "ENUM_IN_FSV_2081", "ENUM_IN_FSV_2091", "ENUM_IN_FSV_2092",
                # FSV30xx - Warmwasser
                "ENUM_IN_FSV_3011", "VAR_IN_FSV_3021", "VAR_IN_FSV_3022", "VAR_IN_FSV_3023",
                "ENUM_IN_FSV_3041", "ENUM_IN_FSV_3042", "VAR_IN_FSV_3043", "VAR_IN_FSV_3044",
                # FSV40xx - Heizung
                "ENUM_IN_FSV_4011", "VAR_IN_FSV_4012", "VAR_IN_FSV_4013", "ENUM_IN_FSV_4021",
                "ENUM_IN_FSV_4022", "ENUM_IN_FSV_4023", "VAR_IN_FSV_4024", "VAR_IN_FSV_4025",
                # FSV50xx - Sonstige
                "ENUM_IN_FSV_5041", "ENUM_IN_FSV_5081", "ENUM_IN_FSV_5091", "ENUM_IN_FSV_5094"
            ],
            "static_data": [
                # Statische Informationen (Gerätedaten, Grenzwerte)
                "STR_OUTDOOR_MODEL_NAME", "STR_INDOOR_MODEL_NAME", "STR_SOFTWARE_VERSION",
                "STR_FIRMWARE_VERSION", "STR_SERIAL_NUMBER", "STR_MANUFACTURE_DATE",
                "STR_INSTALLATION_DATE", "LVAR_IN_MINUTES_SINCE_INSTALLATION",
                "LVAR_IN_MINUTES_ACTIVE", "LVAR_IN_TOTAL_GENERATED_POWER",
                "NASA_OUTDOOR_CONTROL_WATTMETER_ALL_UNIT_ACCUM", "LVAR_IN_DHW_OPERATION_TIME"
            ]
        }
        
        # Intervalle in Sekunden
        self.polling_intervals = {
            "live_data": 15,      # 15 Sekunden
            "fsv_settings": 300,  # 5 Minuten
            "static_data": 3600   # 1 Stunde
        }
        
        # Validiere Sensor-Gruppen gegen NASA Repository
        self._validate_polling_groups()
    
    def _validate_polling_groups(self):
        """Validiert die Sensor-Gruppen gegen das NASA Repository."""
        if not hasattr(self.config, 'NASA_REPO'):
            logger.warning("⚠️ NASA Repository nicht verfügbar für Polling-Validierung")
            return
            
        for group_name, sensors in self.polling_groups.items():
            valid_sensors = []
            for sensor in sensors:
                if sensor in self.config.NASA_REPO:
                    valid_sensors.append(sensor)
                else:
                    logger.warning(f"⚠️ Sensor {sensor} aus Gruppe {group_name} nicht im NASA Repository - wird übersprungen")
            
            # Aktualisiere die Gruppe mit nur gültigen Sensoren
            self.polling_groups[group_name] = valid_sensors
            
            logger.info(f"✅ Polling-Gruppe '{group_name}' validiert: {len(valid_sensors)} gültige Sensoren")
    
    def set_producer(self, producer: MessageProducer):
        """Setzt den MessageProducer für das Polling."""
        self.producer = producer
        logger.info(f"🔄 PollingManager hat MessageProducer erhalten: {'✅ Verfügbar' if producer else '❌ Nicht verfügbar'}")
    
    async def start_polling(self):
        """Startet das dreistufige Polling."""
        if not self.producer:
            logger.error("❌ Polling kann nicht gestartet werden - kein MessageProducer verfügbar")
            return
            
        logger.info("🚀 Starte dreistufiges Polling-System...")
        
        # Starte die drei Polling-Tasks mit unterschiedlichen Intervallen
        await asyncio.gather(
            self._poll_group("live_data"),
            self._poll_group("fsv_settings"),
            self._poll_group("static_data")
        )
    
    async def _poll_group(self, group_name: str):
        """Führt das Polling für eine bestimmte Gruppe durch."""
        interval = self.polling_intervals[group_name]
        sensors = self.polling_groups[group_name]
        
        logger.info(f"🔄 Starte Polling für Gruppe '{group_name}' alle {interval} Sekunden ({len(sensors)} Sensoren)")
        
        # Warte kurz, um die Starts zu staffeln
        await asyncio.sleep(5 * list(self.polling_groups.keys()).index(group_name))
        
        while True:
            try:
                start_time = time.time()
                
                # Führe das Polling durch
                if sensors:
                    logger.debug(f"📊 Polling von {len(sensors)} Sensoren aus Gruppe '{group_name}'")
                    await self.producer.read_request(sensors)
                    logger.info(f"✅ Polling für Gruppe '{group_name}' abgeschlossen ({len(sensors)} Sensoren)")
                
                # Berechne die tatsächliche Ausführungszeit
                execution_time = time.time() - start_time
                
                # Warte bis zum nächsten Intervall, berücksichtige die Ausführungszeit
                wait_time = max(0.1, interval - execution_time)
                await asyncio.sleep(wait_time)
                
            except Exception as e:
                logger.error(f"❌ Fehler beim Polling der Gruppe '{group_name}': {e}")
                await asyncio.sleep(interval)  # Warte trotzdem bis zum nächsten Intervall
    
    def record_packet(self, is_valid: bool):
        """
        Zeichnet ein empfangenes Paket auf und aktualisiert die Statistiken.
        
        Args:
            is_valid: True wenn das Paket gültig ist, False wenn ungültig
        """
        self.total_packets += 1
        if not is_valid:
            self.invalid_packets += 1
        
        # Aktualisiere stündliche Statistiken
        hour_key = datetime.datetime.now().strftime("%Y-%m-%d %H:00")
        self.hourly_stats[hour_key]["total"] += 1
        if not is_valid:
            self.hourly_stats[hour_key]["invalid"] += 1
        
        # Speichere Statistiken alle 5 Minuten
        if time.time() - self.last_stats_save > 300:  # 5 Minuten
            self._save_stats()
            self.last_stats_save = time.time()
            
            # Prüfe auf Übertragungsprobleme
            self._check_transmission_quality()
    
    def _check_transmission_quality(self):
        """Prüft die Übertragungsqualität und gibt Warnungen aus."""
        if self.total_packets == 0:
            return
            
        error_rate = (self.invalid_packets / self.total_packets) * 100
        
        if error_rate > 5:
            logger.warning(f"⚠️ WARNUNG: Hohe Paketfehlerrate von {error_rate:.2f}% ({self.invalid_packets}/{self.total_packets})")
            logger.warning("⚠️ Empfehlungen zur Fehlerbehebung:")
            logger.warning("   1. Prüfen Sie die physische Verbindung (Kabel, Stecker)")
            logger.warning("   2. Testen Sie alternative WLAN-Kanäle bei Funkstörungen")
            logger.warning("   3. Validieren Sie die Modbus-Einstellungen (Baudrate, Parität)")
        else:
            logger.info(f"✅ Paketqualität: {100-error_rate:.2f}% fehlerfrei ({self.total_packets-self.invalid_packets}/{self.total_packets})")
    
    def _save_stats(self):
        """Speichert die Paketstatistiken in eine JSON-Datei."""
        try:
            stats = {
                "total_packets": self.total_packets,
                "invalid_packets": self.invalid_packets,
                "error_rate_percent": (self.invalid_packets / self.total_packets * 100) if self.total_packets > 0 else 0,
                "hourly_stats": dict(self.hourly_stats),
                "last_updated": datetime.datetime.now().isoformat()
            }
            
            with open(self.stats_file, 'w') as f:
                json.dump(stats, f, indent=2)
                
            logger.debug(f"📊 Paketstatistiken gespeichert: {self.stats_file}")
        except Exception as e:
            logger.error(f"❌ Fehler beim Speichern der Paketstatistiken: {e}")
    
    def _load_stats(self):
        """Lädt vorhandene Paketstatistiken aus der JSON-Datei."""
        if not os.path.exists(self.stats_file):
            logger.info(f"📊 Keine vorhandenen Paketstatistiken gefunden, starte neue Aufzeichnung")
            return
            
        try:
            with open(self.stats_file, 'r') as f:
                stats = json.load(f)
                
            self.total_packets = stats.get("total_packets", 0)
            self.invalid_packets = stats.get("invalid_packets", 0)
            
            # Konvertiere hourly_stats zurück zu defaultdict
            for hour, data in stats.get("hourly_stats", {}).items():
                self.hourly_stats[hour] = data
                
            logger.info(f"📊 Paketstatistiken geladen: {self.total_packets} gesamt, {self.invalid_packets} ungültig")
        except Exception as e:
            logger.error(f"❌ Fehler beim Laden der Paketstatistiken: {e}")
    
    def generate_report(self) -> str:
        """
        Generiert einen Bericht über die Paketqualität.
        
        Returns:
            Formatierter Bericht als String
        """
        if self.total_packets == 0:
            return "Keine Paketdaten verfügbar für Bericht."
            
        error_rate = (self.invalid_packets / self.total_packets) * 100
        
        report = [
            "📊 EHS-Sentinel Paketqualitäts-Bericht",
            "=" * 50,
            f"Zeitraum: {list(self.hourly_stats.keys())[0] if self.hourly_stats else 'N/A'} bis {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}",
            f"Gesamtpakete: {self.total_packets}",
            f"Ungültige Pakete: {self.invalid_packets}",
            f"Fehlerrate: {error_rate:.2f}%",
            "",
            "Stündliche Statistik:",
            "-" * 50
        ]
        
        # Sortiere nach Stunde
        sorted_hours = sorted(self.hourly_stats.keys())
        
        for hour in sorted_hours:
            stats = self.hourly_stats[hour]
            total = stats["total"]
            invalid = stats["invalid"]
            hourly_error_rate = (invalid / total * 100) if total > 0 else 0
            
            status = "✅ Gut" if hourly_error_rate <= 5 else "⚠️ Problematisch"
            
            report.append(f"{hour}: {total} Pakete, {invalid} ungültig ({hourly_error_rate:.2f}%) - {status}")
        
        report.extend([
            "",
            "Empfehlungen:",
            "-" * 50
        ])
        
        if error_rate > 5:
            report.extend([
                "⚠️ Die Paketfehlerrate ist zu hoch (>5%). Bitte überprüfen Sie:",
                "1. Physische Verbindung (Kabel, Stecker, Adapter)",
                "2. WLAN-Kanal bei Funkstörungen",
                "3. Modbus-Einstellungen (Baudrate, Parität)",
                "4. Elektromagnetische Störquellen in der Nähe"
            ])
        else:
            report.append("✅ Die Verbindungsqualität ist gut. Keine Maßnahmen erforderlich.")
        
        return "\n".join(report)