import asyncio
import json
import os
import time
import traceback
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from CustomLogger import logger

class PacketMonitor:
    """
    Überwacht die Qualität der Pakete und erstellt Statistiken.
    
    Features:
    - Protokollierung ungültiger Pakete
    - Stündliche und tägliche Statistiken
    - Warnungen bei hoher Fehlerrate
    """
    
    _instance = None
    _initialized = False
    _stats_file = "/data/packet_stats.json"
    _report_file = "/data/packet_reports.json"
    
    # Vollständige Initialisierung der Statistik-Struktur mit Standardwerten
    _stats = {
        "total_packets": 0,
        "valid_packets": 0,
        "invalid_packets": 0,
        "error_rate": 0.0,
        "hourly": {},
        "daily": {},
        "last_reset": None
    }
    
    _reports = {
        "hourly": [],
        "daily": [],
        "weekly": []
    }
    
    _error_threshold = 0.15  # 15% Fehlerrate als Warnschwelle (erhöht für bessere Toleranz)
    
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(PacketMonitor, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        
        # Lade vorhandene Statistiken, falls vorhanden
        self._load_stats()
        self._load_reports()
        
        # Stelle sicher, dass alle erforderlichen Felder in den Statistiken vorhanden sind
        self._ensure_stats_structure()
    
    def _ensure_stats_structure(self):
        """Stellt sicher, dass alle erforderlichen Felder in den Statistiken vorhanden sind."""
        # Grundlegende Felder
        if "total_packets" not in self._stats:
            self._stats["total_packets"] = 0
        if "valid_packets" not in self._stats:
            self._stats["valid_packets"] = 0
        if "invalid_packets" not in self._stats:
            self._stats["invalid_packets"] = 0
        if "error_rate" not in self._stats:
            self._stats["error_rate"] = 0.0
        if "last_reset" not in self._stats or not self._stats["last_reset"]:
            self._stats["last_reset"] = datetime.now().isoformat()
            
        # Stündliche und tägliche Statistiken
        if "hourly" not in self._stats:
            self._stats["hourly"] = {}
        if "daily" not in self._stats:
            self._stats["daily"] = {}
            
        # Berichte
        if "hourly" not in self._reports:
            self._reports["hourly"] = []
        if "daily" not in self._reports:
            self._reports["daily"] = []
        if "weekly" not in self._reports:
            self._reports["weekly"] = []
    
    def log_invalid_packet(self, message: str, hex_data: List[str], raw_data: bytes):
        """Protokolliert ein ungültiges Paket und aktualisiert die Statistiken."""
        try:
            # Protokolliere das ungültige Paket nur bei Debug-Level
            logger.debug(f"⚠️ Ungültiges Paket: {message}")
            logger.debug(f"⚠️ Paket-Hex: {hex_data}")
            logger.debug(f"⚠️ Paket-Rohdaten: {raw_data}")
            
            # Aktualisiere die Statistiken
            self._stats["total_packets"] += 1
            self._stats["invalid_packets"] += 1
            
            # Aktualisiere stündliche Statistiken
            hour_key = datetime.now().strftime("%Y-%m-%d %H:00")
            if "hourly" not in self._stats:
                self._stats["hourly"] = {}
                
            if hour_key not in self._stats["hourly"]:
                self._stats["hourly"][hour_key] = {
                    "total": 0,
                    "valid": 0,
                    "invalid": 0,
                    "error_rate": 0.0
                }
            
            self._stats["hourly"][hour_key]["total"] += 1
            self._stats["hourly"][hour_key]["invalid"] += 1
            
            # Aktualisiere tägliche Statistiken
            day_key = datetime.now().strftime("%Y-%m-%d")
            if "daily" not in self._stats:
                self._stats["daily"] = {}
                
            if day_key not in self._stats["daily"]:
                self._stats["daily"][day_key] = {
                    "total": 0,
                    "valid": 0,
                    "invalid": 0,
                    "error_rate": 0.0
                }
            
            self._stats["daily"][day_key]["total"] += 1
            self._stats["daily"][day_key]["invalid"] += 1
            
            # Berechne Fehlerraten
            self._update_error_rates()
            
            # Speichere die Statistiken alle 100 ungültigen Pakete
            if self._stats["invalid_packets"] % 100 == 0:
                self._save_stats()
            
            # Prüfe, ob die Fehlerrate den Schwellwert überschreitet (nur alle 1000 Pakete)
            if self._stats["total_packets"] % 1000 == 0 and self._stats["error_rate"] > self._error_threshold:
                logger.warning(f"🚨 WARNUNG: Fehlerrate von {self._stats['error_rate']:.1%} überschreitet den Schwellwert von {self._error_threshold:.1%}!")
                logger.warning("🚨 Bitte überprüfen Sie die physische Verbindung, WLAN-Kanäle und Modbus-Einstellungen.")
        except Exception as e:
            logger.error(f"Fehler in log_invalid_packet: {e}")
            logger.error(traceback.format_exc())
    
    def log_valid_packet(self):
        """Protokolliert ein gültiges Paket und aktualisiert die Statistiken."""
        try:
            # Aktualisiere die Statistiken
            self._stats["total_packets"] += 1
            self._stats["valid_packets"] += 1
            
            # Aktualisiere stündliche Statistiken
            hour_key = datetime.now().strftime("%Y-%m-%d %H:00")
            if "hourly" not in self._stats:
                self._stats["hourly"] = {}
                
            if hour_key not in self._stats["hourly"]:
                self._stats["hourly"][hour_key] = {
                    "total": 0,
                    "valid": 0,
                    "invalid": 0,
                    "error_rate": 0.0
                }
            
            self._stats["hourly"][hour_key]["total"] += 1
            self._stats["hourly"][hour_key]["valid"] += 1
            
            # Aktualisiere tägliche Statistiken
            day_key = datetime.now().strftime("%Y-%m-%d")
            if "daily" not in self._stats:
                self._stats["daily"] = {}
                
            if day_key not in self._stats["daily"]:
                self._stats["daily"][day_key] = {
                    "total": 0,
                    "valid": 0,
                    "invalid": 0,
                    "error_rate": 0.0
                }
            
            self._stats["daily"][day_key]["total"] += 1
            self._stats["daily"][day_key]["valid"] += 1
            
            # Berechne Fehlerraten
            self._update_error_rates()
            
            # Speichere die Statistiken alle 1000 gültigen Pakete
            if self._stats["valid_packets"] % 1000 == 0:
                self._save_stats()
        except Exception as e:
            logger.error(f"Fehler in log_valid_packet: {e}")
            logger.error(traceback.format_exc())
    
    def _update_error_rates(self):
        """Aktualisiert alle Fehlerraten in den Statistiken."""
        try:
            # Gesamtfehlerrate
            if self._stats["total_packets"] > 0:
                self._stats["error_rate"] = self._stats["invalid_packets"] / self._stats["total_packets"]
            
            # Stündliche Fehlerraten
            if "hourly" in self._stats:
                for hour, data in self._stats["hourly"].items():
                    if data["total"] > 0:
                        data["error_rate"] = data["invalid"] / data["total"]
            
            # Tägliche Fehlerraten
            if "daily" in self._stats:
                for day, data in self._stats["daily"].items():
                    if data["total"] > 0:
                        data["error_rate"] = data["invalid"] / data["total"]
        except Exception as e:
            logger.error(f"Fehler in _update_error_rates: {e}")
            logger.error(traceback.format_exc())
    
    def _load_stats(self):
        """Lädt Paketstatistiken aus der Datei, falls vorhanden."""
        try:
            if os.path.exists(self._stats_file):
                with open(self._stats_file, 'r') as f:
                    loaded_stats = json.load(f)
                    # Merge loaded stats with default structure
                    for key, value in loaded_stats.items():
                        self._stats[key] = value
                logger.debug(f"Paketstatistiken geladen: {self._stats}")
            else:
                logger.info("📊 Keine vorhandenen Paketstatistiken gefunden, starte neue Aufzeichnung")
                # Stelle sicher, dass last_reset initialisiert ist
                self._stats["last_reset"] = datetime.now().isoformat()
        except Exception as e:
            logger.warning(f"Fehler beim Laden der Paketstatistiken: {e}")
            # Stelle sicher, dass last_reset initialisiert ist
            self._stats["last_reset"] = datetime.now().isoformat()
    
    def _save_stats(self):
        """Speichert Paketstatistiken in eine Datei."""
        try:
            with open(self._stats_file, 'w') as f:
                json.dump(self._stats, f, indent=2)
        except Exception as e:
            logger.warning(f"Fehler beim Speichern der Paketstatistiken: {e}")
    
    def _load_reports(self):
        """Lädt Paketberichte aus der Datei, falls vorhanden."""
        try:
            if os.path.exists(self._report_file):
                with open(self._report_file, 'r') as f:
                    loaded_reports = json.load(f)
                    # Merge loaded reports with default structure
                    for key, value in loaded_reports.items():
                        self._reports[key] = value
                logger.debug(f"Paketberichte geladen: {self._reports}")
            else:
                logger.info("📊 Keine vorhandenen Paketberichte gefunden, starte neue Aufzeichnung")
        except Exception as e:
            logger.warning(f"Fehler beim Laden der Paketberichte: {e}")
    
    def _save_reports(self):
        """Speichert Paketberichte in eine Datei."""
        try:
            with open(self._report_file, 'w') as f:
                json.dump(self._reports, f, indent=2)
        except Exception as e:
            logger.warning(f"Fehler beim Speichern der Paketberichte: {e}")
    
    async def start_monitoring(self):
        """Startet die Paketqualitätsüberwachung."""
        logger.info("📊 Starte Paketqualitäts-Monitoring...")
        
        # Starte die Tasks für die regelmäßigen Berichte
        asyncio.create_task(self._generate_hourly_reports())
        asyncio.create_task(self._generate_daily_reports())
        asyncio.create_task(self._generate_weekly_reports())
    
    async def _generate_hourly_reports(self):
        """Generiert stündliche Berichte über die Paketqualität."""
        # Berechne die Zeit bis zur nächsten vollen Stunde
        now = datetime.now()
        next_hour = (now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1))
        wait_seconds = (next_hour - now).total_seconds()
        
        await asyncio.sleep(wait_seconds)
        
        while True:
            try:
                # Generiere den stündlichen Bericht
                hour_key = datetime.now().strftime("%Y-%m-%d %H:00")
                
                # Hole die Daten für die aktuelle Stunde
                if "hourly" not in self._stats:
                    self._stats["hourly"] = {}
                    
                hour_data = self._stats["hourly"].get(hour_key, {
                    "total": 0,
                    "valid": 0,
                    "invalid": 0,
                    "error_rate": 0.0
                })
                
                # Erstelle den Bericht
                report = {
                    "timestamp": datetime.now().isoformat(),
                    "period": "hourly",
                    "data": hour_data,
                    "threshold_exceeded": hour_data["error_rate"] > self._error_threshold
                }
                
                # Füge den Bericht zur Liste hinzu
                self._reports["hourly"].append(report)
                
                # Begrenze die Anzahl der Berichte auf die letzten 24
                if len(self._reports["hourly"]) > 24:
                    self._reports["hourly"] = self._reports["hourly"][-24:]
                
                # Speichere die Berichte
                self._save_reports()
                
                # Protokolliere den Bericht nur bei signifikanten Daten
                if hour_data["total"] > 100:
                    logger.info(f"📊 Stündlicher Paketqualitäts-Bericht ({hour_key}):")
                    logger.info(f"   Gesamt: {hour_data['total']} Pakete")
                    logger.info(f"   Gültig: {hour_data['valid']} Pakete ({hour_data['valid']/hour_data['total']:.1%})")
                    logger.info(f"   Ungültig: {hour_data['invalid']} Pakete ({hour_data['error_rate']:.1%})")
                    
                    if hour_data["error_rate"] > self._error_threshold:
                        logger.warning(f"⚠️ Fehlerrate von {hour_data['error_rate']:.1%} überschreitet den Schwellwert!")
                
                # Warte bis zur nächsten vollen Stunde
                await asyncio.sleep(3600)
                
            except Exception as e:
                logger.error(f"Fehler bei der Generierung des stündlichen Berichts: {e}")
                logger.error(traceback.format_exc())
                await asyncio.sleep(60)  # Bei Fehlern eine Minute warten
    
    async def _generate_daily_reports(self):
        """Generiert tägliche Berichte über die Paketqualität."""
        # Berechne die Zeit bis zum nächsten Tag (00:00 Uhr)
        now = datetime.now()
        next_day = (now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1))
        wait_seconds = (next_day - now).total_seconds()
        
        # Protokolliere, wann der nächste Bericht erstellt wird
        hours_to_wait = wait_seconds / 3600
        logger.info(f"📅 Nächster täglicher Paketqualitäts-Bericht in {hours_to_wait:.1f} Stunden")
        
        await asyncio.sleep(wait_seconds)
        
        while True:
            try:
                # Generiere den täglichen Bericht
                day_key = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
                
                # Hole die Daten für den vorherigen Tag
                if "daily" not in self._stats:
                    self._stats["daily"] = {}
                    
                day_data = self._stats["daily"].get(day_key, {
                    "total": 0,
                    "valid": 0,
                    "invalid": 0,
                    "error_rate": 0.0
                })
                
                # Erstelle den Bericht
                report = {
                    "timestamp": datetime.now().isoformat(),
                    "period": "daily",
                    "date": day_key,
                    "data": day_data,
                    "threshold_exceeded": day_data["error_rate"] > self._error_threshold
                }
                
                # Füge den Bericht zur Liste hinzu
                self._reports["daily"].append(report)
                
                # Begrenze die Anzahl der Berichte auf die letzten 30
                if len(self._reports["daily"]) > 30:
                    self._reports["daily"] = self._reports["daily"][-30:]
                
                # Speichere die Berichte
                self._save_reports()
                
                # Protokolliere den Bericht nur bei signifikanten Daten
                if day_data["total"] > 1000:
                    logger.info(f"📊 Täglicher Paketqualitäts-Bericht ({day_key}):")
                    logger.info(f"   Gesamt: {day_data['total']} Pakete")
                    logger.info(f"   Gültig: {day_data['valid']} Pakete ({day_data['valid']/day_data['total']:.1%})")
                    logger.info(f"   Ungültig: {day_data['invalid']} Pakete ({day_data['error_rate']:.1%})")
                    
                    if day_data["error_rate"] > self._error_threshold:
                        logger.warning(f"⚠️ Fehlerrate von {day_data['error_rate']:.1%} überschreitet den Schwellwert!")
                
                # Warte bis zum nächsten Tag
                await asyncio.sleep(86400)
                
            except Exception as e:
                logger.error(f"Fehler bei der Generierung des täglichen Berichts: {e}")
                logger.error(traceback.format_exc())
                await asyncio.sleep(3600)  # Bei Fehlern eine Stunde warten
    
    async def _generate_weekly_reports(self):
        """Generiert wöchentliche Berichte über die Paketqualität."""
        # Berechne die Zeit bis zum nächsten Montag (00:00 Uhr)
        now = datetime.now()
        days_until_monday = (7 - now.weekday()) % 7
        if days_until_monday == 0:
            days_until_monday = 7
        
        next_monday = (now.replace(hour=0, minute=0, second=0, microsecond=0) + 
                       timedelta(days=days_until_monday))
        wait_seconds = (next_monday - now).total_seconds()
        
        # Protokolliere, wann der nächste Bericht erstellt wird
        days_to_wait = wait_seconds / 86400
        logger.info(f"📅 Nächster wöchentlicher Paketqualitäts-Bericht in {days_to_wait:.1f} Tagen")
        
        await asyncio.sleep(wait_seconds)
        
        while True:
            try:
                # Generiere den wöchentlichen Bericht
                end_date = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
                start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
                
                # Sammle die Daten für die letzte Woche
                week_data = {
                    "total": 0,
                    "valid": 0,
                    "invalid": 0,
                    "error_rate": 0.0,
                    "days": {}
                }
                
                # Sammle die täglichen Daten der letzten Woche
                if "daily" in self._stats:
                    for i in range(7):
                        day_key = (datetime.now() - timedelta(days=i+1)).strftime("%Y-%m-%d")
                        day_data = self._stats["daily"].get(day_key, {
                            "total": 0,
                            "valid": 0,
                            "invalid": 0,
                            "error_rate": 0.0
                        })
                        
                        week_data["total"] += day_data["total"]
                        week_data["valid"] += day_data["valid"]
                        week_data["invalid"] += day_data["invalid"]
                        week_data["days"][day_key] = day_data
                
                # Berechne die wöchentliche Fehlerrate
                if week_data["total"] > 0:
                    week_data["error_rate"] = week_data["invalid"] / week_data["total"]
                
                # Erstelle den Bericht
                report = {
                    "timestamp": datetime.now().isoformat(),
                    "period": "weekly",
                    "start_date": start_date,
                    "end_date": end_date,
                    "data": week_data,
                    "threshold_exceeded": week_data["error_rate"] > self._error_threshold
                }
                
                # Füge den Bericht zur Liste hinzu
                self._reports["weekly"].append(report)
                
                # Begrenze die Anzahl der Berichte auf die letzten 12
                if len(self._reports["weekly"]) > 12:
                    self._reports["weekly"] = self._reports["weekly"][-12:]
                
                # Speichere die Berichte
                self._save_reports()
                
                # Protokolliere den Bericht nur bei signifikanten Daten
                if week_data["total"] > 5000:
                    logger.info(f"📊 Wöchentlicher Paketqualitäts-Bericht ({start_date} bis {end_date}):")
                    logger.info(f"   Gesamt: {week_data['total']} Pakete")
                    logger.info(f"   Gültig: {week_data['valid']} Pakete ({week_data['valid']/week_data['total']:.1%})")
                    logger.info(f"   Ungültig: {week_data['invalid']} Pakete ({week_data['error_rate']:.1%})")
                    
                    if week_data["error_rate"] > self._error_threshold:
                        logger.warning(f"⚠️ Fehlerrate von {week_data['error_rate']:.1%} überschreitet den Schwellwert!")
                
                # Warte bis zum nächsten Montag
                await asyncio.sleep(7 * 86400)
                
            except Exception as e:
                logger.error(f"Fehler bei der Generierung des wöchentlichen Berichts: {e}")
                logger.error(traceback.format_exc())
                await asyncio.sleep(3600)  # Bei Fehlern eine Stunde warten
    
    def get_stats(self) -> Dict:
        """Gibt die aktuellen Paketstatistiken zurück."""
        return self._stats
    
    def get_reports(self) -> Dict:
        """Gibt die Paketberichte zurück."""
        return self._reports