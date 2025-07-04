"""
API-Endpunkte für Sensor-Monitoring und Konfiguration
Stellt REST-API für die Addon-UI bereit
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import sys
import os
from datetime import datetime

# Füge src-Verzeichnis zum Python-Pfad hinzu
sys.path.append('/app')

# Importiere Module
from SensorMonitor import sensor_monitor
from MQTTCommunicationAnalyzer import mqtt_analyzer
from ConfigurationManager import config_manager
from LoggingSystem import structured_logger, LogLevel, LogCategory
from TechnicalDocumentation import tech_docs

app = Flask(__name__)
CORS(app)

@app.route('/api/sensors/status', methods=['GET'])
def get_sensors_status():
    """Gibt den Status aller Sensoren zurück"""
    try:
        overview = sensor_monitor.get_system_overview()
        return jsonify({
            "success": True,
            "data": overview
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/sensors/<sensor_name>/status', methods=['GET'])
def get_sensor_status(sensor_name):
    """Gibt den Status eines spezifischen Sensors zurück"""
    try:
        status = sensor_monitor.get_sensor_status(sensor_name)
        
        if "error" in status:
            return jsonify({
                "success": False,
                "error": status["error"]
            }), 404
        
        return jsonify({
            "success": True,
            "data": status
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/groups/<group_name>/status', methods=['GET'])
def get_group_status(group_name):
    """Gibt den Status einer Sensor-Gruppe zurück"""
    try:
        status = sensor_monitor.get_group_status(group_name)
        
        if "error" in status:
            return jsonify({
                "success": False,
                "error": status["error"]
            }), 404
        
        return jsonify({
            "success": True,
            "data": status
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/mqtt/stats', methods=['GET'])
def get_mqtt_stats():
    """Gibt MQTT-Kommunikationsstatistiken zurück"""
    try:
        stats = mqtt_analyzer.get_communication_stats()
        return jsonify({
            "success": True,
            "data": stats
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/mqtt/history/<sensor_name>', methods=['GET'])
def get_mqtt_history(sensor_name):
    """Gibt MQTT-Kommunikationshistorie für einen Sensor zurück"""
    try:
        hours = request.args.get('hours', 24, type=int)
        history = mqtt_analyzer.get_sensor_communication_history(sensor_name, hours)
        
        return jsonify({
            "success": True,
            "data": history
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/config/ui', methods=['GET'])
def get_ui_config():
    """Gibt UI-Konfiguration zurück"""
    try:
        ui_config = config_manager.get_addon_ui_config()
        return jsonify({
            "success": True,
            "data": ui_config
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/config/polling', methods=['GET'])
def get_polling_config():
    """Gibt Polling-Konfiguration zurück"""
    try:
        polling_config = config_manager.get_polling_configuration()
        return jsonify({
            "success": True,
            "data": polling_config
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/config/parameter/<parameter_name>', methods=['PUT'])
def update_parameter_config(parameter_name):
    """Aktualisiert Parameter-Konfiguration"""
    try:
        updates = request.get_json()
        
        if not updates:
            return jsonify({
                "success": False,
                "error": "No update data provided"
            }), 400
        
        success = config_manager.update_parameter_config(parameter_name, updates)
        
        if not success:
            return jsonify({
                "success": False,
                "error": "Parameter not found"
            }), 404
        
        return jsonify({
            "success": True,
            "message": f"Parameter {parameter_name} updated successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/config/group/<group_name>', methods=['PUT'])
def update_group_config(group_name):
    """Aktualisiert Gruppen-Konfiguration"""
    try:
        updates = request.get_json()
        
        if not updates:
            return jsonify({
                "success": False,
                "error": "No update data provided"
            }), 400
        
        success = config_manager.update_group_config(group_name, updates)
        
        if not success:
            return jsonify({
                "success": False,
                "error": "Group not found"
            }), 404
        
        return jsonify({
            "success": True,
            "message": f"Group {group_name} updated successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """Gibt gefilterte Logs zurück"""
    try:
        # Parse Query-Parameter
        filters = {}
        
        if request.args.get('level'):
            filters['level'] = request.args.get('level')
        
        if request.args.get('category'):
            filters['category'] = request.args.get('category')
        
        if request.args.get('sensor_name'):
            filters['sensor_name'] = request.args.get('sensor_name')
        
        if request.args.get('start_time'):
            filters['start_time'] = request.args.get('start_time')
        
        if request.args.get('end_time'):
            filters['end_time'] = request.args.get('end_time')
        
        if request.args.get('errors_only'):
            filters['errors_only'] = request.args.get('errors_only').lower() == 'true'
        
        limit = request.args.get('limit', 100, type=int)
        
        logs = structured_logger.get_logs(filters, limit)
        
        return jsonify({
            "success": True,
            "data": {
                "logs": logs,
                "filters_applied": filters,
                "total_returned": len(logs)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/logs/stats', methods=['GET'])
def get_log_stats():
    """Gibt Log-Statistiken zurück"""
    try:
        hours = request.args.get('hours', 24, type=int)
        stats = structured_logger.get_log_statistics(hours)
        
        return jsonify({
            "success": True,
            "data": stats
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/logs/export', methods=['GET'])
def export_logs():
    """Exportiert Logs in verschiedenen Formaten"""
    try:
        # Parse Filter
        filters = {}
        for key in ['level', 'category', 'sensor_name', 'start_time', 'end_time']:
            if request.args.get(key):
                filters[key] = request.args.get(key)
        
        if request.args.get('errors_only'):
            filters['errors_only'] = request.args.get('errors_only').lower() == 'true'
        
        format_type = request.args.get('format', 'json')
        
        exported_data = structured_logger.export_logs(filters, format_type)
        
        # Bestimme Content-Type
        if format_type == 'csv':
            content_type = 'text/csv'
            filename = f"ehs_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        else:
            content_type = 'application/json'
            filename = f"ehs_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        response = app.response_class(
            exported_data,
            mimetype=content_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
        return response
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/documentation/generate', methods=['POST'])
def generate_documentation():
    """Generiert technische Dokumentation"""
    try:
        output_dir = request.json.get('output_dir', '/data/documentation')
        
        docs = tech_docs.generate_complete_documentation(output_dir)
        
        return jsonify({
            "success": True,
            "data": {
                "message": "Documentation generated successfully",
                "files": docs
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/documentation/mqtt', methods=['GET'])
def get_mqtt_documentation():
    """Gibt MQTT-Dokumentation zurück"""
    try:
        doc = tech_docs.generate_mqtt_documentation()
        
        return jsonify({
            "success": True,
            "data": {
                "content": doc,
                "format": "markdown"
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/documentation/conversion', methods=['GET'])
def get_conversion_documentation():
    """Gibt Datenkonvertierungs-Dokumentation zurück"""
    try:
        doc = tech_docs.generate_conversion_documentation()
        
        return jsonify({
            "success": True,
            "data": {
                "content": doc,
                "format": "markdown"
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/documentation/troubleshooting', methods=['GET'])
def get_troubleshooting_documentation():
    """Gibt Fehlerbehebungs-Dokumentation zurück"""
    try:
        doc = tech_docs.generate_troubleshooting_documentation()
        
        return jsonify({
            "success": True,
            "data": {
                "content": doc,
                "format": "markdown"
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Gesundheitscheck für die API"""
    try:
        # Prüfe System-Status
        overview = sensor_monitor.get_system_overview()
        mqtt_stats = mqtt_analyzer.get_communication_stats()
        log_stats = structured_logger.get_log_statistics(1)  # Letzte Stunde
        
        health_status = {
            "api": "healthy",
            "sensor_monitor": "healthy" if overview["overall_health"] > 50 else "degraded",
            "mqtt_communication": "healthy" if mqtt_stats["flow_stats"]["success_rate"] > 80 else "degraded",
            "logging_system": "healthy" if log_stats["error_rate"] < 10 else "degraded",
            "timestamp": datetime.now().isoformat()
        }
        
        overall_healthy = all(status in ["healthy", "degraded"] for status in health_status.values() if isinstance(status, str))
        
        return jsonify({
            "success": True,
            "data": {
                "overall_status": "healthy" if overall_healthy else "unhealthy",
                "components": health_status
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "data": {
                "overall_status": "unhealthy",
                "components": {
                    "api": "unhealthy",
                    "error": str(e)
                }
            }
        }), 500

if __name__ == '__main__':
    print("🚀 Starting EHS-Sentinel Monitoring API...")
    print("📊 Available endpoints:")
    print("  - GET  /api/sensors/status")
    print("  - GET  /api/sensors/<name>/status")
    print("  - GET  /api/groups/<name>/status")
    print("  - GET  /api/mqtt/stats")
    print("  - GET  /api/mqtt/history/<sensor>")
    print("  - GET  /api/config/ui")
    print("  - GET  /api/config/polling")
    print("  - PUT  /api/config/parameter/<name>")
    print("  - PUT  /api/config/group/<name>")
    print("  - GET  /api/logs")
    print("  - GET  /api/logs/stats")
    print("  - GET  /api/logs/export")
    print("  - GET  /api/documentation/*")
    print("  - GET  /api/health")
    print("")
    
    app.run(host='0.0.0.0', port=5000, debug=False)