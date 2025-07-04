// EHS-Sentinel UI JavaScript
console.log("Initializing EHS-Sentinel UI...");

// Global variables
let currentTab = 'dashboard';
let sensorData = {};
let mqttData = {};
let logsData = {};
let configData = {};
let docData = {};

// Initialize the UI
document.addEventListener('DOMContentLoaded', function() {
    // Set up tab navigation
    setupTabs();
    
    // Load initial data
    loadDashboardData();
    
    // Set up refresh buttons
    document.getElementById('refresh-sensors').addEventListener('click', loadSensorsData);
    document.getElementById('refresh-mqtt').addEventListener('click', loadMQTTData);
    document.getElementById('refresh-logs').addEventListener('click', loadLogsData);
    document.getElementById('refresh-config').addEventListener('click', loadConfigData);
    
    // Set up export buttons
    document.getElementById('export-logs').addEventListener('click', exportLogs);
    document.getElementById('generate-docs').addEventListener('click', generateDocumentation);
    
    // Set up documentation tabs
    setupDocTabs();
    
    // Set up modal close buttons
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('sensor-details-modal').classList.add('hidden');
    });
    
    document.getElementById('close-group-modal').addEventListener('click', function() {
        document.getElementById('group-edit-modal').classList.add('hidden');
    });
    
    // Set up modal save buttons
    document.getElementById('modal-save-config').addEventListener('click', saveSensorConfig);
    document.getElementById('group-modal-save').addEventListener('click', saveGroupConfig);
    
    // Set up filter change handlers
    document.getElementById('group-filter').addEventListener('change', filterSensors);
    document.getElementById('status-filter').addEventListener('change', filterSensors);
    document.getElementById('config-group-filter').addEventListener('change', filterConfigParams);
    
    // Set up MQTT history loading
    document.getElementById('mqtt-load-history').addEventListener('click', loadMQTTHistory);
    
    // Set up log filter application
    document.getElementById('apply-log-filters').addEventListener('click', applyLogFilters);
    document.getElementById('load-more-logs').addEventListener('click', loadMoreLogs);
});

// Load dashboard data
function loadDashboardData() {
    console.log("Loading dashboard data...");
    
    // Load health data
    fetch('/api/health')
        .then(response => response.json())
        .then(data => {
            updateSystemHealth(data);
        })
        .catch(error => {
            console.error("Error loading health data:", error);
        });
    
    // Load sensor stats
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            updateSensorStats(data);
        })
        .catch(error => {
            console.error("Error loading sensor stats:", error);
        });
    
    // Load MQTT stats
    fetch('/api/mqtt/stats')
        .then(response => response.json())
        .then(data => {
            updateMQTTStats(data);
        })
        .catch(error => {
            console.error("Error loading MQTT stats:", error);
        });
    
    // Load log stats
    fetch('/api/logs/stats')
        .then(response => response.json())
        .then(data => {
            updateLogStats(data);
        })
        .catch(error => {
            console.error("Error loading log stats:", error);
        });
}

// Update system health display
function updateSystemHealth(data) {
    if (!data || !data.success) {
        document.getElementById('system-health').textContent = "Nicht verfügbar";
        document.getElementById('system-health').className = "px-3 py-1 rounded-full text-sm font-semibold bg-gray-200 text-gray-800";
        return;
    }
    
    const status = data.data.overall_status;
    const healthElement = document.getElementById('system-health');
    
    if (status === 'healthy') {
        healthElement.textContent = "Gesund";
        healthElement.className = "px-3 py-1 rounded-full text-sm font-semibold bg-green-200 text-green-800";
    } else if (status === 'degraded') {
        healthElement.textContent = "Eingeschränkt";
        healthElement.className = "px-3 py-1 rounded-full text-sm font-semibold bg-yellow-200 text-yellow-800";
    } else {
        healthElement.textContent = "Fehlerhaft";
        healthElement.className = "px-3 py-1 rounded-full text-sm font-semibold bg-red-200 text-red-800";
    }
    
    // Update last update time
    document.getElementById('last-update').textContent = "Aktualisiert: " + new Date().toLocaleTimeString();
}

// Update sensor statistics display
function updateSensorStats(data) {
    if (!data || !data.success) {
        document.getElementById('overall-health').textContent = "Nicht verfügbar";
        document.getElementById('active-sensors').textContent = "Nicht verfügbar";
        document.getElementById('error-sensors').textContent = "Nicht verfügbar";
        document.getElementById('unknown-sensors').textContent = "Nicht verfügbar";
        return;
    }
    
    const stats = data.data;
    
    document.getElementById('overall-health').textContent = stats.overall_health + "%";
    document.getElementById('active-sensors').textContent = stats.active_sensors + "/" + stats.total_sensors;
    document.getElementById('error-sensors').textContent = stats.error_sensors;
    document.getElementById('unknown-sensors').textContent = stats.unknown_sensors;
    
    // Update critical sensors table
    updateCriticalSensorsTable(stats);
}

// Update critical sensors table
function updateCriticalSensorsTable(stats) {
    const tableBody = document.getElementById('critical-sensors-table');
    tableBody.innerHTML = '';
    
    // Get critical sensors (priority 1 and 2)
    const criticalSensors = [];
    
    for (const groupName in stats.groups) {
        const group = stats.groups[groupName];
        if (group.priority <= 2) {
            for (const sensor of group.sensors) {
                criticalSensors.push(sensor);
            }
        }
    }
    
    // Sort by status (error first)
    criticalSensors.sort((a, b) => {
        if (a.status === 'error' && b.status !== 'error') return -1;
        if (a.status !== 'error' && b.status === 'error') return 1;
        return 0;
    });
    
    // Display up to 5 critical sensors
    const sensorsToShow = criticalSensors.slice(0, 5);
    
    for (const sensor of sensorsToShow) {
        const row = document.createElement('tr');
        
        // Sensor name
        const nameCell = document.createElement('td');
        nameCell.className = "px-6 py-4 whitespace-nowrap";
        nameCell.textContent = sensor.name;
        row.appendChild(nameCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = "px-6 py-4 whitespace-nowrap";
        
        const statusBadge = document.createElement('span');
        statusBadge.className = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full ";
        
        switch (sensor.status) {
            case 'active':
                statusBadge.classList.add('bg-green-100', 'text-green-800');
                statusBadge.textContent = "Aktiv";
                break;
            case 'error':
                statusBadge.classList.add('bg-red-100', 'text-red-800');
                statusBadge.textContent = "Fehler";
                break;
            case 'timeout':
                statusBadge.classList.add('bg-yellow-100', 'text-yellow-800');
                statusBadge.textContent = "Timeout";
                break;
            default:
                statusBadge.classList.add('bg-gray-100', 'text-gray-800');
                statusBadge.textContent = "Unbekannt";
        }
        
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        // Last value
        const valueCell = document.createElement('td');
        valueCell.className = "px-6 py-4 whitespace-nowrap";
        if (sensor.last_reading && sensor.last_reading.value !== null) {
            valueCell.textContent = sensor.last_reading.value;
        } else {
            valueCell.textContent = "-";
        }
        row.appendChild(valueCell);
        
        // Timestamp
        const timeCell = document.createElement('td');
        timeCell.className = "px-6 py-4 whitespace-nowrap";
        if (sensor.last_reading && sensor.last_reading.timestamp) {
            const date = new Date(sensor.last_reading.timestamp);
            timeCell.textContent = date.toLocaleTimeString();
        } else {
            timeCell.textContent = "-";
        }
        row.appendChild(timeCell);
        
        // Response time
        const responseCell = document.createElement('td');
        responseCell.className = "px-6 py-4 whitespace-nowrap";
        if (sensor.last_reading && sensor.last_reading.response_time_ms) {
            responseCell.textContent = sensor.last_reading.response_time_ms.toFixed(2) + " ms";
        } else {
            responseCell.textContent = "-";
        }
        row.appendChild(responseCell);
        
        tableBody.appendChild(row);
    }
    
    // If no critical sensors, show a message
    if (sensorsToShow.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 5;
        cell.className = "px-6 py-4 text-center text-gray-500";
        cell.textContent = "Keine kritischen Sensoren gefunden";
        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

// Update MQTT statistics display
function updateMQTTStats(data) {
    if (!data || !data.success) {
        document.getElementById('mqtt-total-messages').textContent = "Nicht verfügbar";
        document.getElementById('mqtt-recent-messages').textContent = "Nicht verfügbar";
        document.getElementById('mqtt-success-rate').textContent = "Nicht verfügbar";
        document.getElementById('mqtt-response-time').textContent = "Nicht verfügbar";
        return;
    }
    
    const stats = data.data;
    
    document.getElementById('mqtt-total-messages').textContent = stats.message_stats.total_messages;
    document.getElementById('mqtt-recent-messages').textContent = stats.message_stats.messages_last_hour;
    document.getElementById('mqtt-success-rate').textContent = stats.flow_stats.success_rate + "%";
    document.getElementById('mqtt-response-time').textContent = stats.flow_stats.avg_response_time_ms + " ms";
    
    // Update recent errors
    updateRecentErrors(stats.recent_errors);
}

// Update log statistics display
function updateLogStats(data) {
    if (!data || !data.success) {
        document.getElementById('log-total-entries').textContent = "Nicht verfügbar";
        document.getElementById('log-error-count').textContent = "Nicht verfügbar";
        document.getElementById('log-error-rate').textContent = "Nicht verfügbar";
        document.getElementById('log-avg-duration').textContent = "Nicht verfügbar";
        return;
    }
    
    const stats = data.data;
    
    document.getElementById('log-total-entries').textContent = stats.total_entries;
    document.getElementById('log-error-count').textContent = stats.level_breakdown.ERROR || 0;
    document.getElementById('log-error-rate').textContent = stats.error_rate + "%";
    document.getElementById('log-avg-duration').textContent = stats.performance.avg_duration_ms + " ms";
}

// Update recent errors display
function updateRecentErrors(errors) {
    const container = document.getElementById('recent-errors');
    container.innerHTML = '';
    
    if (!errors || errors.length === 0) {
        const message = document.createElement('div');
        message.className = "p-4 bg-green-50 rounded-lg";
        message.textContent = "Keine aktuellen Fehler";
        container.appendChild(message);
        return;
    }
    
    for (const error of errors) {
        const errorCard = document.createElement('div');
        errorCard.className = "p-4 bg-red-50 rounded-lg";
        
        const header = document.createElement('div');
        header.className = "flex justify-between items-center mb-2";
        
        const title = document.createElement('h4');
        title.className = "font-semibold text-red-800";
        title.textContent = error.type.replace('_', ' ').toUpperCase();
        
        const time = document.createElement('span');
        time.className = "text-sm text-gray-500";
        const date = new Date(error.timestamp);
        time.textContent = date.toLocaleTimeString();
        
        header.appendChild(title);
        header.appendChild(time);
        
        const message = document.createElement('p');
        message.className = "text-sm text-red-700";
        message.textContent = error.message;
        
        const details = document.createElement('p');
        details.className = "text-xs text-gray-600 mt-1";
        details.textContent = error.details;
        
        errorCard.appendChild(header);
        errorCard.appendChild(message);
        errorCard.appendChild(details);
        
        container.appendChild(errorCard);
    }
}

// Set up tab navigation
function setupTabs() {
    const tabs = ['dashboard', 'sensors', 'mqtt', 'logs', 'config', 'docs'];
    
    for (const tab of tabs) {
        document.getElementById(`tab-${tab}`).addEventListener('click', function() {
            // Hide all tab contents
            for (const t of tabs) {
                document.getElementById(`view-${t}`).classList.add('hidden');
                document.getElementById(`tab-${t}`).classList.remove('tab-active');
                document.getElementById(`tab-${t}`).classList.add('tab-inactive');
            }
            
            // Show selected tab content
            document.getElementById(`view-${tab}`).classList.remove('hidden');
            document.getElementById(`tab-${tab}`).classList.remove('tab-inactive');
            document.getElementById(`tab-${tab}`).classList.add('tab-active');
            
            // Update current tab
            currentTab = tab;
            
            // Load data for the tab if needed
            if (tab === 'sensors' && Object.keys(sensorData).length === 0) {
                loadSensorsData();
            } else if (tab === 'mqtt' && Object.keys(mqttData).length === 0) {
                loadMQTTData();
            } else if (tab === 'logs' && Object.keys(logsData).length === 0) {
                loadLogsData();
            } else if (tab === 'config' && Object.keys(configData).length === 0) {
                loadConfigData();
            } else if (tab === 'docs' && Object.keys(docData).length === 0) {
                loadDocumentation();
            }
        });
    }
}

// Set up documentation tabs
function setupDocTabs() {
    const docTabs = ['mqtt', 'conversion', 'troubleshooting'];
    
    for (const tab of docTabs) {
        document.getElementById(`doc-tab-${tab}`).addEventListener('click', function() {
            // Hide all doc contents
            for (const t of docTabs) {
                document.getElementById(`doc-view-${t}`).classList.add('hidden');
                document.getElementById(`doc-tab-${t}`).classList.remove('tab-active');
                document.getElementById(`doc-tab-${t}`).classList.add('tab-inactive');
            }
            
            // Show selected doc content
            document.getElementById(`doc-view-${tab}`).classList.remove('hidden');
            document.getElementById(`doc-tab-${tab}`).classList.remove('tab-inactive');
            document.getElementById(`doc-tab-${tab}`).classList.add('tab-active');
            
            // Load documentation if needed
            loadSpecificDocumentation(tab);
        });
    }
}

// Load sensors data
function loadSensorsData() {
    console.log("Loading sensors data...");
    
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("Error loading sensors:", data.error);
                return;
            }
            
            sensorData = data.data;
            
            // Populate group filter
            const groupFilter = document.getElementById('group-filter');
            groupFilter.innerHTML = '<option value="all">Alle Gruppen</option>';
            
            for (const groupName in sensorData.groups) {
                const option = document.createElement('option');
                option.value = groupName;
                option.textContent = sensorData.groups[groupName].display_name || groupName;
                groupFilter.appendChild(option);
            }
            
            // Display sensors
            displaySensors();
        })
        .catch(error => {
            console.error("Error loading sensors data:", error);
        });
}

// Display sensors based on current filters
function displaySensors() {
    const tableBody = document.getElementById('sensors-table');
    tableBody.innerHTML = '';
    
    const groupFilter = document.getElementById('group-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    
    let filteredSensors = [];
    
    // Collect sensors from all groups or specific group
    if (groupFilter === 'all') {
        for (const groupName in sensorData.groups) {
            filteredSensors = filteredSensors.concat(sensorData.groups[groupName].sensors);
        }
    } else if (sensorData.groups[groupFilter]) {
        filteredSensors = sensorData.groups[groupFilter].sensors;
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filteredSensors = filteredSensors.filter(sensor => sensor.status === statusFilter);
    }
    
    // Sort by name
    filteredSensors.sort((a, b) => a.name.localeCompare(b.name));
    
    // Display sensors
    for (const sensor of filteredSensors) {
        const row = document.createElement('tr');
        
        // Add priority class
        if (sensor.priority) {
            row.classList.add(`priority-${sensor.priority}`);
        }
        
        // Sensor name
        const nameCell = document.createElement('td');
        nameCell.className = "px-6 py-4 whitespace-nowrap";
        nameCell.textContent = sensor.name;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = "px-6 py-4 whitespace-nowrap";
        descCell.textContent = sensor.description || "-";
        row.appendChild(descCell);
        
        // Group
        const groupCell = document.createElement('td');
        groupCell.className = "px-6 py-4 whitespace-nowrap";
        groupCell.textContent = sensor.group || "-";
        row.appendChild(groupCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = "px-6 py-4 whitespace-nowrap";
        
        const statusBadge = document.createElement('span');
        statusBadge.className = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full ";
        
        switch (sensor.status) {
            case 'active':
                statusBadge.classList.add('status-active');
                statusBadge.textContent = "Aktiv";
                break;
            case 'error':
                statusBadge.classList.add('status-error');
                statusBadge.textContent = "Fehler";
                break;
            case 'timeout':
                statusBadge.classList.add('status-timeout');
                statusBadge.textContent = "Timeout";
                break;
            case 'crc_error':
                statusBadge.classList.add('status-crc_error');
                statusBadge.textContent = "CRC Fehler";
                break;
            case 'offline':
                statusBadge.classList.add('status-offline');
                statusBadge.textContent = "Offline";
                break;
            default:
                statusBadge.classList.add('status-unknown');
                statusBadge.textContent = "Unbekannt";
        }
        
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        // Last value
        const valueCell = document.createElement('td');
        valueCell.className = "px-6 py-4 whitespace-nowrap";
        if (sensor.last_reading && sensor.last_reading.value !== null) {
            valueCell.textContent = sensor.last_reading.value;
            if (sensor.unit) {
                valueCell.textContent += " " + sensor.unit;
            }
        } else {
            valueCell.textContent = "-";
        }
        row.appendChild(valueCell);
        
        // Timestamp
        const timeCell = document.createElement('td');
        timeCell.className = "px-6 py-4 whitespace-nowrap";
        if (sensor.last_reading && sensor.last_reading.timestamp) {
            const date = new Date(sensor.last_reading.timestamp);
            timeCell.textContent = date.toLocaleString();
        } else {
            timeCell.textContent = "-";
        }
        row.appendChild(timeCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = "px-6 py-4 whitespace-nowrap text-right text-sm font-medium";
        
        const detailsButton = document.createElement('button');
        detailsButton.className = "text-indigo-600 hover:text-indigo-900 mr-2";
        detailsButton.textContent = "Details";
        detailsButton.addEventListener('click', function() {
            showSensorDetails(sensor);
        });
        
        actionsCell.appendChild(detailsButton);
        
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    }
    
    // If no sensors, show a message
    if (filteredSensors.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.className = "px-6 py-4 text-center text-gray-500";
        cell.textContent = "Keine Sensoren gefunden";
        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

// Show sensor details in modal
function showSensorDetails(sensor) {
    // Set modal title
    document.getElementById('modal-sensor-name').textContent = sensor.name;
    
    // Set sensor info
    document.getElementById('modal-description').textContent = sensor.description || "-";
    document.getElementById('modal-group').textContent = sensor.group || "-";
    document.getElementById('modal-priority').textContent = sensor.priority || "-";
    document.getElementById('modal-polling').textContent = sensor.polling_interval ? `${sensor.polling_interval}s` : "-";
    document.getElementById('modal-enabled').textContent = sensor.enabled ? "Ja" : "Nein";
    document.getElementById('modal-writable').textContent = sensor.writable ? "Ja" : "Nein";
    document.getElementById('modal-address').textContent = sensor.nasa_address || "-";
    document.getElementById('modal-entity-id').textContent = sensor.hass_entity_id || "-";
    
    // Set status info
    document.getElementById('modal-status').textContent = getStatusText(sensor.status);
    
    if (sensor.last_reading && sensor.last_reading.value !== null) {
        let valueText = sensor.last_reading.value;
        if (sensor.unit) {
            valueText += " " + sensor.unit;
        }
        document.getElementById('modal-last-value').textContent = valueText;
    } else {
        document.getElementById('modal-last-value').textContent = "-";
    }
    
    if (sensor.last_reading && sensor.last_reading.timestamp) {
        const date = new Date(sensor.last_reading.timestamp);
        document.getElementById('modal-timestamp').textContent = date.toLocaleString();
    } else {
        document.getElementById('modal-timestamp').textContent = "-";
    }
    
    if (sensor.last_reading && sensor.last_reading.response_time_ms) {
        document.getElementById('modal-response-time').textContent = sensor.last_reading.response_time_ms.toFixed(2) + " ms";
    } else {
        document.getElementById('modal-response-time').textContent = "-";
    }
    
    if (sensor.statistics) {
        document.getElementById('modal-success-rate').textContent = sensor.statistics.success_rate + "%";
        document.getElementById('modal-error-count').textContent = sensor.statistics.error_count;
    } else {
        document.getElementById('modal-success-rate').textContent = "-";
        document.getElementById('modal-error-count').textContent = "-";
    }
    
    // Set configuration inputs
    document.getElementById('modal-input-polling').value = sensor.polling_interval || 60;
    document.getElementById('modal-input-priority').value = sensor.priority || 3;
    document.getElementById('modal-input-enabled').checked = sensor.enabled !== false;
    
    // Load MQTT history
    loadSensorMQTTHistory(sensor.name);
    
    // Show modal
    document.getElementById('sensor-details-modal').classList.remove('hidden');
}

// Load MQTT history for a sensor
function loadSensorMQTTHistory(sensorName) {
    const historyContainer = document.getElementById('modal-mqtt-history');
    historyContainer.innerHTML = '<div class="text-center py-4">Lade MQTT-Kommunikation...</div>';
    
    fetch(`/api/mqtt/history/${sensorName}?hours=24`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                historyContainer.innerHTML = `<div class="text-center py-4 text-red-600">Fehler: ${data.error}</div>`;
                return;
            }
            
            const history = data.data;
            
            if (!history.communication_flows || history.communication_flows.length === 0) {
                historyContainer.innerHTML = '<div class="text-center py-4">Keine MQTT-Kommunikation in den letzten 24 Stunden</div>';
                return;
            }
            
            // Create table
            const table = document.createElement('table');
            table.className = "min-w-full divide-y divide-gray-200";
            
            // Create header
            const thead = document.createElement('thead');
            thead.className = "bg-gray-50";
            
            const headerRow = document.createElement('tr');
            
            const headers = ["Zeit", "Initiiert von", "SET-Wert", "STATE-Wert", "Antwortzeit", "Status"];
            
            for (const header of headers) {
                const th = document.createElement('th');
                th.className = "px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
                th.textContent = header;
                headerRow.appendChild(th);
            }
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Create body
            const tbody = document.createElement('tbody');
            tbody.className = "bg-white divide-y divide-gray-200";
            
            for (const flow of history.communication_flows) {
                const row = document.createElement('tr');
                
                // Time
                const timeCell = document.createElement('td');
                timeCell.className = "px-3 py-2 whitespace-nowrap text-sm";
                const date = new Date(flow.timestamp);
                timeCell.textContent = date.toLocaleTimeString();
                row.appendChild(timeCell);
                
                // Initiated by
                const initiatorCell = document.createElement('td');
                initiatorCell.className = "px-3 py-2 whitespace-nowrap text-sm";
                initiatorCell.textContent = flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel';
                row.appendChild(initiatorCell);
                
                // SET value
                const setCell = document.createElement('td');
                setCell.className = "px-3 py-2 whitespace-nowrap text-sm";
                setCell.textContent = flow.set_value || "-";
                row.appendChild(setCell);
                
                // STATE value
                const stateCell = document.createElement('td');
                stateCell.className = "px-3 py-2 whitespace-nowrap text-sm";
                stateCell.textContent = flow.state_value || "-";
                row.appendChild(stateCell);
                
                // Response time
                const responseCell = document.createElement('td');
                responseCell.className = "px-3 py-2 whitespace-nowrap text-sm";
                responseCell.textContent = flow.response_time_ms ? flow.response_time_ms.toFixed(2) + " ms" : "-";
                row.appendChild(responseCell);
                
                // Status
                const statusCell = document.createElement('td');
                statusCell.className = "px-3 py-2 whitespace-nowrap text-sm";
                
                const statusBadge = document.createElement('span');
                statusBadge.className = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full ";
                
                if (flow.success) {
                    statusBadge.classList.add('bg-green-100', 'text-green-800');
                    statusBadge.textContent = "Erfolgreich";
                } else {
                    statusBadge.classList.add('bg-red-100', 'text-red-800');
                    statusBadge.textContent = "Fehler";
                }
                
                statusCell.appendChild(statusBadge);
                row.appendChild(statusCell);
                
                tbody.appendChild(row);
            }
            
            table.appendChild(tbody);
            
            // Clear and append table
            historyContainer.innerHTML = '';
            historyContainer.appendChild(table);
        })
        .catch(error => {
            historyContainer.innerHTML = `<div class="text-center py-4 text-red-600">Fehler beim Laden der MQTT-Kommunikation: ${error}</div>`;
        });
}

// Save sensor configuration
function saveSensorConfig() {
    const sensorName = document.getElementById('modal-sensor-name').textContent;
    
    const updates = {
        polling_interval: parseInt(document.getElementById('modal-input-polling').value),
        priority: parseInt(document.getElementById('modal-input-priority').value),
        enabled: document.getElementById('modal-input-enabled').checked
    };
    
    fetch(`/api/config/parameter/${sensorName}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Sensor-Konfiguration erfolgreich gespeichert");
                document.getElementById('sensor-details-modal').classList.add('hidden');
                loadSensorsData();
            } else {
                alert("Fehler beim Speichern der Sensor-Konfiguration: " + data.error);
            }
        })
        .catch(error => {
            alert("Fehler beim Speichern der Sensor-Konfiguration: " + error);
        });
}

// Save group configuration
function saveGroupConfig() {
    const groupName = document.getElementById('group-modal-name').textContent;
    
    const updates = {
        default_polling_interval: parseInt(document.getElementById('group-modal-polling').value),
        enabled: document.getElementById('group-modal-enabled').checked
    };
    
    fetch(`/api/config/group/${groupName}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Gruppen-Konfiguration erfolgreich gespeichert");
                document.getElementById('group-edit-modal').classList.add('hidden');
                loadConfigData();
            } else {
                alert("Fehler beim Speichern der Gruppen-Konfiguration: " + data.error);
            }
        })
        .catch(error => {
            alert("Fehler beim Speichern der Gruppen-Konfiguration: " + error);
        });
}

// Filter sensors based on selected filters
function filterSensors() {
    displaySensors();
}

// Get status text
function getStatusText(status) {
    switch (status) {
        case 'active':
            return "Aktiv";
        case 'error':
            return "Fehler";
        case 'timeout':
            return "Timeout";
        case 'crc_error':
            return "CRC Fehler";
        case 'offline':
            return "Offline";
        default:
            return "Unbekannt";
    }
}

// Load MQTT data
function loadMQTTData() {
    console.log("Loading MQTT data...");
    
    // Load MQTT stats
    fetch('/api/mqtt/stats')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("Error loading MQTT data:", data.error);
                return;
            }
            
            mqttData = data.data;
            
            // Update MQTT stats
            document.getElementById('mqtt-stats-total').textContent = mqttData.message_stats.total_messages;
            document.getElementById('mqtt-stats-hour').textContent = mqttData.message_stats.messages_last_hour;
            document.getElementById('mqtt-stats-pending').textContent = mqttData.message_stats.pending_commands;
            
            document.getElementById('mqtt-stats-conv-success').textContent = mqttData.conversion_stats.successful_conversions;
            document.getElementById('mqtt-stats-conv-failed').textContent = mqttData.conversion_stats.failed_conversions;
            document.getElementById('mqtt-stats-conv-rate').textContent = mqttData.conversion_stats.conversion_success_rate + "%";
            
            document.getElementById('mqtt-stats-flow-total').textContent = mqttData.flow_stats.total_flows;
            document.getElementById('mqtt-stats-flow-success').textContent = mqttData.flow_stats.successful_flows;
            document.getElementById('mqtt-stats-flow-rate').textContent = mqttData.flow_stats.success_rate + "%";
            document.getElementById('mqtt-stats-flow-time').textContent = mqttData.flow_stats.avg_response_time_ms + " ms";
            
            // Update recent errors
            updateMQTTRecentErrors(mqttData.recent_errors);
        })
        .catch(error => {
            console.error("Error loading MQTT data:", error);
        });
    
    // Load sensors for MQTT filter
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("Error loading sensors for MQTT filter:", data.error);
                return;
            }
            
            const sensorFilter = document.getElementById('mqtt-sensor-filter');
            sensorFilter.innerHTML = '<option value="">Sensor auswählen...</option>';
            
            const sensors = [];
            
            // Collect all sensors
            for (const groupName in data.data.groups) {
                for (const sensor of data.data.groups[groupName].sensors) {
                    sensors.push(sensor);
                }
            }
            
            // Sort by name
            sensors.sort((a, b) => a.name.localeCompare(b.name));
            
            // Add to filter
            for (const sensor of sensors) {
                const option = document.createElement('option');
                option.value = sensor.name;
                option.textContent = sensor.name;
                sensorFilter.appendChild(option);
            }
        })
        .catch(error => {
            console.error("Error loading sensors for MQTT filter:", error);
        });
}

// Update MQTT recent errors
function updateMQTTRecentErrors(errors) {
    const container = document.getElementById('mqtt-recent-errors');
    container.innerHTML = '';
    
    if (!errors || errors.length === 0) {
        const message = document.createElement('div');
        message.className = "p-4 bg-green-50 rounded-lg";
        message.textContent = "Keine aktuellen MQTT-Fehler";
        container.appendChild(message);
        return;
    }
    
    for (const error of errors) {
        const errorCard = document.createElement('div');
        errorCard.className = "p-4 bg-red-50 rounded-lg";
        
        const header = document.createElement('div');
        header.className = "flex justify-between items-center mb-2";
        
        const title = document.createElement('h4');
        title.className = "font-semibold text-red-800";
        title.textContent = error.type.replace('_', ' ').toUpperCase();
        
        const time = document.createElement('span');
        time.className = "text-sm text-gray-500";
        const date = new Date(error.timestamp);
        time.textContent = date.toLocaleTimeString();
        
        header.appendChild(title);
        header.appendChild(time);
        
        const message = document.createElement('p');
        message.className = "text-sm text-red-700";
        message.textContent = error.message;
        
        const details = document.createElement('p');
        details.className = "text-xs text-gray-600 mt-1";
        details.textContent = `Sensor: ${error.sensor}, Details: ${error.details}`;
        
        errorCard.appendChild(header);
        errorCard.appendChild(message);
        errorCard.appendChild(details);
        
        container.appendChild(errorCard);
    }
}

// Load MQTT history for a specific sensor
function loadMQTTHistory() {
    const sensorName = document.getElementById('mqtt-sensor-filter').value;
    
    if (!sensorName) {
        alert("Bitte wählen Sie einen Sensor aus");
        return;
    }
    
    const historyContainer = document.getElementById('mqtt-history-container');
    historyContainer.innerHTML = '<div class="text-center py-4">Lade MQTT-Kommunikation...</div>';
    
    fetch(`/api/mqtt/history/${sensorName}?hours=24`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                historyContainer.innerHTML = `<div class="text-center py-4 text-red-600">Fehler: ${data.error}</div>`;
                return;
            }
            
            const history = data.data;
            
            if (!history.communication_flows || history.communication_flows.length === 0) {
                historyContainer.innerHTML = '<div class="text-center py-4">Keine MQTT-Kommunikation in den letzten 24 Stunden</div>';
                return;
            }
            
            // Create table
            const table = document.createElement('table');
            table.className = "min-w-full divide-y divide-gray-200";
            
            // Create header
            const thead = document.createElement('thead');
            thead.className = "bg-gray-50";
            
            const headerRow = document.createElement('tr');
            
            const headers = ["Zeitstempel", "Typ", "Initiiert von", "SET-Wert", "STATE-Wert", "Antwortzeit", "Status"];
            
            for (const header of headers) {
                const th = document.createElement('th');
                th.className = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
                th.textContent = header;
                headerRow.appendChild(th);
            }
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Create body
            const tbody = document.createElement('tbody');
            tbody.className = "bg-white divide-y divide-gray-200";
            
            for (const flow of history.communication_flows) {
                const row = document.createElement('tr');
                
                // Timestamp
                const timeCell = document.createElement('td');
                timeCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                const date = new Date(flow.timestamp);
                timeCell.textContent = date.toLocaleString();
                row.appendChild(timeCell);
                
                // Type
                const typeCell = document.createElement('td');
                typeCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                typeCell.textContent = flow.initiated_by === 'home_assistant' ? 'SET → STATE' : 'STATE';
                row.appendChild(typeCell);
                
                // Initiated by
                const initiatorCell = document.createElement('td');
                initiatorCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                initiatorCell.textContent = flow.initiated_by === 'home_assistant' ? 'Home Assistant' : 'EHS-Sentinel';
                row.appendChild(initiatorCell);
                
                // SET value
                const setCell = document.createElement('td');
                setCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                setCell.textContent = flow.set_value || "-";
                row.appendChild(setCell);
                
                // STATE value
                const stateCell = document.createElement('td');
                stateCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                stateCell.textContent = flow.state_value || "-";
                row.appendChild(stateCell);
                
                // Response time
                const responseCell = document.createElement('td');
                responseCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                responseCell.textContent = flow.response_time_ms ? flow.response_time_ms.toFixed(2) + " ms" : "-";
                row.appendChild(responseCell);
                
                // Status
                const statusCell = document.createElement('td');
                statusCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                
                const statusBadge = document.createElement('span');
                statusBadge.className = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full ";
                
                if (flow.success) {
                    statusBadge.classList.add('bg-green-100', 'text-green-800');
                    statusBadge.textContent = "Erfolgreich";
                } else {
                    statusBadge.classList.add('bg-red-100', 'text-red-800');
                    statusBadge.textContent = flow.error_message || "Fehler";
                }
                
                statusCell.appendChild(statusBadge);
                row.appendChild(statusCell);
                
                tbody.appendChild(row);
            }
            
            table.appendChild(tbody);
            
            // Clear and append table
            historyContainer.innerHTML = '';
            historyContainer.appendChild(table);
        })
        .catch(error => {
            historyContainer.innerHTML = `<div class="text-center py-4 text-red-600">Fehler beim Laden der MQTT-Kommunikation: ${error}</div>`;
        });
}

// Load logs data
function loadLogsData() {
    console.log("Loading logs data...");
    
    // Load log stats
    fetch('/api/logs/stats')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("Error loading log stats:", data.error);
                return;
            }
            
            logsData.stats = data.data;
            
            // Update log stats display
            updateLogStatsDisplay(logsData.stats);
        })
        .catch(error => {
            console.error("Error loading log stats:", error);
        });
    
    // Load sensors for log filter
    fetch('/api/sensors/status')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("Error loading sensors for log filter:", data.error);
                return;
            }
            
            const sensorFilter = document.getElementById('log-filter-sensor');
            sensorFilter.innerHTML = '<option value="">Alle Sensoren</option>';
            
            const sensors = [];
            
            // Collect all sensors
            for (const groupName in data.data.groups) {
                for (const sensor of data.data.groups[groupName].sensors) {
                    sensors.push(sensor);
                }
            }
            
            // Sort by name
            sensors.sort((a, b) => a.name.localeCompare(b.name));
            
            // Add to filter
            for (const sensor of sensors) {
                const option = document.createElement('option');
                option.value = sensor.name;
                option.textContent = sensor.name;
                sensorFilter.appendChild(option);
            }
        })
        .catch(error => {
            console.error("Error loading sensors for log filter:", error);
        });
    
    // Load log entries
    loadLogEntries();
}

// Load log entries
function loadLogEntries(filters = {}, limit = 50) {
    const tableBody = document.getElementById('log-entries-table');
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Lade Log-Einträge...</td></tr>';
    
    // Build query string
    let queryParams = new URLSearchParams();
    queryParams.append('limit', limit);
    
    for (const [key, value] of Object.entries(filters)) {
        if (value) {
            queryParams.append(key, value);
        }
    }
    
    fetch(`/api/logs?${queryParams.toString()}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-600">Fehler: ${data.error}</td></tr>`;
                return;
            }
            
            const logs = data.data.logs;
            
            if (logs.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Keine Log-Einträge gefunden</td></tr>';
                return;
            }
            
            // Store logs in logsData
            logsData.entries = logs;
            logsData.filters = filters;
            logsData.total = data.data.total_returned;
            
            // Clear table
            tableBody.innerHTML = '';
            
            // Add log entries
            for (const log of logs) {
                const row = document.createElement('tr');
                
                // Timestamp
                const timeCell = document.createElement('td');
                timeCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                const date = new Date(log.timestamp);
                timeCell.textContent = date.toLocaleString();
                row.appendChild(timeCell);
                
                // Level
                const levelCell = document.createElement('td');
                levelCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                
                const levelBadge = document.createElement('span');
                levelBadge.className = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full ";
                
                switch (log.level) {
                    case 'DEBUG':
                        levelBadge.classList.add('bg-gray-100', 'text-gray-800');
                        break;
                    case 'INFO':
                        levelBadge.classList.add('bg-blue-100', 'text-blue-800');
                        break;
                    case 'WARNING':
                        levelBadge.classList.add('bg-yellow-100', 'text-yellow-800');
                        break;
                    case 'ERROR':
                        levelBadge.classList.add('bg-red-100', 'text-red-800');
                        break;
                    case 'CRITICAL':
                        levelBadge.classList.add('bg-purple-100', 'text-purple-800');
                        break;
                    default:
                        levelBadge.classList.add('bg-gray-100', 'text-gray-800');
                }
                
                levelBadge.textContent = log.level;
                
                levelCell.appendChild(levelBadge);
                row.appendChild(levelCell);
                
                // Category
                const categoryCell = document.createElement('td');
                categoryCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                categoryCell.textContent = log.category;
                row.appendChild(categoryCell);
                
                // Sensor
                const sensorCell = document.createElement('td');
                sensorCell.className = "px-6 py-4 whitespace-nowrap text-sm";
                sensorCell.textContent = log.sensor_name || "-";
                row.appendChild(sensorCell);
                
                // Message
                const messageCell = document.createElement('td');
                messageCell.className = "px-6 py-4 text-sm";
                messageCell.textContent = log.message;
                row.appendChild(messageCell);
                
                // Details
                const detailsCell = document.createElement('td');
                detailsCell.className = "px-6 py-4 text-sm";
                
                if (log.details && Object.keys(log.details).length > 0) {
                    const detailsButton = document.createElement('button');
                    detailsButton.className = "text-indigo-600 hover:text-indigo-900";
                    detailsButton.textContent = "Details anzeigen";
                    detailsButton.addEventListener('click', function() {
                        alert(JSON.stringify(log.details, null, 2));
                    });
                    
                    detailsCell.appendChild(detailsButton);
                } else {
                    detailsCell.textContent = "-";
                }
                
                row.appendChild(detailsCell);
                
                tableBody.appendChild(row);
            }
        })
        .catch(error => {
            console.error("Error loading logs:", error);
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-red-600">Fehler beim Laden der Log-Einträge: ${error}</td></tr>`;
        });
}

// Update log stats display
function updateLogStatsDisplay(stats) {
    // Level stats
    const levelStatsContainer = document.getElementById('log-stats-level');
    levelStatsContainer.innerHTML = '';
    
    for (const [level, count] of Object.entries(stats.level_breakdown)) {
        const levelItem = document.createElement('div');
        levelItem.className = "flex justify-between";
        
        const levelName = document.createElement('span');
        levelName.textContent = level;
        
        const levelCount = document.createElement('span');
        const percentage = stats.total_entries > 0 ? (count / stats.total_entries * 100).toFixed(1) : 0;
        levelCount.textContent = `${count} (${percentage}%)`;
        
        levelItem.appendChild(levelName);
        levelItem.appendChild(levelCount);
        
        levelStatsContainer.appendChild(levelItem);
    }
    
    // Category stats
    const categoryStatsContainer = document.getElementById('log-stats-category');
    categoryStatsContainer.innerHTML = '';
    
    for (const [category, count] of Object.entries(stats.category_breakdown)) {
        const categoryItem = document.createElement('div');
        categoryItem.className = "flex justify-between";
        
        const categoryName = document.createElement('span');
        categoryName.textContent = category;
        
        const categoryCount = document.createElement('span');
        const percentage = stats.total_entries > 0 ? (count / stats.total_entries * 100).toFixed(1) : 0;
        categoryCount.textContent = `${count} (${percentage}%)`;
        
        categoryItem.appendChild(categoryName);
        categoryItem.appendChild(categoryCount);
        
        categoryStatsContainer.appendChild(categoryItem);
    }
    
    // Sensor stats
    const sensorStatsContainer = document.getElementById('log-stats-sensors');
    sensorStatsContainer.innerHTML = '';
    
    // Convert to array and sort by errors
    const sensorStats = [];
    for (const [sensor, data] of Object.entries(stats.sensor_breakdown)) {
        sensorStats.push({
            name: sensor,
            total: data.total,
            errors: data.errors
        });
    }
    
    sensorStats.sort((a, b) => b.errors - a.errors);
    
    // Display top 5 sensors with errors
    const topSensors = sensorStats.filter(s => s.errors > 0).slice(0, 5);
    
    if (topSensors.length === 0) {
        sensorStatsContainer.innerHTML = '<div class="text-center py-2">Keine Sensoren mit Fehlern</div>';
    } else {
        for (const sensor of topSensors) {
            const sensorItem = document.createElement('div');
            sensorItem.className = "flex justify-between";
            
            const sensorName = document.createElement('span');
            sensorName.textContent = sensor.name;
            
            const sensorCount = document.createElement('span');
            const percentage = sensor.total > 0 ? (sensor.errors / sensor.total * 100).toFixed(1) : 0;
            sensorCount.textContent = `${sensor.errors} (${percentage}%)`;
            
            sensorItem.appendChild(sensorName);
            sensorItem.appendChild(sensorCount);
            
            sensorStatsContainer.appendChild(sensorItem);
        }
    }
}

// Apply log filters
function applyLogFilters() {
    const filters = {
        level: document.getElementById('log-filter-level').value,
        category: document.getElementById('log-filter-category').value,
        sensor_name: document.getElementById('log-filter-sensor').value,
        start_time: document.getElementById('log-filter-start').value,
        end_time: document.getElementById('log-filter-end').value,
        errors_only: document.getElementById('log-filter-errors').checked
    };
    
    loadLogEntries(filters);
}

// Load more logs
function loadMoreLogs() {
    if (!logsData.entries) {
        return;
    }
    
    const currentLimit = logsData.entries.length;
    const newLimit = currentLimit + 50;
    
    loadLogEntries(logsData.filters, newLimit);
}

// Export logs
function exportLogs() {
    // Get current filters
    const filters = logsData.filters || {};
    
    // Build query string
    let queryParams = new URLSearchParams();
    
    for (const [key, value] of Object.entries(filters)) {
        if (value) {
            queryParams.append(key, value);
        }
    }
    
    // Add format
    queryParams.append('format', 'json');
    
    // Open export URL in new tab
    window.open(`/api/logs/export?${queryParams.toString()}`);
}

// Load configuration data
function loadConfigData() {
    console.log("Loading configuration data...");
    
    fetch('/api/config/ui')
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error("Error loading configuration:", data.error);
                return;
            }
            
            configData = data.data;
            
            // Display group configuration
            displayGroupConfig();
            
            // Display parameter configuration
            displayParameterConfig();
            
            // Populate group filter
            const groupFilter = document.getElementById('config-group-filter');
            groupFilter.innerHTML = '<option value="all">Alle Gruppen</option>';
            
            for (const groupName in configData.groups) {
                const option = document.createElement('option');
                option.value = groupName;
                option.textContent = configData.groups[groupName].display_name;
                groupFilter.appendChild(option);
            }
        })
        .catch(error => {
            console.error("Error loading configuration:", error);
        });
}

// Display group configuration
function displayGroupConfig() {
    const tableBody = document.getElementById('group-config-table');
    tableBody.innerHTML = '';
    
    for (const groupName in configData.groups) {
        const group = configData.groups[groupName];
        
        const row = document.createElement('tr');
        
        // Group name
        const nameCell = document.createElement('td');
        nameCell.className = "px-6 py-4 whitespace-nowrap";
        nameCell.textContent = groupName;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = "px-6 py-4 whitespace-nowrap";
        descCell.textContent = group.description;
        row.appendChild(descCell);
        
        // Priority
        const priorityCell = document.createElement('td');
        priorityCell.className = "px-6 py-4 whitespace-nowrap";
        priorityCell.textContent = group.priority;
        row.appendChild(priorityCell);
        
        // Polling interval
        const pollingCell = document.createElement('td');
        pollingCell.className = "px-6 py-4 whitespace-nowrap";
        pollingCell.textContent = group.default_polling_interval + "s";
        row.appendChild(pollingCell);
        
        // Sensor count
        const sensorCell = document.createElement('td');
        sensorCell.className = "px-6 py-4 whitespace-nowrap";
        sensorCell.textContent = group.parameter_count;
        row.appendChild(sensorCell);
        
        // Status
        const statusCell = document.createElement('td');
        statusCell.className = "px-6 py-4 whitespace-nowrap";
        
        const statusBadge = document.createElement('span');
        statusBadge.className = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full ";
        
        if (group.enabled) {
            statusBadge.classList.add('bg-green-100', 'text-green-800');
            statusBadge.textContent = "Aktiviert";
        } else {
            statusBadge.classList.add('bg-red-100', 'text-red-800');
            statusBadge.textContent = "Deaktiviert";
        }
        
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = "px-6 py-4 whitespace-nowrap text-right text-sm font-medium";
        
        const editButton = document.createElement('button');
        editButton.className = "text-indigo-600 hover:text-indigo-900";
        editButton.textContent = "Bearbeiten";
        editButton.addEventListener('click', function() {
            showGroupEditModal(groupName, group);
        });
        
        actionsCell.appendChild(editButton);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    }
}

// Show group edit modal
function showGroupEditModal(groupName, group) {
    document.getElementById('group-modal-name').textContent = groupName;
    document.getElementById('group-modal-polling').value = group.default_polling_interval;
    document.getElementById('group-modal-enabled').checked = group.enabled;
    
    document.getElementById('group-edit-modal').classList.remove('hidden');
}

// Display parameter configuration
function displayParameterConfig() {
    const tableBody = document.getElementById('parameter-config-table');
    tableBody.innerHTML = '';
    
    const groupFilter = document.getElementById('config-group-filter').value;
    
    for (const paramName in configData.parameters) {
        const param = configData.parameters[paramName];
        
        // Apply group filter
        if (groupFilter !== 'all' && param.group !== groupFilter) {
            continue;
        }
        
        const row = document.createElement('tr');
        
        // Parameter name
        const nameCell = document.createElement('td');
        nameCell.className = "px-6 py-4 whitespace-nowrap";
        nameCell.textContent = paramName;
        row.appendChild(nameCell);
        
        // Description
        const descCell = document.createElement('td');
        descCell.className = "px-6 py-4 whitespace-nowrap";
        descCell.textContent = param.display_name;
        row.appendChild(descCell);
        
        // Type
        const typeCell = document.createElement('td');
        typeCell.className = "px-6 py-4 whitespace-nowrap";
        typeCell.textContent = param.type;
        row.appendChild(typeCell);
        
        // Group
        const groupCell = document.createElement('td');
        groupCell.className = "px-6 py-4 whitespace-nowrap";
        groupCell.textContent = param.group;
        row.appendChild(groupCell);
        
        // Polling interval
        const pollingCell = document.createElement('td');
        pollingCell.className = "px-6 py-4 whitespace-nowrap";
        pollingCell.textContent = param.polling_interval + "s";
        row.appendChild(pollingCell);
        
        // Priority
        const priorityCell = document.createElement('td');
        priorityCell.className = "px-6 py-4 whitespace-nowrap";
        priorityCell.textContent = param.priority;
        row.appendChild(priorityCell);
        
        // Enabled
        const enabledCell = document.createElement('td');
        enabledCell.className = "px-6 py-4 whitespace-nowrap";
        
        const enabledBadge = document.createElement('span');
        enabledBadge.className = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full ";
        
        if (param.enabled) {
            enabledBadge.classList.add('bg-green-100', 'text-green-800');
            enabledBadge.textContent = "Ja";
        } else {
            enabledBadge.classList.add('bg-red-100', 'text-red-800');
            enabledBadge.textContent = "Nein";
        }
        
        enabledCell.appendChild(enabledBadge);
        row.appendChild(enabledCell);
        
        // Actions
        const actionsCell = document.createElement('td');
        actionsCell.className = "px-6 py-4 whitespace-nowrap text-right text-sm font-medium";
        
        const editButton = document.createElement('button');
        editButton.className = "text-indigo-600 hover:text-indigo-900";
        editButton.textContent = "Bearbeiten";
        editButton.addEventListener('click', function() {
            showSensorDetails({
                name: paramName,
                description: param.display_name,
                group: param.group,
                priority: param.priority,
                polling_interval: param.polling_interval,
                enabled: param.enabled,
                writable: param.writable,
                nasa_address: param.nasa_address,
                hass_entity_id: param.hass_entity_id,
                unit: param.unit,
                status: 'unknown'
            });
        });
        
        actionsCell.appendChild(editButton);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    }
}

// Filter configuration parameters
function filterConfigParams() {
    displayParameterConfig();
}

// Load documentation
function loadDocumentation() {
    console.log("Loading documentation...");
    
    // Load MQTT documentation by default
    loadSpecificDocumentation('mqtt');
}

// Load specific documentation
function loadSpecificDocumentation(docType) {
    fetch(`/api/documentation/${docType}`)
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                console.error(`Error loading ${docType} documentation:`, data.error);
                return;
            }
            
            // Store documentation
            docData[docType] = data.data;
            
            // Display documentation
            const container = document.getElementById(`${docType}-doc-content`);
            
            if (data.data.format === 'markdown') {
                container.innerHTML = marked.parse(data.data.content);
            } else {
                container.textContent = data.data.content;
            }
        })
        .catch(error => {
            console.error(`Error loading ${docType} documentation:`, error);
        });
}

// Generate complete documentation
function generateDocumentation() {
    fetch('/api/documentation/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            output_dir: '/data/documentation'
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Dokumentation erfolgreich generiert");
                
                // Reload documentation
                loadDocumentation();
            } else {
                alert("Fehler beim Generieren der Dokumentation: " + data.error);
            }
        })
        .catch(error => {
            alert("Fehler beim Generieren der Dokumentation: " + error);
        });
}