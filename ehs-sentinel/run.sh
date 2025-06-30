#!/usr/bin/with-contenv bashio

# Get configuration from Home Assistant
CONFIG_PATH="/data/options.json"

# Log startup
bashio::log.info "Starting EHS-Sentinel Home Assistant Addon..."

# Check if config file exists
if bashio::fs.file_exists "$CONFIG_PATH"; then
    bashio::log.info "Configuration found, starting EHS-Sentinel..."
    
    # Start EHS-Sentinel with configuration from addon options
    cd /app
    python3 startEHSSentinel.py
else
    bashio::log.error "Configuration file not found!"
    exit 1
fi