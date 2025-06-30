#!/usr/bin/with-contenv bashio

# Get configuration from Home Assistant
CONFIG_PATH="/data/options.json"

# Start EHS-Sentinel with configuration from addon options
python3 /app/startEHSSentinel.py --addon-config "$CONFIG_PATH"