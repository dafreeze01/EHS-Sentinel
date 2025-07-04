#!/usr/bin/with-contenv bashio

# Get configuration from Home Assistant
CONFIG_PATH="/data/options.json"

# Log startup
bashio::log.info "Starting EHS-Sentinel Home Assistant Addon..."

# Check if config file exists
if bashio::fs.file_exists "$CONFIG_PATH"; then
    bashio::log.info "Configuration found, starting EHS-Sentinel..."
    
    # Create data directories if they don't exist
    mkdir -p /data/reports
    mkdir -p /data/logs
    mkdir -p /data/documentation
    
    # Start the API server for the UI
    cd /app/tools
    python3 sensor_monitoring_api.py &
    
    # Wait a moment for the API server to start
    sleep 2
    
    # Start EHS-Sentinel with configuration from addon options
    cd /app
    python3 src/startEHSSentinel.py --addon-config "$CONFIG_PATH"
    
    # Schedule daily report generation
    (crontab -l 2>/dev/null; echo "0 0 * * * python3 /app/tools/generate_24h_report.py") | crontab -
else
    bashio::log.error "Configuration file not found!"
    exit 1
fi