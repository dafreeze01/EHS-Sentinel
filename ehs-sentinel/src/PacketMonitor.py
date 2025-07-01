import asyncio
import time
import datetime
from typing import Dict, List, Any, Optional
import json
import os
from collections import defaultdict

from CustomLogger import logger
from PollingManager import PollingManager

class PacketMonitor:
    """
    Überwacht die Paketqualität und erstellt regelmäßige Berichte.
    
    Funktionen:
    - Erfasst ungültige Pakete (ohne x34 Endkennung)
    - Erstellt stündliche Statistiken der Übertragungsfehler
    - Generiert tägliche und wöchentliche Berichte
    - Warnt bei Überschreitung des Schwellwerts (>5% fehlerhafte Pakete)
    """
    
    def __init__(self, polling_manager: PollingManager):
        """Initialisiert den PacketMonitor mit einem PollingManager."""
        self.polling_manager = polling_manager
        self.report_file = "/data/packet_reports.json"
        self.daily_report_time = "00:00"  # Täglicher Bericht um Mitternacht
        
        # Statistik-Tracking
        self.daily_reports = {}
        self.weekly_reports = {}
        
        # Lade vorhandene Berichte
        self._load_reports()
    
    def record_invalid_packet(self, packet_data: bytes, error_message: str):
        """
        Zeichnet ein ungültiges Paket auf.
        
        Args:
            packet_data: Die Rohdaten des ungültigen Pakets
            error_message: Die Fehlermeldung
        """
        # Informiere den PollingManager über das ungültige Paket
        self.polling_manager.record_packet(is_valid=False)
        
        # Logge Details für Debugging
        logger.warning(f"⚠️ Ungültiges Paket: {error_message}")
        logger.warning(f"⚠️ Paket-Hex: {[hex(x) for x in packet_data]}")
        logger.warning(f"⚠️ Paket-Rohdaten: {packet_data}")
    
    def record_valid_packet(self):
        """Zeichnet ein gültiges Paket auf."""
        # Informiere den PollingManager über das gültige Paket
        self.polling_manager.record_packet(is_valid=True)
    
    async def start_monitoring(self):
        """Startet die regelmäßige Berichterstattung."""
        logger.info("📊 Starte Paketqualitäts-Monitoring...")
        
        # Starte den täglichen Berichts-Task
        asyncio.create_task(self._schedule_daily_report())
        
        # Starte den wöchentlichen Berichts-Task
        asyncio.create_task(self._schedule_weekly_report())
    
    async def _schedule_daily_report(self):
        """Plant den täglichen Bericht."""
        while True:
            # Berechne Zeit bis zum nächsten täglichen Bericht
            now = datetime.datetime.now()
            report_hour, report_minute = map(int, self.daily_report_time.split(':'))
            next_report = now.replace(hour=report_hour, minute=report_minute, second=0, microsecond=0)
            
            if next_report <= now:
                next_report = next_report + datetime.timedelta(days=1)
                
            wait_seconds = (next_report - now).total_seconds()
            logger.info(f"📅 Nächster täglicher Paketqualitäts-Bericht in {wait_seconds/3600:.1f} Stunden")
            
            await asyncio.sleep(wait_seconds)
            
            # Generiere und speichere den täglichen Bericht
            report = self.polling_manager.generate_report()
            report_date = now.strftime("%Y-%m-%d")
            self.daily_reports[report_date] = report
            self._save_reports()
            
            logger.info(f"📊 Täglicher Paketqualitäts-Bericht erstellt für {report_date}")
            logger.info(report.split('\n')[0])  # Zeige nur die erste Zeile im Log
    
    async def _schedule_weekly_report(self):
        """Plant den wöchentlichen Bericht."""
        while True:
            # Berechne Zeit bis zum nächsten wöchentlichen Bericht (Sonntag)
            now = datetime.datetime.now()
            days_until_sunday = 6 - now.weekday() if now.weekday() < 6 else 7
            next_report = now.replace(hour=0, minute=0, second=0, microsecond=0) + datetime.timedelta(days=days_until_sunday)
            
            wait_seconds = (next_report - now).total_seconds()
            logger.info(f"📅 Nächster wöchentlicher Paketqualitäts-Bericht in {wait_seconds/86400:.1f} Tagen")
            
            await asyncio.sleep(wait_seconds)
            
            # Generiere und speichere den wöchentlichen Bericht
            report = self._generate_weekly_report()
            report_week = now.strftime("%Y-W%W")
            self.weekly_reports[report_week] = report
            self._save_reports()
            
            logger.info(f"📊 Wöchentlicher Paketqualitäts-Bericht erstellt für {report_week}")
            logger.info(report.split('\n')[0])  # Zeige nur die erste Zeile im Log
    
    def _generate_weekly_report(self) -> str:
        """
        Generiert einen wöchentlichen Bericht basierend auf den täglichen Berichten.
        
        Returns:
            Formatierter wöchentlicher Bericht als String
        """
        now = datetime.datetime.now()
        start_of_week = now - datetime.timedelta(days=now.weekday() + 1)
        end_of_week = start_of_week + datetime.timedelta(days=6)
        
        report = [
            "📊 EHS-Sentinel Wöchentlicher Paketqualitäts-Bericht",
            "=" * 60,
            f"Zeitraum: {start_of_week.strftime('%Y-%m-%d')} bis {end_of_week.strftime('%Y-%m-%d')}",
            "",
            "Tägliche Zusammenfassung:",
            "-" * 60
        ]
        
        # Sammle Daten aus den täglichen Berichten der letzten Woche
        weekly_total = 0
        weekly_invalid = 0
        daily_stats = []
        
        for i in range(7):
            day = start_of_week + datetime.timedelta(days=i)
            day_key = day.strftime("%Y-%m-%d")
            
            if day_key in self.daily_reports:
                # Extrahiere Zahlen aus dem täglichen Bericht
                daily_report = self.daily_reports[day_key]
                try:
                    total_line = [line for line in daily_report.split('\n') if "Gesamtpakete:" in line][0]
                    invalid_line = [line for line in daily_report.split('\n') if "Ungültige Pakete:" in line][0]
                    
                    total = int(total_line.split(": ")[1])
                    invalid = int(invalid_line.split(": ")[1])
                    
                    weekly_total += total
                    weekly_invalid += invalid
                    
                    error_rate = (invalid / total * 100) if total > 0 else 0
                    status = "✅ Gut" if error_rate <= 5 else "⚠️ Problematisch"
                    
                    daily_stats.append((day_key, total, invalid, error_rate, status))
                except (IndexError, ValueError):
                    daily_stats.append((day_key, "Keine Daten", "Keine Daten", 0, "❓ Unbekannt"))
            else:
                daily_stats.append((day_key, "Keine Daten", "Keine Daten", 0, "❓ Unbekannt"))
        
        # Füge tägliche Statistiken zum Bericht hinzu
        for day_key, total, invalid, error_rate, status in daily_stats:
            if isinstance(total, int) and isinstance(invalid, int):
                report.append(f"{day_key}: {total} Pakete, {invalid} ungültig ({error_rate:.2f}%) - {status}")
            else:
                report.append(f"{day_key}: {total}, {invalid} - {status}")
        
        # Füge wöchentliche Zusammenfassung hinzu
        report.extend([
            "",
            "Wöchentliche Zusammenfassung:",
            "-" * 60
        ])
        
        if weekly_total > 0:
            weekly_error_rate = (weekly_invalid / weekly_total * 100)
            weekly_status = "✅ Gut" if weekly_error_rate <= 5 else "⚠️ Problematisch"
            
            report.extend([
                f"Gesamtpakete: {weekly_total}",
                f"Ungültige Pakete: {weekly_invalid}",
                f"Fehlerrate: {weekly_error_rate:.2f}% - {weekly_status}"
            ])
        else:
            report.append("Keine ausreichenden Daten für eine wöchentliche Zusammenfassung.")
        
        # Füge Empfehlungen hinzu
        report.extend([
            "",
            "Empfehlungen:",
            "-" * 60
        ])
        
        if weekly_total > 0 and (weekly_invalid / weekly_total * 100) > 5:
            report.extend([
                "⚠️ Die wöchentliche Paketfehlerrate ist zu hoch (>5%). Bitte überprüfen Sie:",
                "1. Physische Verbindung (Kabel, Stecker, Adapter)",
                "2. WLAN-Kanal bei Funkstörungen",
                "3. Modbus-Einstellungen (Baudrate, Parität)",
                "4. Elektromagnetische Störquellen in der Nähe",
                "",
                "Erwägen Sie eine Reduzierung der Polling-Frequenz, um die Belastung zu verringern."
            ])
        else:
            report.append("✅ Die wöchentliche Verbindungsqualität ist gut. Keine Maßnahmen erforderlich.")
        
        return "\n".join(report)
    
    def _save_reports(self):
        """Speichert die Berichte in eine JSON-Datei."""
        try:
            reports_data = {
                "daily_reports": self.daily_reports,
                "weekly_reports": self.weekly_reports,
                "last_updated": datetime.datetime.now().isoformat()
            }
            
            with open(self.report_file, 'w') as f:
                json.dump(reports_data, f, indent=2)
                
            logger.debug(f"📊 Paketberichte gespeichert: {self.report_file}")
        except Exception as e:
            logger.error(f"❌ Fehler beim Speichern der Paketberichte: {e}")
    
    def _load_reports(self):
        """Lädt vorhandene Berichte aus der JSON-Datei."""
        if not os.path.exists(self.report_file):
            logger.info(f"📊 Keine vorhandenen Paketberichte gefunden, starte neue Aufzeichnung")
            return
            
        try:
            with open(self.report_file, 'r') as f:
                reports_data = json.load(f)
                
            self.daily_reports = reports_data.get("daily_reports", {})
            self.weekly_reports = reports_data.get("weekly_reports", {})
                
            logger.info(f"📊 Paketberichte geladen: {len(self.daily_reports)} tägliche, {len(self.weekly_reports)} wöchentliche")
        except Exception as e:
            logger.error(f"❌ Fehler beim Laden der Paketberichte: {e}")